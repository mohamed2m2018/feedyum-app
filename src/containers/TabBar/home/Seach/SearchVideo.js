import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import LiveComponent from '../../../../components/LiveComponent';
import {FlashList} from '@shopify/flash-list';
import ZText from '../../../../components/common/ZText';

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
        ListEmptyComponent={
          !props.isFetching && (
            <ZText style={{textAlign: 'center', marginTop: 250}} type={'B20'}>
              No Dishes matches your search term.
            </ZText>
          )
        }
        renderItem={({item}) => {
          return (
            <LiveComponent
              id={item._id}
              data={item?.caption}
              reelUrl={item?.avatarUri || item?.poster}
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
