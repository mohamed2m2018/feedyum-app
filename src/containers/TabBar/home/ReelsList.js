import React from 'react';
import {ActivityIndicator, Platform, RefreshControl} from 'react-native';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import {FlashList} from '@shopify/flash-list';

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
  isFetching,
  refetch,
  isFetchingStory,
}) => {
  return (
    <FlashList
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
      drawDistance={layoutHeight * 2} // Increase draw distance for better performance
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
        (isLoading || isRefetching || !user || isFetching) && !isFetchingStory ? (
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
      estimatedItemSize={700}
      onEndReachedThreshold={0.5} // Reduce threshold for better pagination
      onEndReached={
        hasNextPage && !isLoading && !isRefetching ? fetchNextPage : null
      }
      ListFooterComponent={
        isFetchingNextPage && (
          <ActivityIndicator size={'large'} color={'#FF4D67'} />
        )
      }
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      updateCellsBatchingPeriod={100}
      initialNumToRender={3}
      windowSize={5}
    />
  );
};

export default React.memo(ReelsList);
