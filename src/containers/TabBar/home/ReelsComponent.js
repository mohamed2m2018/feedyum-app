// Libraries import
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import DeepLinkingService from '../../../services/DeepLinkingService';

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
import request from '../../../api/request';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';
import { OneSignal } from 'react-native-onesignal';
import { showSuccessToast } from '../../../utils/toast';
import ZLoader from '../../../components/common/ZLoader';
import { useLocation } from '../../../navigation/locationContext';
import ZButton from '../../../components/common/ZButton';
import { useStorage } from '../../../utils/useStorage';
import AddressDropdown from '../../../components/AddressDropdown';
import { useOptimizedReels, useOptimizedStory } from '../../../hooks/useOptimizedQueries';
import { optimizeImageUrl, prefetchImages } from '../../../utils/imageOptimizer';

// Module-level locked height removed in favor of dynamic calculation
// let GLOBAL_LOCKED_HEIGHT = 0;

export default function ReelsComponent({ amIFocused }) {
  const [storyId, setStoryId] = useState();
  const colors = useSelector(state => state.theme.theme);
  const isFocused = useIsFocused() && amIFocused;
  const commentSheetRef = useRef(null);
  const descriptionSheetRef = useRef(null);
  const [notificationReceived, setnotificationReceived] = useState(false);
  const [adFailedToLoad, setadFailedToLoad] = useState(false);
  const locationSheetRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();

  // Dynamic Height Calculation
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Constants based on navigation structure
  // BOTTOM_TAB_HEIGHT and TOP_TAB_HEIGHT are imported from constants.js

  // Calculate exact available space
  const calculatedHeight = Math.floor(windowHeight - insets.top - insets.bottom - BOTTOM_TAB_HEIGHT - TOP_TAB_HEIGHT);

  const [layoutHeight, setLayoutHeight] = useState(calculatedHeight);
  const layoutHeightRef = useRef(calculatedHeight);

  // Update if dimensions or insets change
  useEffect(() => {
    const newHeight = Math.floor(windowHeight - insets.top - insets.bottom - BOTTOM_TAB_HEIGHT - TOP_TAB_HEIGHT);
    if (newHeight !== layoutHeightRef.current) {
      layoutHeightRef.current = newHeight;
      setLayoutHeight(newHeight);
    }
  }, [windowHeight, insets]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState();
  const [extraData, setExtraData] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const flatListRef = useRef(null);
  const likeRef = useRef([]);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedGov, setselectedGov] = useState('');
  const [queryClient] = React.useState(() => new QueryClient());
  const [categoryIds, setcategoryIds] = useState([]);
  const [user] = useStorage('user');
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const location = useLocation();



  // Use optimized reels hook
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

  // Process data and add ads
  useEffect(() => {
    if (!reelsData?.pages?.[0]?.stories) {
      setFilteredData([]);
      return;
    }

    const allStoriesWithAds = [];
    let storyCounter = 0;

    for (const page of reelsData.pages) {
      for (const story of page.stories) {
        allStoriesWithAds.push(story);
      }
    }

    setFilteredData(allStoriesWithAds);

    // Prefetch images for next few items
    if (allStoriesWithAds.length > 0) {
      const imagesToPrefetch = allStoriesWithAds
        .slice(0, 5) // Prefetch first 5 items
        .filter(item => item.type !== 'ad')
        .map(story => story.poster || story.avatarUri)
        .filter(Boolean);

      prefetchImages(imagesToPrefetch, { concurrent: 2 });
    }
  }, [reelsData]);

  // Use optimized story hook
  const {
    data: storyData,
    refetch: refetchStory,
    isLoading: isLoadingStory,
    isFetching: isFetchingStory,
  } = useOptimizedStory(storyId);

  // Handle story data when it arrives
  useEffect(() => {
    if (storyData?.story && filteredData?.length) {
      const filtered = filteredData.filter(item => {
        return storyData.story._id !== item._id;
      });
      if (filtered.length) {
        setFilteredData([storyData.story, ...filtered]);
      }
      flatListRef.current?.scrollToOffset({ offset: 0 });
      updateViewsMutation.mutate(storyData.story._id);
      setActiveVideoIndex(0);
      setStoryId(null);
    }


  }, [storyData, filteredData]);
  useEffect(() => {
    setExtraData(e => !e);
  }, [activeVideoIndex, isFocused, isCommentOpen]); // Restored activeVideoIndex - FlatList handles this efficiently

  const onPressSearch = () => navigation.navigate(TabNav.Search);

  useEffect(() => {
    // Initialize deep linking service
    const deepLinkingService = DeepLinkingService.getInstance();

    // Set navigation reference if not already set
    if (navigation && !DeepLinkingService.navigationRef) {
      DeepLinkingService.setNavigationRef(navigation);
    }

    // Initialize the service to handle incoming links
    const cleanup = deepLinkingService.addEventListeners();

    // Handle initial URL if app was launched from a link
    deepLinkingService.getInitialURL();

    return cleanup;
  }, [navigation]);

  React.useEffect(() => {
    setStoryId(route.params?.storyId);
  }, [route.params]);

  const onPressAvailableLocation = locations => {
    setselectedGov(locations);
    setIsLocationOpen(true);
    locationSheetRef.current?.show();
  };

  const renderReelComponent = useCallback(
    ({ item, index }) => {
      return (
        <ReelComponent
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
        />
      );
    },
    [layoutHeight, user, activeVideoIndex, isFocused, isCommentOpen, isLocationOpen], // Restored activeVideoIndex - FlatList handles this efficiently
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const updateViews = async s =>
    request.post('/views', {
      storyId: s,
      userId: user?._id,
    });

  const updateViewsMutation = useMutation(updateViews);

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
          onAddressSelect={address => {
            // You can add logic here to filter content by delivery area if needed
          }}
        />
      </View>
      {isLoadingStory && <ZLoader absolute height={100} top={300} />}

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(StackNav.SelectCategory, {
            setcategoryIds,
            categoryIds,
            setFilteredData: setFilteredData,
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
        refetch={refetch}
        user={user}
        keyExtractor={keyExtractor}
        renderReelComponent={renderReelComponent}
        viewConfig={viewConfig}
        viewableItemsChanged={viewableItemsChanged}
        layoutHeight={layoutHeight}
        isLoading={isLoading}
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
