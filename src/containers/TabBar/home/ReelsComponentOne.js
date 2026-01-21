/* eslint-disable react-hooks/exhaustive-deps */
// Libraries import
import { StyleSheet, TouchableOpacity, View, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

// Local import
import { styles } from '../../../themes';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
  screenHeight,
} from '../../../common/constants';
import { TabNav } from '../../../navigation/NavigationKeys';
import { useInfiniteQuery, useMutation, useQuery } from 'react-query';
import ReelComponent from './ReelComponent';
import request from '../../../api/request';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';
import ZHeader from '../../../components/common/ZHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../../navigation/locationContext';
import ZButton from '../../../components/common/ZButton';

import { optimizeImageUrl, prefetchImages } from '../../../utils/imageOptimizer';
import { prefetchVideosAroundIndex } from '../../../services/VideoPrefetchService';

export default function ReelsComponentOne() {
  const route = useRoute();
  const [storyId, setStoryId] = useState(route.params?.storyId);
  const colors = useSelector(state => state.theme.theme);
  const isFocused = useIsFocused();
  const commentSheetRef = useRef('');
  const descriptionSheetRef = useRef('');
  const [adFailedToLoad, setadFailedToLoad] = useState(false);
  const locationSheetRef = useRef('');
  const navigation = useNavigation();

  // Custom title support for Reviews view
  const customTitle = route.params?.customTitle;
  const reviewsOnly = route.params?.reviewsOnly;
  const receivedReviews = route.params?.receivedReviews;

  const [userProfile, setUserProfile] = useState(route.params?.profile);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [selectedPostId, setSelectedPostId] = useState();

  // Smart Layout Initialization
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Estimate: Window - Top Inset - Bottom Inset - Header (~65px) - Margin (5px)
  // This prevents the "default 800" scroll bug on first render
  const initialHeight = Math.floor(windowHeight - insets.top - insets.bottom - 70);

  const [layoutHeight, setLayoutHeight] = useState(initialHeight);
  const [extraData, setExtraData] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [filteredDataNotSeen, setFilteredDataNotSeen] = useState([]);
  const location = useLocation();

  const flatListRef = useRef(null);
  const likeRef = useRef([]);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGov, setselectedGov] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const fetchReels = page => {
    let url = `/story/author?limit=15&page=${page}&id=${userProfile?._id}&&lat=${location?.latitude}&long=${location?.longitude}`;
    // Add reviewsOnly filter if specified
    if (reviewsOnly) {
      url += `&reviewsOnly=true`;
    }
    // Add receivedReviews filter if specified (for customer reviews about chef's dishes)
    if (receivedReviews) {
      url += `&receivedReviews=true`;
    }
    return request.get(url);
  };

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching: isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ['stories-user', userProfile?._id],
    ({ pageParam = 1 }) => fetchReels(pageParam),
    {
      retry: 0,
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.data?.currentPage < lastPage?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      onSuccess: res => {
        if (res?.pageParams?.length === 1) {
          flatListRef.current?.scrollToOffset({ offset: 0 });
        }
        if (!res?.pages?.[0]?.data) {
          // Check if data exists
          return;
        }

        const allStoriesWithAds = [];
        let storyCounter = 0;
        for (const page of res.pages) {
          for (const story of page.data.stories) {
            allStoriesWithAds.push(story);
          }
        }

        setFilteredDataNotSeen(allStoriesWithAds);
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      enabled: !!userProfile?._id,
      refetchOnReconnect: true,
    },
  );

  const { isFetching: isFetchingStory } = useQuery(
    ['storyById', storyId],
    () =>
      request.get(
        `/story/${storyId}?lat=${location?.latitude}&long=${location?.longitude}`,
        {
          params: {
            userId: userProfile?._id,
          },
        },
      ),
    {
      enabled: !!storyId,
      onSuccess: res => {
        if (res?.data?.story?.author && !userProfile) {
          setUserProfile(res.data.story.author);
        }

        const filtered = filteredDataNotSeen?.filter(item => {
          return res?.data?.story?._id !== item?._id;
        });

        // Always update filteredData when story loads, merging it with the list
        if (filtered.length) {
          setFilteredData([res?.data?.story, ...filtered]);
        } else {
          // Fallback if list is empty but story loaded
          setFilteredData([res?.data?.story]);
        }
        updateViewsMutation.mutate(res?.data?.story?._id);
      },
      onError: () => {
        // If individual story load fails, still show the list!
        if (filteredDataNotSeen?.length && !filteredData.length) {
          setFilteredData(filteredDataNotSeen);
        }
      },
    },
  );

  // Late merge effect: If list arrives AFTER story is already shown
  useEffect(() => {
    if (filteredDataNotSeen?.length > 0 && storyId && filteredData.length === 1) {
      // We have the story (filteredData len 1) and now the list arrived. Merge them.
      const currentStory = filteredData[0];
      const others = filteredDataNotSeen.filter(x => x._id !== currentStory._id);
      setFilteredData([currentStory, ...others]);
    } else if (filteredDataNotSeen?.length > 0 && !storyId && filteredData.length === 0) {
      // Fallback for no storyId case
      setFilteredData(filteredDataNotSeen);
    }
  }, [filteredDataNotSeen, storyId]);
  useEffect(() => {
    setExtraData(e => !e);
  }, [activeVideoIndex, isFocused]);

  // PREFETCH VIDEOS: When active index changes, prefetch next 3 videos at network level
  useEffect(() => {
    if (filteredData?.length > 0 && isFocused) {
      prefetchVideosAroundIndex(filteredData, activeVideoIndex, 3);
    }
  }, [activeVideoIndex, filteredData, isFocused]);

  const onPressSearch = () => navigation.navigate(TabNav.Search);

  React.useEffect(() => {
    setStoryId(route.params?.storyId);
  }, [isFocused, route.params?.storyId]);

  const onPressAvailableLocation = (gov, areas) => {
    setSelectedAreas(areas);
    setselectedGov(gov);
    setIsLocationOpen(true);
    locationSheetRef.current?.show();
  };

  const renderReelComponent = useCallback(
    ({ item, index }) => {
      return (
        <ReelComponent
          item={item}
          i={index}
          isFromReelsOne={true}
          isFocused={isFocused}
          layoutHeight={layoutHeight || screenHeight}
          data={route?.params?.profile}
          userId={route?.params?.profile?._id}
          activeVideoIndex={activeVideoIndex}
          likeRef={likeRef}
          onPressAvailableLocation={onPressAvailableLocation}
          flatListRef={flatListRef}
          setExtraData={setExtraData}
          setSelectedPostId={setSelectedPostId}
          commentSheetRef={commentSheetRef}
          setselectedDescription={setselectedDescription}
          descriptionSheetRef={descriptionSheetRef}
          isLocationOpen={isLocationOpen}
        />
      );
    },
    [layoutHeight, route?.params?.profile._id, activeVideoIndex, isFocused, isLocationOpen],
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const updateViews = async s =>
    request.post('/views', {
      storyId: s,
      userId: route.params?.profile._id,
    });

  const updateViewsMutation = useMutation(updateViews);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const keyExtractor = (item, index) => 'item-ForYou' + item?._id + index;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  return (
    <SafeAreaView>
      <View style={{ height: '100%' }}>
        <View style={{ marginTop: 5 }}>
          <ZHeader
            title={customTitle || route?.params?.profile?.fullName}
            rightIcon={
              <TouchableOpacity onPress={onPressSearch}>
                <Ionicons
                  name="search-outline"
                  size={moderateScale(30)}
                  color={colors.white}
                />
              </TouchableOpacity>
            }
          />
        </View>

        <View
          style={[localStyles.outerContainer, { color: colors.backgroundColor }]}>
          <ReelsList
            filteredData={filteredData}
            extraData={extraData}
            isRefetching={isRefetching}
            refetch={refetch}
            user={route.params?.profile}
            keyExtractor={keyExtractor}
            renderReelComponent={renderReelComponent}
            viewConfig={viewConfig}
            viewableItemsChanged={viewableItemsChanged}
            layoutHeight={layoutHeight}
            // detailed loading logic:
            // 1. isLoading from network (list OR single story) && no data
            // 2. We have data in 'NotSeen' but haven't populated 'filteredData' yet (processing gap)
            isLoading={
              ((isLoading || isFetchingStory) && !filteredData.length) ||
              (filteredDataNotSeen.length > 0 && !filteredData.length)
            }
            onSetLayout={onSetLayout}
            emptylistMessage={strings.noPosts}
            flatListRef={flatListRef}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />

          <Comment
            SheetRef={commentSheetRef}
            postId={selectedPostId}
            currentUserId={route.params?._id}
          />
          <Description
            SheetRef={descriptionSheetRef}
            description={selectedDescription}
          />
          <Locations
            SheetRef={locationSheetRef}
            selectedAreas={selectedAreas}
            selectedGov={selectedGov}
            onClose={() => setIsLocationOpen(false)}
          />
          {!adFailedToLoad && (
            <View style={localStyles.bannerContainer}>
              <BannerAd
                unitId={
                  __DEV__
                    ? TestIds.BANNER
                    : Platform.OS === 'android'
                      ? 'ca-app-pub-2374540952576524/2502355239'
                      : 'ca-app-pub-2374540952576524/7194173394'
                }
                size={BannerAdSize.BANNER}
                onAdLoaded={() => setadFailedToLoad(false)}
                onAdFailedToLoad={() => setadFailedToLoad(true)}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: true,
                }}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outerContainer: {
    flex: 1,
  },
  muteIcon: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(30),
    ...styles.selfCenter,
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(52, 52, 52, 0.4)',
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
    top: moderateScale(35),
    zIndex: 1,
    right: 10,
    ...styles.ph20,
    // ...styles.flex,
    // marginTop: moderateScale(60),
    ...styles.rowSpaceBetween,
  },
  headerContainer3: {
    position: 'absolute',
    top: moderateScale(68),
    zIndex: 1,
    left: 0,
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
  bottomContainer: {
    position: 'absolute',
    bottom: 10,
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
  likeIcon: {
    position: 'absolute',
    top: screenFullHeight / 2 - moderateScale(160),
    ...styles.selfCenter,
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

  buttonContainer: {
    height: getHeight(50),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '100%',
    alignSelf: 'center',
  },
  buttonTag: {
    height: 30,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
  seekBar: {
    height: 40,
  },
});
