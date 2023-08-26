// Library import
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {useInfiniteQuery} from 'react-query';

// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZText from '../../../../components/common/ZText';
import {styles} from '../../../../themes';
import {moderateScale} from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import ZHeader from '../../../../components/common/ZHeader';
import {TabView} from 'react-native-tab-view';
import Following from './Following';
import Follower from './Follower';
import request from '../../../../api/request';

export default function UserNetwork({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const showOne = route.params?.page === strings.followers;
  const isOther = route.params?.isOther === true;
  const [isSelect, setIsSelect] = useState({
    index: showOne ? 1 : 0,
    routes: [
      {key: 'first', title: isOther ? strings.following : strings.hefollowing},
      {key: 'second', title: strings.followers},
    ],
  });
  const [isFetching, setisFetching] = useState();

  const _handleIndexChange = index => {
    setIsSelect({...isSelect, index: index});
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const HeaderCetegoryItem = ({title, index}) => {
    return (
      <TouchableOpacity
        onPress={() => _handleIndexChange(index)}
        style={[
          localStyles.root,
          {
            borderBottomColor:
              isSelect.index === index ? colors.primary : colors.dark3,
          },
        ]}>
        <ZText
          type={'s18'}
          align={'center'}
          style={styles.pb20}
          color={isSelect.index === index ? colors.primary : colors.grayScale7}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };

  const _renderTabBar = props => {
    return (
      <View style={localStyles.mainContainer}>
        {props.navigationState.routes.map((item, index) => {
          return <HeaderCetegoryItem title={item.title} index={index} />;
        })}
      </View>
    );
  };

  const fetchFollowingData = async ({pageParam = 1}) => {
    // Implement logic to fetch following data for the current user
    const response = await request.get(
      `/follow/following?page=${pageParam}&userId=${route.params?.userId}`,
    );
    return response.data;
  };

  const fetchFollowerData = async ({pageParam = 1}) => {
    // Implement logic to fetch follower data for the current user
    const response = await request.get(
      `/follow/followers?page=${pageParam}&userId=${route.params?.userId}`,
    );
    return response.data;
  };

  const {
    data: dataFollowing,
    hasNextPage: hasnextPageFollowing,
    fetchNextPage: fetchNextPageFollowing,
    isLoading: isLoadingFollowing,
    isFetching: isFetchingFollowing,
    isFetchingNextPage: isFetchingNextPageFollowing,
  } = useInfiniteQuery(
    ['IamFollowing', route.params?.userId],
    fetchFollowingData,
    {
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.currentPage < lastPage?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      cacheTime: 0,
      retry: 0,
      select: res => {
        if (res.pages?.[0] === undefined) {
          return [];
        }
        return res?.pages.flatMap(page => page?.following);
      },
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      onSuccess: () => {
        setisFetching(false);
      },
    },
  );

  const {
    data: dataFollower,
    hasNextPage: hasNextPageFollower,
    fetchNextPage: fetchNextPageFollower,
    isLoading: isLoadingFollower,
    isFetching: isFetchingFollower,
    isFetchingNextPage: isFecthingNextpageFollower,
  } = useInfiniteQuery(
    ['IamFollowed', route.params?.userId],
    fetchFollowerData,
    {
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage?.currentPage < lastPage?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      },
      cacheTime: 0,
      retry: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      select: res => {
        return res?.pages.flatMap(page => page.followers);
      },
      onSuccess: () => {
        setisFetching(false);
      },
    },
  );

  const _renderScene = ({route: r}) => {
    if (r.key === 'first' && isSelect.index === 0) {
      return (
        <Following
          fetchNextPage={fetchNextPageFollowing}
          hasNextPage={hasnextPageFollowing}
          followingData={dataFollowing}
          setisFetching={setisFetching}
          userId={route.params?.userId}
          loading={
            isLoadingFollowing ||
            (isFetchingFollowing && !isFetchingNextPageFollowing)
          }
        />
      );
    }
    if (r.key === 'second' && isSelect.index === 1) {
      return (
        <Follower
          fetchNextPage={fetchNextPageFollower}
          hasNextPage={hasNextPageFollower}
          followingData={dataFollower}
          setisFetching={setisFetching}
          userId={route.params?.userId}
          loading={
            isLoadingFollower ||
            (isFetchingFollower && !isFecthingNextpageFollower)
          }
        />
      );
    }
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.followList} />
      <TabView
        navigationState={isSelect}
        renderScene={_renderScene}
        renderTabBar={_renderTabBar}
        onIndexChange={_handleIndexChange}
        activeColor={{color: colors.primary}}
        navigation={navigation}
      />
      {isFetching && (
        <ActivityIndicator size={'large'} color={colors.primary} />
      )}
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  root: {
    borderBottomWidth: moderateScale(2),
    width: '33.33%',
  },
  mainContainer: {
    ...styles.rowStart,
    alignSelf: 'center',
    ...styles.ph20,
    ...styles.pt20,
    width: '100%',
  },
});
