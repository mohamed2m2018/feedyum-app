import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecord from 'react-native-audio-record';
import Video from 'react-native-video';
import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {
  uploadAudioToS3,
  convertWavToMp3,
} from '../../../../utils/UploadUtils';

const VoiceRecorder = ({onSend, onCancel}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPath, setAudioPath] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compatibleAudioPath, setCompatibleAudioPath] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const requestMicrophonePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'This app needs access to your microphone to record voice messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled automatically by the system
        return true;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const initializeRecorder = async () => {
    try {
      // Request permissions first
      const permissionGranted = await requestMicrophonePermission();
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        console.log('Microphone permission not granted');
        return;
      }

      // Initialize audio recorder with basic settings that work reliably
      const options = {
        sampleRate: 16000, // Lower sample rate for better compatibility and smaller file size
        channels: 1, // Mono for voice messages
        bitsPerSample: 16,
        audioSource: 6, // VOICE_RECOGNITION for better voice capture
        wavFile: 'voice_message.wav', // Start with WAV, we'll convert it properly
      };

      AudioRecord.init(options);
      setIsInitialized(true);
      console.log('Audio recorder initialized successfully');
    } catch (error) {
      console.error('Audio recorder initialization error:', error);
      setIsInitialized(false);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize audio recorder. Please restart the app and try again.',
      );
    }
  };

  const cleanup = () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (isRecording) {
        AudioRecord.stop().catch(console.error);
      }
      // Stop any animations
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Initialize permissions and audio recorder
  useEffect(() => {
    initializeRecorder();
    return cleanup;
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Start wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, pulseAnim, waveAnim]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Check if we have permission and are initialized
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone access is required to record voice messages. Please enable it in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Retry', onPress: () => initializeRecorder()},
          ],
        );
        return;
      }

      if (!isInitialized) {
        Alert.alert(
          'Not Ready',
          'Audio recorder is not ready. Please wait a moment and try again.',
          [{text: 'OK', onPress: () => initializeRecorder()}],
        );
        return;
      }

      // Reset any previous state first
      if (audioPath) {
        setAudioPath(null);
        setIsPlaying(false);
      }

      setIsRecording(true);
      setRecordingTime(0);
      AudioRecord.start();
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check microphone permissions and try again.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Retry', onPress: () => initializeRecorder()},
        ],
      );
    }
  };

  const stopRecording = async () => {
    try {
      const audioFile = await AudioRecord.stop();
      setIsRecording(false);

      console.log('AudioRecord.stop() returned:', audioFile);
      console.log('Audio file type:', typeof audioFile);
      console.log('Audio file length:', audioFile ? audioFile.length : 'null/undefined');

      if (audioFile && audioFile.length > 0) {
        setAudioPath(audioFile);
        console.log('Recording stopped successfully, file:', audioFile);
        console.log('Recording duration:', recordingTime, 'seconds');
        
        // Check if file actually exists
        try {
          const RNFS = require('react-native-fs');
          const exists = await RNFS.exists(audioFile);
          console.log('Audio file exists on filesystem:', exists);
          if (exists) {
            const stats = await RNFS.stat(audioFile);
            console.log('Audio file stats:', {
              size: stats.size,
              path: audioFile
            });
          }
        } catch (fsError) {
          console.error('Error checking file:', fsError);
        }
      } else {
        console.error('No audio file received from recording');
        Alert.alert(
          'Recording Error',
          'No audio was recorded. Please try again.',
          [{text: 'OK', onPress: () => cancelRecording()}],
        );
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
      Alert.alert(
        'Recording Error',
        'Failed to stop recording. Please try again.',
        [
          {text: 'Cancel', style: 'cancel', onPress: () => cancelRecording()},
          {text: 'Retry', onPress: () => startRecording()},
        ],
      );
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      AudioRecord.stop();
      setIsRecording(false);
    }

    setRecordingTime(0);
    setAudioPath(null);
    setIsPlaying(false);
    onCancel?.();
  };

  const sendAudio = async () => {
    console.log('=== SEND AUDIO BUTTON PRESSED ===');
    console.log('Audio path:', audioPath);
    console.log('Recording time:', recordingTime);
    
    if (!audioPath) {
      console.log('ERROR: No audio path available');
      Alert.alert('No Audio', 'No audio recording available to send.');
      return;
    }

    if (recordingTime < 1) {
      console.log('ERROR: Recording too short:', recordingTime);
      Alert.alert(
        'Recording Too Short',
        'Please record for at least 1 second.',
      );
      return;
    }

    try {
      console.log('Starting upload process...');
      setIsUploading(true);
      setUploadProgress(0);

      // Convert M4A for compatibility first
      console.log('Converting audio for compatibility...');
      const compatibleAudioPath = await convertWavToMp3(audioPath);
      console.log('Original audio path:', audioPath);
      console.log('Compatible audio path:', compatibleAudioPath);

      // Upload audio to S3 with actual duration
      console.log('Calling uploadAudioToS3 with:', {
        audioPath,
        recordingTime
      });
      
      const uploadResult = await uploadAudioToS3(
        audioPath,
        progress => {
          console.log('Upload progress:', progress + '%');
          setUploadProgress(progress);
        },
        recordingTime,
      );

      console.log('Upload result received:', uploadResult);

      if (uploadResult.success) {
        const audioMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: '',
          createdAt: new Date(),
          audio: uploadResult.url, // Use the S3 URL instead of local path
          duration: recordingTime,
          localPath: compatibleAudioPath, // Keep compatible local path as backup
        };

        console.log('Sending audio message with S3 URL:', audioMessage);
        onSend(audioMessage);

        // Reset state
        setAudioPath(null);
        setCompatibleAudioPath(null);
        setRecordingTime(0);
        setIsPlaying(false);
        setIsUploading(false);
        setUploadProgress(0);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Audio upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);

      Alert.alert(
        'Upload Failed',
        `Failed to upload audio: ${error.message}. Would you like to send it locally instead?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Send Locally',
            onPress: async () => {
              try {
                // Convert M4A for compatibility and send locally
                const compatiblePath =
                  await convertWavToMp3(audioPath);
                const audioMessage = {
                  _id: Math.round(Math.random() * 1000000),
                  text: '',
                  createdAt: new Date(),
                  audio: compatiblePath,
                  duration: recordingTime,
                  isLocal: true,
                };

                console.log('Sending local audio message:', audioMessage);
                onSend(audioMessage);

                // Reset state
                setAudioPath(null);
                setCompatibleAudioPath(null);
                setRecordingTime(0);
                setIsPlaying(false);
              } catch (conversionError) {
                console.error('WAV conversion error:', conversionError);
                Alert.alert('Error', 'Failed to process audio file');
              }
            },
          },
        ],
      );
    }
  };

  const videoRef = useRef(null);

  const playPreview = async () => {
    if (!audioPath) return;

    if (isPlaying) {
      // Stop playing
      setIsPlaying(false);
    } else {
      // Start playing using Video component with compatible WAV format
      console.log('Starting audio preview with path:', audioPath);

      try {
        // Convert M4A for compatibility first if not already done
        if (!compatibleAudioPath) {
          const compatiblePath = await convertWavToMp3(audioPath);
          console.log('Using compatible path for preview:', compatiblePath);
          setCompatibleAudioPath(compatiblePath);
        }
        setIsPlaying(true);
      } catch (error) {
        console.error('Preview conversion error:', error);
        Alert.alert('Preview Error', 'Failed to prepare audio for preview');
      }
    }
  };

  // Video component callbacks for preview
  const onPreviewLoad = data => {
    console.log('Preview audio loaded:', data);
  };

  const onPreviewEnd = () => {
    console.log('Preview audio ended');
    setIsPlaying(false);
  };

  const onPreviewError = error => {
    console.log('Preview audio error:', error);
    setIsPlaying(false);
    Alert.alert('Preview Error', 'Failed to play audio preview');
  };

  if (isRecording) {
    return (
      <View
        style={[styles.recordingContainer, {backgroundColor: colors.inputBg}]}>
        <View style={styles.recordingIndicator}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: colors.red,
                transform: [{scale: pulseAnim}],
              },
            ]}>
            <Ionicons
              name="mic"
              size={moderateScale(24)}
              color={colors.white}
            />
          </Animated.View>

          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: colors.primary,
                    transform: [
                      {
                        scaleY: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1 + Math.random() * 0.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <ZText type="M14" color={colors.textColor} style={styles.timerText}>
          {formatTime(recordingTime)}
        </ZText>

        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.grayScale3}]}
            onPress={cancelRecording}>
            <Ionicons
              name="close"
              size={moderateScale(20)}
              color={colors.textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.primary}]}
            onPress={stopRecording}>
            <Ionicons
              name="stop"
              size={moderateScale(20)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (audioPath) {
    return (
      <View
        style={[styles.previewContainer, {backgroundColor: colors.inputBg}]}>
        {/* Hidden Video component for audio preview */}
        {compatibleAudioPath && (
          <Video
            ref={videoRef}
            source={{uri: compatibleAudioPath}}
            paused={!isPlaying}
            audioOnly={true}
            style={styles.hiddenVideo}
            onLoad={onPreviewLoad}
            onEnd={onPreviewEnd}
            onError={onPreviewError}
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

        <View style={styles.audioPreview}>
          <TouchableOpacity
            style={[styles.playButton, {backgroundColor: colors.primary}]}
            onPress={playPreview}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={moderateScale(20)}
              color={colors.white}
            />
          </TouchableOpacity>

          <View style={styles.audioInfo}>
            <ZText type="M14" color={colors.textColor}>
              Voice message
            </ZText>
            <ZText type="M12" color={colors.grayScale7}>
              {formatTime(recordingTime)}
            </ZText>
          </View>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.grayScale3}]}
            onPress={cancelRecording}>
            <ZText type="M14" color={colors.textColor}>
              Cancel
            </ZText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.green}]}
            onPress={startRecording}>
            <Ionicons
              name="refresh"
              size={moderateScale(16)}
              color={colors.white}
            />
            <ZText type="M14" color={colors.white} style={styles.buttonText}>
              Re-record
            </ZText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.primary}]}
            onPress={sendAudio}
            disabled={isUploading}>
            {isUploading ? (
              <>
                <ZText type="M12" color={colors.white}>
                  {uploadProgress}%
                </ZText>
              </>
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={moderateScale(16)}
                  color={colors.white}
                />
                <ZText
                  type="M14"
                  color={colors.white}
                  style={styles.buttonText}>
                  Send
                </ZText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.recordButton, {backgroundColor: colors.primary}]}
      onPress={startRecording}>
      <Ionicons name="mic" size={moderateScale(24)} color={colors.white} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(4),
    marginRight: moderateScale(4),
  },
  recordingContainer: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    margin: moderateScale(8),
    alignItems: 'center',
    gap: moderateScale(12),
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(16),
  },
  pulseCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    height: moderateScale(30),
  },
  waveBar: {
    width: moderateScale(3),
    height: moderateScale(20),
    borderRadius: moderateScale(1.5),
  },
  timerText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  recordingActions: {
    flexDirection: 'row',
    gap: moderateScale(16),
  },
  actionButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  previewContainer: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    margin: moderateScale(8),
    gap: moderateScale(12),
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  playButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  buttonText: {
    marginLeft: moderateScale(4),
  },
  hiddenVideo: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
  },
});

export default VoiceRecorder;
