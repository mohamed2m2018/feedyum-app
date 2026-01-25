/**
 * useEngagementTracking Hook
 * 
 * Tracks user engagement with video reels (TikTok-style algorithm support)
 * Sends watch time, completion rate, and rewatch signals to backend
 * 
 * @see /docs/feed_algorithm.md for algorithm documentation
 */

import { useRef, useCallback, useEffect } from 'react';
import request from '../api/request';

// Minimum watch time (seconds) before tracking
const MIN_WATCH_TIME = 2;
// Debounce delay for engagement updates (ms)
const DEBOUNCE_DELAY = 1000;

/**
 * Track engagement signals for video content
 * 
 * @param {string} storyId - Current story ID
 * @param {number} duration - Total video duration in seconds
 * @param {string} source - Feed source ('forYou' | 'following' | 'profile' | 'search')
 * @returns {Object} - { onProgress, onComplete, onRewatch, onShare, cleanup }
 */
export const useEngagementTracking = (storyId, duration = 0, source = 'forYou') => {
    const startTimeRef = useRef(null);
    const watchTimeRef = useRef(0);
    const lastReportedTimeRef = useRef(0);
    const hasReportedViewRef = useRef(false);
    const rewatchCountRef = useRef(0);
    const debounceTimerRef = useRef(null);

    // Reset when story changes
    useEffect(() => {
        startTimeRef.current = Date.now();
        watchTimeRef.current = 0;
        lastReportedTimeRef.current = 0;
        hasReportedViewRef.current = false;
        rewatchCountRef.current = 0;

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [storyId]);

    /**
     * Send engagement data to backend
     */
    const sendEngagement = useCallback(async (overrides = {}) => {
        if (!storyId) return;

        const watchDuration = watchTimeRef.current;

        // Don't send if watch time is too short
        if (watchDuration < MIN_WATCH_TIME && !overrides.shared) return;

        // Don't send if nothing changed
        if (watchDuration === lastReportedTimeRef.current && !overrides.shared && !overrides.rewatched) {
            return;
        }

        lastReportedTimeRef.current = watchDuration;

        try {
            const completionRate = duration > 0 ? Math.min(1, watchDuration / duration) : 0;

            await request.post(`/story/${storyId}/engagement`, {
                watchDuration,
                totalDuration: duration,
                completionRate,
                rewatched: rewatchCountRef.current > 0,
                source,
                ...overrides
            });

            hasReportedViewRef.current = true;
        } catch (error) {
            // Silent fail - engagement tracking shouldn't break the app
            console.debug('[Engagement] Failed to track:', error?.message || error);
        }
    }, [storyId, duration, source]);

    /**
     * Called on video progress update
     * Debounced to prevent excessive API calls
     */
    const onProgress = useCallback((currentTime) => {
        watchTimeRef.current = Math.max(watchTimeRef.current, currentTime);

        // Debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            sendEngagement();
        }, DEBOUNCE_DELAY);
    }, [sendEngagement]);

    /**
     * Called when video completes (reached end)
     */
    const onComplete = useCallback(() => {
        watchTimeRef.current = duration;
        sendEngagement();
    }, [duration, sendEngagement]);

    /**
     * Called when video is rewatched (loops or manually replayed)
     */
    const onRewatch = useCallback(() => {
        rewatchCountRef.current += 1;
        sendEngagement({ rewatched: true });
    }, [sendEngagement]);

    /**
     * Called when user shares the story
     */
    const onShare = useCallback(() => {
        sendEngagement({ shared: true });
    }, [sendEngagement]);

    /**
     * Cleanup - send final engagement when leaving
     */
    const cleanup = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        sendEngagement();
    }, [sendEngagement]);

    return {
        onProgress,
        onComplete,
        onRewatch,
        onShare,
        cleanup
    };
};

export default useEngagementTracking;
