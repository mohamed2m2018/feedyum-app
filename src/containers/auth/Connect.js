// Library Imports
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// Local Imports
import strings from '../../i18n/strings';
import {styles} from '../../themes';
import ZText from '../../components/common/ZText';
import {getHeight, moderateScale} from '../../common/constants';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import {
  Apple_Dark,
  Apple_Light,
  Connect_Dark,
  Connect_Light,
  Facebook_Icon,
  Google_Icon,
} from '../../assets/svgs';
import {StackNav} from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';

export default Connect = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const onPressSignWithPassword = () => navigation.navigate(StackNav.Login);
  const onPressSignUp = () => navigation.navigate(StackNav.Register);

  return (
    <ZSafeAreaView style={localStyles.root}>
      {colors.dark ? (
        <Connect_Dark width={moderateScale(237)} height={getHeight(200)} />
      ) : (
        <Connect_Light width={moderateScale(237)} height={getHeight(200)} />
      )}
      <ZText type={'b36'} style={styles.mv20}>
        {strings.letsYouIn}
      </ZText>

      <ZButton
        title={strings.continueWithFacebook}
        textType={'s16'}
        color={colors.textColor}
        frontIcon={
          <Facebook_Icon width={moderateScale(24)} height={moderateScale(24)} />
        }
        style={styles.mh10}
        containerStyle={[
          localStyles.btnContainer,
          {borderColor: colors.bColor},
        ]}
        bgColor={colors.btnColor3}
      />

      <ZButton
        title={strings.continueWithGoogle}
        textType={'s16'}
        color={colors.textColor}
        frontIcon={
          <Google_Icon width={moderateScale(24)} height={moderateScale(24)} />
        }
        style={styles.mh10}
        containerStyle={[
          localStyles.btnContainer,
          {borderColor: colors.bColor},
        ]}
        bgColor={colors.btnColor3}
      />
      <ZButton
        title={strings.continueWithApple}
        textType={'s16'}
        color={colors.textColor}
        frontIcon={
          colors.dark === 'dark' ? (
            <Apple_Light width={moderateScale(24)} height={moderateScale(24)} />
          ) : (
            <Apple_Dark width={moderateScale(24)} height={moderateScale(24)} />
          )
        }
        style={styles.mh10}
        containerStyle={[
          localStyles.btnContainer,
          {borderColor: colors.bColor},
        ]}
        bgColor={colors.btnColor3}
      />

      <View style={localStyles.divider}>
        <View
          style={[localStyles.orContainer, {backgroundColor: colors.bColor}]}
        />
        <ZText type={'b18'} style={styles.mh10}>
          {strings.or}
        </ZText>
        <View
          style={[localStyles.orContainer, {backgroundColor: colors.bColor}]}
        />
      </View>

      <ZButton
        title={strings.signWithPassword}
        textType={'b18'}
        color={colors.white}
        containerStyle={[localStyles.signBtnContainer]}
        onPress={onPressSignWithPassword}
      />

      <TouchableOpacity
        onPress={onPressSignUp}
        style={localStyles.signUpContainer}>
        <ZText type={'r14'}>{strings.dontHaveAccount}</ZText>

        <ZText type={'s14'} color={colors.primary}>
          {strings.signUp}
        </ZText>
      </TouchableOpacity>
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  root: {
    ...styles.center,
    ...styles.flex,
  },
  btnContainer: {
    ...styles.mt20,
    ...styles.center,
    ...styles.ph20,
    width: '90%',
    height: getHeight(55),
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mv30,
  },
  orContainer: {
    height: getHeight(1),
    width: '40%',
  },
  signBtnContainer: {
    ...styles.center,
    ...styles.ph20,
    width: '90%',
  },
  signUpContainer: {
    ...styles.rowCenter,
    ...styles.mv30,
  },
});
