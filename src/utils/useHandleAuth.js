import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {ACCESS_TOKEN} from '../common/constants';
import {StackNav} from '../navigation/NavigationKeys';
import request from '../api/request';
import {useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from 'react-query';
useQuery;

export const useHandleAuth = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {data: user} = useQuery('user', () => request.get('/user'), {
    retry: 1,
    cacheTime: 1000000,
  });

  const handleAuthToast = () => {
    if (user?.data?.user?.type === 'guest') {
      Dialog.show({
        title: 'Our Dear Guest',
        autoClose: false,
        type: ALERT_TYPE.WARNING,
        textBody: 'Please signup or login to be able to take all actions',
        button: 'Go to Auth',
        onPressButton: async () => {
          await AsyncStorage.removeItem(ACCESS_TOKEN);
          await queryClient.removeQueries();
          delete request.defaults.headers.common.Authorization;
          setTimeout(() => {
            Dialog.hide();
            navigation.reset({
              index: 0,
              routes: [{name: StackNav.Auth}],
            });
          }, 500);
          return true;
        },
      });
      return user?.data?.user?.type === 'guest';
    }
  };
  return {
    handleAuthToast,
  };
};
