// Library import
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo, useState} from 'react';
import {FlatList} from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';

// Local import
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import ZText from '../common/ZText';
import images from '../../assets/images';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';

export default function Comment({SheetRef}) {
  const colors = useSelector(state => state.theme.theme);
  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const [addChat, setAddChat] = useState('');
  const [chatStyle, setChatStyle] = useState(BlurredStyle);

  const onFocusInput = () => setChatStyle(FocusedStyle);

  const onBlurInput = () => setChatStyle(BlurredStyle);

  const onchangeComment = text => setAddChat(text);

  const CommentRender = memo(() => {
    return (
      <View>
        <View style={localStyles.profileContainer}>
          <View style={styles.rowCenter}>
            <Image source={images.post} style={localStyles.userImage} />
            <ZText type="b16" numberOfLines={1} align={'center'}>
              {'Kristin Watson'}
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
          {
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.'
          }
        </ZText>
        <View style={localStyles.likeContainer}>
          <TouchableOpacity style={styles.rowCenter}>
            <Ionicons
              name="heart-outline"
              size={moderateScale(20)}
              color={colors.textColor}
            />
            <ZText type="r14" style={styles.ml10}>
              {strings.like}
            </ZText>
          </TouchableOpacity>

          <ZText type="r14" style={styles.ml10}>
            {'3 days ago'}
          </ZText>
        </View>
      </View>
    );
  });

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
        data={[1, 2, 3, 4]}
        renderItem={() => <CommentRender />}
        keyExtractor={item => item}
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
