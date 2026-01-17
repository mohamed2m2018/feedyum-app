// Library imports
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import DashboardCard from './components/DashboardCard';
import { useDashboardStats } from './hooks/useDashboardData';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';

// Format currency with K/M suffix for large numbers
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0.00';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(2);
};

export default function ChefDashboard() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();
  const isFromProfile = route.params?.isFromProfile;
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, refetch } = useDashboardStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const navigateToSection = (sectionName) => {
    // Navigate to specific management screens
    switch (sectionName) {
      case 'Menu':
        navigation.navigate(StackNav.MenuManagement, { fromTabs: true });
        break;
      case 'Orders':
        navigation.navigate(StackNav.OrderManagement);
        break;
      case 'Analytics':
        navigation.navigate(StackNav.Analytics);
        break;
      default:
        break;
    }
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.chefDashboard} isHideBack={!isFromProfile} />
      <ScrollView
        style={localStyles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

        {/* Welcome Section */}
        <View style={localStyles.welcomeSection}>
          <ZText type="B24" style={localStyles.welcomeText}>
            {strings.welcomeBackChef}
          </ZText>
          <ZText type="M16" color={colors.grayScale7}>
            {strings.restaurantOverview}
          </ZText>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity
          style={[localStyles.walletCard, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate(StackNav.Wallet)}
          activeOpacity={0.9}>
          <View style={localStyles.walletHeader}>
            <View style={localStyles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={moderateScale(28)} color={colors.white} />
            </View>
            <View style={localStyles.walletInfo}>
              <ZText type="M14" color={colors.white} style={{ opacity: 0.9 }}>
                {strings.wallet}
              </ZText>
              <ZText type="B28" color={colors.white}>
                {strings.currency} {formatCurrency(stats?.walletBalance || 500)}
              </ZText>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(24)} color={colors.white} />
          </View>
          <View style={localStyles.walletFooter}>
            <ZText type="M12" color={colors.white} style={{ opacity: 0.8 }}>
              {strings.currentBalance}
            </ZText>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Section */}
        <View style={localStyles.quickActionsSection}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.quickActions}
          </ZText>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity
              style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]}
              onPress={() => navigateToSection('Menu')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="add-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                {strings.addNewDish}
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                {strings.createNewMenuItem}
              </ZText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]}
              onPress={() => navigateToSection('Orders')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.orange }]}>
                <Ionicons name="receipt-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                {strings.viewOrders}
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                {strings.managePendingOrders}
              </ZText>
            </TouchableOpacity>
          </View>

          <View style={localStyles.actionsGrid}>
            <TouchableOpacity
              style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]}
              onPress={() => navigation.navigate(StackNav.ChatList)}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.blue }]}>
                <Ionicons name="chatbubbles-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                {strings.customerChats}
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                {strings.chatWithCustomers}
              </ZText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]}
              onPress={() => navigateToSection('Analytics')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.green }]}>
                <Ionicons name="analytics-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                {strings.viewAnalytics}
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                {strings.checkPerformance}
              </ZText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={localStyles.statsContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.todaysOverview}
          </ZText>
          <View style={localStyles.statsGrid}>
            <DashboardCard
              title={strings.todaysRevenue}
              value={`${strings.currency} ${formatCurrency(stats?.todayRevenue)}`}
              icon="cash-outline"
              color={colors.primary}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Analytics')}
            />
            <DashboardCard
              title={strings.pendingOrders}
              value={stats?.pendingOrders?.toString() || '0'}
              icon="time-outline"
              color={colors.orange}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Orders')}
            />
          </View>
          <View style={localStyles.statsGrid}>
            <DashboardCard
              title={strings.totalDishes}
              value={stats?.totalDishes?.toString() || '0'}
              icon="restaurant-outline"
              color={colors.blue}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Menu')}
            />
            <DashboardCard
              title={strings.completedOrders}
              value={stats?.completedOrders?.toString() || '0'}
              icon="checkmark-circle-outline"
              color={colors.green}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Analytics')}
            />
          </View>
        </View>

        {/* Menu Management Section */}
        <View style={localStyles.sectionContainer}>
          <View style={localStyles.sectionHeader}>
            <ZText type="S18" style={localStyles.sectionTitle}>
              {strings.menuManagement}
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Menu')}>
              <ZText type="M14" color={colors.primary}>
                {strings.manage}
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, { backgroundColor: colors.inputBg }]}
            onPress={() => navigateToSection('Menu')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="restaurant" size={moderateScale(32)} color={colors.primary} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">{strings.manageYourMenu}</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  {strings.addEditRemoveDishes}
                </ZText>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color={colors.grayScale7} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Management Section */}
        <View style={localStyles.sectionContainer}>
          <View style={localStyles.sectionHeader}>
            <ZText type="S18" style={localStyles.sectionTitle}>
              {strings.orderManagement}
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Orders')}>
              <ZText type="M14" color={colors.primary}>
                {strings.manage}
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, { backgroundColor: colors.inputBg }]}
            onPress={() => navigateToSection('Orders')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="receipt" size={moderateScale(32)} color={colors.orange} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">{strings.trackOrders}</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  {strings.monitorUpdateOrderStatus}
                </ZText>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color={colors.grayScale7} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Analytics Section */}
        <View style={localStyles.sectionContainer}>
          <View style={localStyles.sectionHeader}>
            <ZText type="S18" style={localStyles.sectionTitle}>
              {strings.analyticsAndInsights}
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Analytics')}>
              <ZText type="M14" color={colors.primary}>
                {strings.viewReports}
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, { backgroundColor: colors.inputBg }]}
            onPress={() => navigateToSection('Analytics')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="analytics" size={moderateScale(32)} color={colors.blue} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">{strings.performanceMetrics}</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  {strings.viewSalesReportsAndTrends}
                </ZText>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color={colors.grayScale7} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={localStyles.sectionContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            {strings.recentActivity}
          </ZText>
          <View style={[localStyles.activityCard, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="time-outline" size={moderateScale(32)} color={colors.grayScale7} />
            <ZText type="M16" align="center" color={colors.grayScale7} style={localStyles.activityText}>
              {strings.noRecentActivity}
            </ZText>
            <ZText type="M12" align="center" color={colors.grayScale7}>
              {strings.recentActivityDescription}
            </ZText>
          </View>
        </View>
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
    paddingVertical: moderateScale(24),
  },
  welcomeText: {
    marginBottom: moderateScale(10),
  },
  walletCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
    ...styles.shadowStyle,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  walletInfo: {
    flex: 1,
  },
  walletFooter: {
    marginTop: moderateScale(12),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    marginBottom: moderateScale(32),
  },
  sectionTitle: {
    marginBottom: moderateScale(20),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  statCard: {
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: moderateScale(32),
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  actionCard: {
    flex: 1,
    padding: moderateScale(18),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  actionIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  actionTitle: {
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: moderateScale(32),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(18),
  },
  sectionCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(18),
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionInfo: {
    flex: 1,
    marginLeft: moderateScale(16),
    marginRight: moderateScale(12),
  },
  activityCard: {
    padding: moderateScale(28),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  activityText: {
    marginTop: moderateScale(14),
    marginBottom: moderateScale(10),
  },
});