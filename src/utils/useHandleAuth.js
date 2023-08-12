import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {ACCESS_TOKEN} from '../common/constants';
import {StackNav, TabNav} from '../navigation/NavigationKeys';
import request from '../api/request';
import {useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from 'react-query';
import strings from '../i18n/strings';

export const useHandleAuth = () => {
  const navigation = useNavigation();

  const queryClient = useQueryClient();
  const {data: user} = useQuery('user', () => request.get('/user'), {
    retry: 1,
  });

  const handleAuthToast = () => {
    if (user?.data?.user?.type === 'guest') {
      setTimeout(() => {
        Dialog.show({
          title: strings.dearGuest,
          autoClose: false,
          type: ALERT_TYPE.WARNING,
          textBody: strings.pleaseSignUp,
          button: strings.goToAuth,
          onHide: () => {
            navigation.navigate(TabNav.ForYou);
          },
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
      }, 300);

      return user?.data?.user?.type === 'guest';
    }
  };
  return {
    handleAuthToast,
    isGuest: user?.data?.user?.type === 'guest',
  };
};
