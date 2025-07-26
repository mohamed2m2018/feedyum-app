import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';

const CustomMessageBubble = ({ 
  props, 
  colors, 
  currentUser, 
  onDeleteMessage
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const isCurrentUser = props.currentMessage.user._id === currentUser._id;
  const isDeleted = props.currentMessage.isDeleted;

  const handleLongPress = () => {
    if (!isDeleted) {
      setShowOptions(true);
    }
  };

  const handleDelete = () => {
    setShowOptions(false);
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteMessage(props.currentMessage._id)
        }
      ]
    );
  };

  const renderDeletedMessage = () => (
    <View style={[
      styles.deletedContainer,
      { backgroundColor: colors.grayScale2 }
    ]}>
      <Ionicons 
        name="trash-outline" 
        size={moderateScale(16)} 
        color={colors.grayScale7} 
      />
      <ZText type="M12" color={colors.grayScale7} style={styles.deletedText}>
        This message was deleted
      </ZText>
    </View>
  );

  if (isDeleted) {
    return (
      <View style={styles.messageContainer}>
        {renderDeletedMessage()}
      </View>
    );
  }

  const renderCustomBubble = () => {
    const message = props.currentMessage;
    const isHighlighted = message.highlighted;
    
    const bubbleStyle = [
      styles.bubble,
      isCurrentUser ? 
        { 
          backgroundColor: isHighlighted ? '#FFE066' : colors.primary, 
          alignSelf: 'flex-end',
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent'
        } : 
        { 
          backgroundColor: isHighlighted ? '#FFE066' : colors.inputBg, 
          alignSelf: 'flex-start',
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent'
        }
    ];

    return (
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={bubbleStyle}
      >
        <Text style={[
          styles.messageText,
          { color: isCurrentUser ? (isHighlighted ? colors.textColor : colors.white) : colors.textColor }
        ]}>
          {message.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.messageContainer}>
      {renderCustomBubble()}

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.optionsContainer, { backgroundColor: colors.backgroundColor }]}>
              {isCurrentUser && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={moderateScale(20)} color={colors.red} />
                  <ZText type="M16" color={colors.red}>Delete</ZText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

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
  },
  bubble: {
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(2),
    maxWidth: '80%',
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
  },
});

export default CustomMessageBubble;