/**
 * useReelPlayback Hook
 * Encapsulates all video playback logic including state, caching, seeking, and auto-scroll
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCachedVideoPath } from '../../services/VideoCacheService';
import { isVideoUri } from '../../utils/mediaUtils';

/**
 * Custom hook for managing reel video playback
 * 
 * @param {Object} options - Hook options
 * @param {Object} options.item - The reel item data
 * @param {number} options.index - The index of this item in the list
 * @param {number} options.activeVideoIndex - Currently active video index
 * @param {boolean} options.isFocused - Whether the screen is focused
 * @param {boolean} options.isCommentOpen - Whether comment sheet is open
 * @param {boolean} options.isLocationOpen - Whether location sheet is open
 * @param {boolean} options.showImageZoom - Whether image zoom is active
 * @param {Object} options.flatListRef - Reference to the FlatList
 * @returns {Object} Playback state and handlers
 */
const useReelPlayback = ({
    item,
    index,
    activeVideoIndex,
    isFocused,
    isCommentOpen = false,
    isLocationOpen = false,
    showImageZoom = false,
    flatListRef,
}) => {
    // Video state
    const [paused, setPaused] = useState({ slider: false, paused: false });
    const [currentTime, setCurrentTime] = useState(0);
    const [durationInSeconds, setDurationInSeconds] = useState(0);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [cachedVideoPath, setCachedVideoPath] = useState(null);

    // Refs
    const videoRef = useRef(null);
    const seekProgressRef = useRef(0);
    const isVideoReadyRef = useRef(false);

    // Component recycling detection
    const [indexState] = useState(index);

    // Derived state
    const uri = item?.uri;
    const poster = item?.avatarUri || item?.poster;
    const isVideo = useMemo(() => isVideoUri(uri), [uri]);
    const isImageOnlyPost = !uri || !isVideo;

    // Should this video play?
    const shouldPlay = useMemo(() => {
        return (
            activeVideoIndex === index &&
            isFocused &&
            !paused.paused &&
            !paused.slider &&
            !isCommentOpen
        );
    }, [activeVideoIndex, index, isFocused, paused.paused, paused.slider, isCommentOpen]);

    // Should this video be muted?
    const shouldMute = useMemo(() => {
        return !isFocused || activeVideoIndex !== index;
    }, [isFocused, activeVideoIndex, index]);

    // Is this component near the active video (for preloading)?
    const isNearActive = useMemo(() => {
        return Math.abs(activeVideoIndex - index) <= 1;
    }, [activeVideoIndex, index]);

    // Reset state when component is recycled
    useEffect(() => {
        if (indexState !== index) {
            setPaused({ slider: false, paused: false });
            setCurrentTime(0);
        }
    }, [indexState, index]);

    // Reset video ready state when video source changes
    useEffect(() => {
        setIsVideoReady(false);
        isVideoReadyRef.current = false;
        setCurrentTime(0);
        seekProgressRef.current = 0;
    }, [uri]);

    // Check video cache on mount or uri change
    useEffect(() => {
        let active = true;

        const checkCache = async () => {
            if (uri && isVideo) {
                const cached = await getCachedVideoPath(uri);
                if (active) {
                    // Only switch to cached version if we haven't started playing yet
                    // This prevents the video from restarting if the remote stream is already active
                    if (cached && !isVideoReadyRef.current) {
                        setCachedVideoPath(cached);
                    }
                }
            }
        };

        setCachedVideoPath(null); // Reset when uri changes
        checkCache();

        return () => {
            active = false;
        };
    }, [uri, isVideo]);

    // Auto-scroll for IMAGE posts only (after 10 seconds)
    useEffect(() => {
        let timeout;

        if (
            index === activeVideoIndex &&
            isImageOnlyPost &&
            isFocused &&
            !isCommentOpen &&
            !isLocationOpen &&
            !showImageZoom &&
            !paused.slider
        ) {
            if (__DEV__) {
                console.log('Auto-scroll for IMAGE EFFECT START. index:', index);
            }

            timeout = setTimeout(() => {
                try {
                    flatListRef?.current?.scrollToIndex({
                        animated: true,
                        index: index + 1,
                    });
                    if (__DEV__) {
                        console.log('Auto-scroll for IMAGE SCROLL CALLED');
                    }
                } catch (e) {
                    if (__DEV__) {
                        console.log('Reached last item, cannot auto-scroll');
                    }
                }
            }, 10000);
        }

        return () => {
            if (timeout) {
                if (__DEV__) {
                    console.log('Auto-scroll for IMAGE EFFECT CLEANUP. index:', index);
                }
                clearTimeout(timeout);
            }
        };
    }, [
        isFocused,
        index,
        activeVideoIndex,
        flatListRef,
        isImageOnlyPost,
        isCommentOpen,
        isLocationOpen,
        showImageZoom,
        paused.slider,
    ]);

    /**
     * Handle video load event
     */
    const handleOnLoad = useCallback(({ duration }) => {
        setDurationInSeconds(duration);
        // We rely on onReadyForDisplay to show the video to prevent black flash
    }, []);

    /**
     * Handle video progress updates
     */
    const onProgress = useCallback(({ currentTime: time }) => {
        seekProgressRef.current = time;
        setCurrentTime(time);
    }, []);

    /**
     * Handle video seek event
     */
    const onSeek = useCallback(({ currentTime }) => {
        seekProgressRef.current = currentTime;
    }, []);

    /**
     * Handle video ready for display
     */
    const onReadyForDisplay = useCallback(() => {
        setIsVideoReady(true);
        isVideoReadyRef.current = true;
    }, []);

    /**
     * Handle video end - auto-scroll to next
     */
    const handleVideoEnd = useCallback(() => {
        if (activeVideoIndex === index && isFocused && !isCommentOpen && !paused.slider) {
            if (__DEV__) {
                console.log('Video onEnd - auto-scroll. index:', index);
            }

            if (flatListRef?.current) {
                try {
                    flatListRef.current.scrollToIndex({
                        animated: true,
                        index: index + 1,
                    });
                    // Reset video to beginning for when user scrolls back
                    setTimeout(() => {
                        videoRef?.current?.seek?.(0);
                    }, 100);
                } catch (e) {
                    if (__DEV__) {
                        console.log('Reached last item, cannot auto-scroll');
                    }
                }
            }
        }
    }, [activeVideoIndex, index, isFocused, isCommentOpen, paused.slider, flatListRef]);

    /**
     * Toggle play/pause state
     */
    const togglePause = useCallback(() => {
        if (uri) {
            setPaused(prev => ({
                ...prev,
                paused: !prev.paused,
            }));
        }
    }, [uri]);

    /**
     * Seek to a specific time
     */
    const seekTo = useCallback((value) => {
        videoRef?.current?.seek?.(value);
        setCurrentTime(value);
    }, []);

    /**
     * Start seeking (pause during seek)
     */
    const startSeeking = useCallback(() => {
        setPaused(prev => ({ ...prev, slider: true }));
    }, []);

    /**
     * End seeking (resume playback)
     */
    const endSeeking = useCallback(() => {
        setPaused(prev => ({ ...prev, slider: false }));
    }, []);

    return {
        // Refs
        videoRef,
        seekProgressRef,

        // State
        paused,
        currentTime,
        durationInSeconds,
        isVideoReady,
        cachedVideoPath,

        // Computed
        isVideo,
        isImageOnlyPost,
        shouldPlay,
        shouldMute,
        isNearActive,
        uri,
        poster,

        // Handlers
        handleOnLoad,
        onProgress,
        onSeek,
        onReadyForDisplay,
        handleVideoEnd,
        togglePause,
        seekTo,
        startSeeking,
        endSeeking,
        setPaused,
        setIsVideoReady,
    };
};

export default useReelPlayback;
