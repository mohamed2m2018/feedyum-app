// Library imports
import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from 'react-query';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import DashboardCard from './components/DashboardCard';
import {useDashboardStats, useRecentActivity} from './hooks/useDashboardData';
import strings from '../../../i18n/strings';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';

export default function DashboardHome() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // API hooks
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();

  const {
    data: recentActivity = [],
    isLoading: activityLoading,
    error: activityError,
  } = useRecentActivity();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries('dashboardStats');
      await queryClient.invalidateQueries('recentActivity');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToTab = (tabName) => {
    // Navigate to specific tab in the chef dashboard
    navigation.navigate(tabName);
  };

  const QuickActionButton = ({title, icon, onPress, color}) => (
    <TouchableOpacity
      style={[localStyles.quickActionButton, {borderColor: color}]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Ionicons name={icon} size={moderateScale(24)} color={color} />
      <ZText type="M14" color={color} style={localStyles.quickActionText}>
        {title}
      </ZText>
    </TouchableOpacity>
  );

  const ActivityItem = ({item}) => (
    <View style={localStyles.activityItem}>
      <View style={[localStyles.activityIcon, {backgroundColor: item.color + '20'}]}>
        <Ionicons name={item.icon} size={moderateScale(20)} color={item.color} />
      </View>
      <View style={localStyles.activityContent}>
        <ZText type="M14" numberOfLines={2}>
          {item.message}
        </ZText>
        <ZText type="R12" color={colors.grayScale7} style={localStyles.activityTime}>
          {item.time}
        </ZText>
      </View>
    </View>
  );

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.chefDashboard} isHideBack={true} />
      <ScrollView
        style={localStyles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Welcome Section */}
        <View style={localStyles.welcomeSection}>
          <ZText type="B24" style={localStyles.welcomeText}>
            Welcome back, Chef!
          </ZText>
          <ZText type="M16" color={colors.grayScale7}>
            Here's your restaurant overview for today
          </ZText>
        </View>

        {/* Quick Stats Grid */}
        <View style={localStyles.statsSection}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Today's Overview
          </ZText>
          {statsLoading ? (
            <View style={localStyles.loadingContainer}>
              <ZLoader />
            </View>
          ) : statsError ? (
            <View style={localStyles.errorContainer}>
              <ZText type="M16" color={colors.redColor} align="center">
                {strings.failedToLoadDashboardStats}
              </ZText>
            </View>
          ) : (
            <>
              <View style={localStyles.statsGrid}>
                <DashboardCard
                  title={strings.todaysRevenue}
                  value={`$${dashboardStats?.todayRevenue?.toFixed(2) || '0.00'}`}
                  icon="cash-outline"
                  color={colors.primary}
                  containerStyle={localStyles.statCard}
                  onPress={() => navigateToTab('Analytics')}
                  isLoading={statsLoading}
                />
                <DashboardCard
                  title={strings.pendingOrders}
                  value={dashboardStats?.pendingOrders?.toString() || '0'}
                  icon="time-outline"
                  color={colors.orange}
                  containerStyle={localStyles.statCard}
                  onPress={() => navigateToTab('Orders')}
                  isLoading={statsLoading}
                />
              </View>
              <View style={localStyles.statsGrid}>
                <DashboardCard
                  title={strings.totalOrders}
                  value={dashboardStats?.totalOrders?.toString() || '0'}
                  icon="receipt-outline"
                  color={colors.blue}
                  containerStyle={localStyles.statCard}
                  onPress={() => navigateToTab('Orders')}
                  isLoading={statsLoading}
                />
                <DashboardCard
                  title={strings.menuItems}
                  value={dashboardStats?.totalDishes?.toString() || '0'}
                  icon="restaurant-outline"
                  color={colors.yellow}
                  containerStyle={localStyles.statCard}
                  onPress={() => navigateToTab('Menu')}
                  isLoading={statsLoading}
                />
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={localStyles.quickActionsSection}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Quick Actions
          </ZText>
          <View style={localStyles.quickActionsGrid}>
            <QuickActionButton
              title={strings.addDish}
              icon="add-circle-outline"
              color={colors.primary}
              onPress={() => navigateToTab('Menu')}
            />
            <QuickActionButton
              title={strings.viewOrders}
              icon="list-outline"
              color={colors.blue}
              onPress={() => navigateToTab('Orders')}
            />
            <QuickActionButton
              title={strings.analytics}
              icon="analytics-outline"
              color={colors.yellow}
              onPress={() => navigateToTab('Analytics')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={localStyles.activitySection}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Recent Activity
          </ZText>
          <View style={[localStyles.activityContainer, {backgroundColor: colors.inputBg}]}>
            {activityLoading ? (
              <View style={localStyles.loadingContainer}>
                <ZLoader />
              </View>
            ) : activityError ? (
              <View style={localStyles.emptyActivity}>
                <Ionicons
                  name="alert-circle-outline"
                  size={moderateScale(48)}
                  color={colors.redColor}
                />
                <ZText type="M16" color={colors.redColor} style={localStyles.emptyText}>
                  Failed to load recent activity
                </ZText>
              </View>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))
            ) : (
              <View style={localStyles.emptyActivity}>
                <Ionicons
                  name="time-outline"
                  size={moderateScale(48)}
                  color={colors.grayScale4}
                />
                <ZText type="M16" color={colors.grayScale7} style={localStyles.emptyText}>
                  No recent activity
                </ZText>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={localStyles.bottomSpacing} />
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  welcomeSection: {
    paddingVertical: moderateScale(20),
  },
  welcomeText: {
    marginBottom: moderateScale(8),
  },
  statsSection: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    marginBottom: moderateScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
    gap: moderateScale(12),
  },
  statCard: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: moderateScale(40),
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: moderateScale(40),
    alignItems: 'center',
  },
  quickActionsSection: {
    marginBottom: moderateScale(24),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  quickActionText: {
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: moderateScale(24),
  },
  activityContainer: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
  },
  activityIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  activityContent: {
    flex: 1,
  },
  activityTime: {
    marginTop: moderateScale(4),
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: moderateScale(32),
  },
  emptyText: {
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  bottomSpacing: {
    height: moderateScale(20),
  },
});