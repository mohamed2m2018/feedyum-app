/**
 * ReelItem Component
 * Main orchestrator that composes all reel sub-components and hooks
 * Replaces the monolithic ReelComponent
 */

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import DoubleClick from 'react-native-double-tap';
import request from '../../api/request';
import { styles } from '../../themes';
import strings from '../../i18n/strings';
import ZButton from '../common/ZButton';
import VideoSeeker from '../common/VideoSeeker';
import ImageZoomModal from '../common/ImageZoomModal';
import ShareOptionsSheet from '../models/ShareOptionsSheet';

// Hooks
import { useReelPlayback, useReelInteractions, useReelNavigation } from '../../hooks/reel';

// Sub-components
import ReelMediaPlayer from './ReelMediaPlayer';
import ReelOverlay from './ReelOverlay';
import ReelAuthorInfo from './ReelAuthorInfo';
import ReelReviewBadge from './ReelReviewBadge';
import ReelRestaurantBadge from './ReelRestaurantBadge';
import ReelActionBar from './ReelActionBar';
import ReelCaption from './ReelCaption';
import ReelDishesDisplay from './ReelDishesDisplay';
import ReelPauseIndicator from './ReelPauseIndicator';
import ReelLikeAnimation from './ReelLikeAnimation';
import ReelReviewRating from './ReelReviewRating';

// Styles
import { reelItemStyles, kmAwayStyles, authorInfoStyles, visitMenuStyles } from './styles';

/**
 * Props for ReelItem
 * @typedef {Object} ReelItemProps
 * @property {Object} item - The reel item data
 * @property {number} layoutHeight - Height for the item container
 * @property {number} i - Alias for index (backward compatibility)
 * @property {Object} data - User data (backward compatibility)
 * @property {number} activeVideoIndex - Currently active video index
 * @property {Object} likeRef - Reference for like callbacks
 * @property {Object} flatListRef - Reference to the FlatList
 * @property {boolean} isFromReelsOne - Whether rendered from ReelsComponentOne
 * @property {Function} setSelectedPostId - Setter for selected post ID
 * @property {Object} commentSheetRef - Reference to comment sheet
 * @property {boolean} isFocused - Whether the screen is focused
 * @property {boolean} isCommentOpen - Whether comment sheet is open
 * @property {boolean} isLocationOpen - Whether location sheet is open
 * @property {Function} setIsCommentOpen - Setter for comment open state
 * @property {Function} onPressAvailableLocation - Handler for location press
 * @property {string} currentUserId - Current user ID (passed from parent)
 */

