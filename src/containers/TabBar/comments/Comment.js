import { View, Text, Image, TouchableOpacity, I18nManager, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
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

  const { data: userData } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const currentUser = userData?.data?.user;

  console.log('Comment Debug:', _id, 'likes:', likes, 'curUser:', currentUser?._id, 'isLiked:', likes.includes(currentUser?._id));

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

  // Sync local count if prop updates (e.g. from refresh)
  useEffect(() => {
    setLikesCount(likesNo);
  }, [likesNo]);


  const toggleLikeMutation = useMutation(
    () => request.post(`/comment/like/${_id}`),
    {
      onMutate: async () => {
        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousLiked);
        setLikesCount(prev => (!previousLiked ? prev + 1 : Math.max(0, prev - 1)));

        return { previousLiked, previousCount };
      },
      onError: (err, newTodo, context) => {
        // Revert on error
        setIsLiked(context.previousLiked);
        setLikesCount(context.previousCount);
      },
      onSuccess: () => {
        // Force refetch to sync with server data
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
      props.refetch?.(); // Refetch parent list if passed
    },
  });

  const onPressReply = () => {
    props.inputRef.current.focus();
    // Pass comment ID to parent to know we are replying to THIS comment
    props.onAddComment?.(_id);
    // Scroll to this comment
    props.scrollToComment?.(props.index);
  };

  const renderReplies = replies => {
    return replies.map((reply, index) => (
      <View key={index} style={{ marginLeft: moderateScale(20), marginTop: moderateScale(5) }}>
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

  return (
    <View style={localStyles.container}>
      <View style={commentStyling.mainWrapper}>
        <TouchableOpacity onPress={navigateToProfile}>
          <Image style={commentStyling.image} source={{ uri: avatar }} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={commentStyling.wrapper}>
            <Text
              onPress={navigateToProfile}
              style={[
                commentStyling.commentOwner,
                { color: props.theme.textColor }
              ]}>
              {fullName}
            </Text>
            <Text
              style={[
                commentStyling.content,
                { color: props.theme.textColor }
              ]}>
              {content}
            </Text>
          </View>

          <View style={commentStyling.commentFooter}>
            <Text style={[commentStyling.footerElement, { color: props.theme.textColor }]}>
              {time}
            </Text>

            <TouchableOpacity onPress={onPressReply}>
              <Text style={[commentStyling.footerElement, { color: props.theme.textColor }]}>
                {strings.reply}
              </Text>
            </TouchableOpacity>

            {commentData?.user_id?._id === currentUser?._id && (
              <TouchableOpacity onPress={() => mutation.mutate(commentData)}>
                <Feather name="trash-2" size={moderateScale(16)} color={props.theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Like Button Column */}
        <TouchableOpacity
          onPress={() => toggleLikeMutation.mutate()}
          style={localStyles.likeContainer}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={moderateScale(18)}
            color={isLiked ? '#FF2D55' : props.theme.textColor} // TikTo pink/red
          />
          <Text style={[localStyles.likeCount, { color: props.theme.textColor }]}>
            {millify(likesCount)}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Replies Section */}
      {replies && replies.length > 0 && renderReplies(replies)}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(15),
  },
  likeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(5),
    padding: moderateScale(5),
  },
  likeCount: {
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
    textAlign: 'center',
  }
});

export default Comment;
