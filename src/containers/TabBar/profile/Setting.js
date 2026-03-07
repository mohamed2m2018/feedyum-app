// Library import
import {
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  ScrollView,
  I18nManager,
} from 'react-native';
import React, { createRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZLoader from '../../../components/common/ZLoader';
// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import { colors, styles } from '../../../themes';
import { ACCESS_TOKEN, moderateScale, THEME } from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import { changeThemeAction } from '../../../redux/action/themeAction';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import LogOut from '../../../components/models/LogOut';
import { useQuery, useQueryClient } from 'react-query';
import request from '../../../api/request';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useHandleAuth } from '../../../utils/useHandleAuth';
import { OneSignal } from 'react-native-onesignal';
import { useStorage } from '../../../utils/useStorage';
import AppInitializer from '../../../services/AppInitializer';
import { persistor } from '../../../redux/store';

export default Setting = ({ navigation }) => {
  const { data: user } = useQuery('user', () => request.get('/user'));

  const [isloading, setisloading] = useState(false);

  // Get dynamic edit profile title based on user type
  const getEditProfileTitle = () => {
    return user?.data?.user?.type === 'chef'
      ? strings.editProfileAndBranches
      : strings.editProfile;
  };

  const ProfileSetting = [
    {
      id: 1,
      title: getEditProfileTitle(),
      header: getEditProfileTitle(),
      icon: 'person-outline',
      route: StackNav.EditProfileField,
    },
    {
      id: 2,
      title: strings.savedAddresses,
      header: strings.savedAddresses,
      icon: 'location-outline',
      route: StackNav.SavedAddresses,
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
  ];

  const color = useSelector(state => state.theme.theme);
  const LogOutSheetRef = createRef();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { handleAuthToast } = useHandleAuth();
  const [_, setTheme] = useStorage(THEME);
  const [__, setToken] = useStorage(ACCESS_TOKEN);
  const [___, setUser] = useStorage('user');

  const [isEnabled, setIsEnabled] = useState(!!color.dark);

  const onPressLightTheme = async () => {
    setTheme('light');
    dispatch(changeThemeAction(colors.light));
  };

  const onPressDarkTheme = async () => {
    setTheme('dark');
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
    try {
      // Check if user is signed in with Google
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        try {
          // Try to get and clear cached access token first
          const tokens = await GoogleSignin.getTokens();
          if (tokens?.accessToken) {
            await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
          }
        } catch (tokenError) {
          // Token might not exist, continue with logout
          console.log('[Setting] Token clear error (non-critical):', tokenError);
        }

        try {
          // Revoke access to fully disconnect the app from Google account
          // This forces the account picker to show on next sign-in
          await GoogleSignin.revokeAccess();
        } catch (revokeError) {
          // revokeAccess might fail if already revoked, continue with signOut
          console.log('[Setting] Revoke access error (non-critical):', revokeError);
        }

        // Sign out to clear session tokens
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.log('[Setting] Google sign-out error:', error);
      // Attempt signOut as fallback even if previous steps failed
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('[Setting] Fallback sign-out error:', signOutError);
      }
    }
  };

  const onPressYesLogOut = async () => {
    try {
      // Clear MMKV stored session and user
      setToken();
      setUser();
      LogOutSheetRef?.current?.hide();
      // Clear query cache and auth header
      await queryClient.removeQueries();
      delete request.defaults.headers.common.Authorization;
      // Clear redux-persist storage (cart, address)
      await persistor.purge();
      // Clear AsyncStorage-stored session/notification data
      await AppInitializer.handleUserLogout();
      await googleSignOut();
      // OneSignal v5
      OneSignal.logout();
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.Auth }],
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
      <ZHeader title={strings.settings} />
      {isloading && <ZLoader absolute overlay height={130} top={280} />}
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={localStyles.root}>
        {ProfileSetting.map((item, index) => {
          if (item.id === 1 && handleAuthToast()) {
            return;
          }
          // Hide saved addresses for chef accounts
          if (item.id === 2 && user?.data?.user?.type === 'chef') {
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
                size={moderateScale(22)}
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
                      ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }),
                    }}
                    size={moderateScale(16)}
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
            style={{ ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }) }}
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
