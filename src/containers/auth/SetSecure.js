// Libraries import
import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import {styles} from '../../themes';
import {FingerPrint} from '../../assets/svgs';
import {StackNav} from '../../navigation/NavigationKeys';
import SuccessModal from '../../components/models/SuccessModal';
import ZButton from '../../components/common/ZButton';
import {moderateScale} from '../../common/constants';

const SetSecure = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [modalVisible, setModalVisible] = useState(false);

  const onPressContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{name: StackNav.TabBar}],
    });
  };
  const onPressSkip = () => setModalVisible(true);
  const onPressModalClose = () => setModalVisible(false);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.setYourFingerprint} />
      <View style={localStyles.root}>
        <ZText type={'r18'} align={'center'}>
          {strings.setYourFingerprintDesc1}
        </ZText>
        <FingerPrint
          style={styles.mv50}
          width={moderateScale(228)}
          hight={moderateScale(236)}
        />
        <ZText type={'r18'} align={'center'}>
          {strings.setYourFingerprintDesc2}
        </ZText>
      </View>
      <View style={localStyles.btnContainer}>
        <ZButton
          title={strings.skip}
          textType={'b18'}
          color={colors.dark ? colors.white : colors.primary}
          containerStyle={[localStyles.skipBtnContainer]}
          bgColor={colors.dark3}
          onPress={onPressSkip}
        />
        <ZButton
          title={strings.continue}
          textType={'b18'}
          color={colors.white}
          containerStyle={[localStyles.skipBtnContainer]}
          onPress={onPressContinue}
        />
      </View>
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={onPressModalClose}
      />
    </ZSafeAreaView>
  );
};

export default SetSecure;

const localStyles = StyleSheet.create({
  root: {
    ...styles.flexCenter,
    ...styles.ph25,
  },
  btnContainer: {
    ...styles.p20,
    ...styles.rowSpaceAround,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
