import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  AppState,
  Text,
  TouchableOpacity,
  Linking,
  Clipboard,
} from 'react-native';
import { showErrorToast, showSuccessToast, showActionDialog } from '../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../components/common/ZText';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZButton from '../../../components/common/ZButton';
import ZLoader from '../../../components/common/ZLoader';
import { moderateScale } from '../../../common/constants';
import { styles } from '../../../themes';
import strings from '../../../i18n/strings';
import { formatTime, formatDate, formatDateTime, formatSlotLabel } from '../../../utils/helpers';
import {
  fetchOrderById,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
  clearError,
  setCurrentOrder,
  updateOrderStatus,
  cancelOrderByUser,
  confirmOrderByUser,
} from '../../../redux/reducer/orderSlice';
import { StackNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import { useQuery } from 'react-query';

const OrderTracking = () => {
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile?.language);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { orderId } = route.params || {};

  const currentOrder = useSelector(selectCurrentOrder);
  const isLoading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);

  // Get current user via useQuery (same pattern as ChatScreen)
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const currentUser = userData?.data?.user;

  // Determine if current user is the chef of this order
  const isCurrentUserChef = currentOrder?.chef?._id === currentUser?._id;

  // Debug: Check if there's order data in route params



  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Use the passed orderId or fallback to a test order ID
    const testOrderId = orderId || '686cc4025633d8b417f7b70e'; // Real order ID from database

    if (testOrderId) {

      dispatch(fetchOrderById(testOrderId))
        .then(async orderData => {

          setLastUpdated(new Date());

          // Mark order as seen to update the unseen badge count
          try {
            await request.put(`/orders/${testOrderId}/seen`);
            console.log('[OrderTracking] Marked order as seen');
            // Immediately invalidate badge cache so header updates instantly
            queryClient.invalidateQueries(['unseenOrdersCount']);
          } catch (error) {
            console.warn('[OrderTracking] Failed to mark order as seen:', error.message);
          }
        })
        .catch(error => {
          console.error('OrderTracking: Failed to fetch order:', error);
          console.error(
            'OrderTracking: Error details:',
            JSON.stringify(error, null, 2),
          );
        });
    }
  }, [orderId, dispatch]);

  useEffect(() => {





  }, [currentOrder, isLoading, error, route.params, orderId]);

  useEffect(() => {
    if (error) {
      showErrorToast(strings.error, error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Real-time order status updates
  useEffect(() => {
    const startPolling = () => {
      // Polling disabled - users can manually refresh if needed
      if (
        orderId &&
        currentOrder &&
        !['delivered', 'cancelled', 'completed', 'expired'].includes(currentOrder.status)
      ) {
        intervalRef.current = setInterval(async () => {
          try {

            await dispatch(fetchOrderById(orderId));
            setLastUpdated(new Date());
          } catch (error) {
            console.error('OrderTracking: Polling error:', error);
          }
        }, 60000);
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start polling when order is active
    if (
      currentOrder &&
      !['delivered', 'cancelled', 'completed', 'expired'].includes(currentOrder.status)
    ) {
      startPolling();
    } else {
      stopPolling();
    }

    // Handle app state changes
    const handleAppStateChange = nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, refresh order data
        if (orderId) {
          dispatch(fetchOrderById(orderId));
          setLastUpdated(new Date());
        }
        if (
          currentOrder &&
          !['delivered', 'cancelled', 'completed', 'expired'].includes(currentOrder.status)
        ) {
          startPolling();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background, stop polling
        stopPolling();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      stopPolling();
      subscription?.remove();
    };
  }, [orderId, currentOrder, dispatch]);

  const handleRefresh = async () => {
    if (orderId) {
      setRefreshing(true);
      try {
        await dispatch(fetchOrderById(orderId));
      } catch (err) {
        // Error handled by useEffect above
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleChatWithChef = () => {
    if (currentOrder) {
      // If current user is the chef, navigate to chat with customer
      // Otherwise, navigate to chat with chef
      const chatPartnerId = isCurrentUserChef
        ? currentOrder.user?._id
        : currentOrder.chef?._id;

      navigation.navigate(StackNav.Chat, {
        chefId: chatPartnerId,
        orderId: currentOrder._id,
      });
    }
  };

  const handleCancelOrder = () => {
    showActionDialog({
      type: ALERT_TYPE.DANGER,
      title: strings.cancelOrder || 'Cancel Order',
      message: strings.cancelOrderConfirmation || 'Are you sure you want to cancel this order?',
      confirmText: strings.keepOrder || 'Keep Order',
      cancelText: strings.yesCancelOrder || 'Yes, Cancel',
      onCancel: async () => {
        try {
          setCancelling(true);
          await dispatch(cancelOrderByUser(currentOrder._id, 'Cancelled by customer'));
          showSuccessToast(
            strings.orderCancelled || 'Order Cancelled',
            strings.orderCancelledMessage || 'Your order has been cancelled successfully.'
          );
        } catch (error) {
          showErrorToast(
            strings.error || 'Error',
            error.message || strings.failedToCancelOrder || 'Failed to cancel order. Please try again.'
          );
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirmOrder = () => {
    showActionDialog({
      type: ALERT_TYPE.SUCCESS,
      title: strings.confirmOrder || 'Confirm Order',
      message: strings.confirmOrderQuestion || 'Confirm this order?',
      confirmText: strings.confirmOrder || 'Confirm',
      cancelText: strings.cancel || 'Cancel',
      onConfirm: async () => {
        try {
          setConfirming(true);
          await dispatch(confirmOrderByUser(currentOrder._id));
          showSuccessToast(
            strings.orderConfirmed || 'Order Confirmed',
            strings.orderConfirmedMessage || 'Your order has been confirmed.'
          );
        } catch (error) {
          showErrorToast(
            strings.error || 'Error',
            error.message || strings.failedToConfirmOrder || 'Failed to confirm order.'
          );
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return colors.warning || '#FF9800';
      case 'awaiting_confirmation':
      case 'chef_review':
        return colors.info || '#2196F3';
      case 'confirmed':
        return colors.success || '#4CAF50';
      case 'preparing':
        return colors.info || '#2196F3';
      case 'ready':
        return colors.success || '#4CAF50';
      case 'out_for_delivery':
        return colors.info || '#2196F3';
      case 'delivered':
      case 'completed':
        return colors.success || '#4CAF50';
      case 'cancelled':
      case 'expired':
        return colors.error || '#F44336';
      default:
        return colors.grayScale7;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return strings.orderPlaced;
      case 'awaiting_confirmation':
        return strings.awaitingConfirmation;
      case 'chef_review':
        return strings.chefReviewing;
      case 'confirmed':
        return strings.orderAccepted;
      case 'preparing':
        return strings.preparing;
      case 'ready':
        return strings.readyForPickupDelivery;
      case 'out_for_delivery':
        return strings.outForDelivery;
      case 'delivered':
      case 'completed':
        return strings.delivered;
      case 'cancelled':
        return strings.cancelled;
      case 'expired':
        return strings.expired;
      default:
        return status;
    }
  };

  const getStatusTimestamp = status => {
    if (!currentOrder) return null;

    // Only show timestamp for pending (order creation) and current status
    if (status === 'pending') {
      return currentOrder.created_at;
    }

    // Show timestamp for current status only
    if (status === currentOrder.status || (status === 'delivered' && currentOrder.status === 'completed')) {
      return currentOrder.updated_at || currentOrder.created_at;
    }

    // Don't show timestamps for future statuses or fake completed statuses
    return null;
  };

  const getEstimatedTime = (status, currentStatus) => {
    // Provide estimated times for future statuses based on current status
    const statusOrder = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
    ];

    // Map completed to delivered for calculation
    const effectiveCurrentStatus = currentStatus === 'completed' ? 'delivered' : currentStatus;

    const currentIndex = statusOrder.indexOf(effectiveCurrentStatus);
    const statusIndex = statusOrder.indexOf(status);

    if (statusIndex <= currentIndex) return null;

    const now = new Date();
    const estimatedMinutes = (statusIndex - currentIndex) * 15; // 15 minutes per status
    const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60000);

    return estimatedTime;
  };

  const renderStatusTimeline = () => {
    const statuses = ['pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

    // Validate current status
    let effectiveStatus = currentOrder?.status;
    if (effectiveStatus === 'completed') effectiveStatus = 'delivered';

    const currentStatusIndex = statuses.indexOf(effectiveStatus);

    return (
      <View style={localStyles.timelineContainer}>
        <View style={localStyles.timelineHeader}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000000' }}>
            {strings.orderProgress}
          </Text>
          {lastUpdated && (
            <Text style={{ fontSize: 12, color: '#666666' }}>
              {strings.lastUpdated} {formatTime(lastUpdated, language)}
            </Text>
          )}
        </View>

        <View style={localStyles.timeline}>
          {statuses.map((status, index) => {
            const isCompleted = index < currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isFuture = index > currentStatusIndex;
            const isActive = isCompleted || isCurrent;
            const timestamp = getStatusTimestamp(status);

            return (
              <View key={status} style={localStyles.timelineItem}>
                <View style={localStyles.timelineLeft}>
                  <View
                    style={[
                      localStyles.timelineIcon,
                      {
                        backgroundColor: isActive
                          ? getStatusColor(status)
                          : '#E0E0E0',
                        borderColor: isCurrent
                          ? getStatusColor(status)
                          : '#E0E0E0',
                        borderWidth: isCurrent ? 3 : 2,
                      },
                    ]}>
                    <Ionicons
                      name={
                        isCompleted
                          ? 'checkmark'
                          : isCurrent
                            ? 'time'
                            : 'ellipse'
                      }
                      size={moderateScale(16)}
                      color={isActive ? '#FFFFFF' : '#BDBDBD'}
                    />
                  </View>
                  {index < statuses.length - 1 && (
                    <View
                      style={[
                        localStyles.timelineLine,
                        {
                          backgroundColor: isCompleted
                            ? getStatusColor(status)
                            : '#E0E0E0',
                        },
                      ]}
                    />
                  )}
                </View>

                <View style={localStyles.timelineRight}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      color: isCurrent
                        ? '#FF4D67'
                        : isActive
                          ? '#000000'
                          : '#666666',
                    }}>
                    {status === 'pending'
                      ? strings.orderPlaced
                      : getStatusText(status)}
                  </Text>

                  {timestamp && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#666666',
                        marginTop: 2,
                      }}>
                      {formatDateTime(timestamp, language)}
                    </Text>
                  )}

                  {isCurrent && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#FF4D67',
                        marginTop: 2,
                        fontWeight: 'bold',
                      }}>
                      {strings.currentStatus}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderDetails = () => {






    // If no order data, show loading state
    if (!currentOrder) {
      return (
        <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: 16,
            }}>
            Order Details
          </Text>
          <View style={localStyles.loadingContainer}>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              {strings.loadingOrderDetails}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: 16,
          }}>
          {strings.orderProgress}
        </Text>

        <View style={localStyles.orderInfo}>
          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.orderId}</Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              #
              {currentOrder._id
                ? currentOrder._id.slice(-8)
                : orderId
                  ? orderId.slice(-8)
                  : 'N/A'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.chef}</Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              {currentOrder.chef
                ? currentOrder.chef.fullName ||
                currentOrder.chef.username ||
                strings.unknownChef
                : 'Loading...'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.customer}</Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              {currentOrder.user
                ? currentOrder.user.fullName ||
                currentOrder.user.username ||
                strings.unknownCustomer
                : 'Loading...'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.orderDate}</Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              {currentOrder.created_at
                ? formatDate(currentOrder.created_at, language)
                : 'N/A'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.orderTime}</Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              {currentOrder.created_at
                ? formatTime(currentOrder.created_at, language)
                : 'N/A'}
            </Text>
          </View>

          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>{strings.status}</Text>
            <Text style={{ color: '#FB9400', fontSize: 14, fontWeight: 'bold' }}>
              {getStatusText(currentOrder.status) || strings.unknown}
            </Text>
          </View>

          {/* Delivery Time Info */}
          <View style={localStyles.infoRow}>
            <Text style={{ color: '#666666', fontSize: 14 }}>
              {currentOrder.orderType === 'scheduled'
                ? (strings.scheduledDelivery || 'Scheduled Delivery')
                : (strings.estimatedDelivery || 'Estimated Delivery')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={currentOrder.orderType === 'scheduled' ? 'calendar-outline' : 'flash-outline'}
                size={moderateScale(16)}
                color={currentOrder.orderType === 'scheduled' ? '#2196F3' : '#FF9800'}
                style={{ marginRight: 6 }}
              />
              <Text style={{
                color: currentOrder.orderType === 'scheduled' ? '#2196F3' : '#FF9800',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
                {currentOrder.orderType === 'scheduled' && currentOrder.scheduledFor
                  ? (currentOrder.scheduledSlotLabel
                    ? `${formatDate(currentOrder.scheduledFor, language)}, ${formatSlotLabel(currentOrder.scheduledSlotLabel, language)}`
                    : formatDateTime(currentOrder.scheduledFor, language))
                  : currentOrder.estimatedDeliveryTime
                    ? formatDateTime(currentOrder.estimatedDeliveryTime, language)
                    : (strings.asap || 'ASAP')}
              </Text>
            </View>
          </View>

          {currentOrder.paymentMethod && (
            <View style={localStyles.infoRow}>
              <Text style={{ color: '#666666', fontSize: 14 }}>{strings.paymentMethod}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="cash-outline"
                  size={moderateScale(16)}
                  color={'#4CAF50'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: 'bold' }}>
                  {currentOrder.paymentMethod === 'cod' ? strings.cashOnDelivery : strings.paymentMethod}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderOrderItems = () => {
    if (!currentOrder) {
      return (
        <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: 16,
            }}>
            {strings.orderItems}
          </Text>
          <View style={localStyles.loadingContainer}>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              {strings.loadingOrderItems}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: 16,
          }}>
          {strings.formatString(strings.orderItemsCount, currentOrder.items?.length || 0)}
        </Text>

        {currentOrder.items?.length > 0 ? (
          currentOrder.items.map((item, index) => (
            <View key={index} style={localStyles.orderItem}>
              <View style={localStyles.itemInfo}>
                <Text
                  style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
                  {item.dish?.name || strings.unknownDish}
                </Text>
                {item.dish?.description && (
                  <Text
                    style={{ fontSize: 12, color: '#666666' }}
                    numberOfLines={2}>
                    {item.dish.description}
                  </Text>
                )}
                <View style={localStyles.itemQuantityPrice}>
                  <Text style={{ fontSize: 12, color: '#666666' }}>
                    {strings.qty} {item.quantity || 1}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666666' }}>
                    {(item.dish?.price || 0).toFixed(2)} {strings.currency} {strings.each}
                  </Text>
                </View>
              </View>
              <View style={localStyles.itemPriceContainer}>
                <Text
                  style={{ fontSize: 14, fontWeight: 'bold', color: '#FF4D67' }}>
                  {((item.dish?.price || 0) * (item.quantity || 1)).toFixed(2)} {strings.currency}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={localStyles.loadingContainer}>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              {strings.noItemsFound}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPricingSummary = () => {
    if (!currentOrder) {
      return (
        <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#FF0000',
              marginBottom: 16,
            }}>
            {strings.pricingSummary}
          </Text>
          <View style={localStyles.loadingContainer}>
            <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
              {strings.loadingPricingInformation}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#FF0000',
            marginBottom: 16,
          }}>
          {strings.pricingSummary}
        </Text>

        <View style={localStyles.pricingRow}>
          <Text style={{ fontSize: 14, color: '#000000' }}>{strings.subtotal}</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
            {currentOrder.subtotal?.toFixed(2) || '0.00'} {strings.currency}
          </Text>
        </View>

        <View style={localStyles.pricingRow}>
          <Text style={{ fontSize: 14, color: '#000000' }}>{strings.deliveryFee}</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
            {currentOrder.deliveryFee
              ? currentOrder.deliveryFee.toFixed(2)
              : '0.00'} {strings.currency}
          </Text>
        </View>

        <View style={localStyles.pricingRow}>
          <Text style={{ fontSize: 14, color: '#000000' }}>{strings.serviceFee || 'Service Fee'}</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
            {currentOrder.serviceFee
              ? currentOrder.serviceFee.toFixed(2)
              : '0.00'} {strings.currency}
          </Text>
        </View>

        {currentOrder.promocode?.discountAmount > 0 && (
          <View style={localStyles.pricingRow}>
            <Text style={{ fontSize: 14, color: '#FF4D67' }}>{strings.discount} ({currentOrder.promocode.code})</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FF4D67' }}>
              -{currentOrder.promocode.discountAmount.toFixed(2)} {strings.currency}
            </Text>
          </View>
        )}

        <View style={[localStyles.pricingRow, localStyles.totalRow]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000000' }}>
            {strings.total}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF4D67' }}>
            {currentOrder.totalPrice?.toFixed(2) || '0.00'} {strings.currency}
          </Text>
        </View>
      </View>
    );
  };

  const renderDeliveryInfo = () => (
    <View style={[localStyles.section, { backgroundColor: '#FFFFFF' }]}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: 16,
        }}>
        {strings.deliveryInformation}
      </Text>

      {currentOrder?.deliveryAddress && (
        <TouchableOpacity
          style={localStyles.addressContainer}
          activeOpacity={0.7}
          onPress={() => {
            const { lat, long } = currentOrder.deliveryAddress.location || {};
            if (lat && long) {
              const label = encodeURIComponent(currentOrder.deliveryAddress.nameLine || 'Delivery Location');
              const url = Platform.OS === 'ios'
                ? `maps:0,0?q=${label}@${lat},${long}`
                : `geo:${lat},${long}?q=${lat},${long}(${label})`;
              Linking.openURL(url);
            }
          }}
        >
          <Ionicons
            name="location"
            size={moderateScale(20)}
            color={'#FF4D67'}
          />
          <View style={localStyles.addressText}>
            {currentOrder.deliveryAddress.nameLine && (
              <Text
                style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
                {currentOrder.deliveryAddress.nameLine}
              </Text>
            )}
            {currentOrder.deliveryAddress.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: moderateScale(4) }}>
                <Ionicons name="navigate-outline" size={moderateScale(14)} color="#FF4D67" style={{ marginRight: moderateScale(4) }} />
                <Text style={{ fontSize: 12, color: '#FF4D67', fontWeight: '600' }}>
                  {strings.openInMaps || 'Open in Maps'}
                </Text>
              </View>
            )}
            {currentOrder.deliveryAddress.isPrimary && (
              <Text style={{ fontSize: 12, color: '#FF4D67' }}>
                Primary Address
              </Text>
            )}
          </View>
          <Ionicons name="open-outline" size={moderateScale(16)} color="#999" />
        </TouchableOpacity>
      )}

      {!currentOrder?.deliveryAddress && (
        <View style={localStyles.noAddressContainer}>
          <Ionicons
            name="location-outline"
            size={moderateScale(20)}
            color={'#666666'}
          />
          <Text style={{ fontSize: 14, color: '#666666', marginLeft: 12 }}>
            {strings.noDeliveryAddress}
          </Text>
        </View>
      )}

      {((currentOrder?.specialInstructions && currentOrder.specialInstructions.trim() !== '') ||
        (currentOrder?.notes && currentOrder.notes.trim() !== '')) && (
          <View style={localStyles.instructionsContainer}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000000' }}>
              {strings.specialInstructions}
            </Text>
            <Text style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>
              {currentOrder.specialInstructions || currentOrder.notes}
            </Text>
          </View>
        )}

      {((!currentOrder?.specialInstructions || currentOrder.specialInstructions.trim() === '') &&
        (!currentOrder?.notes || currentOrder.notes.trim() === '')) && (
          <View style={localStyles.noInstructionsContainer}>
            <Text style={{ fontSize: 14, color: '#666666' }}>
              {strings.noSpecialInstructions}
            </Text>
          </View>
        )}
    </View>
  );

  if (isLoading && !currentOrder) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.orderTracking} showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (!currentOrder) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.orderTracking} showBack />
        <View style={localStyles.errorContainer}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#F44336',
              textAlign: 'center',
            }}>
            {strings.orderNotFound}
          </Text>
          <ZButton
            title={strings.goBack}
            onPress={() => navigation.goBack()}
            containerStyle={localStyles.errorButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.orderTracking} showBack />

      <ScrollView
        style={localStyles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={'#FF4D67'}
          />
        }>

        {/* Confirmation Banner - TOP PRIORITY when awaiting_confirmation */}
        {currentOrder && currentOrder.status === 'awaiting_confirmation' && (
          <View style={localStyles.confirmationBanner}>
            <View style={localStyles.confirmationHeader}>
              <View style={localStyles.confirmationIconCircle}>
                <Ionicons name="notifications" size={moderateScale(22)} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                <ZText type="B16" color="#FFFFFF">
                  {strings.awaitingConfirmation || 'Action Required'}
                </ZText>
                <ZText type="M12" color="rgba(255,255,255,0.85)" style={{ marginTop: moderateScale(2) }}>
                  {strings.awaitingConfirmationDesc || 'The kitchen accepted your order. Review and confirm.'}
                </ZText>
              </View>
            </View>

            <View style={localStyles.confirmationDetails}>
              <View style={localStyles.confirmationDetailRow}>
                <ZText type="M14" color="rgba(255,255,255,0.7)">{strings.deliveryFee || 'Delivery Fee'}</ZText>
                <ZText type="B14" color="#FFFFFF">{currentOrder.deliveryFee || 0} {strings.currency || 'EGP'}</ZText>
              </View>
              {currentOrder.promocode?.discountAmount > 0 && (
                <View style={localStyles.confirmationDetailRow}>
                  <ZText type="M14" color="rgba(255,255,255,0.7)">{strings.discount} ({currentOrder.promocode.code})</ZText>
                  <ZText type="B14" color="#FFFFFF">-{currentOrder.promocode.discountAmount.toFixed(0)} {strings.currency || 'EGP'}</ZText>
                </View>
              )}
              <View style={[localStyles.confirmationDetailRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: moderateScale(6), marginTop: moderateScale(4) }]}>
                <ZText type="B16" color="#FFFFFF">{strings.totalLabel || 'Total'}</ZText>
                <ZText type="B18" color="#FFFFFF">{currentOrder.totalPrice || 0} {strings.currency || 'EGP'}</ZText>
              </View>
            </View>

            {/* Deposit Info — shown when chef requires deposit */}
            {currentOrder.depositRequired && (
              <View style={localStyles.depositInfoCard}>
                <View style={localStyles.depositInfoHeader}>
                  <Ionicons name="cash-outline" size={moderateScale(18)} color="#FF9800" />
                  <ZText type="B14" color="#FF9800" style={{ marginLeft: moderateScale(6) }}>
                    {strings.depositRequired}
                  </ZText>
                </View>
                <ZText type="R12" color="rgba(255,255,255,0.85)" style={{ marginTop: moderateScale(6) }}>
                  {strings.sendDepositInstruction}
                </ZText>
                <View style={localStyles.depositInfoRow}>
                  <ZText type="M14" color="rgba(255,255,255,0.7)">{strings.depositAmount}</ZText>
                  <ZText type="B16" color="#FFD54F">{currentOrder.depositAmount || 0} {strings.currency || 'EGP'}</ZText>
                </View>
                <View style={localStyles.depositInfoRow}>
                  <ZText type="M14" color="rgba(255,255,255,0.7)">{strings.instapayHandle}</ZText>
                  <TouchableOpacity
                    style={localStyles.copyInstapayButton}
                    onPress={() => {
                      Clipboard.setString(currentOrder.depositInstapayHandle || '');
                      showSuccessToast(strings.copiedToClipboard);
                    }}
                    activeOpacity={0.7}
                  >
                    <ZText type="B14" color="#FFFFFF">{currentOrder.depositInstapayHandle}</ZText>
                    <Ionicons name="copy-outline" size={moderateScale(14)} color="rgba(255,255,255,0.7)" style={{ marginLeft: moderateScale(6) }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={localStyles.confirmationButtons}>
              <TouchableOpacity
                style={localStyles.confirmButton}
                onPress={handleConfirmOrder}
                disabled={confirming}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#2E7D32" />
                <ZText type="B16" color="#2E7D32" style={{ marginLeft: moderateScale(8) }}>
                  {confirming
                    ? (strings.confirming || 'Confirming...')
                    : currentOrder.depositRequired
                      ? strings.iveSentDeposit
                      : (strings.confirmOrder || 'Confirm Order')}
                </ZText>
              </TouchableOpacity>

              <TouchableOpacity
                style={localStyles.declineButton}
                onPress={handleCancelOrder}
                disabled={cancelling}
                activeOpacity={0.8}
              >
                <ZText type="B14" color="rgba(255,255,255,0.9)">
                  {strings.cancelOrder || 'Decline'}
                </ZText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {renderStatusTimeline()}

        {/* Contact Kitchen Card */}
        <TouchableOpacity
          style={localStyles.contactCard}
          onPress={() => {
            const isChatAvailable = currentOrder?.chef?.chatEnabled !== false;
            if (isChatAvailable) {
              handleChatWithChef();
            } else {
              navigation.navigate(StackNav.SupportChat, { orderId: currentOrder?._id });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={localStyles.contactCardLeft}>
            <View style={localStyles.contactCardAvatar}>
              <Ionicons
                name={currentOrder?.chef?.chatEnabled !== false ? 'restaurant' : 'headset'}
                size={moderateScale(18)}
                color="#FF4D67"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ZText type="B14" color="#333" numberOfLines={1}>
                {currentOrder?.chef?.chatEnabled !== false
                  ? ((typeof currentOrder?.chef === 'object' && currentOrder?.chef?.fullName)
                    || (typeof currentOrder?.chef === 'object' && currentOrder?.chef?.username)
                    || strings.unknownChef
                    || 'Kitchen')
                  : (strings.contactSupport || 'Contact Support')}
              </ZText>
              <ZText type="M12" color="#999">
                {currentOrder?.chef?.chatEnabled !== false
                  ? (isCurrentUserChef ? (strings.chatWithCustomer || 'Chat with Customer') : (strings.tapToChat || 'Tap to chat'))
                  : (strings.contactSupportDesc || 'Chat is unavailable, contact us')}
              </ZText>
            </View>
          </View>
          <View style={localStyles.contactCardButton}>
            <Ionicons
              name={currentOrder?.chef?.chatEnabled !== false ? 'chatbubble-ellipses' : 'headset'}
              size={moderateScale(16)}
              color="#FFFFFF"
            />
            <ZText type="B12" color="#FFFFFF" style={{ marginLeft: moderateScale(4) }}>
              {currentOrder?.chef?.chatEnabled !== false
                ? (strings.chat || 'Chat')
                : (strings.support || 'Support')}
            </ZText>
          </View>
        </TouchableOpacity>
        {renderOrderDetails()}
        {renderOrderItems()}
        {renderPricingSummary()}
        {renderDeliveryInfo()}

        {/* Cancel Order - subtle text link, not a button */}
        {currentOrder && ['pending', 'confirmed'].includes(currentOrder.status) && (
          <TouchableOpacity
            style={localStyles.cancelLink}
            onPress={handleCancelOrder}
            disabled={cancelling}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle-outline" size={moderateScale(16)} color="#F44336" />
            <ZText type="M14" color="#F44336" style={{ marginLeft: moderateScale(6) }}>
              {cancelling ? (strings.cancelling || 'Cancelling...') : (strings.cancelOrder || 'Cancel Order')}
            </ZText>
          </TouchableOpacity>
        )}

        {/* View Receipt - shown for completed/delivered orders */}
        {currentOrder && ['delivered', 'completed'].includes(currentOrder.status) && (
          <TouchableOpacity
            style={localStyles.receiptLink}
            onPress={() => navigation.navigate(StackNav.OrderReceipt, { order: currentOrder })}
            activeOpacity={0.6}
          >
            <Ionicons name="receipt-outline" size={moderateScale(16)} color="#FF4D67" />
            <ZText type="B14" color="#FF4D67" style={{ marginLeft: moderateScale(6) }}>
              {strings.viewReceipt || 'View Receipt'}
            </ZText>
          </TouchableOpacity>
        )}

        <View style={{ height: moderateScale(30) }} />
      </ScrollView>


    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: moderateScale(16),
  },
  timelineContainer: {
    margin: moderateScale(16),
    padding: moderateScale(16),
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  timeline: {
    paddingLeft: moderateScale(8),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: moderateScale(16),
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  timelineIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: moderateScale(2),
    height: moderateScale(24),
    marginTop: moderateScale(4),
  },
  timelineRight: {
    flex: 1,
    justifyContent: 'center',
  },
  orderInfo: {
    gap: moderateScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemInfo: {
    flex: 1,
  },
  itemQuantityPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(4),
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  currentStatusText: {
    marginTop: moderateScale(2),
    fontWeight: 'bold',
  },
  pricingRow: {
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
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  addressText: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  instructionsContainer: {
    marginTop: moderateScale(12),
    padding: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: moderateScale(8),
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  noAddressText: {
    marginLeft: moderateScale(12),
  },
  noInstructionsContainer: {
    marginTop: moderateScale(12),
    padding: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: moderateScale(8),
  },
  chatFab: {
    position: 'absolute',
    bottom: moderateScale(24),
    right: moderateScale(20),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#FF4D67',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    marginHorizontal: moderateScale(16),
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(4),
    backgroundColor: 'rgba(255, 77, 103, 0.08)',
    borderRadius: moderateScale(12),
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactCardAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFE8EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  contactCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D67',
    paddingVertical: moderateScale(7),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
  },
  // Confirmation Banner (awaiting_confirmation)
  confirmationBanner: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    backgroundColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  confirmationIconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationDetails: {
    marginHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: moderateScale(10),
  },
  confirmationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(3),
  },
  confirmationButtons: {
    padding: moderateScale(16),
    gap: moderateScale(10),
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  declineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButton: {
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  errorButton: {
    marginTop: moderateScale(20),
    height: moderateScale(44),
    paddingHorizontal: moderateScale(30),
  },
  loadingContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Deposit info styles (inside confirmation banner)
  depositInfoCard: {
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  depositInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depositInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
    marginTop: moderateScale(4),
  },
  copyInstapayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
  },
});

export default OrderTracking;
