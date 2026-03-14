import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { showActionDialog } from '../../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import AudioMessage from '../../../../components/AudioMessage';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import { formatTime } from '../../../../utils/helpers';

const CustomMessageBubble = ({
  props,
  colors,
  currentUser,
  onDeleteMessage,
  onEditMessage, // New prop for editing
  onRetryMessage, // Prop for retrying failed messages
  onReply, // Prop for replying to messages
  isRTL = false, // RTL support for Arabic
  onImagePress, // Callback when image is pressed
  language, // For locale-aware date formatting
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const swipeableRef = useRef(null);
  const isCurrentUser = String(props.currentMessage.user._id) === String(currentUser._id);
  // Keep own messages on right, others on left (standard chat layout)
  const showOnRight = isCurrentUser;
  const isDeleted = props.currentMessage.isDeleted;
  const hasImage = !!props.currentMessage.image;
  const hasAudio = !!props.currentMessage.audio;
  const hasText = !!props.currentMessage.text;
  const messageStatus = props.currentMessage.status; // 'sending', 'sent', 'failed'

  const handleOptionsPress = () => {
    // Show options for all non-deleted messages (reply available for all)
    if (!isDeleted) {
      setShowOptions(true);
    }
  };

  const handleDelete = () => {
    setShowOptions(false);
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: 'Delete Message',
      message: strings.areYouSureDeleteMessage,
      confirmText: strings.delete,
      cancelText: strings.cancel,
      onConfirm: () => onDeleteMessage(props.currentMessage._id),
    });
  };

  const handleEdit = () => {
    setShowOptions(false);
    onEditMessage(props.currentMessage);
  };

  const handleReply = () => {
    setShowOptions(false);
    if (onReply) {
      onReply(props.currentMessage);
    }
  };

  // Swipe-to-reply action - render reply icon on swipe
  const renderLeftActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [-20, 0, 20],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeActionContainer}>
        <Animated.View style={[styles.replyActionButton, { transform: [{ translateX: trans }] }]}>
          <Ionicons name="arrow-undo" size={moderateScale(20)} color={colors.primary || '#FF4D67'} />
        </Animated.View>
      </View>
    );
  };

  // Handle swipe complete - trigger reply
  const onSwipeOpen = (direction) => {
    if (direction === 'left' && onReply) {
      onReply(props.currentMessage);
      // Close the swipeable after triggering reply
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
    }
  };

  const renderCustomBubble = () => {
    const message = props.currentMessage;
    const isHighlighted = message.highlighted;
    if (message?.system && message?.type === 'order_summary') {
      return null;
    }

    // Bubble validation to prevent crashes
    if (!message) return null;

    // For audio messages, render AudioMessage directly without bubble wrapper
    if (message.audio) {
      return (
        <View style={[styles.bubbleWrapper, showOnRight ? styles.wrapperRight : styles.wrapperLeft, { width: '100%' }]}>
          {/* Options button for audio messages */}
          {isCurrentUser && !isDeleted && showOnRight && (
            <TouchableOpacity onPress={handleOptionsPress} style={styles.optionsButtonTrigger}>
              <Ionicons name="ellipsis-vertical" size={moderateScale(16)} color={colors.grayScale5 || '#808080'} />
            </TouchableOpacity>
          )}
          <AudioMessage
            audioUrl={message.audio}
            duration={message.duration}
            messageId={message._id}
            isOwn={isCurrentUser}
          />
        </View>
      );
    }

    const bubbleStyle = [
      styles.bubble,
      isCurrentUser ?
        {
          backgroundColor: isHighlighted ? '#FFE066' : colors.primary,
          // alignSelf handled by container
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent'
        } :
        {
          backgroundColor: isHighlighted ? '#FFE066' : colors.inputBg,
          // alignSelf handled by container
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent'
        }
    ];

    return (
      <View style={[styles.bubbleWrapper, showOnRight ? styles.wrapperRight : styles.wrapperLeft, { width: '100%' }]}>
        {/* Options button on left side (for RTL when own message is on left) */}
        {isCurrentUser && !isDeleted && !showOnRight && (
          <TouchableOpacity onPress={handleOptionsPress} style={[styles.optionsButtonTrigger, { marginLeft: moderateScale(4), marginRight: 0 }]}>
            <Ionicons name="ellipsis-vertical" size={moderateScale(16)} color={colors.grayScale5 || '#808080'} />
          </TouchableOpacity>
        )}

        {/* Options button on right side (default LTR) */}
        {isCurrentUser && !isDeleted && showOnRight && (
          <TouchableOpacity onPress={handleOptionsPress} style={styles.optionsButtonTrigger}>
            <Ionicons name="ellipsis-vertical" size={moderateScale(16)} color={colors.grayScale5 || '#808080'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          style={bubbleStyle}
          disabled={true} // Disable touch on bubble itself as we have the menu button
        >
          {/* Reply preview - show original message being replied to */}
          {message.replyTo && (
            <View style={[
              styles.replyPreviewContainer,
              {
                backgroundColor: isCurrentUser
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderLeftColor: colors.primary || '#FF4D67'
              }
            ]}>
              <Text style={[
                styles.replyToSender,
                { color: isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : colors.primary }
              ]}>
                {message.replyTo.sender?.fullName || message.replyTo.sender?.username || strings.user}
              </Text>
              <Text
                style={[
                  styles.replyToContent,
                  { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.grayScale7 }
                ]}
                numberOfLines={2}
              >
                {message.replyTo.audio
                  ? `🎤 ${strings.audioMessage || 'Voice message'}`
                  : message.replyTo.image
                    ? `📷 ${strings.photo || 'Photo'}`
                    : message.replyTo.content || message.replyTo.text || '...'}
              </Text>
            </View>
          )}

          {message.image && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onImagePress && onImagePress(message.image)}
              style={[styles.imageContainer, { borderRadius: moderateScale(8), overflow: 'hidden' }]}
            >
              <Image
                source={{ uri: message.image }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {message.text ? (
            <Text style={[
              styles.messageText,
              {
                color: isCurrentUser ? (isHighlighted ? colors.textColor : colors.white) : colors.textColor,
                marginTop: message.image ? moderateScale(8) : 0,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }
            ]}>
              {message.text}
            </Text>
          ) : null}
          {message.isEdited && (
            <Text style={[
              styles.editedText,
              {
                color: isCurrentUser ? (isHighlighted ? colors.textColor : 'rgba(255, 255, 255, 0.7)') : colors.grayScale5
              }
            ]}>
              (edited)
            </Text>
          )}
          {/* Time and Status Display */}
          <View style={styles.timeStatusRow}>
            {messageStatus === 'sending' && isCurrentUser && (
              <Ionicons
                name="time-outline"
                size={moderateScale(12)}
                color={isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.grayScale5}
                style={{ marginRight: moderateScale(4) }}
              />
            )}
            {messageStatus === 'sent' && isCurrentUser && (
              <Ionicons
                name="checkmark-done"
                size={moderateScale(12)}
                color={isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.grayScale5}
                style={{ marginRight: moderateScale(4) }}
              />
            )}
            {messageStatus === 'failed' && isCurrentUser && (
              <TouchableOpacity
                onPress={() => onRetryMessage && onRetryMessage(props.currentMessage)}
                style={styles.retryButton}
              >
                <Ionicons
                  name="alert-circle"
                  size={moderateScale(12)}
                  color={colors.red || '#FF3B30'}
                  style={{ marginRight: moderateScale(4) }}
                />
                <Text style={[styles.retryText, { color: colors.red || '#FF3B30' }]}>
                  {strings.retry || 'Retry'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[
              styles.timeText,
              {
                color: isCurrentUser ? (isHighlighted ? colors.textColor : 'rgba(255, 255, 255, 0.7)') : colors.grayScale5
              }
            ]}>
              {formatTime(message.createdAt, language)}
            </Text>
          </View>
        </TouchableOpacity>
      </View >
    );
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={onSwipeOpen}
        overshootLeft={false}
        friction={2}
        leftThreshold={40}
      >
        <View style={styles.messageContainer}>
          {renderCustomBubble()}
        </View>
      </Swipeable>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.optionsContainer, { backgroundColor: colors.backgroundColor || '#FFFFFF' }]}>
              {/* Reply button - available for all messages */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleReply}
              >
                <Ionicons name="arrow-undo-outline" size={moderateScale(20)} color={colors.textColor || '#000000'} />
                <ZText type="M16" color={colors.textColor || '#000000'} style={{ marginLeft: moderateScale(10) }}>{strings.reply || 'Reply'}</ZText>
              </TouchableOpacity>

              {isCurrentUser && (
                <>
                  {hasText && !hasImage && !hasAudio && (
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={handleEdit}
                    >
                      <Ionicons name="create-outline" size={moderateScale(20)} color={colors.textColor || '#000000'} />
                      <ZText type="M16" color={colors.textColor || '#000000'} style={{ marginLeft: moderateScale(10) }}>{strings.edit || 'Edit'}</ZText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={moderateScale(20)} color={colors.red || '#FF3B30'} />
                    <ZText type="M16" color={colors.red || '#FF3B30'} style={{ marginLeft: moderateScale(10) }}>{strings.delete || 'Delete'}</ZText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
// ... styles ...
// ... styles removed ...
// ...
const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: moderateScale(2),
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(2),
    borderRadius: moderateScale(12),
  },
  deletedText: {
    marginLeft: moderateScale(8),
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    borderRadius: moderateScale(12),
    minWidth: moderateScale(150),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(2),
    direction: 'ltr', // Force LTR so own messages stay on right (like WhatsApp)
  },
  wrapperRight: {
    justifyContent: 'flex-end',
    // Removed alignSelf: 'flex-end' to check if width: 100% helps
  },
  wrapperLeft: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  optionsButtonTrigger: {
    padding: moderateScale(8),
    marginRight: moderateScale(4),
  },
  bubble: {
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(2),
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),

  },
  editedText: {
    fontSize: moderateScale(10),
    fontStyle: 'italic',
    marginTop: moderateScale(2),
    alignSelf: 'flex-end',
  },
  timeText: {
    fontSize: moderateScale(10),
    opacity: 0.8,
  },
  timeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: moderateScale(4),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  retryText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: moderateScale(4),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  messageImage: {
    width: moderateScale(200),
    height: moderateScale(150),
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(60),
    marginLeft: moderateScale(10),
  },
  replyActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
  },
  replyPreviewContainer: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderRadius: moderateScale(4),
  },
  replyToSender: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  replyToContent: {
    fontSize: moderateScale(12),
  },
});

export default CustomMessageBubble;