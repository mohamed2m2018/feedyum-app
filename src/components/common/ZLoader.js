import React from 'react';
import LottieView from 'lottie-react-native';
import {moderateScale, screenHeight, screenWidth} from '../../common/constants';
import {View} from 'react-native';
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
      <LottieView
        style={{
          height: height ? moderateScale(height) : moderateScale(100),
          top: top ? moderateScale(top) : moderateScale(0),
          bottom: bottom ? moderateScale(bottom) : moderateScale(0),
          left: left ? moderateScale(left) : moderateScale(0),
          right: right ? moderateScale(right) : moderateScale(0),
        }}
        source={require('../../containers/auth/loader.json')}
        autoPlay
        loop
      />
    </View>
  );
};

export default React.memo(ZLoader);
