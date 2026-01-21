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
import { showErrorToast, showSuccessToast, showActionDialog } from '../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useHandleAuth } from '../../../utils/useHandleAuth';
import { useIsFocused } from '@react-navigation/native';
import { useScreen } from '../../../navigation/screenContext';
import ZLoader from '../../../components/common/ZLoader';

export default function Profile({ navigation }) {
  const UserDetail = (postsNo, followersNo, followingNo, viewsNo, userType) => {
    const stats = [
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

    // Hide "Following" stat for chef's own profile
    if (userType === 'chef') {
      return stats.filter(stat => stat.title !== strings.following);
    }

    return stats;
  };
  const colors = useSelector(state => state.theme.theme);
  const { isGuest, handleAuthToast } = useHandleAuth();
  const isFocused = useIsFocused();
  const { updateCurrentScreen } = useScreen();

  const [page, setpage] = useState(1);
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
      },
    });

  const [storiesData, setstoriesData] = useState([]);

  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['profile-stories', page],
    queryFn: () => fetchPosts(page),
    enabled: !!data?.data?.user?._id,
    onSuccess: res => {
      if (res?.data?.currentPage === '1') {
        setstoriesData(res?.data?.stories);
        setpage(1);
      } else {
        setstoriesData([...storiesData, ...res?.data?.stories]);
      }
    },
    onError: err => {
      showErrorToast(strings.error, err[Object.keys(err)?.[0]]);
    },
  });

  const onDeletePost = (id) => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.deletePost,
      message: strings.deletePostConfirm,
      confirmText: strings.delete,
      cancelText: strings.cancel,
      onConfirm: async () => {
        try {
          setisLoadingSomething(true);
          const { data } = await request.delete(`/story/${id}`);
          if (data?.success) {
            refetchPosts();
            showSuccessToast(strings.success, strings.postDeletedSuccess);
          }
        } catch (error) {
          showErrorToast(strings.error, error?.response?.data?.message || strings.somethingWentWrong);
        } finally {
          setisLoadingSomething(false);
        }
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchFollowStats(),
        refetchViews(),
        refetchPosts(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const onPressEditProfile = isEditBio => {
    const editProfileTitle = user?.type === 'chef'
      ? strings.editProfileAndBranches
      : strings.editProfile;
    navigation.navigate(StackNav.SetUpProfile, {
      title: editProfileTitle,
      isEditBio,
      type: user?.type,
    });
  };

  const onPressSetting = () => navigation.navigate(StackNav.Setting);

  // Render User Detail - Clean Style
  const RenderUserDetail = ({ item, index }) => {
    // Different accent colors for each stat
    const accentColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    const accent = accentColors[index % accentColors.length];

    return (
      <TouchableOpacity
        onPress={item.onPress}
        style={[
          localStyles.statItem,
          {
            backgroundColor: colors.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: moderateScale(8),
            paddingVertical: moderateScale(6),
            paddingHorizontal: moderateScale(4),
          }
        ]}
      >
        <ZText type="b16" align={'center'} color={accent} style={{ fontWeight: '800' }}>
          {item.value}
        </ZText>
        <ZText type="m10" align={'center'} color={colors.grayScale5}>
          {item.title}
        </ZText>
      </TouchableOpacity>
    );
  };

  // Profile Header Component - Stunning Premium Design
  const ProfileHeader = () => (
    <View style={[localStyles.headerContent, { backgroundColor: colors.backgroundColor }]}>

      {/* Gradient Accent Bar at Top */}
      <LinearGradient
        colors={['#FF4D67', '#FF8E53', '#FFCD38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={localStyles.accentBar}
      />

      {/* Top Bar: Username & Settings */}
      <View style={localStyles.topBar}>
        <View style={localStyles.placeholderIcon} />
        <View style={localStyles.usernameContainer}>
          <ZText type="b20" style={localStyles.headerUsername} color={colors.textColor}>
            {user?.username || user?.fullName}
          </ZText>
          {user?.type === 'chef' && (
            <View style={[localStyles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant" size={moderateScale(10)} color={colors.white} />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={onPressSetting}
          style={[localStyles.settingsButton, { backgroundColor: colors.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons
            name="settings-outline"
            size={moderateScale(22)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>

      {/* Main Profile Section: Avatar + Stats */}
      <View style={localStyles.profileTopSection}>
        {/* Avatar with Gradient Ring */}
        <TouchableOpacity onPress={() => onPressEditProfile(false)} style={localStyles.avatarWrapper}>
          <LinearGradient
            colors={['#FF4D67', '#FF8E53', '#FFCD38', '#4ECDC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={localStyles.avatarGradientRing}
          >
            <View style={[localStyles.avatarInnerRing, { backgroundColor: colors.backgroundColor }]}>
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
            </View>
          </LinearGradient>
          <LinearGradient
            colors={['#FF4D67', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={localStyles.editBadge}
          >
            <Ionicons name="add" size={moderateScale(16)} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats (Right) - Colorful Cards */}
        <View style={localStyles.statsContainer}>
          {UserDetail(
            user?.postsNo,
            followStatistics?.data?.followersCount,
            followStatistics?.data?.followingCount,
            views?.data?.viewsCount || 0,
            user?.type,
          ).map((item, index) => (
            <RenderUserDetail item={item} key={index} index={index} />
          ))}
        </View>
      </View>

      {/* Bio Section with subtle accent */}
      <View style={[localStyles.bioSection, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
        <ZText type="b18" color={colors.textColor}>
          {user?.fullName}
        </ZText>

        {user?.type === 'chef' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: moderateScale(2) }}>
            <Ionicons name="restaurant-outline" size={moderateScale(14)} color={colors.primary} />
            <ZText type="m13" color={colors.primary} style={{ marginLeft: moderateScale(4) }}>
              {strings.kitchen || 'Kitchen'}
            </ZText>
          </View>
        )}

        <TouchableOpacity onPress={() => onPressEditProfile(false)} activeOpacity={0.7}>
          <ZText
            type={'m14'}
            color={colors.dark ? colors.grayScale4 : colors.grayScale6}
            style={localStyles.bioText}
            numberOfLines={4}
          >
            {user?.bio || (user?.type === 'chef' ? (strings.addRestaurantBio || 'Tap to add your kitchen bio') : (strings.addBio || 'Tap to add your bio'))}
          </ZText>
        </TouchableOpacity>
      </View>

      {/* Premium Action Buttons Row */}
      <View style={localStyles.actionButtonsContainer}>
        {/* Edit Profile - Primary Gradient */}
        <TouchableOpacity
          onPress={() => onPressEditProfile(false)}
          activeOpacity={0.8}
          style={localStyles.gradientButtonWrapper}
        >
          <LinearGradient
            colors={['#FF4D67', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={localStyles.gradientButton}
          >
            <Ionicons name="pencil" size={moderateScale(14)} color={colors.white} style={{ marginRight: moderateScale(4) }} />
            <ZText type="b13" color={colors.white}>
              {strings.editProfile}
            </ZText>
          </LinearGradient>
        </TouchableOpacity>

        {user?.type === 'chef' ? (
          <>
            {/* Branches - Secondary Style */}
            <TouchableOpacity
              style={[localStyles.secondaryButton, {
                backgroundColor: colors.dark ? 'rgba(255,77,103,0.15)' : 'rgba(255,77,103,0.1)',
                borderColor: colors.primary,
              }]}
              onPress={() => navigation.navigate(StackNav.ChefBranchesScreen)}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={moderateScale(14)} color={colors.primary} style={{ marginRight: moderateScale(4) }} />
              <ZText type="b13" color={colors.primary}>
                {strings.branches || 'Branches'}
              </ZText>
            </TouchableOpacity>

            {/* Wallet - Accent Style */}
            <TouchableOpacity
              style={[localStyles.secondaryButton, {
                backgroundColor: colors.dark ? 'rgba(78,205,196,0.15)' : 'rgba(78,205,196,0.1)',
                borderColor: '#4ECDC4',
              }]}
              onPress={() => navigation.navigate(StackNav.Wallet)}
              activeOpacity={0.7}
            >
              <Ionicons name="wallet" size={moderateScale(14)} color="#4ECDC4" style={{ marginRight: moderateScale(4) }} />
              <ZText type="b13" color="#4ECDC4">
                {strings.wallet || 'Wallet'}
              </ZText>
            </TouchableOpacity>
          </>
        ) : (
          /* Chats Button for regular users */
          <TouchableOpacity
            style={[localStyles.secondaryButton, {
              backgroundColor: colors.dark ? 'rgba(78,205,196,0.15)' : 'rgba(78,205,196,0.1)',
              borderColor: '#4ECDC4',
            }]}
            onPress={() => navigation.navigate(StackNav.ChatList)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles" size={moderateScale(14)} color="#4ECDC4" style={{ marginRight: moderateScale(4) }} />
            <ZText type="b13" color="#4ECDC4">
              {strings.chats || 'Chats'}
            </ZText>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );

  useEffect(() => {
    if (isFocused) {
      if (handleAuthToast()) {
        navigation.goBack();
      }
      updateCurrentScreen(TabNav.Profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const renderPostItem = ({ item, index }) => (
    <View style={[localStyles.gridItem, { borderColor: colors.backgroundColor }]}>
      <ReelComponent
        data={item?.views}
        profileId={user}
        setisLoadingSomething={setisLoadingSomething}
        reelUrl={item?.avatarUri || item?.poster}
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
        name="grid-outline"
        size={moderateScale(64)}
        color={colors.grayScale4}
      />
      <ZText
        style={localStyles.emptyTitle}
        type={'B18'}
        color={colors.textColor}>
        {strings.noDishesYetCurrentProfile}
      </ZText>
      <ZText
        style={localStyles.emptySubtitle}
        type={'M14'}
        color={colors.grayScale5}>
        {strings.startSharingCulinaryCreations}
      </ZText>
    </View>
  );

  const onEndReached = () => {
    if (queryData?.data?.totalPages > page) {
      setpage(old => old + 1);
    }
  };

  return (
    <ZSafeAreaView style={[localStyles.screenContainer, { backgroundColor: colors.backgroundColor }]}>
      {!isGuest && (
        <View style={localStyles.container}>
          {isLoadingSomething && (
            <ZLoader overlay={true} absolute top={440} left={-10} />
          )}

          <FlatList
            data={storiesData}
            renderItem={renderPostItem}
            numColumns={3}
            ListHeaderComponent={ProfileHeader}
            ListEmptyComponent={isLoading || !data?.data?.user?._id ? (
              <ZLoader top={44} left={-10} />
            ) : emptyComponent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.9}
            ListFooterComponent={
              isFetching && !isLoading ? (
                <ActivityIndicator
                  size={'large'}
                  color={colors.primary}
                  style={localStyles.loadingIndicator}
                />
              ) : null
            }
            keyExtractor={(item, index) => `post-${item._id || index}`}
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
  },
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: moderateScale(30),
  },
  columnWrapper: {
    // No margin for grid look
  },

  // Header Component Styles
  headerContent: {
    width: '100%',
    marginBottom: moderateScale(10),
  },

  // Gradient Accent Bar
  accentBar: {
    height: moderateScale(4),
    width: '100%',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    height: moderateScale(54),
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(6),
  },
  placeholderIcon: {
    width: moderateScale(36),
  },
  settingsButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Top Section (Avatar + Stats)
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginTop: moderateScale(16),
  },

  // Avatar with Gradient Ring
  avatarWrapper: {
    position: 'relative',
    marginRight: moderateScale(20),
  },
  avatarGradientRing: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    padding: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerRing: {
    width: moderateScale(94),
    height: moderateScale(94),
    borderRadius: moderateScale(47),
    padding: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
  },
  editBadge: {
    position: 'absolute',
    bottom: moderateScale(2),
    right: moderateScale(2),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  // Stats
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: moderateScale(10),
    gap: moderateScale(8),
  },
  statItem: {
    alignItems: 'center',
  },

  // Bio Section
  bioSection: {
    paddingHorizontal: moderateScale(20),
    paddingLeft: moderateScale(23),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(4),
  },
  bioText: {
    lineHeight: moderateScale(20),
    marginTop: moderateScale(6),
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    marginTop: moderateScale(18),
    marginBottom: moderateScale(14),
    gap: moderateScale(8),
  },
  gradientButtonWrapper: {
    flex: 1,
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    shadowColor: '#FF4D67',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionButton: {
    flex: 1,
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },

  // Grid
  gridItem: {
    width: '33.33%',
    height: moderateScale(220),
    borderWidth: 0.5,
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
