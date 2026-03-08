// Library imports
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import request from '../../../api/request';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Period selector options - labels will be set dynamically using strings
const getPeriods = () => [
  { key: '7days', label: strings.days7 },
  { key: '30days', label: strings.days30 },
  { key: '90days', label: strings.days90 },
];

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color, colors }) => (
  <View style={[localStyles.statCard, { backgroundColor: colors.inputBg }]}>
    <View style={[localStyles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={moderateScale(24)} color={color} />
    </View>
    <ZText type="M12" color={colors.grayScale7} style={localStyles.statTitle}>
      {title}
    </ZText>
    <ZText type="B20" color={colors.textColor}>
      {value}
    </ZText>
    {subtitle && (
      <ZText type="M10" color={colors.grayScale6}>
        {subtitle}
      </ZText>
    )}
  </View>
);

// Simple Bar Chart Component
const SimpleBarChart = ({ data, colors }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const chartHeight = moderateScale(120);

  return (
    <View style={localStyles.chartContainer}>
      <View style={localStyles.chartBars}>
        {data.map((item, index) => {
          const barHeight = (item.revenue / maxRevenue) * chartHeight;
          return (
            <View key={index} style={localStyles.barWrapper}>
              <View style={localStyles.barContainer}>
                <View
                  style={[
                    localStyles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <ZText type="M8" color={colors.grayScale6} style={localStyles.barLabel}>
                {item.dayLabel}
              </ZText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Status Badge Component
const StatusBadge = ({ status, count, color, colors }) => (
  <View style={[localStyles.statusBadge, { backgroundColor: colors.inputBg }]}>
    <View style={[localStyles.statusDot, { backgroundColor: color }]} />
    <View style={localStyles.statusInfo}>
      <ZText type="M12" color={colors.textColor} style={{ textTransform: 'capitalize' }}>
        {status}
      </ZText>
      <ZText type="B16" color={colors.textColor}>
        {count}
      </ZText>
    </View>
  </View>
);

// Popular Dish Item Component
const PopularDishItem = ({ dish, index, colors }) => (
  <View style={[localStyles.dishItem, { backgroundColor: colors.inputBg }]}>
    <ZText type="B16" color={colors.primary} style={localStyles.dishRank}>
      #{index + 1}
    </ZText>
    {dish.image ? (
      <Image source={{ uri: dish.image }} style={localStyles.dishImage} />
    ) : (
      <View style={[localStyles.dishImagePlaceholder, { backgroundColor: colors.grayScale4 }]}>
        <Ionicons name="restaurant-outline" size={moderateScale(20)} color={colors.grayScale6} />
      </View>
    )}
    <View style={localStyles.dishInfo}>
      <ZText type="S14" color={colors.textColor} numberOfLines={1}>
        {dish.name}
      </ZText>
      <ZText type="M12" color={colors.grayScale6}>
        {dish.totalOrdered} {strings.ordersCount} · {strings.currency} {dish.revenue?.toFixed(2)}
      </ZText>
    </View>
  </View>
);

// Recent Order Item Component
const RecentOrderItem = ({ order, colors, getStatusTranslation }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#2196F3';
      case 'preparing': return '#9C27B0';
      case 'ready': case 'ready_for_pickup': return '#4CAF50';
      case 'completed': return '#4CAF50';
      case 'cancelled': case 'expired': return '#F44336';
      default: return colors.grayScale6;
    }
  };

  return (
    <View style={[localStyles.orderItem, { backgroundColor: colors.inputBg }]}>
      <View style={localStyles.orderInfo}>
        <ZText type="S14" color={colors.textColor}>
          {order.customer}
        </ZText>
        <ZText type="M12" color={colors.grayScale6}>
          {order.itemCount} {strings.items} · {new Date(order.date).toLocaleDateString()}
        </ZText>
      </View>
      <View style={localStyles.orderRight}>
        <ZText type="B14" color={colors.primary}>
          {strings.currency} {order.total?.toFixed(2)}
        </ZText>
        <View style={[localStyles.orderStatus, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <ZText type="M10" color={getStatusColor(order.status)}>
            {getStatusTranslation ? getStatusTranslation(order.status) : order.status}
          </ZText>
        </View>
      </View>
    </View>
  );
};

export default function Analytics() {
  const colors = useSelector(state => state.theme.theme);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const { data: analytics, isLoading, refetch, error } = useQuery(
    ['chefAnalytics', selectedPeriod],
    async () => {
      const response = await request.get(`/orders/chef/analytics?period=${selectedPeriod}`);
      return response.data?.analytics;
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value?.toFixed(2) || '0.00';
  };

  const STATUS_COLORS = {
    pending: '#FF9800',
    accepted: '#2196F3',
    preparing: '#9C27B0',
    ready: '#4CAF50',
    completed: '#4CAF50',
    cancelled: '#F44336',
    expired: '#F44336',
  };

  // Helper function to get translated status
  const getStatusTranslation = (status) => {
    switch (status) {
      case 'pending': return strings.statusPending;
      case 'accepted': return strings.statusAccepted;
      case 'preparing': return strings.statusPreparing;
      case 'ready': case 'ready_for_pickup': return strings.statusReady;
      case 'completed': return strings.statusCompleted;
      case 'cancelled': return strings.statusCancelled;
      case 'expired': return strings.expired;
      default: return status;
    }
  };

  if (isLoading && !analytics) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.analytics} />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.analytics} />
      <ScrollView
        style={localStyles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>

        {/* Period Selector */}
        <View style={localStyles.periodSelector}>
          {getPeriods().map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                localStyles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.key ? colors.primary : colors.inputBg,
                },
              ]}
              onPress={() => setSelectedPeriod(period.key)}>
              <ZText
                type="S14"
                color={selectedPeriod === period.key ? colors.white : colors.textColor}>
                {period.label}
              </ZText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats */}
        <View style={localStyles.section}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.overview}
          </ZText>
          <View style={localStyles.statsGrid}>
            <StatCard
              title={strings.periodRevenue}
              value={`${strings.currency} ${formatCurrency(analytics?.summary?.periodRevenue)}`}
              subtitle={`${analytics?.summary?.periodOrders || 0} ${strings.ordersCount}`}
              icon="cash-outline"
              color={colors.primary}
              colors={colors}
            />
            <StatCard
              title={strings.totalRevenue}
              value={`${strings.currency} ${formatCurrency(analytics?.summary?.totalRevenue)}`}
              subtitle={`${analytics?.summary?.totalOrders || 0} ${strings.totalOrdersCount}`}
              icon="wallet-outline"
              color="#4CAF50"
              colors={colors}
            />
          </View>
          <View style={localStyles.statsGrid}>
            <StatCard
              title={strings.avgOrderValue}
              value={`${strings.currency} ${analytics?.summary?.avgOrderValue?.toFixed(2) || '0.00'}`}
              icon="trending-up-outline"
              color="#2196F3"
              colors={colors}
            />
            <StatCard
              title={strings.totalDishes}
              value={analytics?.summary?.totalDishes?.toString() || '0'}
              subtitle={strings.activeDishes}
              icon="restaurant-outline"
              color="#FF9800"
              colors={colors}
            />
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={localStyles.section}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.revenueChart}
          </ZText>
          <View style={[localStyles.chartCard, { backgroundColor: colors.inputBg }]}>
            {analytics?.chartData?.length > 0 ? (
              <SimpleBarChart data={analytics.chartData} colors={colors} />
            ) : (
              <View style={localStyles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={moderateScale(40)} color={colors.grayScale5} />
                <ZText type="M14" color={colors.grayScale6} style={{ marginTop: moderateScale(8) }}>
                  {strings.noDataAvailable}
                </ZText>
              </View>
            )}
          </View>
        </View>

        {/* Order Status Breakdown */}
        <View style={localStyles.section}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.orderStatusBreakdown}
          </ZText>
          <View style={localStyles.statusGrid}>
            {Object.entries(analytics?.statusBreakdown || {}).map(([status, count]) => (
              <StatusBadge
                key={status}
                status={getStatusTranslation(status)}
                count={count}
                color={STATUS_COLORS[status] || colors.grayScale6}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Popular Dishes */}
        <View style={localStyles.section}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.popularDishes}
          </ZText>
          {analytics?.popularDishes?.length > 0 ? (
            analytics.popularDishes.map((dish, index) => (
              <PopularDishItem
                key={dish.id || index}
                dish={dish}
                index={index}
                colors={colors}
              />
            ))
          ) : (
            <View style={[localStyles.emptyState, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="restaurant-outline" size={moderateScale(32)} color={colors.grayScale5} />
              <ZText type="M14" color={colors.grayScale6} style={{ marginTop: moderateScale(8) }}>
                {strings.noOrdersYet}
              </ZText>
            </View>
          )}
        </View>

        {/* Recent Orders */}
        <View style={[localStyles.section, { marginBottom: moderateScale(30) }]}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.recentOrders}
          </ZText>
          {analytics?.recentOrders?.length > 0 ? (
            analytics.recentOrders.slice(0, 5).map((order, index) => (
              <RecentOrderItem
                key={order.id || index}
                order={order}
                colors={colors}
                getStatusTranslation={getStatusTranslation}
              />
            ))
          ) : (
            <View style={[localStyles.emptyState, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="receipt-outline" size={moderateScale(32)} color={colors.grayScale5} />
              <ZText type="M14" color={colors.grayScale6} style={{ marginTop: moderateScale(8) }}>
                {strings.noOrdersYet}
              </ZText>
            </View>
          )}
        </View>
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  periodSelector: {
    flexDirection: 'row',
    marginVertical: moderateScale(16),
    gap: moderateScale(8),
  },
  periodButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  section: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  statCard: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    ...styles.shadowStyle,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  statIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  statTitle: {
    marginBottom: moderateScale(4),
  },
  chartCard: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    ...styles.shadowStyle,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  chartContainer: {
    height: moderateScale(150),
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: moderateScale(140),
    paddingTop: moderateScale(10),
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: moderateScale(2),
  },
  bar: {
    width: '80%',
    alignSelf: 'center',
    borderRadius: moderateScale(4),
    minHeight: moderateScale(4),
  },
  barLabel: {
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  emptyChart: {
    height: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    minWidth: (SCREEN_WIDTH - moderateScale(48)) / 3,
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },
  statusInfo: {
    flex: 1,
  },
  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
    ...styles.shadowStyle,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  dishRank: {
    width: moderateScale(30),
  },
  dishImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  dishImagePlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishInfo: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
    ...styles.shadowStyle,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderStatus: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    marginTop: moderateScale(4),
  },
  emptyState: {
    padding: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
