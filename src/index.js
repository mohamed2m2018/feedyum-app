import React from 'react';
import {StatusBar, View} from 'react-native';
import {useSelector} from 'react-redux';
import AppNavigator from './navigation';
import {styles} from './themes';
import {AlertNotificationRoot} from 'react-native-alert-notification';
import {SheetProvider} from 'react-native-actions-sheet';

const App = () => {
  const colors = useSelector(state => state.theme.theme);

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
