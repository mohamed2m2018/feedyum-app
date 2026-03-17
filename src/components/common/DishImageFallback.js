import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../common/constants';

/**
 * Code-based dish placeholder — uses exact app theme colors.
 * Shows a clean food icon on a subtle elevated background.
 * No image files = no border artifacts or color mismatches.
 *
 * @param {object} style - Container style overrides (width, height, borderRadius)
 * @param {number} iconSize - Override icon size (auto-calculated from container if not set)
 */
const DishImageFallback = ({ style, iconSize }) => {
  const colors = useSelector(state => state.theme.theme);

  // Calculate icon size based on container dimensions if not provided
  const containerHeight = StyleSheet.flatten(style)?.height || 100;
  const calculatedIconSize = iconSize || Math.min(containerHeight * 0.35, moderateScale(32));

  return (
    <View
      style={[
        localStyles.container,
        {
          backgroundColor: colors.dark
            ? colors.btnColor3  // #1F222A — slightly lighter than bg
            : colors.grayScale1, // #F5F5F5 — subtle light gray
        },
        style,
      ]}
    >
      {/* Subtle circle behind icon */}
      <View
        style={[
          localStyles.iconCircle,
          {
            width: calculatedIconSize * 1.8,
            height: calculatedIconSize * 1.8,
            borderRadius: calculatedIconSize * 0.9,
            backgroundColor: colors.dark
              ? 'rgba(255, 77, 103, 0.08)' // primary with very low opacity
              : 'rgba(255, 77, 103, 0.06)',
          },
        ]}
      >
        <Ionicons
          name="restaurant-outline"
          size={calculatedIconSize}
          color={colors.dark
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.2)'
          }
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(DishImageFallback);
