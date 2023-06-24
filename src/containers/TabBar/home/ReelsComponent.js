// Libraries import
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Share,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
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
} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {StackNav} from '../../../navigation/NavigationKeys';
import Comment from '../../../components/models/Comment';
import ZButton from '../../../components/common/ZButton';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from 'react-query';
import request from '../../../api/request';
import images from '../../../assets/images';
import {VideoItem} from './VideoItem';
import OneSignal from 'react-native-onesignal';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import Description from '../../../components/models/Descriptions';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

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

  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const route = useRoute();
  const likeRef = useRef([]);
  const [isLike, setIsLike] = useState(false);
  const [selectedDescription, setselectedDescription] = useState('');
  const [isBookmark, setIsBookmark] = useState(false);
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
  const {hasNextPage, fetchNextPage, isFetchingNextPage, isLoading} =
    useInfiniteQuery(
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
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        enabled: !!data?.data?.user?._id,
        refetchOnReconnect: false,
      },
    );

  const fetchReelsFollowing = page =>
    request.get(
      `/story/following?limit=10&page=${page}&userId=${data?.data?.user?._id}`,
    );
  const {
    hasNextPageFollowin,
    fetchNextPageFollowing,
    isFetchingNextPageFollowing,
    isLoadingFollowing,
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
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      enabled: !!data?.data?.user?._id,
      refetchOnReconnect: true,
    },
  );

  const {refetch} = useQuery(
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

  const onPressReport = () => navigation.navigate(StackNav.Report);

  const onPressProfile = (userName, userImage, id) =>
    navigation.navigate(StackNav.ProfileDetail, {
      userName: userName,
      userImage: userImage,
      id: id,
    });

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

  const onPressBookmark = () => setIsBookmark(!isBookmark);

  const [selectedPostId, setSelectedPostId] = useState();

  const onPressShare = () => {
    Share.share({
      message:
        'FoodTok App | Entertainment, Social, Music, Video, Live, Chat...',
    });
  };

  const onPressComment = postId => {
    setSelectedPostId(postId);
    commentSheetRef.current?.show();
  };

  const onPressMore = description => {
    setselectedDescription(description);
    descriptionSheetRef.current?.show();
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
      <GestureHandlerRootView
        key={keyPrefix}
        style={{
          height: layoutHeight,
          backgroundColor: colors.darkBg,
        }}>
        <GestureDetector
          gesture={Gesture.Tap()
            .numberOfTaps(2)
            .onStart(() => {
              likeRef?.current?.[index]?.(item?._id);
            })}>
          <Pressable onPress={() => togglePause(index)}>
            {isFocused &&
              (item?.avatarUri ? (
                <Image
                  source={{uri: item?.avatarUri}}
                  resizeMode="contain"
                  style={[
                    localStyles.imageContainer,
                    {backgroundColor: colors.darkBg},
                  ]}
                />
              ) : (
                isFocused && (
                  <Video
                    source={{
                      uri: item?.uri?.replace(
                        getVideoExtension(item?.uri),
                        'mp4',
                      ),
                    }}
                    style={[
                      localStyles.imageContainer,
                      {backgroundColor: colors.darkBg},
                    ]}
                    poster={item?.uri?.replace(
                      getVideoExtension(item?.uri),
                      'jpg',
                    )}
                    posterResizeMode="contain"
                    resizeMode="contain"
                    repeat={true}
                    onError={videoError}
                    seekColor={colors.primary}
                    paused={
                      activeVideoIndex !== index || pausedVideos.includes(index)
                    }
                  />
                )
              ))}

            <LinearGradient
              key={`item-${item?._id}`}
              colors={['transparent', 'rgba(0, 0, 0, 1)']}
              style={localStyles.bottomContainer}>
              <View style={styles.flex}>
                <View style={styles.rowCenter}>
                  <TouchableOpacity
                    onPress={() =>
                      onPressProfile(
                        item?.channelName,
                        item?.avatarUri,
                        item?.author?._id,
                      )
                    }
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
                      type="m14"
                      style={styles.mt5}
                      numberOfLines={1}
                      color={colors.white}>
                      {item?.category}
                    </ZText>
                  </View>
                </View>

                {/* <ZText type="m14" color={colors.white} style={styles.mb10}>
                  {item?.title}
                </ZText> */}

                <ZText type="m14" color={colors.white} style={styles.mb20}>
                  {item?.title?.length < 100
                    ? item?.title
                    : item?.title?.slice(0, 150) + '...'}
                </ZText>

                <TouchableOpacity
                  onPress={() => onPressMore(item?.title)}
                  style={styles.button}>
                  <ZText type="m14" color={colors.primary} style={styles.mb20}>
                    {item?.title?.length < 100 ? '' : 'See More'}
                  </ZText>
                </TouchableOpacity>
                {data?.data?.user?._id !== item?.author?._id && (
                  <ZButton
                    title={`Buy this for ${item?.price} EGP`}
                    textType={'b18'}
                    color={colors.white}
                    containerStyle={{
                      height: getHeight(50),
                      borderRadius: moderateScale(20),
                      borderWidth: moderateScale(1),
                      width: '100%',
                      alignSelf: 'center',
                    }}
                    onPress={() =>
                      item?.linkToGo
                        ? Linking.openURL(
                            item?.linkToGo?.includes('http')
                              ? item?.linkToGo
                              : 'https://' + item?.linkToGo,
                          )
                        : Linking.openURL(
                            'whatsapp://send?text=' +
                              'Hi, I came from cookbook app, and I want to buy this dish: ' +
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
                  onPress={onPressReport}
                />
                <VideoItem
                  icon="heart"
                  data={item?.likesNo}
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
                  data={item?.comments}
                  onPress={() => onPressComment(item?._id)}
                />
                <VideoItem
                  icon={isBookmark ? 'bookmark-outline' : 'bookmark'}
                  data={item?.bookmark}
                  onPress={onPressBookmark}
                />
                <VideoItem
                  icon="share"
                  data={item?.share}
                  onPress={onPressShare}
                />
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
          </Pressable>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  };

  const viewConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const updateViews = async storyId =>
    request.post('/views', {
      storyId,
    });

  const updateViewsMutation = useMutation(updateViews);

  const keyExtractor = useCallback(item => {
    return `item-${item?._id}`;
  }, []);

  const viewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  return (
    <View style={{flex: 1, backgroundColor: colors.backgroundColor}}>
      <View style={localStyles.headerContainer}>
        <View style={localStyles.headerInnerContainer}>
          <HeaderCategoryItem
            title={'Following'}
            onPress={() => setCategory('Following')}
            category={category}
          />

          <HeaderCategoryItem
            title={'For You'}
            onPress={() => setCategory('For You')}
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
      {category === 'For You' ? (
        <FlashList
          data={filteredData.current}
          extraData={extraData}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          renderItem={renderReelComponent}
          pagingEnabled={Platform.OS === 'ios'}
          viewabilityConfig={viewConfig}
          onViewableItemsChanged={viewableItemsChanged}
          onLayout={onSetLayout}
          snapToInterval={Platform.OS === 'android' ? layoutHeight : undefined}
          drawDistance={layoutHeight}
          decelerationRate={'fast'}
          disableIntervalMomentum
          ListEmptyComponent={
            isLoading && (
              <ActivityIndicator
                style={{alignSelf: 'center', marginTop: 400}}
                size={'large'}
              />
            )
          }
          estimatedItemSize={11}
          ref={flatListRef}
          onEndReachedThreshold={0.4}
          onEndReached={hasNextPage ? fetchNextPage : null}
          ListFooterComponent={
            isFetchingNextPage && <ActivityIndicator size={'large'} />
          }
        />
      ) : (
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
          snapToInterval={Platform.OS === 'android' ? layoutHeight : undefined}
          drawDistance={layoutHeight}
          decelerationRate={'fast'}
          disableIntervalMomentum
          ListEmptyComponent={
            isLoadingFollowing ? (
              <ActivityIndicator
                style={{alignSelf: 'center', marginTop: 400}}
                size={'large'}
              />
            ) : (
              <ZText style={{textAlign: 'center', marginTop: 350}} type={'B30'}>
                No Dishes yet! Follow Someone first..
              </ZText>
            )
          }
          estimatedItemSize={11}
          ref={flatListRefFollowing}
          onEndReachedThreshold={0.4}
          onEndReached={hasNextPageFollowin ? fetchNextPageFollowing : null}
          ListFooterComponent={
            isFetchingNextPageFollowing && <ActivityIndicator size={'large'} />
          }
        />
      )}
      <Comment SheetRef={commentSheetRef} postId={selectedPostId} />
      <Description
        SheetRef={descriptionSheetRef}
        description={selectedDescription}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  imageContainer: {
    height: '100%',
    width: '100%',
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
    top: moderateScale(55),
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
