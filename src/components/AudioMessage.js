import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Slider,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import strings from '../i18n/strings';

const AudioMessage = ({
  audioUrl,
  duration: initialDuration = 0,
  messageId,
  isOwn = false,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 30);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handlePlayPause = () => {
    if (isLoading || hasError) return;

    if (!audioUrl) {
      Alert.alert(strings.noAudio, strings.noAudioFileAvailable);
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      setIsPlaying(true);
    }
  };

  const handleLoad = (data) => {
    const audioDuration = data.duration || initialDuration || 30;
    setDuration(audioDuration);
    setIsLoading(false);
    setHasError(false);
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = (error) => {
    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
    Alert.alert(strings.audioError, strings.failedToPlayAudioFile);
  };

  const handleSeek = (value) => {
    if (!hasError && videoRef.current) {
      videoRef.current.seek(value);
      setCurrentTime(value);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        localStyles.container,
        {
          backgroundColor: isOwn ? colors.primary : colors.grayScale1,
          alignSelf: isOwn ? 'flex-end' : 'flex-start',
        }
      ]}
    >
      {/* Hidden video component for audio playback */}
      {audioUrl && (
        <Video
          ref={videoRef}
          source={{ uri: audioUrl }}
          paused={!isPlaying}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          style={{ height: 0, width: 0 }}
          resizeMode="contain"
          ignoreSilentSwitch="obey"
          playWhenInactive={true}
          playInBackground={false}
          repeat={false}
          muted={false}
          volume={1.0}
          rate={1.0}
          audioOnly={true}
        />
      )}

      <TouchableOpacity
        style={[
          localStyles.playButton,
          {
            backgroundColor: hasError
              ? colors.grayScale3
              : (isOwn ? colors.white : colors.primary)
          }
        ]}
        onPress={handlePlayPause}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={isOwn ? colors.primary : colors.white}
          />
        ) : hasError ? (
          <Ionicons
            name="warning"
            size={moderateScale(20)}
            color={colors.white}
          />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={moderateScale(20)}
            color={isOwn ? colors.primary : colors.white}
          />
        )}
      </TouchableOpacity>

      <View style={localStyles.audioControls}>
        <Slider
          style={localStyles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          onSlidingComplete={handleSeek}
          disabled={hasError || !audioUrl}
          minimumTrackTintColor={isOwn ? colors.white : colors.primary}
          maximumTrackTintColor={isOwn ? 'rgba(255,255,255,0.3)' : colors.grayScale3}
          thumbStyle={{
            backgroundColor: isOwn ? colors.white : colors.primary,
            width: 12,
            height: 12,
          }}
        />

        <View style={localStyles.timeContainer}>
          <ZText
            type="s12"
            color={isOwn ? colors.white : colors.textColor}
          >
            {formatTime(currentTime)}
          </ZText>
          <ZText
            type="s12"
            color={isOwn ? 'rgba(255,255,255,0.7)' : colors.grayScale5}
          >
            {formatTime(duration)}
          </ZText>
        </View>
      </View>

      <TouchableOpacity style={localStyles.waveformIcon}>
        <Ionicons
          name={hasError ? "warning-outline" : "radio-outline"}
          size={moderateScale(16)}
          color={isOwn ? 'rgba(255,255,255,0.7)' : colors.grayScale5}
        />
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 2,
    maxWidth: '80%',
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioControls: {
    flex: 1,
  },
  slider: {
    height: 20,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waveformIcon: {
    marginLeft: 8,
  },
});

export default AudioMessage; 