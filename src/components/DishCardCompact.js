// Library import
import React, { memo, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    I18nManager,
    Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Local imports
import ZText from './common/ZText';
import { moderateScale, getHeight } from '../common/constants';
import { styles } from '../themes';
import strings from '../i18n/strings';
import images from '../assets/images';
import { addToCart } from '../redux/reducer/cartSlice';

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
    const dispatch = useDispatch();
    const isRTL = I18nManager.isRTL;
    const [quantity, setQuantity] = useState(0);
    const [scaleAnim] = useState(new Animated.Value(1));

    const handleAddPress = () => {
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

        setQuantity(prev => prev + 1);

        // Dispatch to Redux cart
        dispatch(addToCart({
            _id: dish._id,
            name: dish.name,
            price: dish.price,
            image: dish.poster || dish.image,
            chef: dish.user || dish.chef,
            chefId: dish.user?._id || dish.userId || dish.chefId,
            quantity: 1,
        }));

        onAddToCart?.(dish);
    };

    const handleCardPress = () => {
        onPress?.(dish);
    };

    const price = dish?.price || 0;
    const rating = dish?.averageRating || dish?.rating || 0;
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
