// Library Imports
import { View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { OneSignal } from 'react-native-onesignal';
// Local Imports
import { colors } from '../../themes';
import { StackNav, TabNav } from '../../navigation/NavigationKeys';
import { ACCESS_TOKEN, APP_OPEN_FIRST_TIME, THEME } from '../../common/constants';
import { changeThemeAction } from '../../redux/action/themeAction';
import request from '../../api/request';
import ZLoader from '../../components/common/ZLoader';
import { useQuery } from 'react-query';
import { useStorage } from '../../utils/useStorage';

SplashScreen.preventAutoHideAsync();

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();
  const [themeColor] = useStorage(THEME);
  const [appOpenFirstTime] = useStorage(APP_OPEN_FIRST_TIME);
  const [access_token] = useStorage(ACCESS_TOKEN);

  const [isNavigating, setIsNavigating] = useState(false);
  const [initialTab, setInitialTab] = useState(TabNav.Discover);

  useQuery('user', () => request.get('/user'), { retry: 1, cacheTime: Infinity });

  const asyncProcess = async () => {
    if (themeColor) {
      if (themeColor === 'light') {
        dispatch(changeThemeAction(colors.light));
      } else {
        dispatch(changeThemeAction(colors.dark));
      }
    }

    // OneSignal v5 Event Listener
    OneSignal.Notifications.addEventListener('click', (event) => {
      const notification = event.notification;
      const additionalData = notification.additionalData;
      if (additionalData && additionalData.screen === 'FollowingTab') {
        setInitialTab(TabNav.FollowingTab);
      }
    });

    if (access_token) {
      // Token is now read from MMKV on each request via interceptor
      setIsNavigating(true);
      await SplashScreen.hideAsync();
      navigation.reset({
        index: 0,
        routes: [{ name: StackNav.TabBar, params: { initialTab } }],
      });
    } else {
      if (appOpenFirstTime) {
        await SplashScreen.hideAsync();
        setIsNavigating(true);
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.Auth }],
        });
      } else {
        await SplashScreen.hideAsync();
        setIsNavigating(true);
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.onBoarding }],
        });
      }
    }
  };

  useEffect(() => {
    asyncProcess();
  }, []);

  return <View>{!isNavigating && <ZLoader height={150} top={300} />}</View>;
};

export default Splash;
