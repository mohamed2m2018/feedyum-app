// Library Imports
import { StyleSheet, View, TouchableOpacity, I18nManager, Platform } from 'react-native';
import React, { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNRestart from 'react-native-restart';
import * as SplashScreen from 'expo-splash-screen';

// Local Imports
import strings from '../../i18n/strings';
import { colors, styles } from '../../themes';
import ZText from '../../components/common/ZText';
import { ACCESS_TOKEN, getHeight, moderateScale } from '../../common/constants';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import { Google_Icon } from '../../assets/svgs';

import { StackNav } from '../../navigation/NavigationKeys';
import ZInput from '../../components/common/ZInput';
import { validateEmail, validatePassword } from '../../utils/validators';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import ZButton from '../../components/common/ZButton';
import { useMutation, useQueryClient } from 'react-query';
import request from '../../api/request';
import { showWarningToast, showErrorToast } from '../../utils/toast';
import AppInitializer from '../../services/AppInitializer';
import { OneSignal } from 'react-native-onesignal';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import ZHeader from '../../components/common/ZHeader';
import { useStorage } from '../../utils/useStorage';
import { useWebGoogleSignIn } from '../../hooks/useWebGoogleSignIn';

const RenderSocialBtn = memo(({ item, index }) => {
  return (
    <>
      <TouchableOpacity
        key={index}
        onPress={item.onPress}
        style={[
          localStyles.socialBtn,
          {
            backgroundColor: colors.inputBg,
          },
        ]}>
        {item.icon}
      </TouchableOpacity>
      <ZText type={'r20'} onPress={item.onPress}>
        {strings.loginWithGoogle}
      </ZText>
    </>
  );
});

const Login = ({ navigation }) => {
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [_, setAccessToken] = useStorage(ACCESS_TOKEN);
  const [__, setUser] = useStorage('user');
  const [___, setLanguage] = useStorage('language');

  useEffect(() => {
    // Hide native splash screen once Login component is mounted
    SplashScreen.hideAsync();
  }, []);

  const onWebGoogleTokenReceived = useCallback(async (idToken) => {
    if (!idToken) {
      showErrorToast(strings.error, strings.googleSignInFailed);
      return;
    }
    
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const email = payload.email;
      
      console.log('[Login] Calling mutate login with Web googleIdToken...');
      await mutate(
        { email, googleIdToken: idToken },
        {
          onSuccess: async res => {
            const token = res?.data?.token;
            const userData = res?.data?.user;
            
            setAccessToken(token);
            setUser(userData);
            await AppInitializer.handleUserLogin(userData, token);
            await queryClient.clear();
            
            navigation.reset({ index: 0, routes: [{ name: StackNav.TabBar }] });
          },
          onError: () => {
            showWarningToast(strings.error, strings.notsignedInWithGoogle);
            setTimeout(() => {
              navigation.navigate(StackNav.Register, { isGoogleSignInFailed: true });
            }, 200);
          },
        }
      );
    } catch (error) {
      console.error('[Web Google Login] Error processing login:', error);
    }
  }, [mutate, navigation, queryClient, setAccessToken, setUser]);

  // Use custom hook for web Google Sign-In to keep component clean
  useWebGoogleSignIn({ onTokenReceived: onWebGoogleTokenReceived });

  const onPressSignInWithGoogle = async () => {
    try {
      console.log('[Login] Check Play Services...');
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log('[Login] signIn full response:', JSON.stringify(response, null, 2));
      const user = response.data?.user || response.user; // Handle both v13 structure and potential legacy/different structure
      const idToken = response.data?.idToken || response.idToken;

      console.log('[Login] Extracted user:', user);

      if (!idToken) {
        console.error('[Login] No idToken received from Google');
        showErrorToast(strings.error, strings.googleSignInFailed);
        return;
      }

      // Send verified Google ID token to backend for server-side verification
      console.log('[Login] Calling mutate login with googleIdToken...');
      await mutate(
        {
          email: user?.email,
          googleIdToken: idToken,
        },
        {
          onSuccess: async res => {
            console.log('[Login] mutate onSuccess triggered', res);
            setAccessToken(res?.data?.token);
            setAccessToken(res?.data?.token);
            setUser(res?.data?.user);
            await AppInitializer.handleUserLogin(res?.data?.user, res?.data?.token);
            // Clear React Query cache to force fresh data fetch for this device
            await queryClient.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: StackNav.TabBar }],
            });
          },
          onError: (err) => {
            console.log('[Login] mutate onError triggered', err);
            showWarningToast(strings.error, strings.notsignedInWithGoogle);
            setTimeout(() => {
              navigation.navigate(StackNav.Register, {
                isGoogleSignInFailed: true,
              });
            }, 200);
          },
        },
      );
    } catch (error) {
      console.log('[Login] GoogleSignin catch error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow

      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is in progress

      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated

      } else {
        // Some other error occurred

      }
    }
  };

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.primaryTransparent,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.grayScale4;
  const FocusedIconStyle = colors.primary;

  const socialIcon = [
    {
      icon: <Google_Icon />,
      onPress: () => onPressSignInWithGoogle(),
    },
  ];

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [emailIcon, setEmailIcon] = React.useState(BlurredIconStyle);
  const [passwordIcon, setPasswordIcon] = React.useState(BlurredIconStyle);
  const [isSubmitDisabled, setIsSubmitDisabled] = React.useState(true);
  const [emailInputStyle, setEmailInputStyle] = React.useState(BlurredStyle);
  const [passwordInputStyle, setPasswordInputStyle] =
    React.useState(BlurredStyle);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(true);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

  GoogleSignin.configure({
    // Add your web client ID here
    webClientId:
      '366063482945-m3nacq9l697asg8f6ss2tabvt05i03d6.apps.googleusercontent.com',
    offlineAccess: true,
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/user.phonenumbers.read',
    ],
  });

  const login = data => {
    return request.post('/user/login', data);
  };

  const { isLoading, mutate } = useMutation(login, {
    onError: err => {
      console.log('[Login] Mutation Error:', err);
      let message = strings.error;
      if (typeof err === 'string') {
        message = err;
      } else if (err?.message) {
        message = err.message;
      } else if (err?.error) {
        message = err.error;
      } else if (err && typeof err === 'object') {
        // Fallback: try to find the first string value in the object
        const keys = Object.keys(err);
        if (keys.length > 0) {
          const firstValue = err[keys[0]];
          if (typeof firstValue === 'string') {
            message = firstValue;
          } else {
            message = JSON.stringify(err);
          }
        }
      }
      showErrorToast(strings.error, message);
    },
    onSuccess: async data => {
      // OneSignal v5
      const rawId = data?.data?.user?._id;
      console.log('[Login] User ID Type:', typeof rawId);
      console.log('[Login] User ID Value:', rawId);

      let userId = rawId;
      if (typeof rawId === 'object' && rawId !== null) {
        // Fallback if it's an object (shouldn't happen with standard JSON, but safety first)
        userId = rawId.toString();
      }

      if (userId && userId !== '[object Object]') {
        try {
          OneSignal.logout(); // Clear stale identity from previous user on this device
          OneSignal.login(String(userId));
        } catch (e) {
          console.warn('[Login] OneSignal identity switch failed:', e);
        }
      } else {
        console.warn('[Login] Invalid User ID for OneSignal:', rawId);
      }
    },
  });

  useEffect(() => {
    if (
      email.length > 0 &&
      password.length > 0 &&
      !emailError &&
      !passwordError
    ) {
      setIsSubmitDisabled(false);
    } else {
      setIsSubmitDisabled(true);
    }
  }, [email, password, emailError, passwordError]);

  const onChangedEmail = val => {
    const { msg } = validateEmail(val.trim());
    setEmail(val.trim());
    setEmailError(msg);
  };
  const onChangedPassword = val => {
    const { msg } = validatePassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };

  const EmailIcon = () => {
    return <Ionicons name="mail" size={moderateScale(20)} color={emailIcon} />;
  };

  const onFocusEmail = () => {
    onFocusInput(setEmailInputStyle);
    onFocusIcon(setEmailIcon);
  };
  const onBlurEmail = () => {
    onBlurInput(setEmailInputStyle);
    onBlurIcon(setEmailIcon);
  };

  const PasswordIcon = () => (
    <Ionicons
      name="lock-closed"
      size={moderateScale(20)}
      color={passwordIcon}
    />
  );

  const onFocusPassword = () => {
    onFocusInput(setPasswordInputStyle);
    onFocusIcon(setPasswordIcon);
  };
  const onBlurPassword = () => {
    onBlurInput(setPasswordInputStyle);
    onBlurIcon(setPasswordIcon);
  };
  const RightPasswordEyeIcon = () => (
    <TouchableOpacity
      onPress={onPressPasswordEyeIcon}
      style={localStyles.eyeIconContainer}>
      <Ionicons
        name={isPasswordVisible ? 'eye-off' : 'eye'}
        size={moderateScale(20)}
        color={passwordIcon}
      />
    </TouchableOpacity>
  );

  const onPressSignWithPassword = async () => {
    await mutate(
      {
        email: email || 'guest@foodtok.com',
        password: password || '123456Ab-',
      },
      {
        onSuccess: async res => {
          setAccessToken(res?.data?.token);
          setAccessToken(res?.data?.token);
          setUser(res?.data?.user);
          await AppInitializer.handleUserLogin(res?.data?.user, res?.data?.token);
          // Clear React Query cache to force fresh data fetch for this device
          // Clear React Query cache to force fresh data fetch for this device
          await queryClient.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: StackNav.TabBar }],
          });
        },
      },
    );
  };
  const onPressPasswordEyeIcon = () => setIsPasswordVisible(!isPasswordVisible);
  const onPressEnglish = async () => {
    setLanguage('en');
    await I18nManager.allowRTL(false);
    await I18nManager.forceRTL(false);
    RNRestart.restart();
  };
  const onPressArabic = async () => {
    setLanguage('ar');
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    RNRestart.restart();
  };
  const onPressSignUp = () => navigation.navigate(StackNav.Register);
  const onPressGuest = () => {
    setTimeout(() => {
      onPressSignWithPassword();
    }, 100);
  };
  const onPressForgotPassword = () =>
    navigation.navigate(StackNav.ForgotPassword);

  return (
    <ZSafeAreaView style={localStyles.root}>
      {Platform.OS === 'web' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: colors.dark === 'dark' ? '#0b0c10' : '#f4f7f6',
          backgroundImage: colors.dark === 'dark'
            ? 'radial-gradient(circle at 10% 10%, rgba(255,77,103,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(114,16,255,0.12) 0%, transparent 40%)'
            : 'radial-gradient(circle at 10% 10%, rgba(255,77,103,0.08) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(114,16,255,0.06) 0%, transparent 40%)',
          zIndex: 0,
        }} />
      )}
      <ZKeyBoardAvoidWrapper>
        {navigation.canGoBack() && <ZHeader />}
        <View style={Platform.OS === 'web' ? localStyles.webContentWrapper : { flex: 1 }}>
        <View style={Platform.OS === 'web' ? [localStyles.webCardContainer, {
          backgroundColor: colors.dark === 'dark' ? 'rgba(31,34,42,0.6)' : 'rgba(255,255,255,0.7)',
          borderColor: colors.dark === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        }] : {}}>
          <View style={localStyles.mainContainer}>
          <ZText type={'b46'} align={'left'} style={styles.mv40}>
            {strings.loginYourAccount}
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
              { backgroundColor: Platform.OS === 'web' ? (colors.dark === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)') : colors.inputBg },
              Platform.OS === 'web' && { borderWidth: 1, borderColor: colors.dark === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              localStyles.inputContainerStyle,
              emailInputStyle,
            ]}
            inputBoxStyle={[localStyles.inputBoxStyle]}
            _onFocus={onFocusEmail}
            onBlur={onBlurEmail}
          />
          <ZInput
            placeHolder={strings.password}
            keyBoardType={'default'}
            _value={password}
            _errorText={passwordError}
            autoCapitalize={'none'}
            insideLeftIcon={() => <PasswordIcon />}
            toGetTextFieldValue={onChangedPassword}
            inputContainerStyle={[
              { backgroundColor: Platform.OS === 'web' ? (colors.dark === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)') : colors.inputBg },
              Platform.OS === 'web' && { borderWidth: 1, borderColor: colors.dark === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              localStyles.inputContainerStyle,
              passwordInputStyle,
            ]}
            _isSecure={isPasswordVisible}
            inputBoxStyle={[localStyles.inputBoxStyle]}
            _onFocus={onFocusPassword}
            onBlur={onBlurPassword}
            rightAccessory={() => <RightPasswordEyeIcon />}
          />

          <ZButton
            title={strings.signIn}
            textType={'b18'}
            isLoading={isLoading}
            color={colors.white}
            containerStyle={[
              localStyles.signBtnContainer,
              isSubmitDisabled && { opacity: 0.5 },
            ]}
            onPress={onPressSignWithPassword}
            disabled={isSubmitDisabled}
          />
          <TouchableOpacity
            onPress={onPressForgotPassword}
            style={localStyles.forgotPasswordContainer}>
            <ZText
              type={'s16'}
              align={'center'}
              color={colors.primary}
              style={styles.mh10}>
              {strings.forgotPassword}
            </ZText>
          </TouchableOpacity>
          {/* <View style={localStyles.divider}>
            <View
              style={[
                localStyles.orContainer,
                {backgroundColor: colors.bColor},
              ]}
            />
            <ZText type={'s18'} style={styles.mh10}>
              {strings.orContinueWith}
            </ZText>
            <View
              style={[
                localStyles.orContainer,
                {backgroundColor: colors.bColor},
              ]}
            />
          </View>
            */}

          <View style={localStyles.socialBtnContainer}>
            {Platform.OS === 'web' ? (
               <View id="google-signin-btn" style={{ minHeight: 40 }} />
            ) : (
              socialIcon.map((item, index) => (
                <RenderSocialBtn item={item} key={index.toString()} />
              ))
            )}
          </View>

          <TouchableOpacity
            onPress={onPressSignUp}
            style={localStyles.signUpContainer}>
            <ZText type={'r14'}>{strings.dontHaveAccount}</ZText>
            <ZText type={'s14'} color={colors.primary}>
              {' '}
              {strings.signUp}
            </ZText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressGuest}
            style={localStyles.signUpContainer}>
            <ZText type={'s14'} color={colors.textColor}>
              {strings.continueGuest}
            </ZText>
          </TouchableOpacity>
          <View
            style={{ flexDirection: 'row', alignSelf: 'center', marginTop: 100 }}>
            <TouchableOpacity
              onPress={onPressEnglish}
              style={[localStyles.signUpContainer, { marginRight: 10 }]}>
              <ZText
                type={'s14'}
                color={I18nManager.isRTL ? colors.textColor : colors.primary}>
                English
              </ZText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onPressArabic}
              style={localStyles.signUpContainer}>
              <ZText
                type={'s14'}
                color={!I18nManager.isRTL ? colors.textColor : colors.primary}>
                العربية
              </ZText>
            </TouchableOpacity>
          </View>
        </View>
        </View>
        </View>
      </ZKeyBoardAvoidWrapper>
    </ZSafeAreaView>
  );
};

export default Login;

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: '100vh',
    padding: moderateScale(20),
  },
  webCardContainer: {
    width: '100%',
    maxWidth: 440,
    padding: moderateScale(40),
    borderRadius: 24,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 10,
  },
  mainContainer: {
    // on web, we don't need the extra padding because the card handles it, but we keep it for mobile
    ...(Platform.OS !== 'web' && styles.ph20),
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mv30,
  },
  orContainer: {
    height: getHeight(1),
    width: '30%',
  },
  signBtnContainer: {
    ...styles.center,
    width: '100%',
    ...styles.mv20,
  },
  signUpContainer: {
    ...styles.rowCenter,
    ...styles.mv10,
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
  checkboxContainer: {
    ...styles.rowCenter,
    ...styles.mb20,
  },
  socialBtnContainer: {
    ...styles.rowCenter,
    ...styles.mv20,
    alignSelf: 'center',
  },
  socialBtn: {
    ...styles.rowCenter,
    alignSelf: 'center',
    height: getHeight(55),
    width: moderateScale(80),
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
    borderColor: 'grey',
    ...styles.mh10,
  },
  forgotPasswordContainer: {
    ...styles.rowCenter,
    ...styles.mb10,
  },
});
