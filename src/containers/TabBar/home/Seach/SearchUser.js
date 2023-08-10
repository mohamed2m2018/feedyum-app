import React from 'react';
import {View} from 'react-native';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {FlashList} from '@shopify/flash-list';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';

export default function SearchUser({users, ...props}) {
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
      />
    </View>
  );
}
