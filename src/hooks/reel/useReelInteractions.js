/**
 * useReelInteractions Hook
 * Encapsulates user interaction logic: like, comment, share, report
 */

import { useCallback, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics } from '@segment/analytics-react-native';
import { Linking } from 'react-native';
import request from '../../api/request';
import { StackNav } from '../../navigation/NavigationKeys';
import { generateShareableLink } from '../../utils/mediaUtils';

/**
 * Custom hook for managing reel user interactions
 * 
 * @param {Object} options - Hook options
 * @param {Object} options.item - The reel item data
 * @param {Object} options.likeRef - Reference for like callbacks
 * @param {number} options.index - The index of this item in the list
 * @param {Object} options.commentSheetRef - Reference to comment sheet
 * @param {Function} options.setSelectedPostId - Setter for selected post ID
 * @param {Function} options.setIsCommentOpen - Setter for comment open state
 * @param {Object} options.userData - Current user data (for analytics)
 * @returns {Object} Interaction state and handlers
 */
const useReelInteractions = ({
    item,
    likeRef,
    index,
    commentSheetRef,
    setSelectedPostId,
    setIsCommentOpen,
    userData,
}) => {
    const navigation = useNavigation();
    const { track } = useAnalytics();

    // Like animation state
    const [isLike, setIsLike] = useState(false);

    // Share modal state
    const [shareItem, setShareItem] = useState(null);
    const shareSheetRef = useRef(null);

    // Mutations
    const addLikeMutation = useMutation((postId) =>
        request.post(`/like/${postId}`)
    );
    const removeLikeMutation = useMutation((postId) =>
        request.delete(`/like/${postId}`)
    );

    /**
     * Handle like button press
     */
    const onPressLike = useCallback((id, isLiked) => {
        if (!isLiked) {
            setIsLike(true);
            setTimeout(() => {
                setIsLike(false);
            }, 1000);
            addLikeMutation.mutate(id);
        } else {
            removeLikeMutation.mutate(id);
        }
        // NOTE: Removed story invalidations - likes are optimistic and don't need feed refetch
    }, [addLikeMutation, removeLikeMutation]);

    /**
     * Handle double tap to like
     */
    const handleDoubleTap = useCallback(() => {
        likeRef?.current?.[index]?.(item?._id);
    }, [likeRef, index, item?._id]);

    /**
     * Handle comment button press
     */
    const onPressComment = useCallback(() => {
        setSelectedPostId?.(item?._id);
        setIsCommentOpen?.(true);
        commentSheetRef?.current?.show?.();
    }, [item?._id, setSelectedPostId, setIsCommentOpen, commentSheetRef]);

    /**
     * Handle report button press
     */
    const onPressReport = useCallback(() => {
        navigation.navigate(StackNav.Report, {
            storyId: item?._id,
        });
    }, [navigation, item?._id]);

    /**
     * Handle share button press
     */
    const handleShare = useCallback(async (postItem) => {
        setShareItem(postItem);
        shareSheetRef.current?.show?.();
    }, []);

    /**
     * Handle contact/WhatsApp button press
     */
    const handleContactPress = useCallback(async () => {
        const link = await generateShareableLink(item);
        const withCoupon = item?.author?.discount
            ? 'with coupon ' + item?.author?.discount?.coupon
            : '';

        await track('contactButton', {
            userId: userData?._id,
            itemId: item?._id,
            title: item?.title,
            description: item?.caption,
            link: item?.linkToGo || item?.author?.phone,
        });

        if (item?.linkToGo) {
            const url = item.linkToGo.includes('http') || item.linkToGo.toLowerCase().includes('www')
                ? item.linkToGo
                : 'https://' + item.linkToGo;
            Linking.openURL(url);
        } else {
            Linking.openURL(
                'whatsapp://send?text=' +
                'Hi, I am redirected from food2k.com, and I want to ask about: ' +
                item?.title +
                ' ' +
                withCoupon +
                '\n' +
                link +
                '\n' +
                '&phone=2' +
                item?.author?.phone
            );
        }
    }, [item, userData, track]);

    return {
        // State
        isLike,
        shareItem,
        shareSheetRef,

        // Mutations
        addLikeMutation,
        removeLikeMutation,

        // Handlers
        onPressLike,
        handleDoubleTap,
        onPressComment,
        onPressReport,
        handleShare,
        handleContactPress,
        setIsLike,
    };
};

export default useReelInteractions;
