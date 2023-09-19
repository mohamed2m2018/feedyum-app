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
      },
    });

  const [storiesData, setstoriesData] = useState([]);
  const {
    data: queryData,
    isLoading,
    isFetching,
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
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: err[Object.keys(err)?.[0]],
      });
    },
  });

  const onPressEditProfile = () =>
    navigation.navigate(StackNav.EditProfile, {user});

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
  }, [isFocused]);

  return (
    <ZSafeAreaView>
      {!isGuest && (
        <View style={{flex: 1, height: '100%', padding: 20}}>
          {isLoadingSomething && (
            <ZLoader overlay={true} absolute top={440} left={-10} />
          )}
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
            ListHeaderComponent={
              <>
                <View style={localStyles.headerContainer}>
                  <TouchableOpacity onPress={onPressSetting}>
                    <Ionicons
                      name="settings-outline"
                      size={moderateScale(30)}
                      color={colors.dark ? colors.white : colors.darkColor}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemsCenter}>
                  <TouchableOpacity
                    onPress={onPressEditProfile}
                    style={styles.mt40}>
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
                      size={moderateScale(30)}
                      color={colors.primary}
                      style={localStyles.editIcon}
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
                  {UserDetail(
                    user?.postsNo,
                    followStatistics?.data?.followersCount,
                    followStatistics?.data?.followingCount,
                    views?.data?.viewsCount || 0,
                  ).map((item, index) => (
                    <RenderUserDetail item={item} key={index} />
                  ))}
                </View>
                <ZButton
                  title={strings.editProfile}
                  onPress={onPressEditProfile}
                  color={colors.primary}
                  textType="b18"
                  style={styles.ml10}
                  containerStyle={[
                    localStyles.buttonContainer,
                    {borderColor: colors.primary},
                  ]}
                  bgColor={colors.tranparent}
                  frontIcon={<Inbox_Dark />}
                />
                {/* <View style={localStyles.mainContainer}>
                {categoryData.map((item, index) => (
                  <HeaderCategory item={item} key={index} />
                ))}
              </View> */}
              </>
            }
          />
          {/* <SwitchAccont SheetRef={switchAccountRef} /> */}
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
  buttonContainer: {
    ...styles.mt15,
    height: getHeight(45),
    borderRadius: moderateScale(22),
    borderWidth: moderateScale(1),
    ...styles.mb15,
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
});
