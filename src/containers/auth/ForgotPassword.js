import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local Imports
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import { styles } from '../../themes';
import ZText from '../../components/common/ZText';
import {
  ForgotPassword_Dark,
  ForgotPassword_Light,
} from '../../assets/svgs';
import { getHeight, moderateScale } from '../../common/constants';
import ZButton from '../../components/common/ZButton';
import ZInput from '../../components/common/ZInput';
import { validateEmail } from '../../utils/validators';
import request from '../../api/request';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const ForgotPassword = ({ navigation }) => {
  const colors = useSelector(state => state.theme.theme);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailInputStyle, setEmailInputStyle] = useState({});
  const [emailIcon, setEmailIcon] = useState(colors.grayScale4);

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.primaryTransparent,
    borderColor: colors.primary,
  };

  const onChangedEmail = val => {
    const { msg } = validateEmail(val.trim());
    setEmail(val.trim());
    setEmailError(msg);
  };

  const onFocusEmail = () => {
    setEmailInputStyle(FocusedStyle);
    setEmailIcon(colors.primary);
  };

  const onBlurEmail = () => {
    setEmailInputStyle(BlurredStyle);
    setEmailIcon(colors.grayScale4);
  };

  const EmailIcon = () => (
    <Ionicons name="mail" size={moderateScale(20)} color={emailIcon} />
  );

  const onPressSendLink = async () => {
    // Validate email first
    const { msg } = validateEmail(email.trim());
    if (msg) {
      setEmailError(msg);
      return;
    }

    setIsLoading(true);
    try {
      const response = await request.post('/user/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      if (response.data?.success) {
        setIsSuccess(true);
        showSuccessToast(
          strings.resetLinkSent || 'Reset Link Sent',
          strings.checkYourEmail || 'Check your email'
        );
      } else {
        // Still show success for security (don't reveal if email exists)
        setIsSuccess(true);
      }
    } catch (error) {
      console.log('[ForgotPassword] Error:', error);
      // Still show success for security (don't reveal if email exists)
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onPressBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.forgotPassword} />
      <ScrollView
        bounces={false}
        contentContainerStyle={localStyles.root}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.mv20, styles.selfCenter]}>
          {colors.dark ? (
            <ForgotPassword_Dark
              width={moderateScale(250)}
              height={getHeight(200)}
            />
          ) : (
            <ForgotPassword_Light
              width={moderateScale(250)}
              height={getHeight(200)}
            />
          )}
        </View>

        {!isSuccess ? (
          <>
            <ZText type={'r16'} style={styles.mb20}>
              {strings.forgotPasswordEmailDesc || 'Enter your email address and we will send you a link to reset your password.'}
            </ZText>

            <ZInput
              placeHolder={strings.email}
              keyBoardType={'email-address'}
              _value={email}
              _errorText={emailError}
              autoCapitalize={'none'}
              insideLeftIcon={() => <EmailIcon />}
              toGetTextFieldValue={onChangedEmail}
              inputContainerStyle={[
                { backgroundColor: colors.inputBg },
                localStyles.inputContainerStyle,
                emailInputStyle,
              ]}
              inputBoxStyle={[localStyles.inputBoxStyle]}
              _onFocus={onFocusEmail}
              onBlur={onBlurEmail}
            />

            <ZButton
              textType={'b18'}
              color={colors.white}
              title={strings.sendResetLink || 'Send Reset Link'}
              onPress={onPressSendLink}
              containerStyle={localStyles.sendBtn}
              isLoading={isLoading}
              disabled={isLoading || !email.trim()}
            />
          </>
        ) : (
          <View style={localStyles.successContainer}>
            <View style={[localStyles.successIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkmark-circle" size={moderateScale(60)} color={colors.primary} />
            </View>
            <ZText type={'b20'} style={styles.mt20} align="center">
              {strings.resetLinkSent || 'Reset Link Sent!'}
            </ZText>
            <ZText type={'r16'} style={[styles.mt10, styles.ph20]} align="center" color={colors.grayScale6}>
              {strings.resetLinkSentDesc || 'If an account exists with this email, you will receive a password reset link shortly.'}
            </ZText>
            <ZText type={'r14'} style={[styles.mt20]} align="center" color={colors.grayScale5}>
              {email}
            </ZText>
            <ZButton
              textType={'b18'}
              color={colors.white}
              title={strings.backToLogin || 'Back to Login'}
              onPress={onPressBackToLogin}
              containerStyle={localStyles.sendBtn}
            />
          </View>
        )}
      </ScrollView>
    </ZSafeAreaView>
  );
};

export default ForgotPassword;

const localStyles = StyleSheet.create({
  root: {
    ...styles.ph20,
    ...styles.flexGrow1,
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
  sendBtn: {
    ...styles.mt30,
    width: '100%',
  },
  successContainer: {
    ...styles.center,
    ...styles.flex,
    ...styles.pv20,
  },
  successIcon: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    ...styles.center,
  },
});
