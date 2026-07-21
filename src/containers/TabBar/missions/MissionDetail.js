// Library imports
import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInUp, FadeInDown} from 'react-native-reanimated';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {useMissionDetail, useAcceptMission} from '../../../hooks/useMissions';
import {styles as themeStyles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';
import {commonColor} from '../../../themes/colors';
import {showSuccessToast, showErrorToast} from '../../../utils/toast';
import strings from '../../../i18n/strings';

const AnimatedView = Animated.createAnimatedComponent(View);

// Medal emojis for leaderboard
const MEDALS = ['🥇', '🥈', '🥉'];

export default function MissionDetail() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();
  const {missionId} = route.params || {};

  // Data hooks
  const {
    data: missionData,
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useMissionDetail(missionId);
  const acceptMission = useAcceptMission();

  const mission = missionData?.data?.mission || missionData?.mission || missionData?.data || missionData;
  const participation = missionData?.data?.participation || missionData?.participation || null;
  const restaurant = missionData?.data?.restaurant || null;
  const leaderboard = missionData?.data?.leaderboard || [];
  const availableActions = missionData?.data?.availableActions || [];
  const targetPresentation = missionData?.data?.targetPresentation || mission?.target;
  const rewardState = missionData?.data?.rewardState;
  const milestones = mission?.rewards?.milestones || [];

  // Determine CTA state
  const ctaState = useMemo(() => {
    if (availableActions.includes('accept')) return 'accept';
    if (availableActions.includes('submit_content')) return 'submit_content';
    if (availableActions.includes('share')) return 'share';
    return null;
  }, [availableActions]);

  // Accept mission handler
  const handleAccept = useCallback(async () => {
    try {
      await acceptMission.mutateAsync(missionId);
      showSuccessToast('Mission Accepted', 'You have joined this mission!');
      refetch();
    } catch (error) {
      showErrorToast(
        'Failed to Accept',
        error?.response?.data?.message || 'Something went wrong',
      );
    }
  }, [missionId, acceptMission, refetch]);

  // Share referral link
  const handleShare = useCallback(async () => {
    try {
      const link =
        participation?.referralLink ||
        (participation?.referralCode
          ? `https://feedyum.com/r/${participation.referralCode}`
          : `https://feedyum.com/mission/${missionId}`);
      const claimLink = mission?.type === 'scouting' && participation?.scoutedRestaurant
        ? `https://feedyum.com/claim-restaurant/${participation.scoutedRestaurant}`
        : null;
      await Share.share({
        message: claimLink
          ? `Discover this restaurant on FeedYum: ${link}\nRestaurant owner? Claim the profile: ${claimLink}`
          : `Check out this mission on FeedYum! ${link}`,
        url: link,
      });
    } catch (_) {
      // User cancelled share
    }
  }, [participation, missionId, mission?.type]);

  const restaurantName = mission?.targetRestaurantName || '';
  const areaName = mission?.targetArea || mission?.targetRestaurantAddress || '';
  const missionType = mission?.type;
  const commission = mission?.rewards?.commissionPercentage;
  const scoutBonus = mission?.rewards?.scoutBonusFixed;

  // Navigate to submit content -- for reviewing missions, go to ReviewReelCreator;
  // for scouting missions, go to ScoutRestaurant to search for a place first
  const handleSubmitContent = useCallback(() => {
    if (missionType === 'scouting') {
      navigation.navigate(StackNav.ScoutRestaurant, {missionId});
    } else {
      navigation.navigate(StackNav.ReviewReelCreator, {
        missionId,
        missionData: {
          _id: missionId,
          title: mission?.title,
          restaurantName: restaurantName || mission?.targetRestaurantName,
          restaurantId: restaurant?._id || mission?.targetChefId,
          type: missionType,
        },
        reviewType: 'mission',
      });
    }
  }, [navigation, missionId, mission, restaurantName, restaurant, missionType]);

  const renderHeader = () => (
    <View style={[localStyles.headerSection, {backgroundColor: colors.dark2 || colors.inputBg}]}>
      {/* Type badge */}
      <View style={[localStyles.typeBadge, {backgroundColor: colors.dark3 || '#2a2a2a'}]}>
        <Ionicons
          name={missionType === 'scouting' ? 'compass-outline' : 'star-outline'}
          size={moderateScale(12)}
          color={commonColor.primary}
        />
        <ZText type="s12" color={commonColor.primary}>
          {missionType === 'scouting' ? ' Scouting' : ' Reviewing'}
        </ZText>
      </View>

      {/* Title */}
      <ZText type="b24" color={colors.textColor} style={{marginTop: moderateScale(8)}}>
        {mission?.title || 'Mission'}
      </ZText>

      {/* Restaurant row — tappable */}
      {restaurant && !restaurant.isScoutingArea ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate(StackNav.ProfileDetail, {id: restaurant._id, userName: restaurant.name, userImage: restaurant.avatar})}
          style={localStyles.restaurantRow}>
          {restaurant.avatar ? (
            <Image source={{uri: restaurant.avatar}} style={localStyles.restaurantAvatar} />
          ) : (
            <View style={[localStyles.restaurantAvatar, localStyles.avatarPlaceholder, {backgroundColor: commonColor.primaryTransparent}]}>
              <Ionicons name="restaurant-outline" size={moderateScale(16)} color={commonColor.primary} />
            </View>
          )}
          <View style={localStyles.restaurantInfo}>
            <ZText type="s14" color={colors.textColor} numberOfLines={1}>
              {restaurant.name}
            </ZText>
            {!!restaurant.address && (
              <ZText type="r11" color={colors.grayScale5} numberOfLines={1}>
                {restaurant.address}
              </ZText>
            )}
          </View>
          {restaurant.rating > 0 && (
            <View style={localStyles.ratingRow}>
              <Ionicons name="star" size={moderateScale(12)} color="#FFD300" />
              <ZText type="s12" color={colors.textColor}> {restaurant.rating.toFixed(1)}</ZText>
            </View>
          )}
          <Ionicons name="chevron-forward" size={moderateScale(16)} color={colors.grayScale5} />
        </TouchableOpacity>
      ) : (restaurant?.isScoutingArea || restaurantName || areaName) && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            const loc = restaurant?.location;
            const label = restaurant?.area || areaName || 'Location';
            if (loc && loc.lat && loc.lng) {
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`);
            } else {
              const query = encodeURIComponent(label);
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
            }
          }}
          style={localStyles.locationRow}>
          <Ionicons name={missionType === 'scouting' ? 'compass-outline' : 'location-outline'} size={moderateScale(14)} color={commonColor.primary} />
          <ZText type="r14" color={commonColor.primary} style={{marginLeft: moderateScale(4), textDecorationLine: 'underline'}}>
            {[restaurant?.name || restaurantName, restaurant?.area || restaurant?.address || areaName].filter(Boolean).join(' · ')}
            {targetPresentation?.mode === 'area' && targetPresentation.radiusMeters
              ? ` · ${(targetPresentation.radiusMeters / 1000).toFixed(1)} km radius`
              : ''}
          </ZText>
          <Ionicons name="open-outline" size={moderateScale(12)} color={commonColor.primary} style={{marginLeft: moderateScale(4)}} />
        </TouchableOpacity>
      )}

      {/* Rewards */}
      <View style={localStyles.rewardsRow}>
        {!!commission && (
          <View style={[localStyles.rewardChip, {backgroundColor: commonColor.primaryTransparent}]}>
            <ZText type="s14" color={commonColor.primary}>
              {commission}% commission
            </ZText>
          </View>
        )}
        {!!scoutBonus && (
          <View style={[localStyles.rewardChip, {backgroundColor: 'rgba(251,148,0,0.12)'}]}>
            <ZText type="s14" color={commonColor.orange || '#FB9400'}>
              EGP {scoutBonus} bonus
            </ZText>
          </View>
        )}
      </View>
      {!!scoutBonus && rewardState?.scoutBonusTiming === 'after_claim_approval' && (
        <ZText type="r11" color={colors.grayScale5} style={{marginTop: moderateScale(6)}}>
          Scout bonus is credited after the restaurant owner’s claim is approved.
        </ZText>
      )}

      {/* Stats */}
      <View style={localStyles.statsRow}>
        <View style={localStyles.statItem}>
          <Ionicons name="people-outline" size={moderateScale(16)} color={colors.grayScale5} />
          <ZText type="s14" color={colors.textColor}> {mission?.currentParticipants ?? 0}</ZText>
          <ZText type="r12" color={colors.grayScale5}> joined</ZText>
        </View>
        <View style={[localStyles.statDot, {backgroundColor: colors.grayScale5}]} />
        <View style={localStyles.statItem}>
          <Ionicons name="time-outline" size={moderateScale(16)} color={colors.grayScale5} />
          <ZText type="s14" color={colors.textColor}> {mission?.endDate ? getTimeLeft(mission.endDate) : '--'}</ZText>
          <ZText type="r12" color={colors.grayScale5}> left</ZText>
        </View>
        {participation?.rank && (
          <>
            <View style={[localStyles.statDot, {backgroundColor: colors.grayScale5}]} />
            <View style={localStyles.statItem}>
              <Ionicons name="trophy-outline" size={moderateScale(16)} color={commonColor.primary} />
              <ZText type="s14" color={commonColor.primary}> #{participation.rank}</ZText>
            </View>
          </>
        )}
      </View>
    </View>
  );

  // About section
  const renderAbout = () => {
    if (!mission?.description) {
      return null;
    }

    return (
      <AnimatedView
        entering={FadeInUp.delay(400).duration(400)}
        style={localStyles.section}>
        <ZText type="b18" style={localStyles.sectionTitle}>
          About this Mission
        </ZText>
        <ZText type="r14" color={commonColor.grayScale6} style={localStyles.description}>
          {mission.description}
        </ZText>
      </AnimatedView>
    );
  };

  // Milestones section
  const renderMilestones = () => {
    if (!milestones.length) {
      return null;
    }

    const completedCount = milestones.filter(
      m => participation?.completedMilestones?.includes(m._id || m.id),
    ).length;

    return (
      <AnimatedView
        entering={FadeInUp.delay(500).duration(400)}
        style={localStyles.section}>
        <ZText type="b18" style={localStyles.sectionTitle}>
          Milestones
        </ZText>

        {/* Progress bar */}
        <View
          style={[
            localStyles.progressBarBg,
            {backgroundColor: colors.bColor},
          ]}>
          <View
            style={[
              localStyles.progressBarFill,
              {
                width: `${
                  milestones.length
                    ? (completedCount / milestones.length) * 100
                    : 0
                }%`,
              },
            ]}
          />
        </View>
        <ZText type="r12" color={commonColor.grayScale5} style={localStyles.progressText}>
          {completedCount}/{milestones.length} completed
        </ZText>

        {/* Milestone cards */}
        {milestones.map((milestone, idx) => {
          const isCompleted = participation?.completedMilestones?.includes(
            milestone._id || milestone.id,
          );
          return (
            <View
              key={idx}
              style={[
                localStyles.milestoneCard,
                {backgroundColor: colors.inputBg},
                isCompleted && localStyles.milestoneCompleted,
              ]}>
              <View
                style={[
                  localStyles.milestoneIcon,
                  {
                    backgroundColor: isCompleted
                      ? commonColor.green
                      : commonColor.grayScale3,
                  },
                ]}>
                <Ionicons
                  name={isCompleted ? 'checkmark' : 'flag-outline'}
                  size={moderateScale(16)}
                  color={commonColor.white}
                />
              </View>
              <View style={localStyles.milestoneContent}>
                <ZText type="b14">
                  {milestone.description || `${milestone.threshold} orders`}
                </ZText>
              </View>
              {!!milestone.rewardAmount && (
                <ZText type="b14" color={commonColor.primary}>
                  EGP {milestone.rewardAmount}
                </ZText>
              )}
            </View>
          );
        })}
      </AnimatedView>
    );
  };

  // Leaderboard preview
  const renderLeaderboard = () => {
    if (!leaderboard.length) {
      return null;
    }

    const top3 = leaderboard.slice(0, 3);

    return (
      <AnimatedView
        entering={FadeInUp.delay(600).duration(400)}
        style={localStyles.section}>
        <View style={localStyles.sectionHeader}>
          <ZText type="b18">Leaderboard</ZText>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(StackNav.MissionLeaderboard, {missionId})
            }>
            <ZText type="r14" color={commonColor.primary}>
              See All
            </ZText>
          </TouchableOpacity>
        </View>

        {top3.map((entry, idx) => (
          <View
            key={idx}
            style={[
              localStyles.leaderRow,
              {backgroundColor: colors.inputBg},
            ]}>
            <ZText type="b16" style={localStyles.leaderMedal}>
              {MEDALS[idx] || `#${idx + 1}`}
            </ZText>
            <View style={localStyles.leaderInfo}>
              <ZText type="b14" numberOfLines={1}>
                {entry.userName || entry.name || 'Ambassador'}
              </ZText>
              <ZText type="r12" color={commonColor.grayScale5}>
                {entry.ordersGenerated || entry.orders || 0} orders
              </ZText>
            </View>
            <ZText type="b14" color={commonColor.primary}>
              EGP {(entry.earned || entry.totalEarned || 0).toFixed(0)}
            </ZText>
          </View>
        ))}

        {/* Current user row if participating and not in top 3 */}
        {participation && participation.rank > 3 && (
          <View
            style={[
              localStyles.leaderRow,
              localStyles.currentUserRow,
              {backgroundColor: commonColor.primaryTransparent},
            ]}>
            <ZText type="b16" style={localStyles.leaderMedal}>
              #{participation.rank}
            </ZText>
            <View style={localStyles.leaderInfo}>
              <ZText type="b14" numberOfLines={1}>
                You
              </ZText>
              <ZText type="r12" color={commonColor.grayScale5}>
                {participation.ordersGenerated || 0} orders
              </ZText>
            </View>
            <ZText type="b14" color={commonColor.primary}>
              EGP {(participation.earned || 0).toFixed(0)}
            </ZText>
          </View>
        )}
      </AnimatedView>
    );
  };

  // Your progress section
  const renderProgress = () => {
    if (!participation) {
      return null;
    }

    return (
      <AnimatedView
        entering={FadeInUp.delay(700).duration(400)}
        style={localStyles.section}>
        <ZText type="b18" style={localStyles.sectionTitle}>
          Your Progress
        </ZText>
        <View style={localStyles.progressGrid}>
          <View
            style={[
              localStyles.progressItem,
              {backgroundColor: colors.inputBg},
              themeStyles.shadowStyle,
            ]}>
            <Ionicons
              name="document-text-outline"
              size={moderateScale(22)}
              color={commonColor.blue}
            />
            <ZText type="b16" color={colors.dark2 || '#1a1a1a'}>{participation.contentStatus || 'Pending'}</ZText>
            <ZText type="r12" color={commonColor.grayScale5}>
              Content
            </ZText>
          </View>
          <View
            style={[
              localStyles.progressItem,
              {backgroundColor: colors.inputBg},
              themeStyles.shadowStyle,
            ]}>
            <Ionicons
              name="cart-outline"
              size={moderateScale(22)}
              color={commonColor.green}
            />
            <ZText type="b16" color={colors.dark2 || '#1a1a1a'}>{participation.ordersGenerated || 0}</ZText>
            <ZText type="r12" color={commonColor.grayScale5}>
              Orders
            </ZText>
          </View>
          <View
            style={[
              localStyles.progressItem,
              {backgroundColor: colors.inputBg},
              themeStyles.shadowStyle,
            ]}>
            <Ionicons
              name="cash-outline"
              size={moderateScale(22)}
              color={commonColor.primary}
            />
            <ZText type="b16" color={colors.dark2 || '#1a1a1a'}>EGP {(participation.earned || 0).toFixed(0)}</ZText>
            <ZText type="r12" color={commonColor.grayScale5}>
              Earned
            </ZText>
          </View>
        </View>
      </AnimatedView>
    );
  };

  // Sticky CTA button
  const renderCTA = () => {
    if (isLoading || isError || !ctaState) {
      return null;
    }

    let title = '';
    let onPress = null;
    let loading = false;

    switch (ctaState) {
      case 'accept':
        title = 'Accept Mission';
        onPress = handleAccept;
        loading = acceptMission.isLoading;
        break;
      case 'submit_content':
        title = participation?.status === 'rejected' ? 'Resubmit Content' : 'Submit Content';
        onPress = handleSubmitContent;
        break;
      case 'share':
        title = 'Share Your Link';
        onPress = handleShare;
        break;
    }

    return (
      <AnimatedView
        entering={FadeInDown.duration(400)}
        style={[localStyles.ctaContainer, {backgroundColor: colors.backgroundColor}]}>
        <ZButton
          title={title}
          onPress={onPress}
          isLoading={loading}
          containerStyle={localStyles.ctaButton}
          textType="b16"
          color={commonColor.white}
        />
      </AnimatedView>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <ZSafeAreaView>
        <ZHeader title="Mission" fallbackRoute={StackNav.MissionsHub} />
        <View style={localStyles.centerContainer}>
          <Ionicons
            name="hourglass-outline"
            size={moderateScale(32)}
            color={commonColor.primary}
          />
          <ZText type="r14" color={commonColor.grayScale5} style={localStyles.loadingText}>
            Loading mission details...
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  // Error state
  if (isError || !mission) {
    return (
      <ZSafeAreaView>
        <ZHeader title="Mission" fallbackRoute={StackNav.MissionsHub} />
        <View style={localStyles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={moderateScale(48)}
            color={commonColor.redColor}
          />
          <ZText type="r16" color={commonColor.grayScale5} style={localStyles.errorText}>
            Failed to load mission
          </ZText>
          <ZButton
            title="Retry"
            onPress={refetch}
            containerStyle={localStyles.retryButton}
            textType="b14"
            color={commonColor.white}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.missionDetail || 'Mission Detail'} fallbackRoute={StackNav.MissionsHub} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={commonColor.primary}
            colors={[commonColor.primary]}
          />
        }>
        {renderHeader()}
        {renderAbout()}
        {renderMilestones()}
        {renderLeaderboard()}
        {renderProgress()}

        {/* Bottom padding for sticky CTA */}
        <View style={localStyles.ctaSpacer} />
      </ScrollView>

      {renderCTA()}
    </ZSafeAreaView>
  );
}

// Helper: calculate time left
function getTimeLeft(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) {
    return 'Ended';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: moderateScale(20),
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
  },
  errorText: {
    marginTop: moderateScale(16),
  },
  retryButton: {
    marginTop: moderateScale(16),
    paddingHorizontal: moderateScale(32),
  },

  // Header
  headerSection: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(20),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  restaurantAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginTop: moderateScale(12),
  },
  rewardChip: {
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(14),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: moderateScale(3),
    height: moderateScale(3),
    borderRadius: moderateScale(2),
    marginHorizontal: moderateScale(10),
  },

  // Sections
  section: {
    marginTop: moderateScale(24),
    paddingHorizontal: moderateScale(16),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  description: {
    lineHeight: moderateScale(22),
  },

  // Milestones
  progressBarBg: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    overflow: 'hidden',
    marginBottom: moderateScale(8),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: commonColor.primary,
    borderRadius: moderateScale(3),
  },
  progressText: {
    marginBottom: moderateScale(12),
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  milestoneCompleted: {
    opacity: 0.7,
  },
  milestoneIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },

  // Leaderboard
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  currentUserRow: {
    borderWidth: 1,
    borderColor: commonColor.primary,
  },
  leaderMedal: {
    width: moderateScale(36),
    textAlign: 'center',
  },
  leaderInfo: {
    flex: 1,
    marginLeft: moderateScale(8),
  },

  // Your progress
  progressGrid: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  progressItem: {
    flex: 1,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    gap: moderateScale(4),
  },

  // Sticky CTA
  ctaSpacer: {
    height: moderateScale(100),
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(32),
    paddingTop: moderateScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: commonColor.grayScale3,
  },
  ctaButton: {
    borderRadius: moderateScale(16),
    height: moderateScale(52),
  },
});
