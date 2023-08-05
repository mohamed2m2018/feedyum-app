/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
// Libraries import
import {
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import strings from '../../../i18n/strings';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
// Local import
import {styles} from '../../../themes';
import {
  isAndroid,
  moderateScale,
  screenFullHeight,
} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import Comment from '../../../components/models/Comment';
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
import dynamicLinks from '@react-native-firebase/dynamic-links';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import ReelComponent from './ReelComponent';
import {TabBar, TabView} from 'react-native-tab-view';
import FollowingList from './FollowingList';
import ForYouList from './ForYouList';
import {AdView} from './ads/AdView';
import Spinner from 'react-native-loading-spinner-overlay/lib';

const HeaderCategoryItem = React.memo(({title, onPress, category}) => {
  const colors = useSelector(state => state.theme.theme);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        localStyles.headerCetegoryItemContainer,
        {
          borderBottomColor:
            title === category ? colors.primary : colors.grayScale5,
        },
      ]}>
      <ZText
        type="b18"
        numberOfLines={1}
        color={title === category ? colors.primary : colors.grayScale5}>
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

  const navigation = useNavigation();
  const route = useRoute();

  const likeRef = useRef([]);
  const [isLike, setIsLike] = useState(false);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGov, setselectedGov] = useState('');

  const [activeVideoIndexForYou, setActiveVideoIndexForYou] = useState(0);
  const [activeVideoIndexFollowing, setActiveVideoIndexFollwing] = useState(0);

  const [layoutHeight, setLayoutHeight] = useState(
    Dimensions.get('window').height,
  );
  const [extraData, setExtraData] = useState(true);
  const filteredData = useRef([]);
  const filteredDataFollowing = useRef([]);
  const flatListRefFollowing = useRef(null);
  const flatListRef = useRef(null);
  const [notificationReceived, setnotificationReceived] = useState(false);

  const handleDeepLink = link => {
    // Handle dynamic link inside your own application
    navigation.navigate(TabNav.Home);
    const postId = link.url.split('/').pop();
    setStoryId(postId);

    queryClient.invalidateQueries({queryKey: 'user'});
    queryClient.invalidateQueries({queryKey: 'profile-stories'});

    setnotificationReceived(true);
  };

  useEffect(() => {
    dynamicLinks()
      .getInitialLink()
      .then(link => {
        handleDeepLink(link);
      });
  }, []);

  const handleDynamicLink = link => {
    handleDeepLink(link);
  };

  useEffect(() => {
    const unsubscribe = dynamicLinks().onLink(handleDynamicLink);
    // When the component is unmounted, remove the listener
    return () => unsubscribe();
  }, []);

  const viewableItemsChangedForYou = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndexForYou(viewableItems[0].index);
      setVideoCount(prevCount => prevCount + 1);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const viewableItemsChangedFollowing = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndexFollwing(viewableItems[0].index);
      setVideoCount(prevCount => prevCount + 1);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

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
      if (notifReceivedEvent?.notification?.body?.includes('comment')) {
        setSelectedPostId(
          notifReceivedEvent?.notification?.additionalData?._id,
        );
        setTimeout(() => {
          commentSheetRef.current?.show();
        }, 300);
      }
    });
    OneSignal.setNotificationWillShowInForegroundHandler(
      async notifReceivedEvent => {
        // Display or handle the notification as needed
        const notification = await notifReceivedEvent.getNotification();
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: strings.notification,
          textBody: notification.body
            ?.replace('got a comment', strings.gotAcomment)
            ?.replace('got a like', strings.gotALike),
          onPress: () => {
            navigation.navigate(TabNav.Home);

            setStoryId(notification.additionalData?._id);

            setTimeout(() => {
              refetch();
            }, 500);
            queryClient.invalidateQueries({queryKey: 'user'});
            queryClient.invalidateQueries({queryKey: 'profile-stories'});
            if (notification?.body?.includes('comment')) {
              setSelectedPostId(notification.additionalData?._id);
              setTimeout(() => {
                commentSheetRef.current?.show();
              }, 300);
            }
            setnotificationReceived(true);
          },
        });

        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: strings.notification,
          textBody: notification.body
            ?.replace('got a comment', strings.gotAcomment)
            ?.replace('got a like', strings.gotALike),
          onPress: () => {
            navigation.navigate(TabNav.Home);

            setStoryId(notification.additionalData?._id);

            setTimeout(() => {
              refetch();
            }, 500);
            queryClient.invalidateQueries({queryKey: 'user'});
            queryClient.invalidateQueries({queryKey: 'profile-stories'});
            if (notification?.body?.includes('comment')) {
              setSelectedPostId(notification.additionalData?._id);
              commentSheetRef.current?.show();
            }
            setnotificationReceived(true);
          },
        });
        notifReceivedEvent.complete(notifReceivedEvent.getNotification());
      },
    );

    return () => {
      // Clean up OneSignal event handlers when the component unmounts
      OneSignal.clearHandlers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentSheetRef]);

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  useFocusEffect(
    React.useCallback(() => {
      flatListRef.current?.scrollToOffset({offset: 0, animated: false});
    }, []),
  );
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
    isFetched,
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
          flatListRef.current?.scrollToOffset({offset: 0, animated: false});
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
    isRefetching: isRefetchingFollowing,
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
        setIndex(1);
        const filtered = filteredData?.current?.filter(item => {
          return res?.data?.story?._id !== item?._id;
        });
        if (filtered.length) {
          filteredData.current = [res?.data?.story, ...filtered];
        }
        flatListRef.current?.scrollToOffset({offset: 0});
        updateViewsMutation.mutate(res?.data?.story?._id);
        setStoryId(null);
      },
    },
  );

  const [pausedVideosFollowing, setPausedVideossFollowing] = useState([]);
  const [pausedVideosForYou, setPausedVideossForYou] = useState([]);

  useEffect(() => {
    setExtraData(!extraData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLike,
    activeVideoIndexFollowing,
    activeVideoIndexForYou,
    index,
    pausedVideosFollowing,
    pausedVideosForYou,
    notificationReceived,
    filteredData.current,
    layoutHeight,
    filteredDataFollowing.current,
  ]);

  const addLikeMutation = useMutation(postId =>
    request.post(`/like/${postId}`),
  );
  const removeLikeMutation = useMutation(postId =>
    request.delete(`/like/${postId}`),
  );

  const onPressReport = item => {
    navigation.navigate(StackNav.Report, {
      storyId: item?._id,
    });
    setExtraData(!extraData);
  };

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
  const togglePauseFollowing = index => {
    if (pausedVideosFollowing.includes(index)) {
      setPausedVideossFollowing(
        pausedVideosFollowing.filter(pausedIndex => pausedIndex !== index),
      );
    } else {
      setPausedVideossFollowing([...pausedVideosFollowing, index]);
    }
  };

  const togglePauseForYou = index => {
    if (pausedVideosForYou.includes(index)) {
      setPausedVideossForYou(
        pausedVideosForYou.filter(pausedIndex => pausedIndex !== index),
      );
    } else {
      setPausedVideossForYou([...pausedVideosForYou, index]);
    }
  };

  const renderReelComponentFollowing = ({item, index: i}) => {
    const keyPrefix = `item-${item?._id}-${i}`;
    if (typeof item === 'string' && item?.includes('ad')) {
      return (
        <AdView
          key={keyPrefix}
          layoutHeight={layoutHeight}
          loadOnMount={false}
          index={i}
          type="video"
          media={true}
        />
      );
    }
    return (
      <ReelComponent
        item={item}
        layoutHeight={layoutHeight}
        keyPrefix={keyPrefix}
        tabIndex={index}
        index={i}
        tabIndexDefault={0}
        flatListRef={index === 1 ? flatListRef : flatListRefFollowing}
        data={data}
        onPressProfile={onPressProfile}
        activeVideoIndex={activeVideoIndexFollowing}
        pausedVideos={pausedVideosFollowing}
        togglePause={togglePauseFollowing}
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

  const renderReelComponentForYou = ({item, index: i}) => {
    const keyPrefix = `item-${item?._id}-${i}`;
    if (typeof item === 'string' && item?.includes('ad')) {
      return (
        <AdView
          key={keyPrefix}
          loadOnMount={false}
          layoutHeight={layoutHeight}
          index={i}
          type="video"
          media={true}
        />
      );
    }
    return (
      <ReelComponent
        item={item}
        layoutHeight={layoutHeight}
        keyPrefix={keyPrefix}
        tabIndex={index}
        index={i}
        tabIndexDefault={1}
        flatListRef={index === 1 ? flatListRef : flatListRefFollowing}
        data={data}
        onPressProfile={onPressProfile}
        activeVideoIndex={activeVideoIndexForYou}
        pausedVideos={pausedVideosForYou}
        togglePause={togglePauseForYou}
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

  const keyExtractor = (item, index) => {
    return `item-${item?._id}-${index}`;
  };

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  const [index, setIndex] = React.useState(1);
  const [routes] = React.useState([
    {key: 'following', title: strings.following},
    {key: 'forYou', title: strings.foryou},
  ]);

  const renderScene = useCallback(
    ({route: r}) => {
      switch (r.key) {
        case 'following':
          return (
            <FollowingList
              isLoadingFollowing={isLoadingFollowing}
              isFetchingFollowing={isFetchingFollowing}
              isRefetchingFollowing={isRefetchingFollowing}
              filteredDataFollowing={filteredDataFollowing}
              layoutHeight={layoutHeight}
              isFetchingNextPageFollowing={isFetchingNextPageFollowing}
              fetchNextPageFollowing={fetchNextPageFollowing}
              flatListRefFollowing={flatListRefFollowing}
              extraData={extraData}
              viewableItemsChanged={viewableItemsChangedFollowing}
              keyExtractor={keyExtractor}
              renderReelComponent={renderReelComponentFollowing}
              onSetLayout={onSetLayout}
              viewConfig={viewConfig}
              hasNextPageFollowin={hasNextPageFollowin}
            />
          );
        case 'forYou':
          return (
            <ForYouList
              isLoadingStory={isLoadingStory}
              isFetchingStory={isFetchingStory}
              isRefetchingStory={isRefetchingStory}
              filteredData={filteredData}
              isFetched={isFetched}
              isLoading={isLoading}
              isFetching={isFetching}
              layoutHeight={layoutHeight}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              flatListRef={flatListRef}
              data={data}
              extraData={extraData}
              viewableItemsChanged={viewableItemsChangedForYou}
              keyExtractor={keyExtractor}
              renderReelComponent={renderReelComponentForYou}
              onSetLayout={onSetLayout}
              viewConfig={viewConfig}
              hasNextPage={hasNextPage}
            />
          );
        default:
          return <Spinner visible={true} color={colors.primary} />;
      }
    },
    [
      isLoadingFollowing,
      isFetchingStory,
      isLoadingStory,
      isRefetchingStory,
      filteredData,
      isFetched,
      isLoading,
      layoutHeight,
      hasNextPage,
      extraData,
      isFetchingNextPage,
      data,
      isLoadingFollowing,
      isFetchingFollowing,
      isRefetchingFollowing,
      filteredDataFollowing,
      isFetchingNextPageFollowing,
      flatListRef,
      flatListRefFollowing,
      hasNextPageFollowin,
    ],
  );

  const renderTabBar = props => (
    <TabBar
      {...props}
      contentContainerStyle={localStyles.tabContainer}
      renderLabel={({route}) => (
        <HeaderCategoryItem
          title={route.title}
          onPress={() => setIndex(props.navigationState.routes.indexOf(route))}
          category={routes[index].title}
        />
      )}
      tabStyle={localStyles.tab}
      style={localStyles.tabBar}
      indicatorStyle={localStyles.tabBarIndicator}
    />
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.backgroundColor}}>
      <View style={{flex: 1, backgroundColor: colors.backgroundColor}}>
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={i => {
            setIndex(i);
            setExtraData(!extraData);
          }}
          style={localStyles.tabBar}
          indicatorStyle={localStyles.tabBarIndicator}
          renderTabBar={renderTabBar}
          initialLayout={{
            width: 0,
            height: 0,
          }} // Set initialLayout to avoid initial re-rendering issues
        />
        <View style={localStyles.headerContainer}>
          <TouchableOpacity onPress={onPressSearch}>
            <Ionicons
              name="search-outline"
              size={moderateScale(30)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
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
  tabContainer: {justifyContent: 'center'},
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
    top: moderateScale(10),
    zIndex: 1,
    ...styles.ph20,
    ...styles.rowSpaceBetween,
    right: moderateScale(10),
  },
  headerInnerContainer: {
    ...styles.flex,
    ...styles.rowCenter,
  },
  tabBar: {
    backgroundColor: 'transparent', // Set the background color to 'transparent'
    justifyContent: 'center', // Align tabs in the center horizontally
  },
  tab: {
    width: 'auto', // Set the desired width for the tabs
  },
  tabBarIndicator: {
    backgroundColor: 'transparent', // Set the background color of the indicator to 'transparent'
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
