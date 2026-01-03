import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
} from 'react-native';
import {
  GiftedChat,
  Send,
  InputToolbar,
  MessageImage,
  SystemMessage,
  Composer,
} from 'react-native-gifted-chat';
import io from 'socket.io-client';
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
import RejectReasonModal from './components/RejectReasonModal';
import OrderReviewModal from '../chef/components/OrderReviewModal';
import { updateOrderStatusAsync } from '../../../redux/reducer/orderSlice';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';

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
  const [editingMessage, setEditingMessage] = useState(null);
  const [text, setText] = useState('');

  const [hideOrderSummary, setHideOrderSummary] = useState(false);
  const socketRef = useRef(null);
  const textInputRef = useRef(null);
  const messageContainerRef = useRef(null);
  const { data: currentUserData } = useQuery('user', () => request.get('/user'));
  const currentUserId = currentUserData?.data?.user?._id;

  // Add handleEditMessage function
  const handleEditMessage = useCallback((message) => {
    console.log('Editing message:', message);
    setEditingMessage(message);
    setText(message.text || '');

    // Manually set text since we are using uncontrolled input
    if (textInputRef.current) {
      textInputRef.current.setNativeProps({ text: message.text || '' });
    }
  }, []);

  // Modify handleCancelEdit
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setText('');

    // Manually clear text
    if (textInputRef.current) {
      textInputRef.current.clear();
    }
  }, []);

  useEffect(() => {
    if (!currentUserId || !chefId || !orderId) return;

    // Derive socket URL from the API request base URL to avoid hardcoding
    const apiBaseUrl = request.defaults.baseURL || 'http://localhost:4800/api';
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, ''); // Remove /api suffix

    if (!socketRef.current) {
      console.log('Connecting to socket at:', socketUrl);
      socketRef.current = io(socketUrl, {
        transports: ['websocket'],
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        // Join the specific room for this order/chat
        socketRef.current.emit('join', {
          userId: currentUserId,
          chatUserId: chefId,
          orderId: orderId
        });
      });

      socketRef.current.on('messageUpdated', (updatedMsg) => {
        setMessages(previousMessages =>
          previousMessages.map(msg => {
            if (msg._id === updatedMsg._id) {
              // Parse content if needed (similar to newMessage)
              let displayText = updatedMsg.content;
              try {
                const parsed = JSON.parse(updatedMsg.content);
                if (parsed.type === 'image_with_text') {
                  displayText = parsed.text;
                }
              } catch (e) { }

              return { ...msg, text: displayText, isEdited: true };
            }
            return msg;
          })
        );
      });

      socketRef.current.on('newMessage', (message) => {
        // 1. Ignore own messages (Optimistic update handles them)
        const senderId = message.sender._id || message.sender;
        if (senderId === currentUserId) {
          return;
        }

        console.log('New message received via socket:', message);

        // 2. Format the new message - parse content for images
        let text = message.content;
        let image = message.image || undefined;

        // Try to parse content as JSON for image_with_text messages
        try {
          const parsedContent = JSON.parse(message.content);
          if (parsedContent.type === 'image_with_text') {
            text = parsedContent.text || '';
            image = parsedContent.image;
          }
        } catch (e) {
          // Not JSON, check if it's an image path
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const isImagePath = imageExtensions.some(ext =>
            message.content?.toLowerCase().includes(ext)
          );
          if (isImagePath) {
            text = '';
            image = message.content;
          }
        }

        const newMessage = {
          _id: message._id || Math.random().toString(),
          text: text,
          createdAt: new Date(message.timestamp || Date.now()),
          user: {
            _id: senderId,
            name: message.sender.username || 'User',
            avatar: toUriString(message.sender.avatar),
          },
          image: image,
        };

        // 3. Append to state with deduplication check
        setMessages(previousMessages => {
          const isDuplicate = previousMessages.some(msg => String(msg._id) === String(newMessage._id));
          if (isDuplicate) {
            return previousMessages;
          }
          return GiftedChat.append(previousMessages, newMessage);
        });
      });
    }

    return () => {
      // Clean up socket when deps change or unmount
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {
          console.log('Socket disconnect error:', e);
        }
        socketRef.current = null;
      }
    };
  }, [currentUserId, chefId, orderId]);



  // Get current user
  const { data: userData, isLoading: userLoading, error: userError } = useQuery(
    'user',
    () => request.get('/user'),
    {
      retry: 2,
      onError: (error) => {
      }
    }
  );
  const currentUser = userData?.data?.user;
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // Get chef information
  const { data: chefData, isLoading: chefLoading, error: chefError } = useQuery(
    ['chef', chefId],
    () => request.get(`/user/${chefId}`),
    {
      enabled: !!chefId,
      retry: 2,
      onError: (error) => {
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
          if (msg.isDeleted) {
            return {
              ...baseMessage,
              text: strings.thisMessageWasDeleted || 'This message was deleted',
              isDeleted: true,
            };
          }

          return {
            ...baseMessage,
            text: msg.content,
            isDeleted: msg.isDeleted,
            isEdited: msg.isEdited,
          };
        })
        .reverse(); // GiftedChat expects newest messages first
    }

    // Order summary logic moved to fixed header
    // if (order && !hideOrderSummary) { ... }

    // Strict filtering to prevent crash
    const safeMessages = formattedMessages.filter(msg =>
      msg._id &&
      !isNaN(new Date(msg.createdAt).getTime())
    );

    setMessages(safeMessages);
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

  const chatUser = useMemo(() => ({
    _id: currentUser?._id || 'unknown',
    name: currentUser?.fullName || 'User',
    avatar: toUriString(currentUser?.avatar),
  }), [currentUser]);

  const onSend = useCallback(async (newMessages = []) => {
    console.log('=== onSend called ===');
    try {
      setLoading(true);

      // Handle edit mode
      if (editingMessage) {
        const messageId = editingMessage._id;
        const newContent = newMessages[0]?.text || text;

        if (!newContent || !newContent.trim()) {
          setLoading(false);
          return;
        }

        console.log(`Updating message ${messageId} with content:`, newContent);

        // Call update API
        const response = await request.put(`/chat/message/${messageId}`, {
          content: newContent.trim()
        });

        if (response.data?.message) {
          // Update local state with edited message
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg._id === messageId
                ? { ...msg, text: newContent.trim(), isEdited: true }
                : msg
            )
          );
        }

        // Clear editing state
        setEditingMessage(null);
        setText('');
        setLoading(false);
        Keyboard.dismiss();
        return;
      }

      // Normal send flow
      for (const message of newMessages) {
        let content = '';

        // Handle different message types
        if (message.image && message.text && message.text.trim()) {
          content = JSON.stringify({
            type: 'image_with_text',
            image: message.image,
            text: message.text.trim()
          });
        } else if (message.image) {
          content = message.image;
        } else {
          content = message.text;
        }

        // Send message via HTTP
        const response = await request.post('/chat/message', {
          chatUserId: chefId,
          content: content,
          orderId: orderId,
        });

        // Add the saved message to state immediately
        if (response.data?.message) {
          const savedMsg = response.data.message;
          const displayImage = message.image || undefined;
          let displayText = savedMsg.content;

          try {
            const parsedContent = JSON.parse(savedMsg.content);
            if (parsedContent.type === 'image_with_text') {
              displayText = parsedContent.text || '';
            }
          } catch (e) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            if (imageExtensions.some(ext => savedMsg.content?.toLowerCase().includes(ext))) {
              displayText = '';
            }
          }

          const formattedMsg = {
            _id: savedMsg._id,
            text: displayText,
            createdAt: new Date(savedMsg.timestamp || Date.now()),
            user: {
              _id: currentUser?._id || 'unknown',
              name: currentUser?.fullName || 'User',
              avatar: toUriString(currentUser?.avatar),
            },
            image: displayImage,
          };
          setMessages(prev => GiftedChat.append(prev, formattedMsg));
        }
      }

      // Clear text after sending
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  }, [chefId, orderId, currentUser, editingMessage, text]);
  const handleImageMessage = useCallback((imageMessage) => {
    const fullImageMessage = {
      ...imageMessage,
      user: {
        _id: currentUser._id,
        name: currentUser.fullName,
        avatar: currentUser.avatar,
      },
    };

    onSend([fullImageMessage]);
  }, [currentUser, onSend]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await request.delete(`/chat/message/${messageId}`);

      // Update local state to mark message as deleted
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, text: strings.thisMessageWasDeleted || 'This message was deleted' }
            : msg
        )
      );

      // Refresh messages
      setTimeout(() => {
        refetchMessages();
      }, 500);

    } catch (error) {
      alert(strings.error, strings.failedToDeleteMessage);
    }
  }, [refetchMessages]);

  const handleTrackOrder = useCallback(() => {
    if (orderId) {
      navigation.navigate(StackNav.OrderTracking, { orderId });
    }
  }, [orderId, navigation]);

  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    // Find the message in the messages array
    const targetMessageIndex = messages.findIndex(msg => msg._id === messageId);
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
      Alert.alert(
        strings.messageNotFound,
        strings.messageNotVisible,
        [{ text: 'OK' }]
      );
    }
  }, [messages]);

  const onPressProfile = () => {
    // Navigate based on user type
    if (chefId) {
      // Check if the user is a chef or a regular user
      if (chef?.type === 'chef') {
        navigation.navigate(StackNav.ChefMenu, {
          chefId: chefId,
          chefName: chef?.fullName || chef?.username,
          chefImage: chef?.avatar
        });
      } else { // Regular user
        navigation.navigate(StackNav.ProfileDetail, {
          id: chefId
        });
      }
    }
  };

  const onInputTextChanged = useCallback((text) => {
    setText(text);
  }, []);

  useEffect(() => {
    if (editingMessage && textInputRef.current) {
      // Small timeout to ensure component is ready
      setTimeout(() => {
        textInputRef.current.focus();
      }, 100);
    }
  }, [editingMessage]);

  const renderSend = useCallback((props) => (
    <Send {...props} disabled={loading}>
      <View style={[localStyles.sendButton, { opacity: loading ? 0.5 : 1 }]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name={editingMessage ? "check" : "send"} size={moderateScale(16)} color={colors.primary} />
        )}
      </View>
    </Send>
  ), [loading, colors, editingMessage]);

  const renderBubble = useCallback((props) => (
    <CustomMessageBubble
      props={props}
      colors={colors}
      currentUser={currentUser}
      onDeleteMessage={handleDeleteMessage}
      onEditMessage={handleEditMessage}
    />
  ), [colors, currentUser, handleDeleteMessage, handleEditMessage]);

  const renderInputToolbar = useCallback((props) => (
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
  ), [colors]);

  const renderComposer = useCallback((props) => (
    <Composer
      {...props}
      textInputStyle={{
        color: colors.textColor || '#000000',
        backgroundColor: colors.inputBg || '#FFFFFF',
        borderRadius: moderateScale(20),
        paddingHorizontal: moderateScale(10),
        paddingTop: Platform.OS === 'ios' ? moderateScale(8) : 0,
        marginRight: moderateScale(10),
      }}
      placeholderTextColor={colors.grayScale5 || '#808080'}
    />
  ), [colors]);

  const renderActions = useCallback((props) => (
    <View style={localStyles.actionsContainer}>
      <ImageMessageComposer
        onSend={handleImageMessage}
        onCancel={() => { }}
      />
    </View>
  ), [handleImageMessage]);

  const renderMessageImage = useCallback((props) => (
    <MessageImage
      {...props}
      imageStyle={localStyles.messageImage}
    />
  ), []);

  const renderSystem = useCallback((props) => {
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
  }, [colors, handleTrackOrder]);

  const renderDay = useCallback((props) => {
    if (!props?.currentMessage?.createdAt) return null;
    return (
      <View style={localStyles.dayContainer}>
        <ZText type="r12" color={colors.grayScale7} align="center">
          {new Date(props.currentMessage.createdAt).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </ZText>
      </View>
    );
  }, [colors]);

  const renderAvatar = useCallback((props) => {
    const user = props?.currentMessage?.user;
    if (!user?.avatar) return null;

    const isSelf = user._id === (currentUser?._id || currentUserId);

    return (
      <TouchableOpacity
        onPress={!isSelf ? onPressProfile : undefined}
        disabled={isSelf}
      >
        <Image
          source={{ uri: toUriString(user.avatar) }}
          style={localStyles.avatarImage}
        />
      </TouchableOpacity>
    );
  }, [currentUser, currentUserId, onPressProfile]);

  const textInputStyle = useMemo(() => ({
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? moderateScale(8) : 0,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    marginRight: moderateScale(10),
  }), []);

  const textInputProps = useMemo(() => ({
    placeholderTextColor: '#808080'
  }), []);

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
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {/* Fixed Order Summary */}
      {order && !hideOrderSummary && (
        <View style={{ paddingHorizontal: moderateScale(16), paddingTop: moderateScale(10) }}>
          <OrderSummaryCard
            order={createOrderSummaryMessage(order).orderSummary}
            colors={colors}
            onPressPrimary={handleTrackOrder}
            initialCollapsed
            onClose={() => setHideOrderSummary(true)}
            isChef={order?.chef?._id === currentUser?._id}
            onAccept={() => setReviewModalVisible(true)}
            onReject={() => setRejectModalVisible(true)}
          />
        </View>
      )}

      <RejectReasonModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        colors={colors}
        onConfirm={async (reason) => {
          try {
            await request.put(`/orders/${orderId}/status`, {
              status: 'cancelled',
              notes: reason
            });
            refetchMessages(); // Refetch to update status
          } catch (e) {
            console.error('Reject order failed', e);
            Alert.alert('Error', 'Failed to reject order');
          }
        }}
      />

      <OrderReviewModal
        visible={reviewModalVisible}
        order={order && Array.isArray(order) ? order[0] : order}
        onClose={() => setReviewModalVisible(false)}
        onAccept={() => {
          setReviewModalVisible(false);
          refetchMessages();
        }}
      />

      <KeyboardAvoidingView
        style={localStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <GiftedChat
          ref={messageContainerRef}
          messages={messages}
          onSend={onSend}
          // Intentionally removed text={text} to allow uncontrolled input (fixes typing issues)
          onInputTextChanged={onInputTextChanged}
          textInputRef={textInputRef}
          colorScheme="dark"
          user={chatUser}
          renderSend={renderSend}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderActions={renderActions}
          renderMessageImage={renderMessageImage}
          renderSystemMessage={renderSystem}
          renderDay={renderDay}
          renderAvatar={renderAvatar}
          messagesContainerStyle={localStyles.messagesContainer}
          isKeyboardInternallyHandled={false}
          keyboardShouldPersistTaps="handled"
          alwaysShowSend
          placeholder={editingMessage ? strings.editMessage || 'Edit message...' : strings.typeMessage}
          showUserAvatar
          renderAvatarOnTop
          onLongPress={() => { }}
          onPressAvatar={onPressProfile}
        />
      </KeyboardAvoidingView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  // ... existing styles ...
  avatarImage: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
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
  container: {
    flex: 1,
    backgroundColor: '#000', // Ensure dark bg just in case
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