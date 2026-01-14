import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { showWarningToast } from '../../../../utils/toast';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';

// Global audio manager to ensure only one audio plays at a time
class GlobalAudioManager {
  constructor() {
    this.currentlyPlaying = null;
    this.currentComponent = null;
    this.components = new Map();
  }

  register(componentId, stopCallback) {
    this.components.set(componentId, stopCallback);
  }

  unregister(componentId) {
    this.components.delete(componentId);
    if (this.currentComponent === componentId) {
      this.currentlyPlaying = null;
      this.currentComponent = null;
    }
  }

  play(audioPath, componentId) {
    // Stop any currently playing audio
    if (this.currentlyPlaying && this.currentComponent !== componentId) {
      const stopCallback = this.components.get(this.currentComponent);
      if (stopCallback) {
        stopCallback();
      }
    }

    this.currentlyPlaying = audioPath;
    this.currentComponent = componentId;
  }

  stop(componentId) {
    if (this.currentComponent === componentId) {
      this.currentlyPlaying = null;
      this.currentComponent = null;
    }
  }

  isPlaying(audioPath, componentId) {
    return this.currentlyPlaying === audioPath && this.currentComponent === componentId;
  }
}

const globalAudioManager = new GlobalAudioManager();

const AudioMessage = ({ audioPath, duration = 0, isCurrentUser = false }) => {
  const colors = useSelector(state => state.theme.theme);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 10);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const waveAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const componentId = useRef(Math.random().toString(36)).current;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopWaveAnimation = () => {
    waveAnim.stopAnimation();
    waveAnim.setValue(0);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    stopWaveAnimation();
    globalAudioManager.stop(componentId);
  };

  // Register this component with the global audio manager
  useEffect(() => {
    globalAudioManager.register(componentId, stopPlayback);

    return () => {
      globalAudioManager.unregister(componentId);
      stopWaveAnimation();
    };
  }, [componentId]);

  const handlePlayPause = () => {
    if (isLoading || hasError) return;

    if (!audioPath) {
      showWarningToast(strings.audioError, strings.noAudioFileAvailable);
      return;
    }

    if (isPlaying) {
      // Pause the current audio
      stopPlayback();
    } else {
      // Start playing this audio
      setIsLoading(true);
      setIsPlaying(true);
      setHasError(false);
      setCurrentTime(0);
      startWaveAnimation();

      // Register with global manager
      globalAudioManager.play(audioPath, componentId);
    }
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Video component callbacks
  const onLoad = (data) => {
    if (data.duration && data.duration > 0) {
      setAudioDuration(data.duration);
    } else if (duration > 0) {
      setAudioDuration(duration);
    }
    setIsLoading(false);
    setHasError(false);
  };

  const onProgress = (data) => {
    if (data.currentTime !== undefined) {
      setCurrentTime(data.currentTime);
    }
  };

  const onEnd = () => {
    stopPlayback();
  };

  const onError = (error) => {
    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
    stopWaveAnimation();
    globalAudioManager.stop(componentId);

    // Log error but don't show alert to avoid spam
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isCurrentUser ? colors.primary : colors.inputBg,
      }
    ]}>
      {/* Hidden Video component for audio playback */}
      {audioPath && (
        <Video
          ref={videoRef}
          source={{ uri: audioPath }}
          paused={!isPlaying}
          onLoad={onLoad}
          onProgress={onProgress}
          onEnd={onEnd}
          onError={onError}
          audioOnly={true}
          style={styles.hiddenVideo}
          progressUpdateInterval={100}
          resizeMode="contain"
          repeat={false}
          volume={1.0}
          muted={false}
          ignoreSilentSwitch="ignore"
          playWhenInactive={true}
          playInBackground={false}
        />
      )}

      <TouchableOpacity
        style={[
          styles.playButton,
          {
            backgroundColor: hasError
              ? colors.grayScale3
              : (isCurrentUser ? colors.white : colors.primary),
          }
        ]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={isCurrentUser ? colors.primary : colors.white}
          />
        ) : hasError ? (
          <Ionicons
            name="warning"
            size={moderateScale(20)}
            color={colors.white}
          />
        ) : (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={moderateScale(20)}
            color={isCurrentUser ? colors.primary : colors.white}
          />
        )}
      </TouchableOpacity>

      <View style={styles.audioInfo}>
        <View style={styles.waveformContainer}>
          {[...Array(20)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  backgroundColor: isCurrentUser ? colors.white : colors.primary,
                  transform: [
                    {
                      scaleY: isPlaying
                        ? waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1 + Math.random() * 0.8],
                        })
                        : 0.3,
                    },
                  ],
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: isCurrentUser
                  ? colors.white + '30'
                  : colors.primary + '30',
              }
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isCurrentUser ? colors.white : colors.primary,
                }
              ]}
            />
          </View>

          <ZText
            type="M12"
            color={isCurrentUser ? colors.white : colors.textColor}
            style={styles.timeText}
          >
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </ZText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    margin: moderateScale(3),
    minWidth: moderateScale(200),
  },
  playButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  audioInfo: {
    flex: 1,
    gap: moderateScale(8),
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: moderateScale(30),
    gap: moderateScale(2),
  },
  waveBar: {
    width: moderateScale(2),
    height: moderateScale(20),
    borderRadius: moderateScale(1),
  },
  progressContainer: {
    gap: moderateScale(4),
  },
  progressBar: {
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  timeText: {
    fontSize: moderateScale(10),
  },
  hiddenVideo: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
  },
});

export default AudioMessage;