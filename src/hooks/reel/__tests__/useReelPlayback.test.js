/**
 * useReelPlayback Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import useReelPlayback from '../useReelPlayback';

// Mock dependencies
jest.mock('../../../services/VideoCacheService', () => ({
    getCachedVideoPath: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../utils/mediaUtils', () => ({
    isVideoUri: jest.fn((uri) => uri && uri.includes('video')),
}));

describe('useReelPlayback', () => {
    const defaultOptions = {
        item: { _id: '123', uri: 'https://example.com/video.mp4' },
        index: 0,
        activeVideoIndex: 0,
        isFocused: true,
        isCommentOpen: false,
        isLocationOpen: false,
        showImageZoom: false,
        flatListRef: { current: null },
    };

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        expect(result.current.paused).toEqual({ slider: false, paused: false });
        expect(result.current.currentTime).toBe(0);
        expect(result.current.durationInSeconds).toBe(0);
        expect(result.current.isVideoReady).toBe(false);
        expect(result.current.cachedVideoPath).toBeNull();
    });

    it('should compute shouldPlay correctly when active and focused', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        expect(result.current.shouldPlay).toBe(true);
    });

    it('should compute shouldPlay as false when paused', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        act(() => {
            result.current.togglePause();
        });

        expect(result.current.paused.paused).toBe(true);
        expect(result.current.shouldPlay).toBe(false);
    });

    it('should compute shouldPlay as false when not active', () => {
        const { result } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, activeVideoIndex: 1 })
        );

        expect(result.current.shouldPlay).toBe(false);
    });

    it('should compute shouldPlay as false when not focused', () => {
        const { result } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, isFocused: false })
        );

        expect(result.current.shouldPlay).toBe(false);
    });

    it('should compute shouldPlay as false when comment is open', () => {
        const { result } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, isCommentOpen: true })
        );

        expect(result.current.shouldPlay).toBe(false);
    });

    it('should compute shouldMute correctly', () => {
        const { result: focusedResult } = renderHook(() =>
            useReelPlayback(defaultOptions)
        );
        expect(focusedResult.current.shouldMute).toBe(false);

        const { result: unfocusedResult } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, isFocused: false })
        );
        expect(unfocusedResult.current.shouldMute).toBe(true);

        const { result: notActiveResult } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, activeVideoIndex: 1 })
        );
        expect(notActiveResult.current.shouldMute).toBe(true);
    });

    it('should compute isNearActive correctly', () => {
        const { result: activeResult } = renderHook(() =>
            useReelPlayback(defaultOptions)
        );
        expect(activeResult.current.isNearActive).toBe(true);

        const { result: nearResult } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, activeVideoIndex: 1 })
        );
        expect(nearResult.current.isNearActive).toBe(true);

        const { result: farResult } = renderHook(() =>
            useReelPlayback({ ...defaultOptions, activeVideoIndex: 5 })
        );
        expect(farResult.current.isNearActive).toBe(false);
    });

    it('should update time when handleOnLoad is called', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        act(() => {
            result.current.handleOnLoad({ duration: 120 });
        });

        expect(result.current.durationInSeconds).toBe(120);
    });

    it('should update currentTime when onProgress is called', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        act(() => {
            result.current.onProgress({ currentTime: 30 });
        });

        expect(result.current.currentTime).toBe(30);
    });

    it('should toggle pause state', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        expect(result.current.paused.paused).toBe(false);

        act(() => {
            result.current.togglePause();
        });

        expect(result.current.paused.paused).toBe(true);

        act(() => {
            result.current.togglePause();
        });

        expect(result.current.paused.paused).toBe(false);
    });

    it('should handle seeking start and end', () => {
        const { result } = renderHook(() => useReelPlayback(defaultOptions));

        expect(result.current.paused.slider).toBe(false);

        act(() => {
            result.current.startSeeking();
        });

        expect(result.current.paused.slider).toBe(true);
        expect(result.current.shouldPlay).toBe(false);

        act(() => {
            result.current.endSeeking();
        });

        expect(result.current.paused.slider).toBe(false);
    });

    it('should detect image-only posts', () => {
        const { result: videoResult } = renderHook(() => useReelPlayback(defaultOptions));
        expect(videoResult.current.isImageOnlyPost).toBe(false);

        const { result: imageResult } = renderHook(() =>
            useReelPlayback({
                ...defaultOptions,
                item: { _id: '123', uri: null, avatarUri: 'https://example.com/image.jpg' },
            })
        );
        expect(imageResult.current.isImageOnlyPost).toBe(true);
    });
});
