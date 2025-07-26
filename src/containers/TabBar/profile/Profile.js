// Library import
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import images from '../../../assets/images';
import ZButton from '../../../components/common/ZButton';
import {Inbox_Dark} from '../../../assets/svgs';
import ReelComponent from '../../../components/ReelComponent';
import {useQuery} from 'react-query';
import request from '../../../api/request';
import {Toast, ALERT_TYPE} from 'react-native-alert-notification';
import {useHandleAuth} from '../../../utils/useHandleAuth';
import {useIsFocused} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import ZLoader from '../../../components/common/ZLoader';

export default function Profile({navigation}) {
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

  const [isLoadingSomething, setisLoadingSomething] = useState();

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const user = data?.data?.user;
  const getUserViews = () => request.get(`/views/user/${user?._id}`);

  const getFollowStatistics = () =>
    request.get(`/follow/statistics/${user?._id}`);

  const {data: followStatistics} = useQuery(
    ['followStatistics', user?._id],
    () => getFollowStatistics(user?._id),
  );

  const {data: views} = useQuery(['userViews', user?._id], getUserViews, {
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
    request.get(`/story/author?id=${user?._id}`, {
      params: {
        limit: 10,
        page: reviewsPage,
        reviewsOnly: true, // Only get review posts
      },
    });

  const [storiesData, setstoriesData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  
  const {
    data: queryData,
    isLoading,
    isFetching,
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

  const onPressEditProfile = isEditBio => {
    navigation.navigate(StackNav.SetUpProfile, {
      title: strings.editProfile,
      isEditBio,
      type: user?.type,
    });
  };

  const onPressSetting = () => navigation.navigate(StackNav.Setting);

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderUserDetail = ({item}) => {
    return (
      <TouchableOpacity onPress={item.onPress} style={styles.itemsCenter}>
        <ZText type="b24" align={'center'}>
          {item.value}
        </ZText>
        <ZText type="m16" align={'center'} style={styles.mt10}>
          {item.title}
        </ZText>
      </TouchableOpacity>
    );
  };

  const {isGuest, handleAuthToast} = useHandleAuth();

  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      if (handleAuthToast()) {
        navigation.goBack();
      }
      updateCurrentScreen(TabNav.Profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  return (
    <ZSafeAreaView>
      {!isGuest && (
        <View style={{flex: 1, height: '100%', padding: 20}}>
          {isLoadingSomething && (
            <ZLoader overlay={true} absolute top={440} left={-10} />
          )}
          <View style={{flex: 1}}>
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
                      ? {uri: user?.avatar}
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
                style={[localStyles.iconButton, {borderColor: colors.primary}]}
                onPress={() => onPressEditProfile(false)}
              >
                <MaterialIcon
                  name="account-edit"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <ZText type="m12" color={colors.primary} style={styles.mt5}>
                  Edit
                </ZText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.iconButton, {borderColor: colors.primary}]}
                onPress={() => navigation.navigate(StackNav.ChatList)}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <ZText type="m12" color={colors.primary} style={styles.mt5}>
                  Chats
                </ZText>
              </TouchableOpacity>

              {user?.type === 'chef' && (
                <TouchableOpacity
                  style={[localStyles.iconButton, localStyles.primaryButton, {backgroundColor: colors.primary, borderColor: colors.primary}]}
                  onPress={() => navigation.navigate(StackNav.ChefDashboard)}
                >
                  <MaterialIcon
                    name="chef-hat"
                    size={moderateScale(20)}
                    color={colors.white}
                  />
                  <ZText type="m12" color={colors.white} style={styles.mt5}>
                    Chef
                  </ZText>
                </TouchableOpacity>
              )}

              {/* WALLET BUTTON */}
              <TouchableOpacity
                style={[localStyles.iconButton, {borderColor: colors.primary}]}
                onPress={() => navigation.navigate(StackNav.Wallet)}
              >
                <Ionicons
                  name="wallet-outline"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <ZText type="m12" color={colors.primary} style={styles.mt5}>
                  Wallet
                </ZText>
              </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={localStyles.tabBar}>
              <TouchableOpacity
                style={[
                  localStyles.tab,
                  selectedTab === 'posts' && {backgroundColor: colors.primary},
                ]}
                onPress={() => setSelectedTab('posts')}>
                <ZText
                  type="B14"
                  color={selectedTab === 'posts' ? colors.white : colors.grayScale6}>
                  Posts
                </ZText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  localStyles.tab,
                  selectedTab === 'reviews' && {backgroundColor: colors.primary},
                ]}
                onPress={() => setSelectedTab('reviews')}>
                <ZText
                  type="B14"
                  color={selectedTab === 'reviews' ? colors.white : colors.grayScale6}>
                  Reviews
                </ZText>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={{flex: 1}}>
              {selectedTab === 'posts' ? (
                <FlatList
                  data={storiesData}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => (
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
                    />
                  )}
                  numColumns={3}
                  ListEmptyComponent={
                    isLoading || !data?.data?.user?._id ? (
                      <ZLoader top={44} left={-10} />
                    ) : (
                      <ZText
                        style={{textAlign: 'center', marginTop: 45}}
                        type={'B20'}>
                        {strings.noDishesYetCurrentProfile}
                      </ZText>
                    )
                  }
                  onEndReachedThreshold={0.9}
                  onMomentumScrollBegin={() => {
                    if (queryData?.data?.totalPages > page) {
                      setpage(old => old + 1);
                    }
                  }}
                  ListFooterComponent={
                    isFetching && !isLoading ? (
                      <ActivityIndicator size={'large'} color={colors.primary} />
                    ) : null
                  }
                  keyExtractor={(item, index) => index.toString()}
                />
              ) : (
                <FlatList
                  data={reviewsData}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => (
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
                    />
                  )}
                  numColumns={3}
                  ListEmptyComponent={
                    reviewsLoading || !data?.data?.user?._id ? (
                      <ZLoader top={44} left={-10} />
                    ) : (
                      <View style={localStyles.emptyReviewsContainer}>
                        <Ionicons name="star-outline" size={moderateScale(64)} color={colors.grayScale4} />
                        <ZText
                          style={{textAlign: 'center', marginTop: 16}}
                          type={'B18'}
                          color={colors.textColor}>
                          No Review Posts Yet
                        </ZText>
                        <ZText
                          style={{textAlign: 'center', marginTop: 8}}
                          type={'M14'}
                          color={colors.grayScale5}>
                          Share your food experiences with reviews!
                        </ZText>
                      </View>
                    )
                  }
                  onEndReachedThreshold={0.9}
                  onMomentumScrollBegin={() => {
                    if (reviewQueryData?.data?.totalPages > reviewsPage) {
                      setReviewsPage(old => old + 1);
                    }
                  }}
                  ListFooterComponent={
                    reviewsFetching && !reviewsLoading ? (
                      <ActivityIndicator size={'large'} color={colors.primary} />
                    ) : null
                  }
                  keyExtractor={(item, index) => index.toString()}
                />
              )}
            </View>
          </View>
        </View>
      )}
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  root: {
    ...styles.flex,
    ...styles.ph20,
    ...styles.mb20,
    flex: 1,
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
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIcon2: {
    position: 'absolute',
    bottom: 15,
    right: -33,
  },
  buttonContainer: {
    ...styles.mt15,
    height: getHeight(45),
    borderRadius: moderateScale(22),
    borderWidth: moderateScale(1),
    ...styles.mb15,
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
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
    ...styles.mt15,
  },
  tabItemStyle: {
    borderBottomWidth: moderateScale(2),
    width: '25%',
    ...styles.itemsCenter,
    ...styles.pv15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
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

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginHorizontal: moderateScale(20),
    marginVertical: moderateScale(16),
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  tab: {
    flex: 1,
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(6),
  },

  emptyReviewsContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },

});
