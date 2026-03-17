// Library Imports
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local Imports
import strings from '../../i18n/strings';
import { styles, colors } from '../../themes';
import ZText from '../../components/common/ZText';
import { ACCESS_TOKEN, getHeight, moderateScale } from '../../common/constants';
import ZHeader from '../../components/common/ZHeader';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import { Google_Icon } from '../../assets/svgs';
import { StackNav } from '../../navigation/NavigationKeys';
import ZInput from '../../components/common/ZInput';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import { validateEmail, validatePassword } from '../../utils/validators';
import ZButton from '../../components/common/ZButton';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import axios from 'axios';
import request from '../../api/request';
import { useQueryClient } from 'react-query';
import { showErrorToast } from '../../utils/toast';
import { useStorage } from '../../utils/useStorage';
import AppInitializer from '../../services/AppInitializer';
import UserTypeSelectionModal from '../../components/modals/UserTypeSelectionModal';
import TermsAcceptanceModal from '../../components/modals/TermsAcceptanceModal';
import ChefBrandSetupModal from '../../components/modals/ChefBrandSetupModal';

// Debounce timeout ref for email availability check
let emailCheckTimeout = null;

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
        {strings.reigsterWithGoogle}
      </ZText>
    </>
  );
});
const Register = ({ navigation, route }) => {
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [isLoading, setisLoading] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showBrandSetup, setShowBrandSetup] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'google' or 'password'
  const [pendingChefSelection, setPendingChefSelection] = useState(false);

  useEffect(() => {
    if (route.params?.isGoogleSignInFailed) {
      setPendingAction('google');
      setShowUserTypeModal(true);
    }
  }, [route]);

  // Handle user type selection from modal — show terms acceptance next
  const handleUserTypeSelect = (isChefSelected) => {
    setShowUserTypeModal(false);
    setPendingChefSelection(isChefSelected);
    // Show the terms acceptance modal
    setShowTermsModal(true);
  };

  // Handle terms acceptance — proceed with actual registration
  const handleTermsAccepted = () => {
    setShowTermsModal(false);
    setIsChef(pendingChefSelection);

    if (pendingAction === 'google') {
      onPressSignUpWithGoogle(pendingChefSelection);
    } else if (pendingAction === 'password') {
      navigation.navigate(StackNav.SetUpProfile, {
        title: strings.fillYourProfile,
        email,
        password,
        type: pendingChefSelection ? 'chef' : 'user',
      });
    }
    setPendingAction(null);
    setPendingChefSelection(false);
  };

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
    googleIdToken,
  ) => {
    setisLoading(true);
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
        googleIdToken,
      })
      .then(async res => {
        setAccessToken(res?.data?.token);
        // Use AppInitializer to handle consistent login logic (includes OneSignal login)
        await AppInitializer.handleUserLogin(res?.data?.user, res?.data?.token);

        // Clear React Query cache to force fresh data fetch for this device
        await queryClient.clear();
        setisLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.TabBar }],
        });
      })
      .catch(err => {
        setisLoading(false);
        console.log('Registration Error:', err);
        let message = strings.somethingWentWrong;
        if (typeof err === 'string') {
          message = err;
        } else if (err && typeof err === 'object') {
          // Try to find common error fields
          message = err.message || err.error || err.email || err.password || JSON.stringify(err);
          // If the first key is an object (like mongoose 'errors'), stringify it
          const firstKey = Object.keys(err)?.[0];
          if (firstKey && typeof err[firstKey] === 'string') {
            message = err[firstKey];
          }
        }

        showErrorToast(strings.error, message);
      });
  };

  const onPressSignUpWithGoogle = async (isChefParam) => {
    setisLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign In Response:', userInfo);
      const user = userInfo?.data?.user || userInfo?.user || userInfo;
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      const { accessToken } = await GoogleSignin.getTokens();
      const phone = await getPhoneNumber(accessToken);

      if (!idToken) {
        setisLoading(false);
        console.error('[Register] No idToken received from Google');
        showErrorToast(strings.error, strings.googleSignInFailed);
        return;
      }

      // Chef: show brand setup modal first to collect name + photo before creating account
      if (isChefParam) {
        setisLoading(false);
        setPendingGoogleData({ user, phone, idToken });
        setShowBrandSetup(true);
      } else {
        // Regular user: create account directly with Google data
        handleSubmit(
          user.name,
          phone,
          '',
          '',
          user.email,
          'user',
          user.photo,
          idToken,
        );
      }
    } catch (error) {
      setisLoading(false);
      console.log('Google Sign In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        showErrorToast(strings.error, strings.playServicesNotAvailable);
      } else {
        // Some other error occurred
        showErrorToast(strings.error, error.message || strings.googleSignInFailed);
      }
    }
  };

  const socialIcon = [
    {
      icon: <Google_Icon />,
      onPress: () => {
        setPendingAction('google');
        setShowUserTypeModal(true);
      },
    },
  ];
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isChef, setIsChef] = React.useState(true);
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [emailIcon, setEmailIcon] = React.useState(BlurredIconStyle);
  const [passwordIcon, setPasswordIcon] = React.useState(BlurredIconStyle);
  const [isSubmitDisabled, setIsSubmitDisabled] = React.useState(true);
  const [emailInputStyle, setEmailInputStyle] = React.useState(BlurredStyle);
  const [_, setAccessToken] = useStorage(ACCESS_TOKEN);
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
    const trimmedEmail = val.trim();
    const { msg } = validateEmail(trimmedEmail);
    setEmail(trimmedEmail);
    setEmailError(msg);

    // Clear any pending check
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // If email format is valid, check availability after debounce
    if (!msg && trimmedEmail.length > 0) {
      emailCheckTimeout = setTimeout(async () => {
        try {
          const response = await request.post('/user/check-availability', {
            email: trimmedEmail,
          });
          if (response?.data?.fields?.email?.available === false) {
            setEmailError(strings.emailAlreadyRegistered);
          }
        } catch (error) {
          console.log('Email check error:', error);
        }
      }, 500); // 500ms debounce
    }
  };

  const onChangedPassword = val => {
    const { msg } = validatePassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };

  const onPressSignWithPassword = () => {
    setPendingAction('password');
    setShowUserTypeModal(true);
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
      {navigation.canGoBack() && <ZHeader />}
      <ZKeyBoardAvoidWrapper>
        <View
          style={localStyles.mainContainer}
          pointerEvents={isLoading ? 'none' : 'auto'}>
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
              { backgroundColor: colors.inputBg },
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
              { backgroundColor: colors.inputBg },
              localStyles.inputContainerStyle,
              passwordInputStyle,
            ]}
            _isSecure={isPasswordVisible}
            inputBoxStyle={[localStyles.inputBoxStyle]}
            _onFocus={onFocusPassword}
            onBlur={onBlurPassword}
            rightAccessory={() => <RightPasswordEyeIcon />}
          />

          {isLoading && (
            <ActivityIndicator
              size={'large'}
              style={{ alignSelf: 'center' }}
              color={colors.primary}
            />
          )}
          <ZButton
            title={strings.signUp}
            textType={'b18'}
            color={colors.white}
            containerStyle={[
              localStyles.signBtnContainer,
              isSubmitDisabled && { opacity: 0.5 },
            ]}
            onPress={onPressSignWithPassword}
            disabled={isSubmitDisabled}
          />

          <View style={localStyles.divider}>
            <View
              style={[
                localStyles.orContainer,
                { backgroundColor: colors.bColor },
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
              {'  ' + strings.signIn}
            </ZText>
          </TouchableOpacity>
        </View>
      </ZKeyBoardAvoidWrapper>

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        visible={showUserTypeModal}
        onSelect={handleUserTypeSelect}
        onClose={() => {
          setShowUserTypeModal(false);
          setPendingAction(null);
        }}
      />

      {/* Terms Acceptance Modal */}
      <TermsAcceptanceModal
        visible={showTermsModal}
        onAccept={handleTermsAccepted}
        onClose={() => {
          setShowTermsModal(false);
          setPendingAction(null);
          setPendingChefSelection(false);
        }}
      />

      {/* Chef Brand Setup Modal — shown BEFORE account creation for Google chefs */}
      <ChefBrandSetupModal
        visible={showBrandSetup}
        onComplete={(kitchenName, kitchenPhoto) => {
          setShowBrandSetup(false);
          if (pendingGoogleData) {
            const { user, phone, idToken } = pendingGoogleData;
            // Create account with the chef's chosen brand name + photo
            handleSubmit(
              kitchenName,
              phone,
              '',
              '',
              user.email,
              'chef',
              kitchenPhoto,
              idToken,
            );
            setPendingGoogleData(null);
          }
        }}
        onDismiss={() => {
          setShowBrandSetup(false);
          setPendingGoogleData(null);
        }}
      />
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
