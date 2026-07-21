import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Layout,
} from 'react-native-reanimated';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const AnimatedView = Animated.createAnimatedComponent(View);

const MissionTypeToggle = ({selectedType, onTypeChange}) => {
  const colors = useSelector(state => state.theme.theme);

  const scoutingActive = selectedType === 'scouting';

  const scoutBg = useSharedValue(scoutingActive ? 1 : 0);
  const reviewBg = useSharedValue(scoutingActive ? 0 : 1);

  React.useEffect(() => {
    scoutBg.value = withTiming(scoutingActive ? 1 : 0, {duration: 250});
    reviewBg.value = withTiming(scoutingActive ? 0 : 1, {duration: 250});
  }, [scoutingActive]);

  const scoutAnimStyle = useAnimatedStyle(() => ({
    backgroundColor:
      scoutBg.value > 0.5 ? commonColor.primary : 'transparent',
  }));

  const reviewAnimStyle = useAnimatedStyle(() => ({
    backgroundColor:
      reviewBg.value > 0.5 ? commonColor.primary : 'transparent',
  }));

  return (
    <View style={[localStyles.container, {backgroundColor: colors.inputBg}]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTypeChange('scouting')}>
        <AnimatedView
          layout={Layout}
          style={[localStyles.pill, scoutAnimStyle]}>
          <ZText
            type={scoutingActive ? 'b14' : 'r14'}
            color={
              scoutingActive ? commonColor.white : commonColor.grayScale7
            }>
            Scouting
          </ZText>
        </AnimatedView>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTypeChange('reviewing')}>
        <AnimatedView
          layout={Layout}
          style={[localStyles.pill, reviewAnimStyle]}>
          <ZText
            type={!scoutingActive ? 'b14' : 'r14'}
            color={
              !scoutingActive ? commonColor.white : commonColor.grayScale7
            }>
            Reviewing
          </ZText>
        </AnimatedView>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: moderateScale(25),
    padding: moderateScale(4),
    alignSelf: 'center',
  },
  pill: {
    borderRadius: moderateScale(25),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MissionTypeToggle;
