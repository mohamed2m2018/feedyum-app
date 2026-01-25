import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Image } from 'react-native';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
} from '../../../common/constants';
import ZButton from '../../../components/common/ZButton';
import { useSelector } from 'react-redux';
import { VideoItem } from './VideoItem';
import ZText from '../../../components/common/ZText';
import { styles } from '../../../themes';
import LinearGradient from 'react-native-linear-gradient';
import images from '../../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import request from '../../../api/request';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import millify from 'millify';
import Video from 'react-native-video';
import VideoSeeker from '../../../components/common/VideoSeeker';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import DoubleClick from 'react-native-double-tap';
import { useAnalytics } from '@segment/analytics-react-native';
import AttachedDishesDisplay from '../../../components/common/AttachedDishesDisplay';
import DeepLinkingService from '../../../services/DeepLinkingService';
import ImageZoomModal from '../../../components/common/ImageZoomModal';
import ShareOptionsSheet from '../../../components/models/ShareOptionsSheet';
import strings from '../../../i18n/strings';
import { getCachedVideoPath, initCache } from '../../../services/VideoCacheService';
import FollowButton from '../../../components/common/FollowButton';
import { useEngagementTracking } from '../../../hooks/useEngagementTracking';

// Helper function to check if a URI is a video URL
// S3 uploads from our app are videos, so we trust them unless they're obviously images
const isVideoUri = (uri) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') return false;

  const lowerUri = uri.toLowerCase();

  // Check for image hosting patterns that should NEVER be treated as video
  const imageHostPatterns = [
    'loremflickr.com',
    'unsplash.com',
    'images.unsplash',
    'placeholder.com',
    'picsum.photos',
  ];
  if (imageHostPatterns.some(pattern => lowerUri.includes(pattern))) return false;

  // Check for image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExtensions.some(ext => lowerUri.includes(ext))) return false;

  // If we get here and the URI is non-empty, treat it as video
  // This covers: S3 uploads, mixkit, cloudfront, and any video extensions
  return true;
};



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
  isFocused,
  isCommentOpen,
  isLocationOpen,
  setIsCommentOpen,
  onPressAvailableLocation,
}) => {
  const colors = useSelector(state => state.theme.theme);

  // Get current user to prevent self-following in feed
  const { data: currentUserData } = useQuery(
    'user',
    () => request.get('/user'),
    { retry: 1, staleTime: 60000 },
  );
  const currentUserId = currentUserData?.data?.user?._id;

  // Ref for tracking video progress (used by handleOnLoad for seek position)
  const seekProgressRef = useRef(0);
  const [indexState] = useState(index);
  const queryClient = useQueryClient();
  const [isMoreDescriptionSeen, setIsMoreDescriptionSeen] = useState(false);
  const { track } = useAnalytics();
  const onPressComment = () => {
    setSelectedPostId(item?._id);
    if (setIsCommentOpen) setIsCommentOpen(true);
    commentSheetRef.current?.show();
  };
  useEffect(() => {
    if (indexState !== index) {
      // Don't reset seekValueClick to 0 - let onProgress handle position
      // This prevents the flickering from 0 -> current position
      setIsLike(false);
      setIsMoreDescriptionSeen(false);
      setpaused({ slider: false, paused: false });
    }
  }, [indexState, index]);

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

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
    // NOTE: Removed story invalidations - likes are optimistic and don't need feed refetch
  };
  const navigation = useNavigation();

  const [isLike, setIsLike] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const shareSheetRef = useRef(null);
  const [shareItem, setShareItem] = useState(null);

  const onPressProfile = (userName, userImage, id, authorType) => {
    if (id === data?.data?.user?._id) {
      navigation.navigate(TabNav.Profile);
    } else if (authorType === 'chef') {
      // Navigate to ChefMenu for chef profiles
      navigation.navigate(StackNav.ChefMenu, {
        chefId: id,
        chefName: userName,
      });
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
  const [currentTime, setCurrentTime] = useState(0);

  // Start paused=false immediately for active video - no delay needed
  // The video component's paused prop already handles play/pause based on activeVideoIndex
  const [paused, setpaused] = useState({ slider: false, paused: false });

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
    setShareItem(Postitem);
    shareSheetRef.current?.show();
    // Track share for algorithm
    trackShare();
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

  const { data: commentsCount } = useQuery(
    ['commentsCount' + item?._id],
    () => fetchCommentsCount(item?._id),
    {
      enabled: item?._id !== undefined && index === activeVideoIndex,
    },
  );

  const duration = item?.duration?.split(' ');

  // Auto-scroll for IMAGE posts only (no video) - after 10 seconds
  // This should NOT run for video posts - video scroll is handled by onEnd
  const isImageOnlyPost = !item?.uri || !isVideoUri(item?.uri);

  // Track image view time for engagement
  const imageViewStartRef = useRef(null);

  useEffect(() => {
    let timeout;

    // Only auto-scroll for IMAGE posts, NOT videos
    // Also block if seeking, comment open, location open, or image zoom
    if (index === activeVideoIndex && isImageOnlyPost && isFocused && !isCommentOpen && !isLocationOpen && !showImageZoom && !paused.slider) {
      console.log('Auto-scroll for IMAGE EFFECT START. index:', index);

      // Track image view start time
      imageViewStartRef.current = Date.now();

      timeout = setTimeout(() => {
        try {
          // Track completion before scrolling (10 seconds = 100% completion for images)
          const viewTime = (Date.now() - (imageViewStartRef.current || Date.now())) / 1000;
          trackProgress(viewTime);
          trackComplete();

          flatListRef.current.scrollToIndex({
            animated: true,
            index: index + 1,
          });
          console.log('Auto-scroll for IMAGE SCROLL CALLED');
        } catch (e) {
          console.log('Reached last item, cannot auto-scroll');
        }
      }, 10000);
      return () => {
        // Track partial view time when user scrolls away early
        if (imageViewStartRef.current) {
          const viewTime = (Date.now() - imageViewStartRef.current) / 1000;
          if (viewTime >= 2) { // Only track if viewed for at least 2 seconds
            trackProgress(viewTime);
          }
        }
        console.log('Auto-scroll for IMAGE EFFECT CLEANUP. index:', index);
        clearTimeout(timeout);
      };
    }
  }, [isFocused, index, activeVideoIndex, flatListRef, isImageOnlyPost, isCommentOpen, isLocationOpen, showImageZoom, paused.slider, trackProgress, trackComplete]);

  const handlePressProfile = () => {
    // Navigate to author's profile, not the current user's profile unless they match
    // Correctly using author._id from the item
    onPressProfile(item?.channelName, item?.avatarUri, item?.author?._id, item?.author?.type);
  };

  // Handle click on the reviewed restaurant/place badge in review reels
  // If registered chef -> navigate to ChefMenu
  // If external restaurant (Google place) -> open in Google Maps app
  const handleReviewedPlacePress = () => {
    if (item?.reviewedChef?._id) {
      // Registered chef - navigate to their menu
      navigation.navigate(StackNav.ChefMenu, {
        chefId: item.reviewedChef._id,
        chefName: item.reviewedChef.fullName || item.restaurantName,
      });
    } else if (item?.googlePlaceId) {
      // External restaurant with Google Place ID - open in Google Maps
      // Use query_place_id param with restaurant name as the query
      const restaurantName = encodeURIComponent(item?.restaurantName || 'Restaurant');
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurantName}&query_place_id=${item.googlePlaceId}`;
      Linking.openURL(mapsUrl).catch(err => {
        console.log('Failed to open Google Maps:', err);
      });
    } else if (item?.restaurantAddress) {
      // Fallback: open address in Google Maps
      const encodedAddress = encodeURIComponent(item.restaurantAddress);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(mapsUrl).catch(err => {
        console.log('Failed to open Google Maps:', err);
      });
    }
  };

  const imageStyles = useMemo(
    () => [
      localStyles.imageContainer,
      { backgroundColor: colors.backgroundColor },
    ],
    [colors.backgroundColor],
  );

  const uri = item?.uri;
  const poster = item?.avatarUri || item?.poster;

  // Local cache path for instant playback
  const [cachedVideoPath, setCachedVideoPath] = useState(null);

  const isVideoReadyRef = useRef(false);

  // Check if video is cached when component mounts or uri changes
  useEffect(() => {
    let active = true;
    const checkCache = async () => {
      if (uri && isVideoUri(uri)) {
        const cached = await getCachedVideoPath(uri);
        if (active) {
          // CRITICAL FIX: Only switch to cached version if we haven't started playing yet
          // This prevents the video from restarting if the remote stream is already active
          if (cached && !isVideoReadyRef.current) {
            setCachedVideoPath(cached);
          }
        }
      }
    };

    setCachedVideoPath(null); // Reset when uri changes
    checkCache();

    return () => { active = false; };
  }, [uri]);

  /* 
   * Transition Fix: 
   * Track when the video is actually ready to display to prevent black frames.
   * We initialize opacity to 0 and fade in (set to 1) only after onReadyForDisplay.
   */
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Reset video ready state and currentTime ONLY when the video source changes (e.g. component recycling)
  useEffect(() => {
    setIsVideoReady(false);
    isVideoReadyRef.current = false;
    setCurrentTime(0);
    seekProgressRef.current = 0;
  }, [item?.uri]);

  const handleOnLoad = useCallback(
    ({ duration: durationToBeSet }) => {
      setDurationInSeconds(durationToBeSet);
      // We rely on onReadyForDisplay to show the video to prevent black flash
    },
    [],
  );

  // Engagement tracking for TikTok-style algorithm
  const {
    onProgress: trackProgress,
    onComplete: trackComplete,
    onRewatch: trackRewatch,
    onShare: trackShare,
    cleanup: cleanupEngagement
  } = useEngagementTracking(item?._id, durationInSeconds, 'forYou');

  // Cleanup engagement tracking when component unmounts or video changes
  useEffect(() => {
    return () => {
      cleanupEngagement();
    };
  }, [item?._id, cleanupEngagement]);

  const onProgress = ({ currentTime: time }) => {
    // Update the ref for accurate tracking (used by handleOnLoad)
    seekProgressRef.current = time;
    // Update state for VideoSeeker
    setCurrentTime(time);
    // Track engagement for algorithm
    trackProgress(time);
  };


  return (
    <View style={{ height: layoutHeight, overflow: 'hidden' }}>

      {item?.type !== 'ad' ? (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.backgroundColor,
          }}>
          <DoubleClick
            singleTap={() => {
              if (item?.uri) {
                setpaused(prev => ({
                  ...prev,
                  paused: !prev.paused
                }));
              }
            }}
            doubleTap={() => {
              likeRef?.current?.[index]?.(item?._id);
            }}
            onPressOut={() => {
              setIsOverlayVisible(true)
            }}
            onLongPress={() => {
              if (item?.avatarUri) {
                setShowImageZoom(true);
              } else {
                setIsOverlayVisible(false);
              }
            }}>

            {/* Review Badge - compact, positioned at top left */}
            {(item?.reviewMode || item?.author?.type !== 'chef') && (
              <View style={localStyles.reviewBadge}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={localStyles.reviewBadgeGradient}
                >
                  <Ionicons name="star" size={moderateScale(10)} color="#FFFFFF" />
                  <ZText type="B10" color="#FFFFFF" style={localStyles.reviewBadgeText}>
                    REVIEW
                  </ZText>
                </LinearGradient>
              </View>
            )}
            {/* KM Away / Branches Button */}
            {item?.author?.type === 'chef' && (
              <View style={localStyles.headerContainer3}>
                <ZButton
                  onPress={() => onPressAvailableLocation(item?.author?.locations)}
                  type="m14"
                  containerStyle={localStyles.buttonTag}
                  title={
                    item?.kmAway && item?.kmAway !== null
                      ? item?.kmAway?.toFixed(2) + strings.kmAway
                      : strings.clickbranches
                  }
                />
              </View>
            )}

            {/* Refactored Media Rendering: Always render the image/poster at the bottom layer to prevent black flash */}
            <View style={localStyles.imageContainer}>
              {/* Background Image Layer */}
              {item?.avatarUri ? (
                <View style={[imageStyles, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                  <FastImage
                    source={{
                      uri: poster,
                    }}
                    // If it's a video, we MUST use cover to match the video player and prevent "zoom" effect
                    // If it's just an image post, we keep the original logic (contain)
                    resizeMode={item?.uri && isVideoUri(item?.uri) ? "cover" : "contain"}
                    style={imageStyles}
                  />
                  {/* Zoom indicator - Only show for actual images, not video thumbnails */}
                  {(!item?.uri || !isVideoUri(item?.uri)) && (
                    <View style={localStyles.zoomIndicator}>
                      <Ionicons
                        name="expand-outline"
                        size={moderateScale(20)}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                    </View>
                  )}
                </View>
              ) : (
                <Image
                  source={{
                    uri: poster,
                  }}
                  resizeMode="cover"
                  blurRadius={2}
                  style={[imageStyles, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
                />
              )}

              {/* Video Layer - Renders ON TOP of the image - But only after cache check is complete */}
              {!!item?.uri && isVideoUri(item?.uri) &&
                (activeVideoIndex === index ||
                  activeVideoIndex === index + 1 ||
                  activeVideoIndex === index - 1) &&
                (
                  <View pointerEvents="none" style={[localStyles.imageContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                    <Video
                      source={{
                        // Use cached local path for instant playback, fallback to remote URL
                        uri: cachedVideoPath || uri,
                      }}
                      onSeek={({ currentTime }) => {
                        seekProgressRef.current = currentTime;
                      }}
                      ref={videoRef}
                      onProgress={onProgress}
                      hideShutterView
                      onLoad={handleOnLoad}
                      onReadyForDisplay={() => {
                        setIsVideoReady(true);
                        isVideoReadyRef.current = true;
                      }}
                      onEnd={() => {
                        // Track video completion for algorithm
                        trackComplete();
                        // Only auto-scroll if NOT seeking (slider interaction) and meets other conditions
                        if (activeVideoIndex === index && isFocused && !isCommentOpen && !paused.slider) {
                          console.log('Video onEnd - auto-scroll. index:', index);
                          if (flatListRef.current) {
                            try {
                              flatListRef.current.scrollToIndex({
                                animated: true,
                                index: index + 1,
                              });
                              setTimeout(() => {
                                videoRef?.current?.seek?.(0);
                              }, 100);
                            } catch (e) {
                              // Reached last item - loop the video (counts as rewatch)
                              console.log('Reached last item, looping video');
                              videoRef?.current?.seek?.(0);
                              trackRewatch();
                            }
                          }
                        }
                      }}
                      style={[
                        localStyles.imageContainer,
                        {
                          backgroundColor: 'transparent',
                          opacity: isVideoReady ? 1 : 0, // Hide until loaded to prevent black flash
                        },
                      ]}
                      // We can remove the poster here since we have a dedicated image layer below, 
                      // but keeping it doesn't hurt as a fallback for the video component itself.
                      poster={poster}
                      posterResizeMode="cover"
                      resizeMode="cover"
                      playInBackground={false}
                      disableFocus={true}
                      onError={error => {

                      }}
                      seekColor={colors.primary}
                      muted={!isFocused || activeVideoIndex !== index}
                      paused={
                        activeVideoIndex !== index ||
                        !isFocused ||
                        paused.paused ||
                        paused.slider ||
                        isCommentOpen
                        // isloading
                      }
                      useTextureView={true}
                      // Android buffering configuration for FAST initial playback
                      bufferConfig={{
                        minBufferMs: 15000,       // Increased for stability during playback
                        maxBufferMs: 50000,      // Increased for better caching
                        bufferForPlaybackMs: 100, // CRITICAL: Minimized for instant start
                        bufferForPlaybackAfterRebufferMs: 500, // Reduced for faster recovery
                        cacheSizeMB: 200,        // Increased cache size
                      }}
                      // iOS buffering configuration - reduced for faster start
                      preferredForwardBufferDuration={3}
                      // Optimize for streaming
                      automaticallyWaitsToMinimizeStalling={false}
                    // Important: Ensure prev/next videos are mounted but paused so they can buffer
                    />
                  </View>
                )}
            </View>

            {/* Attached Dishes Display - positioned above the action icons */}
            {/* Hide for external (Google Maps) restaurants - only show for internal chefs */}
            {isOverlayVisible &&
              ((item?.dishes && item.dishes.length > 0) || item?.dishName) &&
              !(item?.googlePlaceId && !item?.reviewedChef) && (
                <AttachedDishesDisplay
                  attachedDishes={
                    item?.dishes && item.dishes.length > 0
                      ? item.dishes
                      : [{
                        name: item.dishName,
                        price: item.price,
                        type: 'manual',
                        image: item.poster || item.avatarUri // Use post's image for manual dish entries
                      }]
                  }
                  showPrices={true}
                  compact={true}
                  chefId={item?.author?._id}
                  chefName={item?.author?.fullName}
                  restaurantName={item?.restaurantName}
                  containerStyle={localStyles.dishesDisplayContainer}
                />
              )}

            {/* Debug: Log item data to see if dishes are present */}



            {isOverlayVisible && (
              <View
                pointerEvents="box-none"
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
                  <View style={localStyles.headerContainer}>
                    <View style={localStyles.headerInnerContainer}>
                      <TouchableOpacity onPress={handlePressProfile}>
                        <View style={localStyles.avatarRing}>
                          <Image
                            resizeMode="cover"
                            source={
                              item?.author?.avatar
                                ? { uri: item?.author?.avatar }
                                : colors.dark
                                  ? images.userDark
                                  : images.userLight
                            }
                            style={localStyles.avatarImage}
                          />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={localStyles.userInfoContainer}
                        onPress={() =>
                          onPressProfile(
                            item?.channelName,
                            item?.avatarUri,
                            item?.author?._id,
                            item?.author?.type,
                          )
                        }>
                        <View style={localStyles.userNameRow}>
                          <ZText
                            style={localStyles.userName}
                            numberOfLines={1}>
                            {item?.channelName || item?.author?.fullName || data?.fullName}
                          </ZText>

                          {/* Rating Pill - Keep next to username or move? Keeping next to username for now if it fits, or move it? 
                              Actually, user didn't complain about stars, but looking at screenshot, stars are separate. 
                              Let's keep stars next to name if they act as "User Rating"? No, it's Restaurant Rating.
                              Let's Keep stars here for now, but move Badge OUT.
                          */}
                          {(item?.author?.averageDishRating > 0 || item?.restaurantRating > 0) && (
                            <View style={localStyles.ratingPill}>
                              <ZText style={localStyles.ratingValue}>
                                {(item?.author?.averageDishRating || item?.restaurantRating).toFixed(1)}
                              </ZText>
                              <ZText style={localStyles.ratingStar}>⭐</ZText>
                            </View>
                          )}
                        </View>

                        {/* Follow Button for chef posts AND review posts - UNDER the name */}
                        {/* Show for: 1) Chef authors, OR 2) Review posts (to follow the reviewer) */}
                        {/* Hide if this is the current user's own post */}
                        {item?.author?._id && item?.author?._id !== currentUserId && (
                          <FollowButton
                            userId={item?.author?._id}
                            isFollowed={item?.author?.currentUserFollowed}
                            compact={true}
                            size="small"
                            style={{ marginTop: moderateScale(6), alignSelf: 'flex-start' }}
                          />
                        )}

                        {/* Restaurant Name for Reviews - Premium Badge Design - Moved BELOW Name */}
                        {/* Clickable: navigates to ChefMenu for registered chefs, or Google Maps for external restaurants */}
                        {((item?.reviewMode || item?.isReview || item?.author?.type !== 'chef') && (item?.restaurantName || item?.reviewedChef?.fullName)) && (
                          <>
                            <TouchableOpacity
                              onPress={handleReviewedPlacePress}
                              activeOpacity={0.7}
                              style={[localStyles.glassContainer, {
                                borderRadius: moderateScale(12),
                                paddingVertical: moderateScale(6),
                                paddingHorizontal: moderateScale(10),
                                marginTop: moderateScale(6),
                                alignSelf: 'flex-start',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 3
                              }]}>
                              {/* Restaurant info row */}
                              <Ionicons
                                name="location"
                                size={moderateScale(12)}
                                color="#FF4B4B"
                                style={{ marginRight: moderateScale(4) }}
                              />
                              <View style={{ flexShrink: 1 }}>
                                <ZText style={{
                                  fontSize: moderateScale(12),
                                  color: '#FFFFFF',
                                  fontWeight: '700',
                                  textShadowColor: 'rgba(0,0,0,0.5)',
                                  textShadowRadius: 3,
                                  lineHeight: 16
                                }} numberOfLines={1}>
                                  {item?.restaurantName || item?.reviewedChef?.fullName}
                                </ZText>
                                {/* Address Subtitle */}
                                {(item?.restaurantAddress || (item?.reviewedChef?.locations && item?.reviewedChef?.locations[0]?.address)) && (
                                  <ZText style={{
                                    fontSize: moderateScale(10),
                                    color: 'rgba(255,255,255,0.8)',
                                    fontWeight: '500',
                                    marginTop: 1
                                  }} numberOfLines={1}>
                                    {/* Extract city/area from address if possible, or show truncated address */}
                                    {item?.restaurantAddress?.split(',')[0] || item?.restaurantAddress || item?.reviewedChef?.locations?.[0]?.address?.split(',')[0]}
                                  </ZText>
                                )}
                              </View>
                              {/* Arrow indicator to show it's clickable */}
                              <Ionicons
                                name={item?.reviewedChef?._id ? 'chevron-forward' : 'open-outline'}
                                size={moderateScale(14)}
                                color="rgba(255,255,255,0.7)"
                                style={{ marginLeft: moderateScale(6) }}
                              />
                            </TouchableOpacity>
                            {/* Follow Button - OUTSIDE the glass container for cleaner appearance */}
                            {/* Hide if this is the current user's own kitchen */}
                            {item?.reviewedChef?._id && item?.reviewedChef?._id !== currentUserId && (
                              <FollowButton
                                userId={item?.reviewedChef?._id}
                                isFollowed={item?.reviewedChef?.currentUserFollowed}
                                compact={true}
                                size="small"
                                style={{ marginTop: moderateScale(6), alignSelf: 'flex-start' }}
                              />
                            )}
                          </>
                        )}
                      </TouchableOpacity>
                    </View>



                    {duration?.[0] && duration?.[0] !== 'undefined' && duration?.[0] !== undefined && (
                      <ZText
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginTop: 6,
                          textShadowColor: 'rgba(0, 0, 0, 0.8)',
                          textShadowOffset: { width: 1, height: 1 },
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
                    {(item?.reviewMode || item?.isReview || item?.author?.type !== 'chef') && (
                      <View style={localStyles.reviewInfo}>
                        <View style={localStyles.reviewRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={item?.rating && item.rating > 0
                                ? (star <= item.rating ? 'star' : 'star-outline')
                                : 'star-outline'
                              }
                              size={moderateScale(12)}
                              color={item?.rating && item.rating > 0
                                ? (star <= item.rating ? '#FFD700' : 'rgba(255, 255, 255, 0.5)')
                                : 'rgba(255, 255, 255, 0.8)'
                              }
                              style={[
                                styles.mr2,
                                { opacity: item?.rating && item.rating > 0 ? 1 : 0.8 }
                              ]}
                            />
                          ))}
                          <ZText type="B14" color={colors.white} style={[styles.ml4, { fontWeight: '800' }]}>
                            {item.rating || 0}/5
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

                    {/* Video Seeker moved to bottom */}

                    {/* Show Visit Menu button for chefs or users with menus */}
                    {(item?.author?.type === 'chef' || item?.author?.hasMenu === true) && (
                      <ZButton
                        title={strings.visitMenu}
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
                  </View>
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

            {paused.paused && !paused.slider && (
              <View
                style={[
                  localStyles.pauseIconContainer,
                  paused.paused && styles.p15,
                ]}>
                <Entypo
                  name="triangle-right"
                  size={paused && item?.uri ? moderateScale(60) : 0}
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

            {/* Professional Video Seeker - TikTok Style at Bottom */}
            {!!item?.uri && isVideoUri(item?.uri) && (
              <VideoSeeker
                videoRef={videoRef}
                duration={durationInSeconds}
                currentTime={currentTime}
                primaryColor={colors.primary}
                isActive={activeVideoIndex === index}
                isPaused={paused.paused || paused.slider || !isFocused || isCommentOpen}
                onSeek={(value) => {
                  videoRef?.current?.seek?.(value);
                  setCurrentTime(value);
                }}
                onSeekStart={() => {
                  setpaused(prev => ({ ...prev, slider: true }));
                }}
                onSeekEnd={() => {
                  setpaused(prev => ({ ...prev, slider: false }));
                }}
              />
            )}
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
      )
      }

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={showImageZoom}
        imageUri={poster}
        onClose={() => setShowImageZoom(false)}
      />

      {/* Share Options Sheet */}
      <ShareOptionsSheet
        SheetRef={shareSheetRef}
        contentType="reel"
        contentId={shareItem?._id}
        contentData={{
          title: shareItem?.title,
          description: shareItem?.caption,
          creator: {
            name: shareItem?.author?.fullName,
            avatar: shareItem?.author?.avatar,
          },
        }}
      />
    </View >
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
    bottom: moderateScale(20),
    left: 16,
    right: 16,
  },
  headerInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarRing: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 2,
    borderColor: '#FF6B6B',
    padding: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(22),
  },
  userInfoContainer: {
    marginLeft: moderateScale(10),
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(8),
  },
  ratingValue: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingStar: {
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
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
  // Professional Seeker Styles - TikTok Style
  seekerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(8),
    paddingTop: moderateScale(4),
    backgroundColor: 'transparent',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: moderateScale(8),
  },
  professionalSeekBar: {
    height: moderateScale(20),
    width: '100%',
  },
  timeContainer: {
    minWidth: moderateScale(40),
    alignItems: 'center',
  },
  timeText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dishesDisplayContainer: {
    position: 'absolute',
    bottom: moderateScale(100), // Near action buttons, far from filter icon at top
    right: moderateScale(16), // Aligned with action icons on the right
    zIndex: 5, // Lower z-index to ensure it doesn't interfere with other UI
  },
  reviewBadge: {
    position: 'absolute',
    top: moderateScale(90),
    left: moderateScale(14),
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reviewBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  reviewBadgeText: {
    fontWeight: 'bold',
    marginLeft: moderateScale(4),
    fontSize: moderateScale(9),
    letterSpacing: 0.5,
  },
  reviewBadgeGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
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
  headerContainer3: {
    position: 'absolute',
    top: moderateScale(35),
    zIndex: 999,
    left: moderateScale(15),
  },
  buttonTag: {
    height: 30,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    marginBottom: moderateScale(8), // Add breathing room
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Slight background for contrast
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  glassBadge: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassContainer: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Fallback / Shade
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernDishCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxWidth: 160,
  }
});
