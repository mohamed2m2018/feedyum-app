// Library imports
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
import ZLoader from '../../../components/common/ZLoader';
import EarningsCard from './components/EarningsCard';
import {
  useAmbassadorWallet,
  useEarningsHistory,
  useTransferToWallet,
} from '../../../hooks/useMissions';
import {moderateScale} from '../../../common/constants';
import {commonColor} from '../../../themes/colors';
import {showSuccessToast, showErrorToast} from '../../../utils/toast';
import strings from '../../../i18n/strings';

const AnimatedView = Animated.createAnimatedComponent(View);
const EMPTY_TRANSACTIONS = [];

// Filter tab definitions
const FILTER_TABS = [
  {key: 'all', label: 'All'},
  {key: 'commissions', label: 'Commissions'},
  {key: 'bonuses', label: 'Bonuses'},
  {key: 'reversals', label: 'Reversals'},
];

// Map filter keys to API transaction types
const FILTER_TYPE_MAP = {
  all: undefined,
  commissions: 'review_commission',
  bonuses: 'scout_bonus,milestone_bonus',
  reversals: 'commission_reversal',
};

// Format currency with commas
const formatCurrency = value => {
  if (value == null) return '0.00';
  return Number(value).toLocaleString('en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Group transactions by day
const groupByDay = transactions => {
  if (!transactions?.length) return [];

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  const groups = {};
  transactions.forEach(txn => {
    const date = new Date(txn.timestamp || txn.createdAt || txn.date);
    const dateStr = date.toDateString();

    let label;
    if (dateStr === todayStr) {
      label = 'Today';
    } else if (dateStr === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (!groups[label]) {
      groups[label] = {title: label, data: []};
    }
    groups[label].data.push(txn);
  });

  return Object.values(groups);
};

export default function AmbassadorWallet() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loadedTransactions, setLoadedTransactions] = useState([]);

  // Data hooks
  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
    isRefetching: walletRefetching,
    isError: walletError,
  } = useAmbassadorWallet();

  const filterType = FILTER_TYPE_MAP[selectedFilter];
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
    isRefetching: earningsRefetching,
    isError: earningsError,
  } = useEarningsHistory({type: filterType, page});

  const transferMutation = useTransferToWallet();

  const wallet = walletData?.data || walletData || {};
  const transactions = earningsData?.data?.transactions || earningsData?.transactions || EMPTY_TRANSACTIONS;
  const totalPages = earningsData?.data?.pagination?.pages || earningsData?.pagination?.pages || 1;

  useEffect(() => {
    setLoadedTransactions(current => {
      const combined = page === 1 ? transactions : [...current, ...transactions];
      return combined.filter((transaction, index, array) =>
        array.findIndex(item => (item._id || item.id) === (transaction._id || transaction.id)) === index,
      );
    });
  }, [transactions, page]);

  const groupedTransactions = useMemo(() => groupByDay(loadedTransactions), [loadedTransactions]);

  // Build a flat list with section headers
  const flatData = useMemo(() => {
    const items = [];
    groupedTransactions.forEach(group => {
      items.push({type: 'header', title: group.title, key: `header_${group.title}`});
      group.data.forEach(txn => {
        items.push({type: 'transaction', ...txn, key: txn._id || txn.id});
      });
    });
    return items;
  }, [groupedTransactions]);

  const isRefreshing = walletRefetching || earningsRefetching;

  const onRefresh = useCallback(() => {
    setPage(1);
    setLoadedTransactions([]);
    refetchWallet();
    refetchEarnings();
  }, [refetchWallet, refetchEarnings]);

  const handleFilterChange = useCallback(filterKey => {
    setSelectedFilter(filterKey);
    setPage(1);
    setLoadedTransactions([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  // Transfer flow
  const handleTransfer = useCallback(() => {
    const balance = wallet.balance ?? 0;
    if (balance <= 0) {
      showErrorToast('No Balance', 'You have no available balance to transfer.');
      return;
    }

    Alert.alert(
      'Transfer to App Wallet',
      `Transfer your full ambassador balance of EGP ${formatCurrency(balance)} to your app wallet?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Transfer All',
          onPress: () => {
            transferMutation.mutate(balance, {
              onSuccess: () => {
                showSuccessToast(
                  'Transfer Successful',
                  `EGP ${formatCurrency(balance)} has been transferred to your app wallet.`,
                );
                refetchWallet();
                refetchEarnings();
              },
              onError: error => {
                showErrorToast(
                  'Transfer Failed',
                  error?.response?.data?.message || 'Something went wrong. Please try again.',
                );
              },
            });
          },
        },
      ],
    );
  }, [wallet.balance, transferMutation, refetchWallet, refetchEarnings]);

  // Loading state
  if (walletLoading && !walletData) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.ambassadorWallet || 'Ambassador Wallet'} fallbackRoute={StackNav.MissionsHub} />
        <ZLoader />
      </ZSafeAreaView>
    );
  }
  if (walletError && !walletData) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.ambassadorWallet || 'Ambassador Wallet'} fallbackRoute={StackNav.MissionsHub} />
        <View style={localStyles.emptyContainer} accessibilityRole="alert">
          <Ionicons name="cloud-offline-outline" size={moderateScale(48)} color={commonColor.redColor} />
          <ZText type="r16" color={commonColor.redColor}>Could not load wallet</ZText>
          <TouchableOpacity onPress={refetchWallet}><ZText type="b14" color={commonColor.primary}>Retry</ZText></TouchableOpacity>
        </View>
      </ZSafeAreaView>
    );
  }

  // Balance card
  const renderBalanceCard = () => (
    <AnimatedView entering={FadeInDown.duration(500)}>
      <LinearGradient
        colors={['#FF4D67', '#FF8A9E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={localStyles.balanceCard}>
        <ZText type="r14" color={commonColor.white} style={localStyles.balanceLabel}>
          Available Balance
        </ZText>
        <ZText type="b30" color={commonColor.white}>
          EGP {formatCurrency(wallet.balance)}
        </ZText>
        <ZText type="r14" color={commonColor.white} style={localStyles.pendingText}>
          Pending: EGP {formatCurrency(wallet.pendingBalance)}
        </ZText>
        <ZText type="r12" color={commonColor.white} style={localStyles.lifetimeText}>
          Lifetime: EGP {formatCurrency(wallet.lifetimeEarnings)}
        </ZText>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleTransfer}
          disabled={transferMutation.isLoading}
          style={localStyles.transferButton}>
          {transferMutation.isLoading ? (
            <ZText type="b14" color={commonColor.white}>
              Transferring...
            </ZText>
          ) : (
            <ZText type="b14" color={commonColor.white}>
              Transfer to App Wallet
            </ZText>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </AnimatedView>
  );

  // Filter tabs
  const renderFilterTabs = () => (
    <AnimatedView
      entering={FadeInUp.delay(200).duration(400)}
      style={localStyles.filterRow}>
      {FILTER_TABS.map(tab => {
        const isSelected = selectedFilter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => handleFilterChange(tab.key)}
            style={[
              localStyles.filterPill,
              {
                backgroundColor: isSelected
                  ? commonColor.primary
                  : colors.inputBg,
              },
            ]}>
            <ZText
              type={isSelected ? 'b14' : 'r14'}
              color={isSelected ? commonColor.white : commonColor.grayScale7}>
              {tab.label}
            </ZText>
          </TouchableOpacity>
        );
      })}
    </AnimatedView>
  );

  // Render FlatList item
  const renderItem = useCallback(
    ({item}) => {
      if (item.type === 'header') {
        return (
          <View style={localStyles.sectionHeader}>
            <ZText type="s14" color={commonColor.grayScale5}>
              {item.title}
            </ZText>
          </View>
        );
      }
      return <EarningsCard transaction={item} />;
    },
    [],
  );

  // Empty state
  const renderEmptyState = () => {
    if (earningsLoading) return null;
    if (earningsError) {
      return <View style={localStyles.emptyContainer} accessibilityRole="alert"><Ionicons name="cloud-offline-outline" size={moderateScale(48)} color={commonColor.redColor} /><ZText type="r16" color={commonColor.redColor}>Could not load transactions</ZText><TouchableOpacity onPress={refetchEarnings}><ZText type="b14" color={commonColor.primary}>Retry</ZText></TouchableOpacity></View>;
    }
    return (
      <View style={localStyles.emptyContainer}>
        <Ionicons
          name="receipt-outline"
          size={moderateScale(48)}
          color={commonColor.grayScale5}
        />
        <ZText
          type="r16"
          color={commonColor.grayScale5}
          style={localStyles.emptyText}>
          No transactions yet
        </ZText>
      </View>
    );
  };

  // List header (balance card + filter tabs)
  const renderListHeader = () => (
    <View style={localStyles.listHeader}>
      {renderBalanceCard()}
      {renderFilterTabs()}
    </View>
  );

  // Footer loader for pagination
  const renderFooter = () => {
    if (!earningsLoading || page <= 1) return null;
    return (
      <View style={localStyles.footerLoader}>
        <Ionicons
          name="hourglass-outline"
          size={moderateScale(20)}
          color={commonColor.primary}
        />
        <ZText type="r12" color={commonColor.grayScale5} style={localStyles.footerText}>
          Loading more...
        </ZText>
      </View>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.ambassadorWallet || 'Ambassador Wallet'} fallbackRoute={StackNav.MissionsHub} />

      <FlatList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={item => item.key || item._id || item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(100),
  },
  listHeader: {
    marginBottom: moderateScale(8),
  },

  // Balance card
  balanceCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    marginBottom: moderateScale(16),
  },
  balanceLabel: {
    opacity: 0.7,
    marginBottom: moderateScale(4),
  },
  pendingText: {
    opacity: 0.7,
    marginTop: moderateScale(6),
  },
  lifetimeText: {
    opacity: 0.5,
    marginTop: moderateScale(4),
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

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  filterPill: {
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },

  // Section headers
  sectionHeader: {
    paddingVertical: moderateScale(8),
    marginTop: moderateScale(4),
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
  },
  emptyText: {
    marginTop: moderateScale(12),
  },

  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    gap: moderateScale(8),
  },
  footerText: {
    marginLeft: moderateScale(4),
  },
});
