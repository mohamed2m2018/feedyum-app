import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import {
  GestureDetector,
  GestureHandlerRootView,
  Gesture,
} from 'react-native-gesture-handler';
import Image from 'react-native-fast-image';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
} from '../../../common/constants';
import ZButton from '../../../components/common/ZButton';
import {useSelector} from 'react-redux';
import {VideoItem} from './VideoItem';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import LinearGradient from 'react-native-linear-gradient';
import images from '../../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import request from '../../../api/request';
import {useQuery} from 'react-query';
import millify from 'millify';
import pluralize from 'pluralize';
import {useNavigation} from '@react-navigation/native';
import Video from 'react-native-fast-video';
import Slider from '@react-native-community/slider';
import Share from 'react-native-share';

const ReelComponent = ({
  item,
  layoutHeight,
  keyPrefix,
  index,
  data,
  onPressProfile,
  activeVideoIndex,
  pausedVideos,
  togglePause,
  likeRef,
  onPressMore,
  onPressAvailableLocation,
  onPressComment,
  isLike,
  onPressLike,
  setIsLike,
  extraData,
  flatListRef,
  setExtraData,
  videoError,
  tabIndex,
  tabIndexDefault,
  onPressReport,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const isFocused = tabIndex === tabIndexDefault;

  const [isBuffering, setIsBuffering] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const videoRef = useRef();
  const navigation = useNavigation();
  const [durationInSeconds, setDurationInSeconds] = useState(0); // Added state for durationInSeconds

  const [paused, setpaused] = useState(false);
  const onBuffer = ({isBuffering: Buffering}) => {
    if (Buffering) {
      // Show buffering indicator or perform other actions
      setIsBuffering(true);
    } else {
      // Buffering completed or resumed
      setIsBuffering(false);
    }
  };

  const generateDynamicLink = async postItem => {
    const link = await dynamicLinks().buildShortLink(
      {
        link: `http://thefoodtok.com/post/${postItem?._id}`, // The link where the user should be directed when the dynamic link is clicked
        domainUriPrefix: 'https://foodtok.page.link', // Your Dynamic Links domain prefix
        android: {
          packageName: 'com.foodtok', // Your Android package name
        },
        ios: {
          bundleId: 'com.foodtok', // Your iOS bundle ID
        },
        social: {
          title: postItem?.title,
          description: 'Check my post on FoodTok', // Optional description
        },
      },
      dynamicLinks.ShortLinkType.UNGUESSABLE,
    );

    console.log('Generated dynamic link:', decodeURIComponent(link));
    return decodeURIComponent(link);
    // You can use this 'link' to share with users, send in emails, or use it to navigate users to the post directly.
  };

  const handleShare = async Postitem => {
    const link = await generateDynamicLink(Postitem);

    const shareOptions = {
      title: 'Share via',
      // message: 'hi',
      url: link,
      // social: Share.Social.WHATSAPP,
      // whatsAppNumber: '9199999999', // country code + phone number
    };

    Share.open(shareOptions)
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        err && console.log(err);
      });
  };
  const fetchCommentsCount = async () => {
    const response = await request.get(`/comment/count?post_id=${item?._id}`);
    return response.data;
  };

  const {data: commentsCount} = useQuery(
    ['commentsCount' + item?._id],
    () => fetchCommentsCount(item?._id),
    {
      skip: item?._id === undefined,
    },
  );

  const duration = item?.duration?.split(' ');

  const debouncedOnProgress = ({currentTime}) => {
    if (!paused) {
      setSeekValue(currentTime);
    } else {
      setSeekValue(seekValue);
    }
  };

  useEffect(() => {
    let timeout;

    if (isFocused && index === activeVideoIndex && !!item.avatarUri) {
      timeout = setTimeout(() => {
        flatListRef.current.scrollToIndex({
          animated: true,
          index: index + 1,
        });
      }, 60000); // 1 minute

      return () => clearTimeout(timeout);
    }
  }, [isFocused, index, activeVideoIndex, flatListRef]);

  const handlePressProfile = () =>
    onPressProfile(item?.channelName, item?.avatarUri, item?.author?._id);

  return (
    <GestureHandlerRootView
      key={keyPrefix}
      style={{
        height: layoutHeight,
        backgroundColor: colors.backgroundColor,
      }}>
      <GestureDetector
        gesture={Gesture.Tap()
          .numberOfTaps(2)
          .onStart(() => {
            likeRef?.current?.[index]?.(item?._id);
          })}>
        <Pressable onPress={() => togglePause(index)}>
          {item?.avatarUri && (
            <Image
              source={{uri: item?.avatarUri}}
              resizeMode="cover"
              style={[
                localStyles.imageContainer,
                {backgroundColor: colors.backgroundColor},
              ]}
            />
          )}
          {!item.avatarUri && (
            <Video
              source={{
                uri: item?.uri,
              }}
              ref={videoRef}
              onLoad={({duration}) => setDurationInSeconds(duration)}
              onEnd={() => {
                if (activeVideoIndex === index) {
                  flatListRef.current.scrollToIndex({
                    animated: true,
                    index: index + 1,
                  });
                }
              }}
              style={[
                localStyles.imageContainer,
                {
                  backgroundColor: colors.backgroundColor,
                  maxHeight: '98%',
                },
              ]}
              onProgress={debouncedOnProgress}
              onBuffer={onBuffer}
              poster={item?.avatarUri || item?.poster}
              posterResizeMode="cover"
              resizeMode="cover"
              repeat={true}
              navigstor={navigation}
              onError={videoError}
              seekColor={colors.primary}
              paused={
                activeVideoIndex !== index ||
                !isFocused ||
                pausedVideos.includes(index) ||
                paused
              }
            />
          )}

          <LinearGradient
            key={`item-${item?._id}`}
            colors={['transparent', 'rgba(0, 0, 0, 1)']}
            style={localStyles.bottomContainer}>
            <View style={styles.flex}>
              <View style={styles.rowCenter}>
                <TouchableOpacity
                  onPress={handlePressProfile}
                  style={styles.mb10}>
                  <Image
                    resizeMode="cover"
                    source={
                      item?.author?.avatar
                        ? {uri: item?.author?.avatar}
                        : colors.dark
                        ? images.userDark
                        : images.userLight
                    }
                    style={localStyles.userImage}
                  />
                </TouchableOpacity>
                <View style={[styles.mh20, styles.flex]}>
                  <ZText
                    onPress={() =>
                      onPressProfile(
                        item?.channelName,
                        item?.avatarUri,
                        item?.author?._id,
                      )
                    }
                    type="b18"
                    numberOfLines={1}
                    color={colors.white}>
                    {item?.author?.fullName}
                  </ZText>
                  <ZText
                    type="m12"
                    style={styles.mb5}
                    numberOfLines={1}
                    color={colors.white}>
                    {item?.created_at.slice(0, 10)}
                  </ZText>
                </View>
              </View>
              {item?.duration && (
                <ZText type="m12" color={colors.white}>
                  {`Can be received in ${
                    duration[0] +
                    ' ' +
                    pluralize(duration[1] || '', duration[0])
                  }`}
                </ZText>
              )}
              <ZText type="m14" color={colors.white}>
                {item.title}
              </ZText>
              <ZText type="m14" color={colors.white} style={styles.mv10}>
                {item?.caption?.length < 100
                  ? item?.caption
                  : item?.caption?.slice(0, 100) + '...'}
              </ZText>
              {item?.caption?.length > 100 && (
                <TouchableOpacity
                  onPress={() => onPressMore(item?.caption)}
                  style={styles.button}>
                  <ZText type="m14" color={colors.primary}>
                    {item?.caption?.length < 100 ? '' : 'See More Description'}
                  </ZText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  onPressAvailableLocation(item?.governorate, item?.areas)
                }
                style={styles.button}>
                <ZText type="m14" color={colors.primary} style={styles.mb20}>
                  Click to check Delivery Locations
                </ZText>
              </TouchableOpacity>
              {!item.avatarUri && (
                <View>
                  <Slider
                    style={localStyles.seekBar}
                    minimumValue={0}
                    tapToSeek
                    maximumValue={durationInSeconds}
                    value={seekValue}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.grey}
                    thumbTintColor={colors.primary}
                    onSlidingStart={() => {
                      setExtraData(!extraData);
                      setpaused(true);
                    }}
                    onSlidingComplete={value => {
                      videoRef.current.seek(value);
                      setSeekValue(value);
                      setTimeout(() => {
                        setpaused(false);
                      }, 400);
                    }}
                  />
                </View>
              )}
              {data?.data?.user?._id !== item?.author?._id &&
                item?.author?.type !== 'user' && (
                  <ZButton
                    title={`Buy this for ${item?.price} EGP`}
                    textType={'b18'}
                    color={colors.white}
                    containerStyle={localStyles.buttonContainer}
                    onPress={() =>
                      item?.linkToGo
                        ? Linking.openURL(
                            item?.linkToGo?.includes('http')
                              ? item?.linkToGo
                              : 'https://' + item?.linkToGo,
                          )
                        : Linking.openURL(
                            'whatsapp://send?text=' +
                              'Hi, I came from FoodTok app, and I want to buy this dish: ' +
                              item.caption +
                              '&phone=2' +
                              item?.author?.phone,
                          )
                    }
                  />
                )}
            </View>
            <View style={localStyles.verticalContainer}>
              <VideoItem
                icon="flag"
                size={moderateScale(24)}
                onPress={() => onPressReport(item)}
              />
              <VideoItem
                icon="heart"
                data={millify(item?.likesNo || 0)}
                initialIsLiked={item?.currentUserLiked}
                color={colors.primary}
                onPress={onPressLike}
                index={index}
                setIsLike={setIsLike}
                setExtraData={setExtraData}
                extraData={extraData}
                likeRef={likeRef}
                id={item?._id}
              />
              <VideoItem
                icon="chatbubble-ellipses"
                data={millify(commentsCount?.count || 0)}
                onPress={() => onPressComment(item?._id)}
              />
              <VideoItem icon="eye" data={millify(item?.views || 0)} />
              <VideoItem icon="share" onPress={() => handleShare(item)} />
            </View>
          </LinearGradient>
          {pausedVideos.includes(index) && !item?.avatarUri && (
            <View
              style={[
                localStyles.pauseIconContainer,
                pausedVideos.includes(index) && styles.p15,
              ]}>
              {pausedVideos.includes(index) && !item?.avatarUri && (
                <Entypo
                  name="triangle-right"
                  size={
                    pausedVideos.includes(index) && !item?.avatarUri
                      ? moderateScale(60)
                      : 0
                  }
                  color={'white'}
                />
              )}
            </View>
          )}
          <View style={[localStyles.likeIcon, isLike && styles.p15]}>
            {isLike && (
              <Ionicons
                name="heart"
                size={isLike ? moderateScale(120) : 0}
                color={'red'}
              />
            )}
          </View>
          {isBuffering && (
            <View style={localStyles.bufferingIndicator}>
              <ActivityIndicator size="large" color="gray" />
            </View>
          )}
        </Pressable>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default ReelComponent;

const localStyles = StyleSheet.create({
  imageContainer: {
    height: '100%',
    width: '100%',
  },
  playStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: getHeight(10),
    left: moderateScale(10),
  },
  bufferingIndicator: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(160),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteIcon: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(160),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(52, 52, 52, 0.4)',
  },
  likeIcon: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(160),
    ...styles.selfCenter,
  },
  topHeader: {
    position: 'absolute',
    top: isAndroid ? moderateScale(10) : moderateScale(50),
    left: moderateScale(20),
    right: 0,
    zIndex: 1,
    ...styles.pr10,
    ...styles.pt15,
  },
  headerContainer: {
    position: 'absolute',
    top: moderateScale(55),
    zIndex: 1,
    ...styles.ph20,
    ...styles.rowSpaceBetween,
  },
  headerInnerContainer: {
    ...styles.flex,
    ...styles.rowCenter,
  },
  headerCetegoryItemContainer: {
    ...styles.mh10,
    ...styles.pb15,
    borderBottomWidth: moderateScale(1),
  },
  buttonContainer: {
    height: getHeight(50),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '100%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    paddingVertical: 5,
    ...styles.ph20,
    ...styles.flexRow,
    ...styles.itemsEnd,
  },
  userImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  musicImage: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    ...styles.mr25,
  },
  musicIcon1: {
    position: 'absolute',
    width: moderateScale(16),
    height: moderateScale(16),
    left: moderateScale(25),
    bottom: moderateScale(35),
  },
  durationContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  pauseIconContainer: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(160),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(52, 52, 52, 0.4)',
  },
  musicContainer: {
    ...styles.rowCenter,
  },
  verticalContainer: {
    ...styles.ph5,
    ...styles.mb50,
    ...styles.pl10,
  },
  renderIconContainer: {
    ...styles.itemsCenter,
    ...styles.mt20,
  },
  seekBarContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  seekBar: {
    height: 40,
  },
});
