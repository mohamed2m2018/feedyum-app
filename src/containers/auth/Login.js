// Library Imports
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {memo, useEffect} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local Imports
import strings from '../../i18n/strings';
import {colors, styles} from '../../themes';
import ZText from '../../components/common/ZText';
import {ACCESS_TOKEN, getHeight, moderateScale} from '../../common/constants';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import {Google_Icon} from '../../assets/svgs';

import {StackNav} from '../../navigation/NavigationKeys';
import ZInput from '../../components/common/ZInput';
import {validateEmail, validatePassword} from '../../utils/validators';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {setAsyncStorageData} from '../../utils/helpers';
import ZButton from '../../components/common/ZButton';
import {useMutation} from 'react-query';
import request from '../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import OneSignal from 'react-native-onesignal';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const RenderSocialBtn = memo(({item, index}) => {
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

const Login = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);

  const onPressSignInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const {user} = await GoogleSignin.signIn();
      // Use the information as needed
      await mutate(
        {
          email: user.email,
          password: '',
          isGoogleSignIn: true,
        },
        {
          onSuccess: async res => {
            await setAsyncStorageData(ACCESS_TOKEN, res?.data?.token);
            if (!request.defaults.headers.common.Authorization) {
              request.defaults.headers.common.Authorization = res?.data?.token;
            }
            navigation.reset({
              index: 0,
              routes: [{name: StackNav.TabBar}],
            });
          },
        },
      );
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow
        console.log('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is in progress
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        console.log('Play services not available');
      } else {
        // Some other error occurred
        console.log('Sign in error', error);
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

  const BlurredIconStyle = colors.grayScale5;
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
      '461220795216-310np2q6hf96uurinsk99ulbet2a9jf3.apps.googleusercontent.com',
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

  const {isLoading, mutate} = useMutation(login, {
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err[Object.keys(err)?.[0]],
      });
    },
    onSuccess: data => {
      OneSignal.setExternalUserId(data?.data?.user?._id);
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
    const {msg} = validateEmail(val.trim());
    setEmail(val.trim());
    setEmailError(msg);
  };
  const onChangedPassword = val => {
    const {msg} = validatePassword(val.trim());
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
          await setAsyncStorageData(ACCESS_TOKEN, res?.data?.token);
          if (!request.defaults.headers.common.Authorization) {
            request.defaults.headers.common.Authorization = res?.data?.token;
          }
          navigation.reset({
            index: 0,
            routes: [{name: StackNav.TabBar}],
          });
        },
      },
    );
  };
  const onPressPasswordEyeIcon = () => setIsPasswordVisible(!isPasswordVisible);
  const onPressSignUp = () => navigation.navigate(StackNav.Register);
  const onPressGuest = () => {
    setTimeout(() => {
      onPressSignWithPassword();
    }, 100);
  };
  // const onPressForgotPassword = () =>
  //   navigation.navigate(StackNav.ForgotPassword);

  return (
    <ZSafeAreaView style={localStyles.root}>
      <ZKeyBoardAvoidWrapper>
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
              {backgroundColor: colors.inputBg},
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
              {backgroundColor: colors.inputBg},
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
              isSubmitDisabled && {opacity: 0.5},
            ]}
            onPress={onPressSignWithPassword}
            disabled={isSubmitDisabled}
          />
          {/* <TouchableOpacity
            onPress={onPressForgotPassword}
            style={localStyles.forgotPasswordContainer}>
            <ZText
              type={'s16'}
              align={'center'}
              color={colors.primary}
              style={styles.mh10}>
              {strings.forgotPassword}
            </ZText>
          </TouchableOpacity> */}
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
            {socialIcon.map((item, index) => (
              <RenderSocialBtn item={item} key={index.toString()} />
            ))}
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
            <ZText type={'s12'} color={colors.grayScale5}>
              {strings.continueGuest}
            </ZText>
          </TouchableOpacity>
        </View>
      </ZKeyBoardAvoidWrapper>
    </ZSafeAreaView>
  );
};

export default Login;

const localStyles = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
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
});
