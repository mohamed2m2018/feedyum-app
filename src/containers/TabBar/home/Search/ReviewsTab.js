// Library import
import React, { useCallback, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Dimensions,
    Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useInfiniteQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Local imports
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import { styles as globalStyles } from '../../../../themes';
import strings from '../../../../i18n/strings';
import request from '../../../../api/request';
import images from '../../../../assets/images';
import { StackNav } from '../../../../navigation/NavigationKeys';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - moderateScale(48)) / 2;

/**
 * ReelsTab - Tab 3: "Reels"
 * Food reels/review videos with SEMANTIC search
 * Filter toggle for "Reviews only"
 */
export default function ReviewsTab({ searchQuery = '', useSemanticSearch = true, userLocation, rtlStyle }) {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();

    // Filter state for showing reviews only
    const [showReviewsOnly, setShowReviewsOnly] = useState(false);

    // Fetch food reviews (stories) with semantic search
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery(
        ['food_reels', searchQuery, useSemanticSearch, userLocation?.lat, showReviewsOnly],
        async ({ pageParam = 1 }) => {
            // Use semantic search for longer queries
            if (searchQuery?.trim().length >= 2 && useSemanticSearch) {
                try {
                    const response = await request.get('/story/semantic-search', {
                        params: {
                            searchString: searchQuery.trim(),
                            cursor: pageParam > 1 ? pageParam : null,
                            limit: 12,
                            ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                            ...(showReviewsOnly && { reviewsOnly: 'true' }),
                        },
                    });
                    return response.data;
                } catch (error) {
                    console.log('Semantic search failed, falling back to text:', error.message);
                }
            }

            // Text search / browse all stories
            const params = {
                page: pageParam,
                limit: 12,
                ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                ...(showReviewsOnly && { reviewsOnly: 'true' }),
            };

            if (searchQuery?.trim().length >= 2) {
                params.searchString = searchQuery.trim();
            }

            const response = await request.get('/story/search', { params });
            return response.data;
        },
        {
            getNextPageParam: lastPage =>
                lastPage?.data?.hasNextPage || lastPage?.data?.pagination?.hasMore
                    ? (lastPage?.data?.pagination?.currentPage || 1) + 1
                    : undefined,
            staleTime: 1000 * 60 * 5,
        },
    );

    const reviews =
        data?.pages?.flatMap(
            page => page?.data?.stories || page?.stories || page?.results || [],
        ) || [];

    const handleReviewPress = useCallback(review => {
        Keyboard.dismiss();
        // Pass full author object so ReelsComponentOne can fetch author's other videos
        navigation.navigate(StackNav.SingleReel, {
            storyId: review?._id,
            profile: review?.author || { _id: review?.userId },
            initialStory: review,
        });
    }, [navigation]);

    const handleAuthorPress = useCallback(author => {
        Keyboard.dismiss();
        // Navigate to ChefMenu for chef profiles, ProfileDetail for regular users
        if (author?.type === 'chef') {
            navigation.navigate(StackNav.ChefMenu, {
                chefId: author?._id,
                chefName: author?.fullName || author?.username,
            });
        } else {
            navigation.navigate(StackNav.ProfileDetail, {
                userName: author?.fullName || author?.username,
                userImage: author?.avatar,
                id: author?._id,
            });
        }
    }, [navigation]);

    // Premium review card
    const renderReviewCard = ({ item: review, index }) => {
        const author = review?.author || review?.user || {};
        const thumbnail = review?.avatarUri || review?.poster || review?.thumbnail;

        return (
            <TouchableOpacity
                onPress={() => handleReviewPress(review)}
                activeOpacity={0.9}
                style={[
                    localStyles.reviewCard,
                    { backgroundColor: colors.inputBg },
                    index % 2 === 1 && { marginLeft: moderateScale(16) },
                ]}>
                {/* Thumbnail */}
                <View style={localStyles.thumbnailContainer}>
                    <Image
                        source={thumbnail ? { uri: thumbnail } : images.post}
                        style={localStyles.thumbnail}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={localStyles.thumbnailGradient}
                    />
                    {/* Play button */}
                    <View style={localStyles.playBtnContainer}>
                        <LinearGradient
                            colors={[colors.primary, colors.lightRed || '#FF8A9B']}
                            style={localStyles.playBtn}>
                            <Ionicons
                                name="play"
                                size={18}
                                color={colors.white}
                                style={{ marginLeft: 2 }}
                            />
                        </LinearGradient>
                    </View>
                    {/* Views count */}
                    {review?.views > 0 && (
                        <View style={localStyles.viewsContainer}>
                            <Ionicons name="eye-outline" size={12} color={colors.white} />
                            <ZText type="s10" color={colors.white} style={globalStyles.ml5}>
                                {review.views > 1000
                                    ? `${(review.views / 1000).toFixed(1)}K`
                                    : review.views}
                            </ZText>
                        </View>
                    )}
                    {/* Review Badge */}
                    {(review?.reviewMode || review?.rating) && (
                        <View style={[localStyles.reviewBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="star" size={10} color={colors.white} />
                            <ZText type="s10" color={colors.white} style={globalStyles.ml2}>
                                {strings.review || 'Review'}
                            </ZText>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={localStyles.contentContainer}>
                    {(review?.title || review?.caption) && (
                        <ZText type="s14" numberOfLines={2} style={localStyles.title}>
                            {review.title || review.caption}
                        </ZText>
                    )}

                    {/* Author */}
                    <TouchableOpacity
                        onPress={() => handleAuthorPress(author)}
                        style={localStyles.authorRow}>
                        <Image
                            source={author?.avatar ? { uri: author.avatar } : images.userDark}
                            style={localStyles.authorAvatar}
                        />
                        <ZText
                            type="m12"
                            color={colors.grayScale5}
                            numberOfLines={1}
                            style={[globalStyles.ml10, { flex: 1 }]}>
                            {author?.fullName || author?.username || 'Reviewer'}
                        </ZText>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={localStyles.emptyContainer}>
                <View style={localStyles.emptyIconBg}>
                    <Ionicons name="videocam-outline" size={40} color={colors.primary} />
                </View>
                <ZText type="b18" color={colors.textColor} style={globalStyles.mt20}>
                    {searchQuery?.length >= 2
                        ? strings.noReviewsFound || 'No Reviews Found'
                        : strings.browseReviews || 'Food Stories'}
                </ZText>
                <ZText
                    type="m14"
                    color={colors.grayScale5}
                    style={globalStyles.mt10}
                    align="center">
                    {searchQuery?.length >= 2
                        ? strings.tryDifferentSearch || 'Try a different search'
                        : strings.discoverFoodStories ||
                        'Discover food experiences from the community'}
                </ZText>
            </View>
        );
    };

    const renderFooter = () => {
        if (isFetchingNextPage) {
            return (
                <View style={localStyles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[{ flex: 1 }, rtlStyle]}>
            {/* Filter Toggle */}
            <View style={localStyles.filterContainer}>
                <TouchableOpacity
                    onPress={() => setShowReviewsOnly(!showReviewsOnly)}
                    activeOpacity={0.7}
                    style={[
                        localStyles.filterToggle,
                        {
                            backgroundColor: showReviewsOnly ? colors.primary : colors.inputBg,
                            borderColor: showReviewsOnly ? colors.primary : colors.grayScale5,
                        },
                    ]}>
                    <Ionicons
                        name={showReviewsOnly ? 'star' : 'star-outline'}
                        size={14}
                        color={showReviewsOnly ? colors.white : colors.grayScale5}
                    />
                    <ZText
                        type="s12"
                        color={showReviewsOnly ? colors.white : colors.grayScale5}
                        style={globalStyles.ml5}>
                        {strings.showReviewsOnly || 'Reviews only'}
                    </ZText>
                </TouchableOpacity>
            </View>
            <FlatList
                data={reviews}
                renderItem={renderReviewCard}
                keyExtractor={(item, index) => item._id || `review-${index}`}
                numColumns={2}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.listContent}
                columnWrapperStyle={localStyles.columnWrapper}
                refreshing={isLoading}
                onRefresh={refetch}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    listContent: {
        paddingHorizontal: moderateScale(16),
        paddingTop: moderateScale(8),
        paddingBottom: moderateScale(100),
        flexGrow: 1,
    },
    columnWrapper: {
        marginBottom: moderateScale(16),
    },
    reviewCard: {
        width: CARD_WIDTH,
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    thumbnailContainer: {
        height: moderateScale(160),
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    playBtnContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playBtn: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    viewsContainer: {
        position: 'absolute',
        bottom: moderateScale(8),
        left: moderateScale(8),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        borderRadius: moderateScale(10),
    },
    contentContainer: {
        padding: moderateScale(12),
    },
    title: {
        marginBottom: moderateScale(10),
        lineHeight: moderateScale(20),
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorAvatar: {
        width: moderateScale(24),
        height: moderateScale(24),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#FF4D67',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: moderateScale(60),
        paddingHorizontal: moderateScale(40),
    },
    emptyIconBg: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: '#FF4D6710',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: moderateScale(20),
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(16),
        borderWidth: 1,
    },
    reviewBadge: {
        position: 'absolute',
        top: moderateScale(8),
        left: moderateScale(8),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(6),
        paddingVertical: moderateScale(3),
        borderRadius: moderateScale(8),
    },
});
