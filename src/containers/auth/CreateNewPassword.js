// Library imports
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import { styles } from '../../themes';
import { NewPassWordDark, NewPassWordLight } from '../../assets/svgs';
import ZText from '../../components/common/ZText';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import { getHeight, moderateScale } from '../../common/constants';
import ZInput from '../../components/common/ZInput';
import {
  validateConfirmPassword,
  validatePassword,
} from '../../utils/validators';
import { StackNav } from '../../navigation/NavigationKeys';
import SuccessModal from '../../components/models/SuccessModal';
import ZButton from '../../components/common/ZButton';
import request from '../../api/request';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const CreateNewPassword = ({ navigation, route }) => {
  const colors = useSelector(state => state.theme.theme);

  // Get token and email from navigation params (from deep link)
  const token = route?.params?.token || '';
  const email = route?.params?.email || '';

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.grayScale4;
  const FocusedIconStyle = colors.primary;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(true);
  const [passwordInputStyle, setPasswordInputStyle] = useState({});
  const [confirmPasswordInputStyle, setConfirmPasswordInputStyle] = useState({});
  const [passwordIcon, setPasswordIcon] = useState(BlurredIconStyle);
  const [confirmPasswordIcon, setConfirmPasswordIcon] = useState(BlurredIconStyle);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Validate token presence
  useEffect(() => {
    if (!token || !email) {
      setIsTokenValid(false);
    }
  }, [token, email]);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

  const PasswordIcon = ({ iconColor }) => (
    <Ionicons name="lock-closed" size={moderateScale(20)} color={iconColor} />
  );

  const onFocusPassword = () => {
    onFocusInput(setPasswordInputStyle);
    onFocusIcon(setPasswordIcon);
  };
  const onBlurPassword = () => {
    onBlurInput(setPasswordInputStyle);
    onBlurIcon(setPasswordIcon);
  };
  const RightPasswordEyeIcon = ({ visible, onPress, iconColor }) => (
    <TouchableOpacity onPress={onPress} style={localStyles.eyeIconContainer}>
      <Ionicons
        name={visible ? 'eye-off' : 'eye'}
        size={moderateScale(20)}
        color={iconColor}
      />
    </TouchableOpacity>
  );

  const onPressPasswordEyeIcon = () => setIsPasswordVisible(!isPasswordVisible);
  const onPressConfirmPasswordEyeIcon = () =>
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  const onChangedPassword = val => {
    const { msg } = validatePassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };

  const onChangedConfirmPassword = val => {
    const { msg } = validateConfirmPassword(val.trim(), password);
    setConfirmPassword(val.trim());
    setConfirmPasswordError(msg);
  };

  const onFocusConfirmPassword = () => {
    onFocusInput(setConfirmPasswordInputStyle);
    onFocusIcon(setConfirmPasswordIcon);
  };
  const onBlurConfirmPassword = () => {
    onBlurInput(setConfirmPasswordInputStyle);
    onBlurIcon(setConfirmPasswordIcon);
  };

  const onPressContinue = async () => {
    // Validate passwords first
    const pwdError = validatePassword(password.trim());
    const confirmError = validateConfirmPassword(confirmPassword.trim(), password);

    if (pwdError.msg) {
      setPasswordError(pwdError.msg);
      return;
    }
    if (confirmError.msg) {
      setConfirmPasswordError(confirmError.msg);
      return;
    }

    setIsLoading(true);
    try {
      const response = await request.post('/user/reset-password', {
        token,
        email,
        newPassword: password,
      });

      if (response.data?.success) {
        setModalVisible(true);
        showSuccessToast(
          strings.passwordResetSuccess || 'Password Reset Successfully',
          strings.passwordResetSuccessDesc || 'You can now login with your new password.'
        );
      } else {
        showErrorToast(
          strings.error,
          response.data?.message || strings.invalidResetToken || 'Invalid or expired reset link.'
        );
      }
    } catch (error) {
      console.log('[CreateNewPassword] Error:', error);
      showErrorToast(
        strings.error,
        error?.message || strings.invalidResetToken || 'Invalid or expired reset link. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onPressModalClose = () => {
    setModalVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: StackNav.Login }],
    });
  };

  const onPressRequestNew = () => {
    navigation.navigate(StackNav.ForgotPassword);
  };

  // If token is invalid, show error screen
  if (!isTokenValid) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.createNewPassword} />
        <View style={localStyles.invalidTokenContainer}>
          <Ionicons name="alert-circle" size={moderateScale(80)} color={colors.danger || '#FF4444'} />
          <ZText type={'b20'} style={styles.mt20} align="center">
            {strings.invalidResetToken || 'Invalid Reset Link'}
          </ZText>
          <ZText type={'r16'} style={[styles.mt10, styles.ph20]} align="center" color={colors.grayScale6}>
            {strings.invalidResetTokenDesc || 'This reset link is invalid or has expired. Please request a new one.'}
          </ZText>
          <ZButton
            textType={'b18'}
            color={colors.white}
            title={strings.requestNewLink || 'Request New Link'}
            onPress={onPressRequestNew}
            containerStyle={localStyles.requestBtn}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.createNewPassword} />
      <ZKeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyles.root}>
          <View style={styles.mt40}>
            {colors.dark ? (
              <NewPassWordDark
                width={moderateScale(360)}
                height={getHeight(200)}
              />
            ) : (
              <NewPassWordLight
                width={moderateScale(360)}
                height={getHeight(200)}
              />
            )}
          </View>
          <ZText type={'m18'} style={styles.mt30}>
            {strings.createYourNewPassword}
          </ZText>
          <ZText type={'r14'} style={styles.mt10} color={colors.grayScale6}>
            {email}
          </ZText>
          <ZInput
            placeHolder={strings.password}
            keyBoardType={'default'}
            _value={password}
            _errorText={passwordError}
            autoCapitalize={'none'}
            insideLeftIcon={() => <PasswordIcon iconColor={passwordIcon} />}
            toGetTextFieldValue={onChangedPassword}
            inputContainerStyle={[
              { backgroundColor: colors.inputBg },
              localStyles.inputContainerStyle,
              passwordInputStyle,
            ]}
            _isSecure={isPasswordVisible}
            inputBoxStyle={[localStyles.inputBoxStyle]}
            _onFocus={onFocusPassword}
            onBlur={onBlurPassword}
            rightAccessory={() => (
              <RightPasswordEyeIcon
                visible={isPasswordVisible}
                onPress={onPressPasswordEyeIcon}
                iconColor={passwordIcon}
              />
            )}
          />
          <ZInput
            placeHolder={strings.confirmNewPassword}
            keyBoardType={'default'}
            _value={confirmPassword}
            _errorText={confirmPasswordError}
            autoCapitalize={'none'}
            insideLeftIcon={() => (
              <PasswordIcon iconColor={confirmPasswordIcon} />
            )}
            toGetTextFieldValue={onChangedConfirmPassword}
            inputContainerStyle={[
              { backgroundColor: colors.inputBg },
              localStyles.inputContainerStyle,
              confirmPasswordInputStyle,
            ]}
            _isSecure={isConfirmPasswordVisible}
            inputBoxStyle={[localStyles.inputBoxStyle]}
            _onFocus={onFocusConfirmPassword}
            onBlur={onBlurConfirmPassword}
            rightAccessory={() => (
              <RightPasswordEyeIcon
                visible={isConfirmPasswordVisible}
                onPress={onPressConfirmPasswordEyeIcon}
                iconColor={confirmPasswordIcon}
              />
            )}
          />
        </View>
      </ZKeyBoardAvoidWrapper>
      <ZButton
        textType={'b18'}
        color={colors.white}
        title={strings.resetPassword || 'Reset Password'}
        onPress={onPressContinue}
        containerStyle={[styles.m20, { marginBottom: moderateScale(60) }]}
        isLoading={isLoading}
        disabled={isLoading || !password || !confirmPassword}
      />
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={onPressModalClose}
        hideCounter={true}
        headerTitle={strings.passwordResetSuccess || 'Password Reset Successfully'}
        subTitle={strings.passwordResetSuccessDesc || 'You can now login with your new password.'}
        primaryBtnText={strings.backToLogin || 'Back to Login'}
      />
    </ZSafeAreaView>
  );
};

export default CreateNewPassword;

const localStyles = StyleSheet.create({
  root: {
    ...styles.ph20,
  },
  inputContainerStyle: {
    height: getHeight(60),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph15,
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
  eyeIconContainer: {
    padding: moderateScale(8),
  },
  invalidTokenContainer: {
    ...styles.flex,
    ...styles.center,
    ...styles.ph20,
  },
  requestBtn: {
    ...styles.mt30,
    width: '100%',
  },
});
