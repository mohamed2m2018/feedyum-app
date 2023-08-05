import React from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
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
  isFetched,
}) => {
  const queryClient = useQueryClient();
  const colors = useSelector(state => state.theme.theme);

  return (
    <>
      <Spinner
        size={'large'}
        color={colors.primary}
        visible={
          isLoadingStory ||
          isFetchingStory ||
          isRefetchingStory ||
          (!isFetched && !data) ||
          !data?.data?.user?._id
        }
      />
      <FlatList
        data={filteredData.current}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
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
        windowSize={10}
        drawDistance={layoutHeight}
        decelerationRate={0.3}
        disableIntervalMomentum
        ListEmptyComponent={
          isLoading || !data?.data?.user?._id ? null : (
            <ZText style={{textAlign: 'center', marginTop: 350}} type={'B24'}>
              {strings.noDishesYetForYou}
            </ZText>
          )
        }
        estimatedItemSize={11}
        ref={flatListRef}
        onEndReachedThreshold={0.9}
        onEndReached={hasNextPage ? fetchNextPage : null}
        ListFooterComponent={
          isFetchingNextPage && (
            <ActivityIndicator color={colors.primary} size={'large'} />
          )
        }
      />
    </>
  );
};

export default ForYouList;
