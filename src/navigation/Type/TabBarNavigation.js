// Library import
import React from 'react';
import {useSelector} from 'react-redux';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Local import
import {StackRoute, TabRoute} from '../NavigationRoutes';
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
  Profile_Light,
} from '../../assets/svgs';
import {styles} from '../../themes';
import ProfilePicture from '../../components/models/ProfilePicture';
import request from '../../api/request';
import {useQuery} from 'react-query';

export default function TabBarNavigation({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const Tab = createBottomTabNavigator();
  const ProfilePictureSheetRef = React.createRef();
  const [index, setIndex] = React.useState(0);
  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const TabText = ({text, focused, icon}) => (
    <View style={localStyles.tabViewContainer}>
      {icon}
      {!!text && (
        <ZText
          type={focused ? 'b14' : 'm14'}
          numberOfLines={1}
          style={styles.mt5}
          color={focused ? colors.primary : colors.grayScale5}>
          {text}
        </ZText>
      )}
    </View>
  );

  const onPressAdd = () => ProfilePictureSheetRef?.current?.show();

  const onPressPost = isImage => {
    ProfilePictureSheetRef?.current?.hide();
    navigation.navigate(StackNav.PostDetail, {isImage});
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          localStyles.tabBarStyle,
          {
            backgroundColor: colors.backgroundColor,
          },
        ],
        tabBarShowLabel: false,
      }}
      initialRouteName={TabNav.Home}>
      <Tab.Screen
        name={TabNav.Home}
        component={TabRoute.Home}
        listeners={{tabPress: e => setIndex(0)}}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={strings.home}
              focused={focused}
              icon={focused ? <Home_Dark /> : <Home_Light />}
            />
          ),
        }}
      />

      <Tab.Screen
        name={StackNav.Search}
        component={StackRoute.Search}
        listeners={{tabPress: e => e.preventDefault()}}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
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
      {/* <Tab.Screen
        name={"Orders"}
        component={TabRoute.Discover}
        listeners={{tabPress: e => setIndex(1)}}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={"Orders"}
              focused={focused}
              icon={focused ? <Discover_Dark /> : <Discover_Light />}
            />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name={TabNav.Inbox}
        component={TabRoute.Inbox}
        listeners={{tabPress: e => setIndex(1)}}
        options={{
          tabBarIcon: ({focused}) => (
            <TabText
              text={strings.inbox}
              focused={focused}
              icon={focused ? <Inbox_Dark /> : <Inbox_Light />}
            />
          ),
        }}
      /> */}
      <Tab.Screen
        name={TabNav.Profile}
        component={TabRoute.Profile}
        listeners={{tabPress: e => setIndex(1)}}
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
  );
}

const localStyles = StyleSheet.create({
  tabBarStyle: {
    height: checkPlatform() === 'ios' ? getHeight(100) : getHeight(70),
    paddingHorizontal: moderateScale(10),
  },
  tabViewContainer: {
    ...styles.center,
  },
});
