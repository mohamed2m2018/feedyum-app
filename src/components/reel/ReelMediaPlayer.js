/**
 * ReelMediaPlayer Component
 * Handles video + image layering with black flash prevention
 */

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../common/constants';
import { mediaPlayerStyles as styles } from './styles';
import { isVideoUri } from '../../utils/mediaUtils';

/**
 * Props for ReelMediaPlayer
 * @typedef {Object} ReelMediaPlayerProps
 * @property {Object} item - The reel item data
 * @property {number} activeVideoIndex - Currently active video index
 * @property {number} index - This item's index
 * @property {Object} videoRef - React ref for the Video component
 * @property {boolean} isVideoReady - Whether video is ready for display
 * @property {string|null} cachedVideoPath - Local cached video path
 * @property {boolean} shouldPlay - Whether video should play
 * @property {boolean} shouldMute - Whether video should be muted
 * @property {boolean} isNearActive - Whether this item is near the active index
 * @property {Function} onLoad - Video load handler
 * @property {Function} onProgress - Video progress handler
 * @property {Function} onSeek - Video seek handler
 * @property {Function} onEnd - Video end handler
 * @property {Function} onReadyForDisplay - Video ready handler
 * @property {string} primaryColor - Theme primary color for seek bar
 */

const ReelMediaPlayer = React.memo(({
    item,
    activeVideoIndex,
    index,
    videoRef,
    isVideoReady,
    cachedVideoPath,
    shouldPlay,
    shouldMute,
    isNearActive,
    onLoad,
    onProgress,
    onSeek,
    onEnd,
    onReadyForDisplay,
    primaryColor,
}) => {
    const colors = useSelector((state) => state.theme.theme);

    const uri = item?.uri;
    const poster = item?.avatarUri || item?.poster;
    const isVideo = useMemo(() => isVideoUri(uri), [uri]);

    // Image styles with background color
    const imageStyles = useMemo(
        () => [styles.container, { backgroundColor: colors.backgroundColor }],
        [colors.backgroundColor]
    );

    // Video source - prefer cached path
    const videoSource = useMemo(
        () => ({ uri: cachedVideoPath || uri }),
        [cachedVideoPath, uri]
    );

    // Video style with visibility based on readiness
    const videoStyle = useMemo(
        () => [
            styles.container,
            {
                backgroundColor: 'transparent',
                opacity: isVideoReady ? 1 : 0,
            },
        ],
        [isVideoReady]
    );

    // Buffer config for Android - optimized for fast initial playback
    const bufferConfig = useMemo(
        () => ({
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 100, // CRITICAL: Minimized for instant start
            bufferForPlaybackAfterRebufferMs: 500,
            cacheSizeMB: 200,
        }),
        []
    );

    return (
        <View style={styles.container}>
            {/* Background Image Layer - Always renders to prevent black flash */}
            {item?.avatarUri ? (
                <View style={[imageStyles, styles.absoluteFill]}>
                    <FastImage
                        source={{ uri: poster }}
                        // Use cover for videos to match player, contain for image-only posts
                        resizeMode={isVideo ? 'cover' : 'contain'}
                        style={imageStyles}
                    />
                    {/* Zoom indicator - Only show for actual images, not video thumbnails */}
                    {!isVideo && (
                        <View style={styles.zoomIndicator}>
                            <Ionicons
                                name="expand-outline"
                                size={moderateScale(20)}
                                color="rgba(255, 255, 255, 0.8)"
                            />
                        </View>
                    )}
                </View>
            ) : (
                <Image
                    source={{ uri: poster }}
                    resizeMode="cover"
                    blurRadius={2}
                    style={[imageStyles, styles.absoluteFill]}
                />
            )}

            {/* Video Layer - Renders ON TOP of image when near active */}
            {isVideo && isNearActive && (
                <View pointerEvents="none" style={[styles.container, styles.absoluteFill]}>
                    <Video
                        source={videoSource}
                        ref={videoRef}
                        onSeek={onSeek}
                        onProgress={onProgress}
                        hideShutterView
                        onLoad={onLoad}
                        onReadyForDisplay={onReadyForDisplay}
                        onEnd={onEnd}
                        style={videoStyle}
                        poster={poster}
                        posterResizeMode="cover"
                        resizeMode="cover"
                        playInBackground={false}
                        disableFocus={true}
                        onError={(error) => {
                            if (__DEV__) {
                                console.log('Video error:', error);
                            }
                        }}
                        seekColor={primaryColor}
                        muted={shouldMute}
                        paused={!shouldPlay}
                        useTextureView={true}
                        bufferConfig={bufferConfig}
                        // iOS buffering configuration
                        preferredForwardBufferDuration={3}
                        automaticallyWaitsToMinimizeStalling={false}
                    />
                </View>
            )}
        </View>
    );
});

ReelMediaPlayer.displayName = 'ReelMediaPlayer';

export default ReelMediaPlayer;
