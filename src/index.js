import React, {useEffect} from 'react';
import {
  Linking,
  Platform,
  StatusBar,
  View,
  LogBox,
  I18nManager,
} from 'react-native';
import strings from './i18n/strings';
import {ScreenProvider} from './navigation/screenContext';
import {useSelector} from 'react-redux';
import {requestNotifications} from 'react-native-permissions';
import AppNavigator from './navigation';
import {styles} from './themes';
import {AlertNotificationRoot, Toast} from 'react-native-alert-notification';
import {SheetProvider} from 'react-native-actions-sheet';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import ar from 'javascript-time-ago/locale/ar';
import firebase from '@react-native-firebase/app';
import {getAsyncStorageData} from './utils/helpers';

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

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  if (I18nManager.isRTL) {
    TimeAgo.addDefaultLocale(ar);
  } else {
    TimeAgo.addDefaultLocale(en);
  }

  LogBox.ignoreAllLogs(true);
  useEffect(() => {
    const handleLanguage = async () => {
      const language = await getAsyncStorageData('language');
      strings.setLanguage(language || 'en');
    };
    handleRequestPermission();
    handleLanguage();
    try {
      firebase.initializeApp(firebaseConfig);
    } catch {}
  }, []);

  const handleRequestPermission = () => {
    if (Platform.OS === 'android') {
      requestNotifications(['alert', 'sound']).then(({status}) => {
        if (status === 'blocked' || status === 'denied') {
          setTimeout(() => {
            Toast.show({
              textBody:
                "You didn't grant notifications permission, You will be directed to settings",
              onPress: () => Linking.openSettings(),
            });
            setTimeout(() => {
              Linking.openSettings();
            }, 2000);
          }, 5000);
        }
      });
    }
  };
  return (
    <View style={styles.flex}>
      <StatusBar
        barStyle={colors.dark === 'dark' ? 'light-content' : 'dark-content'}
      />
      <AlertNotificationRoot>
        <SheetProvider>
          <ScreenProvider>
            <AppNavigator />
          </ScreenProvider>
        </SheetProvider>
      </AlertNotificationRoot>
    </View>
  );
};

export default App;
