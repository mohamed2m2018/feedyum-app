/**
 * Web shim for react-native-fast-image
 * Uses the standard <Image> component from React Native Web.
 */
import React from 'react';
import { Image } from 'react-native';

const FastImage = React.forwardRef(({ source, style, resizeMode, onLoad, onError, onLoadStart, onLoadEnd, ...props }, ref) => {
  const rnResizeMode = resizeMode === FastImage.resizeMode?.center ? 'center' : resizeMode || 'cover';

  return (
    <Image
      ref={ref}
      source={source}
      style={style}
      resizeMode={rnResizeMode}
      onLoad={onLoad}
      onError={onError}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      {...props}
    />
  );
});
FastImage.displayName = 'FastImage';

FastImage.resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
};

FastImage.priority = {
  low: 'low',
  normal: 'normal',
  high: 'high',
};

FastImage.cacheControl = {
  immutable: 'immutable',
  web: 'web',
  cacheOnly: 'cacheOnly',
};

FastImage.preload = (_sources) => {};
FastImage.clearMemoryCache = () => Promise.resolve();
FastImage.clearDiskCache = () => Promise.resolve();

export default FastImage;
