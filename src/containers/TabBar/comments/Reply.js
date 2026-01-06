import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import commentStyling from './CommentStyling';
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
  const timeAgo = new TimeAgo('en-US');
  const date = new Date(reply?.created_at);
  const time = timeAgo.format(date);

  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });

  const user = data?.data?.user;

  const navigation = useNavigation();

  const queryClient = useQueryClient();

  const { likesNo = 0, likes = [], _id } = reply;

  // Robust check for ObjectId vs String
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

  const toggleLikeMutation = useMutation(
    () => {
      console.log('[Reply Like] Calling API for replyId:', _id);
      return request.post(`/comment/reply/like/${_id}`);
    },
    {
      onMutate: async () => {
        console.log('[Reply Like] onMutate - Optimistic update');
        const previousLiked = isLiked;
        setIsLiked(!previousLiked);
        setLikesCount(prev => (!previousLiked ? prev + 1 : Math.max(0, prev - 1)));
        return { previousLiked };
      },
      onError: (err, newTodo, context) => {
        console.log('[Reply Like] onError:', err);
        setIsLiked(context.previousLiked);
        queryClient.invalidateQueries('comments');
      },
      onSuccess: (data) => {
        console.log('[Reply Like] onSuccess. Response:', data);
        console.log('[Reply Like] Invalidating queries with postId:', props.postId);
        // Force refetch to sync with server data
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

  return (
    <View>
      <View style={commentStyling.mainWrapper}>
        <TouchableOpacity onPress={navigateToProfile}>
          <Image
            style={commentStyling.replyImage}
            source={{ uri: reply?.user_id?.avatar }}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={commentStyling.wrapper}>
            <Text
              onPress={navigateToProfile}
              style={[
                commentStyling.commentOwner,
                { color: props.theme.textColor }
              ]}>
              {reply.user_id?.fullName}
            </Text>
            <Text
              style={[
                commentStyling.content,
                { color: props.theme.textColor }
              ]}>
              {reply.content}
            </Text>
          </View>

          <View style={commentStyling.replyFooter}>
            <Text style={[commentStyling.footerElement, { color: props.theme.textColor }]}>
              {time}
            </Text>

            {reply?.user_id?._id === user?._id && (
              <TouchableOpacity onPress={() => mutation.mutate(reply)}>
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
            size={moderateScale(16)}
            color={isLiked ? '#FF2D55' : props.theme.textColor}
          />
          <Text style={[localStyles.likeCount, { color: props.theme.textColor }]}>
            {millify(likesCount)}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const localStyles = StyleSheet.create({
  likeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(5),
    padding: moderateScale(5),
  },
  likeCount: {
    fontSize: moderateScale(10),
    marginTop: moderateScale(2),
    textAlign: 'center',
  }
});

export default Reply;
