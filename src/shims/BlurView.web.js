/**
 * Web shim for @react-native-community/blur
 * BlurView on web uses CSS backdrop-filter: blur()
 */
import React from 'react';
import { View } from 'react-native';

export const BlurView = ({ style, blurAmount = 10, blurType, children, ...props }) => {
  const webStyle = {
    backdropFilter: `blur(${blurAmount}px)`,
    WebkitBackdropFilter: `blur(${blurAmount}px)`,
  };

  return (
    <View {...props} style={[style, webStyle]}>
      {children}
    </View>
  );
};

export const VibrancyView = BlurView;

export default BlurView;
