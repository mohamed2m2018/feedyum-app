import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { debounce, getOptimizedQueryConfig, optimizeImageUri } from '../../../utils/performanceUtils';
import { useStableCallback } from '../../../hooks/useStableCallback';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import strings from '../../../i18n/strings';

export default function Orders({ navigation }) {
  const colors = useSelector(state => state.theme.theme);
  const [refreshing, setRefreshing] = useState(false);

  // Get current user
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const currentUser = userData?.data?.user;

  // Get user orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery(
    ['userOrders', currentUser?._id],
    () => request.get('/orders/user'),
    {
      enabled: !!currentUser?._id,
      refetchInterval: false, // Disable auto-refresh - use manual refresh instead
      ...getOptimizedQueryConfig('frequent'),
    },
  );

  const orders = ordersData?.data?.orders || [];

  // Refresh orders when screen comes into focus (with throttling)
  useFocusEffect(
    React.useCallback(() => {
      // Only refetch if data is stale (older than 30 seconds)
      const lastFetch = ordersData?._lastFetch || 0;
      const now = Date.now();
      if (now - lastFetch > 30000) {
        refetchOrders();
      }
    }, [refetchOrders, ordersData])
  );

  const handleRefresh = useStableCallback(debounce(async () => {
    setRefreshing(true);
    try {
      await refetchOrders();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, 1000)); // Debounce refresh to prevent multiple rapid calls

  const handleOrderPress = useStableCallback((order) => {
    navigation.navigate(StackNav.OrderTracking, {
      orderId: order._id,
    });
  });

  const formatTime = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning || '#FF9800';
      case 'chef_review':
        return colors.info || '#2196F3';
      case 'accepted':
        return colors.success || '#4CAF50';
      case 'preparing':
        return colors.info || '#2196F3';
      case 'ready':
        return colors.success || '#4CAF50';
      case 'delivered':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.error || '#F44336';
      default:
        return colors.grayScale7;
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending':
        return strings.pending;
      case 'chef_review':
        return strings.chefReviewing;
      case 'accepted':
        return strings.orderAccepted;
      case 'preparing':
        return strings.preparing;
      case 'ready':
        return strings.ready;
      case 'delivered':
        return strings.delivered;
      case 'cancelled':
        return strings.cancelled;
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
  };

  const renderOrderItem = React.useCallback(({ item }) => (
    <TouchableOpacity
      style={[localStyles.orderItem, { backgroundColor: colors.inputBg }]}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}>
      <Image
        source={{
          uri: optimizeImageUri(
            item.chef?.avatar ||
            'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200',
            50,
            50
          ),
        }}
        style={localStyles.avatar}
      />

      <View style={localStyles.orderInfo}>
        <View style={localStyles.orderHeader}>
          <View style={localStyles.chefInfo}>
            <ZText type="B16" color={colors.textColor} numberOfLines={1}>
              {item.chef?.fullName || item.chef?.username || 'Chef'}
            </ZText>
            <ZText type="M12" color={colors.grayScale7} numberOfLines={1}>
              Order #{item._id?.slice(-6) || item._id}
            </ZText>
          </View>
          <View style={localStyles.orderStatus}>
            <View
              style={[
                localStyles.statusBadge,
                { backgroundColor: getOrderStatusColor(item.status) }
              ]}>
              <ZText type="M10" color={colors.white}>
                {getOrderStatusText(item.status)}
              </ZText>
            </View>
            <ZText type="M12" color={colors.grayScale7}>
              {formatTime(item.created_at)}
            </ZText>
          </View>
        </View>

        <View style={localStyles.orderDetails}>
          <ZText type="M14" color={colors.grayScale7} numberOfLines={1}>
            {item.items?.length || 0} items • {item.totalPrice?.toFixed(2) || '0.00'}
          </ZText>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={moderateScale(20)}
        color={colors.grayScale7}
      />
    </TouchableOpacity>
  ), [colors.inputBg, colors.textColor, colors.grayScale7, colors.white, handleOrderPress]);

  const renderEmptyState = () => (
    <View style={localStyles.emptyContainer}>
      <Ionicons
        name="receipt-outline"
        size={moderateScale(64)}
        color={colors.grayScale4}
      />
      <ZText
        type="B18"
        color={colors.grayScale7}
        style={localStyles.emptyTitle}>
        {strings.noOrdersYet}
      </ZText>
      <ZText
        type="M14"
        color={colors.grayScale7}
        style={localStyles.emptySubtitle}>
        {strings.startExploringOrders}
      </ZText>
    </View>
  );

  if (ordersLoading && !orders.length) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.myOrders} />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.myOrders} />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingVertical: moderateScale(8),
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(4),
  },
  chefInfo: {
    flex: 1,
  },
  orderStatus: {
    alignItems: 'flex-end',
    marginLeft: moderateScale(8),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(2),
  },
  orderDetails: {
    marginTop: moderateScale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
    paddingVertical: moderateScale(60),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});