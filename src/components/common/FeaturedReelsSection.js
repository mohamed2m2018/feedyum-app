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
 * FeaturedReelsSection - TikTok-style rectangular video thumbnails
 * Clean, content-focused design showing actual food content
 */
const FeaturedReelsSection = ({ chefId, chefProfile, limit = 6 }) => {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;

    // Fetch chef's reels
    const { data: reelsData, isLoading, error } = useQuery(
        ['chefFeaturedReels', chefId],
        async () => {
            const response = await request.get(`/story/author?limit=${limit}&page=1&id=${chefId}`);
            return response.data?.stories || [];
        },
        {
            enabled: !!chefId,
            staleTime: 1000 * 60 * 5,
        }
    );

    const handleSeeMore = useCallback(() => {
        navigation.navigate(StackNav.reelsOne, {
            profile: chefProfile,
            storyId: null,
        });
    }, [navigation, chefProfile]);

    const handleReelPress = useCallback((reel) => {
        navigation.navigate(StackNav.reelsOne, {
            profile: chefProfile,
            storyId: reel._id,
        });
    }, [navigation, chefProfile]);

    // Don't render if no reels
    if (error || (!isLoading && (!reelsData || reelsData.length === 0))) {
        return null;
    }

    return (
        <View style={localStyles.container}>
            {/* Section Header */}
            <View style={localStyles.headerRow}>
                <View style={localStyles.titleRow}>
                    <View style={[localStyles.iconBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="videocam" size={12} color="#FFFFFF" />
                    </View>
                    <ZText type="B16" color={colors.textColor}>
                        {strings.featuredReels || 'Videos'}
                    </ZText>
                </View>
                {reelsData?.length >= 1 && (
                    <TouchableOpacity
                        onPress={handleSeeMore}
                        activeOpacity={0.7}
                        style={localStyles.seeAllBtn}
                    >
                        <ZText type="B13" color={colors.primary}>
                            {strings.seeMore || 'See All'}
                        </ZText>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Video Thumbnails - TikTok style */}
            {isLoading ? (
                <View style={localStyles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.scrollContent}
                    style={isRTL ? { transform: [{ scaleX: -1 }] } : null}
                >
                    {reelsData?.map((reel, index) => (
                        <TouchableOpacity
                            key={reel._id || index}
                            style={[localStyles.videoCard, isRTL && { transform: [{ scaleX: -1 }] }]}
                            onPress={() => handleReelPress(reel)}
                            activeOpacity={0.9}
                        >
                            <ImageBackground
                                source={
                                    reel.poster
                                        ? { uri: reel.poster }
                                        : reel.avatarUri
                                            ? { uri: reel.avatarUri }
                                            : images.dishplaceholder
                                }
                                style={localStyles.videoThumbnail}
                                imageStyle={localStyles.thumbnailImage}
                            >
                                {/* Gradient overlay */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={localStyles.gradientOverlay}
                                />

                                {/* Play button */}
                                <View style={localStyles.playButton}>
                                    <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                </View>

                                {/* Views count */}
                                <View style={localStyles.viewsContainer}>
                                    <Ionicons name="eye" size={10} color="#FFFFFF" />
                                    <ZText type="B10" color="#FFFFFF" style={{ marginLeft: 3 }}>
                                        {reel.views > 1000 ? `${(reel.views / 1000).toFixed(1)}K` : reel.views || '0'}
                                    </ZText>
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
        paddingTop: moderateScale(12),
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
    videoCard: {
        width: moderateScale(75),
        height: moderateScale(100),
        borderRadius: moderateScale(10),
        overflow: 'hidden',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailImage: {
        borderRadius: moderateScale(12),
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    playButton: {
        width: moderateScale(34),
        height: moderateScale(34),
        borderRadius: moderateScale(17),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    viewsContainer: {
        position: 'absolute',
        bottom: moderateScale(6),
        left: moderateScale(6),
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default React.memo(FeaturedReelsSection);
