/**
 * Web shim for react-native-linear-gradient
 * Renders a <View> with CSS linear-gradient background.
 */
import React from 'react';
import { View } from 'react-native';

const LinearGradient = ({ colors = [], start, end, style, children, ...props }) => {
  // Convert RN start/end ({x, y}) to CSS gradient direction
  const getDirection = () => {
    if (!start || !end) return 'to right';
    const dx = (end.x || 0) - (start.x || 0);
    const dy = (end.y || 0) - (start.y || 0);
    if (dx === 0 && dy > 0) return 'to bottom';
    if (dx === 0 && dy < 0) return 'to top';
    if (dx > 0 && dy === 0) return 'to right';
    if (dx < 0 && dy === 0) return 'to left';
    if (dx > 0 && dy > 0) return 'to bottom right';
    if (dx > 0 && dy < 0) return 'to top right';
    if (dx < 0 && dy > 0) return 'to bottom left';
    return 'to top left';
  };

  const cssColors = colors.length > 0 ? colors.join(', ') : 'transparent, transparent';
  const backgroundImage = `linear-gradient(${getDirection()}, ${cssColors})`;

  return (
    <View
      {...props}
      style={[style, { backgroundImage }]}
    >
      {children}
    </View>
  );
};

export default LinearGradient;
