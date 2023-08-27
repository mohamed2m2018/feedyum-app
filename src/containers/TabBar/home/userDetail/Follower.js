import {ActivityIndicator, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import {useQuery} from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import {useSelector} from 'react-redux';
import Spinner from 'react-native-loading-spinner-overlay';

export default function Following({
  followingData: userDetail,
  fetchNextPage,
  hasNextPage,
  loading,
  setisFetching,
  userId,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [isAdding, setIsAdding] = useState(false);
  const {data: currentUserQuery} = useQuery(
    'user',
    () => request.get('/user'),
    {retry: 1},
  );
  const currentUser = currentUserQuery?.data?.user;
  const renderItem = ({item}) => {
    return (
      <UserDetailComponent
        userName={item?.follower_id?.fullName}
        userImage={item?.follower_id?.avatar}
        isFollowed={!!item?.currentUserFollowed?._id}
        id={item?.follower_id?._id}
        setisFetching={setisFetching}
        currentUserId={currentUser?._id}
        setIsAdding={setIsAdding}
      />
    );
  };

  useEffect(() => {
    if (loading || isAdding) {
      setisFetching(true);
    } else {
      setisFetching(false);
    }
  }, [loading, isAdding]);

  return (
    <>
      <Spinner visible={loading || isAdding} color={colors.primary} />
      <FlatList
        data={userDetail}
        renderItem={renderItem}
        extraData={loading || isAdding}
        keyExtractor={item => item?._id + 'follower'}
        contentContainerStyle={styles.mh20}
        showsVerticalScrollIndicator={false}
        bounces={false}
        ListEmptyComponent={
          loading ? null : (
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
        onEndReachedThreshold={0.8}
        onEndReached={fetchNextPage}
        ListFooterComponent={
          hasNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null
        }
      />
    </>
  );
}
