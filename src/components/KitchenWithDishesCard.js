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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
 * KitchenWithDishesCard - Premium card showing a kitchen with their dishes
 * Design: Clean header with chef info + icon buttons, single/scrollable large dish cards
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
        navigation.navigate(StackNav.SingleReel, {
            profile: kitchen,
        });
    };

    const handleDishPress = (dish) => {
        navigation.navigate(StackNav.DishDetail, {
            dishId: dish._id,
            dish: dish,
        });
    };

    const rating = kitchen?.rating || 0;
    const ratingCount = kitchen?.ratingCount || kitchen?.reviewCount || 0;

    return (
        <View style={[localStyles.container, { backgroundColor: colors.inputBg }, style]}>

            {/* Kitchen Header */}
            <View style={[localStyles.header, isRTL && styles.flexRowReverse]}>
                <TouchableOpacity
                    onPress={handleKitchenPress}
                    style={[localStyles.kitchenInfo, isRTL && styles.flexRowReverse]}
                    activeOpacity={0.7}
                >
                    {/* Avatar */}
                    <Image
                        source={kitchen?.avatar ? { uri: kitchen.avatar } : images.userDark}
                        style={localStyles.avatar}
                    />

                    <View style={[localStyles.kitchenDetails, isRTL && styles.itemsEnd]}>
                        <View style={[localStyles.nameRow, isRTL && styles.flexRowReverse]}>
                            <ZText type="b16" numberOfLines={1} style={localStyles.kitchenName}>
                                {kitchen?.fullName || kitchen?.username || strings.unknownChef}
                            </ZText>
                            {rating >= 4 && (
                                <Ionicons name="star" size={14} color="#FFD700" style={styles.ml5} />
                            )}
                        </View>
                        <View style={[localStyles.statsRow, isRTL && styles.flexRowReverse]}>
                            <ZText type="m12" color={colors.grayScale5}>
                                {rating.toFixed(1)} • {ratingCount} {ratingCount === 1 ? strings.review : (strings.review + 's')}
                            </ZText>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={[localStyles.actionButtons, isRTL && styles.flexRowReverse]}>
                    <TouchableOpacity
                        onPress={handleCheckReels}
                        activeOpacity={0.7}
                        style={[localStyles.iconButton, { backgroundColor: colors.white + '15' }]}
                    >
                        <MaterialCommunityIcons name="play" size={18} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleVisitMenu}
                        activeOpacity={0.7}
                        style={[localStyles.iconButton, { backgroundColor: colors.white + '15' }]}
                    >
                        <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dishes */}
            {dishes && dishes.length > 0 && (
                <View>
                    {/* Featured dish - first dish shown prominently */}
                    <DishCardCompact
                        dish={dishes[0]}
                        onPress={() => handleDishPress(dishes[0])}
                        onAddToCart={() => onAddToCart?.(dishes[0])}
                        variant="full"
                    />

                    {/* More dishes indicator */}
                    {dishes.length > 1 && (
                        <TouchableOpacity
                            onPress={handleVisitMenu}
                            activeOpacity={0.7}
                            style={localStyles.viewMoreRow}
                        >
                            <ZText type="b13" color={colors.primary}>
                                +{dishes.length - 1} {strings.moreDishes || 'more dishes'}
                            </ZText>
                            <Ionicons
                                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                                size={14}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
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
        marginBottom: moderateScale(12),
        padding: moderateScale(14),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
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
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
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
        gap: moderateScale(12),
        alignItems: 'center',
    },
    iconButton: {
        width: moderateScale(34),
        height: moderateScale(34),
        borderRadius: moderateScale(17),
        ...styles.center,
    },
    viewMoreRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        justifyContent: 'center',
        paddingTop: moderateScale(10),
        gap: moderateScale(4),
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
