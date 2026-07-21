import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const MilestoneProgress = ({milestones = [], currentOrders = 0, compact = false}) => {
  const colors = useSelector(state => state.theme.theme);
  const fillWidth = useSharedValue(0);

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.threshold - b.threshold,
  );
  const maxThreshold =
    sortedMilestones.length > 0
      ? sortedMilestones[sortedMilestones.length - 1].threshold
      : 1;
  const progressPercent = Math.min(currentOrders / maxThreshold, 1);

  useEffect(() => {
    fillWidth.value = withTiming(progressPercent * 100, {duration: 800});
  }, [progressPercent]);

  const fillAnimStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  if (sortedMilestones.length === 0) return null;

  return (
    <View style={localStyles.container}>
      <View
        style={[
          localStyles.track,
          {backgroundColor: commonColor.grayScale3},
        ]}>
        <Animated.View
          style={[
            localStyles.fill,
            {backgroundColor: commonColor.primary},
            fillAnimStyle,
          ]}
        />
      </View>

      <View style={localStyles.dotsContainer}>
        {sortedMilestones.map((milestone, idx) => {
          const position = (milestone.threshold / maxThreshold) * 100;
          const reached = currentOrders >= milestone.threshold;
          return (
            <View
              key={idx}
              style={[
                localStyles.dotWrapper,
                {left: `${position}%`},
              ]}>
              <View
                style={[
                  localStyles.dot,
                  {
                    backgroundColor: reached
                      ? commonColor.primary
                      : commonColor.grayScale4,
                  },
                ]}
              />
              {!compact && (
                <ZText
                  type="r12"
                  color={commonColor.grayScale5}
                  style={localStyles.thresholdLabel}>
                  {milestone.threshold}
                </ZText>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(8),
  },
  track: {
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  dotsContainer: {
    position: 'relative',
    height: moderateScale(30),
    marginTop: moderateScale(-10),
  },
  dotWrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{translateX: moderateScale(-6)}],
  },
  dot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(2),
    borderColor: commonColor.white,
  },
  thresholdLabel: {
    marginTop: moderateScale(2),
  },
});

export default MilestoneProgress;
