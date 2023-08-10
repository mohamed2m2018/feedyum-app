// Library import
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Spinner from 'react-native-loading-spinner-overlay/lib';

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

export default function ProfileDetail({navigation, route}) {
  const {id} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const {data: currentUserQuery} = useQuery(
    'user',
    () => request.get('/user'),
    {retry: 1},
  );

  const getFollowStatistics = () =>
    request.get(`/follow/statistics/${user?._id}`);

  const currentUser = currentUserQuery?.data?.user;
  const [isFollow, setIsFollow] = useState(false);

  const {data} = useQuery(
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
    refetchInterval: 30000,
    enabled: !!data?.data?.user,
  });

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

  const onPressEditProfile = () =>
    navigation.navigate(StackNav.UserNetwork, {
      userId: user?._id,
    });
  const onPressModalClose = () => setModalVisible(false);

  // eslint-disable-next-line react/no-unstable-nested-components
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

  const user = data?.data?.user;
  return (
    <ZSafeAreaView>
      <ZHeader />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={localStyles.root}>
        <View style={styles.itemsCenter}>
          <TouchableOpacity onPress={onPressEditProfile} style={styles.mt25}>
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
          </TouchableOpacity>
          <View style={styles.mv20}>
            <ZText type="b24" align={'center'}>
              {user?.fullName}
            </ZText>
            <ZText type="m14" align={'center'} style={styles.mt10}>
              {user?.email}
            </ZText>
          </View>
        </View>
        <View style={[styles.flexRow, styles.justifyEvenly]}>
          {UserDetailCategory(
            user?.postsNo || 0,
            followStatistics?.data?.followersCount || 0,
            followStatistics?.data?.followingCount || 0,
            views?.data?.viewsCount || 0,
            onPressEditProfile,
          ).map((item, index) => (
            <RenderUserDetail item={item} key={index} />
          ))}
        </View>
        <View style={localStyles.editProfileContainer}>
          <ZButton
            title={!isFollow ? strings.follow : strings.unfollow}
            onPress={onPressFollow}
            color={colors.white}
            textType="b14"
            style={styles.ml5}
            containerStyle={[
              localStyles.buttonContainer,
              {borderColor: colors.primary},
            ]}
            bgColor={colors.primary}
          />
        </View>

        <FlatList
          data={stories}
          ListEmptyComponent={
            isLoading ? (
              <Spinner
                size={'large'}
                color={colors.primary}
                visible={isLoading}
              />
            ) : (
              <ZText style={{textAlign: 'center', marginTop: 45}} type={'B20'}>
                {strings.noDishesYetCurrentProfile}
              </ZText>
            )
          }
          renderItem={({item}) => (
            <ReelComponent
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
          )}
          numColumns={3}
          onMomentumScrollBegin={fetchNextPage}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mt20}
        />
      </ScrollView>
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={onPressModalClose}
        headerTitle={'27M Total Likes'}
        subTitle={'jenny_wilson received a total of 27M likes from all videos.'}
        itemImage={<LikeIconModal style={styles.selfCenter} />}
        btnText={'Ok'}
      />
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
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editProfileContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mt25,
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(40),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '30%',
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
});
