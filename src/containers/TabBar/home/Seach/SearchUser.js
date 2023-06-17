import React from 'react';
import {View} from 'react-native';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {FlashList} from '@shopify/flash-list';

export default function SearchUser({users, ...props}) {
  return (
    <View style={{flex: 1}}>
      <FlashList
        data={users}
        {...props}
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
