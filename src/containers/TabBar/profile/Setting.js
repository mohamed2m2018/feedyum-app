// Library import
import {
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import React, {createRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import {colors, styles} from '../../../themes';
import {ACCESS_TOKEN, moderateScale, THEME} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {ProfileSetting} from '../../../api/constant';
import {changeThemeAction} from '../../../redux/action/themeAction';
import {setAsyncStorageData} from '../../../utils/helpers';
import {StackNav} from '../../../navigation/NavigationKeys';
import LogOut from '../../../components/models/LogOut';
import {useQueryClient} from 'react-query';
import request from '../../../api/request';

export default Setting = ({navigation}) => {
  const color = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile.language);
  const LogOutSheetRef = createRef();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

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
    if (item.route) navigation.navigate(item.route, {title: item.header});
  };

  const onPressLogOutBtn = () => LogOutSheetRef?.current?.show();

  const onPressYesLogOut = async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN);
      LogOutSheetRef?.current?.hide();
      await queryClient.resetQueries();
      delete request.defaults.headers.common.Authorization;
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
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={localStyles.root}>
        {ProfileSetting.map((item, index) => {
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
                    {language}
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
