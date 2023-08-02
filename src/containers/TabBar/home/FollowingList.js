import React from 'react';
import {ActivityIndicator, Platform, RefreshControl} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import {FlashList} from '@shopify/flash-list';
import {useQueryClient} from 'react-query';
import {useSelector} from 'react-redux';
import ZText from '../../../components/common/ZText';
import strings from '../../../i18n/strings';

const FollowingList = ({
  isLoadingFollowing,
  isFetchingFollowing,
  isRefetchingFollowing,
  filteredDataFollowing,
  layoutHeight,
  isFetchingNextPageFollowing,
  fetchNextPageFollowing,
  flatListRefFollowing,
  extraData,
  viewableItemsChanged,
  keyExtractor,
  renderReelComponent,
  onSetLayout,
  viewConfig,
  hasNextPageFollowin,
}) => {
  const queryClient = useQueryClient();
  const colors = useSelector(state => state.theme.theme);

  return (
    <>
      <Spinner
        size={'large'}
        //visibility of Overlay Loading Spinner
        visible={
          isLoadingFollowing || isFetchingFollowing || isRefetchingFollowing
        }
      />
      <FlashList
        data={filteredDataFollowing.current}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoadingFollowing || isFetchingFollowing}
            tintColor={colors.primary}
            onRefresh={() => {
              queryClient.invalidateQueries({
                queryKey: 'stories_following',
              });
            }}
          />
        }
        ListEmptyComponent={
          isLoadingFollowing ? null : (
            <ZText style={{textAlign: 'center', marginTop: 250}} type={'B24'}>
              {strings.noDishesYetFollow}
            </ZText>
          )
        }
        estimatedItemSize={layoutHeight}
        ref={flatListRefFollowing}
        onEndReachedThreshold={0.9}
        onEndReached={hasNextPageFollowin ? fetchNextPageFollowing : null}
        ListFooterComponent={
          isFetchingNextPageFollowing && <ActivityIndicator size={'large'} />
        }
      />
    </>
  );
};

export default FollowingList;
