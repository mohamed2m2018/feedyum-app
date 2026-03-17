import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showErrorToast } from '../../../../utils/toast';
import { formatDistance } from '../../../../utils/helpers';
import { moderateScale } from '../../../../common/constants';
import ZText from '../../../../components/common/ZText';
import StarRating from '../../../../components/StarRating';
import images from '../../../../assets/images';
import { StackNav } from '../../../../navigation/NavigationKeys';
import strings from '../../../../i18n/strings';
import styles from '../chefMenuStyles';

/**
 * Individual dish card for the chef menu list.
 */
const MenuDishCard = ({
  dish,
  chefId,
  cartItems,
  isChefClosed,
  deliveryData,
  onQuantityChange,
  user,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  // Read quantity from Redux cart (sum all entries for this dish)
  const currentQuantity = cartItems
    .filter(item => item.dishId === dish._id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const isAvailable = dish.visible !== false;

  const handleAdd = () => {
    if (isChefClosed) {
      showErrorToast(strings.restaurantClosed, strings.restaurantClosedCannotOrder);
      return;
    }
    if (deliveryData && !deliveryData.canDeliver) {
      const distanceInfo = deliveryData.nearestDistance
        ? ` (${(strings.distanceAway || '{0} km').replace('{0}', formatDistance(deliveryData.nearestDistance))})`
        : '';
      showErrorToast(
        strings.doesNotDeliverHere || 'Does not deliver here',
        (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
      );
      return;
    }
    onQuantityChange(dish, 1);
  };

  return (
    <TouchableOpacity
      style={[styles.dishCard, { backgroundColor: colors.backgroundColor }]}
      onPress={() => navigation.navigate(StackNav.DishDetail, { dishId: dish._id, chefId })}
      activeOpacity={0.9}
    >
      {/* Hero Image */}
      <View style={styles.heroImageContainer}>
        <Image
          source={dish.image ? { uri: dish.image } : images.dishplaceholder}
          style={styles.heroImage}
        />
        <View style={styles.topGradient} />
      </View>

      {/* Content */}
      <View style={styles.dishContent}>
        <View style={styles.dishInfo}>
          <ZText type="B16" numberOfLines={1} color={colors.textColor} style={styles.dishName}>
            {dish.name}
          </ZText>

          {dish.description && (
            <ZText type="M12" numberOfLines={2} color={colors.grayScale7} style={styles.dishDescription}>
              {dish.description}
            </ZText>
          )}

          {/* Rating */}
          <StarRating
            rating={Number.isFinite(dish?.average_rating)
              ? dish.average_rating
              : (Number.isFinite(dish?.rating) ? dish.rating : 0)}
            size="small"
            showText={false}
            showCount={false}
            showWhenNoRating={true}
            style={{ marginBottom: moderateScale(6) }}
          />

          {/* Price + Category */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <ZText type="B18" color={colors.primary}>
                {strings.currency} {dish.price?.toFixed(2) || '0.00'}
              </ZText>
              {dish.category && (
                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
                  <ZText type="M10" color={colors.primary} style={styles.categoryText}>
                    {dish.category}
                  </ZText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {user?._id?.toString() === chefId?.toString() ? null : isAvailable ? (
            currentQuantity > 0 ? (
              <View style={styles.quantityController}>
                <TouchableOpacity
                  style={[styles.quantityControl, { backgroundColor: colors.grayScale4 }]}
                  onPress={() => onQuantityChange(dish, -1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={moderateScale(20)} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.quantityBadge}>
                  <ZText type="B20" color={colors.primary}>{currentQuantity}</ZText>
                </View>

                <TouchableOpacity
                  style={[styles.quantityControl, { backgroundColor: colors.primary }]}
                  onPress={handleAdd}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={moderateScale(20)} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={moderateScale(20)} color={colors.white} />
                <ZText type="B14" color={colors.white}>{strings.addToCart}</ZText>
              </TouchableOpacity>
            )
          ) : (
            <View style={[styles.unavailableState, { backgroundColor: colors.grayScale2 }]}>
              <Ionicons name="close-circle-outline" size={moderateScale(20)} color={colors.grayScale6} />
              <ZText type="M16" color={colors.grayScale6}>{strings.currentlyUnavailable}</ZText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(MenuDishCard);
