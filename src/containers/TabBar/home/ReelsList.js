import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
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
  isFetching,
  refetch,
  isFetchingStory,
  isCommentOpen,
}) => {
  const containerStyle = layoutHeight > 0
    ? { height: layoutHeight }
    : { flex: 1 };

  return (
    <View style={{ flex: 1 }} onLayout={onSetLayout}>
      <View style={containerStyle}>
        {/* TESTING: Using FlatList instead of FlashList to isolate the issue */}
        <FlatList
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
          getItemLayout={(data, index) => ({
            length: layoutHeight,
            offset: layoutHeight * index,
            index,
          })}
          onEndReachedThreshold={0.5}
          onEndReached={
            hasNextPage && !isLoading && !isRefetching ? fetchNextPage : null
          }
          ListFooterComponent={
            isFetchingNextPage && (
              <ActivityIndicator size={'large'} color={'#FF4D67'} />
            )
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          initialNumToRender={2}
          windowSize={3}
        />
      </View>
    </View>
  );
};

export default React.memo(ReelsList);
