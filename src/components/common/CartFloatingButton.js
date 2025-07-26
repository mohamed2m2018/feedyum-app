import React from 'react';
import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from './ZText';
import {moderateScale} from '../../common/constants';
import {selectCartItemCount} from '../../redux/reducer/cartSlice';

const CartFloatingButton = ({onPress, style}) => {
  const colors = useSelector(state => state.theme.theme);
  const itemCount = useSelector(selectCartItemCount);

  if (itemCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        localStyles.container,
        {backgroundColor: colors.primary},
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={localStyles.content}>
        <Ionicons
          name="basket"
          size={moderateScale(24)}
          color={colors.white}
        />
        {itemCount > 0 && (
          <View style={[localStyles.badge, {backgroundColor: colors.white}]}>
            <ZText
              type="B12"
              color={colors.primary}
              style={localStyles.badgeText}>
              {itemCount > 99 ? '99+' : itemCount}
            </ZText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: moderateScale(20),
    right: moderateScale(20),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: moderateScale(-8),
    right: moderateScale(-8),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
});

export default CartFloatingButton;