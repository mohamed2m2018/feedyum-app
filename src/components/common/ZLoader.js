import React from 'react';
import {moderateScale, screenHeight, screenWidth} from '../../common/constants';
import {View, ActivityIndicator} from 'react-native';
const ZLoader = ({height, top, bottom, left, right, overlay, absolute}) => {
  return (
    <View
      pointerEvents={overlay ? 'auto' : 'box-none'}
      style={{
        ...(absolute && {position: 'absolute'}),
        height: screenHeight,
        width: screenWidth,
        zIndex: 1,
      }}>
      <ActivityIndicator
        size="large"
        color="#E14C4C"
        style={{
          height: height ? moderateScale(height) : moderateScale(100),
          top: top ? moderateScale(top) : moderateScale(0),
          bottom: bottom ? moderateScale(bottom) : moderateScale(0),
          left: left ? moderateScale(left) : moderateScale(0),
          right: right ? moderateScale(right) : moderateScale(0),
        }}
      />
    </View>
  );
};

export default React.memo(ZLoader);
