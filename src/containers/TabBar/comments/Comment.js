import { View, Text, Image, TouchableOpacity, I18nManager, StyleSheet, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import commentStyling from './CommentStyling';
import TimeAgo from 'javascript-time-ago';
import Reply from './Reply';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import { moderateScale } from '../../../common/constants';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import strings from '../../../i18n/strings';
import millify from 'millify';

const Comment = props => {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { commentData } = props;
  const {
    content,
    user_id,
    replies,
    created_at,
    _id,
    likesNo = 0,
    likes = []
  } = commentData;

  // Animation for like button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { data: userData } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const currentUser = userData?.data?.user;

  // Robust check for ObjectId vs String
  const checkIsLiked = () => {
    if (!currentUser?._id || !likes) return false;
    return likes.some(id => id.toString() === currentUser._id.toString());
  };

  const [isLiked, setIsLiked] = useState(checkIsLiked());
  const [likesCount, setLikesCount] = useState(likesNo);

  useEffect(() => {
    setIsLiked(checkIsLiked());
  }, [likes, currentUser]);

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
    () => request.post(`/comment/like/${_id}`),
    {
      onMutate: async () => {
        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousLiked);
        setLikesCount(prev => (!previousLiked ? prev + 1 : Math.max(0, prev - 1)));
        animateLike();

        return { previousLiked, previousCount };
      },
      onError: (err, newTodo, context) => {
        setIsLiked(context.previousLiked);
        setLikesCount(context.previousCount);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', props.postId]);
      }
    }
  );

  const deleteComment = async () => {
    await request.delete(`/comment/${props.postId}/${_id}`);
    queryClient.invalidateQueries('commentsCount' + props.postId);
  };

  const mutation = useMutation(() => deleteComment(_id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', props.postId]);
      props.refetch?.();
    },
  });

  const onPressReply = () => {
    props.inputRef.current.focus();
    // Pass comment ID, user name, and content preview for "Replying to..." indicator
    props.onAddComment?.(_id, fullName, content);
    props.scrollToComment?.(props.index);
  };

  const renderReplies = replies => {
    return replies.map((reply, index) => (
      <View
        key={index}
        style={[
          commentStyling.replyContainer,
          { borderLeftColor: props.theme.primary + '30' }
        ]}
      >
        <Reply
          commentId={props.commentData._id}
          postId={props.postId}
          theme={props.theme}
          SheetRef={props.SheetRef}
          reply={reply}
        />
      </View>
    ));
  };

  const fullName = user_id?.fullName || "Deleted User";
  const avatar = user_id?.avatar || "https://placehold.co/100x100/png";

  const timeAgo = I18nManager.isRTL ? new TimeAgo('ar') : new TimeAgo('en-US');
  const date = new Date(created_at);
  const time = timeAgo.format(date);

  const navigateToProfile = () => {
    if (commentData?.user_id?._id !== currentUser?._id) {
      if (commentData?.user_id) {
        navigation.navigate(StackNav.ProfileDetail, {
          userName: commentData.user_id.fullName,
          userImage: commentData.user_id.avatar,
          id: commentData.user_id._id,
        });
      }
      props.SheetRef?.current?.hide?.();
    } else {
      navigation.navigate(TabNav.Profile);
      props.SheetRef?.current?.hide?.();
    }
  };

  const cardBgColor = props.theme.dark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.02)';

  return (
    <View style={localStyles.container}>
      {/* Comment Card */}
      <View
        style={[
          localStyles.commentCard,
          {
            backgroundColor: cardBgColor,
            shadowColor: props.theme.dark ? '#000' : '#888',
          }
        ]}
      >
        {/* Avatar */}
        <TouchableOpacity
          onPress={navigateToProfile}
          style={localStyles.avatarContainer}
        >
          <Image
            style={[
              localStyles.avatar,
              { borderColor: props.theme.primary + '40' }
            ]}
            source={{ uri: avatar }}
          />
        </TouchableOpacity>

        {/* Content Section */}
        <View style={localStyles.contentWrapper}>
          {/* Header with name */}
          <TouchableOpacity onPress={navigateToProfile}>
            <Text style={[localStyles.userName, { color: props.theme.textColor }]}>
              {fullName}
            </Text>
          </TouchableOpacity>

          {/* Comment text */}
          <Text style={[localStyles.contentText, { color: props.theme.textColor }]}>
            {content}
          </Text>

          {/* Footer actions */}
          <View style={localStyles.footerRow}>
            <Text style={[localStyles.timeText, { color: props.theme.grayScale7 }]}>
              {time}
            </Text>

            <TouchableOpacity
              onPress={onPressReply}
              style={localStyles.actionButton}
            >
              <Text style={[localStyles.actionText, { color: props.theme.primary }]}>
                {strings.reply}
              </Text>
            </TouchableOpacity>

            {commentData?.user_id?._id === currentUser?._id && (
              <TouchableOpacity
                onPress={() => mutation.mutate(commentData)}
                style={[localStyles.deleteButton, { backgroundColor: props.theme.redColor + '15' }]}
              >
                <Feather
                  name="trash-2"
                  size={moderateScale(14)}
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
                size={moderateScale(20)}
                color={isLiked ? '#FF2D55' : props.theme.grayScale7}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={[localStyles.likeCount, { color: props.theme.grayScale7 }]}>
            {millify(likesCount)}
          </Text>
        </View>
      </View>

      {/* Replies Section */}
      {replies && replies.length > 0 && (
        <View style={localStyles.repliesSection}>
          {renderReplies(replies)}
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(4),
  },
  commentCard: {
    flexDirection: 'row',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScale(6),
    borderRadius: moderateScale(16),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 2,
  },
  contentWrapper: {
    flex: 1,
    paddingRight: moderateScale(4),
  },
  userName: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: moderateScale(3),
  },
  contentText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontWeight: '400',
    marginBottom: moderateScale(10),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: moderateScale(12),
    fontWeight: '400',
    marginRight: moderateScale(16),
  },
  actionButton: {
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    marginRight: moderateScale(8),
  },
  actionText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  deleteButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(4),
  },
  likeColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: moderateScale(2),
    minWidth: moderateScale(44),
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(8),
    borderRadius: moderateScale(18),
  },
  likeCount: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginTop: moderateScale(2),
  },
  repliesSection: {
    marginLeft: moderateScale(8),
    marginTop: moderateScale(4),
  },
});

export default Comment;
