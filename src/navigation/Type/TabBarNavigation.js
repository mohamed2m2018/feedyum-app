// Library import
import React from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Local import
import { TabRoute } from '../NavigationRoutes';
import { TabNav } from '../NavigationKeys';
import { checkPlatform } from '../../utils/helpers';
import { getHeight, moderateScale } from '../../common/constants';
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
} from '../../assets/svgs';
import { styles } from '../../themes';
import ProfilePicture from '../../components/models/ProfilePicture';
import request from '../../api/request';
import { useQuery } from 'react-query';
import { useHandleAuth } from '../../utils/useHandleAuth';
import AddPost from '../../containers/TabBar/add/addPost';
import { useScreen } from '../screenContext';

export default function TabBarNavigation({ route, navigation }) {
  const colors = useSelector(state => state.theme.theme);
  const Tab = createMaterialTopTabNavigator();
  const ProfilePictureSheetRef = React.createRef();
  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const { handleAuthToast } = useHandleAuth();
  const { currentScreen: previousScreen } = useScreen();

  // Extract initialTab from route params or default to Discover
  const { initialTab = TabNav.Discover } = route.params || {};

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

  const onPressAdd = () => {
    if (handleAuthToast()) {
      return;
    }
    ProfilePictureSheetRef?.current?.show();
  };

  const onPressPost = isImage => {
    ProfilePictureSheetRef?.current?.hide();
    navigation.navigate(StackNav.PostDetail, { isImage });
  };

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      sceneContainerStyle={{ backgroundColor: colors.backgroundColor }}
      style={{ backgroundColor: colors.backgroundColor }}
      pagerStyle={{ backgroundColor: colors.backgroundColor }}
      screenOptions={{
        headerShown: false,
        tabBarItemStyle: { height: 60 },
        animationEnabled: false,
        tabBarLabelStyle: { fontSize: 12 },
        freezeOnBlur: true,
        tabBarContentContainerStyle: { backgroundColor: colors.backgroundColor },
        tabBarStyle: [localStyles.tabBarStyle, { backgroundColor: colors.backgroundColor }],
        tabBarShowLabel: false,
      }}
      freezeOnBlur={true}
      initialRouteName={initialTab}>
      <Tab.Screen
        name={TabNav.Discover}
        component={TabRoute.Discover}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabText
              text={strings.explore}
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
          tabBarIcon: ({ focused }) => (
            <TabText
              text={strings.watch}
              focused={focused}
              icon={focused ? <Home_Dark /> : <Home_Light />}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Additional work on tab press for FollowingTab
            console.log('Following tab pressed');
          },
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
                navigation.navigate(TabNav.Search);
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
