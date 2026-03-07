import { FlatList, View } from 'react-native';
import React from 'react';
import LiveComponent from '../../../../components/LiveComponent';
import { videoData } from '../../../../api/constant';

export default function SearchLive() {
  return (
    <FlatList
      data={videoData}
      renderItem={({ item, index }) => (
        <View style={{ flex: 1, maxWidth: '50%' }}>
          <LiveComponent
            reelUrl={item?.avatarUri || item?.poster}
            userName={item?.channelName}
            user={item?.views}
          />
        </View>
      )}
      keyExtractor={(item, index) => index.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
    />
  );
}
