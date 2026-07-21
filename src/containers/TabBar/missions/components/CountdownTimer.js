import React, {useState, useEffect, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const CountdownTimer = ({endDate}) => {
  const [remaining, setRemaining] = useState(null);

  const calculateRemaining = useCallback(() => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return null;

    const totalMinutes = Math.floor(diff / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    return {days, hours, minutes, totalHours, totalMinutes};
  }, [endDate]);

  useEffect(() => {
    if (!endDate) return;

    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const result = calculateRemaining();
      setRemaining(result);
      if (!result) clearInterval(interval);
    }, 60000);

    return () => clearInterval(interval);
  }, [endDate, calculateRemaining]);

  if (!endDate || !remaining) return null;

  const getColor = () => {
    if (remaining.totalHours < 1) return commonColor.redColor;
    if (remaining.totalHours < 24) return commonColor.orange;
    return commonColor.grayScale7;
  };

  const getLabel = () => {
    if (remaining.days > 0) {
      return `${remaining.days}d ${remaining.hours}h`;
    }
    return `${remaining.hours}h ${remaining.minutes}m`;
  };

  const color = getColor();

  return (
    <View style={localStyles.container}>
      <Ionicons
        name="time-outline"
        size={moderateScale(14)}
        color={color}
      />
      <ZText type="r12" color={color} style={localStyles.text}>
        {getLabel()}
      </ZText>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: moderateScale(4),
  },
});

export default CountdownTimer;
