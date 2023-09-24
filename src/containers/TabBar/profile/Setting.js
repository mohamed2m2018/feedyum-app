// Library import
import {
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  ScrollView,
  I18nManager,
} from 'react-native';
import React, {createRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ZLoader from '../../../components/common/ZLoader';
// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import {colors, styles} from '../../../themes';
import {ACCESS_TOKEN, moderateScale, THEME} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {changeThemeAction} from '../../../redux/action/themeAction';
import {setAsyncStorageData} from '../../../utils/helpers';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import LogOut from '../../../components/models/LogOut';
import {useQuery, useQueryClient} from 'react-query';
import request from '../../../api/request';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useHandleAuth} from '../../../utils/useHandleAuth';
import OneSignal from 'react-native-onesignal';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';

export default Setting = ({navigation}) => {
  const {data: user} = useQuery('user', () => request.get('/user'));

  const [isloading, setisloading] = useState(false);
  const ProfileSetting = [
    {
      id: 1,
      title: strings.editProfile,
      header: strings.editProfile,
      icon: 'person-outline',
      route: StackNav.SetUpProfile,
    },
    // {
    //   id: 2,
    //   title: strings.privacy,
    //   icon: 'lock-closed-outline',
    //   route: StackNav.Privacy,
    // },
    // {
    //   id: 4,
    //   title: strings.security,
    //   icon: 'shield-checkmark-outline',
    //   route: StackNav.Security,
    // },
    // {
    //   id: 4,
    //   title: strings.qrCode,
    //   icon: 'scan-outline',
    //   route: StackNav.QrCode,
    // },
    {
      id: 5,
      title: strings.language,
      icon: 'options-outline',
      value: 'English(US)',
      route: StackNav.Language,
    },
    // {
    //   id: 6,
    //   title: strings.darkMode,
    //   icon: 'contrast-outline',
    //   rightIcon: 'rightIcon',
    // },
    // {
    //   id: 3,
    //   title: strings.reportProblem,
    //   icon: 'cloud-download-outline',
    // },
    {
      id: 7,
      title: strings.helpCenter,
      icon: 'information-circle-outline',
      route: StackNav.HelpCenter,
    },
    {
      id: 8,
      title: strings.privacyPolicy,
      icon: 'alert-circle-outline',
      route: StackNav.PrivacyPolicy,
    },
    {
      id: 8,
      title:
        strings.switchTo +
        ' ' +
        (user?.data?.user?.type === 'chef'
          ? strings.userSwitchAccount
          : strings.chefSwitchAccount),
      icon: 'alert-circle-outline',
      onPress: () => {
        if (!isloading) {
          setisloading(true);
          request
            .patch('/user', {
              type: user?.data?.user?.type === 'chef' ? 'user' : 'chef',
            })
            .then(async () => {
              await queryClient.invalidateQueries({queryKey: 'user'});
              setisloading(false);
              navigation.navigate(TabNav.ForYou);
            })
            .catch(err => {
              setisloading(false);
              Toast.show({
                type: ALERT_TYPE.DANGER,
                title: strings.error,
                textBody: err[Object.keys(err)?.[0]],
              });
            });
        }
      },
    },
  ];

  const color = useSelector(state => state.theme.theme);
  const LogOutSheetRef = createRef();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const {handleAuthToast} = useHandleAuth();

  const [isEnabled, setIsEnabled] = useState(!!color.dark);

  const onPressLightTheme = async () => {
    await setAsyncStorageData(THEME, 'light');
    dispatch(changeThemeAction(colors.light));
  };

  const onPressDarkTheme = async () => {
    await setAsyncStorageData(THEME, 'dark');
    dispatch(changeThemeAction(colors.dark));
  };

  const toggleSwitch = val => {
    if (val) {
      onPressDarkTheme();
    } else {
      onPressLightTheme();
    }
    setIsEnabled(previousState => !previousState);
  };

  const onPressItem = item => {
    if (item.route) {
      navigation.navigate(item.route, {
        title: item.header,
        user: user?.data?.user,
      });
    } else {
      item?.onPress();
    }
  };

  const onPressLogOutBtn = () => LogOutSheetRef?.current?.show();

  const googleSignOut = async () => {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  };

  const onPressYesLogOut = async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN);
      LogOutSheetRef?.current?.hide();
      await queryClient.removeQueries();
      delete request.defaults.headers.common.Authorization;
      googleSignOut();
      OneSignal.removeExternalUserId();
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.Auth}],
        });
      }, 500);
      return true;
    } catch (exception) {
      return false;
    }
  };

  const onPressCancel = () => LogOutSheetRef?.current?.hide();

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.setting} />
      {isloading && <ZLoader absolute overlay height={130} top={280} />}
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={localStyles.root}>
        {ProfileSetting.map((item, index) => {
          if (item.title === strings.editProfile && handleAuthToast()) {
            return;
          }
          return (
            <TouchableOpacity
              disabled={item.title === strings.darkMode}
              onPress={() => onPressItem(item)}
              key={index}
              activeOpacity={item.rightIcon ? 1 : 0.5}
              style={localStyles.settingsContainer}>
              <Ionicons
                name={item.icon}
                size={moderateScale(28)}
                color={color.dark ? color.white : color.darkColor}
              />
              <ZText type="s18" style={styles.ml15}>
                {item.title}
              </ZText>
              <View style={localStyles.rightContainer}>
                {!!item.value && (
                  <ZText type="s18" style={styles.mr10}>
                    {I18nManager.isRTL ? 'العربية' : 'English'}
                  </ZText>
                )}
                {!!item.rightIcon ? (
                  <Switch
                    trackColor={{
                      false: color.grayScale3,
                      true: color.primary,
                    }}
                    thumbColor={color.white}
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                  />
                ) : (
                  <Ionicons
                    name="chevron-forward-outline"
                    style={{
                      ...(I18nManager.isRTL && {transform: [{scaleX: -1}]}),
                    }}
                    size={moderateScale(20)}
                    color={color.textColor}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={onPressLogOutBtn}
          style={localStyles.settingsContainer}>
          <Ionicons
            name={'log-out-outline'}
            style={{...(I18nManager.isRTL && {transform: [{scaleX: -1}]})}}
            size={moderateScale(30)}
            color={color.dark ? color.white : color.darkColor}
          />
          <ZText type="s18" style={styles.ml15}>
            {strings.logout}
          </ZText>
        </TouchableOpacity>
      </ScrollView>
      <LogOut
        SheetRef={LogOutSheetRef}
        onPressLogOut={onPressYesLogOut}
        onPressCancel={onPressCancel}
      />
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  root: {
    ...styles.flex,
    ...styles.ph20,
    ...styles.mb20,
  },
  settingsContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mb20,
  },
  rightContainer: {
    ...styles.flex,
    ...styles.rowEnd,
  },
});
