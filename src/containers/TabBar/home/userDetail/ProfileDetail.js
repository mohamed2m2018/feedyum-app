// Library import
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Locations from '../../../../components/models/Locations';
import React, {useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import ZLoader from '../../../../components/common/ZLoader';

// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZHeader from '../../../../components/common/ZHeader';
import {getHeight, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import images from '../../../../assets/images';
import ZButton from '../../../../components/common/ZButton';
import {LikeIconModal} from '../../../../assets/svgs';
import {StackNav} from '../../../../navigation/NavigationKeys';
import SuccessModal from '../../../../components/models/SuccessModal';
import ReelComponent from '../../../../components/ReelComponent';
import {UserDetailCategory} from '../../../../api/constant';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import {useHandleAuth} from '../../../../utils/useHandleAuth';


const RenderUserDetail = ({item}) => {
  return (
    <TouchableOpacity onPress={item?.onPress} style={styles.itemsCenter}>
      <ZText type="b24" align={'center'}>
        {item.value}
      </ZText>
      <ZText type="m16" align={'center'} style={styles.mt10}>
        {item.title}
      </ZText>
    </TouchableOpacity>
  );
};

export default function ProfileDetail({navigation, route}) {
  const {id} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const locationSheetRef = useRef('');
  const [selectedGov, setselectedGov] = useState('');
  const [selectedTab, setSelectedTab] = useState('posts'); // 'posts' or 'reviews'

  const {data: currentUserQuery} = useQuery(
    'user',
    () => request.get('/user'),
    {retry: 1},
  );

  const getFollowStatistics = () =>
    request.get(`/follow/statistics/${user?._id}`);

  const currentUser = currentUserQuery?.data?.user;
  const [isFollow, setIsFollow] = useState(false);

  const {data, isFetching: isFetchingUserDetailsFollowed} = useQuery(
    ['user', id],
    () =>
      request.get(`user/${id}`, {
        params: {
          currentUser,
        },
      }),
    {
      retry: 1,
      onSuccess: res => setIsFollow(res?.data?.currentUserFollowed),
    },
  );

  const {data: followStatistics} = useQuery(
    ['followStatistics', user?._id],
    () => getFollowStatistics(user?._id),
    {
      enabled: !!data?.data?.user,
    },
  );

  const getUserViews = () => request.get(`/views/user/${user?._id}`);

  const {data: views} = useQuery(['userViews', user?._id], getUserViews, {
    refetchInterval: false, // Disable auto-refresh
    enabled: !!data?.data?.user,
  });

  const {handleAuthToast} = useHandleAuth();
  const followMutation = useMutation(
    userToFollow => request.post('/follow', {userToFollow}),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: 'stories_following'});
        queryClient.invalidateQueries({queryKey: 'search_user'});
        queryClient.invalidateQueries({queryKey: 'followStatistics'});
        queryClient.invalidateQueries('IamFollowing');
        queryClient.invalidateQueries('IamFollowed');
      },
    },
  );

  const unfollowMutation = useMutation(
    userToUnfollow => request.delete('/follow', {data: {userToUnfollow}}),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: 'stories_following'});
        queryClient.invalidateQueries({queryKey: 'search_user'});
        queryClient.invalidateQueries({queryKey: 'followStatistics'});
        queryClient.invalidateQueries('IamFollowing');
        queryClient.invalidateQueries('IamFollowed');
      },
    },
  );
  const onPressFollow = () => {
    if (handleAuthToast()) {
      return;
    }
    if (isFollow) {
      unfollowMutation.mutate({_id: id});
    } else {
      followMutation.mutate({_id: id});
    }
    setIsFollow(!isFollow);
  };
  const fetchPosts = ({pageParam = 1}) =>
    request.get(`/story/author?id=${id}`, {
      params: {
        limit: 10,
        page: pageParam,
        excludeReviews: true, // Exclude review posts from regular posts
      },
    });

  const fetchReviewPosts = ({pageParam = 1}) =>
    request.get(`/story/author?id=${id}`, {
      params: {
        limit: 10,
        page: pageParam,
        reviewsOnly: true, // Only get review posts
      },
    });

  const {
    data: stories,
    fetchNextPage,
    isLoading,
  } = useInfiniteQuery(['user_stories', id], fetchPosts, {
    keepPreviousData: true,
    enabled: !!id && selectedTab === 'posts',
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.stories || []),
  });

  const {
    data: reviewStories,
    fetchNextPage: fetchNextReviewPage,
    isLoading: isLoadingReviews,
  } = useInfiniteQuery(['user_review_stories', id], fetchReviewPosts, {
    keepPreviousData: true,
    enabled: !!id && selectedTab === 'reviews',
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.stories || []),
  });

  // const categoryData = [
  //   {
  //     id: 0,
  //     icon: 'apps',
  //     onPress: () => setIsSelect(0),
  //   },
  //   {
  //     id: 1,
  //     icon: 'bookmark',
  //     onPress: () => setIsSelect(1),
  //   },
  //   {
  //     id: 2,
  //     icon: 'heart',
  //     onPress: () => setIsSelect(2),
  //   },
  // ];

  const onPressEditProfile = page =>
    navigation.navigate(StackNav.UserNetwork, {
      userId: user?._id,
      page,
      isOther: true,
    });

  // const onPressProfile = () => setModalVisible(true);
  const onPressModalClose = () => setModalVisible(false);



  const user = data?.data?.user;



  const onPressAvailableLocation = () => {
    setselectedGov(data?.data?.user?.locations);
    locationSheetRef.current?.show();
  };
  const renderHeader = () => (
    <View>
      <ZHeader />
      <View style={styles.itemsCenter}>
        <Image
          source={
            user?.avatar
              ? {uri: user?.avatar}
              : colors.dark
              ? images.userDark
              : images.userLight
          }
          style={localStyles.userImage}
        />
        <View style={styles.mv20}>
          <ZText type="b24" align={'center'}>
            {user?.fullName}
          </ZText>
          {user?.profileCompleted && (
            <ZText align={'center'} type="m10">
              {strings?.unofficial}
            </ZText>
          )}
          {/* <ZText type="m14" align={'center'} style={styles.mt10}>
                {user?.email}
            </ZText>
            {user?.bio && (
              <ZText
                type={'m16'}
                style={localStyles.bioIcon}
                color={colors.textColor}
                numberOfLines={2}>
                {user?.bio}
              </ZText>
            )} */}
        </View>
      </View>
      {user?.type === 'chef' && (
        <ZButton
          containerStyle={{
            height: 40,
            paddingHorizontal: 10,
            alignSelf: 'center',
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: 10,
          }}
          bgColor={colors.tranparent}
          textType={'m14'}
          color={colors.primary}
          onPress={onPressAvailableLocation}
          title={strings.branches}
        />
      )}
      <View style={localStyles.headerContainer}>
        {UserDetailCategory(
          user?.postsNo || 0,
          followStatistics?.data?.followersCount || 0,
          followStatistics?.data?.followingCount || 0,
          views?.data?.viewsCount || 0,
          () =>
            navigation.navigate(StackNav.UserNetwork, {userId: user?._id}),
        ).map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item?.onPress}
            style={styles.itemsCenter}>
            <ZText type="b24" align={'center'}>
              {item.value}
            </ZText>
            <ZText type="m16" align={'center'} style={styles.mt10}>
              {item.title}
            </ZText>
          </TouchableOpacity>
        ))}
      </View>
      <View style={localStyles.editProfileContainer}>
        <ZButton
          title={!isFollow ? strings.follow : strings.unfollow}
          onPress={onPressFollow}
          containerStyle={[
            localStyles.buttonContainer,
            {borderColor: colors.primary},
          ]}
          textType="b14"
          color={colors.white}
          disabled={isLoading}
          bgColor={colors.primary}
        />
        {/* Menu Button - Show for all users for now, can add chef condition later */}
        <TouchableOpacity
          style={[
            localStyles.stunningMenuButton,
            {backgroundColor: colors.primary},
          ]}
          onPress={() => {
            navigation.navigate(StackNav.ChefMenu, {
              chefId: user?._id,
              chefName: user?.fullName || user?.username || 'Chef',
            });
          }}
          activeOpacity={0.8}>
          <View style={localStyles.menuButtonContent}>
            <View style={localStyles.menuIconContainer}>
              <ZText type="b16" color={colors.white}>
                🍽️
              </ZText>
            </View>
            <ZText
              type="b14"
              color={colors.white}
              style={localStyles.menuButtonText}>
              View Menu
            </ZText>
          </View>
        </TouchableOpacity>
      </View>
      <View style={localStyles.clarificationContainer}>
        <ZText style={localStyles.clarificationText} type={'m14'}>
          {user?.type === 'chef'
            ? "📱 These are food reels • Tap 'View Menu' above to see actual dishes & order"
            : '📱 Food reels and posts'}
        </ZText>
      </View>
      
      {/* Tab buttons */}
      <View style={localStyles.tabContainer}>
        <TouchableOpacity
          style={[
            localStyles.tabButton,
            selectedTab === 'posts' && {borderBottomColor: colors.primary, borderBottomWidth: 2}
          ]}
          onPress={() => setSelectedTab('posts')}>
          <ZText type={selectedTab === 'posts' ? 'b16' : 'm16'} color={selectedTab === 'posts' ? colors.primary : colors.gray}>
            Posts
          </ZText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            localStyles.tabButton,
            selectedTab === 'reviews' && {borderBottomColor: colors.primary, borderBottomWidth: 2}
          ]}
          onPress={() => setSelectedTab('reviews')}>
          <ZText type={selectedTab === 'reviews' ? 'b16' : 'm16'} color={selectedTab === 'reviews' ? colors.primary : colors.gray}>
            Reviews
          </ZText>
        </TouchableOpacity>
      </View>
    </View>
  );



  // Get current data based on selected tab
  const currentData = selectedTab === 'posts' ? stories : reviewStories;
  const currentLoading = selectedTab === 'posts' ? isLoading : isLoadingReviews;
  const currentFetchNext = selectedTab === 'posts' ? fetchNextPage : fetchNextReviewPage;

  return (
    <ZSafeAreaView style={{flex: 1, backgroundColor: colors.backgroundColor}}>
      <FlatList
        data={currentData}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        key={selectedTab} // Force re-render when tab changes
        ListEmptyComponent={
          currentLoading ? (
            <ZLoader height={100} />
          ) : (
            <ZText style={{textAlign: 'center', marginTop: 45}} type={'B20'}>
              {selectedTab === 'posts' 
                ? (user?.type === 'chef' || user?.hasMenu)
                  ? "No food reels yet! Check the menu for dishes 🍽️"
                  : strings.noDishesYetProfileOther
                : "No review reels yet! Be the first to share your experience! ⭐"
              }
            </ZText>
          )
        }
        renderItem={({item, index}) => (
          <View style={localStyles.dishItemContainer}>
            <ReelComponent
              profileId={user}
              data={item?.views}
              item={item}
              reelUrl={
                item?.avatarUri?.replace(
                  'https://foodtokforever.s3.amazonaws.com',
                  'https://d1wfcrbbkg3bzd.cloudfront.net',
                ) ||
                item?.poster?.replace(
                  'https://foodtokforever.s3.amazonaws.com',
                  'https://d1wfcrbbkg3bzd.cloudfront.net',
                )
              }
              isPlay={!item?.avatarUri}
              id={item?._id}
            />
          </View>
        )}
        numColumns={3}
        onMomentumScrollBegin={currentFetchNext}
        keyExtractor={item => `${selectedTab}-${item?._id}`}
        columnWrapperStyle={localStyles.dishRowContainer}
        ItemSeparatorComponent={() => <View style={localStyles.dishRowSeparator} />}
      />
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={() => setModalVisible(false)}
        headerTitle={'27M Total Likes'}
        subTitle={'jenny_wilson received a total of 27M likes from all videos.'}
        itemImage={<LikeIconModal style={styles.selfCenter} />}
      />
      <Locations SheetRef={locationSheetRef} selectedGov={selectedGov} />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  root: {
    ...styles.flex,
    ...styles.ph20,
    ...styles.mb20,
  },
  headerContainer: {
    ...styles.flex,
    ...styles.flexRow,
    ...styles.alignCenter,
    ...styles.justifyBetween,
    ...styles.mt20,
  },
  bioIcon: {
    maxWidth: 260,
    marginRight: 5,
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editProfileContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mt25,
    marginBottom: 20,
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(40),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '40%',
    marginHorizontal: moderateScale(5),
  },
  stunningMenuButton: {
    height: getHeight(40),
    borderRadius: moderateScale(20),
    width: '40%',
    backgroundColor: '#FF4D67', // Background color for shadow efficiency
    marginHorizontal: moderateScale(5),
    shadowColor: '#FF4D67',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  menuButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
  },
  menuIconContainer: {
    marginRight: moderateScale(6),
  },
  menuButtonText: {
    letterSpacing: 0.5,
  },
  clarificationContainer: {
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.1)',
  },
  clarificationText: {
    lineHeight: moderateScale(18),
    fontStyle: 'italic',
  },
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
    ...styles.mt15,
  },
  tabItemStyle: {
    borderBottomWidth: moderateScale(2),
    width: '33%',
    ...styles.itemsCenter,
    ...styles.pv15,
  },
  dishItemContainer: {
    flex: 1,
    marginHorizontal: moderateScale(4),
  },
  dishRowContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(8),
  },
  dishRowSeparator: {
    height: moderateScale(8),
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
});
