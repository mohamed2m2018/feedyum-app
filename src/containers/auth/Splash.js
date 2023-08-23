// Library Imports
import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Local Imports
import {colors} from '../../themes';
import {StackNav} from '../../navigation/NavigationKeys';
import {ACCESS_TOKEN, APP_OPEN_FIRST_TIME, THEME} from '../../common/constants';
import {changeThemeAction} from '../../redux/action/themeAction';
import request from '../../api/request';
import ZLoader from '../../components/common/ZLoader';

const Splash = ({navigation}) => {
  const dispatch = useDispatch();
  const [isnavigating, setIsNavigating] = useState(false);
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

        if (access_token) {
          request.defaults.headers.common.Authorization = access_token;
          setIsNavigating(true);
          SplashScreen.hide();
          navigation.reset({
            index: 0,
            routes: [{name: StackNav.TabBar}],
          });
        } else {
          if (appOpenFirstTime) {
            SplashScreen.hide();
            setIsNavigating(true);
            navigation.reset({
              index: 0,
              routes: [{name: StackNav.Auth}],
            });
          } else {
            SplashScreen.hide();
            setIsNavigating(true);
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
  }, []);

  return <View>{!isnavigating && <ZLoader height={150} top={300} />}</View>;
};

export default Splash;
