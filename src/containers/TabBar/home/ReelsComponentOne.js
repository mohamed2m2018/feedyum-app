/* eslint-disable react-hooks/exhaustive-deps */
// Libraries import
import {StyleSheet, TouchableOpacity, View, Platform} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useIsFocused, useNavigation, useRoute} from '@react-navigation/native';

// Local import
import {styles} from '../../../themes';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
  screenHeight,
} from '../../../common/constants';
import {TabNav} from '../../../navigation/NavigationKeys';
import {useInfiniteQuery, useMutation, useQuery} from 'react-query';
import ReelComponent from './ReelComponent';
import request from '../../../api/request';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';
import ZHeader from '../../../components/common/ZHeader';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLocation} from '../../../navigation/locationContext';
import ZButton from '../../../components/common/ZButton';

export default function ReelsComponentOne() {
  const [storyId, setStoryId] = useState();
  const colors = useSelector(state => state.theme.theme);
  const isFocused = useIsFocused();
  const commentSheetRef = useRef('');
  const descriptionSheetRef = useRef('');
  const [adFailedToLoad, setadFailedToLoad] = useState(false);
  const locationSheetRef = useRef('');
  const navigation = useNavigation();
  const route = useRoute();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState();
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [extraData, setExtraData] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [filteredDataNotSeen, setFilteredDataNotSeen] = useState([]);
  const location = useLocation();

  const flatListRef = useRef(null);
  const likeRef = useRef([]);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGov, setselectedGov] = useState('');

  const fetchReels = page =>
    request.get(
      `/story/author?limit=15&page=${page}&id=${route.params?.profile?._id}&&lat=${location?.latitude}&long=${location?.longitude}`,
    );

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching: isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ['stories-user', route?.params?.profile._id],
    ({pageParam = 1}) => fetchReels(pageParam),
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
          flatListRef.current?.scrollToOffset({offset: 0});
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
            storyCounter++;

            if (storyCounter % 5 === 0) {
              allStoriesWithAds.push({_id: `ad-${storyCounter}`, type: 'ad'});
            }
          }
        }

        // Ensure at least one ad even for less than 5 stories
        if (allStoriesWithAds.length > 0 && storyCounter < 5) {
          allStoriesWithAds.push({_id: 'ad-end', type: 'ad'});
        }

        setFilteredDataNotSeen(allStoriesWithAds);
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      enabled: !!route.params?.profile._id,
      refetchOnReconnect: true,
    },
  );

  useQuery(
    ['storyById', storyId],
    () =>
      request.get(
        `/story/${storyId}?lat=${location?.latitude}&long=${location?.longitude}`,
        {
          params: {
            userId: route.params?.profile._id,
          },
        },
      ),
    {
      enabled: !!filteredDataNotSeen?.length && !!storyId,
      onSuccess: res => {
        const filtered = filteredDataNotSeen?.filter(item => {
          return res?.data?.story?._id !== item?._id;
        });
        if (filtered.length && !filteredData.length) {
          setFilteredData([res?.data?.story, ...filtered]);
        }
        updateViewsMutation.mutate(res?.data?.story?._id);
      },
      onError: err => console.log('err ', err),
    },
  );
  useEffect(() => {
    setExtraData(e => !e);
  }, [activeVideoIndex, isFocused]);

  const onPressSearch = () => navigation.navigate(TabNav.Search);

  React.useEffect(() => {
    setStoryId(route.params?.storyId);
  }, [isFocused, route.params?.storyId]);

  const onPressAvailableLocation = (gov, areas) => {
    setSelectedAreas(areas);
    setselectedGov(gov);
    locationSheetRef.current?.show();
  };

  const renderReelComponent = useCallback(
    ({item, index}) => {
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
        />
      );
    },
    [layoutHeight, route?.params?.profile._id, activeVideoIndex, isFocused],
  );

  const viewConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const updateViews = async s =>
    request.post('/views', {
      storyId: s,
      userId: route.params?.profile._id,
    });

  const updateViewsMutation = useMutation(updateViews);

  const viewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const keyExtractor = (item, index) => 'item-ForYou' + item?._id + index;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  return (
    <SafeAreaView>
      <View style={{height: '100%'}}>
        <View style={{marginTop: 5}}>
          <ZHeader
            title={route?.params?.profile?.fullName}
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
        {filteredData?.[activeVideoIndex]?.type !== 'ad' && (
          <View style={localStyles.headerContainer3}>
            <ZButton
              onPress={() => {
                onPressAvailableLocation(
                  filteredData?.[activeVideoIndex]?.author?.locations,
                );
              }}
              type="m14"
              containerStyle={localStyles.buttonTag}
              title={
                filteredData?.[activeVideoIndex]?.kmAway && filteredData?.[activeVideoIndex]?.kmAway !== null
                  ? filteredData?.[activeVideoIndex]?.kmAway?.toFixed(2) +
                    strings.kmAway
                  : strings.clickbranches
              }
            />
          </View>
        )}
        <View
          style={[localStyles.outerContainer, {color: colors.backgroundColor}]}>
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
            isLoading={isLoading || !filteredData.length}
            onSetLayout={onSetLayout}
            emptylistMessage={strings.noDishesYetForYou}
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
