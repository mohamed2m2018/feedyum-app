// Library imports
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { Toast, ALERT_TYPE } from 'react-native-alert-notification';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import OrderCard from './components/OrderCard';
import OrderDetailsModal from './components/OrderDetailsModal';
import OrderReviewModal from './components/OrderReviewModal';
import RejectReasonModal from '../ordering/components/RejectReasonModal';
import request from '../../../api/request';
import strings from '../../../i18n/strings';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKeys';

// Components moved outside to avoid React warnings
const StatusTab = ({ status, isSelected, onPress, colors }) => (
  <TouchableOpacity
    style={[
      localStyles.statusTab,
      {
        backgroundColor: isSelected
          ? status.color + '15'
          : (colors.inputBg || '#FFFFFF'), // Fallback to white for shadow efficiency
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? status.color : (colors.grayScale7 || '#616161'),
        shadowColor: isSelected ? status.color : '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: isSelected ? 0.1 : 0,
        shadowRadius: 4,
        elevation: isSelected ? 2 : 0,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={localStyles.statusTabContent}>
      <ZText
        type={isSelected ? "B14" : "M14"}
        color={isSelected ? status.color : colors.grayScale7}
      >
        {status.label}
      </ZText>
      {status.count > 0 && (
        <View
          style={[
            localStyles.statusBadge,
            {
              backgroundColor: isSelected ? status.color : colors.grayScale4,
              transform: [{ scale: isSelected ? 1.05 : 1 }],
            },
          ]}>
          <ZText
            type="B12"
            color={isSelected ? colors.white : colors.white}
          >
            {status.count}
          </ZText>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const EmptyState = ({ selectedStatus, colors }) => (
  <View style={localStyles.emptyContainer}>
    <Ionicons name="receipt-outline" size={moderateScale(64)} color={colors.grayScale4} />
    <ZText type="B18" color={colors.grayScale7} style={localStyles.emptyTitle}>
      No orders found
    </ZText>
    <ZText type="M14" color={colors.grayScale7} style={localStyles.emptySubtitle}>
      {selectedStatus === 'all'
        ? 'Orders will appear here when customers place them'
        : `No ${selectedStatus} orders at the moment`}
    </ZText>
  </View>
);

const LoadingState = ({ colors }) => (
  <View style={localStyles.loadingContainer}>
    <ZLoader />
    <ZText
      type="M16"
      color={colors.grayScale7}
      style={localStyles.loadingText}>
      Loading orders...
    </ZText>
  </View>
);

const ErrorState = ({ onRetry, colors }) => (
  <View style={localStyles.errorContainer}>
    <Ionicons
      name="alert-circle-outline"
      size={moderateScale(48)}
      color={colors.redColor}
    />
    <ZText type="M16" color={colors.redColor} style={localStyles.errorText}>
      Failed to load orders
    </ZText>
    <TouchableOpacity
      style={[localStyles.retryButton, { borderColor: colors.redColor }]}
      onPress={onRetry}>
      <ZText type="M14" color={colors.redColor}>
        Retry
      </ZText>
    </TouchableOpacity>
  </View>
);

export default function OrderManagement() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [orderReviewVisible, setOrderReviewVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order status options
  const statusOptions = [
    { label: 'All', value: 'all', color: colors.textColor, count: 0 },
    { label: strings.pending, value: 'pending', color: colors.orange, count: 0 },
    { label: 'Accepted', value: 'confirmed', color: colors.green, count: 0 }, // Backend status is confirmed
    { label: strings.preparing, value: 'preparing', color: colors.blue, count: 0 },
    { label: strings.ready, value: 'ready', color: colors.yellow, count: 0 },
    { label: strings.completed, value: 'completed', color: colors.primary, count: 0 },
    { label: strings.cancelled, value: 'cancelled', color: colors.redColor, count: 0 },
  ];

  // Fetch current user first
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const userId = userData?.data?.user?._id;

  // Fetch orders - using real API data
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery(
    ['chefOrders', userId],
    async () => {
      try {
        // Fetch real orders from API
        const response = await request.get(`/orders/chef/${userId}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    {
      enabled: !!userId,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  // Extract orders from response
  const ordersData = ordersResponse?.orders || [];

  const tabsScrollViewRef = React.useRef(null);

  const scrollToTab = (statusValue) => {
    const index = statusOptions.findIndex(s => s.value === statusValue);
    if (index >= 0 && tabsScrollViewRef.current) {
      tabsScrollViewRef.current.scrollTo({ x: index * 100, animated: true });
    }
  };

  // Update order status mutation - using real API
  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status, deliveryFee, serviceFee }) => {
      try {
        // Update order status with real API call
        const response = await request.put(`/orders/${orderId}/status`, {
          status,
          deliveryFee,
          serviceFee,
        });
        return response.data;
      } catch (error) {
        throw new Error(error?.response?.data?.message || 'Failed to update order status');
      }
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('chefOrders');
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: `Order status updated to ${variables.status}`,
        });

        // Auto-switch tab and scroll
        if (variables.status !== 'cancelled') {
          setSelectedStatus(variables.status);
          scrollToTab(variables.status);
        }
      },
      onError: error => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: error?.message || 'Failed to update order status',
        });
      },
    },
  );

  // Filter orders based on selected status
  const filteredOrders =
    ordersData?.filter(order => {
      if (selectedStatus === 'all') return true;
      return order.status === selectedStatus;
    }) || [];

  // Calculate status counts
  const statusCounts = statusOptions.map(status => {
    if (status.value === 'all') {
      return { ...status, count: ordersData?.length || 0 };
    }
    return {
      ...status,
      count:
        ordersData?.filter(order => order.status === status.value).length || 0,
    };
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries('chefOrders');
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = (order, newStatus) => {
    updateOrderStatusMutation.mutate({
      orderId: order._id,
      status: newStatus,
    });
  };

  const handleViewOrderDetails = order => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };

  const handleCloseOrderDetails = () => {
    setOrderDetailsVisible(false);
    setSelectedOrder(null);
  };

  const handleReviewOrder = (order) => {
    setSelectedOrder(order);
    setOrderReviewVisible(true);
  };

  const handleCloseOrderReview = () => {
    setOrderReviewVisible(false);
    setSelectedOrder(null);
  };

  const handleRejectOrder = (order) => {
    setSelectedOrder(order);
    setRejectModalVisible(true);
  };

  const handleConfirmReject = (reason) => {
    if (selectedOrder) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrder._id,
        status: 'cancelled',
        notes: reason
      });
      setRejectModalVisible(false);
      setSelectedOrder(null);
    }
  };

  const handleRequestAccept = (order) => {
    setSelectedOrder(order);
    setOrderReviewVisible(true);
  };

  const handleAcceptOrder = async (order, fee) => {
    // The modal handles the API call. We just need to refresh.
    queryClient.invalidateQueries('chefOrders');
    setOrderReviewVisible(false);
    setSelectedOrder(null);

    // Switch to Accepted tab
    setSelectedStatus('confirmed');
    scrollToTab('confirmed');
  };

  const handleChatWithCustomer = (order) => {
    // Navigate to chat screen with the customer
    navigation.navigate(StackNav.ChatScreen, {
      chefId: order.user?._id,
      orderId: order._id,
    });
  };

  const renderOrderItem = ({ item }) => (
    <OrderCard
      order={item}
      onStatusChange={handleStatusChange}
      onViewDetails={handleViewOrderDetails}
      onChatWithCustomer={handleChatWithCustomer}
      onReject={handleRejectOrder}
      onAccept={handleRequestAccept}
      containerStyle={localStyles.orderCard}
    />
  );

  return (
    <ZSafeAreaView>
      <ZHeader
        title={strings.orderManagement}
        rightIcon={
          <TouchableOpacity
            onPress={onRefresh}
            style={localStyles.refreshButton}>
            <Ionicons
              name="refresh"
              size={moderateScale(24)}
              color={colors.textColor}
            />
          </TouchableOpacity>
        }
      />

      <View style={localStyles.container}>
        {/* Summary Header */}
        {!ordersLoading && ordersData.length > 0 && (
          <View style={[localStyles.summaryContainer, { backgroundColor: colors.inputBg || '#FFFFFF' }]}>
            <View style={localStyles.summaryRow}>
              <View style={localStyles.summaryItem}>
                <ZText type="B20" color={colors.primary}>
                  {ordersData.length}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  Total Orders
                </ZText>
              </View>
              <View style={localStyles.summaryItem}>
                <ZText type="B20" color={colors.orange}>
                  {ordersData.filter(order => order.status === 'pending').length}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  Pending
                </ZText>
              </View>
              <View style={localStyles.summaryItem}>
                <ZText type="B20" color={colors.blue}>
                  {ordersData.filter(order => order.status === 'preparing').length}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  Preparing
                </ZText>
              </View>
              <View style={localStyles.summaryItem}>
                <ZText type="B20" color={colors.primary}>
                  {ordersData.filter(order => order.status === 'ready').length}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  {strings.ready}
                </ZText>
              </View>
            </View>
          </View>
        )}

        {/* Status Filter Tabs */}
        <ScrollView
          ref={tabsScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={localStyles.statusTabsContainer}
          contentContainerStyle={localStyles.statusTabsContent}>
          {statusCounts.map(status => (
            <StatusTab
              key={status.value}
              status={status}
              isSelected={selectedStatus === status.value}
              onPress={() => setSelectedStatus(status.value)}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Orders List */}
        <View style={localStyles.ordersContainer}>
          {ordersLoading ? (
            <LoadingState colors={colors} />
          ) : ordersError ? (
            <ErrorState
              onRetry={() => queryClient.invalidateQueries('chefOrders')}
              colors={colors}
            />
          ) : (
            <FlatList
              data={filteredOrders}
              renderItem={renderOrderItem}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <EmptyState selectedStatus={selectedStatus} colors={colors} />
              }
              contentContainerStyle={localStyles.ordersContent}
            />
          )}
        </View>

        {/* Real-time indicator */}
        {!ordersLoading && !ordersError && (
          <View style={localStyles.realTimeIndicator}>
            <View
              style={[localStyles.indicator, { backgroundColor: colors.primary }]}
            />
            <ZText type="R12" color={colors.grayScale7}>
              Live updates active
            </ZText>
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={orderDetailsVisible}
        order={selectedOrder}
        onClose={handleCloseOrderDetails}
        onStatusChange={handleStatusChange}
      />

      {/* Order Review Modal */}
      <OrderReviewModal
        visible={orderReviewVisible}
        order={selectedOrder}
        onClose={handleCloseOrderReview}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        visible={rejectModalVisible}
        onClose={() => {
          setRejectModalVisible(false);
          setSelectedOrder(null);
        }}
        colors={colors}
        onConfirm={handleConfirmReject}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshButton: {
    padding: moderateScale(4),
  },
  statusTabsContainer: {
    paddingHorizontal: moderateScale(20),
    marginVertical: moderateScale(8),
    maxHeight: moderateScale(50),
  },
  statusTabsContent: {
    paddingRight: moderateScale(20),
  },
  statusTab: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    marginRight: moderateScale(8),
  },
  statusTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    marginLeft: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    alignItems: 'center',
  },
  ordersContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  ordersContent: {
    paddingBottom: moderateScale(20),
  },
  orderCard: {
    marginBottom: moderateScale(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  errorText: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: moderateScale(32),
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
  },
  indicator: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },
  summaryContainer: {
    marginHorizontal: moderateScale(20),
    marginVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
});
