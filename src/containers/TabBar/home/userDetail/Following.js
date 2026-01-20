import { ActivityIndicator, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import { styles } from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import { useQuery } from 'react-query';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';
import { useSelector } from 'react-redux';
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
  const { data: currentUserQuery } = useQuery(
    'user',
    () => request.get('/user'),
    { retry: 1 },
  );
  const currentUser = currentUserQuery?.data?.user;

  const renderItem = ({ item }) => {
    return (
      <UserDetailComponent
        userName={item?.following_id?.fullName}
        userImage={item?.following_id?.avatar}
        setisFetching={setisFetching}
        isFollowed={!!item?.currentUserFollowed?._id}
        id={item?.following_id?._id}
        currentUserId={currentUser?._id}
        setIsAdding={setIsAdding}
        userType={item?.following_id?.type}
        currentUserType={currentUser?.type}
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
        keyExtractor={item => item?._id + 'following'}
        contentContainerStyle={styles.mh20}
        showsVerticalScrollIndicator={false}
        extraData={loading || isAdding}
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
                ? strings.notFollowing
                : strings.notFollowingUser}
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
