// Library import
import React, { memo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Local imports
import ZText from './common/ZText';
import { moderateScale, getHeight, getWidth } from '../common/constants';
import { styles } from '../themes';
import { StackNav } from '../navigation/NavigationKeys';
import strings from '../i18n/strings';
import images from '../assets/images';
import DishCardCompact from './DishCardCompact';

/**
 * KitchenWithDishesCard - Premium card component showing a kitchen with their dishes
 * Features glassmorphism, gradient accents, micro-animations
 */
function KitchenWithDishesCard({
    kitchen,
    dishes = [],
    onAddToCart,
    style,
}) {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;

    const handleKitchenPress = () => {
        // Navigate to ChefMenu for kitchen profiles
        navigation.navigate(StackNav.ChefMenu, {
            chefId: kitchen?._id,
            chefName: kitchen?.fullName || kitchen?.username,
        });
    };

    const handleVisitMenu = () => {
        navigation.navigate(StackNav.ChefMenu, {
            chefId: kitchen?._id,
            chef: kitchen,
        });
    };

    const handleCheckReels = () => {
        navigation.navigate(StackNav.reelsOne, {
            profile: kitchen,
        });
    };

    const handleDishPress = (dish) => {
        navigation.navigate(StackNav.DishDetailScreen, {
            dishId: dish._id,
            dish: dish,
        });
    };

    // Data is normalized at source - use standardized 'rating' field
    const rating = kitchen?.rating || 0;
    const dishCount = dishes?.length || kitchen?.dishCount || 0;

    return (
        <View style={[localStyles.container, { backgroundColor: colors.inputBg }, style]}>
            {/* Kitchen Header */}
            <View style={[localStyles.header, isRTL && styles.flexRowReverse]}>
                <TouchableOpacity
                    onPress={handleKitchenPress}
                    style={[localStyles.kitchenInfo, isRTL && styles.flexRowReverse]}
                    activeOpacity={0.7}
                >
                    <Image
                        source={kitchen?.avatar ? { uri: kitchen.avatar } : images.userDark}
                        style={localStyles.avatar}
                    />
                    <View style={[localStyles.kitchenDetails, isRTL && styles.itemsEnd]}>
                        <ZText type="b16" numberOfLines={1}>{kitchen?.fullName || kitchen?.username || strings.unknownChef}</ZText>
                        <View style={[localStyles.ratingRow, isRTL && styles.flexRowReverse]}>
                            <Ionicons name="star" size={14} color={colors.yellow} />
                            <ZText type="m12" color={colors.grayScale5} style={styles.ml5}>
                                {rating.toFixed(1)} • {dishCount} {dishes?.length === 1 ? 'dish' : 'dishes'}
                            </ZText>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={[localStyles.actionButtons, isRTL && styles.flexRowReverse]}>
                    <TouchableOpacity
                        onPress={handleCheckReels}
                        style={localStyles.reelsButton}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#9C27B0', '#E040FB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={localStyles.gradientButton}
                        >
                            <MaterialCommunityIcons name="movie-open-play" size={14} color={colors.white} />
                            <ZText type="s12" color={colors.white} style={styles.ml5}>{strings.reelsTab || 'Reels'}</ZText>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleVisitMenu}
                        style={localStyles.menuButton}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.lightRed]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={localStyles.gradientButton}
                        >
                            <Ionicons name="restaurant-outline" size={14} color={colors.white} />
                            <ZText type="s12" color={colors.white} style={styles.ml5}>{strings.visitMenu}</ZText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dishes Horizontal Scroll */}
            {dishes && dishes.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.dishesContainer}
                    style={[
                        localStyles.dishesScroll,
                        isRTL && { transform: [{ scaleX: -1 }] },
                    ]}
                >
                    {dishes.map((dish, index) => (
                        <View
                            key={dish._id || index}
                            style={[
                                localStyles.dishCard,
                                index === dishes.length - 1 && localStyles.lastDishCard,
                                isRTL && { transform: [{ scaleX: -1 }] },
                            ]}
                        >
                            <DishCardCompact
                                dish={dish}
                                onPress={() => handleDishPress(dish)}
                                onAddToCart={() => onAddToCart?.(dish)}
                            />
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Empty state for no dishes */}
            {(!dishes || dishes.length === 0) && (
                <View style={localStyles.emptyDishes}>
                    <ZText type="m14" color={colors.grayScale5} align="center">
                        {strings.noDishesFound}
                    </ZText>
                    <TouchableOpacity onPress={handleVisitMenu} style={styles.mt10}>
                        <ZText type="b14" color={colors.primary}>{strings.viewMenu}</ZText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        borderRadius: moderateScale(16),
        marginHorizontal: moderateScale(16),
        marginBottom: moderateScale(16),
        padding: moderateScale(16),
        // Glassmorphism shadow
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        ...styles.rowSpaceBetween,
        marginBottom: moderateScale(12),
    },
    kitchenInfo: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        flex: 1,
    },
    avatar: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        borderWidth: 2,
        borderColor: '#FF4D67',
    },
    kitchenDetails: {
        marginLeft: moderateScale(12),
        flex: 1,
        marginRight: moderateScale(8),
    },
    ratingRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        marginTop: moderateScale(4),
    },
    actionButtons: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        gap: moderateScale(8),
    },
    iconButton: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        ...styles.center,
    },
    reelsButton: {
        borderRadius: moderateScale(18),
        overflow: 'hidden',
    },
    menuButton: {
        borderRadius: moderateScale(18),
        overflow: 'hidden',
    },
    gradientButton: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
    },
    dishesScroll: {
        marginHorizontal: -moderateScale(16),
    },
    dishesContainer: {
        paddingHorizontal: moderateScale(16),
    },
    dishCard: {
        marginRight: moderateScale(12),
    },
    lastDishCard: {
        marginRight: 0,
    },
    emptyDishes: {
        ...styles.center,
        paddingVertical: moderateScale(20),
    },
});

export default memo(KitchenWithDishesCard);
