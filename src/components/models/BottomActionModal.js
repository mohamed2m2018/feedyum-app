// Libraries import
import React from 'react';
import {Modal, StyleSheet, View, TouchableWithoutFeedback} from 'react-native';
import {useSelector} from 'react-redux';

// Local import
import {moderateScale} from '../../common/constants';
import {commonColor, styles} from '../../themes';
import ZButton from '../common/ZButton';
import ZText from '../common/ZText';

const BottomActionModal = props => {
  const colors = useSelector(state => state.theme.theme);

  const {
    visible,
    title,
    message,
    primaryLabel = 'Open Menu Management',
    secondaryLabel = 'Not now',
    onPrimary,
    onClose,
  } = props;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={localStyles.modalMainContainer}>
        {/* Backdrop - tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={localStyles.backdrop} />
        </TouchableWithoutFeedback>
        {/* Bottom sheet content */}
        <View style={[localStyles.sheet, {backgroundColor: colors.inputBg}]}>
            {!!title && (
              <ZText type={'b22'} align={'center'} color={colors.primary}>
                {title}
              </ZText>
            )}
            {!!message && (
              <ZText type={'r16'} align={'center'} style={styles.mt15}>
                {message}
              </ZText>
            )}
            <ZButton
              title={primaryLabel}
              textType={'b18'}
              color={colors.textColor}
              containerStyle={localStyles.btn}
              onPress={onPrimary}
            />
            <ZButton
              title={secondaryLabel}
              textType={'b18'}
              color={colors.textColor}
              containerStyle={[localStyles.btn, styles.mt10]}
              onPress={onClose}
            />
        </View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  modalMainContainer: {
    ...styles.flex,
    justifyContent: 'flex-end',
    backgroundColor: commonColor.modalBg,
  },
  backdrop: {
    ...styles.flex,
  },
  sheet: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(30),
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
  },
  btn: {
    ...styles.mt20,
  },
});

export default BottomActionModal;


