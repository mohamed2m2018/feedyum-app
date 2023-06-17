// Library Imports
import {StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {ActivityIndicator} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Local Imports
import {colors, styles} from '../../themes';
import {StackNav} from '../../navigation/NavigationKeys';
import {
  ACCESS_TOKEN,
  APP_OPEN_FIRST_TIME,
  REGISTRATION_COMPLETED,
  THEME,
} from '../../common/constants';
import {changeThemeAction} from '../../redux/action/themeAction';
import request from '../../api/request';
import strings from '../../i18n/strings';
import {useQuery} from 'react-query';

const Splash = ({navigation}) => {
  const color = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();

  const asyncProcess = async () => {
    try {
      let asyncData = await AsyncStorage.multiGet([
        THEME,
        APP_OPEN_FIRST_TIME,
        ACCESS_TOKEN,
      ]);
      if (asyncData) {
        const themeColor = JSON.parse(asyncData[0][1]);
        const appOpenFirstTime = JSON.parse(asyncData[1][1]);
        const access_token = JSON.parse(asyncData[2][1]);

        if (themeColor) {
          if (themeColor === 'light') {
            dispatch(changeThemeAction(colors.light));
          } else {
            dispatch(changeThemeAction(colors.dark));
          }
        }
        // if (!registeration_completed) {
        //   navigation.reset({
        //     index: 0,
        //     routes: [
        //       {
        //         name: StackNav.SetUpProfile,
        //         params: {
        //           title: strings.fillYourProfile,
        //         },
        //       },
        //     ],
        //   });
        //   return;
        // }

        if (access_token) {
          request.defaults.headers.common.Authorization = access_token;
          navigation.reset({
            index: 0,
            routes: [{name: StackNav.TabBar}],
          });
        } else {
          if (appOpenFirstTime) {
            navigation.reset({
              index: 0,
              routes: [{name: StackNav.Auth}],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{name: StackNav.onBoarding}],
            });
          }
        }
      }
    } catch (e) {
      console.log('error ', e);
    }
  };

  useEffect(() => {
    asyncProcess();
    SplashScreen.hide();
  }, []);

  return (
    <View style={[localStyles.container, {backgroundColor: color.background}]}>
      <ActivityIndicator size="large" color={color.darkColor} />
    </View>
  );
};

export default Splash;

const localStyles = StyleSheet.create({
  container: {
    ...styles.itemsCenter,
    ...styles.flex,
    ...styles.justifyCenter,
  },
});
