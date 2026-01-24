/**
 * useReelNavigation Hook
 * Encapsulates navigation logic: profile navigation, restaurant navigation, Google Maps linking
 */

import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNav, TabNav } from '../../navigation/NavigationKeys';

/**
 * Custom hook for managing reel navigation actions
 * 
 * @param {Object} options - Hook options
 * @param {Object} options.item - The reel item data
 * @param {string} options.currentUserId - Current logged-in user ID
 * @returns {Object} Navigation handlers
 */
const useReelNavigation = ({ item, currentUserId }) => {
    const navigation = useNavigation();

    /**
     * Navigate to the author's profile
     * - If it's the current user, go to Profile tab
     * - If it's a chef, go to ChefMenu
     * - Otherwise, go to ProfileDetail
     */
    const navigateToProfile = useCallback(() => {
        const authorId = item?.author?._id;
        const authorType = item?.author?.type;
        const userName = item?.channelName || item?.author?.fullName;
        const userImage = item?.avatarUri;

        if (authorId === currentUserId) {
            navigation.navigate(TabNav.Profile);
        } else if (authorType === 'chef') {
            navigation.navigate(StackNav.ChefMenu, {
                chefId: authorId,
                chefName: userName,
            });
        } else {
            navigation.navigate(StackNav.ProfileDetail, {
                userName: userName,
                userImage: userImage,
                id: authorId,
            });
        }
    }, [item, currentUserId, navigation]);

    /**
     * Navigate to the reviewed place
     * - If registered chef, go to ChefMenu
     * - If external restaurant (Google Place ID), open Google Maps
     * - Fallback: open address in Google Maps
     */
    const navigateToReviewedPlace = useCallback(() => {
        if (item?.reviewedChef?._id) {
            // Registered chef - navigate to their menu
            navigation.navigate(StackNav.ChefMenu, {
                chefId: item.reviewedChef._id,
                chefName: item.reviewedChef.fullName || item.restaurantName,
            });
        } else if (item?.googlePlaceId) {
            // External restaurant with Google Place ID - open in Google Maps
            const restaurantName = encodeURIComponent(item?.restaurantName || 'Restaurant');
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurantName}&query_place_id=${item.googlePlaceId}`;
            Linking.openURL(mapsUrl).catch((err) => {
                if (__DEV__) {
                    console.log('Failed to open Google Maps:', err);
                }
            });
        } else if (item?.restaurantAddress) {
            // Fallback: open address in Google Maps
            const encodedAddress = encodeURIComponent(item.restaurantAddress);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            Linking.openURL(mapsUrl).catch((err) => {
                if (__DEV__) {
                    console.log('Failed to open Google Maps:', err);
                }
            });
        }
    }, [item, navigation]);

    /**
     * Navigate to chef menu from Visit Menu button
     */
    const navigateToChefMenu = useCallback(() => {
        navigation.navigate(StackNav.ChefMenu, {
            chefId: item?.author?._id,
            chefName: item?.author?.fullName,
        });
    }, [navigation, item?.author]);

    /**
     * Check if the author is the current user
     */
    const isOwnPost = item?.author?._id === currentUserId;

    /**
     * Check if the reviewed chef is the current user
     */
    const isOwnReviewedChef = item?.reviewedChef?._id === currentUserId;

    /**
     * Determine if this is a review reel
     */
    const isReview = item?.reviewMode || item?.isReview || item?.author?.type !== 'chef';

    /**
     * Determine if this is a chef post (shows Visit Menu button)
     */
    const isChefPost = item?.author?.type === 'chef' || item?.author?.hasMenu === true;

    /**
     * Get the restaurant/place name for reviews
     */
    const restaurantName = item?.restaurantName || item?.reviewedChef?.fullName;

    /**
     * Get the restaurant address for reviews
     */
    const restaurantAddress = item?.restaurantAddress ||
        (item?.reviewedChef?.locations && item?.reviewedChef?.locations[0]?.address);

    /**
     * Check if restaurant badge should show an internal navigation arrow or external link
     */
    const isInternalRestaurant = !!item?.reviewedChef?._id;

    return {
        // Handlers
        navigateToProfile,
        navigateToReviewedPlace,
        navigateToChefMenu,

        // Computed flags
        isOwnPost,
        isOwnReviewedChef,
        isReview,
        isChefPost,
        isInternalRestaurant,

        // Derived data
        restaurantName,
        restaurantAddress,
    };
};

export default useReelNavigation;
