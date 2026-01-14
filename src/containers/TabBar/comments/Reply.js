import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, I18nManager, Animated } from 'react-native';
import TimeAgo from 'javascript-time-ago';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import { moderateScale } from '../../../common/constants';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import millify from 'millify';

const Reply = props => {
  const { reply } = props;
  const timeAgo = I18nManager.isRTL ? new TimeAgo('ar') : new TimeAgo('en-US');
  const date = new Date(reply?.created_at);
  const time = timeAgo.format(date);

  // Animation for like button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const user = data?.data?.user;

  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { likesNo = 0, likes = [], _id } = reply;

  const checkIsLiked = () => {
    if (!user?._id || !likes) return false;
    return likes.some(id => id.toString() === user._id.toString());
  };

  const [isLiked, setIsLiked] = useState(checkIsLiked());
  const [likesCount, setLikesCount] = useState(likesNo);

  useEffect(() => {
    setIsLiked(checkIsLiked());
  }, [likes, user]);

  useEffect(() => {
    setLikesCount(likesNo);
  }, [likesNo]);

  const animateLike = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
      }),
    ]).start();
  };

  const toggleLikeMutation = useMutation(
    () => request.post(`/comment/reply/like/${_id}`),
    {
      onMutate: async () => {
        const previousLiked = isLiked;
        setIsLiked(!previousLiked);
        setLikesCount(prev => (!previousLiked ? prev + 1 : Math.max(0, prev - 1)));
        animateLike();
        return { previousLiked };
      },
      onError: (err, newTodo, context) => {
        setIsLiked(context.previousLiked);
        queryClient.invalidateQueries('comments');
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', props.postId]);
      }
    }
  );

  const deleteReply = async () => {
    await request.post('/comment/reply/delete', {
      commentId: props.commentId,
      replyId: reply._id,
    });
    queryClient.invalidateQueries({
      queryKey: 'commentsCount' + props.commentId,
    });
  };

  const mutation = useMutation(() => deleteReply(reply._id), {
    onSuccess: () => {
      queryClient.invalidateQueries('comments');
    },
  });

  const navigateToProfile = () => {
    if (reply.user_id._id !== user?._id) {
      navigation.navigate(StackNav.ProfileDetail, {
        userName: reply.user_id.fullName,
        userImage: reply.user_id.avatar,
        id: reply.user_id._id,
      });
      props.SheetRef?.current?.hide?.();
    } else {
      navigation.navigate(TabNav.Profile);
      props.SheetRef?.current?.hide?.();
    }
  };

  const cardBgColor = props.theme.dark
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(0, 0, 0, 0.015)';

  return (
    <View
      style={[
        localStyles.replyCard,
        { backgroundColor: cardBgColor }
      ]}
    >
      {/* Avatar */}
      <TouchableOpacity onPress={navigateToProfile} style={localStyles.avatarContainer}>
        <Image
          style={[
            localStyles.avatar,
            { borderColor: props.theme.primary + '30' }
          ]}
          source={{ uri: reply?.user_id?.avatar }}
        />
      </TouchableOpacity>

      {/* Content Section */}
      <View style={localStyles.contentWrapper}>
        {/* Header with name */}
        <TouchableOpacity onPress={navigateToProfile}>
          <Text style={[localStyles.userName, { color: props.theme.textColor }]}>
            {reply.user_id?.fullName}
          </Text>
        </TouchableOpacity>

        {/* Reply text */}
        <Text style={[localStyles.contentText, { color: props.theme.textColor }]}>
          {reply.content}
        </Text>

        {/* Footer actions */}
        <View style={localStyles.footerRow}>
          <Text style={[localStyles.timeText, { color: props.theme.grayScale7 }]}>
            {time}
          </Text>

          {reply?.user_id?._id === user?._id && (
            <TouchableOpacity
              onPress={() => mutation.mutate(reply)}
              style={[localStyles.deleteButton, { backgroundColor: props.theme.redColor + '15' }]}
            >
              <Feather
                name="trash-2"
                size={moderateScale(12)}
                color={props.theme.redColor || '#FF3B30'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Like Button Column */}
      <View style={localStyles.likeColumn}>
        <TouchableOpacity
          onPress={() => toggleLikeMutation.mutate()}
          style={[
            localStyles.likeButton,
            isLiked && { backgroundColor: '#FF2D5510' }
          ]}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={moderateScale(16)}
              color={isLiked ? '#FF2D55' : props.theme.grayScale7}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={[localStyles.likeCount, { color: props.theme.grayScale7 }]}>
          {millify(likesCount)}
        </Text>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  replyCard: {
    flexDirection: 'row',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  avatarContainer: {
    marginRight: moderateScale(10),
  },
  avatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
  },
  contentWrapper: {
    flex: 1,
    paddingRight: moderateScale(4),
  },
  userName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: moderateScale(2),
  },
  contentText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: '400',
    marginBottom: moderateScale(6),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: moderateScale(11),
    fontWeight: '400',
    marginRight: moderateScale(12),
  },
  deleteButton: {
    padding: moderateScale(5),
    borderRadius: moderateScale(8),
  },
  likeColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: moderateScale(2),
    minWidth: moderateScale(36),
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(6),
    borderRadius: moderateScale(14),
  },
  likeCount: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    marginTop: moderateScale(2),
  },
});

export default Reply;
