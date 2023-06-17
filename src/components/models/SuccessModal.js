// Libraries import
import React, {useState} from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {useSelector} from 'react-redux';

// Local import
import {moderateScale} from '../../common/constants';
import strings from '../../i18n/strings';
import {commonColor, styles} from '../../themes';
import ZButton from '../common/ZButton';
import ZText from '../common/ZText';

const SuccessModal = props => {
  const colors = useSelector(state => state.theme.theme);
  const [numberOfItems, setnumberOfItems] = useState(1);

  const {
    visible,
    onPressModalClose,
    btnText = false,
    headerTitle,
    subTitle,
  } = props;
  return (
    <Modal animationType="fade" transparent={true} visible={visible}>
      <TouchableWithoutFeedback>
        <View style={localStyles.modalMainContainer}>
          <View style={[localStyles.root, {backgroundColor: colors.inputBg}]}>
            <ZText
              type={'b24'}
              color={colors.primary}
              align={'center'}
              style={styles.mt25}>
              {headerTitle || strings.congratulations}
            </ZText>
            <ZText type={'r16'} align={'center'} style={styles.mt25}>
              {subTitle || strings.modalDesc}
            </ZText>
            <View style={[styles.rowCenter]}>
              <TouchableOpacity
                onPress={() => setnumberOfItems(numberOfItems + 1)}>
                <ZText type={'s24'} style={{marginRight: 10}}>
                  +
                </ZText>
              </TouchableOpacity>
              <ZText
                color={colors.primary}
                type={'s24'}
                style={{marginRight: 10}}>
                {numberOfItems}
              </ZText>
              <ZText
                type={'s24'}
                onPress={() => {
                  if (numberOfItems !== 1) {
                    setnumberOfItems(numberOfItems - 1);
                  }
                }}>
                -
              </ZText>
            </View>

            {!!btnText && (
              <ZButton
                title={btnText}
                textType={'b18'}
                color={colors.textColor}
                containerStyle={localStyles.signBtnContainer}
                onPress={onPressModalClose}
              />
            )}
            <ZButton
              title={'Checkout'}
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
    ...styles.p30,
    ...styles.m15,
    borderRadius: moderateScale(15),
    // ...styles.itemsCenter,
  },
  modalMainContainer: {
    ...styles.flex,
    ...styles.center,
    backgroundColor: commonColor.modalBg,
  },
  signBtnContainer: {
    ...styles.mt10,
  },
});

export default SuccessModal;
