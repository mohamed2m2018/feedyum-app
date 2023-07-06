import React from 'react';

import {View, Text, Image, TouchableOpacity} from 'react-native';

import commentStyling from './CommentStyling';

import TimeAgo from 'javascript-time-ago';

import Reply from './Reply';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import {moderateScale} from '../../../common/constants';
import Feather from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';

const Comment = props => {
  const queryClient = useQueryClient();

  const navigation = useNavigation();

  const deleteComment = async () => {
    await request.delete(`/comment/${props.postId}/${_id}`);
    queryClient.invalidateQueries({queryKey: 'commentsCount' + props.postId});
  };

  const mutation = useMutation(() => deleteComment(_id), {
    onSuccess: () => {
      queryClient.invalidateQueries('comments');
    },
  });

  const onPress = (_id, index) => {
    props.inputRef.current.focus();
    props.scrollToComment(index);
    props.onAddComment(_id);
  };

  const renderReplies = replies => {
    return replies.map((reply, index) => (
      <View key={index}>
        <Reply
          commentId={props.commentData._id}
          theme={props.theme}
          SheetRef={props.SheetRef}
          reply={reply}
        />
      </View>
    ));
  };

  const {commentData} = props;

  const {
    content,
    user_id: {fullName, avatar},
    replies,
    created_at,
    _id,
  } = commentData;

  // Create formatter (English).
  const timeAgo = new TimeAgo('en-US');
  const date = new Date(created_at);
  const time = timeAgo.format(date);

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const user = data?.data?.user;

  const navigateToProfile = () => {
    if (commentData.user_id._id !== user?._id) {
      navigation.navigate(StackNav.ProfileDetail, {
        userName: commentData.user_id.fullName,
        userImage: commentData.user_id.avatar,
        id: commentData.user_id._id,
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
          <Image style={commentStyling.image} source={{uri: avatar}} />
        </TouchableOpacity>
        <View style={commentStyling.wrapper}>
          <Text
            onPress={navigateToProfile}
            style={[
              commentStyling.commentOwner,
              {
                color: props.theme.textColor,
              },
            ]}>
            {fullName}
          </Text>
          <Text
            style={[
              commentStyling.content,
              {
                color: props.theme.textColor,
              },
            ]}>
            {content}
          </Text>
        </View>
      </View>
      <View style={commentStyling.commentFooter}>
        <Text
          style={[
            commentStyling.footerElement,
            {color: props.theme.textColor},
          ]}>
          {time}
        </Text>

        <TouchableOpacity onPress={() => onPress(_id, props.index)}>
          <Text
            style={[
              commentStyling.footerElement,
              {color: props.theme.textColor},
            ]}>
            Reply
          </Text>
        </TouchableOpacity>
        {commentData?.user_id?._id === user?._id && (
          <TouchableOpacity
            style={{}}
            onPress={() => mutation.mutate(commentData)}>
            <Feather
              name="trash-2"
              size={moderateScale(20)}
              color={props.theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>
      {replies ? renderReplies(replies) : null}
    </View>
  );
};

export default Comment;
