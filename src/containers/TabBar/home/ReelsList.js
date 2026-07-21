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
  isWaitingForDeepLinkStory,
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
            ((isLoading || isFetching || isRefetching) && !isFetchingStory) || isWaitingForDeepLinkStory ? (
              <ZLoader height={150} top={300} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: layoutHeight ? layoutHeight * 0.3 : 200, paddingHorizontal: 40 }}>
                <ZText align="center" type={'m18'} style={{ opacity: 0.5, marginBottom: 8 }}>
                  {'🍽️'}
                </ZText>
                <ZText align="center" type={'b18'} style={{ opacity: 0.7, marginBottom: 6 }}>
                  {emptylistMessage}
                </ZText>
              </View>
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
          updateCellsBatchingPeriod={30}
          initialNumToRender={3}
          windowSize={5}
        />
      </View>
    </View>
  );
};

export default React.memo(ReelsList);
