import React, {useEffect} from 'react';
import {Linking, Platform, StatusBar, View} from 'react-native';
import {useSelector} from 'react-redux';
import {requestNotifications} from 'react-native-permissions';
import AppNavigator from './navigation';
import {styles} from './themes';
import {AlertNotificationRoot, Toast} from 'react-native-alert-notification';
import {SheetProvider} from 'react-native-actions-sheet';

const App = () => {
  const colors = useSelector(state => state.theme.theme);

  useEffect(() => {
    handleRequestPermission();
  }, []);

  const handleRequestPermission = () => {
    if (Platform.OS === 'android') {
      requestNotifications(['alert', 'sound']).then(({status, settings}) => {
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
        // …
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
          <AppNavigator />
        </SheetProvider>
      </AlertNotificationRoot>
    </View>
  );
};

export default App;
