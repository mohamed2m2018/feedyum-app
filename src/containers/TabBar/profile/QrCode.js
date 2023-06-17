// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../../common/constants';
import strings from '../../../i18n/strings';
import {QrCodeIcon} from '../../../assets/svgs';
import {styles} from '../../../themes';
import ZButton from '../../../components/common/ZButton';
import ZText from '../../../components/common/ZText';

export default function QrCode() {
  const colors = useSelector(state => state.theme.theme);

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name="navigate-circle-outline"
          size={moderateScale(26)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView
      style={{
        backgroundColor: colors.lightRed,
      }}>
      <ZHeader title={strings.qrCode} rightIcon={<RightIcon />} />
      <View style={localStyles.qrContainer}>
        <QrCodeIcon />
        <ZText type="b22" style={styles.mt15}>
          {'@andrew_ainsley'}
        </ZText>
      </View>
      <ZButton
        title={strings.scanQrCode}
        color={colors.primary}
        textType="b16"
        style={styles.ml5}
        containerStyle={[
          localStyles.buttonContainer,
          {borderColor: colors.primary},
        ]}
        bgColor={colors.white}
        frontIcon={
          <Ionicons
            name="scan-outline"
            size={moderateScale(20)}
            color={colors.primary}
          />
        }
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  qrContainer: {
    ...styles.flex,
    ...styles.center,
  },
  buttonContainer: {
    ...styles.ph20,
    borderWidth: moderateScale(1),
    width: '90%',
    ...styles.selfCenter,
  },
});
