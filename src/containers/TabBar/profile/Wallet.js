import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZLoader from '../../../components/common/ZLoader';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import request from '../../../api/request';
import strings from '../../../i18n/strings';

export default function Wallet({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [selectedTab, setSelectedTab] = useState('balance');
  const queryClient = useQueryClient();

  // Promocode form state
  const [promocodeForm, setPromocodeForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    usageLimit: '',
    validUntil: '',
  });
  const [hasUsageLimit, setHasUsageLimit] = useState(false);
  const [hasMaxDiscount, setHasMaxDiscount] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get current user
  const {data: userData} = useQuery('user', () => request.get('/user'), {
    retry: 1,
  });
  const user = userData?.data?.user;

  // Get wallet data from API
  const {
    data: walletData,
    isLoading: walletLoading,
    error: walletError,
    refetch,
  } = useQuery(
    ['walletInfo', user?._id],
    async () => {
      if (!user?._id) return null;
      // Use the existing request module which already handles authentication
      const response = await request.get('/chef-wallet/info');
      return response.data;
    },
    {
      enabled: !!user?._id,
      retry: 2,
      onError: error => {
},
    },
  );

  // Get user's promocodes
  const {
    data: promocodesData,
    isLoading: promocodesLoading,
    refetch: refetchPromocodes,
  } = useQuery(
    ['userPromocodes', user?._id],
    async () => {
      if (!user?._id) return [];
      const response = await request.get('/promocode/my-codes');
      return response.data?.promocodes || [];
    },
    {
      enabled: !!user?._id && selectedTab === 'promocodes',
      retry: 2,
    },
  );

  // Create promocode mutation
  const createPromocodeMutation = useMutation(
    async promocodeData => {
      const response = await request.post('/promocode/create', promocodeData);
      return response.data;
    },
    {
      onSuccess: () => {
        Alert.alert(strings.successExclamation, strings.promocodeCreatedSuccessfully);
        setPromocodeForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          maxDiscount: '',
          minOrderAmount: '',
          usageLimit: '',
          validUntil: '',
        });
        setHasUsageLimit(false);
        setHasMaxDiscount(false);
        setShowCreateForm(false);
        refetchPromocodes();
      },
      onError: error => {
        Alert.alert('Error', error.message || 'Failed to create promocode');
      },
    },
  );

  // Delete promocode mutation
  const deletePromocodeMutation = useMutation(
    async promocodeId => {
      const response = await request.delete(`/promocode/delete/${promocodeId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        Alert.alert(strings.successExclamation, strings.promocodeDeletedSuccessfully);
        refetchPromocodes();
      },
      onError: error => {
        Alert.alert('Error', error.message || 'Failed to delete promocode');
      },
    },
  );

  const formatCurrency = amount => `£${Math.abs(amount).toFixed(2)}`;

  const getTransactionIcon = type => {
    switch (type) {
      case 'service_fee':
        return 'trending-down';
      case 'payment_to_platform':
        return 'trending-up';
      case 'adjustment':
        return 'refresh';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'payment_to_platform' || amount > 0)
      return colors.success || '#4CAF50';
    return colors.error || '#F44336';
  };

  const getTransactionLabel = type => {
    switch (type) {
      case 'service_fee':
        return strings.serviceFee;
      case 'payment_to_platform':
        return strings.paymentMade;
      case 'adjustment':
        return strings.adjustment;
      default:
        return strings.transaction;
    }
  };

  const handlePayment = async () => {
    if (!walletData?.summary?.isPaymentRequired) {
      Alert.alert(strings.noPaymentRequired, strings.accountInGoodStanding);
      return;
    }

    Alert.alert(
      'Payment Required',
      `You need to pay £${walletData.summary.paymentDueAmount.toFixed(2)} to continue receiving orders.`,
      [
        {text: strings.cancel, style: 'cancel'},
        {
          text: strings.payNow,
          onPress: () => {
            // Navigate to payment screen or handle payment
            Alert.alert(
              'Payment',
              'Payment functionality will be implemented here.',
            );
          },
        },
      ],
    );
  };

  const handlePromocodeInputChange = (field, value) => {
    setPromocodeForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePromocodeForm = () => {
    if (!promocodeForm.code.trim()) {
      Alert.alert(strings.error, strings.promocodeRequired);
      return false;
    }

    if (
      !promocodeForm.discountValue ||
      parseFloat(promocodeForm.discountValue) <= 0
    ) {
      Alert.alert(strings.error, strings.validDiscountRequired);
      return false;
    }

    if (
      promocodeForm.discountType === 'percentage' &&
      parseFloat(promocodeForm.discountValue) > 100
    ) {
      Alert.alert(strings.error, strings.percentageCannotExceed);
      return false;
    }

    if (!promocodeForm.validUntil) {
      Alert.alert(strings.error, strings.validUntilRequired);
      return false;
    }

    return true;
  };

  const handleCreatePromocode = () => {
    if (!validatePromocodeForm()) return;

    const promocodeData = {
      code: promocodeForm.code.toUpperCase(),
      discountType: promocodeForm.discountType,
      discountValue: parseFloat(promocodeForm.discountValue),
      maxDiscount:
        hasMaxDiscount && promocodeForm.maxDiscount
          ? parseFloat(promocodeForm.maxDiscount)
          : null,
      minOrderAmount: promocodeForm.minOrderAmount
        ? parseFloat(promocodeForm.minOrderAmount)
        : 0,
      usageLimit:
        hasUsageLimit && promocodeForm.usageLimit
          ? parseInt(promocodeForm.usageLimit)
          : null,
      validFrom: new Date().toISOString(),
      validUntil: new Date(promocodeForm.validUntil).toISOString(),
    };

    createPromocodeMutation.mutate(promocodeData);
  };

  const handleDeletePromocode = promocode => {
    Alert.alert(
      strings.deletePromocode,
      strings.deletePromocodeConfirmation.replace('{code}', promocode.code),
      [
        {
          text: strings.cancel,
          style: 'cancel',
        },
        {
          text: strings.delete,
          style: 'destructive',
          onPress: () => deletePromocodeMutation.mutate(promocode._id),
        },
      ],
    );
  };

  const renderBalanceCard = () => {
    const balance = walletData?.summary?.currentBalance || 0;
    const isNegative = balance < 0;

    return (
      <View
        style={[
          localStyles.balanceCard,
          {
            backgroundColor: isNegative
              ? colors.error || '#F44336'
              : colors.primary,
          },
        ]}>
        <View style={localStyles.balanceHeader}>
          <ZText type="m16" color={colors.white}>
            {isNegative ? strings.amountOwed : strings.currentBalance}
          </ZText>
          <TouchableOpacity onPress={refetch}>
            <Ionicons
              name="refresh-outline"
              size={moderateScale(20)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>

        <ZText type="b32" color={colors.white} style={styles.mv10}>
          {formatCurrency(balance)}
        </ZText>

        {walletData?.summary?.isPaymentRequired && (
          <View style={localStyles.paymentWarning}>
            <ZText type="m12" color={colors.white} style={styles.mb5}>
              ⚠️ {strings.paymentRequired}
            </ZText>
            <ZText type="m10" color={colors.white}>
              {strings.paymentRequiredMessage.replace('{amount}', walletData.summary.paymentDueAmount.toFixed(2))}
            </ZText>
          </View>
        )}

        <View style={localStyles.balanceActions}>
          {walletData?.summary?.isPaymentRequired ? (
            <TouchableOpacity
              style={[
                localStyles.actionButton,
                {backgroundColor: colors.white},
              ]}
              onPress={handlePayment}>
              <Ionicons
                name="card"
                size={moderateScale(16)}
                color={colors.error || '#F44336'}
              />
              <ZText
                type="m12"
                color={colors.error || '#F44336'}
                style={styles.ml5}>
                {strings.payNow}
              </ZText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                localStyles.actionButton,
                {backgroundColor: 'rgba(255,255,255,0.2)'},
              ]}
              onPress={() =>
                Alert.alert('Info', strings.noPaymentRequiredAtThisTime)
              }>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(16)}
                color={colors.white}
              />
              <ZText type="m12" color={colors.white} style={styles.ml5}>
                {strings.goodStanding}
              </ZText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              localStyles.actionButton,
              {backgroundColor: 'rgba(255,255,255,0.2)'},
            ]}
            onPress={refetch}>
            <Ionicons
              name="refresh"
              size={moderateScale(16)}
              color={colors.white}
            />
            <ZText type="m12" color={colors.white} style={styles.ml5}>
              {strings.refresh}
            </ZText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStatsCards = () => (
    <View style={localStyles.statsContainer}>
      <View style={[localStyles.statCard, {backgroundColor: colors.inputBg}]}>
        <MaterialIcon
          name="receipt"
          size={moderateScale(24)}
          color={colors.error}
        />
        <ZText type="m12" color={colors.grayScale7} style={styles.mt5}>
          {strings.serviceFees}
        </ZText>
        <ZText type="b16" color={colors.textColor}>
          {formatCurrency(walletData?.summary?.totalServiceFees || 0)}
        </ZText>
      </View>

      <View style={[localStyles.statCard, {backgroundColor: colors.inputBg}]}>
        <MaterialIcon
          name="cash"
          size={moderateScale(24)}
          color={colors.success}
        />
        <ZText type="m12" color={colors.grayScale7} style={styles.mt5}>
          {strings.totalPayments}
        </ZText>
        <ZText type="b16" color={colors.textColor}>
          {formatCurrency(walletData?.summary?.totalPayments || 0)}
        </ZText>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={[localStyles.tabBar, {backgroundColor: colors.inputBg}]}>
      <TouchableOpacity
        style={[
          localStyles.tab,
          selectedTab === 'balance' && {backgroundColor: colors.primary},
        ]}
        onPress={() => setSelectedTab('balance')}>
        <ZText
          type="m14"
          color={selectedTab === 'balance' ? colors.white : colors.grayScale7}>
          {strings.transactions}
        </ZText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          localStyles.tab,
          selectedTab === 'promocodes' && {backgroundColor: colors.primary},
        ]}
        onPress={() => setSelectedTab('promocodes')}>
        <ZText
          type="m14"
          color={
            selectedTab === 'promocodes' ? colors.white : colors.grayScale7
          }>
          {strings.promocodes}
        </ZText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          localStyles.tab,
          selectedTab === 'settings' && {backgroundColor: colors.primary},
        ]}
        onPress={() => setSelectedTab('settings')}>
        <ZText
          type="m14"
          color={selectedTab === 'settings' ? colors.white : colors.grayScale7}>
          {strings.settings}
        </ZText>
      </TouchableOpacity>
    </View>
  );

  const renderTransactions = () => {
    const transactions = walletData?.wallet?.transactions || [];

    return (
      <View style={localStyles.transactionsContainer}>
        <ZText type="b18" color={colors.textColor} style={styles.mb15}>
          {strings.recentTransactions}
        </ZText>

        {transactions.length === 0 ? (
          <View style={localStyles.emptyState}>
            <MaterialIcon
              name="receipt-outline"
              size={moderateScale(48)}
              color={colors.grayScale7}
            />
            <ZText type="m16" color={colors.grayScale7} style={styles.mt10}>
              {strings.noTransactionsYet}
            </ZText>
            <ZText type="m12" color={colors.grayScale7} style={styles.mt5}>
              {strings.transactionHistoryWillAppearHere}
            </ZText>
          </View>
        ) : (
          transactions.map((transaction, index) => (
            <View
              key={transaction._id || index}
              style={[
                localStyles.transactionItem,
                {backgroundColor: colors.inputBg},
              ]}>
              <View style={localStyles.transactionLeft}>
                <View
                  style={[
                    localStyles.transactionIcon,
                    {
                      backgroundColor:
                        getTransactionColor(
                          transaction.type,
                          transaction.amount,
                        ) + '20',
                    },
                  ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={moderateScale(20)}
                    color={getTransactionColor(
                      transaction.type,
                      transaction.amount,
                    )}
                  />
                </View>

                <View style={styles.ml10}>
                  <ZText type="m14" color={colors.textColor} numberOfLines={1}>
                    {getTransactionLabel(transaction.type)}
                  </ZText>
                  <ZText type="m12" color={colors.grayScale7}>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </ZText>
                  {transaction.description && (
                    <ZText
                      type="m10"
                      color={colors.grayScale7}
                      numberOfLines={1}>
                      {transaction.description}
                    </ZText>
                  )}
                </View>
              </View>

              <ZText
                type="b14"
                color={getTransactionColor(
                  transaction.type,
                  transaction.amount,
                )}>
                {transaction.amount > 0 ? '+' : ''}
                {formatCurrency(transaction.amount)}
              </ZText>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderPromocodes = () => {
    const promocodes = promocodesData || [];

    return (
      <View style={localStyles.promocodesContainer}>
        <View style={localStyles.promocodesHeader}>
          <ZText type="b18" color={colors.textColor}>
            {strings.myPromocodes}
          </ZText>
          <TouchableOpacity
            style={[
              localStyles.createButton,
              {backgroundColor: colors.primary},
            ]}
            onPress={() => setShowCreateForm(!showCreateForm)}>
            <Ionicons
              name={showCreateForm ? 'close' : 'add'}
              size={moderateScale(16)}
              color={colors.white}
            />
            <ZText type="m12" color={colors.white} style={styles.ml5}>
              {showCreateForm ? strings.cancel : strings.create}
            </ZText>
          </TouchableOpacity>
        </View>

        {showCreateForm && renderCreatePromocodeForm()}

        {promocodesLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.mv20}
          />
        ) : promocodes.length === 0 ? (
          <View style={localStyles.emptyState}>
            <MaterialIcon
              name="ticket-percent-outline"
              size={moderateScale(48)}
              color={colors.grayScale7}
            />
            <ZText type="m16" color={colors.grayScale7} style={styles.mt10}>
              {strings.noPromocodesYet}
            </ZText>
            <ZText type="m12" color={colors.grayScale7} style={styles.mt5}>
              {strings.createPromocodesToOffer}
            </ZText>
          </View>
        ) : (
          promocodes.map(promocode => (
            <View
              key={promocode._id}
              style={[
                localStyles.promocodeItem,
                {backgroundColor: colors.inputBg},
              ]}>
              <View style={localStyles.promocodeHeader}>
                <ZText type="b16" color={colors.textColor}>
                  {promocode.code}
                </ZText>
                <View style={localStyles.promocodeActions}>
                  <View
                    style={[
                      localStyles.statusBadge,
                      {
                        backgroundColor: promocode.isActive
                          ? colors.success + '20'
                          : colors.error + '20',
                      },
                    ]}>
                    <ZText
                      type="m10"
                      color={
                        promocode.isActive ? colors.success : colors.error
                      }>
                      {promocode.isActive ? strings.active : strings.inactive}
                    </ZText>
                  </View>
                  <TouchableOpacity
                    style={[
                      localStyles.deleteButton,
                      {backgroundColor: '#FF4444' + '20'},
                    ]}
                    onPress={() => handleDeletePromocode(promocode)}
                    disabled={deletePromocodeMutation.isLoading}>
                    {deletePromocodeMutation.isLoading ? (
                      <ActivityIndicator size="small" color="#FF4444" />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={moderateScale(18)}
                        color="#FF4444"
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <ZText type="m14" color={colors.textColor} style={styles.mt5}>
                {promocode.discountType === 'percentage'
                  ? `${promocode.discountValue}% ${strings.off}`
                  : `£${promocode.discountValue} ${strings.off}`}
                {promocode.maxDiscount && ` (${strings.max} £${promocode.maxDiscount})`}
              </ZText>

              <View style={localStyles.promocodeDetails}>
                <ZText type="m12" color={colors.grayScale7}>
                  {strings.used}: {promocode.usedCount}/{promocode.usageLimit || '∞'}
                </ZText>
                <ZText type="m12" color={colors.grayScale7}>
                  {strings.expires}: {new Date(promocode.validUntil).toLocaleDateString()}
                </ZText>
              </View>

              {promocode.minOrderAmount > 0 && (
                <ZText type="m12" color={colors.grayScale7} style={styles.mt5}>
                  {strings.minOrder}: £{promocode.minOrderAmount}
                </ZText>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderCreatePromocodeForm = () => (
    <View style={[localStyles.createForm, {backgroundColor: colors.inputBg}]}>
      <ZText type="b16" color={colors.textColor} style={styles.mb15}>
        {strings.createNewPromocode}
      </ZText>

      {/* Code Input */}
      <View style={localStyles.inputGroup}>
        <ZText type="m14" color={colors.textColor} style={styles.mb5}>
          {strings.promocode} *
        </ZText>
        <TextInput
          style={[
            localStyles.textInput,
            {backgroundColor: colors.white, color: '#000000'},
          ]}
          placeholder={strings.enterCode}
          value={promocodeForm.code}
          onChangeText={value => handlePromocodeInputChange('code', value)}
          autoCapitalize="characters"
        />
      </View>

      {/* Discount Type */}
      <View style={localStyles.inputGroup}>
        <ZText type="m14" color={colors.textColor} style={styles.mb5}>
          {strings.discountType} *
        </ZText>
        <View style={localStyles.typeButtons}>
          <TouchableOpacity
            style={[
              localStyles.typeButton,
              promocodeForm.discountType === 'percentage' && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() =>
              handlePromocodeInputChange('discountType', 'percentage')
            }>
            <ZText
              type="m12"
              color={
                promocodeForm.discountType === 'percentage'
                  ? colors.white
                  : colors.textColor
              }>
              {strings.percentage}
            </ZText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              localStyles.typeButton,
              promocodeForm.discountType === 'fixed' && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => handlePromocodeInputChange('discountType', 'fixed')}>
            <ZText
              type="m12"
              color={
                promocodeForm.discountType === 'fixed'
                  ? colors.white
                  : colors.textColor
              }>
              {strings.fixedAmount}
            </ZText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Discount Value */}
      <View style={localStyles.inputGroup}>
        <ZText type="m14" color={colors.textColor} style={styles.mb5}>
          {strings.discountValue} *{' '}
          {promocodeForm.discountType === 'percentage' ? '(%)' : '(£)'}
        </ZText>
        <TextInput
          style={[
            localStyles.textInput,
            {backgroundColor: colors.white, color: '#000000'},
          ]}
          placeholder={
            promocodeForm.discountType === 'percentage' ? '20' : '5.00'
          }
          value={promocodeForm.discountValue}
          onChangeText={value =>
            handlePromocodeInputChange('discountValue', value)
          }
          keyboardType="numeric"
        />
      </View>

      {/* Max Discount for percentage */}
      {promocodeForm.discountType === 'percentage' && (
        <View style={localStyles.inputGroup}>
          <View style={localStyles.switchRow}>
            <ZText type="m14" color={colors.textColor}>
              {strings.setMaximumDiscount}
            </ZText>
            <Switch
              value={hasMaxDiscount}
              onValueChange={setHasMaxDiscount}
              trackColor={{false: colors.grayScale7, true: colors.primary}}
            />
          </View>
          {hasMaxDiscount && (
            <TextInput
              style={[
                localStyles.textInput,
                {backgroundColor: colors.white, color: '#000000'},
              ]}
              placeholder={strings.maximumDiscount}
              value={promocodeForm.maxDiscount}
              onChangeText={value =>
                handlePromocodeInputChange('maxDiscount', value)
              }
              keyboardType="numeric"
            />
          )}
        </View>
      )}

      {/* Min Order Amount */}
      <View style={localStyles.inputGroup}>
        <ZText type="m14" color={colors.textColor} style={styles.mb5}>
          {strings.minimumOrderAmount} (£)
        </ZText>
        <TextInput
          style={[
            localStyles.textInput,
            {backgroundColor: colors.white, color: '#000000'},
          ]}
          placeholder="0.00"
          value={promocodeForm.minOrderAmount}
          onChangeText={value =>
            handlePromocodeInputChange('minOrderAmount', value)
          }
          keyboardType="numeric"
        />
      </View>

      {/* Usage Limit */}
      <View style={localStyles.inputGroup}>
        <View style={localStyles.switchRow}>
          <ZText type="m14" color={colors.textColor}>
            {strings.setUsageLimit}
          </ZText>
          <Switch
            value={hasUsageLimit}
            onValueChange={setHasUsageLimit}
            trackColor={{false: colors.grayScale7, true: colors.primary}}
          />
        </View>
        {hasUsageLimit && (
          <TextInput
            style={[
              localStyles.textInput,
              {backgroundColor: colors.white, color: '#000000'},
            ]}
            placeholder={strings.maximumUses}
            value={promocodeForm.usageLimit}
            onChangeText={value =>
              handlePromocodeInputChange('usageLimit', value)
            }
            keyboardType="numeric"
          />
        )}
      </View>

      {/* Valid Until */}
      <View style={localStyles.inputGroup}>
        <ZText type="m14" color={colors.textColor} style={styles.mb5}>
          {strings.validUntil} * (YYYY-MM-DD)
        </ZText>
        <TextInput
          style={[
            localStyles.textInput,
            {backgroundColor: colors.white, color: '#000000'},
          ]}
          placeholder="2024-12-31"
          value={promocodeForm.validUntil}
          onChangeText={value =>
            handlePromocodeInputChange('validUntil', value)
          }
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[
          localStyles.submitButton,
          {backgroundColor: colors.primary},
          createPromocodeMutation.isLoading && {opacity: 0.7},
        ]}
        onPress={handleCreatePromocode}
        disabled={createPromocodeMutation.isLoading}>
        {createPromocodeMutation.isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <ZText type="m14" color={colors.white}>
            {strings.createPromocode}
          </ZText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSettings = () => (
    <View style={localStyles.settingsContainer}>
      <ZText type="b18" color={colors.textColor} style={styles.mb15}>
        {strings.walletInformation}
      </ZText>

      <View
        style={[localStyles.settingItem, {backgroundColor: colors.inputBg}]}>
        <View style={localStyles.settingLeft}>
          <Ionicons
            name="information-circle-outline"
            size={moderateScale(24)}
            color={colors.primary}
          />
          <View style={styles.ml15}>
            <ZText type="m14" color={colors.textColor}>
              {strings.serviceFeeRate}
            </ZText>
            <ZText type="m12" color={colors.grayScale7}>
              5% per order
            </ZText>
          </View>
        </View>
      </View>

      <View
        style={[localStyles.settingItem, {backgroundColor: colors.inputBg}]}>
        <View style={localStyles.settingLeft}>
          <Ionicons
            name="warning-outline"
            size={moderateScale(24)}
            color={colors.warning}
          />
          <View style={styles.ml15}>
            <ZText type="m14" color={colors.textColor}>
              {strings.paymentThreshold}
            </ZText>
            <ZText type="m12" color={colors.grayScale7}>
              {strings.paymentThresholdMessage}
            </ZText>
          </View>
        </View>
      </View>

      {walletData?.summary?.lastPaymentDate && (
        <View
          style={[localStyles.settingItem, {backgroundColor: colors.inputBg}]}>
          <View style={localStyles.settingLeft}>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(24)}
              color={colors.success}
            />
            <View style={styles.ml15}>
              <ZText type="m14" color={colors.textColor}>
                {strings.lastPayment}
              </ZText>
              <ZText type="m12" color={colors.grayScale7}>
                {new Date(
                  walletData.summary.lastPaymentDate,
                ).toLocaleDateString()}
              </ZText>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[localStyles.settingItem, {backgroundColor: colors.inputBg}]}
        onPress={refetch}>
        <View style={localStyles.settingLeft}>
          <Ionicons
            name="refresh-outline"
            size={moderateScale(24)}
            color={colors.primary}
          />
          <ZText type="m14" color={colors.textColor} style={styles.ml15}>
            Refresh Wallet Data
          </ZText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={moderateScale(20)}
          color={colors.grayScale7}
        />
      </TouchableOpacity>
    </View>
  );

  if (!user || walletLoading) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.wallet} showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (walletError) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.wallet} showBack />
        <View style={localStyles.errorContainer}>
          <MaterialIcon
            name="alert-circle-outline"
            size={moderateScale(48)}
            color={colors.error}
          />
          <ZText type="b18" color={colors.error} style={styles.mt10}>
            Failed to Load Wallet
          </ZText>
          <ZText type="m14" color={colors.grayScale7} style={styles.mt5}>
            Please check your connection and try again
          </ZText>
          <TouchableOpacity
            style={[localStyles.retryButton, {backgroundColor: colors.primary}]}
            onPress={refetch}>
            <ZText type="m14" color={colors.white}>
              Retry
            </ZText>
          </TouchableOpacity>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.wallet} showBack />

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {renderBalanceCard()}
        {renderStatsCards()}
        {renderTabBar()}

        <View style={styles.ph20}>
          {selectedTab === 'balance' && renderTransactions()}
          {selectedTab === 'promocodes' && renderPromocodes()}
          {selectedTab === 'settings' && renderSettings()}
        </View>
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  balanceCard: {
    margin: moderateScale(20),
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(15),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    flex: 0.48,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  statCard: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginHorizontal: moderateScale(5),
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(6),
  },
  transactionsContainer: {
    marginBottom: moderateScale(20),
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContainer: {
    marginBottom: moderateScale(20),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentWarning: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(10),
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  retryButton: {
    marginTop: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  promocodesContainer: {
    marginBottom: moderateScale(20),
  },
  promocodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
  },
  createForm: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(15),
  },
  inputGroup: {
    marginBottom: moderateScale(15),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(14),
  },
  typeButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#ddd',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  submitButton: {
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  promocodeItem: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  promocodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promocodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },
  deleteButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  promocodeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
  },
});
