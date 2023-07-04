import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import LiveComponent from '../../../../components/LiveComponent';
import {FlashList} from '@shopify/flash-list';
import {getVideoExtension} from '../../../../common/constants';

export default function SearchVideo({
  stories = [],
  isFetchingNextPage,
  ...props
}) {
  return (
    <View style={{flex: 1}}>
      <FlashList
        data={stories}
        contentContainerStyle={{flex: 1}}
        ListFooterComponent={
          <View style={{height: 100}}>
            {isFetchingNextPage && <ActivityIndicator size={'small'} />}
          </View>
        }
        renderItem={({item}) => {
          return (
            <LiveComponent
              id={item._id}
              data={item?.caption}
              reelUrl={item?.uri?.replace(getVideoExtension(item?.uri), 'jpg')}
              userName={item?.caption}
            />
          );
        }}
        {...props}
        keyExtractor={item => item?._id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
