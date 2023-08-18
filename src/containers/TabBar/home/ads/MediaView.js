import React from 'react';
import {NativeMediaView} from 'react-native-admob-native-ads';
import {Logger} from './utils';
import {useSelector} from 'react-redux';
import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import strings from '../../../../i18n/strings';

export const MediaView = ({layoutHeight}) => {
  const colors = useSelector(state => state.theme.theme);
  const onVideoPlay = () => {
    Logger('VIDEO', 'PLAY', 'Video is now playing');
  };

  const onVideoPause = () => {
    Logger('VIDEO', 'PAUSED', 'Video is now paused');
  };

  const onVideoProgress = event => {
    Logger('VIDEO', 'PROGRESS UPDATE', event);
  };

  const onVideoEnd = () => {
    Logger('VIDEO', 'ENDED', 'Video end reached');
  };

  const onVideoMute = muted => {
    Logger('VIDEO', 'MUTE', muted);
  };

  return (
    <>
      <NativeMediaView
        style={{
          width: '100%',
          height: layoutHeight,
          backgroundColor: colors.backgroundColor,
        }}
        onVideoPause={onVideoPause}
        onVideoPlay={onVideoPlay}
        onVideoEnd={onVideoEnd}
        onVideoProgress={onVideoProgress}
        onVideoMute={onVideoMute}
      />
      <ZText
        type={'m20'}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: moderateScale(130),
          color: colors.textColor,
        }}>
        {strings.sponsored}
      </ZText>
    </>
  );
};
