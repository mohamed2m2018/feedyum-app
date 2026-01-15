import React, { useCallback, useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import ZText from './ZText';
import { moderateScale } from '../../common/constants';

// Memoized Video Seeker Component - Uses internal timer to avoid parent re-renders
const VideoSeeker = React.memo(({
    duration,
    onSeek,
    onSeekStart,
    onSeekEnd,
    primaryColor,
    isActive,
    isPaused
}) => {
    const [displayTime, setDisplayTime] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const progressInterval = useRef(null);

    // Format time helper
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Internal progress tracking using interval - completely isolated from parent
    useEffect(() => {
        if (isActive && !isPaused && !isSeeking) {
            progressInterval.current = setInterval(() => {
                // Increment display time smoothly
                setDisplayTime(prev => {
                    const newTime = prev + 0.5;
                    // Don't exceed duration
                    return duration && newTime > duration ? duration : newTime;
                });
            }, 500);
        } else {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
        }

        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
        };
    }, [isActive, isPaused, isSeeking, duration]);

    // Reset display time when video changes (becomes active)
    useEffect(() => {
        if (!isActive) {
            setDisplayTime(0);
        }
    }, [isActive]);

    const handleSlidingStart = useCallback(() => {
        setIsSeeking(true);
        onSeekStart?.();
    }, [onSeekStart]);

    const handleSlidingComplete = useCallback((value) => {
        setIsSeeking(false);
        setDisplayTime(value);
        onSeek?.(value);
        onSeekEnd?.();
    }, [onSeek, onSeekEnd]);

    const handleValueChange = useCallback((value) => {
        if (isSeeking) {
            setDisplayTime(value);
        }
    }, [isSeeking]);

    if (!isActive) return null;

    return (
        <View style={styles.container}>
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
