// Library import
import React, { memo, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    I18nManager,
    Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import strings from '../i18n/strings';
import images from '../assets/images';
import request from '../api/request';
import { useLocation } from '../navigation/locationContext';
import branchService from '../api/branchService';
import {
    addToCart,
    selectCartItems,
    selectPendingConflictItem,
    clearCartAndAddPending,
    clearPendingConflictItem,
} from '../redux/reducer/cartSlice';
import { showActionDialog, showSuccessToast, showErrorToast, ALERT_TYPE } from '../utils/toast';
import { StackNav } from '../navigation/NavigationKeys';

/**
 * DishCardCompact - Dish card with two variants:
 *   - "compact" (default): Small card for horizontal lists
 *   - "full": Full-width card with large image, used in KitchenWithDishesCard
 */
function DishCardCompact({
    dish,
    onPress,
    onAddToCart,
    style,
    variant = 'compact',
}) {
    const colors = useSelector(state => state.theme.theme);
    const cartItems = useSelector(selectCartItems);
    const pendingConflictItem = useSelector(selectPendingConflictItem);
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;
    const [scaleAnim] = useState(new Animated.Value(1));

    const isFull = variant === 'full';

    // Get quantity from Redux cart state
    const quantity = cartItems.find(item => item.dishId === dish?._id)?.quantity || 0;

    // Derive chefId from dish data
    const chef = dish?.user || dish?.chef;
    const effectiveChefId = chef?._id || dish?.userId || dish?.chefId;

    // Get user's location for delivery check
    const location = useLocation();
    const userLat = location?.latitude;
    const userLng = location?.longitude;

    // Check delivery eligibility
    const { data: deliveryData } = useQuery(
        ['deliveryEligibility', effectiveChefId, userLat, userLng],
        async () => {
            const response = await request.get(
                `/orders/check-delivery/${effectiveChefId}?lat=${userLat}&long=${userLng}`
            );
            return response.data;
        },
        {
            enabled: !!effectiveChefId && !!userLat && !!userLng,
            staleTime: 1000 * 60 * 5,
        }
    );

    // Check if chef is currently open
    const { data: openStatusData } = useQuery(
        ['chefOpenStatus', effectiveChefId],
        () => branchService.getChefOpenStatus(effectiveChefId),
        {
            enabled: !!effectiveChefId,
            staleTime: 1000 * 60 * 2,
        }
    );
    const isChefClosed = openStatusData?.success === true && !openStatusData?.isOpen;

    // Handle cart conflict
    useEffect(() => {
        if (pendingConflictItem) {
            showActionDialog({
                type: ALERT_TYPE.WARNING,
                title: strings.differentChefTitle,
                message: strings.differentChefMessage,
                confirmText: strings.clearCart,
                cancelText: strings.viewCart,
                onConfirm: () => {
                    dispatch(clearCartAndAddPending());
                    showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, pendingConflictItem.dish?.name));
                },
                onCancel: () => {
                    dispatch(clearPendingConflictItem());
                    navigation.navigate(StackNav.ShoppingCart);
                },
            });
        }
    }, [pendingConflictItem, dispatch, navigation]);

    const handleAddPress = () => {
        // Block if restaurant is closed
        if (isChefClosed) {
            showErrorToast(
                strings.restaurantClosed || 'Restaurant Closed',
                strings.restaurantClosedCannotOrder || 'This restaurant is currently closed'
            );
            return;
        }
        // Block if kitchen doesn't deliver
        if (deliveryData && !deliveryData.canDeliver) {
            const distanceInfo = deliveryData.nearestDistance
                ? ` (${(strings.distanceAway || '{0} km').replace('{0}', deliveryData.nearestDistance)})`
                : '';
            showErrorToast(
                strings.doesNotDeliverHere || 'Does not deliver here',
                (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
            );
            return;
        }

        // Animate button
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.15,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();

        dispatch(addToCart({
            dish: dish,
            chefId: effectiveChefId,
            chefName: chef?.fullName || chef?.username || 'Unknown Kitchen',
            quantity: 1,
        }));

        onAddToCart?.(dish);
    };

    const handleCardPress = () => {
        onPress?.(dish);
    };

    const price = dish?.price || 0;
    const rating = dish?.averageRating || 0;
    const imageUri = dish?.poster || dish?.image || dish?.avatarUri;

    // ─── Full variant (large card inside KitchenWithDishesCard) ───
    if (isFull) {
        return (
            <TouchableOpacity
                onPress={handleCardPress}
                activeOpacity={0.95}
                style={[fullStyles.container, style]}
            >
                {/* Large Image */}
                <View style={fullStyles.imageContainer}>
                    <Image
                        source={imageUri ? { uri: imageUri } : images.post}
                        style={fullStyles.image}
                        resizeMode="cover"
                    />
                </View>

                {/* Info Row */}
                <View style={[fullStyles.infoRow, isRTL && styles.flexRowReverse]}>
                    <View style={[fullStyles.textBlock, isRTL && styles.itemsEnd]}>
                        <ZText type="b16" numberOfLines={1}>
                            {dish?.name || strings.unknownDish}
                        </ZText>
                        <View style={[fullStyles.priceRow, isRTL && styles.flexRowReverse]}>
                            <ZText type="b14" color={colors.textColor}>
                                {price} {strings.EGP}
                            </ZText>
                            {rating > 0 && (
                                <View style={[fullStyles.ratingInline, isRTL && styles.flexRowReverse]}>
                                    <Ionicons name="star" size={13} color="#FFD700" />
                                    <ZText type="m12" color={colors.grayScale5} style={styles.ml5}>
                                        {rating.toFixed(1)}
                                    </ZText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Add Button */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            onPress={handleAddPress}
                            activeOpacity={0.8}
                            style={[fullStyles.addButton, { backgroundColor: colors.primary }]}
                        >
                            {quantity > 0 ? (
                                <ZText type="b14" color={colors.white}>{quantity}</ZText>
                            ) : (
                                <Ionicons name="add" size={22} color={colors.white} />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        );
    }

    // ─── Compact variant (default, for standalone horizontal lists) ───
    return (
        <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.9}
            style={[compactStyles.container, { backgroundColor: colors.btnColor1 }, style]}
        >
            {/* Dish Image */}
            <View style={compactStyles.imageContainer}>
                <Image
                    source={imageUri ? { uri: imageUri } : images.post}
                    style={compactStyles.image}
                    resizeMode="cover"
                />
                {rating > 0 && (
                    <View style={[compactStyles.ratingBadge, { backgroundColor: colors.darkBg + 'CC' }]}>
                        <Ionicons name="star" size={10} color={colors.yellow} />
                        <ZText type="m10" color={colors.white} style={styles.ml5}>
                            {rating.toFixed(1)}
                        </ZText>
                    </View>
                )}
            </View>

            {/* Dish Info */}
            <View style={compactStyles.infoContainer}>
                <ZText type="b14" numberOfLines={1} style={compactStyles.dishName}>
                    {dish?.name || strings.unknownDish}
                </ZText>

                <View style={[compactStyles.priceRow, isRTL && styles.flexRowReverse]}>
                    <ZText type="b14" color={colors.primary}>
                        {price} {strings.EGP}
                    </ZText>

                    <View style={[compactStyles.ratingDisplay, isRTL && styles.flexRowReverse]}>
                        <Ionicons
                            name="star"
                            size={12}
                            color={rating > 0 ? colors.yellow : colors.grayScale6}
                        />
                        <ZText
                            type="m12"
                            color={rating > 0 ? colors.textColor : colors.grayScale6}
                            style={styles.ml5}
                        >
                            {rating > 0 ? rating.toFixed(1) : '-'}
                        </ZText>
                    </View>
                </View>
            </View>

            {/* Add to Cart Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    onPress={handleAddPress}
                    activeOpacity={0.8}
                    style={[compactStyles.addButton, { backgroundColor: colors.primary }]}
                >
                    {quantity > 0 ? (
                        <ZText type="b12" color={colors.white}>{quantity}</ZText>
                    ) : (
                        <Ionicons name="add" size={18} color={colors.white} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Full variant styles ───
const fullStyles = StyleSheet.create({
    container: {
        borderRadius: moderateScale(12),
        overflow: 'hidden',
    },
    imageContainer: {
        borderRadius: moderateScale(12),
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: moderateScale(180),
    },
    infoRow: {
        ...styles.rowSpaceBetween,
        ...styles.itemsCenter,
        paddingTop: moderateScale(10),
        paddingBottom: moderateScale(2),
    },
    textBlock: {
        flex: 1,
        marginRight: moderateScale(12),
    },
    priceRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        marginTop: moderateScale(2),
        gap: moderateScale(8),
    },
    ratingInline: {
        ...styles.flexRow,
        ...styles.itemsCenter,
    },
    addButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        ...styles.center,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
});

// ─── Compact variant styles ───
const compactStyles = StyleSheet.create({
    container: {
        width: moderateScale(140),
        borderRadius: moderateScale(12),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: moderateScale(100),
        borderTopLeftRadius: moderateScale(12),
        borderTopRightRadius: moderateScale(12),
    },
    ratingBadge: {
        position: 'absolute',
        top: moderateScale(8),
        left: moderateScale(8),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(6),
        paddingVertical: moderateScale(2),
        borderRadius: moderateScale(8),
    },
    infoContainer: {
        padding: moderateScale(10),
        paddingBottom: moderateScale(6),
    },
    dishName: {
        marginBottom: moderateScale(4),
    },
    priceRow: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        ...styles.justifyBetween,
        paddingRight: moderateScale(36),
    },
    ratingDisplay: {
        ...styles.flexRow,
        ...styles.itemsCenter,
    },
    addButton: {
        position: 'absolute',
        bottom: moderateScale(8),
        right: moderateScale(8),
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        ...styles.center,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default memo(DishCardCompact);
