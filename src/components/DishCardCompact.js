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
import LinearGradient from 'react-native-linear-gradient';

// Local imports
import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import strings from '../i18n/strings';
import images from '../assets/images';
import request from '../api/request';
import { useLocation } from '../navigation/locationContext';
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
 * DishCardCompact - Compact dish card for horizontal lists
 * Features: image, name, price, rating, add-to-cart with micro-animations
 */
function DishCardCompact({
    dish,
    onPress,
    onAddToCart,
    style,
}) {
    const colors = useSelector(state => state.theme.theme);
    const cartItems = useSelector(selectCartItems);
    const pendingConflictItem = useSelector(selectPendingConflictItem);
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const isRTL = I18nManager.isRTL;
    const [scaleAnim] = useState(new Animated.Value(1));

    // Get quantity from Redux cart state (synced with actual cart)
    const quantity = cartItems.find(item => item.dishId === dish?._id)?.quantity || 0;

    // Derive chefId from dish data
    const chef = dish?.user || dish?.chef;
    const effectiveChefId = chef?._id || dish?.userId || dish?.chefId;

    // Get user's location for delivery check - use current location (respects delivery address)
    const location = useLocation();
    const userLat = location?.latitude;
    const userLng = location?.longitude;

    // Check delivery eligibility to user's location
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
            staleTime: 1000 * 60 * 5, // 5 minutes
        }
    );

    // Handle cart conflict - show modal when user tries to add from different chef
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
        // Block if kitchen doesn't deliver to user's location
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
                toValue: 1.2,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();

        // Dispatch to Redux cart - pass full dish object and extract chef info
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

    return (
        <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.9}
            style={[localStyles.container, { backgroundColor: colors.btnColor1 }, style]}
        >
            {/* Dish Image */}
            <View style={localStyles.imageContainer}>
                <Image
                    source={imageUri ? { uri: imageUri } : images.post}
                    style={localStyles.image}
                    resizeMode="cover"
                />
                {/* Rating Badge */}
                {rating > 0 && (
                    <View style={[localStyles.ratingBadge, { backgroundColor: colors.darkBg + 'CC' }]}>
                        <Ionicons name="star" size={10} color={colors.yellow} />
                        <ZText type="m10" color={colors.white} style={styles.ml5}>
                            {rating.toFixed(1)}
                        </ZText>
                    </View>
                )}
            </View>

            {/* Dish Info */}
            <View style={localStyles.infoContainer}>
                <ZText type="b14" numberOfLines={1} style={localStyles.dishName}>
                    {dish?.name || strings.unknownDish}
                </ZText>

                <View style={[localStyles.priceRow, isRTL && styles.flexRowReverse]}>
                    <ZText type="b14" color={colors.primary}>
                        {price} {strings.EGP}
                    </ZText>

                    {/* Rating display */}
                    <View style={[localStyles.ratingDisplay, isRTL && styles.flexRowReverse]}>
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
                    style={localStyles.addButton}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.lightRed]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={localStyles.gradientAdd}
                    >
                        {quantity > 0 ? (
                            <ZText type="b12" color={colors.white}>{quantity}</ZText>
                        ) : (
                            <Ionicons name="add" size={18} color={colors.white} />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </TouchableOpacity>
    );
}

const localStyles = StyleSheet.create({
    container: {
        width: moderateScale(140),
        borderRadius: moderateScale(12),
        overflow: 'hidden',
        // Shadow
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
        paddingRight: moderateScale(36), // Space for add button
    },
    ratingDisplay: {
        ...styles.flexRow,
        ...styles.itemsCenter,
    },
    addButton: {
        position: 'absolute',
        bottom: moderateScale(8),
        right: moderateScale(8),
    },
    gradientAdd: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        ...styles.center,
        // Haptic-ready shadow
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default memo(DishCardCompact);
