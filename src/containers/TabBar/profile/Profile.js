// Library import
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import { useSelector } from 'react-redux';
import { styles } from '../../../themes';
import { getHeight, moderateScale } from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import images from '../../../assets/images';
import ZButton from '../../../components/common/ZButton';
import { Inbox_Dark } from '../../../assets/svgs';
import ReelComponent from '../../../components/ReelComponent';
import { useQuery } from 'react-query';
import request from '../../../api/request';
import { Toast, ALERT_TYPE } from 'react-native-alert-notification';
import { useHandleAuth } from '../../../utils/useHandleAuth';
import { useIsFocused } from '@react-navigation/native';
import { useScreen } from '../../../navigation/screenContext';
import ZLoader from '../../../components/common/ZLoader';

export default function Profile({ navigation }) {
  const UserDetail = (postsNo, followersNo, followingNo, viewsNo) => [
    {
      title: strings.post,
      value: postsNo,
    },
    {
      title: strings.followers,
      value: followersNo,
      onPress: () => {
        navigation.navigate(StackNav.UserNetwork, {
          userId: user?._id,
          page: strings.followers,
        });
      },
    },
    {
      title: strings.following,
      value: followingNo,
      onPress: () =>
        navigation.navigate(StackNav.UserNetwork, {
          userId: user?._id,
          page: strings.following,
        }),
    },
    {
      title: strings.Views,
      value: viewsNo || 0,
    },
  ];
  const colors = useSelector(state => state.theme.theme);

  const [page, setpage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [refreshing, setRefreshing] = useState(false);

  const [isLoadingSomething, setisLoadingSomething] = useState();

  const { data, refetch } = useQuery('user', () => request.get('/user'), { retry: 1 });

  const user = data?.data?.user;
  const getUserViews = () => request.get(`/views/user/${user?._id}`);

  const getFollowStatistics = () =>
    request.get(`/follow/statistics/${user?._id}`);

  const { data: followStatistics, refetch: refetchFollowStats } = useQuery(
    ['followStatistics', user?._id],
    () => getFollowStatistics(user?._id),
  );

  const { data: views, refetch: refetchViews } = useQuery(['userViews', user?._id], getUserViews, {
    refetchInterval: 30000,
  });

  const fetchPosts = () =>
    request.get(`/story/author?id=${user?._id}`, {
      params: {
        limit: 10,
        page,
        excludeReviews: true, // Exclude review posts from regular posts
      },
    });

  const fetchReviewPosts = () =>
    // If user is a chef, fetch reviews RECEIVED (reviews of their dishes/menu)
    // If not a chef, fetch reviews AUTHORED (reviews they wrote)
    request.get(`/story/author?id=${user?._id}`, {
      params: {
        limit: 10,
        page: reviewsPage,
        reviewsOnly: user?.type !== 'chef', // Get authored reviews for regular users
        receivedReviews: user?.type === 'chef', // Get received reviews for chefs
      },
    });

  const [storiesData, setstoriesData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);

  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['profile-stories', page],
    queryFn: () => fetchPosts(page),
    enabled: !!data?.data?.user?._id && selectedTab === 'posts',
    onSuccess: res => {
      if (res?.data?.currentPage === '1') {
        setstoriesData(res?.data?.stories);
        setpage(1);
      } else {
        setstoriesData([...storiesData, ...res?.data?.stories]);
      }
    },
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: err[Object.keys(err)?.[0]],
      });
    },
  });

  const {
    data: reviewQueryData,
    isLoading: reviewsLoading,
    isFetching: reviewsFetching,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['profile-reviews', reviewsPage],
    queryFn: () => fetchReviewPosts(reviewsPage),
    enabled: !!data?.data?.user?._id && selectedTab === 'reviews',
    onSuccess: res => {
      if (res?.data?.currentPage === '1') {
        setReviewsData(res?.data?.stories);
        setReviewsPage(1);
      } else {
        setReviewsData([...reviewsData, ...res?.data?.stories]);
      }
    },
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: err[Object.keys(err)?.[0]],
      });
    },
  });

  const onDeletePost = (id) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setisLoadingSomething(true);
            const { data } = await request.delete(`/story/${id}`);
            if (data?.success) {
              if (selectedTab === 'posts') {
                refetchPosts();
              } else {
                refetchReviews();
              }
              Toast.show({
                type: ALERT_TYPE.SUCCESS,
                title: strings?.success || 'Success',
                textBody: 'Post deleted successfully',
              });
            }
          } catch (error) {
            Toast.show({
              type: ALERT_TYPE.DANGER,
              title: strings?.error || 'Error',
              textBody: error?.response?.data?.message || 'Something went wrong',
            });
          } finally {
            setisLoadingSomething(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchFollowStats(),
        refetchViews(),
        selectedTab === 'posts' ? refetchPosts() : refetchReviews(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const onPressEditProfile = isEditBio => {
    navigation.navigate(StackNav.SetUpProfile, {
      title: strings.editProfile,
      isEditBio,
      type: user?.type,
    });
  };

  const onPressSetting = () => navigation.navigate(StackNav.Setting);

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderUserDetail = ({ item }) => {
    return (
      <TouchableOpacity onPress={item.onPress} style={[styles.itemsCenter, localStyles.statsContainer]}>
        <ZText type="b24" align={'center'} style={localStyles.statsNumber}>
          {item.value}
        </ZText>
        <ZText type="m16" align={'center'} style={[styles.mt10, localStyles.statsLabel]}>
          {item.title}
        </ZText>
      </TouchableOpacity>
    );
  };

  // Profile Header Component
  const ProfileHeader = () => (
    <View style={localStyles.headerContent}>
      {/* Profile Header */}
      <View style={localStyles.headerContainer}>
        <TouchableOpacity onPress={onPressSetting}>
          <Ionicons
            name="settings-outline"
            size={moderateScale(24)}
            color={colors.dark ? colors.white : colors.darkColor}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsCenter}>
        <TouchableOpacity onPress={() => onPressEditProfile(false)}>
          <Image
            source={
              user?.avatar
                ? { uri: user?.avatar }
                : colors.dark
                  ? images.userDark
                  : images.userLight
            }
            style={localStyles.userImage}
          />
          <MaterialIcon
            name="pencil-box"
            size={moderateScale(24)}
            color={colors.primary}
            style={localStyles.editIcon}
          />
        </TouchableOpacity>
        <View style={styles.mv20}>
          <ZText type="b24" align={'center'}>
            {user?.fullName}
          </ZText>
          {user?.profileCompleted && (
            <ZText type="m10" align={'center'}>
              {strings?.unofficial}
            </ZText>
          )}
          <ZText type="m14" align={'center'} style={styles.mt10}>
            {user?.email}
          </ZText>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressEditProfile(true)}
            style={localStyles.bioContainer}>
            <ZText
              type={user?.bio ? 'm16' : 'm14'}
              align={'center'}
              color={user?.bio ? colors.textColor : colors.background}
              style={[styles.mt10, localStyles.bioText]}>
              {user?.bio ?? strings.addBio}
            </ZText>
            <MaterialIcon
              name="pencil-box"
              size={moderateScale(20)}
              style={localStyles.bioIcon}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.flexRow, styles.justifyEvenly]}>
        {UserDetail(
          user?.postsNo,
          followStatistics?.data?.followersCount,
          followStatistics?.data?.followingCount,
          views?.data?.viewsCount || 0,
        ).map((item, index) => (
          <RenderUserDetail item={item} key={index} />
        ))}
      </View>

      <View style={localStyles.actionButtonsContainer}>
        <TouchableOpacity
          style={[localStyles.iconButton, { borderColor: colors.primary }]}
          onPress={() => onPressEditProfile(false)}
        >
          <MaterialIcon
            name="account-edit"
            size={moderateScale(20)}
            color={colors.primary}
          />
          <ZText type="m12" color={colors.primary} style={styles.mt5}>
            {strings.edit}
          </ZText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.iconButton, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate(StackNav.ChatList)}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={moderateScale(20)}
            color={colors.primary}
          />
          <ZText type="m12" color={colors.primary} style={styles.mt5}>
            {strings.chats}
          </ZText>
        </TouchableOpacity>

        {user?.type === 'chef' && (
          <TouchableOpacity
            style={[localStyles.iconButton, localStyles.primaryButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => navigation.navigate(StackNav.ChefDashboard)}
          >
            <MaterialIcon
              name="chef-hat"
              size={moderateScale(20)}
              color={colors.white}
            />
            <ZText type="m12" color={colors.white} style={styles.mt5}>
              {strings.chef}
            </ZText>
          </TouchableOpacity>
        )}

        {/* WALLET BUTTON - Only for chefs */}
        {user?.type === 'chef' && (
          <TouchableOpacity
            style={[localStyles.iconButton, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate(StackNav.Wallet)}
          >
            <Ionicons
              name="wallet-outline"
              size={moderateScale(20)}
              color={colors.primary}
            />
            <ZText type="m12" color={colors.primary} style={styles.mt5}>
              {strings.wallet}
            </ZText>
          </TouchableOpacity>
        )}
      </View>

      {/* Enhanced Tab Bar */}
      <View style={localStyles.tabBarContainer}>
        <LinearGradient
          colors={colors.dark ? ['#1C1C1E', '#2C2C2E'] : ['#F8F9FA', '#FFFFFF']}
          style={localStyles.tabBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={[
              localStyles.tab,
              selectedTab === 'posts' && [
                localStyles.activeTab,
                { backgroundColor: colors.primary }
              ]
            ]}
            onPress={() => setSelectedTab('posts')}
            activeOpacity={0.8}
          >
            {selectedTab === 'posts' && (
              <LinearGradient
                colors={[colors.primary, colors.primary + '90']}
                style={localStyles.activeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Ionicons
              name={selectedTab === 'posts' ? 'grid' : 'grid-outline'}
              size={moderateScale(18)}
              color={selectedTab === 'posts' ? colors.white : colors.textColor}
              style={localStyles.tabIcon}
            />
            <ZText
              type="B14"
              color={selectedTab === 'posts' ? colors.white : colors.textColor}
              style={[localStyles.tabText, {
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'transparent',
              }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {strings.posts}
            </ZText>
            {selectedTab === 'posts' && (
              <View style={[localStyles.tabIndicator, { backgroundColor: colors.white }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.tab,
              selectedTab === 'reviews' && [
                localStyles.activeTab,
                { backgroundColor: colors.primary }
              ]
            ]}
            onPress={() => setSelectedTab('reviews')}
            activeOpacity={0.8}
          >
            {selectedTab === 'reviews' && (
              <LinearGradient
                colors={[colors.primary, colors.primary + '90']}
                style={localStyles.activeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Ionicons
              name={selectedTab === 'reviews' ? 'star' : 'star-outline'}
              size={moderateScale(18)}
              color={selectedTab === 'reviews' ? colors.white : colors.textColor}
              style={localStyles.tabIcon}
            />
            <ZText
              type="B14"
              color={selectedTab === 'reviews' ? colors.white : colors.textColor}
              style={[localStyles.tabText, {
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'transparent',
              }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {strings.reviews}
            </ZText>
            {selectedTab === 'reviews' && (
              <View style={[localStyles.tabIndicator, { backgroundColor: colors.white }]} />
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );

  const { isGuest, handleAuthToast } = useHandleAuth();

  const isFocused = useIsFocused();
  const { updateCurrentScreen } = useScreen();

  useEffect(() => {
    if (isFocused) {
      if (handleAuthToast()) {
        navigation.goBack();
      }
      updateCurrentScreen(TabNav.Profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const currentData = selectedTab === 'posts' ? storiesData : reviewsData;
  const currentLoading = selectedTab === 'posts' ? isLoading : reviewsLoading;
  const currentFetching = selectedTab === 'posts' ? isFetching : reviewsFetching;
  const currentQueryData = selectedTab === 'posts' ? queryData : reviewQueryData;

  const renderPostItem = ({ item, index }) => (
    <View style={localStyles.gridItem}>
      <ReelComponent
        data={item?.views}
        profileId={user}
        setisLoadingSomething={setisLoadingSomething}
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
        id={item?._id}
        item={item}
        isPlay={!item?.avatarUri}
        isDeleteAllowed={true}
        onDelete={onDeletePost}
      />
    </View>
  );

  const emptyComponent = () => (
    <View style={localStyles.emptyContainer}>
      <Ionicons
        name={selectedTab === 'posts' ? 'grid-outline' : 'star-outline'}
        size={moderateScale(64)}
        color={colors.grayScale4}
      />
      <ZText
        style={localStyles.emptyTitle}
        type={'B18'}
        color={colors.textColor}>
        {selectedTab === 'posts' ? strings.noDishesYetCurrentProfile : strings.noReviewPostsYet}
      </ZText>
      <ZText
        style={localStyles.emptySubtitle}
        type={'M14'}
        color={colors.grayScale5}>
        {selectedTab === 'posts'
          ? strings.startSharingCulinaryCreations
          : strings.shareYourFoodExperiences}
      </ZText>
    </View>
  );

  const onEndReached = () => {
    if (selectedTab === 'posts') {
      if (queryData?.data?.totalPages > page) {
        setpage(old => old + 1);
      }
    } else {
      if (reviewQueryData?.data?.totalPages > reviewsPage) {
        setReviewsPage(old => old + 1);
      }
    }
  };

  return (
    <ZSafeAreaView style={localStyles.screenContainer}>
      {!isGuest && (
        <View style={localStyles.container}>
          {isLoadingSomething && (
            <ZLoader overlay={true} absolute top={440} left={-10} />
          )}

          <FlatList
            data={currentData}
            renderItem={renderPostItem}
            numColumns={3}
            key={selectedTab} // Force re-render when tab changes
            ListHeaderComponent={ProfileHeader}
            ListEmptyComponent={currentLoading || !data?.data?.user?._id ? (
              <ZLoader top={44} left={-10} />
            ) : emptyComponent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.9}
            ListFooterComponent={
              currentFetching && !currentLoading ? (
                <ActivityIndicator
                  size={'large'}
                  color={colors.primary}
                  style={localStyles.loadingIndicator}
                />
              ) : null
            }
            keyExtractor={(item, index) => `${selectedTab}-${item._id || index}`}
            contentContainerStyle={localStyles.flatListContent}
            columnWrapperStyle={localStyles.columnWrapper}
          />
        </View>
      )}
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flatListContent: {
    paddingHorizontal: moderateScale(0),
    paddingBottom: moderateScale(30),
  },
  columnWrapper: {
    marginBottom: moderateScale(15),
    paddingHorizontal: moderateScale(8),
  },
  headerContent: {
    width: '100%',
    marginBottom: moderateScale(20),
    paddingHorizontal: moderateScale(0),
  },
  headerContainer: {
    ...styles.flex,
    ...styles.flexRow,
    ...styles.alignCenter,
    ...styles.justifyBetween,
    ...styles.mt20,
    marginBottom: moderateScale(20),
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioText: {
    maxWidth: 260,
    marginRight: 5,
  },
  bioIcon: {
    marginTop: 7,
  },
  // Stats Styles
  statsContainer: {
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(12),
    marginHorizontal: moderateScale(2),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(70),
  },
  statsNumber: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  statsLabel: {
    paddingHorizontal: moderateScale(4),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    flexWrap: 'wrap',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(70),
    height: moderateScale(65),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingVertical: moderateScale(8),
    marginHorizontal: moderateScale(2),
  },
  primaryButton: {
    // Additional styles for the chef dashboard button
  },

  // Enhanced Tab Bar Styles
  tabBarContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(20),
    marginHorizontal: moderateScale(0),
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: moderateScale(16),
    padding: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: moderateScale(50),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    position: 'relative',
    overflow: 'visible',
    minWidth: moderateScale(80),
  },
  activeTab: {
    transform: [{ scale: 1.02 }],
  },
  activeTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(12),
  },
  tabIcon: {
    marginRight: moderateScale(6),
    zIndex: 10,
  },
  tabText: {
    zIndex: 2,
    fontWeight: '600',
    fontSize: moderateScale(14),
    flexShrink: 0,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: moderateScale(4),
    width: moderateScale(20),
    height: moderateScale(2),
    borderRadius: moderateScale(1),
    zIndex: 2,
  },

  // Content Styles
  gridItem: {
    width: '31%',
    marginHorizontal: moderateScale(2),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(80),
    paddingHorizontal: moderateScale(40),
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  loadingIndicator: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
});
