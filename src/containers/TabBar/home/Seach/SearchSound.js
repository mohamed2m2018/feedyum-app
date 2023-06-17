import {FlatList} from 'react-native';
import React from 'react';
import SoundComponent from '../../../../components/SoundComponent';
import {searchMusicData} from '../../../../api/constant';

export default function SearchSound() {
  return (
    <FlatList
      data={searchMusicData}
      renderItem={({item, index}) => (
        <SoundComponent
          key={index}
          title={item?.title}
          imgUrl={item?.imgUrl}
          artist={item?.artist}
          time={item?.time}
          totalViews={item?.totalViews}
        />
      )}
      keyExtractor={(item, index) => index.toString()}
    />
  );
}
