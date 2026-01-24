/**
 * useReelInteractions Hook Tests
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import useReelInteractions from '../useReelInteractions';

// Mock dependencies
jest.mock('../../../api/request', () => ({
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: jest.fn(),
    }),
}));

jest.mock('@segment/analytics-react-native', () => ({
    useAnalytics: () => ({
        track: jest.fn(),
    }),
}));

jest.mock('../../../utils/mediaUtils', () => ({
    generateShareableLink: jest.fn().mockResolvedValue('https://food2k.com/reel/123'),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useReelInteractions', () => {
    const mockCommentSheetRef = { current: { show: jest.fn() } };
    const mockSetSelectedPostId = jest.fn();
    const mockSetIsCommentOpen = jest.fn();
    const mockLikeRef = { current: [] };

    const defaultOptions = {
        item: { _id: '123', title: 'Test Reel', author: { phone: '1234567890' } },
        likeRef: mockLikeRef,
        index: 0,
        commentSheetRef: mockCommentSheetRef,
        setSelectedPostId: mockSetSelectedPostId,
        setIsCommentOpen: mockSetIsCommentOpen,
        userData: { _id: 'user123' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useReelInteractions(defaultOptions), {
            wrapper: createWrapper(),
        });

        expect(result.current.isLike).toBe(false);
        expect(result.current.shareItem).toBeNull();
        expect(result.current.shareSheetRef.current).toBeNull();
    });

    it('should handle like animation on press', () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useReelInteractions(defaultOptions), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onPressLike('123', false);
        });

        expect(result.current.isLike).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.isLike).toBe(false);
        jest.useRealTimers();
    });

    it('should open comment sheet on press', () => {
        const { result } = renderHook(() => useReelInteractions(defaultOptions), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onPressComment();
        });

        expect(mockSetSelectedPostId).toHaveBeenCalledWith('123');
        expect(mockSetIsCommentOpen).toHaveBeenCalledWith(true);
        expect(mockCommentSheetRef.current.show).toHaveBeenCalled();
    });

    it('should set share item on share press', async () => {
        const mockShareSheetRef = { current: { show: jest.fn() } };
        const { result } = renderHook(() => useReelInteractions(defaultOptions), {
            wrapper: createWrapper(),
        });

        // Manually set the ref
        result.current.shareSheetRef.current = mockShareSheetRef.current;

        await act(async () => {
            await result.current.handleShare({ _id: '456', title: 'Shared Reel' });
        });

        expect(result.current.shareItem).toEqual({ _id: '456', title: 'Shared Reel' });
    });

    it('should provide mutations', () => {
        const { result } = renderHook(() => useReelInteractions(defaultOptions), {
            wrapper: createWrapper(),
        });

        expect(result.current.addLikeMutation).toBeDefined();
        expect(result.current.removeLikeMutation).toBeDefined();
        expect(typeof result.current.addLikeMutation.mutate).toBe('function');
        expect(typeof result.current.removeLikeMutation.mutate).toBe('function');
    });
});
