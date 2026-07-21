/**
 * useReelNavigation Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import useReelNavigation from '../useReelNavigation';

// Mock dependencies
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock('react-native', () => ({
    Linking: {
        openURL: jest.fn().mockResolvedValue(true),
    },
}));

describe('useReelNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('navigateToProfile', () => {
        it('should navigate to Profile tab for own posts', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: { author: { _id: 'user123', type: 'user', fullName: 'Test User' } },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToProfile();
            });

            expect(mockNavigate).toHaveBeenCalledWith('Profile');
        });

        it('should navigate to ChefMenu for chef authors', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: { author: { _id: 'chef123', type: 'chef', fullName: 'Test Chef' } },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToProfile();
            });

            expect(mockNavigate).toHaveBeenCalledWith('ChefMenu', {
                chefId: 'chef123',
                chefName: 'Test Chef',
            });
        });

        it('should navigate to ProfileDetail for regular users', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        author: { _id: 'user456', type: 'user', fullName: 'Other User' },
                        avatarUri: 'https://example.com/avatar.jpg',
                    },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToProfile();
            });

            expect(mockNavigate).toHaveBeenCalledWith('ProfileDetail', {
                userName: 'Other User',
                userImage: 'https://example.com/avatar.jpg',
                id: 'user456',
            });
        });
    });

    describe('navigateToReviewedPlace', () => {
        it('should navigate to ChefMenu for registered chefs', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        reviewedChef: { _id: 'chef123', fullName: 'Reviewed Chef' },
                        restaurantName: 'Test Restaurant',
                    },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToReviewedPlace();
            });

            expect(mockNavigate).toHaveBeenCalledWith('ChefMenu', {
                chefId: 'chef123',
                chefName: 'Reviewed Chef',
            });
        });

        it('should open Google Maps for external restaurants with Place ID', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        googlePlaceId: 'place123',
                        restaurantName: 'External Restaurant',
                    },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToReviewedPlace();
            });

            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining('https://www.google.com/maps/search/')
            );
            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining('place123')
            );
        });

        it('should open Google Maps with address as fallback', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        restaurantAddress: '123 Main St, City',
                    },
                    currentUserId: 'user123',
                })
            );

            act(() => {
                result.current.navigateToReviewedPlace();
            });

            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining('https://www.google.com/maps/search/')
            );
        });
    });

    describe('computed flags', () => {
        it('should correctly compute isOwnPost', () => {
            const { result: ownPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { _id: 'user123' } },
                    currentUserId: 'user123',
                })
            );
            expect(ownPost.current.isOwnPost).toBe(true);

            const { result: otherPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { _id: 'user456' } },
                    currentUserId: 'user123',
                })
            );
            expect(otherPost.current.isOwnPost).toBe(false);
        });

        it('should correctly compute isReview', () => {
            const { result: reviewMode } = renderHook(() =>
                useReelNavigation({
                    item: { reviewMode: true, author: { type: 'chef' } },
                    currentUserId: 'user123',
                })
            );
            expect(reviewMode.current.isReview).toBe(true);

            const { result: userPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { type: 'user' } },
                    currentUserId: 'user123',
                })
            );
            expect(userPost.current.isReview).toBe(true);

            const { result: chefPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { type: 'chef' } },
                    currentUserId: 'user123',
                })
            );
            expect(chefPost.current.isReview).toBe(false);
        });

        it('should correctly compute isChefPost', () => {
            const { result: chefPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { type: 'chef' } },
                    currentUserId: 'user123',
                })
            );
            expect(chefPost.current.isChefPost).toBe(true);

            const { result: menuPost } = renderHook(() =>
                useReelNavigation({
                    item: { author: { type: 'user', hasMenu: true } },
                    currentUserId: 'user123',
                })
            );
            expect(menuPost.current.isChefPost).toBe(true);
        });

        it('should correctly compute isInternalRestaurant', () => {
            const { result: internal } = renderHook(() =>
                useReelNavigation({
                    item: { reviewedChef: { _id: 'chef123' } },
                    currentUserId: 'user123',
                })
            );
            expect(internal.current.isInternalRestaurant).toBe(true);

            const { result: external } = renderHook(() =>
                useReelNavigation({
                    item: { googlePlaceId: 'place123' },
                    currentUserId: 'user123',
                })
            );
            expect(external.current.isInternalRestaurant).toBe(false);
        });
    });

    describe('derived data', () => {
        it('should extract restaurant name correctly', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        restaurantName: 'Test Restaurant',
                        reviewedChef: { fullName: 'Chef Name' },
                    },
                    currentUserId: 'user123',
                })
            );

            expect(result.current.restaurantName).toBe('Test Restaurant');
        });

        it('should fallback to reviewedChef name', () => {
            const { result } = renderHook(() =>
                useReelNavigation({
                    item: {
                        reviewedChef: { fullName: 'Chef Name' },
                    },
                    currentUserId: 'user123',
                })
            );

            expect(result.current.restaurantName).toBe('Chef Name');
        });
    });
});
