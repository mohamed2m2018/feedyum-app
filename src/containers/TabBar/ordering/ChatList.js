import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useQuery} from 'react-query';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import strings from '../../../i18n/strings';

export default function ChatList({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [refreshing, setRefreshing] = useState(false);

  // Get current user
  const {data: userData} = useQuery('user', () => request.get('/user'));
  const currentUser = userData?.data?.user;

  // Listen for order changes to refresh chat list
  const currentOrder = useSelector(state => state.order?.currentOrder);
  const isPlacing = useSelector(state => state.order?.isPlacing);

  // Get order-based chats directly from backend
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery(
    ['orderChats', currentUser?._id],
    () => request.get('/chat/order-chats'),
    {
      enabled: !!currentUser?._id,
      refetchInterval: 5000, // Refresh every 5 seconds for faster updates
      staleTime: 0, // Always consider data stale for immediate updates
      cacheTime: 30000, // Keep in cache for 30 seconds
    },
  );

  const orderChats = chatsData?.data?.orderChats || [];

  // Refresh chat list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetchChats();
    }, [refetchChats])
  );

  // Refresh chat list when a new order is created
  useEffect(() => {
    if (currentOrder && !isPlacing) {
      // Order was just created, refresh the chat list
      setTimeout(() => {
        refetchChats();
      }, 1000); // Small delay to allow backend to process
    }
  }, [currentOrder, isPlacing, refetchChats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchChats();
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChatPress = (orderChat) => {
    navigation.navigate(StackNav.ChatScreen, {
      chefId: orderChat.chef._id,
      orderId: orderChat.orderId,
    });
  };

  const formatTime = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessagePreview = (content) => {
    if (!content) return strings.noMessagesYet;
    
    // Try to parse as JSON first (for structured messages like audio, images, etc.)
    try {
      const parsedContent = JSON.parse(content);
      
      if (parsedContent.type === 'audio_with_duration') {
        return '🎵 Audio message';
      }
      
      if (parsedContent.type === 'image_with_text') {
        return parsedContent.text ? `📷 ${parsedContent.text}` : '📷 Image';
      }
      
      // If it's JSON but unknown type, return a generic message
      return '📎 Media message';
      
    } catch (e) {
      // Not JSON, check if it's an image path
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const isImagePath = imageExtensions.some(ext => 
        content.toLowerCase().includes(ext)
      );
      
      if (isImagePath) {
        return '📷 Image';
      }
      
      // Check if it's an audio file path
      const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
      const isAudioPath = audioExtensions.some(ext => 
        content.toLowerCase().includes(ext)
      );
      
      if (isAudioPath) {
        return '🎵 Audio message';
      }
      
      // Check if it's an order summary message
      if (content.includes('🍽️ ORDER #')) {
        const orderMatch = content.match(/🍽️ ORDER #(\w+)/);
        const statusMatch = content.match(/🔄 Status: (\w+)/);
        if (orderMatch && statusMatch) {
          return `Order #${orderMatch[1]} - ${statusMatch[1]}`;
        }
        return strings.orderSummary;
      }
      
      // Regular text message - truncate if too long
      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning || '#FF9800';
      case 'chef_review':
        return colors.info || '#2196F3';
      case 'accepted':
        return colors.success || '#4CAF50';
      case 'preparing':
        return colors.info || '#2196F3';
      case 'ready':
        return colors.success || '#4CAF50';
      case 'delivered':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.error || '#F44336';
      default:
        return colors.grayScale7;
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending':
        return strings.pending;
      case 'chef_review':
        return strings.chefReviewing;
      case 'accepted':
        return strings.orderAccepted;
      case 'preparing':
        return strings.preparing;
      case 'ready':
        return strings.ready;
      case 'delivered':
        return strings.delivered;
      case 'cancelled':
        return strings.cancelled;
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
  };

  const renderChatItem = ({item}) => (
    <TouchableOpacity
      style={[localStyles.chatItem, {backgroundColor: colors.inputBg}]}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}>
      <Image
        source={{
          uri:
            item.chef.avatar ||
            'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200',
        }}
        style={localStyles.avatar}
      />

      <View style={localStyles.chatInfo}>
        <View style={localStyles.chatHeader}>
          <View style={localStyles.chefInfo}>
            <ZText type="B16" color={colors.textColor} numberOfLines={1}>
              {item.chef.fullName || item.chef.username || 'Chef'}
            </ZText>
            <ZText type="M12" color={colors.grayScale7} numberOfLines={1}>
              Order #{item.orderId?.slice(-6) || item.orderId}
            </ZText>
          </View>
          <View style={localStyles.orderStatus}>
            <View 
              style={[
                localStyles.statusBadge, 
                { backgroundColor: getOrderStatusColor(item.order.status) }
              ]}>
              <ZText type="M10" color={colors.white}>
                {getOrderStatusText(item.order.status)}
              </ZText>
            </View>
            <ZText type="M12" color={colors.grayScale7}>
              {formatTime(item.latestMessage?.timestamp || item.order.created_at)}
            </ZText>
          </View>
        </View>

        <ZText
          type="M14"
          color={colors.grayScale7}
          numberOfLines={2}
          style={localStyles.lastMessage}>
          {formatMessagePreview(item.latestMessage?.content) || strings.orderPlacedStartChatting}
        </ZText>
      </View>

      <Ionicons
        name="chevron-forward"
        size={moderateScale(20)}
        color={colors.grayScale7}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={localStyles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={moderateScale(64)}
        color={colors.grayScale4}
      />
      <ZText
        type="B18"
        color={colors.grayScale7}
        style={localStyles.emptyTitle}>
        No order chats yet
      </ZText>
      <ZText
        type="M14"
        color={colors.grayScale7}
        style={localStyles.emptySubtitle}>
        Start a conversation by placing an order and chatting with a chef
      </ZText>
    </View>
  );

  if ((chatsLoading) && !orderChats.length) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.orderChats} showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.orderChats} showBack />
      <FlatList
        data={orderChats}
        renderItem={renderChatItem}
        keyExtractor={item => `${item.orderId}-${item.chef._id}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingVertical: moderateScale(8),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(4),
  },
  chefInfo: {
    flex: 1,
  },
  orderStatus: {
    alignItems: 'flex-end',
    marginLeft: moderateScale(8),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(2),
  },
  lastMessage: {
    lineHeight: moderateScale(18),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
    paddingVertical: moderateScale(60),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});
