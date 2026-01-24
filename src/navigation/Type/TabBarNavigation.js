import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, TouchableOpacity, View, Alert, Linking, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import ImagePicker from 'react-native-image-crop-picker';
import { PERMISSIONS, request as requestPermission, check as checkPermission, RESULTS } from 'react-native-permissions';

// Local import
import { TabRoute } from '../NavigationRoutes';
import { StackNav, TabNav } from '../NavigationKeys';
import { checkPlatform } from '../../utils/helpers';

import { getHeight, moderateScale, BOTTOM_TAB_HEIGHT } from '../../common/constants';
import ZText from '../../components/common/ZText';
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
  Orders_Dark,
  Orders_Light,
  Inbox_Dark,
  Inbox_Light,
  ChefDashboard_Dark,
  ChefDashboard_Light,
} from '../../assets/svgs';
import { styles } from '../../themes';
import MediaSelectionModal from '../../components/modals/MediaSelectionModal';
import request from '../../api/request';
import { useQuery } from 'react-query';
import { useHandleAuth } from '../../utils/useHandleAuth';
import AddPost from '../../containers/TabBar/add/addPost';
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
      navigation.navigate({ name: StackNav.PostDetail, params: { isImage: false, mediaData: result }, merge: true });
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
      navigation.navigate({ name: StackNav.PostDetail, params: { isImage: true, mediaData: result }, merge: true });
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
      navigation.navigate({ name: StackNav.PostDetail, params: { isImage, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  return (
    <>
      <Tab.Navigator
        tabBarPosition="bottom"
        sceneContainerStyle={{ backgroundColor: colors.backgroundColor }}
        style={{ backgroundColor: colors.backgroundColor }}
        pagerStyle={{ backgroundColor: colors.backgroundColor }}
        screenOptions={{
          headerShown: false,
          tabBarItemStyle: { height: BOTTOM_TAB_HEIGHT },
          animationEnabled: false,
          tabBarLabelStyle: { fontSize: 12 },
          freezeOnBlur: true,
          swipeEnabled: false,
          tabBarContentContainerStyle: { backgroundColor: colors.backgroundColor },
          tabBarStyle: {
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

        {/* Add Post Tab - always visible */}
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
});
