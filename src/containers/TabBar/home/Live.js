// Library import
import {
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {createRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import images from '../../../assets/images';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {styles} from '../../../themes';
import {moderateScale, getHeight, isAndroid} from '../../../common/constants';
import strings from '../../../i18n/strings';
import ZKeyBoardAvoidWrapper from '../../../components/common/ZKeyBoardAvoidWrapper';
import typography from '../../../themes/typography';
import {liveChat} from '../../../api/constant';
import UserProfile from '../../../components/models/UserProfile';
import LiveViewers from '../../../components/models/LiveViewers';
import WeeklyRanking from '../../../components/models/WeeklyRanking';
import GoLiveTogether from '../../../components/models/GoLiveTogether';
import QAndA from '../../../components/models/QAndA';

export default function Live({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const userProfileRef = createRef(null);
  const liveViewersRef = createRef(null);
  const weeklyRankingRef = createRef(null);
  const goLiveTogetherRef = createRef(null);
  const qAndARef = createRef(null);

  const [isFollow, setIsFollow] = useState(false);
  const [addChat, setAddChat] = useState('');
  const [chatStyle, setChatStyle] = useState(BlurredStyle);
  const [isDisable, setIsDisable] = useState(true);

  const BlurredStyle = {
    backgroundColor: colors.darkColor,
    borderColor: colors.darkColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

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
  const onPressFollow = () => setIsFollow(!isFollow);
  const onPressUser = () => userProfileRef?.current?.show();
  const onPressViewers = () => liveViewersRef?.current?.show();
  const onPressWeekly = () => weeklyRankingRef?.current?.show();
  const onPressGoLive = () => goLiveTogetherRef?.current?.show();
  const onPressQAndA = () => qAndARef?.current?.show();
  const onPressBack = () => navigation.goBack();

  const RenderCategory = ({title, icon, isColor}) => {
    return (
      <TouchableOpacity
        onPress={onPressWeekly}
        style={[
          localStyles.category,
          {
            backgroundColor: colors.gray,
          },
        ]}>
        <Ionicons
          name={icon}
          size={moderateScale(22)}
          color={isColor ? colors.yellow : colors.primary}
          style={styles.mr5}
        />
        <ZText type="s16" color={colors.white}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };

  const RenderLiveChat = useCallback(
    ({item, index}) => {
      return (
        <TouchableOpacity
          onPress={onPressUser}
          style={localStyles.liveChatUser}>
          <Image
            source={{
              uri: item.imgUrl,
            }}
            style={localStyles.liveChatUserImage}
          />
          <View style={localStyles.userDescription}>
            <ZText type="b16" color={colors.white} numberOfLines={1}>
              {item.name}
            </ZText>
            <ZText type="m14" style={styles.mt2} color={colors.white}>
              {item.message}
            </ZText>
          </View>
        </TouchableOpacity>
      );
    },
    [liveChat],
  );

  const RenderBottomItem = ({title, icon, isColor, onPress}) => {
    return (
      <TouchableOpacity onPress={onPress} style={localStyles.sendBtn}>
        <Ionicons
          name={icon}
          size={moderateScale(24)}
          color={!!isColor ? isColor : colors.white}
        />
        <ZText type="b14" numberOfLines={1} color={colors.white}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={images.liveBg} style={localStyles.root}>
      <ZKeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyles.topContainer}>
          <View style={localStyles.headerContainer}>
            <TouchableOpacity
              onPress={onPressUser}
              style={localStyles.userItem}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80',
                }}
                style={localStyles.imageStyle}
              />
              <View style={localStyles.userDescription}>
                <ZText type="b18" color={colors.white} numberOfLines={1}>
                  {'Dracel Steward'}
                </ZText>
                <ZText
                  type="m14"
                  style={styles.mt5}
                  color={colors.grayScale3}
                  numberOfLines={1}>
                  {'arianacooper | 24.5M followers'}
                </ZText>
              </View>
            </TouchableOpacity>

            <ZButton
              title={isFollow ? strings.follow : strings.following}
              color={isFollow ? colors.white : colors.primary}
              textType="b14"
              containerStyle={[
                localStyles.buttonContainer,
                {borderColor: colors.primary},
              ]}
              bgColor={isFollow ? colors.primary : colors.tranparent}
              onPress={onPressFollow}
            />
            <TouchableOpacity
              onPress={onPressViewers}
              style={[
                localStyles.userContainer,
                {
                  backgroundColor: colors.gray,
                },
              ]}>
              <Ionicons
                name="people"
                size={moderateScale(16)}
                color={colors.white}
                style={styles.mr5}
              />
              <ZText type="s12" color={colors.white}>
                {'13K'}
              </ZText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPressBack} style={styles.ml5}>
              <Ionicons
                name="close-sharp"
                size={moderateScale(26)}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={localStyles.categoryContainer}>
            <RenderCategory
              title={strings.weeklyRankings}
              icon="star"
              isColor={true}
            />
            <RenderCategory title={strings.explore} icon="compass" />
          </View>
        </View>
        <View style={localStyles.bottomContainer}>
          <FlatList
            data={liveChat}
            renderItem={RenderLiveChat}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            style={localStyles.flatListContainer}
          />
          <View style={localStyles.commentContainer}>
            <TextInput
              placeholder={strings.comments + '...'}
              placeholderTextColor={colors.placeHolderColor}
              keyBoardType={'default'}
              value={addChat}
              autoCapitalize={'none'}
              onChangeText={onchangeComment}
              style={[
                {backgroundColor: colors.inputBg, color: colors.white},
                localStyles.inputContainerStyle,
                chatStyle,
              ]}
              onFocus={onFocusInput}
              onBlur={onBlurInput}
            />
            <RenderBottomItem
              title={strings.liveTo}
              icon="people"
              onPress={onPressGoLive}
            />
            <RenderBottomItem
              title={strings.qna}
              icon="help-circle"
              onPress={onPressQAndA}
            />
            <RenderBottomItem
              title={strings.rose}
              icon="rose"
              isColor={colors.redColor}
            />
            <RenderBottomItem
              title={strings.gift}
              icon="gift"
              isColor={colors.yellow}
            />
            <RenderBottomItem title={'4.6k'} icon="arrow-redo" />
          </View>
        </View>
      </ZKeyBoardAvoidWrapper>
      <SafeAreaView>
        <UserProfile SheetRef={userProfileRef} />
        <LiveViewers SheetRef={liveViewersRef} />
        <WeeklyRanking SheetRef={weeklyRankingRef} />
        <GoLiveTogether SheetRef={goLiveTogetherRef} />
        <QAndA SheetRef={qAndARef} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const localStyles = StyleSheet.create({
  root: {
    height: '100%',
    width: '100%',
  },
  headerContainer: {
    ...styles.rowSpaceBetween,
    ...styles.flex,
    ...styles.ph20,
  },
  userItem: {
    ...styles.flex,
    ...styles.flexRow,
  },
  imageStyle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    resizeMode: 'cover',
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(35),
    borderRadius: moderateScale(17),
    borderWidth: moderateScale(1),
  },
  userContainer: {
    ...styles.rowCenter,
    ...styles.ph10,
    ...styles.ml5,
    height: getHeight(35),
    borderRadius: moderateScale(17),
  },
  userDescription: {
    ...styles.mh10,
    ...styles.flex,
    ...styles.justifyCenter,
  },
  topContainer: {
    position: 'absolute',
    top: isAndroid ? moderateScale(20) : moderateScale(55),
    left: 0,
    right: 0,
    zIndex: 1,
  },
  categoryContainer: {
    ...styles.flexRow,
    ...styles.ph20,
    ...styles.mt10,
  },
  category: {
    ...styles.rowCenter,
    ...styles.ph15,
    ...styles.mr10,
    height: getHeight(35),
    borderRadius: moderateScale(17),
  },
  bottomContainer: {
    position: 'absolute',
    zIndex: 1,
    bottom: 0,
    ...styles.ph20,
    width: '100%',
  },
  commentContainer: {
    ...styles.flexRow,
    ...styles.pt20,
  },
  inputContainerStyle: {
    height: getHeight(50),
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
    ...styles.ph15,
    ...styles.flexGrow1,
    width: '35%',
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
  },
  sendBtn: {
    ...styles.ml5,
    ...styles.flex,
    ...styles.center,
  },
  liveChatUser: {
    ...styles.mb10,
    ...styles.flexRow,
  },
  liveChatUserImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    resizeMode: 'cover',
  },
  flatListContainer: {
    maxHeight: getHeight(300),
  },
});
