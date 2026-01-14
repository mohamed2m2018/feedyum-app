import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { showInfoToast } from '../../../../utils/toast';
import { useSelector } from 'react-redux';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import VoiceRecorder from './VoiceRecorder';
import AudioMessage from './AudioMessage';

const VoiceRecordingTest = () => {
  const colors = useSelector(state => state.theme.theme);
  const [testMessages, setTestMessages] = useState([]);

  const handleVoiceMessage = (voiceMessage) => {
    // Add the voice message to our test list
    const newMessage = {
      ...voiceMessage,
      id: Date.now(),
      isCurrentUser: true,
    };

    setTestMessages(prev => [...prev, newMessage]);

    showInfoToast(
      'Voice Message Recorded',
      `Duration: ${voiceMessage.duration}s\nPath: ${voiceMessage.audio}`
    );
  };

  const handleCancel = () => {
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
      <ZText type="B18" color={colors.textColor} style={styles.title}>
        Voice Recording Test
      </ZText>

      <ZText type="M14" color={colors.grayScale7} style={styles.instructions}>
        Tap the microphone to record a voice message. You can preview it before sending.
      </ZText>

      <View style={styles.recorderContainer}>
        <VoiceRecorder
          onSend={handleVoiceMessage}
          onCancel={handleCancel}
        />
      </View>

      {testMessages.length > 0 && (
        <View style={styles.messagesContainer}>
          <ZText type="B16" color={colors.textColor} style={styles.messagesTitle}>
            Test Messages:
          </ZText>

          {testMessages.map((message) => (
            <View key={message.id} style={styles.messageWrapper}>
              <AudioMessage
                audioPath={message.audio}
                duration={message.duration}
                isCurrentUser={message.isCurrentUser}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(20),
  },
  title: {
    textAlign: 'center',
    marginBottom: moderateScale(10),
  },
  instructions: {
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  recorderContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(30),
  },
  messagesContainer: {
    flex: 1,
  },
  messagesTitle: {
    marginBottom: moderateScale(15),
  },
  messageWrapper: {
    marginBottom: moderateScale(10),
    alignItems: 'flex-end',
  },
});

export default VoiceRecordingTest;