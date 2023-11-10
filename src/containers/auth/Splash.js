// Library Imports
import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
// Local Imports
import {colors} from '../../themes';
import {StackNav} from '../../navigation/NavigationKeys';
import {ACCESS_TOKEN, APP_OPEN_FIRST_TIME, THEME} from '../../common/constants';
import {changeThemeAction} from '../../redux/action/themeAction';
import request from '../../api/request';
import ZLoader from '../../components/common/ZLoader';
import {useQuery} from 'react-query';
import {useStorage} from '../../utils/useStorage';

const Splash = ({navigation}) => {
  const dispatch = useDispatch();
  const [themeColor] = useStorage(THEME);
  const [appOpenFirstTime] = useStorage(APP_OPEN_FIRST_TIME);
  const [access_token] = useStorage(ACCESS_TOKEN);

  const [isnavigating, setIsNavigating] = useState(false);
  useQuery('user', () => request.get('/user'), {retry: 1, cacheTime: Infinity});
  const asyncProcess = async () => {
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
  };

  useEffect(() => {
    asyncProcess();
  }, []);

  return <View>{!isnavigating && <ZLoader height={150} top={300} />}</View>;
};

export default Splash;
