import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { 
  GiftedChat, 
  Send, 
  Bubble, 
  InputToolbar, 
  Composer,
  MessageImage,
  SystemMessage,
} from 'react-native-gifted-chat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import strings from '../../../i18n/strings';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import request from '../../../api/request';
import ImageMessageComposer from './components/ImageMessageComposer';
import CustomMessageBubble from './components/CustomMessageBubble';
import OrderSummaryCard from './components/OrderSummaryCard';
import { useNavigation } from '@react-navigation/native';
import { StackNav } from '../../../navigation/NavigationKeys';

// Move component definitions outside of render
const toUriString = (value) => {
  return typeof value === 'string' ? value : (value?.url || value?.uri || '');
};
  const ChefProfile = ({ chef, orderId, colors, onPress }) => {
  const profileStyles = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    flex: 1,
  };
  
  const avatarStyles = {
    height: moderateScale(36),
    width: moderateScale(36),
    borderRadius: moderateScale(18),
    marginRight: moderateScale(8),
  };
  
  const profileInfoStyles = {
    flex: 1,
    justifyContent: 'center',
  };
  
    const avatarUri = typeof chef?.avatar === 'string'
      ? chef.avatar
      : (chef?.avatar?.url || chef?.avatar?.uri || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200');

    return (
    <TouchableOpacity onPress={onPress} style={profileStyles}>
          <Image
        source={{ 
          uri: avatarUri 
        }}
        style={avatarStyles}
      />
      <View style={profileInfoStyles}>
        <ZText type="B16" color={colors.textColor} numberOfLines={1}>
          {chef?.fullName || chef?.username || 'Chef'}
        </ZText>
        {orderId && (
          <ZText type="M12" color={colors.grayScale7} numberOfLines={1}>
            Order #{orderId?.slice(-6) || orderId}
          </ZText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const RightIcon = ({ colors }) => {
  return (
    <View style={styles.rowCenter}>
      <TouchableOpacity style={{ padding: moderateScale(8) }}>
        <Ionicons
          name="ellipsis-horizontal-circle-outline"
          size={moderateScale(24)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function ChatScreen({ route }) {
  const { chefId, orderId } = route.params;
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hideOrderSummary, setHideOrderSummary] = useState(false);
  const giftedChatRef = useRef(null);
  const flatListRef = useRef(null);



  // Get current user
  const { data: userData, isLoading: userLoading, error: userError } = useQuery(
    'user', 
    () => request.get('/user'),
    {
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch current user:', error);
      }
    }
  );
  const currentUser = userData?.data?.user;

  // Get chef information
  const { data: chefData, isLoading: chefLoading, error: chefError } = useQuery(
    ['chef', chefId],
    () => request.get(`/user/${chefId}`),
    { 
      enabled: !!chefId,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch chef data:', error);
      }
    }
  );
  const chef = chefData?.data?.user;

  // Get order information if orderId is provided
  const { data: orderData } = useQuery(
    ['order', orderId],
    () => request.get(`/orders/${orderId}`),
    { enabled: !!orderId }
  );
  const order = orderData?.data;

  // Get chat messages with order context
  const { data: messagesData, refetch: refetchMessages } = useQuery(
    ['chatMessages', currentUser?._id, chefId, orderId],
    () => request.get(`/chat/messages?chatUserId=${chefId}&orderId=${orderId || ''}`),
    { 
      enabled: !!(currentUser?._id && chefId),
      refetchInterval: false, // Polling disabled - manual refresh only
    }
  );

  useEffect(() => {
    let formattedMessages = [];
    
    if (messagesData?.data?.messages) {
      // Sort messages by timestamp (oldest first) then reverse for GiftedChat
      formattedMessages = messagesData.data.messages
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(msg => {
          const baseMessage = {
            _id: msg._id,
            createdAt: new Date(msg.timestamp),
            user: {
              _id: msg.sender._id || msg.sender,
              name: msg.sender.username || 'User',
              avatar: toUriString(msg.sender.avatar),
            },
          };

          // Try to parse content as JSON first (for structured messages)
          try {
            const parsedContent = JSON.parse(msg.content);
            if (parsedContent.type === 'image_with_text') {
              return {
                ...baseMessage,
                text: parsedContent.text || '',
                image: parsedContent.image,
              };
            }
          } catch (e) {
            // Not JSON, continue with other checks
          }

          // Check if the content is an image path (contains image file extensions)
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const isImagePath = imageExtensions.some(ext => 
            msg.content?.toLowerCase().includes(ext)
          );

          if (isImagePath) {
            return {
              ...baseMessage,
              text: '', // Empty text for image-only messages
              image: msg.content, // Set the image path
            };
          }



          // Regular text message
          return {
            ...baseMessage,
            text: msg.content,
            isDeleted: msg.isDeleted,
          };
        })
        .reverse(); // GiftedChat expects newest messages first
    }
    
    // Always add order summary as first message if order exists
    if (order && !hideOrderSummary) {
      const orderSummary = createOrderSummaryMessage(order);
      // Check if order summary already exists to avoid duplicates
      const hasOrderSummary = formattedMessages.some(msg => msg._id === `order-summary-${order._id}`);
      if (!hasOrderSummary) {
        formattedMessages = [orderSummary, ...formattedMessages];
      }
    }
    
    setMessages(formattedMessages);
  }, [messagesData, order, hideOrderSummary]);

  const createOrderSummaryMessage = (orderData) => {
    const orderSummary = {
      id: orderData._id,
      status: orderData.status,
      subtotal: orderData.subtotal,
      totalPrice: orderData.totalPrice,
      deliveryFee: orderData.deliveryFee,
      serviceFee: orderData.serviceFee,
      tax: orderData.tax,
      promocode: orderData.promocode,
      address: orderData.deliveryAddress?.nameLine,
      formattedDate: `${new Date(orderData.created_at).toLocaleDateString()} · ${new Date(orderData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      items: (orderData.items || []).map(({ dish, quantity }) => {
        const imageSource = toUriString(dish?.image);
        return {
          name: dish?.name,
          image: imageSource,
          unitPrice: dish?.price,
          quantity: quantity || 1,
        };
      }),
    };

    return {
      _id: `order-summary-${orderData._id}`,
      text: 'Order summary',
      createdAt: new Date(orderData.created_at),
      user: {
        _id: 'system',
        name: strings.orderSystem,
        avatar: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200',
      },
      system: true,
      type: 'order_summary',
      orderSummary,
    };
  };

  const onSend = async (newMessages = []) => {
    try {
      setLoading(true);
      
      for (const message of newMessages) {
        let content = '';
        
        // Handle different message types
        if (message.image && message.text && message.text.trim()) {
          // Image with text - send as JSON or structured format
          content = JSON.stringify({
            type: 'image_with_text',
            image: message.image,
            text: message.text.trim()
          });
        } else if (message.image) {
          // Image only
          content = message.image;
        } else {
          // Text message
          content = message.text;
        }

        // Send message via API
        await request.post('/chat/message', {
          chatUserId: chefId,
          content: content,
          orderId: orderId, // Include orderId for new messages
        });
      }
      
      // Add message to local state immediately for better UX
      setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
      

      
      // Refresh messages to get the latest
      setTimeout(() => {
        refetchMessages();
      }, 500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const handleImageMessage = (imageMessage) => {
    const fullImageMessage = {
      ...imageMessage,
      user: {
        _id: currentUser._id,
        name: currentUser.fullName,
        avatar: currentUser.avatar,
      },
    };
    
    onSend([fullImageMessage]);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await request.delete(`/chat/message/${messageId}`);
      
      // Update local state to mark message as deleted
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true, text: strings.thisMessageWasDeleted }
            : msg
        )
      );
      
      // Refresh messages
      setTimeout(() => {
        refetchMessages();
      }, 500);
      
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert(strings.error, strings.failedToDeleteMessage);
    }
  };



  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    
    console.log('Attempting to scroll to message:', messageId);
    
    // Find the message in the messages array
    const targetMessageIndex = messages.findIndex(msg => msg._id === messageId);
    console.log('Message found at index:', targetMessageIndex, 'out of', messages.length, 'messages');
    
    if (targetMessageIndex !== -1) {
      const originalMessages = [...messages];
      
      // Step 1: Highlight the target message
      setMessages(prevMessages => 
        prevMessages.map((msg, index) => 
          index === targetMessageIndex 
            ? { ...msg, highlighted: true }
            : { ...msg, highlighted: false }
        )
      );
      
      // Step 2: Create scroll effect by temporarily showing filtered messages
      setTimeout(() => {
        // Show messages from target onwards (this creates the scroll effect)
        const messagesToShow = messages.slice(0, targetMessageIndex + 6); // Target + 5 more recent
        
        const highlightedMessages = messagesToShow.map((msg) => 
          msg._id === messageId ? { ...msg, highlighted: true } : msg
        );
        
        setMessages(highlightedMessages);
        
        // Step 3: After 2 seconds, restore all messages but keep highlight
        setTimeout(() => {
          const restoredMessages = originalMessages.map(msg => 
            msg._id === messageId ? { ...msg, highlighted: true } : msg
          );
          setMessages(restoredMessages);
          
          // Step 4: Remove highlight after another 3 seconds
          setTimeout(() => {
            setMessages(originalMessages);
          }, 3000);
        }, 2000);
      }, 500);
      
    } else {
      console.log('Message not found in current messages array');
      Alert.alert(
        strings.messageNotFound,
        strings.messageNotVisible,
        [{ text: 'OK' }]
      );
    }
  }, [messages]);



  const onPressProfile = () => {
    // Navigate to chef profile if needed
    console.log('Navigate to chef profile:', chefId);
  };

  const renderSend = (props) => (
    <Send {...props} disabled={loading}>
      <View style={[localStyles.sendButton, { opacity: loading ? 0.5 : 1 }]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name="send" size={moderateScale(16)} color={colors.primary} />
        )}
      </View>
    </Send>
  );

  const renderBubble = (props) => (
    <CustomMessageBubble
      props={props}
      colors={colors}
      currentUser={currentUser}
      onDeleteMessage={handleDeleteMessage}
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={[
        localStyles.inputToolbar,
        {
          backgroundColor: colors.inputBg,
          borderTopColor: colors.bColor,
        }
      ]}
    />
  );

  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={[
        localStyles.textInput,
        {
          color: colors.textColor,
          backgroundColor: colors.inputBg,
        }
      ]}
      placeholderTextColor={colors.grayScale7}
    />
  );

  const renderActions = (props) => (
    <View style={localStyles.actionsContainer}>
      <ImageMessageComposer
        onSend={handleImageMessage}
        onCancel={() => {}}
      />
    </View>
  );

  const renderMessageImage = (props) => (
    <MessageImage
      {...props}
      imageStyle={localStyles.messageImage}
    />
  );

  const handleTrackOrder = () => {
    if (orderId) {
      navigation.navigate(StackNav.OrderTracking, { orderId });
    }
  };

  const renderSystem = (props) => {
    const msg = props.currentMessage;
    if (msg?.type === 'order_summary' && msg?.orderSummary) {
      return (
        <OrderSummaryCard
          order={msg.orderSummary}
          colors={colors}
          onPressPrimary={handleTrackOrder}
          initialCollapsed
          onClose={() => setHideOrderSummary(true)}
        />
      );
    }
    return <SystemMessage {...props} />;
  };





  // Show loading only if we're still loading and haven't encountered errors
  if ((userLoading || chefLoading) && !userError && !chefError) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.chat} showBack />
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ZText type="M14" color={colors.grayScale7} style={localStyles.loadingText}>
            Loading chat...
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  // Show error if critical data failed to load
  if (userError || chefError) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.chat} showBack />
        <View style={localStyles.loadingContainer}>
          <ZText type="M16" color={colors.red}>
            Failed to load chat
          </ZText>
          <ZText type="M14" color={colors.grayScale7} style={localStyles.loadingText}>
            Please check your connection and try again
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader
        title=""
        isLeftIcon={<ChefProfile chef={chef} orderId={orderId} colors={colors} onPress={onPressProfile} />}
        rightIcon={<RightIcon colors={colors} />}
        showBack
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? moderateScale(15) : 0}
        style={styles.flex}
      >
        <GiftedChat
          ref={giftedChatRef}
          messages={messages}
          onSend={onSend}
          user={{ 
            _id: currentUser?._id || 'unknown',
            name: currentUser?.fullName || 'User',
            avatar: toUriString(currentUser?.avatar),
          }}
          renderSend={renderSend}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderActions={renderActions}
          renderMessageImage={renderMessageImage}
          renderSystemMessage={renderSystem}
          messagesContainerStyle={localStyles.messagesContainer}
          isKeyboardInternallyHandled={false}
          alwaysShowSend
          placeholder={strings.typeMessage}
          showUserAvatar
          renderAvatarOnTop
          onLongPress={() => {}}
          onPressAvatar={() => {}}
        />
        
      </KeyboardAvoidingView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
  },
  avatar: {
    height: moderateScale(36),
    width: moderateScale(36),
    borderRadius: moderateScale(18),
    marginRight: moderateScale(8),
  },
  profileInfo: {
    flex: 1,
  },
  sendButton: {
    height: moderateScale(36),
    width: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderRadius: moderateScale(20),
    marginHorizontal: moderateScale(10),
    marginBottom: Platform.OS === 'android' ? moderateScale(10) : moderateScale(5),
    paddingHorizontal: moderateScale(8),
  },
  textInput: {
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
  },
  messagesContainer: {
    paddingHorizontal: moderateScale(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(4),
    marginRight: moderateScale(4),
    marginBottom: moderateScale(0),
    gap: moderateScale(8),
  },
  messageImage: {
    width: moderateScale(150),
    height: moderateScale(100),
    borderRadius: moderateScale(13),
    margin: moderateScale(3),
    resizeMode: 'cover',
  },
});