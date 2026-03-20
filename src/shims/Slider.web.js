/** Web shim for @react-native-community/slider */
import React from 'react';

const Slider = ({ value = 0, minimumValue = 0, maximumValue = 1, onValueChange, style, ...props }) => (
  <input
    type="range"
    min={minimumValue}
    max={maximumValue}
    step={(maximumValue - minimumValue) / 100}
    value={value}
    onChange={(e) => onValueChange?.(parseFloat(e.target.value))}
    style={{ width: '100%', ...(style && typeof style === 'object' ? style : {}) }}
  />
);
export default Slider;
