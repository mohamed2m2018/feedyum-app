import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecord from 'react-native-audio-record';
import ZText from './common/ZText';
import {moderateScale} from '../common/constants';
import {styles} from '../themes';

const VoiceRecorder = ({onSendAudio, onCancel}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const recordTimeRef = useRef(null);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestMicrophonePermission();
    initializeAudioRecord();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      recordTimeRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimeRef.current) {
        clearInterval(recordTimeRef.current);
        recordTimeRef.current = null;
      }
    }

    return () => {
      if (recordTimeRef.current) {
        clearInterval(recordTimeRef.current);
        recordTimeRef.current = null;
      }
    };
  }, [isRecording]);

  const cleanup = () => {
    if (recordTimeRef.current) {
      clearInterval(recordTimeRef.current);
      recordTimeRef.current = null;
    }
  };

  const initializeAudioRecord = () => {
    try {
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: 'audio.wav',
      };

      AudioRecord.init(options);
      console.log('AudioRecord initialized successfully');
    } catch (error) {
      console.error('AudioRecord initialization error:', error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    } catch (err) {
      console.warn('Permission error:', err);
      setHasPermission(true);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordTime(0);

      AudioRecord.start();
      console.log('Recording started');

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (error) {
      console.error('Recording setup error:', error);
      setIsRecording(false);
      
      Alert.alert(
        'Recording Error', 
        Platform.OS === 'ios' 
          ? 'Recording is not available in the iOS Simulator. Please test on a real device for full audio functionality.' 
          : 'Failed to start recording. Please try again.'
      );
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      const audioFile = await AudioRecord.stop();
      setIsRecording(false);

      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      console.log('Recording stopped, file path:', audioFile);
      return audioFile;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  };

  const handleSendRecording = async () => {
    if (recordTime < 1) {
      Alert.alert('Recording Too Short', 'Please record for at least 1 second.');
      return;
    }

    const audioFile = await stopRecording();
    if (!audioFile) {
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
      return;
    }

    if (onSendAudio) {
      // For now, just send the local file path - this would need to be uploaded to server in production
      console.log('Sending audio file:', audioFile);
      onSendAudio(audioFile, recordTime);
    }
  };

  const handleCancelRecording = async () => {
    if (isRecording) {
      await stopRecording();
    }
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[localStyles.container, {backgroundColor: colors.backgroundColor}]}>
      <View style={localStyles.header}>
        <ZText type="b18" color={colors.textColor}>
          {isRecording ? 'Recording...' : 'Voice Message'}
        </ZText>
        {isRecording && (
          <ZText type="s16" color={colors.primary}>
            {formatTime(recordTime)}
          </ZText>
        )}
      </View>

      <View style={localStyles.controls}>
        <TouchableOpacity
          style={[localStyles.cancelButton, {borderColor: colors.grayScale3}]}
          onPress={handleCancelRecording}>
          <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
        </TouchableOpacity>

        <Animated.View style={[{transform: [{scale: scaleAnimation}]}]}>
          <TouchableOpacity
            style={[
              localStyles.recordButton,
              {
                backgroundColor: isRecording ? colors.red : colors.primary,
              },
            ]}
            onPress={isRecording ? handleSendRecording : startRecording}>
            {isRecording ? (
              <Ionicons name="stop" size={moderateScale(32)} color={colors.white} />
            ) : (
              <Ionicons name="mic" size={moderateScale(32)} color={colors.white} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[
            localStyles.sendButton,
            {
              backgroundColor: recordTime > 0 ? colors.primary : colors.grayScale3,
            },
          ]}
          onPress={handleSendRecording}
          disabled={recordTime === 0 || isRecording}>
          <Ionicons 
            name="send" 
            size={moderateScale(24)} 
            color={recordTime > 0 ? colors.white : colors.grayScale5} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceRecorder; 