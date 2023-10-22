/* eslint-disable react-native/no-inline-styles */
import {
  I18nManager,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import strings from '../../../i18n/strings';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import {Image} from 'react-native';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
  screenHeight,
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
import {useMutation, useQuery} from 'react-query';
import millify from 'millify';
import pluralize from 'pluralize';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import Share from 'react-native-share';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {AdView} from './ads/AdView';
import DoubleClick from 'react-native-double-tap';

const ReelComponent = ({
  item,
  layoutHeight,
  i: index,
  data,
  activeVideoIndex,
  isloading,
  likeRef,
  onPressAvailableLocation,
  flatListRef,
  setSelectedPostId,
  commentSheetRef,
  setselectedDescription,
  descriptionSheetRef,
  isFocused,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [indexState] = useState(index);

  useEffect(() => {
    if (indexState !== index) {
      setSeekValueClick(0);
      setIsLike(false);
      setpaused({slider: false, paused: false});
    }
  }, [indexState, index]);

  const onPressComment = () => {
    setSelectedPostId(item?._id);
    commentSheetRef.current?.show();
  };

  const [seekValueClick, setSeekValueClick] = useState(0);
  const onPressMore = description => {
    setselectedDescription(description);
    descriptionSheetRef.current?.show();
  };

  const addLikeMutation = useMutation(postId =>
    request.post(`/like/${postId}`),
  );
  const removeLikeMutation = useMutation(postId =>
    request.delete(`/like/${postId}`),
  );
  const onPressReport = () => {
    navigation.navigate(StackNav.Report, {
      storyId: item?._id,
    });
  };
  const onPressLike = (id, isLiked) => {
    if (!isLiked) {
      setIsLike(true);
      setTimeout(() => {
        setIsLike(false);
      }, 1000);
      addLikeMutation.mutate(id);
    } else {
      removeLikeMutation.mutate(id);
    }
  };
  const navigation = useNavigation();

  const [isLike, setIsLike] = useState(false);
  const onPressProfile = (userName, userImage, id) => {
    if (id === data?.data?.user?._id) {
      navigation.navigate(TabNav.Profile);
    } else {
      navigation.navigate(StackNav.ProfileDetail, {
        userName: userName,
        userImage: userImage,
        id: id,
      });
    }
  };

  const videoRef = useRef();
  const [durationInSeconds, setDurationInSeconds] = useState(0); // Added state for durationInSeconds

  const [paused, setpaused] = useState({slider: true, paused: true});

  useEffect(() => {
    if (layoutHeight) {
      setTimeout(() => {
        setpaused({
          slider: false,
          paused: false,
        });
      }, 1000);
    }
  }, [layoutHeight]);

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

    return decodeURIComponent(link);
    // You can use this 'link' to share with users, send in emails, or use it to navigate users to the post directly.
  };

  const handleShare = async Postitem => {
    const link = await generateDynamicLink(Postitem);

    const shareOptions = {
      title: 'Share via',
      url: link,
    };

    Share.open(shareOptions).catch(err => {
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
      enabled: item?._id !== undefined && index === activeVideoIndex,
    },
  );

  const duration = item?.duration?.split(' ');

  useEffect(() => {
    let timeout;

    if (index === activeVideoIndex && !!item.avatarUri && isFocused) {
      timeout = setTimeout(() => {
        flatListRef.current.scrollToIndex({
          animated: true,
          index: index + 1,
        });
      }, 10000); // 0.5 minute
      return () => clearTimeout(timeout);
    }
  }, [isFocused, index, activeVideoIndex, flatListRef, item.avatarUri]);

  const handlePressProfile = () =>
    onPressProfile(item?.channelName, item?.avatarUri, item?.author?._id);

  const imageStyles = useMemo(
    () => [
      localStyles.imageContainer,
      {backgroundColor: colors.backgroundColor},
    ],
    [colors.backgroundColor],
  );

  const uri = item?.uri?.replace(
    'https://foodtokforever.s3.amazonaws.com',
    'https://d1wfcrbbkg3bzd.cloudfront.net',
  );

  const poster =
    item?.avatarUri?.replace(
      'https://foodtokforever.s3.amazonaws.com',
      'https://d1wfcrbbkg3bzd.cloudfront.net',
    ) ||
    item?.poster?.replace(
      'https://foodtokforever.s3.amazonaws.com',
      'https://d1wfcrbbkg3bzd.cloudfront.net',
    );

  const handleOnLoad = useCallback(
    ({duration: durationToBeSet}) => {
      setDurationInSeconds(durationToBeSet);
      if (activeVideoIndex === index) {
        videoRef?.current?.seek?.(seekValueClick);
      } else {
        // console.log('on load not active video ', index);
      }
    },
    [activeVideoIndex, index, seekValueClick],
  );

  const onProgress = ({currentTime}) => {
    if ((!paused.slider || !paused.pause) && activeVideoIndex === index) {
      setSeekValueClick(currentTime);
    }
  };

  return (
    <View>
      {item?.type !== 'ad' ? (
        <View
          style={{
            height: layoutHeight || screenHeight,
            backgroundColor: colors.backgroundColor,
          }}>
          <DoubleClick
            singleTap={() => {
              setpaused(p => ({
                slider: p.slider,
                paused: !p.paused,
              }));
            }}
            doubleTap={() => {
              likeRef?.current?.[index]?.(item?._id);
            }}>
            {item?.avatarUri ? (
              <FastImage
                source={{
                  uri: poster,
                }}
                resizeMode="contain"
                style={imageStyles}
              />
            ) : !!item?.uri &&
              (activeVideoIndex === index ||
                activeVideoIndex === index + 1 ||
                activeVideoIndex === index - 1) &&
              isFocused ? (
              <>
                <Video
                  source={{
                    uri,
                  }}
                  onSeek={({currentTime}) => {
                    setSeekValueClick(currentTime);
                  }}
                  ref={videoRef}
                  onProgress={onProgress}
                  hideShutterView
                  onLoad={handleOnLoad}
                  onEnd={() => {
                    if (activeVideoIndex === index && isFocused) {
                      if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({
                          animated: true,
                          index: index + 1,
                        });
                        setTimeout(() => {
                          videoRef?.current?.seek?.(0);
                        }, 100);
                      }
                    }
                  }}
                  style={[
                    localStyles.imageContainer,
                    {
                      backgroundColor: colors.backgroundColor,
                    },
                  ]}
                  poster={poster}
                  posterResizeMode="cover"
                  resizeMode="cover"
                  playInBackground={false}
                  disableFocus={true}
                  onError={err => console.log('hello', err)}
                  seekColor={colors.primary}
                  muted={!isFocused}
                  paused={
                    activeVideoIndex !== index ||
                    !isFocused ||
                    paused.paused ||
                    paused.slider ||
                    isloading
                  }
                  useTextureView={true}
                />
              </>
            ) : (
              <Image
                source={{
                  uri: poster,
                }}
                resizeMode="cover"
                blurRadius={2}
                style={imageStyles}
              />
            )}

            <LinearGradient
              key={`item-${item?._id}`}
              colors={['rgba(0, 0, 0, 0.01)', 'rgba(0, 0, 0, 1)']}
              style={localStyles.bottomContainer}>
              <View style={styles.flex}>
                <View style={styles.rowCenter}>
                  <TouchableOpacity onPress={handlePressProfile}>
                    <Image
                      resizeMode="cover"
                      source={
                        item?.author?.avatar || data?.avatar
                          ? {uri: item?.author?.avatar || data?.avatar}
                          : colors.dark
                          ? images.userDark
                          : images.userLight
                      }
                      style={localStyles.userImage}
                    />
                  </TouchableOpacity>
                  <View style={[styles.m10, styles.flex]}>
                    <TouchableOpacity
                      style={{
                        maxWidth: moderateScale(200),
                      }}
                      onPress={() =>
                        onPressProfile(
                          item?.channelName,
                          item?.avatarUri,
                          item?.author?._id,
                        )
                      }>
                      <ZText
                        style={localStyles.bold}
                        type="b15"
                        numberOfLines={1}
                        color={colors.white}>
                        {item?.author?.fullName || data?.fullName}
                      </ZText>
                      <View />
                    </TouchableOpacity>

                    <ZText
                      type="m12"
                      style={styles.mb5}
                      numberOfLines={1}
                      color={colors.white}>
                      {item?.created_at?.slice(0, 10)}
                    </ZText>
                  </View>
                </View>
                {duration?.[0] !== 'undefined' && (
                  <ZText type="m12" color={colors.white}>
                    {`${
                      strings.canBeReceivedIn +
                      duration?.[0] +
                      ' ' +
                      (I18nManager.isRTL
                        ? duration?.[1] === 'Hours'
                          ? duration?.[0] > 1
                            ? 'ساعات'
                            : 'ساعة'
                          : duration?.[0] > 1
                          ? 'ايام'
                          : 'يوم'
                        : pluralize?.(
                            duration?.[1] || '',
                            Number(duration?.[0]),
                          ))
                    }`}
                  </ZText>
                )}
                <ZText
                  style={localStyles.bold}
                  align="left"
                  type="b15"
                  color={colors.white}>
                  {item.title}
                </ZText>
                <ZText type="m13" color={colors.white} style={styles.mv10}>
                  {item?.caption?.length < 50
                    ? item?.caption
                    : item?.caption?.slice(0, 50) + '...'}
                </ZText>
                {item?.caption?.length > 50 && (
                  <TouchableOpacity
                    onPress={() => onPressMore(item?.caption)}
                    style={styles.button}>
                    <ZText type="m14" color={colors.primary}>
                      {item?.caption?.length < 50
                        ? ''
                        : strings.seeMoreDescription}
                    </ZText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    onPressAvailableLocation(item?.author?.locations);
                  }}
                  style={styles.button}>
                  <ZText type="m14" color={colors.primary} style={styles.mb10}>
                    {item?.kmAway
                      ? strings.nearestBranch +
                        item?.kmAway?.toFixed(2) +
                        strings.kmAway
                      : strings.clickbranches}
                  </ZText>
                </TouchableOpacity>
                {!item.avatarUri && (
                  <View
                    style={{
                      direction: 'ltr',
                      ...(I18nManager.isRTL &&
                        Platform.OS === 'ios' && {transform: [{scaleX: -1}]}),
                    }}>
                    <Slider
                      style={localStyles.seekBar}
                      minimumValue={0}
                      tapToSeek
                      maximumValue={durationInSeconds}
                      value={seekValueClick}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.grey}
                      thumbTintColor={colors.primary}
                      onSlidingComplete={value => {
                        if (activeVideoIndex === index) {
                          videoRef?.current?.seek?.(value);
                          setSeekValueClick(value);
                        }
                      }}
                    />
                  </View>
                )}
                {data?.data?.user?._id !== item?.author?._id &&
                  item?.author?.type !== 'user' && (
                    <ZButton
                      title={
                        item?.price
                          ? `${strings.buyThisFor} ${item?.price} ${strings.EGP}`
                          : strings.inquireDish
                      }
                      textType={'b18'}
                      color={colors.white}
                      containerStyle={localStyles.buttonContainer}
                      onPress={async () => {
                        const link = await generateDynamicLink(item);
                        item?.linkToGo
                          ? Linking.openURL(
                              item?.linkToGo?.includes('http') ||
                                item?.linkToGo
                                  ?.toLocaleLowerCase()
                                  ?.includes('wwww')
                                ? item?.linkToGo
                                : 'https://' + item?.linkToGo,
                            )
                          : Linking.openURL(
                              'whatsapp://send?text=' +
                                'Hi, I came from FoodTok app, and I want to buy this dish: ' +
                                item.title +
                                '\n' +
                                link +
                                '&phone=2' +
                                item?.author?.phone,
                            );
                      }}
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
            {paused.paused && !paused.slider && !item?.avatarUri && (
              <View
                style={[
                  localStyles.pauseIconContainer,
                  paused.paused && styles.p15,
                ]}>
                <Entypo
                  name="triangle-right"
                  size={paused && !item?.avatarUri ? moderateScale(60) : 0}
                  color={'white'}
                />
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
          </DoubleClick>
        </View>
      ) : (
        <>
          {item?.type === 'ad' &&
            activeVideoIndex !== 0 &&
            activeVideoIndex !== undefined && (
              <AdView
                loadOnMount={false}
                layoutHeight={layoutHeight || screenHeight}
                type="video"
                media
              />
            )}
        </>
      )}
    </View>
  );
};

export default React.memo(ReelComponent);

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
    top: screenFullHeight / 2 - moderateScale(110),
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
    ...styles.pr10,
    ...styles.pt15,
  },
  // Style for the blur overlay
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }, // Style for the blur overlay
  headerContainer: {
    position: 'absolute',
    top: moderateScale(55),
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
  bold: {
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    paddingVertical: 20,
    ...styles.ph20,
    ...styles.flexRow,
    ...styles.itemsEnd,
  },
  userImage: {
    width: moderateScale(40),
    height: moderateScale(40),
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
    top: screenFullHeight / 2 - moderateScale(110),
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
  seekBar: {
    height: 40,
  },
});
