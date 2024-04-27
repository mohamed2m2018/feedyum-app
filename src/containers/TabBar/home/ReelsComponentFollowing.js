// Libraries import
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useIsFocused, useNavigation} from '@react-navigation/native';

// Local import
import {styles} from '../../../themes';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
} from '../../../common/constants';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {useInfiniteQuery, useMutation} from 'react-query';
import ReelComponent from './ReelComponent';
import request from '../../../api/request';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';
import {useLocation} from '../../../navigation/locationContext';
import ZButton from '../../../components/common/ZButton';
import {useStorage} from '../../../utils/useStorage';

export default function ReelsComponent() {
  const colors = useSelector(state => state.theme.theme);
  const isFocused = useIsFocused();
  const commentSheetRef = useRef('');
  const descriptionSheetRef = useRef('');
  const [adFailedToLoad, setadFailedToLoad] = useState(false);
  const locationSheetRef = useRef('');
  const navigation = useNavigation();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState();
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [extraData, setExtraData] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const flatListRef = useRef(null);
  const likeRef = useRef([]);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedGov, setselectedGov] = useState('');
  const [categoryIds, setcategoryIds] = useState([]);
  const [user] = useStorage('user');

  const location = useLocation();

  const fetchReelsFollowing = page =>
    request.get(
      `/story/following?limit=10&page=${page}&userId=${user?._id}&lat=${location?.latitude}&long=${location?.longitude}&categoryIds=${categoryIds}`,
    );

  const {
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
    isFetching,
  } = useInfiniteQuery(
    ['stories_following', user?._id, categoryIds?.toLocaleString()],
    ({pageParam = 1}) => fetchReelsFollowing(pageParam),
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
        if (res?.pages?.[0]?.data === undefined) {
          return;
        }
        if (res?.pages?.[0]?.data?.stories?.length === 0) {
          setFilteredData([]);
          return;
        }
        const result = res?.pages.flatMap((page, index) => {
          const stories = [
            ...page.data?.stories,
            {
              _id: 'ad' + index + 1,
              type: 'ad',
            },
          ];
          return [...(stories || [])];
        });
        if (result.length > 1) {
          setFilteredData(result);
        }
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!user?._id,
      refetchOnReconnect: false,
    },
  );

  useEffect(() => {
    setExtraData(e => !e);
  }, [activeVideoIndex, isFocused]);

  const onPressSearch = () => navigation.navigate(TabNav.Search);

  const onPressAvailableLocation = locations => {
    setselectedGov(locations);
    locationSheetRef.current?.show();
  };

  const renderReelComponent = useCallback(
    ({item, index}) => {
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
          descriptionSheetRef={descriptionSheetRef}
        />
      );
    },
    [layoutHeight, user, activeVideoIndex, isFocused],
  );

  const viewConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const updateViews = async s =>
    request.post('/views', {
      storyId: s,
      userId: user?._id,
    });

  const updateViewsMutation = useMutation(updateViews);

  const viewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
    }
    if (viewableItems?.[0]?.index === activeVideoIndex) {
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const keyExtractor = (item, index) => 'item-Following' + item?._id + index;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  return (
    <View style={[localStyles.outerContainer, {color: colors.backgroundColor}]}>
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
              filteredData?.[activeVideoIndex]?.kmAway
                ? filteredData?.[activeVideoIndex]?.kmAway?.toFixed(2) +
                  strings.kmAway
                : strings.clickbranches
            }
          />
        </View>
      )}
      {/* {filteredData?.[activeVideoIndex]?.type !== 'ad' && (
        <View style={localStyles.headerContainer4}>
          <ZButton
            disabled={true}
            type="m14"
            containerStyle={localStyles.buttonTag}
            title={filteredData?.[activeVideoIndex]?.category?.[0]?.name}
          />
        </View>
      )} */}
      <View style={localStyles.headerContainer}>
        <TouchableOpacity onPress={onPressSearch}>
          <Ionicons
            name="search-outline"
            size={moderateScale(30)}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
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
      />

      <Comment
        SheetRef={commentSheetRef}
        postId={selectedPostId || filteredData?.[0]?._id}
        currentUserId={user?._id}
      />
      <Description
        SheetRef={descriptionSheetRef}
        description={selectedDescription}
      />
      <Locations SheetRef={locationSheetRef} selectedGov={selectedGov} />
      {!adFailedToLoad && (
        <View style={localStyles.bannerContainer}>
          <BannerAd
            unitId={
              __DEV__
                ? TestIds.BANNER
                : Platform.OS === 'android'
                ? 'ca-app-pub-2374540952576524/2502355239 '
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
