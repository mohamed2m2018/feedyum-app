// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';

// Local import
import {styles} from '../../themes';
import ZText from '../common/ZText';
import {commentData, userDetail} from '../../api/constant';
import strings from '../../i18n/strings';
import ZInput from '../common/ZInput';
import {getHeight, moderateScale} from '../../common/constants';
import CommentComponent from '../CommentComponent';

export default function QAndA(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;
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

  const renderItem = useCallback(
    ({item, index}) => {
      return <CommentComponent item={item} index={index} />;
    },
    [userDetail],
  );

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
          {'Question & Answer'}
        </ZText>
      </View>

      <FlatList
        data={commentData}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.pb40}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
      <View style={localStyles.bottomContainer}>
        <ZInput
          placeHolder={strings.askQuestion}
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
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
  },
  headerContainer: {
    ...styles.pb5,
    ...styles.mb5,
    borderBottomWidth: 1,
  },
  btnContainer: {
    ...styles.mb30,
  },
  inputContainerStyle: {
    height: getHeight(60),
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
  bottomContainer: {
    ...styles.rowCenter,
    ...styles.mb20,
  },
});
