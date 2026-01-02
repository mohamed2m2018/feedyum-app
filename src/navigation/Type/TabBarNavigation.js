// Library import
import React from 'react';
import {useSelector} from 'react-redux';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

// Local import
import {TabRoute} from '../NavigationRoutes';
import {StackNav, TabNav} from '../NavigationKeys';
import {checkPlatform} from '../../utils/helpers';
import {getHeight, moderateScale} from '../../common/constants';
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
} from '../../assets/svgs';
import {styles} from '../../themes';
import ProfilePicture from '../../components/models/ProfilePicture';
import request from '../../api/request';
import {useQuery} from 'react-query';
import {useHandleAuth} from '../../utils/useHandleAuth';
import AddPost from '../../containers/TabBar/add/addPost';
import {useScreen} from '../screenContext';
import ChefDashboard from '../../containers/TabBar/chef/ChefDashboard';
import ZLoader from '../../components/common/ZLoader';
import BottomActionSheet from '../../components/models/BottomActionSheet';

export default function TabBarNavigation({route, navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const Tab = createMaterialTopTabNavigator();
  const ProfilePictureSheetRef = React.createRef();
  const {data, isLoading} = useQuery('user', () => request.get('/user'), {retry: 1});
  const {handleAuthToast} = useHandleAuth();
  const {currentScreen: previousScreen} = useScreen();
  const [modalState, setModalState] = React.useState({visible: false, title: '', message: ''});

  // Avoid flashing Discover before user type is known
  if (isLoading && !data) {
    return (
      <View style={{flex: 1}}>
        <ZLoader height={150} top={300} />
      </View>
    );
  }

  // Extract initialTab from route params or default to Discover
  const {initialTab = TabNav.Discover} = route.params || {};

  // Determine which component to use for Orders tab based on user type
  const user = data?.data?.user;
  const isChef = user?.type === 'chef';
  const OrdersTabComponent = isChef
    ? TabRoute.OrderManagement
    : TabRoute.Orders;
  const DiscoverTabComponent = isChef ? ChefDashboard : TabRoute.Discover;

  const TabText = ({text, focused, icon}) => (
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
          title: 'Create your menu first',
          message: 'To start posting, please create your menu and add your dishes so customers can order easily.',
        });
        return false;
      }

      const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
      const dishes = dishesResponse?.data || [];
      if (!Array.isArray(dishes) || dishes.length === 0) {
        setModalState({
          visible: true,
          title: 'No dishes found',
          message: 'We didn’t find any dishes in your menu. Please add at least one dish before posting.',
        });
        return false;
      }
      return true;
    } catch (e) {
      setModalState({
        visible: true,
        title: 'No dishes found',
        message: 'We didn’t find any dishes in your menu. Please add at least one dish before posting.',
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
    ProfilePictureSheetRef?.current?.show();
  };

  const onPressPost = async isImage => {
    const ok = await verifyChefCanPost();
    if (!ok) {
      ProfilePictureSheetRef?.current?.hide();
      return;
    }
    ProfilePictureSheetRef?.current?.hide();
    navigation.navigate(StackNav.PostDetail, {isImage});
  };

  return (
    <>
    <Tab.Navigator
      tabBarPosition="bottom"
      sceneContainerStyle={{backgroundColor: colors.backgroundColor}}
      style={{backgroundColor: colors.backgroundColor}}
      pagerStyle={{backgroundColor: colors.backgroundColor}}
      screenOptions={{
        headerShown: false,
        tabBarItemStyle: {height: 60},
        animationEnabled: false,
        tabBarLabelStyle: {fontSize: 12},
        freezeOnBlur: true,
        tabBarContentContainerStyle: {backgroundColor: colors.backgroundColor},
        tabBarStyle: [
          localStyles.tabBarStyle,
          {backgroundColor: colors.backgroundColor},
        ],
        tabBarShowLabel: false,
      }}
      freezeOnBlur={true}
      initialRouteName={initialTab}>
      <Tab.Screen
        name={TabNav.Discover}
        component={DiscoverTabComponent}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={isChef ? strings.chefDashboard : strings.explore}
              focused={focused}
              icon={focused ? <Discover_Dark /> : <Discover_Light />}
            />
          ),
        }}
      />
      <Tab.Screen
        name={TabNav.FollowingTab}
        component={TabRoute.Following}
        options={{
          tabBarIcon: ({focused}) => (
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
            // },
        }}
      />

      <Tab.Screen
        name={TabNav.Search}
        component={TabRoute.Search}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={strings.search}
              focused={focused}
              icon={focused ? <Search_Dark /> : <Search_Light />}
            />
          ),
        }}
      />

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
          tabBarIcon: ({focused}) => (
            <TouchableOpacity
              onPress={onPressAdd}
              style={localStyles.tabViewContainer}>
              <Add_Icon />
              <ProfilePicture
                SheetRef={ProfilePictureSheetRef}
                post={true}
                live={false}
                title={
                  data?.data?.user?.type === 'user'
                    ? strings.chooseUser
                    : strings.choose
                }
                onPressCamera={onPressPost}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name={TabNav.Orders}
        component={OrdersTabComponent}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={strings.orders}
              focused={focused}
              icon={focused ? <Orders_Dark /> : <Orders_Light />}
            />
          ),
        }}
      />
      <Tab.Screen
        name={TabNav.Chat}
        component={TabRoute.Chat}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={strings.chat}
              focused={focused}
              icon={focused ? <Inbox_Dark /> : <Inbox_Light />}
            />
          ),
        }}
      />
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
          tabBarIcon: ({focused}) => (
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
        primaryLabel={'Open Menu Management'}
        secondaryLabel={'Not now'}
        onPrimary={() => {
          setModalState({visible: false, title: '', message: ''});
          navigation.navigate(StackNav.MenuManagement, {fromTabs: true});
        }}
        onClose={() => setModalState({visible: false, title: '', message: ''})}
      />
    )}
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
