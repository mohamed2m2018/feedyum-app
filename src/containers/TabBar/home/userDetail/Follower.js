import {ActivityIndicator, FlatList} from 'react-native';
import React from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import {useQuery} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';

export default function Following({
  followingData: userDetail,
  fetchNextPage,
  hasNextPage,
  loading,
}) {
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
            {strings.noFollower}
          </ZText>
        )
      }
      // Pagination props
      onEndReachedThreshold={0.1}
      onEndReached={fetchNextPage}
      ListFooterComponent={
        hasNextPage ? <ActivityIndicator size="small" color="#000000" /> : null
      }
    />
  );
}
