// Librairies import
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import {styles} from '../../themes';
import {NewPassWordDark, NewPassWordLight} from '../../assets/svgs';
import ZText from '../../components/common/ZText';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {getHeight, moderateScale} from '../../common/constants';
import ZInput from '../../components/common/ZInput';
import {
  validateConfirmPassword,
  validatePassword,
} from '../../utils/validators';
import {StackNav} from '../../navigation/NavigationKeys';
import SuccessModal from '../../components/models/SuccessModal';
import ZButton from '../../components/common/ZButton';

const CreateNewPassword = ({navigation}) => {
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(true);
  const [passwordInputStyle, setPasswordInputStyle] = useState({});
  const [confirmPasswordInputStyle, setConfirmPasswordInputStyle] = useState(
    {},
  );
  const [passwordIcon, setPasswordIcon] = useState(BlurredIconStyle);
  const [confirmPasswordIcon, setConfirmPasswordIcon] =
    useState(BlurredIconStyle);
  const [isCheck, setIsCheck] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

  const PasswordIcon = ({iconColor}) => (
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
  const RightPasswordEyeIcon = ({visible, onPress, iconColor}) => (
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
    const {msg} = validatePassword(val.trim());
    setPassword(val.trim());
    setPasswordError(msg);
  };

  const onChangedConfirmPassword = val => {
    const {msg} = validateConfirmPassword(val.trim(), password);
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

  const onPressContinue = () => {
    setModalVisible(true);
    navigation.navigate(StackNav.Login);
  };
  const onPressModalClose = () => setModalVisible(false);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.createNewPassword} />
      <ZKeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyles.root}>
          <View style={styles.mt40}>
            {colors.dark ? (
              <NewPassWordDark
                width={moderateScale(360)}
                height={getHeight(257)}
              />
            ) : (
              <NewPassWordLight
                width={moderateScale(360)}
                height={getHeight(257)}
              />
            )}
          </View>
          <ZText type={'m18'} style={styles.mt30}>
            {strings.createYourNewPassword}
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
              {backgroundColor: colors.inputBg},
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
              {backgroundColor: colors.inputBg},
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
          <TouchableOpacity
            onPress={() => setIsCheck(!isCheck)}
            style={localStyles.checkboxContainer}>
            <Ionicons
              name={isCheck ? 'square-outline' : 'checkbox'}
              size={moderateScale(26)}
              color={colors.primary}
            />
            <ZText type={'s14'} style={styles.mh10}>
              {strings.rememberMe}
            </ZText>
          </TouchableOpacity>
        </View>
      </ZKeyBoardAvoidWrapper>
      <ZButton
        textType={'b18'}
        color={colors.white}
        title={strings.continue}
        onPress={onPressContinue}
        containerStyle={styles.m20}
      />
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={onPressModalClose}
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
  checkboxContainer: {
    ...styles.rowCenter,
    ...styles.mb20,
  },
});
