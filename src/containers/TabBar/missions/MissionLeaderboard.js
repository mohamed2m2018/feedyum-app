// Library imports
import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {FadeInUp, FadeInDown} from 'react-native-reanimated';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import LeaderboardRow from './components/LeaderboardRow';
import {useMissionLeaderboard} from '../../../hooks/useMissions';
import {styles as themeStyles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {commonColor} from '../../../themes/colors';

const AnimatedView = Animated.createAnimatedComponent(View);

const PODIUM_COLORS = {
  1: '#FFD300',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

const PAGE_LIMIT = 20;

// Format a number with comma separators
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'EGP ' + num.toLocaleString('en-US', {maximumFractionDigits: 0});
}

// Truncate a name to maxLen characters
function truncateName(name, maxLen = 12) {
  if (!name) return 'Anonymous';
  return name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
}

export default function MissionLeaderboard() {
  const colors = useSelector(state => state.theme.theme);
  const route = useRoute();
  const {missionId, missionTitle} = route.params || {};

  const [page, setPage] = useState(1);

  // Data
  const {data, isLoading, refetch, isRefetching} = useMissionLeaderboard(
    missionId,
    {page, limit: PAGE_LIMIT},
  );

  const participants = data?.data?.participants || data?.participants || [];
  const total = data?.data?.total || data?.total || 0;
  const totalPages = data?.data?.pages || data?.pages || 1;
  const myRank = data?.data?.myRank || data?.myRank;

  // Top 3 for podium (from full list)
  const podiumEntries = useMemo(() => participants.slice(0, 3), [participants]);

  // Remaining participants (rank 4+)
  const listEntries = useMemo(() => participants.slice(3), [participants]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  // Load more
  const handleEndReached = useCallback(() => {
    if (!isLoading && page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, page, totalPages]);

  // --- Podium ---
  const renderPodiumAvatar = (entry, place) => {
    const size = place === 1 ? moderateScale(64) : moderateScale(48);
    const ringColor = PODIUM_COLORS[place];

    if (entry?.user?.avatar) {
      return (
        <View
          style={[
            localStyles.podiumAvatarRing,
            {
              width: size + moderateScale(6),
              height: size + moderateScale(6),
              borderRadius: (size + moderateScale(6)) / 2,
              borderColor: ringColor,
            },
          ]}>
          <Image
            source={{uri: entry.user.avatar}}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          />
        </View>
      );
    }

    return (
      <View
        style={[
          localStyles.podiumAvatarRing,
          {
            width: size + moderateScale(6),
            height: size + moderateScale(6),
            borderRadius: (size + moderateScale(6)) / 2,
            borderColor: ringColor,
          },
        ]}>
        <Ionicons
          name="person-circle-outline"
          size={size}
          color={commonColor.grayScale4}
        />
      </View>
    );
  };

  const renderPodiumEntry = (entry, place) => {
    if (!entry) return <View style={localStyles.podiumColumn} />;

    const isCenter = place === 1;

    return (
      <View
        style={[
          localStyles.podiumColumn,
          isCenter && localStyles.podiumCenter,
        ]}>
        {renderPodiumAvatar(entry, place)}
        <ZText type="b14" style={localStyles.podiumMedal}>
          {MEDALS[place - 1]}
        </ZText>
        <ZText type="s14" numberOfLines={1} style={localStyles.podiumName}>
          {truncateName(entry.user?.fullName || entry.user?.username)}
        </ZText>
        <ZText type="b14" color={commonColor.primary}>
          {entry.metrics?.totalOrdersGenerated ?? 0} orders
        </ZText>
        <ZText type="r12" color={commonColor.grayScale7}>
          {formatCurrency(entry.metrics?.totalCommissionEarned)}
        </ZText>
      </View>
    );
  };

  const renderPodium = () => {
    if (!podiumEntries.length) return null;

    // Arrange as: #2 (left), #1 (center), #3 (right)
    const first = podiumEntries[0] || null;
    const second = podiumEntries[1] || null;
    const third = podiumEntries[2] || null;

    return (
      <AnimatedView
        entering={FadeInUp.delay(200).duration(400)}
        style={[
          localStyles.podiumContainer,
          {backgroundColor: colors.inputBg},
          themeStyles.shadowStyle,
        ]}>
        {renderPodiumEntry(second, 2)}
        {renderPodiumEntry(first, 1)}
        {renderPodiumEntry(third, 3)}
      </AnimatedView>
    );
  };

  // --- Your Position ---
  const renderMyRank = () => {
    if (!myRank || !myRank.rank) return null;

    return (
      <AnimatedView
        entering={FadeInUp.delay(300).duration(400)}
        style={localStyles.myRankWrapper}>
        <ZText type="b16" style={localStyles.sectionLabel}>
          Your Position
        </ZText>
        <LeaderboardRow
          participant={{
            user: myRank.user,
            completedOrders: myRank.metrics?.totalOrdersGenerated ?? 0,
          }}
          rank={myRank.rank}
          isCurrentUser={true}
          style={localStyles.myRankRow}
        />
      </AnimatedView>
    );
  };

  // --- List items ---
  const renderItem = useCallback(
    ({item, index}) => {
      const actualRank = item.rank || index + 4;

      return (
        <LeaderboardRow
          participant={{
            user: item.user,
            completedOrders: item.metrics?.totalOrdersGenerated ?? 0,
          }}
          rank={actualRank}
          isCurrentUser={false}
          style={[
            localStyles.listRow,
            index % 2 === 1 && {
              backgroundColor: colors.inputBg + '80',
            },
          ]}
        />
      );
    },
    [colors.inputBg],
  );

  const keyExtractor = useCallback(
    (item, index) => item.user?._id || `rank-${index}`,
    [],
  );

  // --- Footer loader ---
  const renderFooter = () => {
    if (page >= totalPages) return null;
    return (
      <View style={localStyles.footerLoader}>
        <ActivityIndicator size="small" color={commonColor.primary} />
      </View>
    );
  };

  // --- Empty state ---
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={localStyles.emptyContainer}>
        <Ionicons
          name="trophy-outline"
          size={moderateScale(64)}
          color={commonColor.grayScale5}
        />
        <ZText
          type="r16"
          color={commonColor.grayScale5}
          style={localStyles.emptyText}>
          No participants yet
        </ZText>
        <ZText
          type="r14"
          color={commonColor.grayScale5}
          style={localStyles.emptySubtext}>
          Be the first to join this mission!
        </ZText>
      </View>
    );
  };

  // --- List header (podium + my rank) ---
  const renderListHeader = () => (
    <View style={localStyles.listHeader}>
      {renderPodium()}
      {renderMyRank()}
      {listEntries.length > 0 && (
        <ZText type="b16" style={localStyles.sectionLabel}>
          All Participants
        </ZText>
      )}
    </View>
  );

  // --- Loading state ---
  if (isLoading && !participants.length) {
    return (
      <ZSafeAreaView>
        <ZHeader title={missionTitle || 'Leaderboard'} fallbackRoute={StackNav.MissionsHub} />
        <View style={localStyles.centerContainer}>
          <Ionicons
            name="hourglass-outline"
            size={moderateScale(32)}
            color={commonColor.primary}
          />
          <ZText
            type="r14"
            color={commonColor.grayScale5}
            style={localStyles.loadingText}>
            Loading leaderboard...
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={missionTitle || 'Leaderboard'} fallbackRoute={StackNav.MissionsHub} />

      <FlatList
        data={listEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          !podiumEntries.length ? renderEmpty : null
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={commonColor.primary}
            colors={[commonColor.primary]}
          />
        }
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
  },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(40),
  },
  listHeader: {
    marginBottom: moderateScale(8),
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    marginTop: moderateScale(8),
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    gap: moderateScale(4),
  },
  podiumCenter: {
    marginTop: moderateScale(-20),
  },
  podiumAvatarRing: {
    borderWidth: moderateScale(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumMedal: {
    marginTop: moderateScale(2),
  },
  podiumName: {
    textAlign: 'center',
    maxWidth: moderateScale(80),
  },

  // My rank
  myRankWrapper: {
    marginTop: moderateScale(16),
  },
  myRankRow: {
    borderRadius: moderateScale(12),
  },
  sectionLabel: {
    marginBottom: moderateScale(8),
    marginTop: moderateScale(4),
  },

  // List rows
  listRow: {
    borderRadius: moderateScale(8),
  },

  // Footer
  footerLoader: {
    paddingVertical: moderateScale(16),
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyText: {
    marginTop: moderateScale(16),
  },
  emptySubtext: {
    marginTop: moderateScale(6),
  },
});
