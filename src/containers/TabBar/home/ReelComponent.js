import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  I18nManager,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
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
import {useMutation, useQuery, useQueryClient} from 'react-query';
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
import {useAnalytics} from '@segment/analytics-react-native';
import AttachedDishesDisplay from '../../../components/common/AttachedDishesDisplay';
import DeepLinkingService from '../../../services/DeepLinkingService';
import ImageZoomModal from '../../../components/common/ImageZoomModal';
import strings from '../../../i18n/strings';

const ReelComponent = ({
  item,
  layoutHeight,
  i: index,
  data,
  activeVideoIndex,
  // isloading,
  likeRef,
  flatListRef,
  isFromReelsOne,
  setSelectedPostId,
  commentSheetRef,
  setselectedDescription,
  descriptionSheetRef,
  isFocused,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [indexState] = useState(index);
  const queryClient = useQueryClient();
  const [isMoreDescriptionSeen, setIsMoreDescriptionSeen] = useState(false);
  const {track} = useAnalytics();
  const onPressComment = () => {
    setSelectedPostId(item?._id);
    commentSheetRef.current?.show();
  };
  useEffect(() => {
    if (indexState !== index) {
      setSeekValueClick(0);
      setIsLike(false);
      setIsMoreDescriptionSeen(false);
      setpaused({slider: false, paused: false});
    }
  }, [indexState, index]);

  // Pulse animation for review badge
  useEffect(() => {
    if (item?.reviewMode && activeVideoIndex === index) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    }
  }, [item?.reviewMode, activeVideoIndex, index, pulseAnim]);

  const [seekValueClick, setSeekValueClick] = useState(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  
  // Animation for review badge pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Add new animation for header entrance
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerOpacityAnim = useRef(new Animated.Value(0)).current;

  // Add animation for header entrance effect
  useEffect(() => {
    if (activeVideoIndex === index) {
      Animated.parallel([
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeVideoIndex, index]);

  const onPressMore = () => {
    setIsMoreDescriptionSeen(true);
  };
  const onPressLess = () => {
    setIsMoreDescriptionSeen(false);
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
    if (isFromReelsOne) {
      queryClient.invalidateQueries({queryKey: 'stories'});
      queryClient.invalidateQueries({queryKey: 'stories_following'});
    }
  };
  const navigation = useNavigation();

  const [isLike, setIsLike] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  
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
  const [durationInSeconds, setDurationInSeconds] = useState(0);

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
    const shareableLinks = DeepLinkingService.generateShareableLink('reel', postItem?._id, {
      title: postItem?.title,
      caption: postItem?.caption,
      author: postItem?.author?.fullName,
      utm_source: 'app_share',
      utm_medium: 'reel_share'
    });

    return shareableLinks.universalLink;
  };

  const handleShare = async Postitem => {
    const link = await generateDynamicLink(Postitem);

    const shareOptions = {
      title: 'Share via',
      url: link,
    };

    Share.open(shareOptions).catch(err => {
      err && (() => {})();
    });
  };

  const handleContactPress = async () => {
    const link = await generateDynamicLink(item);
    const withCoupon = item?.author?.discount
      ? 'with coupon ' + item?.author?.discount?.coupon
      : '';

    await track('contactButton', {
      userId: data?.data?.user?._id,
      itemId: item?._id,
      title: item?.title,
      description: item?.caption,
      link: item?.linkToGo || item?.author?.phone,
    });

    item?.linkToGo
      ? Linking.openURL(
          item?.linkToGo?.includes('http') ||
            item?.linkToGo?.toLocaleLowerCase()?.includes('wwww')
            ? item?.linkToGo
            : 'https://' + item?.linkToGo,
        )
      : Linking.openURL(
          'whatsapp://send?text=' +
            'Hi, I am redirected from food2k.com, and I want to ask about: ' +
            item.title +
            ' ' +
            withCoupon +
            '\n' +
            link +
            '\n' +
            '&phone=2' +
            item?.author?.phone,
        );
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
      }, 10000);
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
      }
    },
    [activeVideoIndex, index, seekValueClick],
  );

  const onProgress = ({currentTime}) => {
    if ((!paused.slider || !paused.pause) && activeVideoIndex === index) {
      setSeekValueClick(currentTime);
    }
  };

  const maxDiscount = item?.author?.discount?.maxAmount
    ? strings.max + ' ' + item?.author?.discount?.maxAmount + ' ' + strings.EGP
    : '';

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
            }}
            onPressOut={()=>{
              setIsOverlayVisible(true)
            }}
            onLongPress={() => {
              setIsOverlayVisible(false);
            }}>
            {/* Review Badge - positioned at top right */}
            {item?.reviewMode && (
              <>
                {/* Review Glow Effect */}
                <View style={localStyles.reviewGlowEffect} />
                
                <Animated.View 
                  style={[
                    localStyles.reviewBadge,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255, 215, 0, 0.95)', 'rgba(255, 77, 103, 0.95)', 'rgba(138, 43, 226, 0.9)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={localStyles.reviewBadgeGradient}
                  >
                    <View style={localStyles.reviewBadgeGlass}>
                      <View style={localStyles.reviewBadgeContent}>
                        <Ionicons name="star" size={moderateScale(12)} color="#FFD700" />
                        <ZText type="B10" color="#FFFFFF" style={[styles.ml2, localStyles.reviewBadgeText]}>
                          REVIEW
                        </ZText>
                      </View>
                      {item?.rating && (
                        <View style={localStyles.ratingBadge}>
                          <ZText type="B13" color="#FFFFFF" style={localStyles.ratingText}>
                            {item.rating}/5
                          </ZText>
                          <View style={localStyles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={item.rating && item.rating > 0 
                                  ? (star <= item.rating ? 'star' : 'star-outline')
                                  : 'star'
                                }
                                size={moderateScale(10)}
                                color={item.rating && item.rating > 0 
                                  ? (star <= item.rating ? '#FFD700' : 'rgba(255, 255, 255, 0.6)')
                                  : 'rgba(255, 255, 255, 0.3)'
                                }
                                style={[
                                  localStyles.starIcon,
                                  { opacity: item.rating && item.rating > 0 ? 1 : 0.4 }
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </Animated.View>
              </>
            )}

            {item?.avatarUri ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowImageZoom(true)}
                style={imageStyles}>
                <FastImage
                  source={{
                    uri: poster,
                  }}
                  resizeMode="contain"
                  style={imageStyles}
                />
                {/* Zoom indicator */}
                <View style={localStyles.zoomIndicator}>
                  <Ionicons
                    name="expand-outline"
                    size={moderateScale(20)}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                </View>
              </TouchableOpacity>
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
                  onError={error => {

                  }}
                  seekColor={colors.primary}
                  muted={!isFocused}
                  paused={
                    activeVideoIndex !== index ||
                    !isFocused ||
                    paused.paused ||
                    paused.slider
                    // isloading
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

            {/* Attached Dishes Display - positioned above the action icons */}
            {isOverlayVisible && item?.dishes && item.dishes.length > 0 && (
              <AttachedDishesDisplay
                attachedDishes={item.dishes}
                showPrices={true}
                compact={true}
                chefId={item?.author?._id}
                chefName={item?.author?.fullName}
                containerStyle={localStyles.dishesDisplayContainer}
              />
            )}
            
            {/* Debug: Log item data to see if dishes are present */}



            {isOverlayVisible && (
              <View
                key={`item-${item?._id}`}
                style={localStyles.bottomContainer}>
                
                {/* Stronger gradient for text readability */}
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.85)']}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 250,
                  }}
                />
                <View style={styles.flex}>
                  <Animated.View
                    style={[
                      localStyles.headerContainer,
                      {
                        transform: [{translateY: headerSlideAnim}],
                        opacity: headerOpacityAnim,
                      },
                    ]}>
                    <View style={localStyles.headerInnerContainer}>
                      <TouchableOpacity onPress={handlePressProfile}>
                        <Image
                          resizeMode="cover"
                          source={
                            item?.author?.avatar
                              ? {uri: item?.author?.avatar}
                              : colors.dark
                              ? images.userDark
                              : images.userLight
                          }
                                                      style={{
                              width: 42,
                              height: 42,
                              borderRadius: 21,
                              borderWidth: 2,
                              borderColor: 'white',
                            }}
                        />
                      </TouchableOpacity>
                                            <TouchableOpacity
                        style={{marginLeft: 4, flex: 1}}
                        onPress={() =>
                          onPressProfile(
                            item?.channelName,
                            item?.avatarUri,
                            item?.author?._id,
                          )
                        }>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                          <ZText
                            style={{
                              fontSize: 12,
                              fontWeight: 'bold',
                              color: 'white',
                              textShadowColor: 'rgba(0, 0, 0, 0.9)',
                              textShadowOffset: {width: 1, height: 1},
                              textShadowRadius: 3,
                              flex: 1,
                            }}
                            numberOfLines={1}>
                            {item?.author?.fullName || data?.fullName}
                          </ZText>
                          {/* Debug: Show rating data and always render something */}

                          {item?.author?.ratedDishesCount > 0 && item?.author?.averageDishRating > 0 ? (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 8}}>
                              <ZText style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                color: '#FFD700',
                                textShadowColor: 'rgba(0, 0, 0, 0.9)',
                                textShadowOffset: {width: 1, height: 1},
                                textShadowRadius: 2,
                              }}>
                                {item.author.averageDishRating.toFixed(1)}
                              </ZText>
                              <ZText style={{
                                fontSize: 10,
                                color: 'white',
                                textShadowColor: 'rgba(0, 0, 0, 0.9)',
                                textShadowOffset: {width: 1, height: 1},
                                textShadowRadius: 2,
                                marginLeft: 2,
                              }}>
                                ⭐
                              </ZText>
                            </View>
                          ) : (
                            <ZText style={{
                              fontSize: 12,
                              color: '#FFD700',
                              textShadowColor: 'rgba(0, 0, 0, 0.9)',
                              textShadowOffset: {width: 1, height: 1},
                              textShadowRadius: 2,
                              marginLeft: 8,
                              fontWeight: 'bold',
                            }}>
                              -
                            </ZText>
                          )}
                        </View>
                      </TouchableOpacity>
                                        </View>
                    
                    <ZText
                      style={{
                        fontSize: 13,
                        color: 'white',
                        marginTop: 4,
                        lineHeight: 18,
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: {width: 1, height: 1},
                        textShadowRadius: 2,
                      }}
                      numberOfLines={2}>
                      {item?.title || 'Perfect lunch for today ☀️'}
                    </ZText>
                    
                    {duration?.[0] && duration?.[0] !== 'undefined' && duration?.[0] !== undefined && (
                      <ZText
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginTop: 6,
                          textShadowColor: 'rgba(0, 0, 0, 0.8)',
                          textShadowOffset: {width: 1, height: 1},
                          textShadowRadius: 2,
                        }}>
                        ⏰ Receivable in {duration?.[0]} {duration?.[1]?.toLowerCase()}
                      </ZText>
                    )}
                    <ZText
                      style={localStyles.bold}
                      align="left"
                      type="b12"
                      color={colors.white}>
                      {item.title}
                    </ZText>
                    
                    {/* Review-specific info */}
                    {item?.reviewMode && (
                      <View style={localStyles.reviewInfo}>
                        <View style={localStyles.reviewRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={item?.rating && item.rating > 0 
                                ? (star <= item.rating ? 'star' : 'star-outline')
                                : 'star'
                              }
                              size={moderateScale(12)}
                              color={item?.rating && item.rating > 0 
                                ? (star <= item.rating ? '#FFD700' : 'rgba(255, 255, 255, 0.5)')
                                : 'rgba(255, 255, 255, 0.3)'
                              }
                              style={[
                                styles.mr2,
                                { opacity: item?.rating && item.rating > 0 ? 1 : 0.4 }
                              ]}
                            />
                          ))}
                          <ZText type="B12" color={colors.white} style={styles.ml4}>
                            {item.rating}/5
                          </ZText>
                        </View>
                      </View>
                    )}
                    <ZText type="m13" color={colors.white} style={styles.mv10}>
                      {item?.caption?.length < 50 || isMoreDescriptionSeen
                        ? item?.caption
                        : item?.caption?.slice(0, 50) + '...'}
                    </ZText>
                    {item?.caption?.length > 50 && (
                      <TouchableOpacity
                        onPress={isMoreDescriptionSeen ? onPressLess : onPressMore}
                        style={localStyles.button}>
                        <ZText type="m14" color={colors.primary}>
                          {item?.caption?.length < 50
                            ? ''
                            : isMoreDescriptionSeen
                            ? strings.seeLessDescription
                            : strings.seeMoreDescription}
                        </ZText>
                      </TouchableOpacity>
                    )}

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
                    {/* Debug logging for author type */}

                    
                    {/* Show Visit Menu button for chefs or users with menus */}
                    {(item?.author?.type === 'chef' || item?.author?.hasMenu === true) && (
                        <ZButton
                          title="Visit Menu"
                          textType={'b18'}
                          color={colors.white}
                          containerStyle={localStyles.buttonContainer}
                          onPress={() => {
                            navigation.navigate(StackNav.ChefMenu, {
                              chefId: item?.author?._id,
                              chefName: item?.author?.fullName,
                            });
                          }}
                        />
                      )}
                  </Animated.View>
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
              </View>
            )}

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
          {/* {item?.type === 'ad' &&
            activeVideoIndex !== 0 &&
            activeVideoIndex !== undefined && (
              <AdView
                loadOnMount={false}
                layoutHeight={layoutHeight || screenHeight}
                type="video"
                media
              />
            )} */}
        </>
      )}
      
      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={showImageZoom}
        imageUri={poster}
        onClose={() => setShowImageZoom(false)}
      />
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
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    bottom: moderateScale(50),
    left: 16,
    right: 16,
  },
  headerInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCetegoryItemContainer: {
    ...styles.mh10,
    ...styles.pb15,
    borderBottomWidth: moderateScale(1),
  },
  buttonContainer: {
    height: getHeight(50),
                      borderRadius: moderateScale(20),
    width: '100%',
    alignSelf: 'center',
  },
  button: {
    paddingBottom: 8,
    borderRadius: 5,
    justifyContent: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    paddingHorizontal: 8,
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
  zoomIndicator: {
    position: 'absolute',
    top: 80, // Below header area
    left: 15, // Move to left side to avoid filter icon
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 5,
    zIndex: 1,
  },
  verticalContainer: {
    ...styles.ph5,
    ...styles.mb50,
    ...styles.pl5,
  },
  renderIconContainer: {
    ...styles.itemsCenter,
    ...styles.mt20,
  },
  seekBar: {
    height: 40,
  },
  dishesDisplayContainer: {
    position: 'absolute',
    bottom: moderateScale(450), // Positioned much much higher above the action icons
    right: moderateScale(16), // Aligned with action icons on the right
    zIndex: 5, // Lower z-index to ensure it doesn't interfere with other UI
  },
  reviewBadge: {
    position: 'absolute',
    top: moderateScale(16),
    right: moderateScale(14),
    zIndex: 10,
  },
  reviewBadgeGradient: {
    flex: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewBadgeGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  reviewBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(1),
  },
  reviewBadgeText: {
    fontWeight: 'bold',
  },
  ratingBadge: {
    alignItems: 'center',
  },
  ratingText: {
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: moderateScale(2),
  },
  starIcon: {
    marginHorizontal: moderateScale(2),
  },
  reviewGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Background color for shadow efficiency
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewInfo: {
    marginTop: moderateScale(8),
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
