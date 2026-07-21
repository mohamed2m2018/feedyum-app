// Library imports
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
import MissionCard from './components/MissionCard';
import MissionTypeToggle from './components/MissionTypeToggle';
import {useMissions, useAmbassadorDashboard} from '../../../hooks/useMissions';
import {styles as themeStyles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';
import {commonColor} from '../../../themes/colors';
import strings from '../../../i18n/strings';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function MissionsHub() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState('scouting');

  // Data hooks
  const {
    data: missionsData,
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useMissions({type: selectedType, status: 'active'});
  const {data: dashboardData} = useAmbassadorDashboard();

  const missions = missionsData?.data?.missions || missionsData?.missions || [];
  const dashboard = dashboardData?.data || dashboardData;
  const scoutingEnabled = missionsData?.data?.features?.scoutingEnabled !== false;

  useEffect(() => {
    if (!scoutingEnabled && selectedType === 'scouting') setSelectedType('reviewing');
  }, [scoutingEnabled, selectedType]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleMissionPress = useCallback(
    mission => {
      navigation.navigate(StackNav.MissionDetail, {missionId: mission._id});
    },
    [navigation],
  );

  // Right header icons
  const renderRightIcons = () => (
    <View style={localStyles.headerIcons}>
      <TouchableOpacity
        onPress={() => navigation.navigate(StackNav.AmbassadorWallet)}
        style={localStyles.headerIconBtn}
        accessibilityRole="button"
        accessibilityLabel="Open ambassador wallet">
        <Ionicons
          name="wallet-outline"
          size={moderateScale(22)}
          color={colors.textColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate(StackNav.RestaurantClaimStatus)}
        style={localStyles.headerIconBtn}
        accessibilityRole="button"
        accessibilityLabel="Open restaurant claims">
        <Ionicons
          name="document-text-outline"
          size={moderateScale(22)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    </View>
  );

  // Earnings banner
  const renderEarningsBanner = () => {
    if (!dashboard?.totalEarned && !dashboard?.totalEarnings) {
      return null;
    }

    const totalEarned = dashboard?.totalEarned || dashboard?.totalEarnings || 0;
    const activeMissions =
      dashboard?.activeMissions ?? dashboard?.activeMissionCount ?? 0;

    return (
      <AnimatedView entering={FadeInDown.duration(500)}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate(StackNav.AmbassadorDashboard)
          }>
          <LinearGradient
            colors={['#FF4D67', '#FF8A9E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={localStyles.earningsBanner}>
            <View style={localStyles.earningsLeft}>
              <ZText type="r14" color={commonColor.white} style={localStyles.earningsLabel}>
                Total Earned
              </ZText>
              <ZText type="b24" color={commonColor.white}>
                EGP {totalEarned.toFixed(2)}
              </ZText>
            </View>
            <View style={localStyles.earningsRight}>
              <View style={localStyles.activeBadge}>
                <ZText type="b16" color={commonColor.white}>
                  {activeMissions}
                </ZText>
                <ZText type="r12" color={commonColor.white}>
                  Active
                </ZText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(20)}
                color={commonColor.white}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>
    );
  };

  // Empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }
    if (isError) {
      return (
        <View style={localStyles.emptyContainer} accessibilityRole="alert">
          <Ionicons name="cloud-offline-outline" size={moderateScale(56)} color={commonColor.redColor} />
          <ZText type="r16" color={commonColor.redColor} style={localStyles.emptyText}>Could not load missions</ZText>
          <TouchableOpacity onPress={refetch} style={localStyles.retryButton} accessibilityRole="button">
            <ZText type="b14" color={commonColor.white}>Retry</ZText>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={localStyles.emptyContainer}>
        <Ionicons
          name="compass-outline"
          size={moderateScale(64)}
          color={commonColor.grayScale5}
        />
        <ZText
          type="r16"
          color={commonColor.grayScale5}
          style={localStyles.emptyText}>
          No missions available
        </ZText>
        <ZText
          type="r14"
          color={commonColor.grayScale5}
          style={localStyles.emptySubtext}>
          Check back later for new opportunities
        </ZText>
      </View>
    );
  };

  // Mission list item
  const renderMissionItem = useCallback(
    ({item, index}) => (
      <MissionCard
        mission={item}
        index={index}
        onPress={() => handleMissionPress(item)}
      />
    ),
    [handleMissionPress],
  );

  // List header (earnings banner + type toggle)
  const renderListHeader = () => (
    <View style={localStyles.listHeader}>
      {renderEarningsBanner()}
      <AnimatedView
        entering={FadeInUp.delay(200).duration(400)}
        style={localStyles.toggleWrapper}>
        <MissionTypeToggle
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </AnimatedView>
    </View>
  );

  // Loading state
  if (isLoading && !missions.length) {
    return (
      <ZSafeAreaView>
        <ZHeader
          title={strings.missions || 'Missions'}
          isHideBack
          rightIcon={renderRightIcons()}
        />
        <View style={localStyles.loaderContainer}>
          <Ionicons
            name="hourglass-outline"
            size={moderateScale(32)}
            color={commonColor.primary}
          />
          <ZText type="r14" color={commonColor.grayScale5} style={localStyles.loadingText}>
            Loading missions...
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader
        title={strings.missions || 'Missions'}
        isHideBack
        rightIcon={renderRightIcons()}
      />
      <FlatList
        data={missions}
        renderItem={renderMissionItem}
        keyExtractor={item => item._id || item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={commonColor.primary}
            colors={[commonColor.primary]}
          />
        }
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  headerIconBtn: {
    padding: moderateScale(4),
  },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(100),
  },
  listHeader: {
    marginBottom: moderateScale(16),
  },
  earningsBanner: {
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  earningsLeft: {
    flex: 1,
  },
  earningsLabel: {
    marginBottom: moderateScale(4),
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  activeBadge: {
    alignItems: 'center',
  },
  toggleWrapper: {
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
  },
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
  retryButton: {
    marginTop: moderateScale(16),
    backgroundColor: commonColor.primary,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
});
