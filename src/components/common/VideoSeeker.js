import React, { useCallback, useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import ZText from './ZText';
import { moderateScale } from '../../common/constants';

/**
 * VideoSeeker - A stable video progress slider
 * 
 * Key design principles:
 * 1. Uses a ref to track the "true" progress from video, avoiding state conflicts
 * 2. Only updates state for display purposes at controlled intervals
 * 3. Completely isolates user-controlled seeking from video-progress updates
 * 4. Communicates seeking state back to parent to block auto-scroll
 */
const VideoSeeker = React.memo(({
    duration,
    currentTime, // Actual video progress from onProgress callback
    onSeek,
    onSeekStart,
    onSeekEnd,
    primaryColor,
    isActive
}) => {
    // Display time shown on the slider - only updates when NOT seeking
    const [displayTime, setDisplayTime] = useState(0);

    // Whether user is currently dragging the slider
    const [isSeeking, setIsSeeking] = useState(false);

    // Ref to track if we're in a seeking state (avoids stale closure issues)
    const isSeekingRef = useRef(false);

    // Ref to hold the last known video time (stable reference)
    const lastVideoTimeRef = useRef(0);

    // Format time helper
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Update display from video progress - ONLY when not seeking
    useEffect(() => {
        // Store the video time in ref for reference
        if (currentTime !== undefined && currentTime !== null) {
            lastVideoTimeRef.current = currentTime;
        }

        // Only update display if NOT seeking
        if (!isSeekingRef.current && currentTime !== undefined && currentTime !== null) {
            setDisplayTime(currentTime);
        }
    }, [currentTime]);

    // Reset when video changes (isActive changes)
    useEffect(() => {
        setDisplayTime(0);
        lastVideoTimeRef.current = 0;
        isSeekingRef.current = false;
        setIsSeeking(false);
    }, [isActive]);

    const handleSlidingStart = useCallback(() => {
        isSeekingRef.current = true;
        setIsSeeking(true);
        onSeekStart?.();
    }, [onSeekStart]);

    const handleSlidingComplete = useCallback((value) => {
        // First seek the video
        onSeek?.(value);

        // Update display to the seeked position
        setDisplayTime(value);
        lastVideoTimeRef.current = value;

        // Small delay before ending seek state to let video catch up
        setTimeout(() => {
            isSeekingRef.current = false;
            setIsSeeking(false);
            onSeekEnd?.();
        }, 100);
    }, [onSeek, onSeekEnd]);

    const handleValueChange = useCallback((value) => {
        // During seeking, update display immediately
        if (isSeekingRef.current) {
            setDisplayTime(value);
        }
    }, []);

    if (!isActive) return null;

    return (
        <View
            style={styles.container}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
        >
            <View style={styles.timeContainer}>
                <ZText style={styles.timeText}>
                    {formatTime(displayTime)}
                </ZText>
            </View>

            <View style={styles.sliderContainer}>
                <Slider
                    inverted={I18nManager.isRTL}
                    style={styles.slider}
                    minimumValue={0}
                    tapToSeek
                    maximumValue={duration || 1}
                    value={displayTime}
                    minimumTrackTintColor={primaryColor}
                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                    thumbTintColor={isSeeking ? primaryColor : 'transparent'}
                    onSlidingStart={handleSlidingStart}
                    onSlidingComplete={handleSlidingComplete}
                    onValueChange={handleValueChange}
                />
            </View>

            <View style={styles.timeContainer}>
                <ZText style={styles.timeText}>
                    {formatTime(duration)}
                </ZText>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingBottom: moderateScale(8),
        paddingTop: moderateScale(4),
        backgroundColor: 'transparent',
    },
    sliderContainer: {
        flex: 1,
        marginHorizontal: moderateScale(8),
    },
    slider: {
        height: moderateScale(20),
        width: '100%',
    },
    timeContainer: {
        minWidth: moderateScale(40),
        alignItems: 'center',
    },
    timeText: {
        fontSize: moderateScale(11),
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});

export default VideoSeeker;
