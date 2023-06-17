// Library import
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {styles} from '../../themes';
import {getHeight, moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';

const SetPin = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [pin, setPin] = React.useState('');

  const onPinChange = code => setPin(code);
  const onPressPinContinue = () => navigation.navigate(StackNav.SetSecure);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.createNewPin} />
      <ZKeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyles.root}>
          <ZText type={'r18'} align={'center'}>
            {strings.pinDesc}
          </ZText>
          <OTPInputView
            pinCount={4}
            code={pin}
            onCodeChanged={onPinChange}
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
        </View>
        <ZButton
          textType={'b18'}
          color={colors.white}
          title={strings.continue}
          onPress={onPressPinContinue}
          containerStyle={localStyles.btnContainerStyle}
        />
      </ZKeyBoardAvoidWrapper>
    </ZSafeAreaView>
  );
};

export default SetPin;

const localStyles = StyleSheet.create({
  root: {
    ...styles.ph30,
    ...styles.justifyCenter,
    ...styles.flex,
  },
  pinInputStyle: {
    height: getHeight(60),
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
});
