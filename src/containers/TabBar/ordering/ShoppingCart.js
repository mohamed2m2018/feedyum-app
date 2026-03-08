import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showActionDialog, showErrorToast, showInfoToast, showSuccessToast } from '../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import ZText from '../../../components/common/ZText';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZButton from '../../../components/common/ZButton';
import AddressSelectionModal from '../../../components/AddressSelectionModal';
import request from '../../../api/request';

import { moderateScale } from '../../../common/constants';
import images from '../../../assets/images';
import strings from '../../../i18n/strings';
import { useHandleAuth } from '../../../utils/useHandleAuth';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartChef,
  selectCartPromocode,
  updateQuantity,
  removeFromCart,
  clearCart,
  applyPromocode,
  removePromocode,
} from '../../../redux/reducer/cartSlice';
import {
  placeOrder,
  selectOrderPlacing,
  selectOrderError,
  clearError as clearOrderError,
  setCurrentOrder,
} from '../../../redux/reducer/orderSlice';
import { getAddresses, setSelectedAddress } from '../../../redux/actions/addressActions';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';

const ShoppingCart = () => {

  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isGuest, handleAuthToast } = useHandleAuth();

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const chef = useSelector(selectCartChef);
  const appliedPromo = useSelector(selectCartPromocode);
  const isPlacingOrder = useSelector(selectOrderPlacing);
  const orderError = useSelector(selectOrderError);
  const { selectedAddress, addresses } = useSelector(state => state.address);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(null);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoExpanded, setPromoExpanded] = useState(false);

  // Load addresses when component mounts and set default if needed
  useEffect(() => {
    dispatch(getAddresses());
  }, [dispatch]);

  // Set default address if none selected but addresses exist
  useEffect(() => {
    if (!selectedAddress && addresses && addresses.length > 0) {
      // Find primary address or default to first
      const primary = addresses.find(addr => addr.isPrimary);
      dispatch(setSelectedAddress(primary || addresses[0]));
    }
  }, [addresses, selectedAddress, dispatch]);

  // Fetch calculated delivery fee when address or chef changes
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (!chef?.id || !selectedAddress) {
        setCalculatedDeliveryFee(null);
        return;
      }

      const lat = selectedAddress.location?.lat || selectedAddress.lat || selectedAddress.coordinates?.lat;
      const long = selectedAddress.location?.long || selectedAddress.long || selectedAddress.coordinates?.lng || selectedAddress.coordinates?.long;

      if (!lat || !long) {
        setCalculatedDeliveryFee(null);
        return;
      }

      try {
        setLoadingDeliveryFee(true);
        const response = await request.get(`/orders/check-delivery/${chef.id}?lat=${lat}&long=${long}`);
        if (response.data?.success && response.data?.canDeliver) {
          setCalculatedDeliveryFee(response.data.deliveryFee || 0);
        } else {
          setCalculatedDeliveryFee(null);
        }
      } catch (err) {
        console.log('Failed to fetch delivery fee:', err);
        setCalculatedDeliveryFee(null);
      } finally {
        setLoadingDeliveryFee(false);
      }
    };

    fetchDeliveryFee();
  }, [chef?.id, selectedAddress]);

  // Memoize expensive calculations
  const cartSummary = useMemo(() => ({
    itemCount: cartItems.length,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    formattedSubtotal: subtotal.toFixed(0)
  }), [cartItems, subtotal]);

  const handleQuantityChange = useCallback((dishId, newQuantity) => {
    if (newQuantity <= 0) {
      showActionDialog({
        type: ALERT_TYPE.WARNING,
        title: strings.removeItem,
        message: strings.areYouSureRemoveItem,
        confirmText: strings.removeFromCart,
        cancelText: strings.cancel,
        onConfirm: () => dispatch(removeFromCart({ dishId })),
      });
    } else {
      dispatch(updateQuantity({ dishId, quantity: newQuantity }));
    }
  }, [dispatch]);

  const handleRemoveItem = useCallback((dishId, dishName) => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.removeItem,
      message: strings.formatString(strings.removeItemFromCart, { dishName }),
      confirmText: strings.removeFromCart,
      cancelText: strings.cancel,
      onConfirm: () => dispatch(removeFromCart({ dishId })),
    });
  }, []);

  const handleClearCart = useCallback(() => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.clearCart,
      message: strings.areYouSureClearCart,
      confirmText: strings.clearAll,
      cancelText: strings.cancel,
      onConfirm: () => dispatch(clearCart()),
    });
  }, []);

  // Promo code handlers
  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoError(strings.enterPromoCode);
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
      const response = await request.post('/promocode/validate', {
        code,
        orderAmount: subtotal,
        chefId: chef?.id,
      });
      if (response.data?.success) {
        dispatch(applyPromocode({
          code: code.toUpperCase(),
          discountAmount: response.data.discountAmount,
          discountType: response.data.discountType,
        }));
        showSuccessToast(strings.successExclamation, strings.promoCodeApplied);
      } else {
        setPromoError(response.data?.message || strings.promoCodeInvalidMsg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || strings.failedToValidatePromoCode;
      setPromoError(msg);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, subtotal, chef?.id, dispatch]);

  const handleRemovePromo = useCallback(() => {
    dispatch(removePromocode());
    setPromoCode('');
    setPromoError('');
  }, [dispatch]);

  const handleCheckout = async () => {
    // Block guests from checkout
    if (isGuest) {
      handleAuthToast();
      return;
    }

    showActionDialog({
      type: ALERT_TYPE.INFO,
      title: strings.placeOrderConfirm,
      message: strings.deliveryFeeMessage,
      confirmText: strings.placeOrder,
      cancelText: strings.cancel,
      onConfirm: async () => {
        try {
          setIsCheckingOut(true);

          // Check if user has selected a delivery address
          if (!selectedAddress) {
            showInfoToast(
              strings.noDeliveryAddress || 'No Address',
              strings.selectDeliveryAddress || 'Please select a delivery address'
            );
            setIsCheckingOut(false);
            return;
          }

          // Validate chef ID
          if (!chef?.id) {
            showActionDialog({
              type: ALERT_TYPE.DANGER,
              title: strings.orderError,
              message: strings.chefMissingError,
              confirmText: strings.clearCart,
              cancelText: strings.cancel,
              onConfirm: () => {
                dispatch(clearCart());
                navigation.goBack();
              },
            });
            setIsCheckingOut(false);
            return;
          }

          // Validate cart items
          if (!cartItems || cartItems.length === 0) {
            showInfoToast(strings.orderError, strings.cartEmpty);
            setIsCheckingOut(false);
            return;
          }

          // Prepare order data to match backend API expectations
          const orderData = {
            chefId: chef.id,
            items: cartItems.map(item => ({
              dish: item.dishId,
              quantity: item.quantity,
            })),
            deliveryAddress: (() => {
              // Extract city from formatted address if area is not available
              let city = selectedAddress.streetDetails?.area || selectedAddress.city || '';

              if (!city && selectedAddress.formattedAddress) {
                // Try to extract city from formatted address (usually contains "Cairo" or other city names)
                const addressParts = selectedAddress.formattedAddress.split(',');
                const cityMatch = addressParts.find(part =>
                  part.trim().toLowerCase().includes('cairo') ||
                  part.trim().toLowerCase().includes('giza') ||
                  part.trim().toLowerCase().includes('alexandria')
                );
                if (cityMatch) {
                  city = cityMatch.trim();
                } else if (addressParts.length > 1) {
                  // Fallback: use the second-to-last part as city
                  city = addressParts[addressParts.length - 2]?.trim() || 'Cairo';
                } else {
                  city = 'Cairo'; // Default fallback
                }
              }

              // Build location object with coordinates - check multiple possible sources
              const location = {
                lat: selectedAddress.location?.lat || selectedAddress.lat || selectedAddress.coordinates?.lat || null,
                long: selectedAddress.location?.long || selectedAddress.long || selectedAddress.coordinates?.lng || selectedAddress.coordinates?.long || null
              };

              return {
                street: selectedAddress.streetDetails?.streetName || selectedAddress.formattedAddress || selectedAddress.nameLine || 'Address not specified',
                city: city || 'Cairo',
                state: selectedAddress.streetDetails?.state || '',
                zipCode: selectedAddress.streetDetails?.postalCode || '',
                nameLine: selectedAddress.formattedAddress || selectedAddress.nameLine || '',
                formattedAddress: selectedAddress.formattedAddress || selectedAddress.nameLine || '',
                streetDetails: selectedAddress.streetDetails,
                buildingDetails: selectedAddress.buildingDetails,
                // Include location in the format the backend expects
                location: location,
                // Also include direct lat/long as fallback
                lat: location.lat,
                long: location.long
              };
            })(),
            notes: specialInstructions || '', // Backend expects 'notes' not 'specialInstructions'
            ...(appliedPromo && {
              promocode: {
                code: appliedPromo.code,
                discountAmount: appliedPromo.discountAmount,
                discountType: appliedPromo.discountType,
              },
            }),
          };
          // Place real order using Redux thunk
          const newOrder = await dispatch(placeOrder(orderData));
          if (newOrder && newOrder._id) {
            // Clear the cart after successful order
            dispatch(clearCart());

            // Invalidate chat list queries to refresh the chat list
            queryClient.invalidateQueries(['orderChats']);
            queryClient.invalidateQueries(['chatList']);

            // Navigate to Orders screen directly
            navigation.navigate(StackNav.Orders);
          } else {
            throw new Error(strings.orderNotCreatedProperly || 'Order creation failed');
          }

        } catch (error) {
          console.log('Order Error Full:', JSON.stringify(error, null, 2));

          let errorMessage = strings.failedToPlaceOrder;
          let errorData = error?.response?.data || error;

          // Handle new distance-based delivery errors
          if (errorData?.error === 'missing_coordinates') {
            // Coordinates are required - tell user to reselect address
            errorMessage = strings.addressMissingCoordinates;
          } else if (errorData?.error === 'delivery_distance_exceeded') {
            // Too far from kitchen
            const { nearestDistance, maxDistance } = errorData;
            if (nearestDistance && maxDistance) {
              errorMessage = strings.kitchenTooFar
                .replace('{distance}', nearestDistance)
                .replace('{max}', maxDistance);
            } else {
              errorMessage = errorData.message || strings.failedToPlaceOrder;
            }
          } else if (errorData?.error === 'no_active_branches') {
            // Kitchen has no delivery locations
            errorMessage = strings.noActiveBranches;
          } else if (errorData?.error === 'delivery_area_not_supported') {
            // Legacy error handling (for backward compatibility)
            const { deliveryCity, supportedCities } = errorData;
            const validCitiesList = supportedCities && supportedCities.length > 0
              ? supportedCities.join(', ')
              : '';

            if (validCitiesList) {
              errorMessage = `${strings.chefDoesNotDeliverTo} ${deliveryCity || ''}. ${strings.theyDeliverTo}: ${validCitiesList}`;
            } else {
              errorMessage = errorData.message || strings.failedToPlaceOrder;
            }
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          showErrorToast(strings.orderFailed, errorMessage);
        } finally {
          setIsCheckingOut(false);
        }
      },
    });
  };

  const renderCartItem = useCallback(({ item }) => {
    return (
      <View style={[localStyles.cartItem, { backgroundColor: colors.white }]}>
        <Image
          source={item.dish?.image ? { uri: item.dish.image } : images.dishPlaceholder}
          style={localStyles.itemImage}
          resizeMode="cover"
        />

        <View style={localStyles.itemInfo}>
          {/* Dish Name Section - Always Visible */}
          <View style={localStyles.dishNameSection}>
            <ZText
              type="B18"
              numberOfLines={2}
              style={[localStyles.dishName, { color: '#000000', fontWeight: 'bold' }]}
            >
              {item.dish?.name || item.name || strings.testDishName}
            </ZText>
            <ZText type="M14" color={colors.primary} style={localStyles.dishPrice}>
              {item.dish?.price || item.price || 0} {strings.EGP}
            </ZText>
          </View>

          {/* Controls Section */}
          <View style={localStyles.controlsSection}>
            <View style={localStyles.quantityContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity - 1)}
                style={[localStyles.quantityButton, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="remove" size={moderateScale(14)} color={colors.textColor} />
              </TouchableOpacity>

              <View style={[localStyles.quantityBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <ZText type="B14" color={colors.primary} style={localStyles.quantityText}>
                  {item.quantity}
                </ZText>
              </View>

              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity + 1)}
                style={[localStyles.quantityButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={moderateScale(14)} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={localStyles.itemActions}>
              <ZText type="B14" color={colors.textColor} style={localStyles.itemTotal}>
                {((item.dish?.price || item.price || 0) * item.quantity).toFixed(0)} {strings.EGP}
              </ZText>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.dishId, item.dish?.name || item.name || 'Item')}
                style={localStyles.removeButton}>
                <Ionicons name="trash-outline" size={moderateScale(16)} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [colors, handleQuantityChange, handleRemoveItem]);

  const renderHeader = () => (
    <View style={[localStyles.headerContainer, { backgroundColor: colors.backgroundColor }]}>
      <View style={localStyles.chefInfo}>
        <Ionicons name="restaurant" size={moderateScale(24)} color={colors.primary} />
        <View style={localStyles.chefDetails}>
          <ZText type="B16" color={colors.textColor}>
            {strings.formatString(strings.orderFrom, chef.name)}
          </ZText>
          <ZText type="M14" color={colors.grayScale7}>
            {cartSummary.itemCount === 1 ? strings.oneItem : strings.formatString(strings.itemsCount, cartSummary.itemCount)}
          </ZText>
        </View>
        <TouchableOpacity onPress={handleClearCart}>
          <ZText type="M14" color={colors.error}>
            {strings.clearAll}
          </ZText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={[localStyles.footerContainer, { backgroundColor: colors.backgroundColor }]}>
      {/* Delivery Address Section */}
      <View style={localStyles.addressSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          {strings.deliveryAddress || 'Delivery Address'}
        </ZText>
        <TouchableOpacity
          style={[
            localStyles.addressDisplay,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor || colors.grayScale3
            }
          ]}
          onPress={() => setShowAddressModal(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ZText type="M14" color={colors.textColor} style={{ flex: 1 }}>
              {selectedAddress ?
                (selectedAddress.formattedAddress || selectedAddress.nameLine || strings.selectedLocation) :
                strings.noAddressSelected
              }
            </ZText>
            <Ionicons name="chevron-forward" size={16} color={colors.grayScale7} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Special Instructions Section */}
      <View style={localStyles.instructionsSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          {strings.specialInstructions}
        </ZText>
        <TextInput
          style={[
            localStyles.instructionsInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor || colors.grayScale3,
              color: colors.textColor,
            }
          ]}
          placeholder={strings.specialInstructionsPlaceholder}
          placeholderTextColor={colors.grayScale7}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline={true}
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
        <ZText type="M12" color={colors.grayScale7} style={localStyles.characterCount}>
          {strings.formatString('{0}/500', specialInstructions.length)}
        </ZText>
      </View>

      {/* Promo Code Section */}
      <View style={localStyles.promoSection}>
        {!appliedPromo ? (
          <>
            <TouchableOpacity
              onPress={() => setPromoExpanded(!promoExpanded)}
              style={localStyles.promoToggle}
            >
              <Ionicons name="pricetag-outline" size={moderateScale(18)} color={colors.primary} />
              <ZText type="M14" color={colors.primary} style={{ marginLeft: moderateScale(8), flex: 1 }}>
                {strings.havePromoCode}
              </ZText>
              <Ionicons
                name={promoExpanded ? 'chevron-up' : 'chevron-down'}
                size={moderateScale(16)}
                color={colors.primary}
              />
            </TouchableOpacity>
            {promoExpanded && (
              <View style={localStyles.promoInputRow}>
                <TextInput
                  style={[
                    localStyles.promoInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: promoError ? colors.error : (colors.borderColor || colors.grayScale3),
                      color: colors.textColor,
                    }
                  ]}
                  placeholder={strings.enterPromoCodePlaceholder}
                  placeholderTextColor={colors.grayScale7}
                  value={promoCode}
                  onChangeText={(text) => { setPromoCode(text); setPromoError(''); }}
                  autoCapitalize="characters"
                  editable={!promoLoading}
                />
                <TouchableOpacity
                  style={[
                    localStyles.promoApplyButton,
                    { backgroundColor: colors.primary, opacity: promoLoading ? 0.6 : 1 }
                  ]}
                  onPress={handleApplyPromo}
                  disabled={promoLoading}
                >
                  {promoLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <ZText type="B14" color={colors.white}>{strings.apply}</ZText>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {promoError ? (
              <ZText type="M12" color={colors.error} style={{ marginTop: moderateScale(6) }}>
                {promoError}
              </ZText>
            ) : null}
          </>
        ) : (
          <View style={[localStyles.promoAppliedRow, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="checkmark-circle" size={moderateScale(18)} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: moderateScale(8) }}>
              <ZText type="B14" color={colors.primary}>
                {appliedPromo.code}
              </ZText>
              <ZText type="M12" color={colors.grayScale7}>
                -{appliedPromo.discountAmount.toFixed(0)} {strings.EGP} {strings.discount.toLowerCase()}
              </ZText>
            </View>
            <TouchableOpacity onPress={handleRemovePromo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={moderateScale(22)} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={localStyles.summaryContainer}>
        <View style={localStyles.summaryRow}>
          <ZText type="M16" color={colors.textColor}>
            {strings.subtotal}
          </ZText>
          <ZText type="B16" color={colors.textColor}>
            {cartSummary.formattedSubtotal} {strings.EGP}
          </ZText>
        </View>

        <View style={localStyles.summaryRow}>
          <ZText type="M14" color={colors.grayScale7}>
            {strings.deliveryFee}
          </ZText>
          <ZText type="M14" color={calculatedDeliveryFee !== null ? colors.textColor : colors.grayScale7}>
            {loadingDeliveryFee
              ? (strings.loading || 'Loading...')
              : calculatedDeliveryFee !== null
                ? `${calculatedDeliveryFee} ${strings.EGP}`
                : strings.deliveryFeeTbd}
          </ZText>
        </View>
        {calculatedDeliveryFee !== null && (
          <ZText type="s12" color={colors.grayScale6} style={{ marginTop: moderateScale(-4), marginBottom: moderateScale(4) }}>
            {strings.deliveryFeeOverrideNote}
          </ZText>
        )}

        {appliedPromo && (
          <View style={localStyles.summaryRow}>
            <ZText type="M14" color={colors.primary}>
              {strings.discount}
            </ZText>
            <ZText type="B14" color={colors.primary}>
              -{appliedPromo.discountAmount.toFixed(0)} {strings.EGP}
            </ZText>
          </View>
        )}

        <View style={[localStyles.summaryRow, localStyles.totalRow]}>
          <ZText type="B18" color={colors.textColor}>
            {strings.total}
          </ZText>
          <ZText type="B18" color={colors.primary}>
            {(() => {
              const discount = appliedPromo?.discountAmount || 0;
              if (calculatedDeliveryFee !== null) {
                return `${Math.max(0, subtotal + calculatedDeliveryFee - discount).toFixed(0)} ${strings.EGP}`;
              }
              return `${Math.max(0, subtotal - discount).toFixed(0)} ${strings.EGP} ${strings.plusDelivery}`;
            })()}
          </ZText>
        </View>
      </View>

      <ZButton
        title={isCheckingOut ? strings.processing : strings.placeOrder}
        textType="B16"
        color={colors.white}
        containerStyle={[
          localStyles.checkoutButton,
          { backgroundColor: colors.primary }
        ]}
        onPress={handleCheckout}
        disabled={isCheckingOut}
      />
    </View>
  );

  // Move all useCallback hooks before any conditional returns
  const keyExtractor = useCallback((item) => item.dishId, []);
  const getItemLayout = useCallback((data, index) => ({
    length: moderateScale(100),
    offset: moderateScale(100) * index,
    index,
  }), []);

  if (cartItems.length === 0) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.shoppingCart} showBack />
        <View style={localStyles.emptyContainer}>
          <Ionicons name="basket-outline" size={moderateScale(80)} color={colors.grayScale7} />
          <ZText type="B18" color={colors.textColor} style={localStyles.emptyTitle}>
            {strings.cartEmpty}
          </ZText>
          <ZText type="M14" color={colors.grayScale7} align="center" style={localStyles.emptySubtitle}>
            {strings.addSomeDishes}
          </ZText>
          <ZButton
            title={strings.browseMenus}
            onPress={() => navigation.goBack()}
            containerStyle={localStyles.browseButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.shoppingCart} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter()}
          contentContainerStyle={localStyles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          getItemLayout={getItemLayout}
        />
      </KeyboardAvoidingView>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={(address) => {
          dispatch(setSelectedAddress(address));
          setShowAddressModal(false);
        }}
        addresses={addresses || []}
        selectedAddress={selectedAddress}
        onAddressUpdated={() => dispatch(getAddresses())}
      />
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  listContainer: {
    paddingBottom: moderateScale(20),
  },
  headerContainer: {
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  // Compact Cart Item Styles
  cartItem: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    padding: moderateScale(12),
  },
  itemImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dishNameSection: {
    marginBottom: moderateScale(8),
  },
  dishName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  dishPrice: {
    fontSize: moderateScale(14),
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
  },
  itemName: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  quantityButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    borderWidth: 1,
    minWidth: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    minWidth: moderateScale(20),
    textAlign: 'center',
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  itemTotal: {
    textAlign: 'right',
  },
  removeButton: {
    padding: moderateScale(4),
  },
  footerContainer: {
    padding: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: moderateScale(20),
  },
  summaryContainer: {
    marginBottom: moderateScale(20),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: moderateScale(12),
    marginTop: moderateScale(8),
  },
  checkoutButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  emptySubtitle: {
    marginBottom: moderateScale(30),
    lineHeight: moderateScale(20),
  },
  browseButton: {
    height: moderateScale(44),
    paddingHorizontal: moderateScale(30),
  },
  addressSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  addressDisplay: {
    marginTop: moderateScale(4),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  instructionsSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  instructionsInput: {
    marginTop: moderateScale(4),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    minHeight: moderateScale(80),
    fontSize: moderateScale(14),
    textAlignVertical: 'top',
  },
  characterCount: {
    marginTop: moderateScale(4),
    textAlign: 'right',
  },
  // Promo code styles
  promoSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  promoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
    gap: moderateScale(8),
  },
  promoInput: {
    flex: 1,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    fontSize: moderateScale(14),
  },
  promoApplyButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(70),
  },
  promoAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
  },
});

export default ShoppingCart;