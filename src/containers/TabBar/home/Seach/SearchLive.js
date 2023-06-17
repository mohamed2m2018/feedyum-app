import {FlatList} from 'react-native';
import React from 'react';
import LiveComponent from '../../../../components/LiveComponent';
import {videoData} from '../../../../api/constant';

export default function SearchLive() {
  return (
    <FlatList
      data={videoData}
      renderItem={({item, index}) => (
        <LiveComponent
          reelUrl={item?.uri?.replace('mp4', 'jpg')}
          userName={item?.channelName}
          user={item?.views}
        />
      )}
      keyExtractor={(item, index) => index.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
    />
  );
}
