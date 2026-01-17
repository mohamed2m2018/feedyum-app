// Library import
import React, { memo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Local imports
import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import { StackNav } from '../navigation/NavigationKeys';
import strings from '../i18n/strings';
import images from '../assets/images';

/**
 * ReviewCard - Displays a food review with reviewer info and thumbnail
 * Features: reviewer click → profile, check reels button
 */
function ReviewCard({
    review,
    style,
}) {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;

    const reviewer = review?.author || review?.user || {};
    const thumbnail = review?.avatarUri || review?.poster || review?.thumbnail;
    const title = review?.title || review?.caption || '';

    const handleReviewerPress = () => {
        navigation.navigate(StackNav.ProfileDetail, {
            userName: reviewer?.fullName || reviewer?.username,
            userImage: reviewer?.avatar,
            id: reviewer?._id,
        });
    };

    const handleCheckReels = () => {
        navigation.navigate(StackNav.reelsOne, {
            storyId: review?._id,
            profile: reviewer?._id,
        });
    };

    const handleCardPress = () => {
        navigation.navigate(StackNav.reelsOne, {
            storyId: review?._id,
            profile: reviewer?._id,
        });
    };

    return (
        <View style={[localStyles.container, { backgroundColor: colors.inputBg }, style]}>
            {/* Thumbnail */}
            <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
                <View style={localStyles.thumbnailContainer}>
                    <Image
                        source={thumbnail ? { uri: thumbnail } : images.post}
                        style={localStyles.thumbnail}
                        resizeMode="cover"
                    />
                    {/* Play Icon Overlay */}
                    <View style={localStyles.playOverlay}>
                        <View style={[localStyles.playButton, { backgroundColor: colors.primary }]}>
                            <Ionicons name="play" size={16} color={colors.white} style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Review Content */}
            <View style={localStyles.content}>
                {/* Reviewer Info */}
                <TouchableOpacity
                    onPress={handleReviewerPress}
                    style={[localStyles.reviewerRow, isRTL && styles.flexRowReverse]}
                    activeOpacity={0.7}
                >
                    <Image
                        source={reviewer?.avatar ? { uri: reviewer.avatar } : images.userDark}
                        style={localStyles.reviewerAvatar}
                    />
                    <View style={[localStyles.reviewerInfo, isRTL && styles.itemsEnd]}>
                        <ZText type="b14" numberOfLines={1}>
                            {reviewer?.fullName || reviewer?.username || 'Reviewer'}
                        </ZText>
                    </View>
                </TouchableOpacity>

                {/* Review Text */}
                {!!title && (
                    <ZText
                        type="m12"
                        numberOfLines={2}
                        color={colors.grayScale5}
                        style={localStyles.reviewText}
                    >
                        {title}
                    </ZText>
                )}

                {/* Check Reels Button */}
                <TouchableOpacity onPress={handleCheckReels} style={localStyles.checkReelsButton}>
                    <LinearGradient
                        colors={[colors.primary, colors.lightRed]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={localStyles.gradientButton}
                    >
                        <Ionicons name="videocam-outline" size={14} color={colors.white} />
                        <ZText type="s12" color={colors.white} style={styles.ml5}>
                            {strings.checkReels}
                        </ZText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: moderateScale(180),
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        ...styles.center,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playButton: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        ...styles.center,
    },
    content: {
        padding: moderateScale(12),
    },
    reviewerRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        marginBottom: moderateScale(8),
    },
    reviewerAvatar: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        borderWidth: 1.5,
        borderColor: '#FF4D67',
    },
    reviewerInfo: {
        marginLeft: moderateScale(10),
        flex: 1,
    },
    reviewText: {
        marginBottom: moderateScale(10),
    },
    checkReelsButton: {
        alignSelf: 'flex-start',
        borderRadius: moderateScale(16),
        overflow: 'hidden',
    },
    gradientButton: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(8),
    },
});

export default memo(ReviewCard);
