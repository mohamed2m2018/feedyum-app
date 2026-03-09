/**
 * Centralized Reel Styles
 * All styles for reel sub-components in one place for maintainability
 */

import { StyleSheet } from 'react-native';
import {
    getHeight,
    isAndroid,
    moderateScale,
    screenFullHeight,
} from '../../../common/constants';
import { styles as themeStyles } from '../../../themes';

/**
 * Colors used across reel components
 */
export const reelColors = {
    primary: '#FF6B6B',
    gold: '#FFD700',
    white: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.25)',
    overlayDark: 'rgba(0, 0, 0, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassBackground: 'rgba(0, 0, 0, 0.4)',
    textShadow: 'rgba(0, 0, 0, 0.9)',
};

/**
 * Common shadow presets
 */
export const shadows = {
    text: {
        textShadowColor: reelColors.textShadow,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    textLight: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    glow: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
};

/**
 * ReelItem - Main container styles
 */
export const reelItemStyles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    innerContainer: {
        flex: 1,
    },
});

/**
 * ReelMediaPlayer - Video/Image layer styles
 */
export const mediaPlayerStyles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%',
    },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    video: {
        height: '100%',
        width: '100%',
        backgroundColor: 'transparent',
    },
    // Media type badge - LEFT side, BELOW review badge (at top:90)
    zoomIndicator: {
        position: 'absolute',
        top: moderateScale(130),
        left: moderateScale(14),
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderRadius: moderateScale(14),
        paddingHorizontal: moderateScale(6),
        paddingVertical: moderateScale(4),
        zIndex: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

/**
 * ReelOverlay - Bottom gradient and content container
 */
export const overlayStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 6,
        paddingHorizontal: 6,
        ...themeStyles.flexRow,
        ...themeStyles.itemsEnd,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 350,
    },
    contentContainer: {
        flex: 1,
    },
});

/**
 * ReelAuthorInfo - Avatar and user info styles
 */
export const authorInfoStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: moderateScale(30),
        left: 8,
        right: 8,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatarRing: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        borderWidth: 2,
        borderColor: reelColors.primary,
        padding: 1,
        ...shadows.glow,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: moderateScale(18),
    },
    userInfoContainer: {
        marginLeft: moderateScale(10),
        flex: 1,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: moderateScale(14),
        fontWeight: '700',
        color: reelColors.white,
        ...shadows.text,
        flex: 1,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(3),
        borderRadius: moderateScale(12),
        marginLeft: moderateScale(8),
    },
    ratingValue: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: reelColors.gold,
        ...shadows.textLight,
    },
    ratingStar: {
        fontSize: moderateScale(10),
        marginLeft: moderateScale(2),
    },
    followButton: {
        marginLeft: moderateScale(8),
    },
});

/**
 * ReelReviewBadge - Top corner review indicator
 */
export const reviewBadgeStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: moderateScale(90),
        left: moderateScale(14),
        zIndex: 20,
        ...shadows.card,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
    },
    text: {
        fontWeight: 'bold',
        marginLeft: moderateScale(4),
        fontSize: moderateScale(9),
        letterSpacing: 0.5,
    },
});

/**
 * ReelRestaurantBadge - Restaurant info badge for reviews
 */
export const restaurantBadgeStyles = StyleSheet.create({
    container: {
        borderRadius: moderateScale(10),
        paddingVertical: moderateScale(4),
        paddingHorizontal: moderateScale(8),
        marginTop: moderateScale(3),
        alignSelf: 'flex-start',
        backgroundColor: reelColors.glassBackground,
        borderWidth: 1,
        borderColor: reelColors.glassBorder,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.card,
    },
    icon: {
        marginRight: moderateScale(4),
    },
    textContainer: {
        flexShrink: 1,
    },
    name: {
        fontSize: moderateScale(12),
        color: reelColors.white,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 3,
        lineHeight: 16,
    },
    address: {
        fontSize: moderateScale(10),
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 1,
    },
    arrow: {
        marginLeft: moderateScale(6),
    },
});

/**
 * ReelActionBar - Vertical action icons
 */
export const actionBarStyles = StyleSheet.create({
    container: {
        ...themeStyles.ph5,
        ...themeStyles.mb50,
        ...themeStyles.pl5,
    },
});

/**
 * ReelCaption - Title and description
 */
export const captionStyles = StyleSheet.create({
    title: {
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    caption: {
        marginVertical: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    duration: {
        fontSize: 12,
        color: 'white',
        marginTop: 6,
        ...shadows.textLight,
    },
    seeMoreButton: {
        paddingBottom: 8,
        borderRadius: 5,
        justifyContent: 'center',
    },
});

/**
 * ReelDishesDisplay - Attached dishes section
 */
export const dishesDisplayStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: moderateScale(450),
        right: moderateScale(16),
        zIndex: 5,
    },
});

/**
 * ReelPauseIndicator - Play/pause overlay
 */
export const pauseIndicatorStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: screenFullHeight / 2 - moderateScale(110),
        ...themeStyles.selfCenter,
        borderRadius: moderateScale(100),
        backgroundColor: reelColors.overlay,
    },
});

/**
 * ReelLikeAnimation - Heart animation
 */
export const likeAnimationStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: screenFullHeight / 2 - moderateScale(160),
        ...themeStyles.selfCenter,
    },
});

/**
 * KM Away / Branches button
 */
export const kmAwayStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: moderateScale(35),
        zIndex: 999,
        left: moderateScale(15),
    },
    button: {
        height: 30,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
});

/**
 * Review-specific styles
 */
export const reviewStyles = StyleSheet.create({
    infoContainer: {
        marginTop: moderateScale(2),
        marginBottom: moderateScale(2),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    starIcon: {
        marginHorizontal: moderateScale(2),
    },
});

/**
 * Visit Menu button
 */
export const visitMenuStyles = StyleSheet.create({
    container: {
        height: getHeight(50),
        borderRadius: moderateScale(20),
        width: '100%',
        alignSelf: 'center',
    },
});

/**
 * Video Seeker styles (kept for reference, actual component uses VideoSeeker)
 */
export const seekerStyles = StyleSheet.create({
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
    seekBar: {
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
        ...shadows.textLight,
    },
});

export default {
    reelColors,
    shadows,
    reelItemStyles,
    mediaPlayerStyles,
    overlayStyles,
    authorInfoStyles,
    reviewBadgeStyles,
    restaurantBadgeStyles,
    actionBarStyles,
    captionStyles,
    dishesDisplayStyles,
    pauseIndicatorStyles,
    likeAnimationStyles,
    kmAwayStyles,
    reviewStyles,
    visitMenuStyles,
    seekerStyles,
};
