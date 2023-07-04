// Libraries import
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
  Linking,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Image from 'react-native-fast-image';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-fast-video';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
// Local import
import {styles} from '../../../themes';
import {
  getHeight,
  getVideoExtension,
  isAndroid,
  moderateScale,
  screenFullHeight,
  screenWidth,
} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import Comment from '../../../components/models/Comment';
import ZButton from '../../../components/common/ZButton';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from 'react-query';
import request from '../../../api/request';
import OneSignal from 'react-native-onesignal';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Spinner from 'react-native-loading-spinner-overlay';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import ReelComponent from './ReelComponent';

const HeaderCategoryItem = React.memo(({title, onPress, category}) => {
  const colors = useSelector(state => state.theme.theme);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        localStyles.headerCetegoryItemContainer,
        {
          borderBottomColor: title === category ? colors.primary : colors.white,
        },
      ]}>
      <ZText
        type="b18"
        numberOfLines={1}
        color={title === category ? colors.primary : colors.white}>
        {title}
      </ZText>
    </TouchableOpacity>
  );
});

export default function ReelsComponent() {
  const colors = useSelector(state => state.theme.theme);
  const commentSheetRef = useRef('');
  const descriptionSheetRef = useRef('');
  const locationSheetRef = useRef('');
  const [videoCount, setVideoCount] = useState(0);

  const interstitialAd = InterstitialAd.createForAdRequest(
    TestIds.INTERSTITIAL,
  );

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );

    // Start loading the interstitial straight away
    interstitialAd.load();

    // Unsubscribe from events on unmount
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Check if the user has navigated for 20 videos or images
    if (videoCount >= 20 && loaded) {
      try {
        interstitialAd?.show();
        setVideoCount(0);
      } catch {}
    }
  }, [loaded, videoCount]);

  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const route = useRoute();

  const likeRef = useRef([]);
  const [isLike, setIsLike] = useState(false);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGov, setselectedGov] = useState('');

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [category, setCategory] = useState('For You');
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [extraData, setExtraData] = useState(true);
  const filteredData = useRef([]);
  const filteredDataFollowing = useRef([]);
  const flatListRefFollowing = useRef(null);
  const flatListRef = useRef(null);
  const [notificationReceived, setnotificationReceived] = useState(false);

  const [storyId, setStoryId] = useState();

  const queryClient = useQueryClient();

  React.useEffect(() => {
    setStoryId(route.params?.storyId);
  }, [route.params]);

  React.useEffect(() => {
    // Initialize OneSignal
    OneSignal.setAppId('8f642b9d-8d10-4b66-b43a-c1d0345ef13f');

    // Optional: Configure OneSignal
    OneSignal.setLogLevel(6, 0); // Enable verbose OneSignal logs for debugging

    // Handle notifications received while the app is in the foreground

    OneSignal.setNotificationOpenedHandler(async notifReceivedEvent => {
      // Display or handle the notification as needed
      navigation.navigate(TabNav.Home);
      setStoryId(notifReceivedEvent?.notification?.additionalData?._id);

      queryClient.invalidateQueries({queryKey: 'user'});
      queryClient.invalidateQueries({queryKey: 'profile-stories'});

      setnotificationReceived(true);
    });
    OneSignal.setNotificationWillShowInForegroundHandler(
      async notifReceivedEvent => {
        // Display or handle the notification as needed
        const notification = await notifReceivedEvent.getNotification();
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Notification',
          textBody: notification.body,
        });
        navigation.navigate(TabNav.Home);

        setStoryId(notification.additionalData?._id);

        setTimeout(() => {
          refetch();
        }, 500);

        queryClient.invalidateQueries({queryKey: 'user'});
        queryClient.invalidateQueries({queryKey: 'profile-stories'});

        setnotificationReceived(true);
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Notification',
          textBody: notification.body,
        });
        navigation.navigate(TabNav.Home);

        setStoryId(notification.additionalData?._id);

        setTimeout(() => {
          refetch();
        }, 500);
        notifReceivedEvent.complete(notifReceivedEvent.getNotification());
      },
    );

    return () => {
      // Clean up OneSignal event handlers when the component unmounts
      OneSignal.clearHandlers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const fetchReels = page =>
    request.get(
      `/story/stories?limit=10&page=${page}&userId=${data?.data?.user?._id}`,
    );
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch: refetchStories,
  } = useInfiniteQuery(
    ['stories', data?.data?.user?._id],
    ({pageParam = 1}) => fetchReels(pageParam),
    {
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.data?.currentPage < lastPage?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      onSuccess: res => {
        if (res?.pageParams?.length === 1) {
          flatListRef.current?.scrollToOffset({offset: 0});
        }
        const result = res?.pages.flatMap(page => page.data?.stories || []);
        if (result.length) {
          filteredData.current = result;
        }
      },
      enabled: !!data?.data?.user?._id,
    },
  );

  const fetchReelsFollowing = page =>
    request.get(
      `/story/following?limit=10&page=${page}&userId=${data?.data?.user?._id}`,
    );
  const {
    hasNextPage: hasNextPageFollowin,
    fetchNextPage: fetchNextPageFollowing,
    isFetchingNextPage: isFetchingNextPageFollowing,
    isLoading: isLoadingFollowing,
    isFetching: isFetchingFollowing,
    refetch: refetchStoriesFollowing,
  } = useInfiniteQuery(
    ['stories_following', data?.data?.user?._id],
    ({pageParam = 1}) => fetchReelsFollowing(pageParam),
    {
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.data?.currentPage < lastPage?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      retry: 0,
      onSuccess: res => {
        if (res?.pageParams?.length === 1) {
          flatListRefFollowing.current?.scrollToOffset({offset: 0});
        }
        const result = res?.pages.flatMap(page => page.data?.stories || []);
        if (result.length) {
          filteredDataFollowing.current = result;
        }
      },
      onError: error =>
        error?.nostories ? (filteredDataFollowing.current = []) : null,
      enabled: !!data?.data?.user?._id,
    },
  );

  const {
    refetch,
    isLoading: isLoadingStory,
    isFetching: isFetchingStory,
    isRefetching: isRefetchingStory,
  } = useQuery(
    ['storyById', storyId],
    () =>
      request.get(`/story/${storyId}`, {
        params: {
          userId: data?.data?.user?._id,
        },
      }),
    {
      enabled: !!storyId && !!filteredData?.current?.length,
      onSuccess: res => {
        setCategory('For You');
        const filtered = filteredData?.current?.filter(item => {
          return res?.data?.story?._id !== item?._id;
        });
        if (filtered.length) {
          filteredData.current = [res?.data?.story, ...filtered];
        }
        flatListRef.current?.scrollToOffset({offset: 0});
        setStoryId(null);
      },
    },
  );

  const [pausedVideos, setPausedVideos] = useState([]);

  const musicToneAnimated = useRef(new Animated.Value(0)).current;
  const musicToneAnimated1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.timing(musicToneAnimated, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start();
      Animated.loop(
        Animated.timing(musicToneAnimated1, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start();
    }
  }, [musicToneAnimated, musicToneAnimated1]);

  useEffect(() => {
    setExtraData(!extraData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLike,
    activeVideoIndex,
    isFocused,
    category,
    pausedVideos,
    notificationReceived,
    filteredData.current,
  ]);

  const addLikeMutation = useMutation(postId =>
    request.post(`/like/${postId}`),
  );
  const removeLikeMutation = useMutation(postId =>
    request.delete(`/like/${postId}`),
  );

  const onPressReport = item =>
    navigation.navigate(StackNav.Report, {
      storyId: item?._id,
    });

  const onPressProfile = (userName, userImage, id) => {
    if (id !== data?.data?.user?._id) {
      navigation.navigate(StackNav.ProfileDetail, {
        userName: userName,
        userImage: userImage,
        id,
      });
    } else {
      navigation.navigate(TabNav.Profile);
    }
  };

  const videoError = error => console.log('videoError', error);

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

  const [selectedPostId, setSelectedPostId] = useState();

  const onPressComment = postId => {
    setSelectedPostId(postId);
    commentSheetRef.current?.show();
  };

  const onPressMore = description => {
    setselectedDescription(description);
    descriptionSheetRef.current?.show();
  };
  const onPressAvailableLocation = (gov, areas) => {
    setSelectedAreas(areas);
    setselectedGov(gov);
    locationSheetRef.current?.show();
  };

  const onPressSearch = () => navigation.navigate(StackNav.Search);
  const togglePause = index => {
    if (pausedVideos.includes(index)) {
      setPausedVideos(
        pausedVideos.filter(pausedIndex => pausedIndex !== index),
      );
    } else {
      setPausedVideos([...pausedVideos, index]);
    }
  };
  const renderReelComponent = ({item, index}) => {
    const keyPrefix = `item-${item?._id}-index`;

    return (
      <ReelComponent
        item={item}
        layoutHeight={layoutHeight}
        keyPrefix={keyPrefix}
        index={index}
        isFocused={isFocused}
        data={data}
        onPressProfile={onPressProfile}
        activeVideoIndex={activeVideoIndex}
        pausedVideos={pausedVideos}
        togglePause={togglePause}
        likeRef={likeRef}
        onPressMore={onPressMore}
        onPressAvailableLocation={onPressAvailableLocation}
        onPressComment={onPressComment}
        isLike={isLike}
        onPressLike={onPressLike}
        setIsLike={setIsLike}
        extraData={extraData}
        setExtraData={setExtraData}
        videoError={videoError}
        onPressReport={onPressReport}
      />
    );
  };

  const viewConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const updateViews = async storyId =>
    request.post('/views', {
      storyId,
      userId: data?.data?.user?._id,
    });

  const updateViewsMutation = useMutation(updateViews);

  const keyExtractor = useCallback(item => {
    return `item-${item?._id}`;
  }, []);

  const viewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
      setVideoCount(prevCount => prevCount + 1);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  const onClickFollowing = () => {
    refetchStories();
    setCategory('Following');
  };

  const onClickForYou = () => {
    refetchStoriesFollowing();
    setCategory('For You');
  };
  const onTouchStart = e => (this.touchx = e.nativeEvent.pageX);
  const onTouchEnd = e => {
    if (this.touchx - e.nativeEvent.pageX > 30) {
      onClickForYou();
    }
    if (e.nativeEvent.pageX - this.touchx > 30) {
      onClickFollowing();
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.backgroundColor}}>
      <View
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{flex: 1, backgroundColor: colors.backgroundColor}}>
        <View style={localStyles.headerContainer}>
          <View style={localStyles.headerInnerContainer}>
            <HeaderCategoryItem
              title={'Following'}
              onPress={onClickFollowing}
              category={category}
            />

            <HeaderCategoryItem
              title={'For You'}
              onPress={onClickForYou}
              category={category}
            />
          </View>

          <TouchableOpacity onPress={onPressSearch}>
            <Ionicons
              name="search-outline"
              size={moderateScale(30)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
        {category === 'For You' && (
          <>
            <Spinner
              //visibility of Overlay Loading Spinner
              visible={isLoadingStory || isFetchingStory || isRefetchingStory}
            />
            <FlashList
              data={filteredData.current}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading || isFetching}
                  tintColor={colors.primary}
                  onRefresh={() => {
                    queryClient.invalidateQueries({queryKey: 'stories'});
                  }}
                />
              }
              extraData={extraData}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              renderItem={renderReelComponent}
              pagingEnabled={Platform.OS === 'ios'}
              viewabilityConfig={viewConfig}
              onViewableItemsChanged={viewableItemsChanged}
              onLayout={onSetLayout}
              snapToInterval={
                Platform.OS === 'android' ? layoutHeight : undefined
              }
              drawDistance={layoutHeight}
              decelerationRate={'fast'}
              disableIntervalMomentum
              ListEmptyComponent={
                isLoading || !data?.data?.user?._id ? (
                  <ActivityIndicator
                    style={{alignSelf: 'center', marginTop: 400}}
                    size={'large'}
                  />
                ) : (
                  <ZText
                    style={{textAlign: 'center', marginTop: 350}}
                    type={'B30'}>
                    No Dishes yet! Stay tuned.
                  </ZText>
                )
              }
              estimatedItemSize={11}
              ref={flatListRef}
              onEndReachedThreshold={0.9}
              onEndReached={hasNextPage ? fetchNextPage : null}
              ListFooterComponent={
                isFetchingNextPage && <ActivityIndicator size={'large'} />
              }
            />
          </>
        )}

        {category !== 'For You' && (
          <FlashList
            data={filteredDataFollowing.current}
            extraData={extraData}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            renderItem={renderReelComponent}
            pagingEnabled={Platform.OS === 'ios'}
            viewabilityConfig={viewConfig}
            onViewableItemsChanged={viewableItemsChanged}
            onLayout={onSetLayout}
            snapToInterval={
              Platform.OS === 'android' ? layoutHeight : undefined
            }
            drawDistance={layoutHeight}
            decelerationRate={'fast'}
            disableIntervalMomentum
            refreshControl={
              <RefreshControl
                refreshing={isLoadingFollowing || isFetchingFollowing}
                tintColor={colors.primary}
                onRefresh={() => {
                  queryClient.invalidateQueries({
                    queryKey: 'stories_following',
                  });
                }}
              />
            }
            ListEmptyComponent={
              isLoadingFollowing ? (
                <ActivityIndicator
                  style={{alignSelf: 'center', marginTop: 400}}
                  size={'large'}
                />
              ) : (
                <ZText
                  style={{textAlign: 'center', marginTop: 350}}
                  type={'B30'}>
                  No Dishes yet! Follow Someone first..
                </ZText>
              )
            }
            estimatedItemSize={11}
            ref={flatListRefFollowing}
            onEndReachedThreshold={0.9}
            onEndReached={hasNextPageFollowin ? fetchNextPageFollowing : null}
            ListFooterComponent={
              isFetchingNextPageFollowing && (
                <ActivityIndicator size={'large'} />
              )
            }
          />
        )}
        <Comment
          SheetRef={commentSheetRef}
          postId={selectedPostId}
          currentUserId={data?.data?.user?._id}
        />
        <Description
          SheetRef={descriptionSheetRef}
          description={selectedDescription}
        />
        <Locations
          SheetRef={locationSheetRef}
          selectedAreas={selectedAreas}
          selectedGov={selectedGov}
        />
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'transparent',
          }}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  imageContainer: {
    height: '100%',
    width: '100%',
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
    top: screenFullHeight / 2 - moderateScale(30),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(52, 52, 52, 0.4)',
  },
  likeIcon: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(30),
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
    top: moderateScale(15),
    zIndex: 1,
    ...styles.ph20,
    // ...styles.flex,
    // marginTop: moderateScale(60),
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
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 10,
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
    top: screenFullHeight / 2 - moderateScale(30),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(52, 52, 52, 0.4)',
  },
  musicContainer: {
    ...styles.rowCenter,
  },
  verticalContainer: {
    ...styles.ph5,
    ...styles.mb10,
    ...styles.pl10,
  },
  renderIconContainer: {
    ...styles.itemsCenter,
    ...styles.mt20,
  },
});
