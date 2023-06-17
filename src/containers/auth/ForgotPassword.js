import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo, useState} from 'react';
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import {styles} from '../../themes';
import ZText from '../../components/common/ZText';
import {useSelector} from 'react-redux';
import {
  Email_Icon,
  ForgotPassword_Dark,
  ForgotPassword_Light,
  Sms_Icon,
} from '../../assets/svgs';
import {getHeight, moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';

const ForgotPassword = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isSelected, setIsSelected] = useState('sms');

  const ModeData = [
    {
      id: 1,
      title: strings.viaSms,
      icon: <Sms_Icon />,
      msgId: '+1 233 456 78 90',
      onPress: () => onPressSms(),
    },
    {
      id: 2,
      title: strings.viaEmail,
      icon: <Email_Icon />,
      msgId: 'qweew********1233@gmai.com',
      onPress: () => onPressEmail(),
    },
  ];

  const onPressSms = () => {
    setIsSelected(isSelected === 'sms' ? '' : 'sms');
  };

  const onPressEmail = () => {
    setIsSelected(isSelected === 'email' ? '' : 'email');
  };

  const onPressPinContinue = () =>
    navigation.navigate(StackNav.ForgotPasswordOtp);

  const RenderMode = memo(({title, icon, msgId, onPress, isActive}) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          localStyles.mainContainer,
          {
            borderColor: isActive ? colors.primary : colors.bColor,
          },
        ]}>
        {icon}
        <View style={[styles.ml20, styles.flex]}>
          <ZText type={'m14'} color={colors.grayScale6}>
            {title}
          </ZText>
          <ZText style={styles.mt10} type={'b16'}>
            {msgId}
          </ZText>
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.forgotPassword} />
      <ScrollView
        bounces={false}
        contentContainerStyle={localStyles.root}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.mv20, styles.selfCenter]}>
          {colors.dark ? (
            <ForgotPassword_Dark
              width={moderateScale(250)}
              height={getHeight(244)}
            />
          ) : (
            <ForgotPassword_Light
              width={moderateScale(250)}
              height={getHeight(244)}
            />
          )}
        </View>
        <ZText type={'r18'}>{strings.forgotPasswordDesc}</ZText>
        <RenderMode
          title={strings.viaSms}
          icon={<Sms_Icon width={moderateScale(80)} height={getHeight(80)} />}
          msgId="+1 233 456 78 90"
          onPress={() => onPressSms()}
          isActive={isSelected === 'sms'}
        />
        <RenderMode
          title={strings.viaEmail}
          icon={<Email_Icon width={moderateScale(80)} height={getHeight(80)} />}
          msgId="qweew********1233@gmai.com"
          onPress={() => onPressEmail()}
          isActive={isSelected === 'email'}
        />
        <ZButton
          textType={'b18'}
          color={colors.white}
          title={strings.continue}
          onPress={onPressPinContinue}
          containerStyle={localStyles.continueBtn}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
};

export default ForgotPassword;

const localStyles = StyleSheet.create({
  root: {
    ...styles.ph20,
    ...styles.selfCenter,
    ...styles.flex,
  },
  mainContainer: {
    ...styles.p15,
    ...styles.flexRow,
    ...styles.mt20,
    ...styles.itemsCenter,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(30),
  },
  continueBtn: {
    position: 'absolute',
    bottom: moderateScale(30),
    width: '100%',
    ...styles.selfCenter,
  },
});
