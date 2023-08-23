import React from 'react';
import LottieView from 'lottie-react-native';
import {moderateScale, screenHeight, screenWidth} from '../../common/constants';
import {View, Text} from 'react-native';
const ZLoader = ({height, top, bottom, overlay = true}) => {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        height: screenHeight,
        width: screenWidth,
        zIndex: overlay ? 1 : 0,
      }}>
      <Text>hello</Text>
      <LottieView
        style={{
          height: height ? moderateScale(height) : moderateScale(100),
          top: top ? moderateScale(top) : moderateScale(0),
          bottom: bottom ? moderateScale(bottom) : moderateScale(0),
        }}
        source={require('../../containers/auth/loader.json')}
        autoPlay
        loop
      />
    </View>
  );
};

export default React.memo(ZLoader);
