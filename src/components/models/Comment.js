// Library import
import {Keyboard, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Image from 'react-native-fast-image';
import ActionSheet, {useScrollHandlers} from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import request from '../../api/request';

// Local import
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import ZText from '../common/ZText';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';
import {KeyboardAwareFlatList as FlatList} from 'react-native-keyboard-aware-scroll-view';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import images from '../../assets/images';
import Spinner from 'react-native-loading-spinner-overlay';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import {StackNav, TabNav} from '../../navigation/NavigationKeys';
import {useNavigation} from '@react-navigation/native';

const navigateToProfile = (
  currentUserId,
  avatar,
  fullName,
  navigation,
  authorId,
) => {
  if (authorId !== currentUserId) {
    navigation.navigate(StackNav.ProfileDetail, {
      userName: fullName,
      userImage: avatar,
      id: authorId,
    });
  } else {
    navigation.navigate(TabNav.Profile);
  }
};

const CommentRender = ({item, colors, currentUserId, navigation, SheetRef}) => {
  return (
    <View>
      <View style={localStyles.profileContainer}>
        <TouchableOpacity
          style={styles.rowCenter}
          onPress={() => {
            SheetRef.current?.hide();
            navigateToProfile(
              currentUserId,
              item?.user_id?.avatar,
              item?.user_id?.fullName,
              navigation,
              item?.user_id?._id,
            );
          }}>
          <Image
            source={
              item?.user_id?.avatar
                ? {uri: item?.user_id?.avatar}
                : colors.dark
                ? images.userDark
                : images.userLight
            }
            style={localStyles.userImage}
          />
          <ZText type="b16" numberOfLines={1} align={'center'}>
            {item?.user_id?.fullName}
          </ZText>
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

export default function Comment({SheetRef, postId, currentUserId}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const renderItem = ({item}) => (
    <CommentRender
      item={item}
      colors={colors}
      currentUserId={currentUserId}
      navigation={navigation}
      SheetRef={SheetRef}
    />
  );
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

  const {data, isFetching} = useQuery(
    ['comments', postId],
    () => fetchCommentsByPostId(postId),
    {
      skip: postId === undefined,
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
        setAddChat('');
      },
    },
  );

  const [addChat, setAddChat] = useState('');

  const onPressSend = () => {
    Keyboard.dismiss();
    mutate(addChat);
  };
  const [chatStyle, setChatStyle] = useState(BlurredStyle);

  const onFocusInput = () => setChatStyle(FocusedStyle);

  const onBlurInput = () => setChatStyle(BlurredStyle);

  const onchangeComment = text => setAddChat(text);

  const scrollHandlers =
    useScrollHandlers < FlatList > ('scrollview-1', SheetRef);

  return (
    <ActionSheet
      // gestureEnabled
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <Spinner visible={isLoadingAddComments || isFetching} />
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
        enableOnAndroid={true}
        nestedScrollingEnabled
        {...scrollHandlers}
        scrollEnabled
        keyboardDismissMode={'interactive'}
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
          onPress={onPressSend}
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
