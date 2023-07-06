import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import commentStyling from './CommentStyling';
import TimeAgo from 'javascript-time-ago';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {useNavigation} from '@react-navigation/native';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import {moderateScale} from '../../../common/constants';
import Feather from 'react-native-vector-icons/Feather';

const Reply = props => {
  const {reply} = props;
  const timeAgo = new TimeAgo('en-US');
  const date = new Date(reply?.created_at);
  const time = timeAgo.format(date);

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const user = data?.data?.user;

  const navigation = useNavigation();

  const queryClient = useQueryClient();

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
            source={{uri: reply?.user_id?.avatar}}
          />
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
            {reply.user_id?.fullName}
          </Text>
          <Text
            style={[
              commentStyling.content,
              {
                color: props.theme.textColor,
              },
            ]}>
            {reply.content}
          </Text>
        </View>
      </View>
      <View style={commentStyling.replyFooter}>
        <Text
          style={[
            commentStyling.footerElement,
            {color: props.theme.textColor},
          ]}>
          {time}
        </Text>
        <Text
          style={[
            commentStyling.footerElement,
            {color: props.theme.textColor},
          ]}>
          {reply.date}
        </Text>
        {reply?.user_id?._id === user?._id && (
          <TouchableOpacity onPress={() => mutation.mutate(reply)}>
            <Feather
              name="trash-2"
              size={moderateScale(20)}
              color={props.theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Reply;
