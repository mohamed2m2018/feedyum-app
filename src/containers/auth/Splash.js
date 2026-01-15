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
import NotificationService from '../../services/NotificationService';
import DeepLinkingService from '../../services/DeepLinkingService';

SplashScreen.preventAutoHideAsync();

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();
  const [themeColor] = useStorage(THEME);
  const [appOpenFirstTime] = useStorage(APP_OPEN_FIRST_TIME);
  const [_, setUser] = useStorage('user');
  const [access_token] = useStorage(ACCESS_TOKEN);

  const [isNavigating, setIsNavigating] = useState(false);
  const [initialTab, setInitialTab] = useState(TabNav.Discover);

  useQuery('user', () => request.get('/user'), {
    retry: 1,
    cacheTime: Infinity,
    enabled: !!access_token,
    onSuccess: (data) => {
      if (data?.data?.user) {
        setUser(data.data.user);
        // Ensure OneSignal has the user ID
        NotificationService.getInstance().setUserId(data.data.user._id);
        NotificationService.getInstance().updateUserTags(data.data.user);
      }
    }
  });

  const asyncProcess = async () => {
    // Local variables to capture notification data within this closure
    let targetTab = TabNav.Discover;
    let targetParams = undefined;

    if (themeColor) {
      if (themeColor === 'light') {
        dispatch(changeThemeAction(colors.light));
      } else {
        dispatch(changeThemeAction(colors.dark));
      }
    }

    // We relies on DeepLinkingService to capture the click globally.

    if (access_token) {
      // Token is now read from MMKV on each request via interceptor

      // Delay to allow DeepLinkingService to receive the unique event
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if DeepLinkingService captured a notification
      // Check if DeepLinkingService captured a notification
      const lastNotif = DeepLinkingService.lastNotification;
      console.log('🐞 [Splash] Checking DeepLinkingService.lastNotification:', lastNotif);

      // Use DeepLinkingService to handle pending notifications (unified logic)
      const deepLinkingService = DeepLinkingService.getInstance();
      const notifResult = deepLinkingService.handlePendingNotification();

      if (notifResult.handled) {
        if (notifResult.targetTab) {
          // Simple tab change (e.g. FollowingTab)
          targetTab = TabNav[notifResult.targetTab] || notifResult.targetTab;
        } else if (notifResult.navigateAfterTabBar) {
          // Navigate to TabBar first, then execute deferred navigation
          setIsNavigating(true);
          // await SplashScreen.hideAsync();

          // We reset to TabBar to ensure the base is loaded, but we don't need to force 'initialTab'
          // if we are going to navigate immediately away.
          navigation.reset({
            index: 0,
            routes: [{
              name: StackNav.TabBar,
              params: { initialTab: TabNav.Discover }
            }],
          });

          // Execute deferred navigation IMMEDIATELY (no timeout) or with microtask
          // to minimize visible jump.
          notifResult.navigateAfterTabBar();
          return;
        }
      }

      // ONLY if NOT handled, do we perform default navigation
      setIsNavigating(true);
      // await SplashScreen.hideAsync();

      console.log('🐞 [Splash] Resetting navigation. Tab:', targetTab, 'Params:', targetParams);

      navigation.reset({
        index: 0,
        routes: [{
          name: StackNav.TabBar,
          params: {
            initialTab: targetTab,
            params: targetParams
          }
        }],
      });
    } else {
      if (appOpenFirstTime) {
        // await SplashScreen.hideAsync();
        setIsNavigating(true);
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.Auth }],
        });
      } else {
        // await SplashScreen.hideAsync();
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
