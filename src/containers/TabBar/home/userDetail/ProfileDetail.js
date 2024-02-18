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

export default function ProfileDetail({navigation, route}) {
  const {id} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const locationSheetRef = useRef('');
  const [selectedGov, setselectedGov] = useState('');

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
    refetchInterval: 30000,
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

  const onPressEditProfile = page =>
    navigation.navigate(StackNav.UserNetwork, {
      userId: user?._id,
      page,
      isOther: true,
    });

  // const onPressProfile = () => setModalVisible(true);
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

  const onPressAvailableLocation = () => {
    setselectedGov(data?.data?.user?.locations);
    locationSheetRef.current?.show();
  };
  return (
    <ZSafeAreaView>
      <ZHeader />
      <View style={{flex: 1}}>
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
            <ZText type="m14" align={'center'} style={styles.mt10}>
              {user?.email}
            </ZText>
            {user?.bio && (
              <ZText
                type={user?.bio ? 'm16' : 'm14'}
                align={'center'}
                color={user?.bio ? colors.textColor : colors.background}
                style={[styles.mt10, localStyles.bioIcon]}>
                {user?.bio}
              </ZText>
            )}
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
            }}
            bgColor={colors.tranparent}
            textType={'m14'}
            color={colors.primary}
            onPress={onPressAvailableLocation}
            title={strings.branches}
          />
        )}
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
        {!isLoading && !isFetchingUserDetailsFollowed ? (
          <View style={localStyles.editProfileContainer}>
            <ZButton
              title={!isFollow ? strings.follow : strings.unfollow}
              onPress={onPressFollow}
              color={colors.white}
              disabled={isLoading}
              textType="b14"
              style={styles.ml5}
              containerStyle={[
                localStyles.buttonContainer,
                {borderColor: colors.primary},
              ]}
              bgColor={colors.primary}
            />
          </View>
        ) : (
          <ActivityIndicator style={{margin: 5}} color={colors.primary} />
        )}

        <FlatList
          data={stories}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <ZLoader height={100} />
            ) : (
              <ZText style={{textAlign: 'center', marginTop: 45}} type={'B20'}>
                {strings.noDishesYetProfileOther}
              </ZText>
            )
          }
          renderItem={({item}) => (
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
          )}
          numColumns={3}
          onMomentumScrollBegin={fetchNextPage}
          keyExtractor={item => item?._id}
        />
      </View>
      <SuccessModal
        visible={modalVisible}
        onPressModalClose={onPressModalClose}
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
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
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
