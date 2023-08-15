// Libraries import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Description from '../../../components/models/Descriptions';
import Locations from '../../../components/models/Locations';
import Comment from '../../../components/models/Comment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useIsFocused, useNavigation} from '@react-navigation/native';

// Local import
import {styles} from '../../../themes';
import {
  getHeight,
  isAndroid,
  moderateScale,
  screenFullHeight,
  screenHeight,
} from '../../../common/constants';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {useInfiniteQuery, useMutation, useQuery} from 'react-query';
import ReelComponent from './ReelComponent';
import request from '../../../api/request';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import ReelsList from './ReelsList';
import strings from '../../../i18n/strings';

export default function ReelsComponentFollowing() {
  const colors = useSelector(state => state.theme.theme);
  const commentSheetRef = useRef('');
  const descriptionSheetRef = useRef('');
  const locationSheetRef = useRef('');
  const navigation = useNavigation();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [extraData, setExtraData] = useState(true);
  const isFocused = useIsFocused();
  const [filteredDataFollowing, setFilteredDataFollowing] = useState([]);
  const flatListRefFollowing = useRef(null);
  const likeRef = useRef([]);
  const [selectedDescription, setselectedDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGov, setselectedGov] = useState('');

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});
  const fetchReelsFollowing = page =>
    request.get(
      `/story/following?limit=10&page=${page}&userId=${data?.data?.user?._id}`,
    );
  const {
    hasNextPage: hasNextPageFollowin,
    fetchNextPage: fetchNextPageFollowing,
    isFetchingNextPage: isFetchingNextPageFollowing,
    isLoading: isLoadingFollowing,
    refetch,
    isRefetching,
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
        const ad = {_id: 'ad' + res?.pageParams?.length, type: 'ad'};
        const result = res?.pages.flatMap(page =>
          page.data?.stories?.length ? [...(page.data?.stories || []), ad] : [],
        );
        if (result.length) {
          setFilteredDataFollowing(result);
        }
      },
      onError: error =>
        error?.nostories ? setFilteredDataFollowing([]) : null,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!data?.data?.user?._id,
      refetchOnReconnect: true,
    },
  );

  useEffect(() => {
    setExtraData(!extraData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoIndex, isFocused]);

  const onPressSearch = () => navigation.navigate(TabNav.Search);

  const [selectedPostId, setSelectedPostId] = useState();

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
          isFocused={isFocused}
          layoutHeight={layoutHeight || screenHeight}
          data={data}
          activeVideoIndex={activeVideoIndex}
          likeRef={likeRef}
          onPressAvailableLocation={onPressAvailableLocation}
          flatListRef={flatListRefFollowing}
          setExtraData={setExtraData}
          setSelectedPostId={setSelectedPostId}
          commentSheetRef={commentSheetRef}
          setselectedDescription={setselectedDescription}
          descriptionSheetRef={descriptionSheetRef}
        />
      );
    },
    [layoutHeight, data, activeVideoIndex, isFocused],
  );

  const viewConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const updateViews = async storyId => {
    request.post('/views', {
      storyId,
      userId: data?.data?.user?._id,
    });
  };

  const updateViewsMutation = useMutation(updateViews);

  const viewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length) {
      setActiveVideoIndex(viewableItems[0].index);
      updateViewsMutation.mutate(viewableItems[0]?.item?._id);
    }
  }).current;

  const keyExtractor = item => 'item-Following' + item?._id;

  const onSetLayout = e => setLayoutHeight(e.nativeEvent.layout.height);

  return (
    <View style={[localStyles.outerContainer, {color: colors.backgroundColor}]}>
      <View style={localStyles.headerContainer}>
        <TouchableOpacity onPress={onPressSearch}>
          <Ionicons
            name="search-outline"
            size={moderateScale(30)}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
      <ReelsList
        filteredData={filteredDataFollowing}
        extraData={extraData}
        emptylistMessage={strings.noDishesYetFollow}
        user={data?.data?.user}
        keyExtractor={keyExtractor}
        renderReelComponent={renderReelComponent}
        viewConfig={viewConfig}
        isRefetching={isRefetching}
        refetch={refetch}
        viewableItemsChanged={viewableItemsChanged}
        layoutHeight={layoutHeight}
        isLoading={isLoadingFollowing}
        onSetLayout={onSetLayout}
        flatListRef={flatListRefFollowing}
        isFetchingNextPage={isFetchingNextPageFollowing}
        hasNextPage={hasNextPageFollowin}
        fetchNextPage={fetchNextPageFollowing}
      />

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
      <View style={localStyles.bannerContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
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
    right: 10,
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
