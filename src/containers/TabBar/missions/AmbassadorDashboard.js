// Library imports
import React, {useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInUp, FadeInDown} from 'react-native-reanimated';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZLoader from '../../../components/common/ZLoader';
import RankBadge from './components/RankBadge';
import EarningsCard from './components/EarningsCard';
import MilestoneProgress from './components/MilestoneProgress';
import CountdownTimer from './components/CountdownTimer';
import {useAmbassadorDashboard} from '../../../hooks/useMissions';
import {styles as themeStyles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';
import {commonColor} from '../../../themes/colors';
import strings from '../../../i18n/strings';

const AnimatedView = Animated.createAnimatedComponent(View);

// Format large numbers as "2.4K", "1.2M" etc
const formatCompactNumber = value => {
  if (value == null) return '0';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return String(value);
};

// Format currency with commas
const formatCurrency = value => {
  if (value == null) return '0.00';
  return Number(value).toLocaleString('en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function AmbassadorDashboard() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const {
    data: dashboardData,
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useAmbassadorDashboard();

  const dashboard = dashboardData?.data || dashboardData;
  const wallet = dashboard?.wallet || {};
  const stats = dashboard?.stats || {};
  const activeMissions = dashboard?.activeMissions || [];
  const recentEarnings = dashboard?.recentEarnings || [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && !dashboard) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.myMissions || 'My Missions'} fallbackRoute={StackNav.MissionsHub} />
        <ZLoader />
      </ZSafeAreaView>
    );
  }
  if (isError && !dashboard) {
    return <ZSafeAreaView><ZHeader title={strings.myMissions || 'My Missions'} fallbackRoute={StackNav.MissionsHub} /><View style={localStyles.emptyContainer} accessibilityRole="alert"><Ionicons name="cloud-offline-outline" size={moderateScale(48)} color={commonColor.redColor} /><ZText type="r16" color={commonColor.redColor}>Could not load your mission dashboard</ZText><ZButton title="Retry" onPress={refetch} containerStyle={localStyles.browseButton} color={commonColor.white} /></View></ZSafeAreaView>;
  }

  // Balance hero card
  const renderBalanceHero = () => (
    <AnimatedView entering={FadeInDown.duration(500)}>
      <LinearGradient
        colors={['#FF4D67', '#FF8A9E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={localStyles.heroCard}>
        <View style={localStyles.heroTop}>
          <View style={localStyles.levelPill}>
            <RankBadge level={wallet.ambassadorLevel} size={moderateScale(20)} />
          </View>
        </View>

        <ZText type="r14" color={commonColor.white} style={localStyles.balanceLabel}>
          Total Balance
        </ZText>
        <ZText type="b36" color={commonColor.white}>
          EGP {formatCurrency(wallet.balance)}
        </ZText>
        <ZText type="r14" color={commonColor.white} style={localStyles.pendingText}>
          Pending: EGP {formatCurrency(wallet.pendingBalance)}
        </ZText>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate(StackNav.AmbassadorWallet)}
          style={localStyles.transferButton}>
          <ZText type="b14" color={commonColor.white}>
            Transfer to Wallet
          </ZText>
        </TouchableOpacity>
      </LinearGradient>
    </AnimatedView>
  );

  // Stats grid (2x2)
  const renderStatsGrid = () => {
    const statsItems = [
      {
        icon: 'rocket-outline',
        label: 'Active Missions',
        value: stats.totalActiveMissions ?? 0,
        color: commonColor.primary,
      },
      {
        icon: 'cube-outline',
        label: 'Orders Generated',
        value: stats.totalOrdersGenerated ?? 0,
        color: commonColor.blue,
      },
      {
        icon: 'eye-outline',
        label: 'Total Views',
        value: formatCompactNumber(stats.totalViews),
        color: commonColor.orange,
      },
      {
        icon: 'trophy-outline',
        label: 'Best Rank',
        value: stats.bestRank ? `#${stats.bestRank}` : '—',
        color: commonColor.green,
      },
    ];

    return (
      <AnimatedView
        entering={FadeInUp.delay(200).duration(400)}
        style={localStyles.statsGrid}>
        {statsItems.map((stat, idx) => (
          <View
            key={idx}
            style={[
              localStyles.statCard,
              {backgroundColor: colors.inputBg},
            ]}>
            <Ionicons
              name={stat.icon}
              size={moderateScale(22)}
              color={stat.color}
            />
            <ZText type="b18" style={localStyles.statValue}>
              {stat.value}
            </ZText>
            <ZText type="r12" color={commonColor.grayScale5}>
              {stat.label}
            </ZText>
          </View>
        ))}
      </AnimatedView>
    );
  };

  // Active missions section
  const renderActiveMissions = () => {
    if (!activeMissions.length) {
      return (
        <AnimatedView
          entering={FadeInUp.delay(400).duration(400)}
          style={localStyles.section}>
          <ZText type="b18" style={localStyles.sectionTitle}>
            Active Missions
          </ZText>
          <View style={localStyles.emptyContainer}>
            <Ionicons
              name="compass-outline"
              size={moderateScale(48)}
              color={commonColor.grayScale5}
            />
            <ZText
              type="r16"
              color={commonColor.grayScale5}
              style={localStyles.emptyText}>
              No active missions yet
            </ZText>
            <ZButton
              title="Browse Missions"
              onPress={() => navigation.navigate(StackNav.MissionsHub)}
              containerStyle={localStyles.browseButton}
              textType="b14"
              color={commonColor.white}
            />
          </View>
        </AnimatedView>
      );
    }

    return (
      <AnimatedView
        entering={FadeInUp.delay(400).duration(400)}
        style={localStyles.section}>
        <ZText type="b18" style={localStyles.sectionTitle}>
          Active Missions
        </ZText>
        {activeMissions.map((mission, idx) => {
          const currentOrders = mission.ordersGenerated ?? 0;
          const milestones = mission.milestones || [];
          const nextMilestone = milestones.find(m => m.threshold > currentOrders);
          const nextThreshold = nextMilestone?.threshold || currentOrders || 1;
          const progress = nextThreshold > 0 ? Math.min(currentOrders / nextThreshold, 1) : 0;

          return (
            <TouchableOpacity
              key={mission._id || mission.id || idx}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate(StackNav.MissionDetail, {
                  missionId: mission._id || mission.id,
                })
              }
              style={[
                localStyles.missionCard,
                {backgroundColor: colors.inputBg},
              ]}>
              <View style={localStyles.missionHeader}>
                <ZText type="b14" numberOfLines={1} style={localStyles.missionName}>
                  {mission.title || mission.name || 'Mission'}
                </ZText>
                {mission.rank != null && (
                  <View style={localStyles.rankPill}>
                    <ZText type="b12" color={commonColor.primary}>
                      #{mission.rank}
                    </ZText>
                  </View>
                )}
              </View>

              <MilestoneProgress
                milestones={milestones}
                currentOrders={currentOrders}
                compact
              />

              <View style={localStyles.missionFooter}>
                <ZText type="b14" color={commonColor.green}>
                  EGP {formatCurrency(mission.earned || 0)} earned
                </ZText>
                <CountdownTimer endDate={mission.endDate} />
              </View>
            </TouchableOpacity>
          );
        })}
      </AnimatedView>
    );
  };

  // Recent earnings section
  const renderRecentEarnings = () => {
    if (!recentEarnings.length) return null;

    const last5 = recentEarnings.slice(0, 5);

    return (
      <AnimatedView
        entering={FadeInUp.delay(600).duration(400)}
        style={localStyles.section}>
        <ZText type="b18" style={localStyles.sectionTitle}>
          Recent Earnings
        </ZText>
        {last5.map((txn, idx) => (
          <EarningsCard key={txn._id || txn.id || idx} transaction={txn} />
        ))}
      </AnimatedView>
    );
  };

  // Browse more missions link
  const renderBrowseMore = () => (
    <AnimatedView
      entering={FadeInUp.delay(700).duration(400)}
      style={localStyles.browseMoreContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate(StackNav.MissionsHub)}
        style={localStyles.browseMoreBtn}>
        <ZText type="b14" color={commonColor.primary}>
          Browse More Missions
        </ZText>
        <Ionicons
          name="arrow-forward"
          size={moderateScale(16)}
          color={commonColor.primary}
        />
      </TouchableOpacity>
    </AnimatedView>
  );

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.myMissions || 'My Missions'} fallbackRoute={StackNav.MissionsHub} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={commonColor.primary}
            colors={[commonColor.primary]}
          />
        }>
        {renderBalanceHero()}
        {renderStatsGrid()}
        {renderActiveMissions()}
        {renderRecentEarnings()}
        {renderBrowseMore()}
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(100),
  },

  // Balance hero card
  heroCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    marginBottom: moderateScale(16),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: moderateScale(12),
  },
  levelPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
  },
  balanceLabel: {
    opacity: 0.7,
    marginBottom: moderateScale(4),
  },
  pendingText: {
    opacity: 0.7,
    marginTop: moderateScale(6),
  },
  transferButton: {
    borderWidth: 1,
    borderColor: commonColor.white,
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(24),
    alignSelf: 'flex-start',
    marginTop: moderateScale(16),
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    gap: moderateScale(4),
  },
  statValue: {
    marginTop: moderateScale(2),
  },

  // Section
  section: {
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },

  // Mission cards
  missionCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  missionName: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  rankPill: {
    backgroundColor: commonColor.primaryTransparent,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  browseButton: {
    paddingHorizontal: moderateScale(32),
  },

  // Browse more
  browseMoreContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  browseMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
});
