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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showActionDialog, showErrorToast, showInfoToast, showSuccessToast } from '../../../utils/toast';
import { formatDistance, getLocalizedText } from '../../../utils/helpers';
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
  const [calculatedServiceFee, setCalculatedServiceFee] = useState(null);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoExpanded, setPromoExpanded] = useState(false);

  // Scheduling state
  const [deliveryMode, setDeliveryMode] = useState('asap'); // 'asap' | 'scheduled'
  const [allowScheduledOrders, setAllowScheduledOrders] = useState(false);
  const [branchOrderMode, setBranchOrderMode] = useState('asap'); // 'asap' | 'scheduled' | 'both'
  const [availableSlots, setAvailableSlots] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null); // 'morning' | 'afternoon' | 'evening'
  const [loadingSlots, setLoadingSlots] = useState(false);

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
        setCalculatedServiceFee(null);
        return;
      }

      const lat = selectedAddress.location?.lat || selectedAddress.lat || selectedAddress.coordinates?.lat;
      const long = selectedAddress.location?.long || selectedAddress.long || selectedAddress.coordinates?.lng || selectedAddress.coordinates?.long;

      if (!lat || !long) {
        setCalculatedDeliveryFee(null);
        setCalculatedServiceFee(null);
        return;
      }

      try {
        setLoadingDeliveryFee(true);
        const response = await request.get(`/orders/check-delivery/${chef.id}?lat=${lat}&long=${long}&subtotal=${subtotal || 0}`);
        if (response.data?.success && response.data?.canDeliver) {
          setCalculatedDeliveryFee(response.data.deliveryFee || 0);
          setCalculatedServiceFee(response.data.serviceFee != null ? response.data.serviceFee : null);
          const mode = response.data.orderMode || (response.data.allowScheduledOrders ? 'both' : 'asap');
          setBranchOrderMode(mode);
          setAllowScheduledOrders(mode !== 'asap');
          // Auto-select delivery mode based on branch order mode
          if (mode === 'scheduled') setDeliveryMode('scheduled');
          else if (mode === 'asap') setDeliveryMode('asap');
        } else {
          setCalculatedDeliveryFee(null);
          setCalculatedServiceFee(null);
          setAllowScheduledOrders(false);
          setBranchOrderMode('asap');
        }
      } catch (err) {
        console.log('Failed to fetch delivery fee:', err);
        setCalculatedDeliveryFee(null);
        setCalculatedServiceFee(null);
        setAllowScheduledOrders(false);
        setBranchOrderMode('asap');
      } finally {
        setLoadingDeliveryFee(false);
      }
    };

    fetchDeliveryFee();
  }, [chef?.id, selectedAddress, subtotal]);

  // Fetch available time slots when delivery mode switches to scheduled
  useEffect(() => {
    if (deliveryMode !== 'scheduled' || !chef?.id) {
      setAvailableSlots(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await request.get(`/orders/available-slots/${chef.id}`);
        if (response.data?.success) {
          const slots = response.data.slots;
          setAvailableSlots(slots);
          // Auto-select first available date
          const dates = Object.keys(slots);
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          }
        }
      } catch (err) {
        console.log('Failed to fetch slots:', err);
        setAvailableSlots({});
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [deliveryMode, chef?.id]);

  // Memoize expensive calculations
  const cartSummary = useMemo(() => ({
    itemCount: cartItems.length,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    formattedSubtotal: (subtotal || 0).toFixed(0)
  }), [cartItems, subtotal]);

  const handleQuantityChange = useCallback((dishId, newQuantity, cartItemKey) => {
    if (newQuantity <= 0) {
      showActionDialog({
        type: ALERT_TYPE.WARNING,
        title: strings.removeItem,
        message: strings.areYouSureRemoveItem,
        confirmText: strings.removeFromCart,
        cancelText: strings.cancel,
        onConfirm: () => dispatch(removeFromCart({ dishId, cartItemKey })),
      });
    } else {
      dispatch(updateQuantity({ dishId, quantity: newQuantity, cartItemKey }));
    }
  }, [dispatch]);

  const handleRemoveItem = useCallback((dishId, dishName, cartItemKey) => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.removeItem,
      message: strings.formatString(strings.removeItemFromCart, { dishName }),
      confirmText: strings.removeFromCart,
      cancelText: strings.cancel,
      onConfirm: () => dispatch(removeFromCart({ dishId, cartItemKey })),
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
        const isRTL = require('react-native').I18nManager.isRTL;
        const msg = (isRTL && response.data?.messageAr) ? response.data.messageAr : (response.data?.message || strings.promoCodeApplied);
        showSuccessToast(strings.successExclamation, msg);
      } else {
        const isRTL = require('react-native').I18nManager.isRTL;
        const msg = (isRTL && response.data?.messageAr) ? response.data.messageAr : response.data?.message;
        setPromoError(msg || strings.promoCodeInvalidMsg);
      }
    } catch (err) {
      const isRTL = require('react-native').I18nManager.isRTL;
      const msg = (isRTL && err?.response?.data?.messageAr)
        ? err.response.data.messageAr
        : err?.response?.data?.message || strings.failedToValidatePromoCode;
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

    // Validate before showing confirmation dialog
    if (!selectedAddress) {
      showInfoToast(
        strings.noDeliveryAddress || 'No Address',
        strings.selectDeliveryAddress || 'Please select a delivery address'
      );
      return;
    }

    if (deliveryMode === 'scheduled' && (!selectedDate || !selectedSlot)) {
      showInfoToast(
        strings.noTimeSlot || 'No Time Slot',
        strings.selectTimeSlot || 'Please select a delivery time slot'
      );
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
              selectedOptions: item.selectedOptions || [],
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
                long: location.long,
                // Delivery area place_id for exclusion check
                deliveryAreaPlaceId: selectedAddress.deliveryArea?.placeId || '',
              };
            })(),
            notes: specialInstructions || '', // Backend expects 'notes' not 'specialInstructions'
            paymentMethod: 'cod',
            ...(appliedPromo && {
              promocode: {
                code: appliedPromo.code,
                discountAmount: appliedPromo.discountAmount,
                discountType: appliedPromo.discountType,
              },
            }),
            // Scheduling: send scheduledFor ISO string if user picked a time slot
            ...(deliveryMode === 'scheduled' && selectedDate && selectedSlot && {
              scheduledFor: new Date(`${selectedDate}T${selectedSlot.time}:00`).toISOString(),
              scheduledSlotLabel: selectedSlot.label,
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
                .replace('{distance}', formatDistance(nearestDistance))
                .replace('{max}', formatDistance(maxDistance));
            } else {
              errorMessage = errorData.message || strings.failedToPlaceOrder;
            }
          } else if (errorData?.error === 'excluded_area') {
            // Kitchen doesn't deliver to this specific area
            errorMessage = strings.chefDoesntDeliverToArea;
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
    const itemPrice = item.unitPrice || item.dish?.price || item.price || 0;
    const hasOptions = item.selectedOptions && item.selectedOptions.length > 0;

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
              {getLocalizedText(item.dish?.name || item.name, item.dish?.nameArabic, item.dish?.nameEnglish) || strings.testDishName}
            </ZText>
            <ZText type="M14" color={colors.primary} style={localStyles.dishPrice}>
              {itemPrice} {strings.EGP}
            </ZText>
            {/* Show selected options */}
            {hasOptions && (
              <ZText type="R12" color={colors.grayScale7} numberOfLines={2} style={{ marginTop: moderateScale(2) }}>
                {item.selectedOptions.map(so => so.optionNames?.join(', ')).join(' • ')}
              </ZText>
            )}
          </View>

          {/* Controls Section */}
          <View style={localStyles.controlsSection}>
            <View style={localStyles.quantityContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity - 1, item.cartItemKey)}
                style={[localStyles.quantityButton, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="remove" size={moderateScale(14)} color={colors.textColor} />
              </TouchableOpacity>

              <View style={[localStyles.quantityBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <ZText type="B14" color={colors.primary} style={localStyles.quantityText}>
                  {item.quantity}
                </ZText>
              </View>

              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity + 1, item.cartItemKey)}
                style={[localStyles.quantityButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={moderateScale(14)} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={localStyles.itemActions}>
              <ZText type="B14" color={colors.textColor} style={localStyles.itemTotal}>
                {(itemPrice * item.quantity).toFixed(0)} {strings.EGP}
              </ZText>
              {hasOptions && (
                <TouchableOpacity
                  onPress={() => navigation.navigate(StackNav.DishDetail, {
                    dishId: item.dishId,
                    chefId: chef?.id,
                    chefName: chef?.name,
                    editCartItemKey: item.cartItemKey,
                    editSelectedOptions: item.selectedOptions,
                    editQuantity: item.quantity,
                  })}
                  style={localStyles.editButton}>
                  <Ionicons name="create-outline" size={moderateScale(16)} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.dishId, item.dish?.name || item.name || 'Item', item.cartItemKey)}
                style={localStyles.removeButton}>
                <Ionicons name="trash-outline" size={moderateScale(16)} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [colors, handleQuantityChange, handleRemoveItem, chef, navigation]);

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
            <Ionicons name={require('react-native').I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.grayScale7} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Delivery Time Schedule Section — only if chef allows scheduling */}
      {allowScheduledOrders && (
        <View style={[localStyles.scheduleSection, { 
          backgroundColor: colors.primary + '08',
          borderWidth: 1,
          borderColor: colors.primary + '25',
          borderRadius: moderateScale(16),
          padding: moderateScale(16),
          marginTop: moderateScale(16),
        }]}>
          {/* Section Header with icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(12) }}>
            <View style={{ 
              backgroundColor: colors.primary + '20', 
              borderRadius: moderateScale(10), 
              padding: moderateScale(8),
              marginRight: moderateScale(10),
            }}>
              <Ionicons name="time" size={moderateScale(20)} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ZText type="B16" color={colors.textColor}>
                {strings.deliveryTime}
              </ZText>
              <ZText type="R12" color={colors.grayScale7} style={{ marginTop: moderateScale(2) }}>
                {branchOrderMode === 'scheduled' 
                  ? (strings.scheduledDeliveryOnly || 'This kitchen accepts scheduled orders only')
                  : (strings.chooseDeliveryTime || 'Choose when to receive your order')}
              </ZText>
            </View>
          </View>

          {/* ASAP / Schedule pills — only show toggle when both modes available */}
          {branchOrderMode === 'both' && (
            <View style={localStyles.deliveryModePills}>
              <TouchableOpacity
                style={[
                  localStyles.deliveryModePill,
                  deliveryMode === 'asap' && { backgroundColor: colors.primary },
                  deliveryMode !== 'asap' && { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderColor || colors.grayScale3 },
                ]}
                onPress={() => { setDeliveryMode('asap'); setSelectedSlot(null); }}
              >
                <Ionicons name="flash" size={moderateScale(16)} color={deliveryMode === 'asap' ? colors.white : colors.textColor} />
                <ZText type="B14" color={deliveryMode === 'asap' ? colors.white : colors.textColor} style={{ marginLeft: moderateScale(6) }}>
                  {strings.asap}
                </ZText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  localStyles.deliveryModePill,
                  deliveryMode === 'scheduled' && { backgroundColor: colors.primary },
                  deliveryMode !== 'scheduled' && { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderColor || colors.grayScale3 },
                ]}
                onPress={() => setDeliveryMode('scheduled')}
              >
                <Ionicons name="calendar-outline" size={moderateScale(16)} color={deliveryMode === 'scheduled' ? colors.white : colors.textColor} />
                <ZText type="B14" color={deliveryMode === 'scheduled' ? colors.white : colors.textColor} style={{ marginLeft: moderateScale(6) }}>
                  {strings.scheduleForLater}
                </ZText>
              </TouchableOpacity>
            </View>
          )}

          {/* Slot picker — shown when 'scheduled' mode */}
          {deliveryMode === 'scheduled' && (
            <View style={[localStyles.slotPickerContainer, { marginTop: moderateScale(14) }]}>
              {loadingSlots ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: moderateScale(16) }} />
              ) : availableSlots && Object.keys(availableSlots).length > 0 ? (
                <>
                  {/* Day pills - horizontal scroll */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: moderateScale(14) }}>
                    <View style={localStyles.dayPillsRow}>
                    {Object.entries(availableSlots).map(([dateStr, dayData]) => {
                      const isActive = selectedDate === dateStr;
                      const dayNameMap = {
                        sunday: strings.sunday, monday: strings.monday, tuesday: strings.tuesday,
                        wednesday: strings.wednesday, thursday: strings.thursday,
                        friday: strings.friday, saturday: strings.saturday,
                      };
                      const rawLabel = dayData.dayLabel;
                      const dayLabel = rawLabel === 'today' ? strings.today
                        : rawLabel === 'tomorrow' ? strings.tomorrow
                        : dayNameMap[rawLabel.toLowerCase()] || rawLabel;
                      const dayNum = dateStr.split('-')[2];

                      return (
                        <TouchableOpacity
                          key={dateStr}
                          style={[
                            localStyles.dayPill,
                            isActive && { backgroundColor: colors.primary },
                            !isActive && { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderColor || colors.grayScale3 },
                          ]}
                          onPress={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                        >
                          <ZText type="R12" color={isActive ? colors.white : colors.grayScale7}>
                            {dayLabel}
                          </ZText>
                          <ZText type="B14" color={isActive ? colors.white : colors.textColor}>
                            {dayNum}
                          </ZText>
                        </TouchableOpacity>
                      );
                    })}
                    </View>
                  </ScrollView>

                  {/* Time slots — simple horizontal scroll */}
                  {selectedDate && availableSlots[selectedDate] && (() => {
                    const seen = new Set();
                    const slots = availableSlots[selectedDate].slots.filter(slot => {
                      if (seen.has(slot.time)) return false;
                      seen.add(slot.time);
                      return true;
                    });

                    return (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: moderateScale(8) }}>
                          {slots.map(slot => {
                            const isActive = selectedSlot?.time === slot.time;
                            return (
                              <TouchableOpacity
                                key={slot.time}
                                style={[
                                  {
                                    paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(14),
                                    borderRadius: moderateScale(10),
                                  },
                                  isActive && { backgroundColor: colors.primary },
                                  !isActive && { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderColor || colors.grayScale3 },
                                ]}
                                onPress={() => setSelectedSlot(slot)}
                              >
                                <ZText type={isActive ? 'B13' : 'M13'} color={isActive ? colors.white : colors.textColor}>
                                  {slot.label}
                                </ZText>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    );
                  })()}
                </>
              ) : (
                <ZText type="M14" color={colors.grayScale7} style={{ textAlign: 'center', marginVertical: moderateScale(12) }}>
                  {strings.noSlotsAvailable}
                </ZText>
              )}
            </View>
          )}
        </View>
      )}

      {/* Payment Method Section */}
      <View style={localStyles.paymentMethodSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          {strings.paymentMethod || 'Payment Method'}
        </ZText>
        <View
          style={[
            localStyles.paymentMethodOption,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary,
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="cash-outline" size={moderateScale(22)} color={colors.primary} />
            <View style={{ marginLeft: moderateScale(12), flex: 1 }}>
              <ZText type="B14" color={colors.textColor}>
                {strings.cashOnDelivery || 'Cash on Delivery'}
              </ZText>
              <ZText type="M12" color={colors.grayScale7}>
                {strings.codNote || 'Pay with cash when your order arrives'}
              </ZText>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={moderateScale(22)} color={colors.primary} />
        </View>
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

        {calculatedServiceFee != null && calculatedServiceFee > 0 && (
          <View style={localStyles.summaryRow}>
            <ZText type="M14" color={colors.grayScale7}>
              {strings.serviceFee}
            </ZText>
            <ZText type="M14" color={colors.textColor}>
              {calculatedServiceFee} {strings.EGP}
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
                return `${Math.max(0, subtotal + calculatedDeliveryFee + (calculatedServiceFee || 0) - discount).toFixed(0)} ${strings.EGP}`;
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
  const keyExtractor = useCallback((item) => item.cartItemKey || item.dishId, []);
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
  editButton: {
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
  paymentMethodSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
  },
  // Scheduling styles
  scheduleSection: {
    marginTop: moderateScale(16),
  },
  deliveryModePills: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: moderateScale(8),
  },
  deliveryModePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
  },
  slotPickerContainer: {
    marginTop: moderateScale(12),
  },
  dayPillsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  dayPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(52),
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  timeSlotChip: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
  },
});

export default ShoppingCart;