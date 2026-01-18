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
            onPress={() => navigation.navigate(StackNav.ChefDashboard, { isFromProfile: true })}
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
    <View style={localStyles.gridItem}>
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
    <ZSafeAreaView style={localStyles.screenContainer}>
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
