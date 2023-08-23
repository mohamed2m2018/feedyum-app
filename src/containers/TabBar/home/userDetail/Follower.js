import {ActivityIndicator, FlatList} from 'react-native';
import React from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import {useQuery} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import {useSelector} from 'react-redux';
import ZLoader from '../../../../components/common/ZLoader';

export default function Following({
  followingData: userDetail,
  fetchNextPage,
  hasNextPage,
  loading,
  setisFetching,
  userId,
}) {
  const colors = useSelector(state => state.theme.theme);
  const {data: currentUserQuery} = useQuery(
    'user',
    () => request.get('/user'),
    {retry: 1},
  );
  const currentUser = currentUserQuery?.data?.user;
  const renderItem = ({item}) => (
    <UserDetailComponent
      userName={item?.follower_id?.fullName}
      userImage={item?.follower_id?.avatar}
      isFollowed={item?.currentUserFollowed}
      key={item?.follower_id?._id}
      id={item?.follower_id?._id}
      setisFetching={setisFetching}
      currentUserId={currentUser?._id}
    />
  );

  return (
    <FlatList
      data={userDetail}
      renderItem={renderItem}
      extraData={userDetail}
      keyExtractor={item => item?._id}
      contentContainerStyle={styles.mh20}
      showsVerticalScrollIndicator={false}
      bounces={false}
      ListEmptyComponent={
        loading ? (
          <ZLoader height={120} top={80} />
        ) : (
          <ZText
            style={{
              textAlign: 'center',
              marginTop: 150,
              maxWidth: '90%',
              alignSelf: 'center',
            }}
            type={'B20'}>
            {currentUser?._id === userId
              ? strings.noFollower
              : strings.noFollowerUser}
          </ZText>
        )
      }
      // Pagination props
      onEndReachedThreshold={0.1}
      onEndReached={fetchNextPage}
      ListFooterComponent={
        hasNextPage ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null
      }
    />
  );
}
