import React from 'react';
import {StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const LEVEL_CONFIG = {
  none: {
    color: commonColor.grayScale4,
    icon: 'star-outline',
    label: 'None',
  },
  bronze: {
    color: '#CD7F32',
    icon: 'star-outline',
    label: 'Bronze',
  },
  silver: {
    color: '#C0C0C0',
    icon: 'star-half',
    label: 'Silver',
  },
  gold: {
    color: '#FFD300',
    icon: 'star',
    label: 'Gold',
  },
  platinum: {
    color: '#E5E4E2',
    icon: 'star',
    label: 'Platinum',
  },
};

const RankBadge = ({level = 'none', size}) => {
  const circleSize = size || moderateScale(32);
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.none;

  return (
    <View style={localStyles.container}>
      <View
        style={[
          localStyles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: config.color + '33',
            borderColor: config.color,
          },
        ]}>
        <Ionicons
          name={config.icon}
          size={circleSize * 0.5}
          color={config.color}
        />
      </View>
      <ZText
        type="r12"
        color={config.color}
        style={localStyles.label}>
        {config.label}
      </ZText>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: moderateScale(2),
  },
  label: {
    marginTop: moderateScale(4),
    textTransform: 'capitalize',
  },
});

export default RankBadge;
