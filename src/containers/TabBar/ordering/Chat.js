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
  Modal,
  Dimensions,
  StatusBar,
  Text,
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
import { useQuery, useQueryClient } from 'react-query';
import strings from '../../../i18n/strings';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import { moderateScale } from '../../../common/constants';
import request from '../../../api/request';
import ImageMessageComposer from './components/ImageMessageComposer';
import VoiceRecorder from './components/VoiceRecorder';
import CustomMessageBubble from './components/CustomMessageBubble';
import OrderSummaryCard from './components/OrderSummaryCard';
import RejectReasonModal from './components/RejectReasonModal';
import ReplyPreviewBar from './components/ReplyPreviewBar';
import OrderReviewModal from '../chef/components/OrderReviewModal';
import { useNavigation } from '@react-navigation/native';
import { StackNav } from '../../../navigation/NavigationKeys';
import { formatTime, formatDate } from '../../../utils/helpers';

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

  const avatarUri = typeof chef?.avatar === 'string' && chef.avatar
    ? chef.avatar
    : (chef?.avatar?.url || chef?.avatar?.uri || null);

  // Generate initials for fallback avatar
  const initials = (chef?.fullName || chef?.username || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity onPress={onPress} style={profileStyles}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={avatarStyles}
        />
      ) : (
        <View style={[avatarStyles, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
          <ZText type="B14" color={colors.white}>{initials}</ZText>
        </View>
      )}
      <View style={profileInfoStyles}>
        <ZText type="B16" color={colors.textColor} numberOfLines={1}>
          {chef?.fullName || chef?.username || strings.defaultChefName}
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



export default function ChatScreen({ route }) {
  const { chefId, orderId } = route.params;
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile?.language);
  // Check if Arabic is selected
  const isRTL = language === 'ar' || language === 'Arabic' || (typeof language === 'string' && language.toLowerCase().includes('arabic'));
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [text, setText] = useState('');

  const [hideOrderSummary, setHideOrderSummary] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Whether more messages exist
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false); // Loading older messages
  const [chatAvailable, setChatAvailable] = useState(true); // Whether chef has chat enabled
  const socketRef = useRef(null);
  const textInputRef = useRef(null);
  const messageContainerRef = useRef(null);
  const { data: currentUserData } = useQuery('user', () => request.get('/user'));
  const currentUserId = currentUserData?.data?.user?._id;
  const isCurrentUserChef = currentUserId === chefId;

  // Check if the chef has chat enabled
  useEffect(() => {
    const checkChatStatus = async () => {
      try {
        const response = await request.get(`/chat/chat-status/${chefId}`);
        setChatAvailable(response?.data?.chatEnabled !== false);
      } catch (error) {
        console.error('[Chat] Failed to check chat status:', error);
        // Default to available on error
        setChatAvailable(true);
      }
    };
    if (chefId) checkChatStatus();
  }, [chefId]);

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

  // Handle reply to a message
  const handleReply = useCallback((message) => {
    console.log('Replying to message:', message);
    setReplyingTo(message);
    // Focus on text input
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  useEffect(() => {
    console.log('=== CHAT SCREEN LOADED (v2) - hasMoreMessages:', hasMoreMessages, '===');
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

        // 2. Format the new message - parse content for images and audio
        let text = message.content;
        let image = message.image || undefined;
        let audio = message.audio || undefined;
        let duration = message.duration || undefined;

        // Handle audio messages
        if (message.messageType === 'audio' || message.audio) {
          text = '';
          audio = message.audio;
          duration = message.duration;
        } else {
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
        }

        const newMessage = {
          _id: message._id || Math.random().toString(),
          text: text,
          createdAt: new Date(message.timestamp || Date.now()),
          user: {
            _id: senderId,
            name: message.sender.username || strings.user,
            avatar: toUriString(message.sender.avatar),
          },
          image: image,
          audio: audio,
          duration: duration,
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
      onSuccess: async () => {
        // Mark chat as read when messages are loaded (filter by orderId to only mark THIS order's messages)
        if (chefId) {
          try {
            const readUrl = orderId
              ? `/chat/chats/${chefId}/read?orderId=${orderId}`
              : `/chat/chats/${chefId}/read`;
            await request.put(readUrl);
            console.log('[ChatScreen] Marked chat as read for order:', orderId);
            // Immediately invalidate all badge-related caches
            queryClient.invalidateQueries(['unreadOrderChatsCount']);
            queryClient.invalidateQueries(['orderChats']);
            queryClient.invalidateQueries(['chatList']);
            // Trigger a direct refetch of badge counts to update header immediately
            // The socket event from backend should handle this, but as a backup:
            try {
              await Promise.all([
                request.get('/orders/unseen/count'),
                request.get('/chat/unread-counts'),
              ]);
            } catch (e) {
              // Badge refetch failed, socket will handle it
            }
          } catch (error) {
            console.warn('[ChatScreen] Failed to mark chat as read:', error.message);
          }
        }
      }
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
              name: msg.sender.username || strings.user,
              avatar: toUriString(msg.sender.avatar),
            },
            // Include replyTo if message is a reply to another message
            replyTo: msg.replyTo ? {
              _id: msg.replyTo._id,
              content: msg.replyTo.content,
              text: msg.replyTo.content,
              image: msg.replyTo.messageType === 'image' || msg.replyTo.content?.includes('.jpg') || msg.replyTo.content?.includes('.png'),
              audio: msg.replyTo.messageType === 'audio' || !!msg.replyTo.audio,
              sender: msg.replyTo.sender,
            } : null,
          };

          // Check if it's an audio message
          if (msg.messageType === 'audio' || msg.audio) {
            return {
              ...baseMessage,
              text: '',
              audio: msg.audio,
              duration: msg.duration,
            };
          }

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

    // Merge server messages with any pending/sending/socket-received messages
    // This preserves optimistic messages and real-time socket messages while updating with server data
    setMessages(prevMessages => {
      // Get IDs of server messages
      const serverMessageIds = new Set(safeMessages.map(m => String(m._id)));

      // Keep any pending/sending messages (optimistic)
      const pendingMessages = prevMessages.filter(m =>
        m.pending && !serverMessageIds.has(String(m._id))
      );

      // Keep socket-received messages that are NEWER than what server returned
      // These are confirmed messages (not pending, not temp) that aren't in server response
      const newestServerTime = safeMessages.length > 0
        ? Math.max(...safeMessages.map(m => new Date(m.createdAt).getTime()))
        : 0;

      const socketMessages = prevMessages.filter(m =>
        !m.pending &&
        !String(m._id).startsWith('temp_') &&
        !serverMessageIds.has(String(m._id)) &&
        new Date(m.createdAt).getTime() > newestServerTime
      );

      // ALSO keep messages from earlier loaded pages (older than oldest server message)
      const oldestServerTime = safeMessages.length > 0
        ? Math.min(...safeMessages.map(m => new Date(m.createdAt).getTime()))
        : Infinity;

      const olderPreviousMessages = prevMessages.filter(m =>
        !m.pending &&
        !String(m._id).startsWith('temp_') &&
        !serverMessageIds.has(String(m._id)) &&
        new Date(m.createdAt).getTime() < oldestServerTime
      );

      // Merge: server messages + socket messages + older pages + pending (sorted by time)
      const allMessages = [...safeMessages, ...socketMessages, ...olderPreviousMessages, ...pendingMessages];

      // Sort by createdAt descending (newest first for GiftedChat)
      allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Deduplicate by _id
      const seen = new Set();
      return allMessages.filter(m => {
        const id = String(m._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    });

    // Check if there are more messages (set from API response if available)
    console.log('[DEBUG] Pagination info:', {
      totalPages: messagesData?.data?.totalPages,
      currentPage: messagesData?.data?.currentPage,
      messagesCount: safeMessages.length
    });
    if (messagesData?.data?.totalPages && messagesData?.data?.currentPage) {
      const hasMore = messagesData.data.currentPage < messagesData.data.totalPages;
      console.log('[DEBUG] Setting hasMoreMessages from API:', hasMore);
      setHasMoreMessages(hasMore);
    } else {
      // FORCE TRUE for debugging - always assume more messages exist
      console.log('[DEBUG] Forcing hasMoreMessages=true (no pagination info or <10 messages)');
      setHasMoreMessages(true);
    }
  }, [messagesData, order, hideOrderSummary]);

  // Load earlier messages (pagination)
  const loadEarlierMessages = useCallback(async () => {
    console.log('[DEBUG] loadEarlierMessages called:', { isLoadingEarlier, hasMoreMessages, currentPage });
    if (isLoadingEarlier || !hasMoreMessages) {
      console.log('[DEBUG] loadEarlierMessages returning early');
      return;
    }

    setIsLoadingEarlier(true);
    try {
      const nextPage = currentPage + 1;
      console.log('[DEBUG] Fetching page:', nextPage);
      const response = await request.get(
        `/chat/messages?chatUserId=${chefId}&orderId=${orderId || ''}&page=${nextPage}&limit=20`
      );

      if (response.data?.messages && response.data.messages.length > 0) {
        const olderMessages = response.data.messages
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(msg => {
            const baseMessage = {
              _id: msg._id,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.sender._id || msg.sender,
                name: msg.sender.username || strings.user,
                avatar: toUriString(msg.sender.avatar),
              },
              replyTo: msg.replyTo ? {
                _id: msg.replyTo._id,
                content: msg.replyTo.content,
                text: msg.replyTo.content,
                sender: msg.replyTo.sender,
              } : null,
            };

            // Handle message types
            if (msg.messageType === 'audio' || msg.audio) {
              return { ...baseMessage, text: '', audio: msg.audio, duration: msg.duration };
            }

            try {
              const parsedContent = JSON.parse(msg.content);
              if (parsedContent.type === 'image_with_text') {
                return { ...baseMessage, text: parsedContent.text || '', image: parsedContent.image };
              }
            } catch (e) { }

            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            if (imageExtensions.some(ext => msg.content?.toLowerCase().includes(ext))) {
              return { ...baseMessage, text: '', image: msg.content };
            }

            return {
              ...baseMessage,
              text: msg.isDeleted ? (strings.thisMessageWasDeleted || 'This message was deleted') : msg.content,
              isDeleted: msg.isDeleted,
              isEdited: msg.isEdited,
            };
          })
          .reverse();

        // Merge and deduplicate by _id
        setMessages(prev => {
          const messageMap = new Map();
          // Add existing messages first
          prev.forEach(m => messageMap.set(String(m._id), m));
          // Add older messages (will not overwrite if already exists)
          olderMessages.forEach(m => {
            if (!messageMap.has(String(m._id))) {
              messageMap.set(String(m._id), m);
            }
          });
          // Convert back to array and sort (newest first for GiftedChat)
          return Array.from(messageMap.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        setCurrentPage(nextPage);
        setHasMoreMessages(
          response.data.currentPage < response.data.totalPages
        );
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.warn('Failed to load earlier messages:', error);
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [chefId, orderId, currentPage, isLoadingEarlier, hasMoreMessages]);

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
      formattedDate: `${formatDate(orderData.created_at, language)} · ${formatTime(orderData.created_at, language)}`,
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
      text: strings.orderSummaryLabel,
      createdAt: new Date(orderData.created_at),
      user: {
        _id: 'system',
        name: strings.orderSystem,
        avatar: null,
      },
      system: true,
      type: 'order_summary',
      orderSummary,
    };
  };

  const chatUser = useMemo(() => ({
    _id: currentUser?._id || 'unknown',
    name: currentUser?.fullName || strings.user,
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
        // Note: Keyboard stays open to allow continuous typing
        return;
      }

      // Normal send flow with optimistic UI
      for (const message of newMessages) {
        // Generate temporary ID for optimistic message
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Determine display content for optimistic message
        let displayText = message.text || '';
        let displayImage = message.image || undefined;
        let displayAudio = message.audio || undefined;
        let displayDuration = message.duration || undefined;

        // Capture replyTo data before clearing state
        const replyToData = replyingTo ? {
          _id: replyingTo._id,
          content: replyingTo.text || replyingTo.content,
          text: replyingTo.text || replyingTo.content,
          sender: replyingTo.user || { fullName: strings.user },
          audio: !!replyingTo.audio,
          image: !!replyingTo.image,
        } : null;

        // Create optimistic message (shown immediately with 'sending' status)
        const optimisticMsg = {
          _id: tempId,
          text: displayText,
          createdAt: new Date(),
          user: {
            _id: currentUser?._id || 'unknown',
            name: currentUser?.fullName || strings.user,
            avatar: toUriString(currentUser?.avatar),
          },
          image: displayImage,
          audio: displayAudio,
          duration: displayDuration,
          status: 'sending', // Optimistic status
          pending: true,
          replyTo: replyToData, // Include reply data for immediate display
        };

        // Add optimistic message to state immediately
        setMessages(prev => GiftedChat.append(prev, optimisticMsg));

        // Clear text and reply state immediately for better UX
        setText('');
        console.log('[DEBUG] Before clear - replyingTo:', replyingTo?._id);
        setReplyingTo(null); // Always clear, don't check if replyingTo exists first
        console.log('[DEBUG] Called setReplyingTo(null)');

        // Prepare message data for API
        let messageData = {
          chatUserId: chefId,
          orderId: orderId,
          replyTo: replyToData?._id || null, // Include reply reference
        };

        // Handle different message types
        if (message.audio) {
          messageData.audio = message.audio;
          messageData.duration = message.duration;
          messageData.messageType = 'audio';
          messageData.content = '';
        } else if (message.image) {
          // Check if image is a local path (needs S3 upload)
          let imageUrl = message.image;
          if (message.image.startsWith('file://') || message.image.startsWith('/')) {
            try {
              const { uploadImageToS3 } = require('../../../utils/UploadUtils');
              const uploadResult = await uploadImageToS3(message.image);
              if (uploadResult.success && uploadResult.url) {
                imageUrl = uploadResult.url;
              }
            } catch (uploadError) {
              console.warn('Image upload failed, using local path:', uploadError);
            }
          }

          if (message.text && message.text.trim()) {
            messageData.content = JSON.stringify({
              type: 'image_with_text',
              image: imageUrl,
              text: message.text.trim()
            });
          } else {
            messageData.content = imageUrl;
          }
        } else {
          messageData.content = message.text;
        }

        try {
          // Send message via HTTP
          const response = await request.post('/chat/message', messageData);

          if (response.data?.message) {
            const savedMsg = response.data.message;

            // Parse display text from saved message
            let finalDisplayText = savedMsg.content;
            if (savedMsg.messageType === 'audio' || savedMsg.audio) {
              finalDisplayText = '';
            } else {
              try {
                const parsedContent = JSON.parse(savedMsg.content);
                if (parsedContent.type === 'image_with_text') {
                  finalDisplayText = parsedContent.text || '';
                }
              } catch (e) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                if (imageExtensions.some(ext => savedMsg.content?.toLowerCase().includes(ext))) {
                  finalDisplayText = '';
                }
              }
            }

            // Replace optimistic message with confirmed message
            setMessages(prev => prev.map(msg =>
              msg._id === tempId
                ? {
                  ...msg,
                  _id: savedMsg._id,
                  text: finalDisplayText,
                  createdAt: new Date(savedMsg.timestamp || Date.now()),
                  status: 'sent',
                  pending: false,
                }
                : msg
            ));
          }
        } catch (sendError) {
          console.error('Failed to send message:', sendError);
          // Mark message as failed
          setMessages(prev => prev.map(msg =>
            msg._id === tempId
              ? { ...msg, status: 'failed', pending: false }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      // Note: Keyboard stays open to allow continuous typing
    }
  }, [chefId, orderId, currentUser, editingMessage, text, replyingTo]);
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

  const handleVoiceMessage = useCallback((audioMessage) => {
    const fullAudioMessage = {
      ...audioMessage,
      user: {
        _id: currentUser._id,
        name: currentUser.fullName,
        avatar: currentUser.avatar,
      },
    };

    onSend([fullAudioMessage]);
    setShowVoiceRecorder(false);
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
      const { showErrorToast } = require('../../../utils/toast');
      showErrorToast(strings.error, strings.failedToDeleteMessage);
    }
  }, [refetchMessages]);

  const handleTrackOrder = useCallback(() => {
    if (orderId) {
      navigation.navigate(StackNav.OrderTracking, { orderId });
    }
  }, [orderId, navigation]);

  // Retry failed message
  const handleRetryMessage = useCallback((failedMessage) => {
    // Remove the failed message from the list
    setMessages(prev => prev.filter(msg => msg._id !== failedMessage._id));
    // Resend the message
    onSend([{
      text: failedMessage.text,
      image: failedMessage.image,
      audio: failedMessage.audio,
      duration: failedMessage.duration,
    }]);
  }, [onSend]);

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
      onRetryMessage={handleRetryMessage}
      onReply={handleReply}
      isRTL={isRTL}
      onImagePress={(imageUrl) => setSelectedImage(imageUrl)}
      language={language}
    />
  ), [colors, currentUser, handleDeleteMessage, handleEditMessage, handleRetryMessage, handleReply, isRTL, language]);


  const renderInputToolbar = useCallback((props) => {
    // Disable chat for cancelled/expired orders
    if (order?.status === 'cancelled' || order?.status === 'expired') {
      return (
        <View style={{
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(20),
          backgroundColor: colors.inputBg,
          borderTopWidth: 1,
          borderTopColor: colors.bColor,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: moderateScale(8),
        }}>
          <Ionicons name="close-circle-outline" size={moderateScale(18)} color={colors.grayScale6} />
          <ZText type="M14" color={colors.grayScale6}>
            {strings.chatDisabledCancelled || 'Chat is disabled for cancelled orders'}
          </ZText>
        </View>
      );
    }

    // Disable chat when chef has paused chat
    if (!chatAvailable) {
      // Chef sees self-reminder, customer gets redirected to support
      if (isCurrentUserChef) {
        return (
          <View style={{
            paddingVertical: moderateScale(14),
            paddingHorizontal: moderateScale(20),
            backgroundColor: colors.inputBg,
            borderTopWidth: 1,
            borderTopColor: colors.bColor,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: moderateScale(8),
          }}>
            <Ionicons name="chatbubbles-outline" size={moderateScale(18)} color={colors.grayScale6} />
            <ZText type="M14" color={colors.grayScale6}>
              {strings.chatDisabledSelfReminder}
            </ZText>
          </View>
        );
      }
      // Customer: show Contact Support button with order context
      return (
        <View style={{
          paddingVertical: moderateScale(12),
          paddingHorizontal: moderateScale(20),
          backgroundColor: colors.inputBg,
          borderTopWidth: 1,
          borderTopColor: colors.bColor,
          alignItems: 'center',
          gap: moderateScale(8),
        }}>
          <ZText type="M13" color={colors.grayScale6}>
            {strings.chatDisabledByChef}
          </ZText>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingVertical: moderateScale(10),
              paddingHorizontal: moderateScale(20),
              borderRadius: moderateScale(20),
              gap: moderateScale(6),
            }}
            onPress={() => navigation.navigate(StackNav.SupportChat, { orderId })}
          >
            <Ionicons name="headset-outline" size={moderateScale(16)} color={colors.white} />
            <ZText type="B14" color={colors.white}>
              {strings.contactSupport}
            </ZText>
          </TouchableOpacity>
        </View>
      );
    }

    // When recording, show the VoiceRecorder instead of normal input
    if (showVoiceRecorder) {
      return (
        <View style={localStyles.voiceRecorderContainer}>
          <VoiceRecorder
            onSend={handleVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
            autoStart={true}
          />
        </View>
      );
    }

    return (
      <View>
        {/* Reply Preview Bar */}
        {replyingTo && (
          <ReplyPreviewBar
            replyingTo={replyingTo}
            onCancel={handleCancelReply}
            colors={colors}
            isRTL={isRTL}
          />
        )}
        <InputToolbar
          {...props}
          containerStyle={[
            localStyles.inputToolbar,
            {
              backgroundColor: colors.inputBg,
              borderTopColor: colors.bColor,
              paddingTop: moderateScale(4),
              paddingBottom: moderateScale(4),
              marginBottom: moderateScale(8),
            }
          ]}
        />
      </View>
    );
  }, [colors, showVoiceRecorder, handleVoiceMessage, replyingTo, handleCancelReply, isRTL, order?.status]);

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

  const renderActions = useCallback((props) => {
    if (showVoiceRecorder) {
      return null; // Hide actions when recording
    }
    return (
      <View style={localStyles.actionsContainer}>
        <ImageMessageComposer
          onSend={handleImageMessage}
          onCancel={() => { }}
        />
        {/* Mic button to activate voice recorder */}
        <TouchableOpacity
          style={[localStyles.micButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowVoiceRecorder(true)}
        >
          <Ionicons name="mic" size={moderateScale(20)} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }, [handleImageMessage, showVoiceRecorder, colors]);

  const renderMessageImage = useCallback((props) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelectedImage(props.currentMessage.image)}
    >
      <MessageImage
        {...props}
        imageStyle={localStyles.messageImage}
      />
    </TouchableOpacity>
  ), []);

  const renderLoadEarlier = useCallback((props) => {
    console.log('[DEBUG] renderLoadEarlier called');
    if (props.isLoadingEarlier) {
      return (
        <View style={{ alignItems: 'center', padding: 10 }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={{
          alignItems: 'center',
          padding: 10,
          marginVertical: 10,
        }}
        onPress={props.onLoadEarlier}
      >
        <View style={{
          backgroundColor: colors.inputBg,
          borderRadius: 15,
          paddingVertical: 8,
          paddingHorizontal: 16,
        }}>
          <Text style={{ color: colors.textColor, fontSize: 14 }}>
            {strings.loadEarlierMessages || 'Load earlier messages'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors]);

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
          {formatDate(props.currentMessage.createdAt, language, {
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



  // Show loading only if we're still loading and haven't encountered errors
  if ((userLoading || chefLoading) && !userError && !chefError) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.chat} showBack />
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ZText type="M14" color={colors.grayScale7} style={localStyles.loadingText}>
            {strings.loadingChat}
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
            {strings.failedToLoadChat}
          </ZText>
          <ZText type="M14" color={colors.grayScale7} style={localStyles.loadingText}>
            {strings.checkConnectionTryAgain}
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView edges={['top', 'left', 'right', 'bottom']}>
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
            const { showErrorToast } = require('../../../utils/toast');
            showErrorToast(strings.error, strings.failedToRejectOrder);
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Floating loading indicator for infinite scroll */}
        {isLoadingEarlier && (
          <View style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 999,
          }}>
            <View style={{
              backgroundColor: colors.inputBg,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textColor, fontSize: 12, marginLeft: 8 }}>
                {strings.loadingMoreMessages || 'Loading...'}
              </Text>
            </View>
          </View>
        )}
        <GiftedChat
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
          loadEarlier={hasMoreMessages}
          onLoadEarlier={() => {
            console.log('[DEBUG] onLoadEarlier triggered!');
            loadEarlierMessages();
          }}
          isLoadingEarlier={isLoadingEarlier}
          renderLoadEarlier={() => isLoadingEarlier ? (
            <View style={{
              alignItems: 'center',
              padding: 15,
              marginVertical: 10,
              backgroundColor: colors.inputBg,
              borderRadius: 20,
              marginHorizontal: 50,
            }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textColor, fontSize: 12, marginTop: 5 }}>
                {strings.loadingMoreMessages || 'Loading...'}
              </Text>
            </View>
          ) : null}
          listViewProps={{
            scrollEventThrottle: 100,
          }}
          listProps={{
            onScroll: (event) => {
              // Try different ways to access scroll data
              const nativeEvent = event?.nativeEvent || event;
              const contentOffset = nativeEvent?.contentOffset || { y: 0 };
              const contentSize = nativeEvent?.contentSize || { height: 0 };
              const layoutMeasurement = nativeEvent?.layoutMeasurement || { height: 0 };

              const scrollPosition = contentOffset.y;
              const maxScroll = contentSize.height - layoutMeasurement.height;
              const distanceFromVisualTop = maxScroll - scrollPosition;

              // Only log occasionally
              if (scrollPosition > 50 && Math.round(scrollPosition) % 100 < 10) {
                console.log('[DEBUG] Scroll:', Math.round(scrollPosition), 'fromTop:', Math.round(distanceFromVisualTop));
              }

              if (distanceFromVisualTop < 200 && hasMoreMessages && !isLoadingEarlier) {
                console.log('[DEBUG] Near top - loading earlier messages');
                loadEarlierMessages();
              }
            },
            scrollEventThrottle: 100,
          }}
          scrollToBottomOffset={300}
          bottomOffset={0}
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
  voiceRecorderContainer: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    backgroundColor: 'transparent',
  },
  micButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageImage: {
    width: moderateScale(150),
    height: moderateScale(100),
    borderRadius: moderateScale(13),
    margin: moderateScale(3),
    resizeMode: 'cover',
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