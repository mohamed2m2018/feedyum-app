// Library import
import {
  I18nManager,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
} from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import request from '../../api/request';
// Local import
import { styles } from '../../themes';
import { moderateScale } from '../../common/constants';
import ZText from '../common/ZText';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query';
import Spinner from 'react-native-loading-spinner-overlay';
import { showErrorToast } from '../../utils/toast';
import CommentsList from '../../containers/TabBar/comments/CommentsList';
import { useHandleAuth } from '../../utils/useHandleAuth';

export default function Comment({ SheetRef, postId, onOpen, onClose }) {
  const colors = useSelector(state => state.theme.theme);
  const insets = useSafeAreaInsets();
  const inputRef = useRef();
  const replyBarAnim = useRef(new Animated.Value(0)).current;

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
    refetch,
  } = useInfiniteQuery(
    ['comments', postId],
    ({ pageParam = 1 }) => fetchCommentsByPostId(pageParam),
    {
      enabled: !!postId,
      retry: false,
      staleTime: 0,
      cacheTime: 0,
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
          showErrorToast('', err[Object.keys(err)?.[0]] || strings.errorOccured);
        }
      },
    },
  );

  const queryClient = useQueryClient();
  const { handleAuthToast } = useHandleAuth();

  const addComment = async commentText => {
    const response = await request.post('/comment', {
      postId,
      content: commentText,
    });
    return response.data;
  };

  const { mutate, isLoading: isLoadingAddComments } = useMutation(
    content => addComment(content),
    {
      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries(['commentsCount' + postId]);
        setAddChat('');
      },
    },
  );

  const [addChat, setAddChat] = useState('');
  const [commentId, setCommentId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { id, name, content }

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
      clearReply();
    },
    onError: error => {
      showErrorToast('', error.message || 'Sorry, an error has occurred');
    },
  });

  // Handle reply selection from CommentsList
  const handleReplySelect = (id, userName, commentContent) => {
    setCommentId(id);
    // Truncate content for preview (max 50 chars)
    const preview = commentContent?.length > 50
      ? commentContent.substring(0, 50) + '...'
      : commentContent;
    setReplyingTo({ id, name: userName, content: preview });
    inputRef.current?.focus();

    // Animate reply bar in
    Animated.spring(replyBarAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  // Clear reply state
  const clearReply = () => {
    setCommentId(null);
    setReplyingTo(null);
    Animated.timing(replyBarAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const onPressSend = () => {
    if (handleAuthToast()) {
      SheetRef.current.hide();
      setTimeout(() => {
        handleAuthToast();
      }, 200);
      return;
    }

    if (!addChat.trim()) return;

    Keyboard.dismiss();
    if (commentId) {
      mutation.mutate({
        commentId,
        postId,
        content: addChat,
      });
    } else {
      mutate(addChat);
    }
    setAddChat('');
    clearReply();
  };

  const [chatStyle, setChatStyle] = useState(BlurredStyle);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  // Determine if send button should be active
  const canSend = addChat.trim().length > 0 && !isLoadingAddComments && !isFetching;

  return (
    <ActionSheet
      gestureEnabled={true}
      ref={SheetRef}
      key={internalKey}
      onBeforeClose={async () => {
        await Keyboard.dismiss();
        onBlurInput();
        clearReply();
        setinternalKey(!internalKey);
        onClose?.();
      }}
      containerStyle={[
        localStyles.actionSheetContainer,
        { backgroundColor: colors.backgroundColor },
      ]}>
      <View style={{ height: '100%', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Spinner
            visible={
              isLoadingAddComments || isLoading || mutation.isLoading || isFetching
            }
            color={colors.primary}
          />
          <View
            style={[
              localStyles.headerContainer,
              {
                borderBottomColor: colors.primary + '20',
              },
            ]}>
            <View style={localStyles.headerHandle} />
            <ZText type="b22" align={'center'} style={localStyles.headerTitle}>
              {strings.comments}
            </ZText>
            <View style={[localStyles.headerAccent, { backgroundColor: colors.primary }]} />
          </View>
          <CommentsList
            onAddComment={handleReplySelect}
            inputRef={inputRef}
            postId={postId}
            SheetRef={SheetRef}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            data={data || []}
          />
        </View>

        {/* Input Section */}
        <View style={[localStyles.inputSection, { paddingBottom: Math.max(insets.bottom, moderateScale(12)) }]}>
          {/* Replying To Bar */}
          {replyingTo && (
            <Animated.View
              style={[
                localStyles.replyBar,
                {
                  backgroundColor: colors.primary + '15',
                  borderLeftColor: colors.primary,
                  opacity: replyBarAnim,
                  transform: [{
                    translateY: replyBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={localStyles.replyBarContent}>
                <Ionicons
                  name="arrow-undo"
                  size={moderateScale(14)}
                  color={colors.primary}
                  style={{ marginRight: moderateScale(6) }}
                />
                <View style={localStyles.replyTextContainer}>
                  <Text style={[localStyles.replyBarText, { color: colors.textColor }]} numberOfLines={1}>
                    {strings.replyingTo || 'Replying to'}{' '}
                    <Text style={[localStyles.replyBarName, { color: colors.primary }]}>
                      {replyingTo.name}
                    </Text>
                  </Text>
                  {replyingTo.content && (
                    <Text
                      style={[localStyles.replyPreview, { color: colors.grayScale7 }]}
                      numberOfLines={1}
                    >
                      {replyingTo.content}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={clearReply}
                style={localStyles.replyBarClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={moderateScale(18)}
                  color={colors.grayScale7}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Input Row */}
          <View style={localStyles.inputRow}>
            <View style={[
              localStyles.inputWrapper,
              {
                backgroundColor: colors.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                borderColor: chatStyle.borderColor,
              },
            ]}>
              <ZInput
                placeHolder={replyingTo ? `${strings.reply}...` : `${strings.message}...`}
                keyBoardType={'default'}
                fieldRef={inputRef}
                _value={addChat}
                autoCapitalize={'none'}
                toGetTextFieldValue={onchangeComment}
                inputContainerStyle={localStyles.inputField}
                _onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </View>

            <TouchableOpacity
              onPress={onPressSend}
              disabled={!canSend}
              activeOpacity={0.7}
              style={[
                localStyles.sendBtn,
                {
                  backgroundColor: canSend ? colors.primary : colors.grayScale4,
                  shadowColor: canSend ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: canSend ? 0.35 : 0,
                  shadowRadius: 8,
                  elevation: canSend ? 6 : 0,
                },
              ]}>
              <Feather
                name={'send'}
                size={moderateScale(20)}
                style={{
                  ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }),
                  marginLeft: I18nManager.isRTL ? 0 : moderateScale(2),
                }}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    height: '80%',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
  },
  headerContainer: {
    alignItems: 'center',
    paddingBottom: moderateScale(12),
    marginBottom: moderateScale(8),
    borderBottomWidth: 1,
  },
  headerHandle: {
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: moderateScale(12),
  },
  headerTitle: {
    marginBottom: moderateScale(8),
    letterSpacing: 0.5,
  },
  headerAccent: {
    width: moderateScale(40),
    height: moderateScale(3),
    borderRadius: moderateScale(1.5),
    opacity: 0.8,
  },
  // Input Section
  inputSection: {
    paddingTop: moderateScale(8),
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
    borderLeftWidth: 3,
    marginBottom: moderateScale(10),
  },
  replyBarContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyBarText: {
    fontSize: moderateScale(13),
    fontWeight: '400',
  },
  replyBarName: {
    fontWeight: '600',
  },
  replyPreview: {
    fontSize: moderateScale(12),
    fontWeight: '400',
    marginTop: moderateScale(2),
    fontStyle: 'italic',
  },
  replyBarClose: {
    padding: moderateScale(4),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: moderateScale(4),
  },
  inputWrapper: {
    flex: 1,
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inputField: {
    height: moderateScale(48),
    paddingHorizontal: moderateScale(16),
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    height: moderateScale(48),
    width: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(10),
  },
});
