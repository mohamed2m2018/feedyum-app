import React from 'react';
import {ActivityIndicator, Platform, RefreshControl} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {FlashList} from '@shopify/flash-list';
import {useQueryClient} from 'react-query';
import {useSelector} from 'react-redux';
import ZText from '../../../components/common/ZText';
import strings from '../../../i18n/strings';

const ForYouList = ({
  isLoadingStory,
  isFetchingStory,
  isRefetchingStory,
  filteredData,
  isLoading,
  isFetching,
  layoutHeight,
  isFetchingNextPage,
  fetchNextPage,
  flatListRef,
  data,
  extraData,
  viewableItemsChanged,
  keyExtractor,
  renderReelComponent,
  onSetLayout,
  viewConfig,
  hasNextPage,
}) => {
  const queryClient = useQueryClient();
  const colors = useSelector(state => state.theme.theme);

  return (
    <>
      <Spinner
        size={'large'}
        visible={isLoadingStory || isFetchingStory || isRefetchingStory}
      />
      <FlashList
        data={filteredData.current}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isFetching}
            tintColor={colors.primary}
            onRefresh={() => {
              queryClient.invalidateQueries({queryKey: 'stories'});
            }}
          />
        }
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
        disableIntervalMomentum
        ListEmptyComponent={
          isLoading || !data?.data?.user?._id ? null : (
            <ZText style={{textAlign: 'center', marginTop: 350}} type={'B24'}>
              {strings.noDishesYetForYou}
            </ZText>
          )
        }
        estimatedItemSize={layoutHeight}
        ref={flatListRef}
        onEndReachedThreshold={0.9}
        onEndReached={hasNextPage ? fetchNextPage : null}
        ListFooterComponent={
          isFetchingNextPage && <ActivityIndicator size={'large'} />
        }
      />
    </>
  );
};

export default ForYouList;
