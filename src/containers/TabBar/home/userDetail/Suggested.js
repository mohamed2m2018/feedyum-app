import {FlatList} from 'react-native';
import React from 'react';
import UserDetailComponent from '../../../../components/UserDetailComponent';
import {styles} from '../../../../themes';
import {userDetail} from '../../../../api/constant';

export default function Suggested() {
  return (
    <FlatList
      data={userDetail}
      renderItem={({item, index}) => (
        <UserDetailComponent
          userName={item?.name}
          userImage={item?.imgUrl}
          userDescription={item?.description}
          isFollowed={item?.isFollow}
          key={index}
          isSuggested={true}
        />
      )}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.mh20}
    />
  );
}
