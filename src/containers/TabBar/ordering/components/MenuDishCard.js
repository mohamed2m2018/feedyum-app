import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showErrorToast } from '../../../../utils/toast';
import { formatDistance, getLocalizedText } from '../../../../utils/helpers';
import { moderateScale } from '../../../../common/constants';
import ZText from '../../../../components/common/ZText';
import { StackNav } from '../../../../navigation/NavigationKeys';
import strings from '../../../../i18n/strings';

/**
 * Delivery Hero-style menu item card.
 * - With image: horizontal row — text left, square thumbnail right, + overlapping image.
 * - Without image: clean text row — text left, + button right-aligned.
 */
const MenuDishCard = ({
  dish,
  chefId,
  cartItems,
  isChefClosed,
  deliveryData,
  onQuantityChange,
  user,
  hasMultipleCategories = false,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const currentQuantity = cartItems
    .filter(item => item.dishId === dish._id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const isAvailable = dish.visible !== false;
  const isUponRequest = dish.pricingType === 'upon_request';
  const isChefUser = user?.type === 'chef';
  const isOwnMenu = user?._id?.toString() === chefId?.toString();
  const canOrder = !isOwnMenu && !isChefUser;
  const hasImage = !!dish.image && !dish.image.includes('placeholder');

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

  // Quantity controls (shared between image & no-image layouts)
  const renderQuantityControls = () => (
    <View style={s.quantityRow}>
      <TouchableOpacity
        style={[s.qtyBtn, { backgroundColor: colors.grayScale5 }]}
        onPress={() => onQuantityChange(dish, -1)}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="remove" size={moderateScale(14)} color={colors.white} />
      </TouchableOpacity>
      <ZText type="B14" color={colors.primary}>{currentQuantity}</ZText>
      <TouchableOpacity
        style={[s.qtyBtn, { backgroundColor: colors.primary }]}
        onPress={handleAdd}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="add" size={moderateScale(14)} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Add button
  const renderAddBtn = (size = 30) => (
    <TouchableOpacity
      style={[s.addBtn, {
        backgroundColor: colors.primary,
        width: moderateScale(size),
        height: moderateScale(size),
        borderRadius: moderateScale(size / 2),
      }]}
      onPress={handleAdd}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="add" size={moderateScale(size * 0.6)} color={colors.white} />
    </TouchableOpacity>
  );

  // Unavailable indicator
  const renderUnavailable = () => (
    <View style={[s.unavailableBadge, { backgroundColor: colors.grayScale3 }]}>
      <Ionicons name="close-circle-outline" size={moderateScale(16)} color={colors.grayScale6} />
    </View>
  );

  // Right-side action for no-image cards (vertically centered)
  const renderRightAction = () => {
    if (!canOrder) return null;
    if (!isAvailable) return renderUnavailable();
    if (isUponRequest) return null; // No + button for upon_request — user taps card to go to DishDetail
    if (currentQuantity > 0) return renderQuantityControls();
    return renderAddBtn(32);
  };

  return (
    <TouchableOpacity
      style={[s.container, { borderBottomColor: colors.bColor || colors.grayScale3 }]}
      onPress={() => navigation.navigate(StackNav.DishDetail, { dishId: dish._id, chefId })}
      activeOpacity={0.7}
    >
      {/* Text info */}
      <View style={s.textSection}>
        <ZText type="B16" numberOfLines={1} color={colors.textColor} style={s.name}>
          {getLocalizedText(dish.name, dish.nameArabic, dish.nameEnglish)}
        </ZText>

        {dish.description && (
          <ZText type="M13" numberOfLines={2} color={colors.grayScale7} style={s.description}>
            {getLocalizedText(dish.description, dish.descriptionArabic, dish.descriptionEnglish)}
          </ZText>
        )}

        <View style={s.priceRow}>
          <ZText type="B16" color={isUponRequest ? colors.primary : colors.textColor}>
            {isUponRequest
              ? strings.uponRequest
              : `${strings.currency} ${dish.price?.toFixed(2) || '0.00'}`}
          </ZText>
          {hasMultipleCategories && (dish.section || dish.category) && (() => {
            const sectionObj = typeof dish.section === 'object' ? dish.section : null;
            const label = sectionObj
              ? (I18nManager.isRTL
                  ? (sectionObj.nameArabic || sectionObj.name)
                  : (sectionObj.nameEnglish || sectionObj.name))
              : dish.category;
            return label ? (
              <View style={[s.categoryBadge, { backgroundColor: colors.primary + '12' }]}>
                <ZText type="M10" color={colors.primary} style={s.categoryText}>
                  {label}
                </ZText>
              </View>
            ) : null;
          })()}
        </View>
      </View>

      {/* Right side: image with overlapping action, OR just a right-aligned action */}
      {hasImage ? (
        <View style={s.imageSection}>
          <Image source={{ uri: dish.image }} style={s.thumbnail} />
          {/* Only the single + button overlaps the image */}
          {canOrder && isAvailable && !isUponRequest && currentQuantity === 0 && (
            <View style={s.imageActionOverlay}>
              {renderAddBtn(30)}
            </View>
          )}
          {canOrder && !isAvailable && (
            <View style={s.imageActionOverlay}>
              {renderUnavailable()}
            </View>
          )}
          {/* Quantity controls sit below the image */}
          {canOrder && isAvailable && !isUponRequest && currentQuantity > 0 && (
            <View style={s.imageBelowAction}>
              {renderQuantityControls()}
            </View>
          )}
        </View>
      ) : (
        <View style={s.noImageAction}>
          {renderRightAction()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const THUMB = moderateScale(90);

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  name: {
    fontWeight: '600',
    marginBottom: moderateScale(3),
  },
  description: {
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(6),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(2),
  },
  categoryBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  categoryText: {
    fontWeight: '500',
    fontSize: moderateScale(9),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Image layout
  imageSection: {
    position: 'relative',
  },
  thumbnail: {
    width: THUMB,
    height: THUMB,
    borderRadius: moderateScale(14),
    resizeMode: 'cover',
  },
  imageActionOverlay: {
    position: 'absolute',
    bottom: moderateScale(-6),
    right: moderateScale(-6),
  },
  imageBelowAction: {
    alignItems: 'center',
    marginTop: moderateScale(6),
  },
  // No-image layout: action sits on the right, vertically centered
  noImageAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: moderateScale(4),
  },
  // Shared action styles
  addBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  qtyBtn: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(MenuDishCard);
