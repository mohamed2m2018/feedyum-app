// Library import
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import request from '../../api/request';

// Local import
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import ZText from '../common/ZText';
import images from '../../assets/images';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';
import {KeyboardAwareFlatList as FlatList} from 'react-native-keyboard-aware-scroll-view';
import {useMutation, useQuery, useQueryClient} from 'react-query';

const CommentRender = ({item}, colors) => {
  return (
    <View>
      <View style={localStyles.profileContainer}>
        <View style={styles.rowCenter}>
          <Image source={images.post} style={localStyles.userImage} />
          <ZText type="b16" numberOfLines={1} align={'center'}>
            {item?.user_id?.fullName}
          </ZText>
        </View>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal-circle-outline"
            size={moderateScale(30)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
      <ZText type="r14" style={styles.mv10} numberOfLines={2}>
        {item?.content}
      </ZText>
      <View style={localStyles.likeContainer}>
        <ZText type="r14">{item?.created_at.slice(0, 10)}</ZText>
      </View>
    </View>
  );
};

const renderItem = ({item}, colors) => (
  <CommentRender item={item} colors={colors} />
);

export default function Comment({SheetRef, postId}) {
  const colors = useSelector(state => state.theme.theme);
  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const fetchCommentsByPostId = async () => {
    const response = await request.get(`/comment?post_id=${postId}`);
    return response.data;
  };

  const {data} = useQuery(
    ['comments', postId],
    () => fetchCommentsByPostId(postId),
    {
      skip: !postId,
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

  const {mutate} = useMutation(content => addComment(content), {
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: 'comments'});
    },
  });

  const [addChat, setAddChat] = useState('');
  const [chatStyle, setChatStyle] = useState(BlurredStyle);

  const onFocusInput = () => setChatStyle(FocusedStyle);

  const onBlurInput = () => setChatStyle(BlurredStyle);

  const onchangeComment = text => setAddChat(text);

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
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
      <FlatList
        data={data?.comments}
        renderItem={renderItem}
        keyExtractor={item => item?._id}
        contentContainerStyle={localStyles.flatListContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
      <View style={[styles.rowCenter, styles.mb20]}>
        <ZInput
          placeHolder={strings.message + '...'}
          keyBoardType={'default'}
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
          onPress={() => mutate(addChat)}
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
