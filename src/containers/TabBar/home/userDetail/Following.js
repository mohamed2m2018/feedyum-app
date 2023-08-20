import {ActivityIndicator, FlatList} from 'react-native';
import React from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import {useQuery} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import {useSelector} from 'react-redux';

export default function Following({
  followingData: userDetail,
  fetchNextPage,
  hasNextPage,
  loading,
  setisFetching,
  userId,
}) {
  const {data: currentUserQuery} = useQuery(
    'user',
    () => request.get('/user'),
    {retry: 1},
  );
  const colors = useSelector(state => state.theme.theme);

  const currentUser = currentUserQuery?.data?.user;

  const renderItem = ({item}) => (
    <UserDetailComponent
      userName={item?.following_id?.fullName}
      userImage={item?.following_id?.avatar}
      setisFetching={setisFetching}
      isFollowed={item?.currentUserFollowed}
      key={item?.following_id?._id}
      id={item?.following_id?._id}
      currentUserId={currentUser?._id}
    />
  );
  return (
    <FlatList
      data={userDetail}
      renderItem={renderItem}
      keyExtractor={item => item?._id}
      contentContainerStyle={styles.mh20}
      showsVerticalScrollIndicator={false}
      extraData={userDetail}
      bounces={false}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator
            style={{marginTop: 50}}
            size={'large'}
            color={'red'}
          />
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
              ? strings.notFollowing
              : strings.notFollowingUser}
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
