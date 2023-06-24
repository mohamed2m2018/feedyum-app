// Library Imports
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {memo, useEffect} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local Imports
import strings from '../../i18n/strings';
import {styles} from '../../themes';
import ZText from '../../components/common/ZText';
import {ACCESS_TOKEN, getHeight, moderateScale} from '../../common/constants';
import ZHeader from '../../components/common/ZHeader';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import {Google_Icon} from '../../assets/svgs';
import {StackNav} from '../../navigation/NavigationKeys';
import ZInput from '../../components/common/ZInput';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {validateEmail, validatePassword} from '../../utils/validators';
import ZButton from '../../components/common/ZButton';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import axios from 'axios';
import request from '../../api/request';
import {setAsyncStorageData} from '../../utils/helpers';
import OneSignal from 'react-native-onesignal';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';

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

const Register = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };
  const BlurredIconStyle = colors.grayScale5;
  const FocusedIconStyle = colors.primary;

  const getPhoneNumber = async accessToken => {
    try {
      const response = await axios.get(
        'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const phoneNumber = response.data.phoneNumbers[0].value;
      return phoneNumber;
    } catch (error) {
      console.log('Error occurred:', error);
    }
  };

  const handleSubmit = (
    fullName,
    phoneNo,
    nickname,
    gender,
    email,
    type,
    selectImage,
  ) => {
    request
      .post('/user', {
        fullName,
        phone: phoneNo,
        userName: nickname,
        gender,
        email,
        password,
        type,
        avatar: selectImage,
        isGoogleSignIn: true,
        // categories,
      })
      .then(async res => {
        await setAsyncStorageData(ACCESS_TOKEN, res?.data?.token);
        OneSignal.setExternalUserId(res?.data?.user?._id);
        request.defaults.headers.common.Authorization = res?.data?.token;
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabBar}],
        });
      })
      .catch(err => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: err[Object.keys(err)?.[0]],
        });
      });
  };

  const onPressSignUpWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const {user} = await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();
      const phone = await getPhoneNumber(accessToken);
      // Use the information as needed
      handleSubmit(
        user.name,
        phone,
        '',
        '',
        user.email,
        isChef ? 'chef' : 'user',
        user.photo,
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

  const socialIcon = [
    {
      icon: <Google_Icon />,
      onPress: () => onPressSignUpWithGoogle(),
    },
  ];

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isChef, setIsChef] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [emailIcon, setEmailIcon] = React.useState(BlurredIconStyle);
  const [passwordIcon, setPasswordIcon] = React.useState(BlurredIconStyle);
  const [isSubmitDisabled, setIsSubmitDisabled] = React.useState(true);
  const [emailInputStyle, setEmailInputStyle] = React.useState(BlurredStyle);

  const [passwordInputStyle, setPasswordInputStyle] =
    React.useState(BlurredStyle);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

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

  const RenderSocialBtn = memo(({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={item.onPress}
        style={[
          localStyles.socialBtn,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.bColor,
          },
        ]}>
        {item.icon}
      </TouchableOpacity>
    );
  });
  const onPressSignWithPassword = () => {
    navigation.navigate(StackNav.SelectInterest, {
      email,
      password,
      type: isChef ? 'chef' : 'user',
    });
  };

  const onPressPasswordEyeIcon = () => {
    setIsPasswordVisible(!isPasswordVisible);
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

  const onPressSignIn = () => {
    navigation.navigate(StackNav.Login);
  };

  return (
    <ZSafeAreaView>
      <ZHeader />
      <ZKeyBoardAvoidWrapper>
        <View style={localStyles.mainContainer}>
          <ZText type={'b46'} align={'left'} style={styles.mv40}>
            {strings.createYourAccount}
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

          <TouchableOpacity
            onPress={() => setIsChef(!isChef)}
            style={localStyles.checkboxContainer}>
            <Ionicons
              name={isChef ? 'square-outline' : 'checkbox'}
              size={moderateScale(26)}
              color={colors.primary}
            />
            <ZText type={'s24'} style={styles.mh10}>
              Are you a Chef or Restaurant?
            </ZText>
          </TouchableOpacity>

          <ZButton
            title={strings.signUp}
            textType={'b18'}
            color={colors.white}
            containerStyle={[
              localStyles.signBtnContainer,
              isSubmitDisabled && {opacity: 0.5},
            ]}
            onPress={onPressSignWithPassword}
            disabled={isSubmitDisabled}
          />
          <View style={localStyles.divider}>
            <View
              style={[
                localStyles.orContainer,
                {backgroundColor: colors.bColor},
              ]}
            />
            {/* <ZText type={'s18'} style={styles.mh10} color={colors.gray}>
              {strings.orContinueWith}
            </ZText> */}
            {/* <View
              style={[
                localStyles.orContainer,
                {backgroundColor: colors.bColor},
              ]}
            /> */}
          </View>

          <View style={localStyles.socialBtnContainer}>
            {socialIcon.map((item, index) => (
              <RenderSocialBtn item={item} key={index.toString()} />
            ))}
          </View>

          <TouchableOpacity
            onPress={onPressSignIn}
            style={localStyles.signUpContainer}>
            <ZText type={'r14'}>{strings.AlreadyHaveAccount}</ZText>
            <ZText type={'s14'} color={colors.primary}>
              {strings.signIn}
            </ZText>
          </TouchableOpacity>
        </View>
      </ZKeyBoardAvoidWrapper>
    </ZSafeAreaView>
  );
};

export default Register;

const localStyles = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mv20,
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
    ...styles.mv20,
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
    ...styles.flexRow,
    ...styles.mb20,
    ...styles.mt20,
  },
  socialBtnContainer: {
    ...styles.rowCenter,
    ...styles.mv20,
  },
  socialBtn: {
    ...styles.center,
    height: getHeight(60),
    width: moderateScale(90),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.mh10,
  },
});
