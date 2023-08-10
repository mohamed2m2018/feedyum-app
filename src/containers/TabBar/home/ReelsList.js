import {FlashList} from '@shopify/flash-list';
import React from 'react';
import {ActivityIndicator, Platform, RefreshControl} from 'react-native';
import {useSelector} from 'react-redux';
import ZText from '../../../components/common/ZText';

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
  const colors = useSelector(state => state.theme.theme);

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
          <ActivityIndicator
            style={{alignSelf: 'center', marginTop: 300}}
            size={'large'}
            color={colors.primary}
          />
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
        isFetchingNextPage && <ActivityIndicator size={'large'} />
      }
    />
  );
};

export default React.memo(ReelsList);
