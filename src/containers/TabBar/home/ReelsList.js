import React from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import { FlashList } from '@shopify/flash-list';

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
  isCommentOpen,
}) => {
  // KEY FIX: Container uses EXACT same height as items
  // This eliminates any mismatch between container and item heights
  const containerStyle = layoutHeight > 0
    ? { height: layoutHeight }
    : { flex: 1 };

  return (
    <View style={{ flex: 1 }} onLayout={onSetLayout}>
      <View style={containerStyle}>
        <FlashList
          data={filteredData}
          extraData={extraData}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          renderItem={renderReelComponent}
          pagingEnabled={true}
          viewabilityConfig={viewConfig}
          onViewableItemsChanged={viewableItemsChanged}
          snapToInterval={layoutHeight}
          snapToAlignment="start"
          scrollEnabled={!isCommentOpen}
          decelerationRate={'fast'}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
            />
          }
          disableIntervalMomentum={true}
          ListEmptyComponent={
            (isLoading || (isRefetching && filteredData.length === 0) || !user) && !isFetchingStory ? (
              <ZLoader height={150} top={300} />
            ) : (
              <ZText
                align="center"
                type={'m28'}
                style={{ alignSelf: 'center', marginTop: 300 }}>
                {emptylistMessage}
              </ZText>
            )
          }
          ref={flatListRef}
          estimatedItemSize={layoutHeight || 800}
          overrideItemLayout={(layout) => {
            layout.size = layoutHeight;
          }}
          onEndReachedThreshold={0.5}
          onEndReached={
            hasNextPage && !isLoading && !isRefetching ? fetchNextPage : null
          }
          ListFooterComponent={
            isFetchingNextPage && (
              <ActivityIndicator size={'large'} color={'#FF4D67'} />
            )
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          drawDistance={layoutHeight * 3} // Render 3 screens ahead to allow pre-loading
          windowSize={5} // Keep more items in memory to reduce mounting churn
        />
      </View>
    </View>
  );
};

export default React.memo(ReelsList);