const ReelItem = React.memo(({
    item,
    layoutHeight,
    i: index,
    data,
    activeVideoIndex,
    likeRef,
    flatListRef,
    isFromReelsOne,
    setSelectedPostId,
    commentSheetRef,
    isFocused,
    isCommentOpen = false,
    isLocationOpen = false,
    setIsCommentOpen,
    onPressAvailableLocation,
    currentUserId,
}) => {
    const colors = useSelector((state) => state.theme.theme);

    // Local UI state
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const [showImageZoom, setShowImageZoom] = useState(false);

    // Custom Hooks
    const playback = useReelPlayback({
        item,
        index,
        activeVideoIndex,
        isFocused,
        isCommentOpen,
        isLocationOpen,
        showImageZoom,
        flatListRef,
    });

    const interactions = useReelInteractions({
        item,
        likeRef,
        index,
        commentSheetRef,
        setSelectedPostId,
        setIsCommentOpen,
        userData: data,
    });

    const navigation = useReelNavigation({
        item,
        currentUserId,
    });

    // Comments count query (preserved as requested)
    const fetchCommentsCount = async () => {
        const response = await request.get(`/comment/count?post_id=${item?._id}`);
        return response.data;
    };

    const { data: commentsCount } = useQuery(
        ['commentsCount' + item?._id],
        () => fetchCommentsCount(item?._id),
        {
            enabled: item?._id !== undefined && index === activeVideoIndex,
        }
    );

    // Handlers
    const handleSingleTap = useCallback(() => {
        playback.togglePause();
    }, [playback]);

    const handleLongPress = useCallback(() => {
        if (item?.avatarUri) {
            setShowImageZoom(true);
        } else {
            setIsOverlayVisible(false);
        }
    }, [item?.avatarUri]);

    const handlePressOut = useCallback(() => {
        setIsOverlayVisible(true);
    }, []);

    // Skip rendering for ad type (ads are deprecated)
    if (item?.type === 'ad') {
        return null;
    }

    return (
        <View style={[reelItemStyles.container, { height: layoutHeight }]}>
            <View style={[reelItemStyles.innerContainer, { backgroundColor: colors.backgroundColor }]}>
                <DoubleClick
                    singleTap={handleSingleTap}
                    doubleTap={interactions.handleDoubleTap}
                    onPressOut={handlePressOut}
                    onLongPress={handleLongPress}
                >
                    {/* Review Badge - Top Corner */}
                    <ReelReviewBadge isReview={navigation.isReview} />

                    {/* KM Away / Branches Button - For Chefs */}
                    {item?.author?.type === 'chef' && (
                        <View style={kmAwayStyles.container}>
                            <ZButton
                                onPress={() => onPressAvailableLocation?.(item?.author?.locations)}
                                type="m14"
                                containerStyle={kmAwayStyles.button}
                                title={
                                    item?.kmAway && item?.kmAway !== null && item?.kmAway < 50000
                                        ? item.kmAway.toFixed(2) + strings.kmAway
                                        : strings.clickbranches
                                }
                            />
                        </View>
                    )}

                    {/* Media Player */}
                    <ReelMediaPlayer
                        item={item}
                        activeVideoIndex={activeVideoIndex}
                        index={index}
                        videoRef={playback.videoRef}
                        isVideoReady={playback.isVideoReady}
                        cachedVideoPath={playback.cachedVideoPath}
                        shouldPlay={playback.shouldPlay}
                        shouldMute={playback.shouldMute}
                        isNearActive={playback.isNearActive}
                        onLoad={playback.handleOnLoad}
                        onProgress={playback.onProgress}
                        onSeek={playback.onSeek}
                        onEnd={playback.handleVideoEnd}
                        onReadyForDisplay={playback.onReadyForDisplay}
                        primaryColor={colors.primary}
                    />

                    {/* Dishes Display */}
                    <ReelDishesDisplay item={item} isVisible={isOverlayVisible} />

                    {/* Overlay */}
                    <ReelOverlay isVisible={isOverlayVisible}>
                        <View style={styles.flex}>
                            <View style={authorInfoStyles.container}>
                                {/* Author Info */}
                                <ReelAuthorInfo
                                    author={item?.author}
                                    channelName={item?.channelName}
                                    currentUserId={currentUserId}
                                    onPressProfile={navigation.navigateToProfile}
                                />

                                {/* Restaurant Badge (for reviews) */}
                                <ReelRestaurantBadge
                                    item={item}
                                    currentUserId={currentUserId}
                                    isReview={navigation.isReview}
                                    restaurantName={navigation.restaurantName}
                                    restaurantAddress={navigation.restaurantAddress}
                                    isInternalRestaurant={navigation.isInternalRestaurant}
                                    onPress={navigation.navigateToReviewedPlace}
                                />

                                {/* Caption */}
                                <ReelCaption
                                    title={item?.title}
                                    caption={item?.caption}
                                    duration={item?.duration}
                                />

                                {/* Review Rating */}
                                <ReelReviewRating rating={item?.rating} isReview={navigation.isReview} />

                                {/* Visit Menu Button - For Chefs */}
                                {navigation.isChefPost && (
                                    <ZButton
                                        title={strings.visitMenu}
                                        textType="b18"
                                        color={colors.white}
                                        containerStyle={visitMenuStyles.container}
                                        onPress={navigation.navigateToChefMenu}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Action Bar */}
                        <ReelActionBar
                            item={item}
                            commentsCount={commentsCount?.count}
                            likeRef={likeRef}
                            index={index}
                            onPressReport={interactions.onPressReport}
                            onPressLike={interactions.onPressLike}
                            onPressComment={interactions.onPressComment}
                            onPressShare={() => interactions.handleShare(item)}
                        />
                    </ReelOverlay>

                    {/* Pause Indicator */}
                    <ReelPauseIndicator
                        isPaused={playback.paused.paused}
                        isSeeking={playback.paused.slider}
                        hasVideo={playback.isVideo}
                    />

                    {/* Like Animation */}
                    <ReelLikeAnimation isVisible={interactions.isLike} />

                    {/* Video Seeker */}
                    {playback.isVideo && (
                        <VideoSeeker
                            videoRef={playback.videoRef}
                            duration={playback.durationInSeconds}
                            currentTime={playback.currentTime}
                            primaryColor={colors.primary}
                            isActive={activeVideoIndex === index}
                            isPaused={playback.paused.paused || playback.paused.slider || !isFocused || isCommentOpen}
                            onSeek={playback.seekTo}
                            onSeekStart={playback.startSeeking}
                            onSeekEnd={playback.endSeeking}
                        />
                    )}
                </DoubleClick>
            </View>

            {/* Image Zoom Modal */}
            <ImageZoomModal
                visible={showImageZoom}
                imageUri={playback.poster}
                onClose={() => setShowImageZoom(false)}
            />

            {/* Share Options Sheet */}
            <ShareOptionsSheet
                SheetRef={interactions.shareSheetRef}
                contentType="reel"
                contentId={interactions.shareItem?._id}
                contentData={{
                    title: interactions.shareItem?.title,
                    description: interactions.shareItem?.caption,
                    creator: {
                        name: interactions.shareItem?.author?.fullName,
                        avatar: interactions.shareItem?.author?.avatar,
                    },
                }}
            />
        </View>
    );
});

ReelItem.displayName = 'ReelItem';

export default ReelItem;
