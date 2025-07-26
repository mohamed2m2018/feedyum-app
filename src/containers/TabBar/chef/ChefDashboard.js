// Library imports
import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import DashboardCard from './components/DashboardCard';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function ChefDashboard() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - will be replaced with actual API calls
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const navigateToSection = (sectionName) => {
    // Navigate to specific management screens
    switch (sectionName) {
      case 'Menu':
        navigation.navigate(StackNav.MenuManagement);
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
      <ZHeader title="Chef Dashboard" />
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
            Here's your restaurant overview
          </ZText>
        </View>

        {/* Quick Stats Grid */}
        <View style={localStyles.statsContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Today's Overview
          </ZText>
          <View style={localStyles.statsGrid}>
            <DashboardCard
              title="Today's Revenue"
              value="$0"
              icon="cash-outline"
              color={colors.primary}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Analytics')}
            />
            <DashboardCard
              title="Pending Orders"
              value="0"
              icon="time-outline"
              color={colors.orange}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Orders')}
            />
          </View>
          <View style={localStyles.statsGrid}>
            <DashboardCard
              title="Total Dishes"
              value="0"
              icon="restaurant-outline"
              color={colors.blue}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Menu')}
            />
            <DashboardCard
              title="Completed Orders"
              value="0"
              icon="checkmark-circle-outline"
              color={colors.primary}
              containerStyle={localStyles.statCard}
              onPress={() => navigateToSection('Analytics')}
            />
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={localStyles.quickActionsSection}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Quick Actions
          </ZText>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity
              style={[localStyles.actionCard, {backgroundColor: colors.inputBg}]}
              onPress={() => navigateToSection('Menu')}>
              <View style={[localStyles.actionIcon, {backgroundColor: colors.primary}]}>
                <Ionicons name="add-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                Add New Dish
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                Create a new menu item
              </ZText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.actionCard, {backgroundColor: colors.inputBg}]}
              onPress={() => navigateToSection('Orders')}>
              <View style={[localStyles.actionIcon, {backgroundColor: colors.orange}]}>
                <Ionicons name="receipt-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                View Orders
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                Manage pending orders
              </ZText>
            </TouchableOpacity>
          </View>
          
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity
              style={[localStyles.actionCard, {backgroundColor: colors.inputBg}]}
              onPress={() => navigation.navigate(StackNav.ChatList)}>
              <View style={[localStyles.actionIcon, {backgroundColor: colors.blue}]}>
                <Ionicons name="chatbubbles-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                Customer Chats
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                Chat with customers
              </ZText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.actionCard, {backgroundColor: colors.inputBg}]}
              onPress={() => navigateToSection('Analytics')}>
              <View style={[localStyles.actionIcon, {backgroundColor: colors.green}]}>
                <Ionicons name="analytics-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>
                View Analytics
              </ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">
                Check performance
              </ZText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Management Section */}
        <View style={localStyles.sectionContainer}>
          <View style={localStyles.sectionHeader}>
            <ZText type="S18" style={localStyles.sectionTitle}>
              Menu Management
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Menu')}>
              <ZText type="M14" color={colors.primary}>
                Manage
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, {backgroundColor: colors.inputBg}]}
            onPress={() => navigateToSection('Menu')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="restaurant" size={moderateScale(32)} color={colors.primary} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">Manage Your Menu</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  Add, edit, or remove dishes from your menu
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
              Order Management
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Orders')}>
              <ZText type="M14" color={colors.primary}>
                Manage
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, {backgroundColor: colors.inputBg}]}
            onPress={() => navigateToSection('Orders')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="receipt" size={moderateScale(32)} color={colors.orange} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">Track Orders</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  Monitor and update order status
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
              Analytics & Insights
            </ZText>
            <TouchableOpacity onPress={() => navigateToSection('Analytics')}>
              <ZText type="M14" color={colors.primary}>
                View Reports
              </ZText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[localStyles.sectionCard, {backgroundColor: colors.inputBg}]}
            onPress={() => navigateToSection('Analytics')}>
            <View style={localStyles.sectionContent}>
              <Ionicons name="analytics" size={moderateScale(32)} color={colors.blue} />
              <View style={localStyles.sectionInfo}>
                <ZText type="B16">Performance Metrics</ZText>
                <ZText type="M14" color={colors.grayScale7}>
                  View sales reports and trends
                </ZText>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color={colors.grayScale7} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={localStyles.sectionContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>
            Recent Activity
          </ZText>
          <View style={[localStyles.activityCard, {backgroundColor: colors.inputBg}]}>
            <Ionicons name="time-outline" size={moderateScale(32)} color={colors.grayScale7} />
            <ZText type="M16" align="center" color={colors.grayScale7} style={localStyles.activityText}>
              No recent activity
            </ZText>
            <ZText type="M12" align="center" color={colors.grayScale7}>
              Your recent orders and updates will appear here
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
    paddingVertical: moderateScale(20),
  },
  welcomeText: {
    marginBottom: moderateScale(8),
  },
  statsContainer: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    marginBottom: moderateScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  statCard: {
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: moderateScale(24),
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  actionCard: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
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
    marginBottom: moderateScale(12),
  },
  actionTitle: {
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: moderateScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  sectionCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
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
    padding: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  activityText: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
});