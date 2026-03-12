/**
 * ReelRestaurantBadge Component
 * Restaurant info badge for review reels with navigation
 */

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../common/ZText';
import FollowButton from '../common/FollowButton';
import { moderateScale } from '../../common/constants';
import { restaurantBadgeStyles as styles } from './styles';

/**
 * Props for ReelRestaurantBadge
 * @typedef {Object} ReelRestaurantBadgeProps
 * @property {Object} item - The reel item data
 * @property {string} currentUserId - Current logged-in user ID
 * @property {boolean} isReview - Whether this is a review reel
 * @property {string} restaurantName - Restaurant or chef name
 * @property {string} restaurantAddress - Restaurant address
 * @property {boolean} isInternalRestaurant - Whether it's an internal chef
 * @property {Function} onPress - Handler for badge press
 */

const ReelRestaurantBadge = React.memo(({
    item,
    currentUserId,
    isReview,
    restaurantName,
    restaurantAddress,
    isInternalRestaurant,
    onPress,
}) => {
    // Only show for review reels with restaurant info
    if (!isReview || !restaurantName) {
        return null;
    }

    // Filter out Google Plus Codes (contain '+') and extract short address
    const shortAddress = restaurantAddress?.includes('+') ? null : restaurantAddress?.split(',')[0];

    // Check if we should show follow button for reviewed chef
    const showFollowButton = item?.reviewedChef?._id && item?.reviewedChef?._id !== currentUserId;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: moderateScale(6) }}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.container}
            >
                {/* Location Icon */}
                <Ionicons
                    name="location"
                    size={moderateScale(12)}
                    color="#FF4B4B"
                    style={styles.icon}
                />

                {/* Restaurant Info */}
                <View style={styles.textContainer}>
                    <ZText style={styles.name} numberOfLines={1}>
                        {restaurantName}
                    </ZText>
                    {shortAddress && (
                        <ZText style={styles.address} numberOfLines={1}>
                            {shortAddress}
                        </ZText>
                    )}
                </View>

                {/* Navigation Arrow */}
                <Ionicons
                    name={isInternalRestaurant ? 'chevron-forward' : 'open-outline'}
                    size={moderateScale(14)}
                    color="rgba(255,255,255,0.7)"
                    style={styles.arrow}
                />
            </TouchableOpacity>

            {/* Follow Button - Heart icon for restaurant */}
            {showFollowButton && (
                <FollowButton
                    userId={item.reviewedChef._id}
                    isFollowed={item.reviewedChef.currentUserFollowed}
                    compact={true}
                    size="icon"
                />
            )}
        </View>
    );
});

ReelRestaurantBadge.displayName = 'ReelRestaurantBadge';

export default ReelRestaurantBadge;
