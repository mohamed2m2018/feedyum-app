// Library import
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Locations from '../../../../components/models/Locations';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ZLoader from '../../../../components/common/ZLoader';

// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZHeader from '../../../../components/common/ZHeader';
import { getHeight, moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import images from '../../../../assets/images';
import ZButton from '../../../../components/common/ZButton';
import { LikeIconModal } from '../../../../assets/svgs';
import { StackNav } from '../../../../navigation/NavigationKeys';
import SuccessModal from '../../../../components/models/SuccessModal';
import ReelComponent from '../../../../components/ReelComponent';
import { UserDetailCategory } from '../../../../api/constant';
import ImageZoomModal from '../../../../components/common/ImageZoomModal';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import { useHandleAuth } from '../../../../utils/useHandleAuth';


const RenderUserDetail = ({ item }) => {
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

export default function ProfileDetail({ navigation, route }) {
  const { id } = route.params;
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const locationSheetRef = useRef('');
  const [selectedGov, setselectedGov] = useState('');
  const [isProfileImageVisible, setIsProfileImageVisible] = useState(false);

  const { data: currentUserQuery } = useQuery(
    'user',
    () => request.get('/user'),
    { retry: 1 },
  );

  const getFollowStatistics = () =>
    request.get(`/follow/statistics/${user?._id}`);

  const currentUser = currentUserQuery?.data?.user;
  const [isFollow, setIsFollow] = useState(false);

  const { data, isFetching: isFetchingUserDetailsFollowed } = useQuery(
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

  const { data: followStatistics } = useQuery(
    ['followStatistics', user?._id],
    () => getFollowStatistics(user?._id),
    {
      enabled: !!data?.data?.user,
    },
  );

  const getUserViews = () => request.get(`/views/user/${user?._id}`);

  const { data: views } = useQuery(['userViews', user?._id], getUserViews, {
    refetchInterval: false, // Disable auto-refresh
    enabled: !!data?.data?.user,
  });

  const { handleAuthToast } = useHandleAuth();
  const followMutation = useMutation(
    userToFollow => request.post('/follow', { userToFollow }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
        queryClient.invalidateQueries({ queryKey: 'search_user' });
        queryClient.invalidateQueries({ queryKey: 'followStatistics' });
        queryClient.invalidateQueries('IamFollowing');
        queryClient.invalidateQueries('IamFollowed');
      },
    },
  );

  const unfollowMutation = useMutation(
    userToUnfollow => request.delete('/follow', { data: { userToUnfollow } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
        queryClient.invalidateQueries({ queryKey: 'search_user' });
        queryClient.invalidateQueries({ queryKey: 'followStatistics' });
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
      unfollowMutation.mutate({ _id: id });
    } else {
      followMutation.mutate({ _id: id });
    }
    setIsFollow(!isFollow);
  };
  const fetchPosts = ({ pageParam = 1 }) =>
    request.get(`/story/author?id=${id}`, {
      params: {
        limit: 10,
        page: pageParam,
      },
    });

  const {
    data: stories,
    fetchNextPage,
    isLoading,
  } = useInfiniteQuery(['user_stories', id], fetchPosts, {
    keepPreviousData: true,
    enabled: !!id,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.stories || []),
  });

  const user = data?.data?.user;

  const onPressAvailableLocation = () => {
    setselectedGov(data?.data?.user?.locations);
    locationSheetRef.current?.show();
  };
  const renderHeader = () => {
    // Colorful stat accents
    const accentColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

    return (
      <View style={[localStyles.headerContent, { backgroundColor: colors.backgroundColor }]}>
        <ZHeader title={user?.username || user?.fullName} />

        {/* Gradient Accent Bar */}
        <LinearGradient
          colors={['#FF4D67', '#FF8E53', '#FFCD38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={localStyles.accentBar}
        />

        {/* Profile Section: Avatar + Stats */}
        <View style={localStyles.profileTopSection}>
          {/* Avatar with Gradient Ring */}
          <TouchableOpacity
            onPress={() => user?.avatar && setIsProfileImageVisible(true)}
            activeOpacity={user?.avatar ? 0.8 : 1}
            style={localStyles.avatarWrapper}
          >
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
          </TouchableOpacity>

          {/* Stats (Right) - Colorful Cards */}
          <View style={localStyles.statsContainer}>
            {UserDetailCategory(
              user?.postsNo || 0,
              followStatistics?.data?.followersCount || 0,
              followStatistics?.data?.followingCount || 0,
              views?.data?.viewsCount || 0,
              () => navigation.navigate(StackNav.UserNetwork, { userId: user?._id }),
            ).map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item?.onPress}
                style={[
                  localStyles.statItem,
                  {
                    backgroundColor: colors.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }
                ]}
              >
                <ZText type="b20" align={'center'} color={accentColors[index % accentColors.length]} style={{ fontWeight: '800' }}>
                  {item.value}
                </ZText>
                <ZText type="m11" align={'center'} color={colors.grayScale5}>
                  {item.title}
                </ZText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bio Section with accent border */}
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

          {/* Bio Text */}
          {user?.bio && (
            <ZText
              type={'m14'}
              color={colors.dark ? colors.grayScale4 : colors.grayScale6}
              style={localStyles.bioText}
              numberOfLines={4}
            >
              {user?.bio}
            </ZText>
          )}
        </View>

        {/* Premium Action Buttons */}
        <View style={localStyles.actionButtonsContainer}>
          {/* Follow/Unfollow Button - Hide if current user is chef */}
          {currentUser?.type !== 'chef' && (
            <TouchableOpacity
              onPress={onPressFollow}
              disabled={isLoading}
              activeOpacity={0.8}
              style={localStyles.gradientButtonWrapper}
            >
              <LinearGradient
                colors={!isFollow ? ['#FF4D67', '#FF8E53'] : [colors.dark ? '#333' : '#E8E8E8', colors.dark ? '#444' : '#F5F5F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={localStyles.gradientButton}
              >
                <Ionicons
                  name={!isFollow ? "person-add" : "checkmark"}
                  size={moderateScale(14)}
                  color={!isFollow ? colors.white : colors.textColor}
                  style={{ marginRight: moderateScale(4) }}
                />
                <ZText type="b13" color={!isFollow ? colors.white : colors.textColor}>
                  {!isFollow ? strings.follow : strings.following}
                </ZText>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* View Menu Button (if chef) */}
          {(user?.type === 'chef' || user?.hasMenu) && (
            <TouchableOpacity
              style={[localStyles.secondaryButton, {
                backgroundColor: colors.dark ? 'rgba(78,205,196,0.15)' : 'rgba(78,205,196,0.1)',
                borderColor: '#4ECDC4',
              }]}
              onPress={() => {
                navigation.navigate(StackNav.ChefMenu, {
                  chefId: user?._id,
                  chefName: user?.fullName || user?.username || 'Chef',
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="restaurant" size={moderateScale(14)} color="#4ECDC4" style={{ marginRight: moderateScale(4) }} />
              <ZText type="b13" color="#4ECDC4">
                {strings.viewMenu || 'View Menu'}
              </ZText>
            </TouchableOpacity>
          )}

          {/* Message Button */}
          <TouchableOpacity
            style={[localStyles.secondaryButton, {
              backgroundColor: colors.dark ? 'rgba(255,77,103,0.15)' : 'rgba(255,77,103,0.1)',
              borderColor: colors.primary,
            }]}
            onPress={() => { }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={moderateScale(14)} color={colors.primary} style={{ marginRight: moderateScale(4) }} />
            <ZText type="b13" color={colors.primary}>
              {strings.message || 'Message'}
            </ZText>
          </TouchableOpacity>
        </View>

        {user?.type === 'chef' && (
          <View style={localStyles.clarificationContainer}>
            <ZText style={[localStyles.clarificationText, { color: colors.primary }]} type={'m12'}>
              {strings.foodReelsHint}
            </ZText>
          </View>
        )}

      </View>
    );
  };

  return (
    <ZSafeAreaView style={[localStyles.screenContainer, { backgroundColor: colors.backgroundColor }]}>
      <FlatList
        data={stories}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.flatListContent}
        ListEmptyComponent={
          isLoading ? (
            <ZLoader height={100} />
          ) : (
            <ZText style={localStyles.emptyStateText} type={'B20'}>
              {(user?.type === 'chef' || user?.hasMenu)
                ? strings.noFoodReelsYet
                : strings.noDishesYetProfileOther
              }
            </ZText>
          )
        }
        renderItem={({ item, index }) => (
          <View style={localStyles.dishItemContainer}>
            <ReelComponent
              profileId={user}
              data={item?.views}
              item={item}
              reelUrl={item?.avatarUri || item?.poster || item?.media?.[0]?.image}
              isPlay={!item?.avatarUri}
              id={item?._id}
            />
          </View>
        )}
        numColumns={3}
        onMomentumScrollBegin={fetchNextPage}
        keyExtractor={item => `post-${item?._id}`}
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
      <ImageZoomModal
        visible={isProfileImageVisible}
        imageUri={user?.avatar}
        onClose={() => setIsProfileImageVisible(false)}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: moderateScale(20),
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: moderateScale(45),
    marginHorizontal: moderateScale(20),
    lineHeight: moderateScale(28),
  },

  // Header Styles
  headerContent: {
    width: '100%',
    marginBottom: moderateScale(10),
  },

  // Gradient Accent Bar
  accentBar: {
    height: moderateScale(4),
    width: '100%',
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

  // Stats
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginLeft: moderateScale(8),
    gap: moderateScale(4),
  },
  statItem: {
    alignItems: 'center',
    minWidth: moderateScale(58),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(12),
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

  clarificationContainer: {
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.1)',
  },
  clarificationText: {
    lineHeight: moderateScale(18),
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Dish Grid Styles
  dishItemContainer: {
    width: '33%',
    height: moderateScale(150),
    marginHorizontal: moderateScale(1),
    marginBottom: moderateScale(1),
  },
  dishRowContainer: {},
  dishRowSeparator: {
    height: 0,
  },
});
