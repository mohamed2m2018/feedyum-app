// Libraries import
import React from 'react';
import { Modal, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { useSelector } from 'react-redux';

// Local import
import { moderateScale } from '../../common/constants';
import strings from '../../i18n/strings';
import { commonColor, styles } from '../../themes';
import ZButton from '../common/ZButton';
import ZText from '../common/ZText';

const ErrorModal = props => {
  const colors = useSelector(state => state.theme.theme);

  const { visible, onPressModalClose, subTitle } = props;
  return (
    <Modal animationType="fade" transparent={true} visible={visible}>
      <TouchableWithoutFeedback>
        <View style={localStyles.modalMainContainer}>
          <View style={[localStyles.root, { backgroundColor: colors.inputBg }]}>
            <ZText
              type={'b24'}
              color={colors.primary}
              align={'center'}
              style={styles.mt25}>
              {subTitle || strings.modalDesc}
            </ZText>

            <ZButton
              title={strings.ok}
              textType={'b18'}
              color={colors.textColor}
              containerStyle={localStyles.signBtnContainer}
              onPress={onPressModalClose}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  root: {
    ...styles.p50,
    borderRadius: moderateScale(15),

    // ...styles.itemsCenter,
  },
  modalMainContainer: {
    ...styles.flex,
    ...styles.center,
    backgroundColor: commonColor.modalBg,
  },
  signBtnContainer: {
    ...styles.mt30,
  },
});

export default ErrorModal;
