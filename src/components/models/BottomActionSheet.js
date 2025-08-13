// Libraries import
import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
// NOTE: Reverted to plain Modal-based version. Keeping file name for import stability.
import {Modal, TouchableWithoutFeedback, Animated, PanResponder, Easing, View as RNView} from 'react-native';

// Local import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZButton from '../common/ZButton';
import ZText from '../common/ZText';

/**
 * A generic bottom action sheet that supports drag-to-dismiss.
 * Controlled via `visible` prop, shows `title`, `message` and two actions.
 */
const BottomActionSheet = props => {
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

  const sheetRef = useRef();
  const translateY = useRef(new Animated.Value(0)).current;

  const resetPosition = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeWithAnimation = () => {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        } else {
          translateY.setValue(gesture.dy * 0.25);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.9) {
          closeWithAnimation();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => resetPosition(),
    })
  ).current;

  // Ensure position resets when opened
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={localStyles.modalMainContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={localStyles.backdrop} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            localStyles.sheet,
            {backgroundColor: colors.inputBg, transform: [{ translateY }]},
          ]}
          {...panResponder.panHandlers}
        >
          <RNView style={localStyles.handle} />
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
          <View style={styles.mt20} />
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  modalMainContainer: {
    ...styles.flex,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...styles.flex,
  },
  sheet: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(24),
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: moderateScale(80),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#CCCCCC55',
    marginBottom: moderateScale(12),
  },
  btn: {
    ...styles.mt5,
  },
});

export default BottomActionSheet;


