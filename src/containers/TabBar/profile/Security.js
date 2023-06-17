// Library import
import {
  SectionList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import ZButton from '../../../components/common/ZButton';
import {StackNav} from '../../../navigation/NavigationKeys';

const Security = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isEnabled, setIsEnabled] = React.useState({
    rememberMe: false,
    faceId: false,
    biometricId: false,
  });

  const SecurityData = [
    {
      title: strings.control,
      data: [
        {
          title: strings.securityAlerts,
        },
        {
          title: strings.manageDevice,
        },
        {
          title: strings.managePermissions,
        },
      ],
    },
    {
      title: strings.security,
      data: [
        {
          title: strings.rememberMe,
          rightIcon: true,
          value: isEnabled.rememberMe,
          toggleSwitch: () =>
            setIsEnabled({
              ...isEnabled,
              rememberMe: isEnabled.rememberMe ? false : true,
            }),
        },
        {
          title: strings.faceId,
          rightIcon: true,
          value: isEnabled.faceId,
          toggleSwitch: () =>
            setIsEnabled({
              ...isEnabled,
              faceId: isEnabled.faceId ? false : true,
            }),
        },
        {
          title: strings.biometricId,
          rightIcon: true,
          value: isEnabled.biometricId,
          toggleSwitch: () =>
            setIsEnabled({
              ...isEnabled,
              biometricId: isEnabled.biometricId ? false : true,
            }),
        },
        {
          title: strings.googleAuthenticator,
        },
      ],
    },
  ];

  const onPressChnagePin = () => navigation.navigate(StackNav.SetPin);
  const onPressChnagePassword = () =>
    navigation.navigate(StackNav.CreateNewPassword);

  const RenderData = data => {
    return (
      <TouchableOpacity style={localStyles.settingsContainer}>
        <ZText type="s18">{data.item.title}</ZText>
        <View style={localStyles.rightContainer}>
          {!!data?.item?.rightIcon ? (
            <Switch
              trackColor={{
                false: colors.grayScale3,
                true: colors.primary,
              }}
              thumbColor={colors.white}
              onValueChange={data?.item?.toggleSwitch}
              value={data?.item?.value}
            />
          ) : (
            <Ionicons
              name="chevron-forward-outline"
              size={moderateScale(20)}
              color={colors.dark ? colors.white : colors.grayScale9}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.security} />
      <View style={styles.ph20}>
        <SectionList
          sections={SecurityData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <RenderData item={item} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({section: {title}}) => (
            <ZText type="b20" style={styles.mt20}>
              {title}
            </ZText>
          )}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
        <ZButton
          title={strings.changePin}
          textType={'b18'}
          containerStyle={[localStyles.btnContainer]}
          color={colors.dark ? colors.white : colors.primary}
          bgColor={colors.dark3}
          onPress={onPressChnagePin}
        />
        <ZButton
          title={strings.changePassword}
          textType={'b18'}
          containerStyle={[localStyles.btnContainer]}
          color={colors.dark ? colors.white : colors.primary}
          bgColor={colors.dark3}
          onPress={onPressChnagePassword}
        />
      </View>
    </ZSafeAreaView>
  );
};

export default Security;

const localStyles = StyleSheet.create({
  settingsContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mt20,
  },
  rightContainer: {
    ...styles.flex,
    ...styles.rowEnd,
  },
  btnContainer: {
    ...styles.center,
    width: '100%',
    alignSelf: 'center',
    ...styles.mt25,
  },
});
