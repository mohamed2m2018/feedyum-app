/**
 * Web shim for react-native-video
 * Uses HTML5 <video> element.
 */
import React from 'react';

const Video = React.forwardRef(({ source, style, paused, muted, repeat, resizeMode, onLoad, onEnd, onError, poster, ...props }, ref) => {
  const videoSrc = typeof source === 'object' ? source.uri : source;

  return (
    <video
      ref={ref}
      src={videoSrc}
      poster={poster}
      autoPlay={!paused}
      muted={muted}
      loop={repeat}
      playsInline
      controls
      onLoadedData={onLoad ? () => onLoad({ duration: 0, naturalSize: {} }) : undefined}
      onEnded={onEnd}
      onError={onError}
      style={{
        width: '100%',
        height: '100%',
        objectFit: resizeMode === 'contain' ? 'contain' : 'cover',
        ...(style && typeof style === 'object' ? style : {}),
      }}
    />
  );
});
Video.displayName = 'Video';

export default Video;
