import {FlashList} from '@shopify/flash-list';
import React from 'react';
import {ActivityIndicator, FlatList, Platform, RefreshControl} from 'react-native';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';

const ReelsList = ({
  filteredData,
  extraData,
  keyExtractor,
  renderReelComponent,
  viewConfig,
  viewableItemsChanged,
  layoutHeight,
  isLoading,
  onSetLayout,
  flatListRef,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  user,
  emptylistMessage,
  isRefetching,
  refetch,
}) => {
  return (
    <FlatList
      data={filteredData}
      extraData={extraData}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      renderItem={renderReelComponent}
      pagingEnabled={Platform.OS === 'ios'}
      viewabilityConfig={viewConfig}
      onViewableItemsChanged={viewableItemsChanged}
      onLayout={onSetLayout}
      snapToInterval={Platform.OS === 'android' ? layoutHeight : undefined}
      drawDistance={layoutHeight}
      decelerationRate={'fast'}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
        />
      }
      disableIntervalMomentum
      ListEmptyComponent={
        isLoading || isRefetching || !user ? (
          <ZLoader height={150} top={300} />
        ) : (
          <ZText
            align="center"
            type={'m28'}
            style={{alignSelf: 'center', marginTop: 300}}>
            {emptylistMessage}
          </ZText>
        )
      }
      ref={flatListRef}
      estimatedItemSize={11}
      onEndReachedThreshold={0.4}
      onEndReached={hasNextPage ? fetchNextPage : null}
      ListFooterComponent={
        isFetchingNextPage && (
          <ActivityIndicator size={'large'} color={'#FF4D67'} />
        )
      }
    />
  );
};

export default React.memo(ReelsList);
