import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {FlashList} from '@shopify/flash-list';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import {useSelector} from 'react-redux';

export default function SearchUser({users, ...props}) {
  const colors = useSelector(state => state.theme.theme);
  return (
    <View style={{flex: 1}}>
      <FlashList
        data={users}
        {...props}
        estimatedItemSize={100}
        ListEmptyComponent={
          !props.isFetching && (
            <ZText style={{textAlign: 'center', marginTop: 250}} type={'B20'}>
              {strings.noUsersMatch}
            </ZText>
          )
        }
        renderItem={({item}) => {
          return (
            <UserDetailComponent
              userName={item?.fullName}
              userImage={item?.avatar}
              userDescription={item?.description}
              isFollowed={item?.currentUserFollowed}
              id={item?._id}
            />
          );
        }}
        keyExtractor={item => item?._id}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          props.isFetchingNextPage && (
            <ActivityIndicator size={'small'} color={colors.primary} />
          )
        }
      />
    </View>
  );
}
