// Library import
import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import React, {memo, useEffect, useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import ZInput from '../../../components/common/ZInput';
import {StackNav} from '../../../navigation/NavigationKeys';
import {checkPlatform} from '../../../utils/helpers';
import {chatData} from '../../../api/constant';

export default function Chat({navigation, route}) {
  const userName = route.params?.userName;
  const userImage = route.params?.userImage;
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
  const [isDisable, setIsDisable] = useState(true);

  useEffect(() => {
    if (addChat.length > 0) {
      setIsDisable(false);
    } else {
      setIsDisable(true);
    }
  }, [addChat]);

  const onFocusInput = () => setChatStyle(FocusedStyle);

  const onBlurInput = () => setChatStyle(BlurredStyle);

  const onchangeComment = text => setAddChat(text);

  const onPressCall = () =>
    navigation.navigate(StackNav.Call, {
      userName: userName,
      userImage: userImage,
    });

  const RightIcon = () => {
    return (
      <View style={styles.rowCenter}>
        <TouchableOpacity onPress={onPressCall} style={styles.pr10}>
          <Ionicons
            name="call-outline"
            size={moderateScale(30)}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal-circle-outline"
            size={moderateScale(30)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // This is show Day like today or tomorrow
  const RenderTimeList = ({title}) => {
    return (
      <View
        style={[
          localStyles.timeContainer,
          {
            backgroundColor: colors.lightGray,
          },
        ]}>
        <ZText color={colors.grayScale6} type="r14">
          {title}
        </ZText>
      </View>
    );
  };

  const SenderMessage = memo(({item, index}) => {
    return (
      <View
        style={[
          localStyles.senderContainer,
          {
            backgroundColor:
              item.type == 'sender'
                ? colors.primary
                : colors.dark
                ? colors.dark3
                : colors.grayScale1,
            alignSelf: item.type == 'sender' ? 'flex-end' : 'flex-start',
          },
        ]}>
        <ZText style={styles.flex} color={colors.grayScale6} type="m16">
          {item.message}
        </ZText>
        <ZText color={colors.grayScale6} style={styles.pl10} type="r12">
          {item.time}
        </ZText>
      </View>
    );
  });

  const onPressProfile = () => {
    navigation.navigate(StackNav.ProfileDetail, {
      userName: userName,
      userImage: userImage,
    });
  };

  const UserProfile = () => {
    return (
      <TouchableOpacity onPress={onPressProfile}>
        <Image
          source={{
            uri: userImage,
          }}
          style={localStyles.avatar}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader
        title={userName}
        isLeftIcon={<UserProfile />}
        rightIcon={<RightIcon />}
      />
      <KeyboardAvoidingView
        keyboardVerticalOffset={
          checkPlatform() === 'ios' ? moderateScale(10) : null
        }
        style={styles.flex}
        behavior={checkPlatform() === 'ios' ? 'padding' : null}>
        <View style={styles.flex}>
          <FlatList
            data={chatData}
            renderItem={({item, index}) => (
              <SenderMessage item={item} index={index} />
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.mh20}
          />
        </View>
        <View style={styles.rowCenter}>
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
            disabled={isDisable}
            style={[
              localStyles.sendBtn,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            <Feather
              name={isDisable ? 'mic' : 'send'}
              size={moderateScale(24)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  root: {
    ...styles.flex,
    ...styles.ph20,
    ...styles.itemsCenter,
  },
  timeContainer: {
    ...styles.pv10,
    ...styles.mv15,
    ...styles.ph15,
    borderRadius: moderateScale(12),
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
  avatar: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.mh10,
  },
});
