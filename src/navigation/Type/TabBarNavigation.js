import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, TouchableOpacity, View, Alert, Linking, Platform, Modal } from 'react-native';
import WebNavBar from './WebNavBar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import ImagePicker from 'react-native-image-crop-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PERMISSIONS, request as requestPermission, check as checkPermission, RESULTS } from 'react-native-permissions';

// Local import
import { TabRoute } from '../NavigationRoutes';
import { StackNav, TabNav } from '../NavigationKeys';
import { checkPlatform } from '../../utils/helpers';

import { getHeight, moderateScale, BOTTOM_TAB_HEIGHT } from '../../common/constants';
import ZText from '../../components/common/ZText';
import ZButton from '../../components/common/ZButton';
import strings from '../../i18n/strings';

import {
  Add_Icon,
  Home_Dark,
  Home_Light,
  Profile_Dark,
  Discover_Dark,
  Discover_Light,
  Profile_Light,
  Search_Dark,
  Search_Light,
  Inbox_Dark,
  Inbox_Light,
  ChefDashboard_Dark,
  ChefDashboard_Light,
} from '../../assets/svgs';
import Orders_Dark from '../../assets/svgs/ordersActiveDark.svg';
import Orders_Light from '../../assets/svgs/ordersActiveLight.svg';
import { styles } from '../../themes';
import MediaSelectionModal from '../../components/modals/MediaSelectionModal';
import request from '../../api/request';
import { useQuery } from 'react-query';
import { useHandleAuth } from '../../utils/useHandleAuth';
import AddPost from '../../containers/TabBar/add/AddReel';
import { useScreen } from '../screenContext';
import ChefDashboard from '../../containers/TabBar/chef/ChefDashboard';
import ZLoader from '../../components/common/ZLoader';
import BottomActionSheet from '../../components/models/BottomActionSheet';

