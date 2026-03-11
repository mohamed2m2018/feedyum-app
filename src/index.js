import React, { useEffect } from 'react';
import { Platform, StatusBar, View, LogBox, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import strings from './i18n/strings';
import { ScreenProvider } from './navigation/screenContext';
import { useSelector } from 'react-redux';
import AppNavigator from './navigation';
import { styles } from './themes';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { SheetProvider } from 'react-native-actions-sheet';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import ar from 'javascript-time-ago/locale/ar';
import firebase from '@react-native-firebase/app';
import { useStorage } from './utils/useStorage';

import NotificationService from './services/NotificationService';
import BackgroundAlarmService from './services/BackgroundAlarmService';

const firebaseConfig = {
  apiKey:
    Platform.OS === 'android'
      ? '***REMOVED***'
      : '***REMOVED***',
  projectId: 'cookbook-9f0b4',
  appId:
    Platform.OS === 'android'
      ? '1:461220795216:android:46cc2983a383da4114d255'
      : '1:461220795216:ios:910f2f648acd844c14d255',
  databaseURL: '',
  messagingSenderId: '',
  storageBucket: '',
};

// Initialize OneSignal globally before App mounts
const notificationService = NotificationService.getInstance();
notificationService.initialize('8f642b9d-8d10-4b66-b43a-c1d0345ef13f');

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  if (I18nManager.isRTL) {
    TimeAgo.addDefaultLocale(ar);
  } else {
    TimeAgo.addDefaultLocale(en);
  }
  const [language] = useStorage('language');

  LogBox.ignoreAllLogs(true);
  useEffect(() => {
    const handleLanguage = async () => {
      const currentLang = language || 'en';
      strings.setLanguage(currentLang);
      notificationService.setLanguage(currentLang);
    };
    handleLanguage();

    // Initialize background alarm service (creates notification channel)
    BackgroundAlarmService.initialize()
      .then(() => console.log('[App] BackgroundAlarmService initialized'))
      .catch(err => console.error('[App] BackgroundAlarmService init FAILED:', err));

    if (firebase.getApps && !firebase.getApps().length) {
      try {
        firebase.initializeApp(firebaseConfig);
      } catch { }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.flex}>
        <StatusBar
          barStyle={colors.dark === 'dark' ? 'light-content' : 'dark-content'}
        />
        <AlertNotificationRoot theme={colors.dark === 'dark' ? 'dark' : 'light'}>
          <SheetProvider>
            <ScreenProvider>
              <AppNavigator />
            </ScreenProvider>
          </SheetProvider>
        </AlertNotificationRoot>
      </View>
    </SafeAreaProvider>
  );
};

export default App;
