//Library Imports
import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';

//Local Imports
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from './ZText';

export default function ZButton({
  title,
  textType,
  color,
  onPress,
  containerStyle,
  style,
  icon = null,
  frontIcon = null,
  children,
  bgColor = null,
  isLoading = false,
  disabled,
  ...props
}) {
  const colors = useSelector(state => state.theme.theme);
  return (
    <TouchableOpacity
      style={[
        localStyle.btnContainer,
        styles.rowCenter,
        containerStyle,
        disabled
          ? // eslint-disable-next-line react-native/no-inline-styles
            {backgroundColor: 'grey', borderColor: 'grey'}
          : bgColor
          ? {backgroundColor: bgColor}
          : {backgroundColor: colors.primary},
      ]}
      onPress={onPress}
      disabled={disabled}
      {...props}>
      {/* If Icon Added In Button Front Side */}
      {frontIcon}
      {/* Text In Button */}
      <ZText
        align={'center'}
        type={textType}
        textAlign={'center'}
        style={style}
        color={color}>
        {title}
      </ZText>
      {/* If Icon Added In Button Back Side */}
      {icon}
      {isLoading ? <ActivityIndicator size={'small'} /> : children}
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  btnContainer: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
});
