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
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import { StackNav } from '../navigation/NavigationKeys';
import strings from '../i18n/strings';
import images from '../assets/images';
import DishCardCompact from './DishCardCompact';

/**
 * KitchenWithDishesCard - Modern compact card component showing a kitchen with their dishes
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

    const rating = kitchen?.rating || 0;
    const dishCount = dishes?.length || kitchen?.dishCount || 0;

    return (
        <View style={[localStyles.container, { backgroundColor: colors.inputBg }, style]}>
            {/* Subtle top highlight */}
            <View style={[localStyles.topHighlight, { backgroundColor: colors.white + '08' }]} />

            {/* Kitchen Header */}
            <View style={[localStyles.header, isRTL && styles.flexRowReverse]}>
                <TouchableOpacity
                    onPress={handleKitchenPress}
                    style={[localStyles.kitchenInfo, isRTL && styles.flexRowReverse]}
                    activeOpacity={0.7}
                >
                    {/* Avatar with gradient ring */}
                    <LinearGradient
                        colors={['#FF4D67', '#E040FB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={localStyles.avatarGradient}
                    >
                        <Image
                            source={kitchen?.avatar ? { uri: kitchen.avatar } : images.userDark}
                            style={localStyles.avatar}
                        />
                    </LinearGradient>

                    <View style={[localStyles.kitchenDetails, isRTL && styles.itemsEnd]}>
                        <View style={[localStyles.nameRow, isRTL && styles.flexRowReverse]}>
                            <ZText type="b16" numberOfLines={1} style={localStyles.kitchenName}>
                                {kitchen?.fullName || kitchen?.username || strings.unknownChef}
                            </ZText>
                            {rating >= 4 && (
                                <Ionicons name="checkmark-circle" size={14} color="#00C566" style={styles.ml5} />
                            )}
                        </View>
                        <View style={[localStyles.statsRow, isRTL && styles.flexRowReverse]}>
                            <Ionicons name="star" size={11} color="#FFD300" />
                            <ZText type="m11" color={colors.grayScale5} style={styles.ml5}>
                                {rating.toFixed(1)} • {dishCount} {dishCount === 1 ? strings.dish : strings.dishes}
                            </ZText>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Icon-only Action Buttons */}
                <View style={[localStyles.actionButtons, isRTL && styles.flexRowReverse]}>
                    <TouchableOpacity
                        onPress={handleCheckReels}
                        activeOpacity={0.8}
                        style={[localStyles.iconButton, { backgroundColor: '#9C27B0' }]}
                    >
                        <MaterialCommunityIcons name="play" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleVisitMenu}
                        activeOpacity={0.8}
                        style={[localStyles.iconButton, { backgroundColor: colors.primary }]}
                    >
                        <Ionicons name="restaurant" size={16} color="#FFF" />
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

            {/* Empty state */}
            {(!dishes || dishes.length === 0) && (
                <View style={localStyles.emptyDishes}>
                    <ZText type="m12" color={colors.grayScale5} align="center">
                        {strings.noDishesFound}
                    </ZText>
                    <TouchableOpacity onPress={handleVisitMenu} style={localStyles.viewMenuLink}>
                        <ZText type="b12" color={colors.primary}>{strings.viewMenu}</ZText>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} style={styles.ml5} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        borderRadius: moderateScale(16),
        marginHorizontal: moderateScale(12),
        marginBottom: moderateScale(10),
        padding: moderateScale(12),
        overflow: 'hidden',
        // Modern soft shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    topHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        borderTopLeftRadius: moderateScale(16),
        borderTopRightRadius: moderateScale(16),
    },
    header: {
        ...styles.rowSpaceBetween,
        marginBottom: moderateScale(10),
    },
    kitchenInfo: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        flex: 1,
    },
    avatarGradient: {
        width: moderateScale(42),
        height: moderateScale(42),
        borderRadius: moderateScale(21),
        padding: moderateScale(2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: moderateScale(38),
        height: moderateScale(38),
        borderRadius: moderateScale(19),
    },
    kitchenDetails: {
        marginLeft: moderateScale(10),
        flex: 1,
    },
    nameRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
    },
    kitchenName: {
        flex: 1,
    },
    statsRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        marginTop: moderateScale(2),
    },
    actionButtons: {
        ...styles.flexRow,
        gap: moderateScale(8),
    },
    iconButton: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        ...styles.center,
    },
    dishesScroll: {
        marginHorizontal: -moderateScale(12),
    },
    dishesContainer: {
        paddingHorizontal: moderateScale(12),
    },
    dishCard: {
        marginRight: moderateScale(8),
    },
    lastDishCard: {
        marginRight: 0,
    },
    emptyDishes: {
        ...styles.center,
        paddingVertical: moderateScale(16),
    },
    viewMenuLink: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        marginTop: moderateScale(6),
    },
});

export default memo(KitchenWithDishesCard);
