import React, { useEffect, useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { GiftedChat, Send, Bubble, InputToolbar, Composer } from 'react-native-gifted-chat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import { StackNav } from '../../../navigation/NavigationKeys';
import { useStorage } from '../../../utils/useStorage';
import ZHeader from '../../../components/common/ZHeader';
import AudioMessage from '../../../components/AudioMessage';
import VoiceRecorder from '../../../components/VoiceRecorder';

export default function Chat({ navigation, route }) {
  const userName = route.params?.userName;
  const userImage = route.params?.userImage;
  const orderId = route.params?.orderId || null; // Get orderId if provided
  const chatUserId = route.params?.chatUserId || "64f48d3b6b45e8f937a49bc0"; // Ensure you get chatUserId from route
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile?.language);
  // Check if Arabic is selected (can be 'ar', 'Arabic', or contain 'Arabic')
  const isRTL = language === 'ar' || language === 'Arabic' || (typeof language === 'string' && language.toLowerCase().includes('arabic'));
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const textInputRef = useRef(null);
  const messageContainerRef = useRef(null);
  const socketRef = useRef(null); // Ref to store the socket instance
  const userId = useStorage('user')?.[0]?._id;

  useEffect(() => {
    // Initialize socket only once
    if (!socketRef.current) {
      const socketUrl = Platform.OS === 'android' ? 'http://10.0.2.2:4800' : 'http://localhost:4800';
      socketRef.current = io(socketUrl); // Ensure the URL is correct

      socketRef.current.on('connect', () => {
        loadMessages(page);
      });

      socketRef.current.on('disconnect', () => {
      });

      socketRef.current.on('chatHistory', (data) => {
        const messages = data.messages.map(msg => ({
          _id: msg._id,
          text: msg.content,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.sender._id,
            name: msg.sender.username,
            avatar: msg.sender.avatar, // Assuming avatar field is available
          },
          // Handle audio messages
          audio: msg.audio ? msg.audio : undefined,
          duration: msg.duration ? msg.duration : undefined,
        }));
        setMessages(previousMessages => GiftedChat.prepend(previousMessages, messages));
        setTotalPages(data.totalPages);
        setLoading(false);
      });

      socketRef.current.on('newMessage', (message) => {
        const newMessage = {
          _id: message._id,
          text: message.content,
          createdAt: new Date(message.timestamp),
          user: {
            _id: message.sender._id,
            name: message.sender.username,
            avatar: message.sender.avatar, // Assuming avatar field is available
          },
          // Handle audio messages
          audio: message.audio ? message.audio : undefined,
          duration: message.duration ? message.duration : undefined,
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessage));
      });
    }

    // Clean up event listeners on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('chatHistory');
        socketRef.current.off('newMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, chatUserId, page]);

  const loadMessages = (pageNumber) => {
    if (socketRef.current && !loading && pageNumber <= totalPages) {
      setLoading(true);
      socketRef.current.emit('join', { userId, chatUserId, orderId, page: pageNumber });
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (nextPage <= totalPages) {
      setPage(nextPage);
      loadMessages(nextPage);
    }
  };

  const onSend = (newMessages = []) => {
    newMessages.forEach(message => {
      const messageData = {
        senderId: userId,
        receiverId: chatUserId,
        content: message.text,
        audio: message.audio || undefined,
        duration: message.duration || undefined,
        orderId: orderId || undefined,
      };

      socketRef.current.emit('sendMessage', messageData, (response) => {
        if (response.error) {
        }
      });
    });

    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    Keyboard.dismiss(); // Dismiss the keyboard on send
  };

  const handleSendAudio = (audioFile, duration) => {
    const audioMessage = {
      _id: Math.random().toString(36).substring(7),
      text: '', // Audio messages don't have text
      audio: audioFile,
      duration: duration,
      createdAt: new Date(),
      user: { _id: userId },
    };

    onSend([audioMessage]);
    setShowVoiceRecorder(false);
  };

  const handleTestAudio = () => {
    // Test audio message with a simple, reliable audio URL
    const testAudioMessage = {
      _id: Math.random().toString(36).substring(7),
      text: '',
      audio: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', // Simple test audio
      duration: 3,
      createdAt: new Date(),
      user: { _id: userId },
    };
    onSend([testAudioMessage]);
  };

  const onPressProfile = () => {
    navigation.navigate(StackNav.ProfileDetail, {
      userName: userName,
      userImage: userImage,
    });
  };

  const UserProfile = () => {
    return (
      <TouchableOpacity onPress={onPressProfile}>
        <Image
          source={{ uri: userImage }}
          style={localStyles.avatar}
        />
      </TouchableOpacity>
    );
  };

  const onPressCall = () =>
    navigation.navigate(StackNav.Call, {
      userName: userName,
      userImage: userImage,
    });

  const RightIcon = () => {
    return (
      <View style={styles.rowCenter}>
        <TouchableOpacity onPress={handleTestAudio} style={styles.pr10}>
          <Ionicons
            name="musical-notes"
            size={moderateScale(24)}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressCall} style={styles.pr10}>
          <Ionicons
            name="call-outline"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal-circle-outline"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSend = (props) => {
    if (showVoiceRecorder) {
      return null; // Hide send button when recording
    }

    return (
      <Send {...props}>
        <View style={localStyles.sendButton}>
          <Feather name="send" size={moderateScale(20)} color={colors.primary} />
        </View>
      </Send>
    );
  };

  const renderMessage = (props) => {
    const { currentMessage } = props;
    const isOwnMessage = currentMessage.user._id === userId;
    // Keep own messages on right, others on left (same as default)
    // For Arabic: just use RTL text direction
    const showOnRight = isOwnMessage;

    // If message has audio, render custom audio message
    if (currentMessage.audio) {
      return (
        <View style={[
          localStyles.messageRow,
          { justifyContent: showOnRight ? 'flex-end' : 'flex-start' }
        ]}>
          <View style={localStyles.audioBubbleContainer}>
            <AudioMessage
              audioUrl={currentMessage.audio}
              duration={currentMessage.duration}
              messageId={currentMessage._id}
              isOwn={isOwnMessage}
            />
          </View>
        </View>
      );
    }

    const timeString = new Date(currentMessage.createdAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View style={[
        localStyles.messageRow,
        { justifyContent: showOnRight ? 'flex-end' : 'flex-start' }
      ]}>
        <View style={[
          localStyles.bubbleContainer,
          {
            backgroundColor: isOwnMessage ? colors.primary : colors.grayScale1,
          }
        ]}>
          {/* Render image if present */}
          {currentMessage.image && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setSelectedImage(currentMessage.image)}
              style={localStyles.messageImageContainer}
            >
              <Image
                source={{ uri: currentMessage.image }}
                style={localStyles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {/* Render text if present */}
          {currentMessage.text ? (
            <View style={localStyles.messageTextWrapper}>
              <Bubble
                {...props}
                wrapperStyle={{
                  left: { backgroundColor: 'transparent' },
                  right: { backgroundColor: 'transparent' },
                }}
                textStyle={{
                  left: { 
                    color: isOwnMessage ? colors.white : colors.black, 
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                  right: { 
                    color: isOwnMessage ? colors.white : colors.black, 
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderMessageImage = (props) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelectedImage(props.currentMessage.image)}
      >
        <Image
          source={{ uri: props.currentMessage.image }}
          style={localStyles.messageImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const renderInputToolbar = (props) => {
    if (showVoiceRecorder) {
      return (
        <View style={localStyles.voiceRecorderContainer}>
          <VoiceRecorder
            onSendAudio={handleSendAudio}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </View>
      );
    }

    return (
      <View style={localStyles.inputToolbarContainer}>
        <InputToolbar
          {...props}
          containerStyle={{
            backgroundColor: colors.inputBg,
            borderTopColor: colors.btnColor1,
            borderTopWidth: 1,
            borderRadius: 20,
            marginHorizontal: 10,
            flex: 1,
          }}
        />
        {!text.trim() && (
          <TouchableOpacity
            style={[localStyles.micButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowVoiceRecorder(true)}
          >
            <Ionicons
              name="mic"
              size={moderateScale(16)}
              color={colors.white}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={{
        color: colors.white,
        backgroundColor: colors.inputBg,
        borderRadius: 20,
        paddingHorizontal: 10,
      }}
      placeholderTextColor={colors.grayScale4} // Adjust placeholder text color
    />
  );

  const renderLoading = () => (
    <View style={localStyles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <ZSafeAreaView edges={['top', 'left', 'right', 'bottom']}>
      <ZHeader
        title={userName}
        isLeftIcon={<UserProfile />}
        rightIcon={<RightIcon />}
      />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? moderateScale(15) : 0}
        style={styles.flex}
      >
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{ _id: userId }}
          renderSend={renderSend}
          renderMessage={renderMessage}
          renderMessageImage={renderMessageImage}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderLoading={renderLoading}
          messagesContainerStyle={{ marginLeft: -30 }}
          isKeyboardInternallyHandled={false}
          keyboardShouldPersistTaps="handled"
          alwaysShowSend
          loadEarlier={page < totalPages}
          onLoadEarlier={handleLoadMore}
          isLoadingEarlier={loading}
          text={text}
          onInputTextChanged={setText}
          textInputRef={textInputRef}
          messageContainerRef={messageContainerRef}
          placeholder={strings.typeMessagePlaceholder}
        />
      </KeyboardAvoidingView>

      {/* Image Zoom Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
        <TouchableOpacity
          style={localStyles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={localStyles.imageModalContent}
          >
            <Image
              source={{ uri: selectedImage }}
              style={localStyles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={localStyles.closeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={moderateScale(36)} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  avatar: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.mh10,
  },
  sendButton: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBubbleContainer: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  voiceRecorderContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  inputToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    paddingTop: 5,
    marginBottom: moderateScale(6),
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  bubbleContainer: {
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 2,
    maxWidth: '80%',
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextWrapper: {
    flex: 1,
  },
  messageImage: {
    width: moderateScale(150),
    height: moderateScale(100),
    borderRadius: moderateScale(8),
  },
  messageImageContainer: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    marginBottom: moderateScale(4),
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - 20,
    height: Dimensions.get('window').height * 0.75,
  },
  closeImageButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
  },
});
