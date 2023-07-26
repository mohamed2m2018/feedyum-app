// Library import
import {Keyboard, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, { useRef, useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import request from '../../api/request';
// Local import
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import ZText from '../common/ZText';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';
import {useInfiniteQuery, useMutation, useQueryClient} from 'react-query';
import Spinner from 'react-native-loading-spinner-overlay';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import CommentsList from '../../containers/TabBar/comments/CommentsList';

// const CommentRender = ({
//   item,
//   colors,
//   currentUserId,
//   navigation,
//   SheetRef,
//   postId,
// }) => {
//   const queryClient = useQueryClient();

//   return (
//     <View>
//       <View style={localStyles.profileContainer}>
//         <TouchableOpacity
//           style={styles.rowCenter}
//           onPress={() => {
//             SheetRef.current?.hide();
//             navigateToProfile(
//               currentUserId,
//               item?.user_id?.avatar,
//               item?.user_id?.fullName,
//               navigation,
//               item?.user_id?._id,
//             );
//           }}>
//           <Image
//             source={
//               item?.user_id?.avatar
//                 ? {uri: item?.user_id?.avatar}
//                 : colors.dark
//                 ? images.userDark
//                 : images.userLight
//             }
//             style={localStyles.userImage}
//           />
//           <ZText type="b16" numberOfLines={1} align={'center'}>
//             {item?.user_id?.fullName}
//           </ZText>
//         </TouchableOpacity>
//         {item?.user_id?._id === currentUserId && (
//           <TouchableOpacity
//             style={localStyles.deleteButton}
//             onPress={() => mutation.mutate(item)}>
//             <Feather
//               name="trash-2"
//               size={moderateScale(20)}
//               color={colors.primary}
//             />
//           </TouchableOpacity>
//         )}
//       </View>
//       <ZText type="r14" style={styles.mv10} numberOfLines={2}>
//         {item?.content}
//       </ZText>
//       <View style={localStyles.likeContainer}>
//         <ZText type="r14">{item?.created_at.slice(0, 10)}</ZText>
//       </View>
//     </View>
//   );
// };

export default function Comment({SheetRef, postId}) {
  const colors = useSelector(state => state.theme.theme);
  const inputRef = useRef();

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const fetchCommentsByPostId = async pageParam => {
    const response = await request.get(
      `/comment?limit=10&page=${pageParam}&post_id=${postId}`,
    );
    return response.data;
  };

  const {
    data,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteQuery(
    ['comments', postId],
    ({pageParam = 1}) => fetchCommentsByPostId(pageParam),
    {
      skip: postId === undefined,
      retry: false,
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.currentPage < lastPage?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      select: res => res?.pages.flatMap(page => page.comments),
      onError: err => {
        if (
          err[Object.keys(err)?.[0]] !== 'Error fetching comments from database'
        ) {
          Toast.show({
            type: ALERT_TYPE.DANGER,
            title: '',
            textBody:
              err[Object.keys(err)?.[0]] || 'Sorry, an error has occured',
          });
        }
      },
    },
  );

  const queryClient = useQueryClient();

  const addComment = async commentText => {
    const response = await request.post('/comment', {
      postId,
      content: commentText,
    });
    return response.data;
  };

  const {mutate, isLoading: isLoadingAddComments} = useMutation(
    content => addComment(content),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: 'comments'});
        queryClient.invalidateQueries({queryKey: 'commentsCount' + postId});
        setAddChat('');
      },
    },
  );

  const [addChat, setAddChat] = useState('');

  const addReply = async replyData => {
    try {
      const response = await request.post('/comment/reply', replyData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add reply');
    }
  };

  const mutation = useMutation(replyData => addReply(replyData), {
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
    },
    onError: error => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: '',
        textBody: error.message || 'Sorry, an error has occurred',
      });
    },
  });

  const onPressSend = commentId => {
    Keyboard.dismiss();
    if (commentId) {
      mutation.mutate({
        commentId,
        postId,
        content: addChat,
      });
      setCommentId(null);
    } else {
      mutate(addChat);
    }
    setAddChat('');
  };

  const [chatStyle, setChatStyle] = useState(BlurredStyle);

  const [commentId, setCommentId] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // new state to track keyboard visibility

  const onFocusInput = () => {
    setChatStyle(FocusedStyle);
    setKeyboardVisible(true);
  };

  const onBlurInput = () => {
    setChatStyle(BlurredStyle);
    setKeyboardVisible(false);
  };

  const onchangeComment = text => setAddChat(text);
  const [internalKey, setinternalKey] = useState(false);

  return (
    <ActionSheet
      // gestureEnabled
      ref={SheetRef}
      key={internalKey}
      onBeforeClose={async () => {
        await Keyboard.dismiss();
        onBlurInput();
        setinternalKey(!internalKey);
      }}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <Spinner visible={isLoadingAddComments || isLoading} />
      <View
        style={[
          localStyles.headerContainer,
          {
            borderBottomColor: colors.bColor,
          },
        ]}>
        <ZText type="b24" align={'center'} style={styles.mb20}>
          {strings.comments}
        </ZText>
      </View>
      <CommentsList
        onAddComment={setCommentId}
        inputRef={inputRef}
        postId={postId}
        SheetRef={SheetRef}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        data={data || []}
      />
      <View style={[styles.rowCenter, {marginBottom: 30}]}>
        <ZInput
          placeHolder={strings.message + '...'}
          keyBoardType={'default'}
          fieldRef={inputRef}
          _value={addChat}
          autoCapitalize={'none'}
          toGetTextFieldValue={onchangeComment}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            chatStyle,
          ]}
          _onFocus={onFocusInput}
          onBlur={onBlurInput}
        />
        <TouchableOpacity
          onPress={() => onPressSend(commentId ? commentId : undefined)}
          disabled={isLoadingAddComments || isFetching}
          style={[
            localStyles.sendBtn,
            {
              backgroundColor: colors.primary,
            },
          ]}>
          <Feather
            name={'send'}
            size={moderateScale(24)}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
    height: '80%',
  },
  headerContainer: {
    ...styles.pb5,
    ...styles.mb5,
    borderBottomWidth: 1,
  },
  profileContainer: {
    ...styles.mt20,
    ...styles.rowSpaceBetween,
  },
  userImage: {
    height: moderateScale(50),
    width: moderateScale(50),
    borderRadius: moderateScale(25),
    ...styles.mr10,
  },
  likeContainer: {
    ...styles.mt5,
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  flatListContainer: {
    ...styles.flexGrow,
    ...styles.pb30,
  },
  senderContainer: {
    ...styles.p15,
    ...styles.flexRow,
    borderRadius: moderateScale(12),
    maxWidth: '80%',
    ...styles.itemsEnd,
    ...styles.mt10,
  },
  inputContainerStyle: {
    height: moderateScale(60),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    ...styles.ph15,
    width: moderateScale(300),
  },
  sendBtn: {
    height: moderateScale(60),
    width: moderateScale(60),
    borderRadius: moderateScale(30),
    ...styles.rowCenter,
    ...styles.ml10,
  },
});
