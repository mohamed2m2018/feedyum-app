// Libraries import
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

// Local import
import { styles } from '../../../themes';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
  BOTTOM_TAB_HEIGHT,
  TOP_TAB_HEIGHT,
} from '../../../common/constants';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import {
  QueryClient,
  useMutation,
  useQuery,
} from 'react-query';
import ReelComponent from './ReelComponent';
import { ReelItem } from '../../../components/reel';
import request from '../../../api/request';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';
import ZLoader from '../../../components/common/ZLoader';
import { useLocation } from '../../../navigation/locationContext';
import { useStorage } from '../../../utils/useStorage';
import AddressDropdown from '../../../components/AddressDropdown';
import { useOptimizedReels, useOptimizedStory } from '../../../hooks/useOptimizedQueries';
import { prefetchImages } from '../../../utils/imageOptimizer';
import { prefetchVideosAroundIndex } from '../../../services/VideoPrefetchService';

// Module-level locked height removed in favor of dynamic calculation
// let GLOBAL_LOCKED_HEIGHT = 0;

export default function ReelsComponent({ amIFocused, initialStoryId }) {
  // Debug logging (can be removed in production)
  if (__DEV__) {
    console.log('🐞 [ReelsComponent] Mounting with initialStoryId:', initialStoryId);
  }

  const colors = useSelector(state => state.theme.theme);
  const isFocused = useIsFocused() && amIFocused;
  const commentSheetRef = useRef(null);
  const descriptionSheetRef = useRef(null);
  const locationSheetRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  const likeRef = useRef([]);

  // Deep link state - simplified
  const [deepLinkStoryId, setDeepLinkStoryId] = useState(initialStoryId);
  const [deepLinkStory, setDeepLinkStory] = useState(null);

  // UI state
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState();
  const [extraData, setExtraData] = useState(true);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedGov, setselectedGov] = useState('');
  const [categoryIds, setcategoryIds] = useState([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const [user] = useStorage('user');
  const location = useLocation();

  // Dynamic Height Calculation
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layoutHeight = useMemo(() =>
    Math.floor(windowHeight - insets.top - insets.bottom - BOTTOM_TAB_HEIGHT - TOP_TAB_HEIGHT),
    [windowHeight, insets.top, insets.bottom]
  );

  // When categoryIds change, show loading indicator
  useEffect(() => {
    if (categoryIds.length > 0) {
      setIsFilterLoading(true);
    }
  }, [categoryIds]);

  // Use optimized reels hook - fetches main feed
  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
    data: reelsData,
  } = useOptimizedReels(categoryIds);

  // Views mutation - defined early as it's used in multiple places
  const updateViews = async storyId =>
    request.post('/views', { storyId, userId: user?._id });
  const updateViewsMutation = useMutation(updateViews);

  // Use optimized story hook - fetches single story for deep links
  const {
    data: storyData,
    isLoading: isLoadingStory,
    isFetching: isFetchingStory,
  } = useOptimizedStory(deepLinkStoryId);

  // Handle deep link story when it arrives
  useEffect(() => {
    if (storyData?.story) {
      console.log('🐞 [ReelsComponent] Deep link story received:', storyData.story._id);
      setDeepLinkStory(storyData.story);
      setDeepLinkStoryId(null); // Clear to prevent re-fetching
      // Prepend deep link story to existing data (preserves any manually added posts)
      setFilteredData(prevData => {
        const filtered = (prevData || []).filter(item => storyData.story._id !== item._id);
        return [storyData.story, ...filtered];
      });
      flatListRef.current?.scrollToOffset({ offset: 0 });
      updateViewsMutation.mutate(storyData.story._id);
      setActiveVideoIndex(0);
    }
  }, [storyData]);

  // filteredData state - can be updated externally (e.g., when user adds a post)
  const [filteredData, setFilteredData] = useState([]);

  // Process main stories data - only updates when reelsData changes
  useEffect(() => {
    if (!reelsData?.pages?.[0]?.stories) {
      if (!isFetching && !isLoading && !isFilterLoading) {
        // Only clear if we don't have a deep link story
        if (!deepLinkStory) {
          setFilteredData([]);
        }
      }
      return;
    }

    const allStories = [];
    for (const page of reelsData.pages) {
      for (const story of page.stories) {
        allStories.push(story);
      }
    }

    // If we have a deep link story, ensure it stays at the front
    if (deepLinkStory) {
      const withoutDeepLink = allStories.filter(s => s._id !== deepLinkStory._id);
      setFilteredData([deepLinkStory, ...withoutDeepLink]);
    } else {
      setFilteredData(allStories);
    }
    setIsFilterLoading(false);
  }, [reelsData]);

  // Prefetch images when data changes
  useEffect(() => {
    if (filteredData.length > 0) {
      const imagesToPrefetch = filteredData
        .slice(0, 5)
        .filter(item => item.type !== 'ad')
        .map(story => story.poster || story.avatarUri)
        .filter(Boolean);

      prefetchImages(imagesToPrefetch, { concurrent: 2 });
      prefetchVideosAroundIndex(filteredData, 0, 5);
    }
  }, [filteredData]);

  // Determine if we're waiting for deep link content
  const isWaitingForDeepLink = !!deepLinkStoryId && (isLoadingStory || isFetchingStory);

  // Update extraData to trigger re-renders when needed
  useEffect(() => {
    setExtraData(e => !e);
  }, [activeVideoIndex, isFocused, isCommentOpen]);

  // Prefetch videos when scrolling
  useEffect(() => {
    if (filteredData?.length > 0 && isFocused) {
      prefetchVideosAroundIndex(filteredData, activeVideoIndex, 3);
    }
  }, [activeVideoIndex, filteredData, isFocused]);

  // Handle new deep link storyId from route params (for foreground deep links)
  useEffect(() => {
    const newStoryId = route.params?.storyId || initialStoryId;
    if (newStoryId && newStoryId !== deepLinkStoryId && !deepLinkStory) {
      console.log('🐞 [ReelsComponent] New storyId from route:', newStoryId);
      setDeepLinkStoryId(newStoryId);
    }
  }, [route.params, initialStoryId]);

  const onPressAvailableLocation = locations => {
    setselectedGov(locations);
    setIsLocationOpen(true);
    locationSheetRef.current?.show();
  };

  const renderReelComponent = useCallback(
    ({ item, index }) => {
      return (
        <ReelItem
          item={item}
          i={index}
          isFocused={isFocused}
          layoutHeight={layoutHeight}
          userId={user?._id}
          data={user}
          activeVideoIndex={activeVideoIndex}
          likeRef={likeRef}
          onPressAvailableLocation={onPressAvailableLocation}
          flatListRef={flatListRef}
          setExtraData={setExtraData}
          setSelectedPostId={setSelectedPostId}
          commentSheetRef={commentSheetRef}
          setselectedDescription={setselectedDescription}
          isCommentOpen={isCommentOpen}
          isLocationOpen={isLocationOpen}
          setIsCommentOpen={setIsCommentOpen}
          descriptionSheetRef={descriptionSheetRef}
          currentUserId={user?._id}
        />
      );
    },
    [layoutHeight, user, activeVideoIndex, isFocused, isCommentOpen, isLocationOpen],
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
    }
    if (viewableItems?.[0]?.index === activeVideoIndex) {
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const keyExtractor = (item, index) => 'item-ForYou' + item?._id + index;



  // No-op for onLayout as we strictly calculate height now
  const onSetLayout = useCallback(() => { }, []);

  return (
    <View style={[localStyles.outerContainer, { backgroundColor: colors.backgroundColor }]}>
      {/* Address Dropdown for Delivery Location */}
      <View style={localStyles.addressDropdownContainer}>
        <AddressDropdown
          compact={true}
          style={{
            width: moderateScale(140), // Fixed width to match discover
          }}
        />
      </View>
      {/* Only show this loader when NOT coming from deep link - ReelsList handles deep link loading */}
      {isLoadingStory && !initialStoryId && <ZLoader absolute height={100} top={300} />}

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(StackNav.SelectCategory, {
            setcategoryIds,
            categoryIds,
          });
        }}
        style={localStyles.headerContainer2}>
        <MaterialCommunityIcons
          name={categoryIds?.length ? 'filter-plus' : 'filter-outline'}
          size={moderateScale(30)}
          color={categoryIds?.length ? colors.primary : colors.white}
        />
      </TouchableOpacity>

      <ReelsList
        filteredData={filteredData}
        extraData={extraData}
        isRefetching={isRefetching}
        isFetching={isFetching}
        isFetchingStory={isFetchingStory}
        isWaitingForDeepLinkStory={isWaitingForDeepLink}
        refetch={refetch}
        user={user}
        keyExtractor={keyExtractor}
        renderReelComponent={renderReelComponent}
        viewConfig={viewConfig}
        viewableItemsChanged={viewableItemsChanged}
        layoutHeight={layoutHeight}
        isLoading={isLoading || isFilterLoading}
        activeVideoIndex={activeVideoIndex}
        setActiveVideoIndex={setActiveVideoIndex}
        onSetLayout={onSetLayout}
        emptylistMessage={strings.noDishesYetForYou}
        flatListRef={flatListRef}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isCommentOpen={isCommentOpen}
      />

      <Comment
        SheetRef={commentSheetRef}
        postId={selectedPostId || filteredData?.[0]?._id}
        currentUserId={user?._id}
        onOpen={() => setIsCommentOpen(true)}
        onClose={() => setIsCommentOpen(false)}
      />
      <Description
        SheetRef={descriptionSheetRef}
        description={selectedDescription}
      />
      <Locations SheetRef={locationSheetRef} selectedGov={selectedGov} onClose={() => setIsLocationOpen(false)} />
      {/* {!adFailedToLoad && (
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
      )} */}
    </View>
  );
}

const localStyles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 50,
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
  buttonTag: {
    height: 30,
    paddingHorizontal: 10,
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
    top: moderateScale(35),
    zIndex: 1,
    left: -5,
    ...styles.ph20,
    // ...styles.flex,
    // marginTop: moderateScale(60),
    ...styles.rowSpaceBetween,
  },
  headerContainer4: {
    position: 'absolute',
    top: moderateScale(80),
    zIndex: 1,
    left: -10,
    ...styles.ph20,
    // ...styles.flex,
    // marginTop: moderateScale(60),
    ...styles.rowSpaceBetween,
  },
  headerContainer2: {
    position: 'absolute',
    top: moderateScale(80),
    zIndex: 1,
    right: 30,
    ...styles.rowSpaceBetween,
  },
  addressDropdownContainer: {
    position: 'absolute',
    top: moderateScale(15), // Move higher to avoid any overlaps
    right: moderateScale(15),
    zIndex: 999,
    width: moderateScale(140), // Fixed width to match discover
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
    height: getHeight(30),
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(1),
    paddingHorizontal: 8,
    borderColor: 'transparent',
    alignSelf: 'center',
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