export default function TabBarNavigation({ route, navigation }) {
  const colors = useSelector(state => state.theme.theme);
  const insets = useSafeAreaInsets();
  const Tab = createMaterialTopTabNavigator();
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const { data, isLoading } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const { handleAuthToast } = useHandleAuth();
  const { currentScreen: previousScreen } = useScreen();
  const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });
  const [awaitingOrderModal, setAwaitingOrderModal] = useState({ visible: false, order: null });
  const hasHandledInitialNav = useRef(false); // Track if initial navigation was handled

  // Extract initialTab from route params - check for storyId/postId to go to FollowingTab
  const routeParams = route.params || {};
  const hasReelDeepLink = routeParams.storyId || routeParams.postId;
  const initialTab = hasReelDeepLink ? TabNav.FollowingTab : (routeParams.initialTab || TabNav.Discover);

  // Hide splash screen when component mounts
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Determine which component to use for Orders tab based on user type
  const user = data?.data?.user;
  const isChef = user?.type === 'chef';
  const OrdersTabComponent = isChef
    ? TabRoute.OrderManagement
    : TabRoute.Orders;
  const DiscoverTabComponent = isChef ? ChefDashboard : TabRoute.Discover;

  // Handle deep linking navigation - navigate to correct tab with params
  // Must be after user data is loaded to know which tabs exist
  // Only runs ONCE on initial mount to prevent re-navigation when dependencies change
  useEffect(() => {
    // Don't navigate while loading
    if (isLoading && !data) return;

    // Only handle initial navigation once
    if (hasHandledInitialNav.current) return;
    hasHandledInitialNav.current = true;

    if (hasReelDeepLink && !isChef) {
      // Navigate to FollowingTab with the storyId (only for non-chef users)
      console.log('🐞 [TabBar] Deep link detected, navigating to FollowingTab with storyId:', routeParams.storyId || routeParams.postId);
      setTimeout(() => {
        navigation.navigate(TabNav.FollowingTab, {
          storyId: routeParams.storyId || routeParams.postId,
          postId: routeParams.postId || routeParams.storyId,
        });
      }, 50);
    } else if (route.params?.initialTab && route.params.initialTab !== TabNav.Discover) {
      // Only navigate if it's not the default tab (Discover)
      const targetTab = route.params.initialTab;
      const targetParams = route.params.params;
      console.log('🐞 [TabBar] Navigating to:', targetTab, 'Params:', targetParams);
      navigation.navigate(targetTab, targetParams);
    }
  }, [route.params, hasReelDeepLink, isLoading, data, isChef]);

  // Check for orders awaiting user confirmation on app open
  useEffect(() => {
    if (isLoading || !user) return;
    const checkAwaitingOrders = async () => {
      try {
        const response = await request.get('/orders/user?page=1&limit=5');
        const orders = response?.data?.orders || [];
        const awaitingOrder = orders.find(o => o.status === 'awaiting_confirmation');
        if (awaitingOrder) {
          setAwaitingOrderModal({ visible: true, order: awaitingOrder });
        }
      } catch (err) {
        // Silent fail - non-critical check
      }
    };
    checkAwaitingOrders();
  }, [user?._id]);

  // Show loading AFTER all hooks have been called
  if (isLoading && !data) {
    return (
      <View style={{ flex: 1 }}>
        <ZLoader height={150} top={300} />
      </View>
    );
  }

  const TabText = ({ text, focused, icon }) => (
    <View style={localStyles.tabViewContainer}>
      {icon}
      {!!text && (
        <ZText
          type={focused ? 'b19' : 'm14'}
          numberOfLines={1}
          style={styles.mt5}
          color={focused ? colors.primary : colors.grayScale4}>
          {text}
        </ZText>
      )}
    </View>
  );

  const verifyChefCanPost = async () => {
    if (!isChef) return true;
    try {
      const menuResponse = await request.get(`/menus/chef/${user?._id}`);
      const menuId = menuResponse?.data?._id;
      if (!menuId) {
        setModalState({
          visible: true,
          title: strings.createMenuFirst,
          message: strings.createMenuMessage,
        });
        return false;
      }

      const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
      const dishes = dishesResponse?.data || [];
      if (!Array.isArray(dishes) || dishes.length === 0) {
        setModalState({
          visible: true,
          title: strings.noDishesFound,
          message: strings.noDishesMessage,
        });
        return false;
      }
      return true;
    } catch (e) {
      setModalState({
        visible: true,
        title: strings.noDishesFound,
        message: strings.noDishesMessage,
      });
      return false;
    }
  };

  const onPressAdd = async () => {
    if (handleAuthToast()) {
      return;
    }
    const ok = await verifyChefCanPost();
    if (!ok) return;
    setShowAddPostModal(true);
  };

  // Permission helpers
  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const currentStatus = await checkPermission(permission);
      if (currentStatus === RESULTS.GRANTED) return true;
      if (currentStatus === RESULTS.DENIED) {
        const result = await requestPermission(permission);
        return result === RESULTS.GRANTED;
      }
      return false;
    } catch { return false; }
  };

  const showPermissionAlert = (type) => {
    Alert.alert(
      strings.permissionRequired || 'Permission Required',
      `${type} access is required. Please enable it in Settings.`,
      [
        { text: strings.cancel || 'Cancel', style: 'cancel' },
        { text: strings.settings || 'Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  // Callbacks for MediaSelectionModal - open picker first, navigate with media
  const handleRecordVideo = async () => {
    setShowAddPostModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }
    try {
      const result = await ImagePicker.openCamera({
        mediaType: 'video',
        compressVideoPreset: 'MediumQuality',
      });
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage: false, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  const handleTakePhoto = async () => {
    setShowAddPostModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }
    try {
      const result = await ImagePicker.openCamera({
        cropping: true,
        compressImageQuality: 1,
      });
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage: true, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  const handlePickFromGallery = async () => {
    setShowAddPostModal(false);
    try {
      const result = await ImagePicker.openPicker({
        mediaType: 'any',
        compressImageQuality: 1,
        compressVideoPreset: 'MediumQuality',
      });
      const isImage = !result.duration;
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  return (
    <>
      <Tab.Navigator
        tabBarPosition={Platform.OS === 'web' ? 'top' : 'bottom'}
        {...(Platform.OS === 'web' ? { tabBar: (props) => <WebNavBar {...props} /> } : {})}
        sceneContainerStyle={{ backgroundColor: colors.backgroundColor }}
        style={{ backgroundColor: colors.backgroundColor }}
        pagerStyle={{ backgroundColor: colors.backgroundColor }}
        screenOptions={{
          headerShown: false,
          tabBarItemStyle: Platform.OS === 'web' ? {} : { height: BOTTOM_TAB_HEIGHT },
          animationEnabled: false,
          tabBarLabelStyle: { fontSize: 12 },
          freezeOnBlur: true,
          swipeEnabled: false,
          tabBarContentContainerStyle: { backgroundColor: colors.backgroundColor },
          tabBarStyle: Platform.OS === 'web'
            ? { backgroundColor: colors.backgroundColor }
            : {
                backgroundColor: colors.backgroundColor,
                height: BOTTOM_TAB_HEIGHT + insets.bottom,
                paddingBottom: insets.bottom,
              },
          tabBarShowLabel: false,
        }}
        freezeOnBlur={true}
        initialRouteName={initialTab}>
        {/* Dashboard/Discover Tab - always visible */}
        <Tab.Screen
          name={TabNav.Discover}
          component={DiscoverTabComponent}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabText
                text={isChef ? strings.chefDashboard : strings.explore}
                focused={focused}
                icon={
                  isChef
                    ? (focused ? <ChefDashboard_Dark /> : <ChefDashboard_Light />)
                    : (focused ? <Discover_Dark /> : <Discover_Light />)
                }
              />
            ),
          }}
        />

        {/* Orders Tab - shown second for chefs */}
        {isChef && (
          <Tab.Screen
            name={TabNav.Orders}
            component={OrdersTabComponent}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabText
                  text={strings.orders}
                  focused={focused}
                  icon={focused ? <Orders_Dark /> : <Orders_Light />}
                />
              ),
            }}
          />
        )}

        {/* Watch/Following Tab - only for regular users */}
        {!isChef && (
          <Tab.Screen
            name={TabNav.FollowingTab}
            component={TabRoute.Following}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabText
                  text={strings.watch}
                  focused={focused}
                  icon={focused ? <Home_Dark /> : <Home_Light />}
                />
              ),
            }}
            listeners={{
              tabPress: e => {
                // Additional work on tab press for FollowingTab
              },
            }}
          />
        )}

        {/* Add Post Tab - hidden on web (camera/gallery is native-only) */}
        {Platform.OS !== 'web' && (
          <Tab.Screen
            name={'AddPost'}
            component={AddPost}
            listeners={{
              tabPress: e => {
                e.preventDefault();
                onPressAdd();
              },
              swipeEnd: () => {
                if (handleAuthToast()) {
                  if (previousScreen === TabNav.FollowingTab) {
                    navigation.navigate(TabNav.Orders);
                  } else {
                    navigation.navigate(TabNav.FollowingTab);
                  }
                }
              },
            }}
            options={{
              tabBarIcon: ({ focused }) => (
                <TouchableOpacity
                  onPress={onPressAdd}
                  style={localStyles.tabViewContainer}>
                  <Add_Icon />
                </TouchableOpacity>
              ),
            }}
          />
        )}

        {/* Search Tab - only for regular users (after plus button) */}
        {!isChef && (
          <Tab.Screen
            name={TabNav.Search}
            component={TabRoute.Search}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabText
                  text={strings.search}
                  focused={focused}
                  icon={focused ? <Search_Dark /> : <Search_Light />}
                />
              ),
            }}
          />
        )}

        {/* Orders Tab removed for regular users - access via Profile/Headers */}

        {/* Chat Tab - only for chefs (regular users access via Profile) */}
        {isChef && (
          <Tab.Screen
            name={TabNav.Chat}
            component={TabRoute.Chat}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabText
                  text={strings.chat}
                  focused={focused}
                  icon={focused ? <Inbox_Dark /> : <Inbox_Light />}
                />
              ),
            }}
          />
        )}

        {/* Profile Tab - always visible */}
        <Tab.Screen
          name={TabNav.Profile}
          component={TabRoute.Profile}
          listeners={{
            tabPress: e => {
              if (handleAuthToast()) {
                e.preventDefault();
              }
            },
          }}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabText
                text={strings.profile}
                focused={focused}
                icon={focused ? <Profile_Dark /> : <Profile_Light />}
              />
            ),
          }}
        />
      </Tab.Navigator>
      {modalState.visible && (
        <BottomActionSheet
          visible={modalState.visible}
          title={modalState.title}
          message={modalState.message}
          primaryLabel={strings.openMenuManagement}
          secondaryLabel={strings.notNow}
          onPrimary={() => {
            setModalState({ visible: false, title: '', message: '' });
            navigation.navigate(StackNav.MenuManagement, { fromTabs: true });
          }}
          onClose={() => setModalState({ visible: false, title: '', message: '' })}
        />
      )}
      <MediaSelectionModal
        visible={showAddPostModal}
        onClose={() => setShowAddPostModal(false)}
        onRecordVideo={handleRecordVideo}
        onTakePhoto={handleTakePhoto}
        onPickFromGallery={handlePickFromGallery}
        title={strings.createNewPost}
        subtitle={strings.chooseHowToCreatePost}
      />

      {/* Awaiting Confirmation Modal */}
      <Modal
        visible={awaitingOrderModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAwaitingOrderModal({ visible: false, order: null })}
      >
        <TouchableOpacity
          style={localStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAwaitingOrderModal({ visible: false, order: null })}
        >
          <TouchableOpacity activeOpacity={1} style={[localStyles.modalCard, { backgroundColor: colors.inputBg }]}>
            {/* Warning Icon */}
            <View style={[localStyles.modalIconContainer, { backgroundColor: (colors.warning || '#FF9800') + '15' }]}>
              <Ionicons
                name="alert-circle"
                size={moderateScale(48)}
                color={colors.warning || '#FF9800'}
              />
            </View>

            {/* Title */}
            <ZText type="B20" style={localStyles.modalTitle} align="center">
              {strings.orderNeedsConfirmation}
            </ZText>

            {/* Description */}
            <ZText type="M16" color={colors.grayScale7} style={localStyles.modalDesc} align="center">
              {strings.awaitingConfirmationDesc}
            </ZText>

            {/* Order Info */}
            {awaitingOrderModal.order && (
              <View style={[localStyles.modalOrderInfo, { backgroundColor: colors.backgroundColor || '#F5F5F5' }]}>
                <ZText type="M14" color={colors.grayScale7}>
                  {strings.orderNumber || 'Order'} #{awaitingOrderModal.order._id?.slice(-6)}
                </ZText>
                <ZText type="B16" color={colors.primary}>
                  {awaitingOrderModal.order.totalPrice?.toFixed(2) || '0.00'} {strings.EGP}
                </ZText>
              </View>
            )}

            {/* Buttons */}
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalSecondaryBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => {
                  const order = awaitingOrderModal.order;
                  const isChatAvailable = order?.chef?.chatEnabled !== false;
                  setAwaitingOrderModal({ visible: false, order: null });
                  if (isChatAvailable && order?.chef?._id) {
                    navigation.navigate(StackNav.Chat, {
                      chefId: order.chef._id,
                      orderId: order._id,
                    });
                  } else {
                    navigation.navigate(StackNav.SupportChat, { orderId: order?._id });
                  }
                }}
              >
                <Ionicons
                  name={awaitingOrderModal.order?.chef?.chatEnabled !== false ? 'chatbubble-outline' : 'headset-outline'}
                  size={moderateScale(16)}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <ZText type="B16" color={colors.primary}>
                  {awaitingOrderModal.order?.chef?.chatEnabled !== false
                    ? (strings.chatWithChef || 'Chat')
                    : (strings.contactSupport || 'Contact Support')}
                </ZText>
              </TouchableOpacity>
              <ZButton
                title={strings.confirmNow}
                textType="B16"
                color={colors.white}
                containerStyle={localStyles.modalPrimaryBtn}
                onPress={() => {
                  const orderId = awaitingOrderModal.order?._id;
                  setAwaitingOrderModal({ visible: false, order: null });
                  if (orderId) {
                    navigation.navigate(StackNav.OrderTracking, { orderId });
                  }
                }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const localStyles = StyleSheet.create({
  tabBarStyle: {
    height: checkPlatform() === 'ios' ? getHeight(100) : getHeight(90),
  },
  tabViewContainer: {
    ...styles.center,
    width: moderateScale(70),
    height: getHeight(40),
    right: moderateScale(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  modalCard: {
    width: '100%',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    marginBottom: moderateScale(8),
  },
  modalDesc: {
    marginBottom: moderateScale(16),
    lineHeight: moderateScale(22),
  },
  modalOrderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(12),
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
  },
});
