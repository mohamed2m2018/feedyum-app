// Library import
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import CountDown from 'react-native-countdown-component';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {styles} from '../../themes';
import {getHeight, moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKeys';
import typography from '../../themes/typography';
import ZButton from '../../components/common/ZButton';

const ForgotPasswordOtp = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [counterId, setCounterId] = useState('1');
  const [isTimeOver, setIsTimeOver] = useState(false);

  const onOtpChange = code => setOtp(code);
  const onPressVerify = () => navigation.navigate(StackNav.CreateNewPassword);

  const onFinishTimer = () => setIsTimeOver(true);

  const onPressResend = () => {
    setCounterId(counterId + '1');
    setIsTimeOver(false);
    setOtp('');
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.forgotPassword} />
      <ZKeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyles.root}>
          <ZText type={'r18'} align={'center'} style={styles.mb20}>
            {strings.codeSendOn}
          </ZText>
          <OTPInputView
            pinCount={4}
            code={otp}
            onCodeChanged={onOtpChange}
            autoFocusOnLoad={false}
            codeInputFieldStyle={[
              localStyles.pinInputStyle,
              {
                color: colors.textColor,
                backgroundColor: colors.inputBg,
                borderColor: colors.bColor,
              },
            ]}
            codeInputHighlightStyle={{
              backgroundColor: colors.inputFocusColor,
              borderColor: colors.primary,
            }}
            style={localStyles.inputStyle}
            secureTextEntry={true}
          />
          <View style={styles.rowCenter}>
            {isTimeOver ? (
              <TouchableOpacity
                onPress={onPressResend}
                disabled={isTimeOver ? false : true}
                style={styles.p5}>
                <ZText type={'m18'} color={colors.primary} align={'center'}>
                  {strings.resendCode}
                </ZText>
              </TouchableOpacity>
            ) : (
              <View style={styles.rowCenter}>
                <ZText type={'m18'} align={'center'}>
                  {strings.resendCodeIn}
                </ZText>
                <CountDown
                  id={counterId}
                  until={10}
                  onFinish={onFinishTimer}
                  digitStyle={{backgroundColor: colors.backgroundColor}}
                  digitTxtStyle={[
                    localStyles.digitStyle,
                    {color: colors.primary},
                  ]}
                  timeToShow={['S']}
                  timeLabels={{m: null, s: null}}
                />
                <ZText type={'m18'} align={'center'}>
                  {strings.second}
                </ZText>
              </View>
            )}
          </View>
        </View>
        <ZButton
          textType={'b18'}
          color={colors.white}
          title={strings.verify}
          onPress={onPressVerify}
          containerStyle={localStyles.btnContainerStyle}
          // disabled={otp.length === 4 ? false : true}
          // bgColor={otp.length !== 4 && colors.primary4}
        />
      </ZKeyBoardAvoidWrapper>
    </ZSafeAreaView>
  );
};

export default ForgotPasswordOtp;

const localStyles = StyleSheet.create({
  root: {
    ...styles.ph30,
    ...styles.justifyCenter,
    ...styles.flex,
  },
  pinInputStyle: {
    height: moderateScale(60),
    width: moderateScale(75),
    fontSize: moderateScale(26),
    borderRadius: moderateScale(15),
  },
  btnContainerStyle: {
    ...styles.m20,
  },
  inputStyle: {
    height: getHeight(60),
    ...styles.mv30,
  },
  digitStyle: {
    fontSize: moderateScale(18),
    ...typography.fontWeights.Regular,
  },
});
