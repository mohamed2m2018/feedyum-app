import React, { useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    ImageBackground,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import ZText from './ZText';
import { moderateScale } from '../../common/constants';
import request from '../../api/request';
import strings from '../../i18n/strings';
import { StackNav } from '../../navigation/NavigationKeys';
import images from '../../assets/images';

/**
 * FeaturedReviewsSection - Premium review video cards
 * Horizontal scroll with thumbnail + rating overlay
 */
const FeaturedReviewsSection = ({ chefId, chefProfile, limit = 5 }) => {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;

    // Fetch chef's reviews
    const { data: reviewsData, isLoading, error } = useQuery(
        ['chefFeaturedReviews', chefId],
        async () => {
            const response = await request.get(`/story/author?limit=${limit}&page=1&id=${chefId}&receivedReviews=true`);
            return response.data?.stories || [];
        },
        {
            enabled: !!chefId,
            staleTime: 1000 * 60 * 5,
        }
    );

    const handleSeeMore = useCallback(() => {
        navigation.navigate(StackNav.SingleReel, {
            profile: chefProfile,
            storyId: null,
            customTitle: `${chefProfile?.fullName || ''} ${strings.reviewsTab || 'Reviews'}`,
            receivedReviews: true,
        });
    }, [navigation, chefProfile]);

    const handleReviewPress = useCallback((review) => {
        navigation.navigate(StackNav.SingleReel, {
            profile: chefProfile,
            storyId: review._id,
            customTitle: `${chefProfile?.fullName || ''} ${strings.reviewsTab || 'Reviews'}`,
            receivedReviews: true,
        });
    }, [navigation, chefProfile]);

    // Don't render if no reviews
    if (error || (!isLoading && (!reviewsData || reviewsData.length === 0))) {
        return null;
    }

    // Render stars
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i < fullStars ? 'star' : 'star-outline'}
                    size={13}
                    color="#FFD700"
                />
            );
        }
        return stars;
    };

    return (
        <View style={localStyles.container}>
            {/* Section Header */}
            <View style={localStyles.headerRow}>
                <View style={localStyles.titleRow}>
                    <View style={localStyles.iconBadge}>
                        <Ionicons name="star" size={12} color="#FFFFFF" />
                    </View>
                    <ZText type="B16" color={colors.textColor}>
                        {strings.featuredReviews || 'Reviews'}
                    </ZText>
                </View>
                {reviewsData?.length >= 1 && (
                    <TouchableOpacity
                        onPress={handleSeeMore}
                        activeOpacity={0.7}
                        style={localStyles.seeAllBtn}
                    >
                        <ZText type="B13" color="#FFA500">
                            {strings.seeMore || 'See All'}
                        </ZText>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color="#FFA500" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Review Video Cards */}
            {isLoading ? (
                <View style={localStyles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFD700" />
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.scrollContent}
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : null}
                >
                    {reviewsData?.map((review, index) => (
                        <TouchableOpacity
                            key={review._id || index}
                            style={[localStyles.reviewCard, isRTL && { transform: [{ scaleX: -1 }] }]}
                            onPress={() => handleReviewPress(review)}
                            activeOpacity={0.9}
                        >
                            <ImageBackground
                                source={
                                    review.poster
                                        ? { uri: review.poster }
                                        : review.video
                                            ? { uri: review.video }
                                            : images.dishplaceholder
                                }
                                style={localStyles.cardThumbnail}
                                imageStyle={localStyles.thumbnailImage}
                            >
                                {/* Gradient overlay */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={localStyles.gradientOverlay}
                                />

                                {/* Play indicator */}
                                <View style={localStyles.playIndicator}>
                                    <Ionicons name="play" size={12} color="#FFFFFF" />
                                </View>

                                {/* Bottom info: Avatar + Stars */}
                                <View style={localStyles.bottomInfo}>
                                    <Image
                                        source={
                                            review.author?.avatar
                                                ? { uri: review.author.avatar }
                                                : images.userDark
                                        }
                                        style={localStyles.miniAvatar}
                                    />
                                    <View style={localStyles.starsRow}>
                                        {renderStars(review.rating)}
                                    </View>
                                </View>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        paddingTop: moderateScale(6),
        paddingBottom: moderateScale(6),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        marginBottom: moderateScale(12),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBadge: {
        width: moderateScale(24),
        height: moderateScale(24),
        borderRadius: moderateScale(6),
        backgroundColor: '#FFB800',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(8),
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingRow: {
        height: moderateScale(100),
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: moderateScale(16),
        gap: moderateScale(10),
    },
    reviewCard: {
        width: moderateScale(75),
        height: moderateScale(100),
        borderRadius: moderateScale(10),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    thumbnailImage: {
        borderRadius: moderateScale(12),
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    playIndicator: {
        position: 'absolute',
        top: moderateScale(8),
        right: moderateScale(8),
        width: moderateScale(24),
        height: moderateScale(24),
        borderRadius: moderateScale(12),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(8),
    },
    miniAvatar: {
        width: moderateScale(26),
        height: moderateScale(26),
        borderRadius: moderateScale(13),
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        marginRight: moderateScale(6),
    },
    starsRow: {
        flexDirection: 'row',
        gap: 1,
    },
});

export default React.memo(FeaturedReviewsSection);
