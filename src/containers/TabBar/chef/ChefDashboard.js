// Library imports
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import DashboardCard from './components/DashboardCard';
import HeaderIconWithBadge from '../../../components/common/HeaderIconWithBadge';
import { useDashboardStats, useRecentActivity } from './hooks/useDashboardData';
import { useNotificationCounts } from '../../../hooks/useNotificationCounts';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import request from '../../../api/request';
import { useQuery, useQueryClient } from 'react-query';
import { showErrorToast } from '../../../utils/toast';

// Format currency with K/M suffix for large numbers
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0.00';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(2);
};

export default function ChefDashboard() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const isFromProfile = route.params?.isFromProfile;
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, refetch } = useDashboardStats();
  const { data: recentActivity = [], refetch: refetchActivity } = useRecentActivity();
  const { unseenOrdersCount, unreadChatsCount } = useNotificationCounts();

  // User data for settings toggles
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const user = userData?.data?.user;
  const [chatEnabled, setChatEnabled] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [instapayHandle, setInstapayHandle] = useState('');
  const [depositType, setDepositType] = useState('percentage');
  const [depositValue, setDepositValue] = useState('50');
  const [depositAgreementAccepted, setDepositAgreementAccepted] = useState(false);

  // InstaPay modal state
  const [showInstapayModal, setShowInstapayModal] = useState(false);
  const [instapayInput, setInstapayInput] = useState('');
  const [instapayType, setInstapayType] = useState('phone');
  const [modalDepositType, setModalDepositType] = useState('percentage');
  const [modalDepositValue, setModalDepositValue] = useState('50');

  // Confirmation modal state (replaces Alert.alert)
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', onConfirm: null, destructive: false });

  // Sync all settings with server data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user?.chatEnabled !== undefined) {
        setChatEnabled(user.chatEnabled !== false);
      }
      const cs = user?.chefSettings;
      if (cs) {
        if (cs.requireCustomerConfirmation !== undefined) setRequireConfirmation(cs.requireCustomerConfirmation !== false);
        if (cs.requireDeposit !== undefined) setRequireDeposit(cs.requireDeposit === true);
        if (cs.instapayHandle !== undefined) setInstapayHandle(cs.instapayHandle || '');
        if (cs.instapayType !== undefined) setInstapayType(cs.instapayType || 'phone');
        if (cs.depositType !== undefined) setDepositType(cs.depositType || 'percentage');
        if (cs.depositValue !== undefined) setDepositValue(String(cs.depositValue || 50));
        if (cs.depositAgreementAccepted !== undefined) setDepositAgreementAccepted(cs.depositAgreementAccepted === true);
      }
    }, [user?.chatEnabled, user?.chefSettings])
  );

  // --- Toggle handlers ---

  const handleChatToggle = useCallback(async (value) => {
    setChatEnabled(value);
    try {
      await request.patch('/user', { chatEnabled: value });
      queryClient.invalidateQueries('user');
    } catch (error) {
      console.error('[ChefDashboard] Failed to update chat status:', error);
      setChatEnabled(!value);
    }
  }, [queryClient]);

  const handleConfirmationToggle = useCallback(async (value) => {
    // Turning OFF while deposit is ON → show warning modal
    if (!value && requireDeposit) {
      setConfirmModal({
        visible: true,
        title: strings.customerConfirmationStep,
        message: strings.confirmationDisablesDeposit,
        destructive: true,
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, visible: false }));
          setRequireConfirmation(false);
          setRequireDeposit(false);
          try {
            await request.patch('/user', { requireCustomerConfirmation: false, requireDeposit: false });
            queryClient.invalidateQueries('user');
          } catch (error) {
            setRequireConfirmation(true);
            setRequireDeposit(true);
          }
        },
      });
      return;
    }
    setRequireConfirmation(value);
    try {
      await request.patch('/user', { requireCustomerConfirmation: value });
      queryClient.invalidateQueries('user');
    } catch (error) {
      setRequireConfirmation(!value);
    }
  }, [queryClient, requireDeposit]);

  const handleDepositToggle = useCallback(async (value) => {
    if (value) {
      // Agreement not yet accepted → show terms first
      if (!depositAgreementAccepted) {
        setConfirmModal({
          visible: true,
          title: strings.depositAgreementTitle,
          message: strings.depositAgreementBody,
          destructive: false,
          confirmText: strings.depositAgreementAccept,
          cancelText: strings.depositAgreementDecline,
          onConfirm: async () => {
            setConfirmModal(prev => ({ ...prev, visible: false }));
            setDepositAgreementAccepted(true);
            try {
              await request.patch('/user', { depositAgreementAccepted: true });
              queryClient.invalidateQueries('user');
            } catch (error) {
              setDepositAgreementAccepted(false);
            }
            // Re-trigger toggle now that agreement is accepted
            handleDepositToggle(true);
          },
        });
        return;
      }
      // No InstaPay yet → show modal to add it first
      if (!instapayHandle) {
        setInstapayInput('');
        setModalDepositType(depositType);
        setModalDepositValue(depositValue);
        setShowInstapayModal(true);
        return;
      }
      // Confirmation is OFF → warn that both will be enabled
      if (!requireConfirmation) {
        setConfirmModal({
          visible: true,
          title: strings.requireDeposit,
          message: strings.depositEnablesConfirmation,
          destructive: false,
          onConfirm: async () => {
            setConfirmModal(prev => ({ ...prev, visible: false }));
            setRequireDeposit(true);
            setRequireConfirmation(true);
            try {
              await request.patch('/user', { requireDeposit: true, requireCustomerConfirmation: true });
              queryClient.invalidateQueries('user');
            } catch (error) {
              setRequireDeposit(false);
              setRequireConfirmation(false);
            }
          },
        });
        return;
      }
      // All good, just enable
      setRequireDeposit(true);
      try {
        await request.patch('/user', { requireDeposit: true });
        queryClient.invalidateQueries('user');
      } catch (error) {
        setRequireDeposit(false);
      }
    } else {
      setRequireDeposit(false);
      try {
        await request.patch('/user', { requireDeposit: false });
        queryClient.invalidateQueries('user');
      } catch (error) {
        setRequireDeposit(true);
      }
    }
  }, [queryClient, instapayHandle, requireConfirmation, depositAgreementAccepted]);

  // Validate InstaPay input based on type
  const validateInstapayInput = useCallback((value, type) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (type === 'phone') {
      if (!/^01/.test(trimmed)) return strings.instapayPhoneStartWith01;
      if (!/^\d+$/.test(trimmed)) return strings.instapayPhoneDigitsOnly;
      if (trimmed.length !== 11) return strings.instapayPhoneMustBe11;
    } else {
      if (!trimmed.includes('@')) return strings.instapayHandleMustHaveAt;
      const [before, after] = trimmed.split('@');
      if (!before || !after) return strings.instapayHandleInvalid;
    }
    return '';
  }, []);

  const instapayError = validateInstapayInput(instapayInput, instapayType);
  const isInstapayValid = instapayInput.trim().length > 0 && !instapayError;

  // Open modal for editing existing deposit config
  const openDepositModal = useCallback(() => {
    setInstapayInput(instapayHandle);
    setInstapayType(user?.chefSettings?.instapayType || 'phone');
    setModalDepositType(depositType);
    setModalDepositValue(depositValue);
    setShowInstapayModal(true);
  }, [instapayHandle, depositType, depositValue, user]);

  const handleInstapayModalSave = useCallback(async () => {
    const trimmed = instapayInput.trim();
    if (!trimmed || instapayError) return;
    // Validate and clamp deposit value
    const valNum = Number(modalDepositValue) || 0;
    const clampedValue = modalDepositType === 'percentage' ? Math.min(100, Math.max(1, valNum)) : Math.max(1, valNum);
    // Apply all locally
    setInstapayHandle(trimmed);
    setDepositType(modalDepositType);
    setDepositValue(String(clampedValue));
    setShowInstapayModal(false);
    setRequireDeposit(true);
    const patch = {
      instapayHandle: trimmed,
      instapayType,
      depositType: modalDepositType,
      depositValue: clampedValue,
      requireDeposit: true,
    };
    if (!requireConfirmation) {
      patch.requireCustomerConfirmation = true;
      setRequireConfirmation(true);
    }
    try {
      await request.patch('/user', patch);
      queryClient.invalidateQueries('user');
    } catch (error) {
      setRequireDeposit(false);
      showErrorToast(strings.error || 'Error', error.message);
    }
  }, [instapayInput, instapayError, instapayType, modalDepositType, modalDepositValue, queryClient, requireConfirmation]);

  const handleInstapayUpdate = useCallback(async (value) => {
    const trimmed = value.trim();
    setInstapayHandle(trimmed);
    try {
      await request.patch('/user', { instapayHandle: trimmed });
      queryClient.invalidateQueries('user');
    } catch (error) {
      console.error('[ChefDashboard] Failed to update instapay:', error);
    }
  }, [queryClient]);

  const handleDepositTypeChange = useCallback(async (newType) => {
    setDepositType(newType);
    try {
      await request.patch('/user', { depositType: newType });
      queryClient.invalidateQueries('user');
    } catch (error) {
      setDepositType(newType === 'percentage' ? 'fixed' : 'percentage');
    }
  }, [queryClient]);

  const handleDepositValueSave = useCallback(async () => {
    const val = Number(depositValue);
    if (!val || val <= 0) return;
    try {
      await request.patch('/user', { depositValue: val, depositType });
      queryClient.invalidateQueries('user');
    } catch (error) {
      console.error('[ChefDashboard] Failed to update deposit value:', error);
    }
  }, [queryClient, depositValue, depositType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchActivity()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const navigateToSection = (sectionName) => {
    switch (sectionName) {
      case 'Menu': navigation.navigate(StackNav.MenuManagement, { fromTabs: true }); break;
      case 'Orders': navigation.navigate(StackNav.OrderManagement, { fromStack: true }); break;
      case 'Analytics': navigation.navigate(StackNav.Analytics); break;
      default: break;
    }
  };

  // --- Render ---

  return (
    <ZSafeAreaView>
      {/* InstaPay Modal — Center Dialog */}
      <Modal visible={showInstapayModal} transparent animationType="fade" onRequestClose={() => setShowInstapayModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={localStyles.modalOverlay}>
            <View style={[localStyles.modalContainer, { backgroundColor: colors.backgroundColor }]}>
              {/* Header */}
              <View style={localStyles.modalHeaderCenter}>
                <ZText type="B20" color={colors.textColor} align="center">{strings.addInstapayTitle}</ZText>
                <ZText type="R14" color={colors.grayScale7} align="center" style={{ marginTop: moderateScale(6) }}>{strings.addInstapayDesc}</ZText>
              </View>

              {/* Type Picker */}
              <View style={localStyles.modalBody}>
                <ZText type="M14" color={colors.textColor} style={{ marginBottom: moderateScale(8) }}>{strings.instapayHandle}</ZText>
                <View style={localStyles.depositTypePicker}>
                  <TouchableOpacity
                    style={[localStyles.depositTypeButton, {
                      backgroundColor: instapayType === 'phone' ? colors.primary + '20' : 'transparent',
                      borderColor: instapayType === 'phone' ? colors.primary : colors.borderColor,
                    }]}
                    onPress={() => setInstapayType('phone')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={moderateScale(16)} color={instapayType === 'phone' ? colors.primary : colors.grayScale5} style={{ marginBottom: moderateScale(4) }} />
                    <ZText type={instapayType === 'phone' ? 'B14' : 'M14'} color={instapayType === 'phone' ? colors.primary : colors.textColor}>{strings.instapayTypePhone}</ZText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[localStyles.depositTypeButton, {
                      backgroundColor: instapayType === 'handle' ? colors.primary + '20' : 'transparent',
                      borderColor: instapayType === 'handle' ? colors.primary : colors.borderColor,
                    }]}
                    onPress={() => setInstapayType('handle')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="at-outline" size={moderateScale(16)} color={instapayType === 'handle' ? colors.primary : colors.grayScale5} style={{ marginBottom: moderateScale(4) }} />
                    <ZText type={instapayType === 'handle' ? 'B14' : 'M14'} color={instapayType === 'handle' ? colors.primary : colors.textColor}>{strings.instapayTypeHandle}</ZText>
                  </TouchableOpacity>
                </View>

                {/* Input */}
                <View style={[localStyles.modalInputContainer, {
                  backgroundColor: colors.inputBg,
                  borderColor: instapayError && instapayInput.trim() ? colors.redColor : colors.bColor,
                  marginTop: moderateScale(16),
                }]}>
                  <TextInput
                    style={[localStyles.modalTextInput, { color: colors.textColor }]}
                    placeholder={instapayType === 'phone' ? strings.instapayPhonePlaceholder : strings.instapayIpaPlaceholder}
                    placeholderTextColor={colors.grayScale7}
                    value={instapayInput}
                    onChangeText={setInstapayInput}
                    keyboardType={instapayType === 'phone' ? 'phone-pad' : 'default'}
                    autoFocus
                    maxLength={instapayType === 'phone' ? 11 : 50}
                  />
                  {instapayInput.length > 0 && (
                    <TouchableOpacity onPress={() => setInstapayInput('')} style={{ marginLeft: moderateScale(8) }}>
                      <Ionicons name="close-circle" size={moderateScale(18)} color={colors.grayScale7} />
                    </TouchableOpacity>
                  )}
                </View>
                {instapayError && instapayInput.trim() ? (
                  <ZText type="R12" color={colors.redColor} style={{ marginTop: moderateScale(6) }}>{instapayError}</ZText>
                ) : null}
                {/* Deposit Type Picker */}
                <ZText type="M14" color={colors.textColor} style={{ marginTop: moderateScale(16), marginBottom: moderateScale(8) }}>{strings.depositTypeLabel}</ZText>
                <View style={localStyles.depositTypePicker}>
                  <TouchableOpacity
                    style={[localStyles.depositTypeButton, {
                      backgroundColor: modalDepositType === 'percentage' ? colors.primary + '20' : 'transparent',
                      borderColor: modalDepositType === 'percentage' ? colors.primary : colors.borderColor,
                    }]}
                    onPress={() => setModalDepositType('percentage')}
                    activeOpacity={0.7}
                  >
                    <ZText type={modalDepositType === 'percentage' ? 'B14' : 'M14'} color={modalDepositType === 'percentage' ? colors.primary : colors.textColor}>
                      {strings.depositTypePercentage} (%)
                    </ZText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[localStyles.depositTypeButton, {
                      backgroundColor: modalDepositType === 'fixed' ? colors.primary + '20' : 'transparent',
                      borderColor: modalDepositType === 'fixed' ? colors.primary : colors.borderColor,
                    }]}
                    onPress={() => setModalDepositType('fixed')}
                    activeOpacity={0.7}
                  >
                    <ZText type={modalDepositType === 'fixed' ? 'B14' : 'M14'} color={modalDepositType === 'fixed' ? colors.primary : colors.textColor}>
                      {strings.depositTypeFixed} ({strings.currency})
                    </ZText>
                  </TouchableOpacity>
                </View>

                {/* Deposit Value */}
                <ZText type="M14" color={colors.textColor} style={{ marginTop: moderateScale(16), marginBottom: moderateScale(8) }}>
                  {strings.depositValueLabel} {modalDepositType === 'percentage' ? '(1-100%)' : `(${strings.currency})`}
                </ZText>
                <View style={[localStyles.modalInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                  <TextInput
                    style={[localStyles.modalTextInput, { color: colors.textColor }]}
                    value={modalDepositValue}
                    onChangeText={setModalDepositValue}
                    keyboardType="numeric"
                    placeholder={modalDepositType === 'percentage' ? '50' : '100'}
                    placeholderTextColor={colors.grayScale7}
                  />
                </View>
              </View>

              {/* Buttons */}
              <View style={localStyles.modalButtonRow}>
                <TouchableOpacity
                  style={[localStyles.modalBtn, localStyles.modalCancelBtn, { borderColor: colors.borderColor }]}
                  onPress={() => setShowInstapayModal(false)}
                  activeOpacity={0.7}
                >
                  <ZText type="B16" color={colors.textColor}>{strings.cancel}</ZText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[localStyles.modalBtn, { backgroundColor: isInstapayValid ? colors.primary : colors.borderColor }]}
                  onPress={handleInstapayModalSave}
                  disabled={!isInstapayValid}
                  activeOpacity={0.7}
                >
                  <ZText type="B16" color={colors.white}>{strings.save}</ZText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Modal — themed replacement for Alert.alert */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}>
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modalContainer, { backgroundColor: colors.backgroundColor }]}>
            <View style={localStyles.modalHeaderCenter}>
              <ZText type="B20" color={colors.textColor} align="center">{confirmModal.title}</ZText>
              <ZText type="R14" color={colors.grayScale7} align="center" style={{ marginTop: moderateScale(8) }}>{confirmModal.message}</ZText>
            </View>
            <View style={localStyles.modalButtonRow}>
              <TouchableOpacity
                style={[localStyles.modalBtn, localStyles.modalCancelBtn, { borderColor: colors.borderColor }]}
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                activeOpacity={0.7}
              >
                <ZText type="B16" color={colors.textColor}>{confirmModal.cancelText || strings.cancel}</ZText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[localStyles.modalBtn, { backgroundColor: confirmModal.destructive ? colors.redColor : colors.primary }]}
                onPress={confirmModal.onConfirm}
                activeOpacity={0.7}
              >
                <ZText type="B16" color={colors.white}>{confirmModal.confirmText || strings.confirm}</ZText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={localStyles.headerContainer}>
        {isFromProfile && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: moderateScale(8) }}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.textColor} />
          </TouchableOpacity>
        )}
        <ZText type="b24" style={{ flex: 1 }}>{strings.chefDashboard}</ZText>
        <View style={localStyles.headerRightSection}>
          <HeaderIconWithBadge name="reader-outline" count={unseenOrdersCount} onPress={() => navigation.navigate(StackNav.OrderManagement, { fromStack: true })} />
          <HeaderIconWithBadge name="chatbubbles-outline" count={unreadChatsCount} onPress={() => navigation.navigate(StackNav.ChatList, { fromStack: true })} />
        </View>
      </View>
      <ScrollView style={localStyles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Welcome Section */}
        <View style={localStyles.welcomeSection}>
          <ZText type="B24" style={localStyles.welcomeText}>{strings.welcomeBackChef}</ZText>
          <ZText type="M16" color={colors.grayScale7}>{strings.restaurantOverview}</ZText>
        </View>

        {/* Settings Toggles */}
        <View style={[localStyles.settingsCard, { backgroundColor: colors.inputBg }]}>
          {/* Chat Toggle */}
          <View style={localStyles.settingsRow}>
            <Ionicons name={chatEnabled ? 'chatbubbles' : 'chatbubbles-outline'} size={moderateScale(18)} color={chatEnabled ? (colors.success || '#4CAF50') : colors.grayScale7} />
            <View style={localStyles.settingsTextCol}>
              <ZText type="B14" color={colors.textColor}>{strings.customerChat || 'Customer Chat'}</ZText>
              <ZText type="R12" color={colors.grayScale7}>
                {chatEnabled ? (strings.availableForChatDesc || 'Customers can message you about orders') : (strings.chatPausedDesc || 'Customers cannot send you messages')}
              </ZText>
            </View>
            <Switch value={chatEnabled} onValueChange={handleChatToggle} trackColor={{ false: colors.grayScale3 || '#E0E0E0', true: (colors.success || '#4CAF50') + '80' }} thumbColor={chatEnabled ? (colors.success || '#4CAF50') : colors.grayScale7 || '#757575'} style={{ transform: [{ scale: 0.85 }] }} />
          </View>

          <View style={[localStyles.settingsDivider, { backgroundColor: colors.grayScale3 }]} />

          {/* Confirmation Toggle */}
          <View style={localStyles.settingsRow}>
            <Ionicons name={requireConfirmation ? 'shield-checkmark' : 'shield-checkmark-outline'} size={moderateScale(18)} color={requireConfirmation ? colors.primary : colors.grayScale7} />
            <View style={localStyles.settingsTextCol}>
              <ZText type="B14" color={colors.textColor}>{strings.customerConfirmationStep || 'Customer Confirmation Step'}</ZText>
              <ZText type="R12" color={colors.grayScale7}>
                {requireConfirmation ? (strings.confirmationRequiredDesc || 'Customers must confirm after you accept') : (strings.confirmationSkippedDesc || 'Orders start immediately after you accept')}
              </ZText>
            </View>
            <Switch value={requireConfirmation} onValueChange={handleConfirmationToggle} trackColor={{ false: colors.grayScale3 || '#E0E0E0', true: (colors.primary) + '80' }} thumbColor={requireConfirmation ? colors.primary : colors.grayScale7 || '#757575'} style={{ transform: [{ scale: 0.85 }] }} />
          </View>

          <View style={[localStyles.settingsDivider, { backgroundColor: colors.grayScale3 }]} />

          {/* Deposit Toggle */}
          <View style={localStyles.settingsRow}>
            <Ionicons name={requireDeposit ? 'cash' : 'cash-outline'} size={moderateScale(18)} color={requireDeposit ? (colors.orange || '#FF9800') : colors.grayScale7} />
            <View style={localStyles.settingsTextCol}>
              <ZText type="B14" color={colors.textColor}>{strings.requireDeposit}</ZText>
              <ZText type="R12" color={colors.grayScale7}>
                {requireDeposit ? strings.requireDepositDesc : strings.depositDisabledDesc}
              </ZText>
            </View>
            <Switch value={requireDeposit} onValueChange={handleDepositToggle} trackColor={{ false: colors.grayScale3 || '#E0E0E0', true: (colors.orange || '#FF9800') + '80' }} thumbColor={requireDeposit ? (colors.orange || '#FF9800') : colors.grayScale7 || '#757575'} style={{ transform: [{ scale: 0.85 }] }} />
          </View>

          {/* Deposit Summary (when ON) — tap to edit */}
          {requireDeposit && (
            <TouchableOpacity style={localStyles.depositConfig} onPress={openDepositModal} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <ZText type="R12" color={colors.grayScale7}>{strings.instapayHandle}</ZText>
                  <ZText type="M14" color={colors.textColor}>{instapayHandle || '—'}</ZText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ZText type="R12" color={colors.grayScale7}>{strings.depositValueLabel}</ZText>
                  <ZText type="M14" color={colors.textColor}>{depositValue}{depositType === 'percentage' ? '%' : ` ${strings.currency}`}</ZText>
                </View>
                <Ionicons name={require('react-native').I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={moderateScale(18)} color={colors.grayScale7} style={{ marginLeft: moderateScale(8) }} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Wallet Card */}
        <TouchableOpacity style={[localStyles.walletCard, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate(StackNav.Wallet)} activeOpacity={0.9}>
          <View style={localStyles.walletHeader}>
            <View style={localStyles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={moderateScale(28)} color={colors.white} />
            </View>
            <View style={localStyles.walletInfo}>
              <ZText type="M14" color={colors.white} style={{ opacity: 0.9 }}>{strings.wallet}</ZText>
              <ZText type="B28" color={colors.white}>{strings.currency} {formatCurrency(stats?.walletBalance || 0)}</ZText>
            </View>
            <Ionicons name={require('react-native').I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={moderateScale(24)} color={colors.white} />
          </View>
          <View style={localStyles.walletFooter}>
            <ZText type="M12" color={colors.white} style={{ opacity: 0.8 }}>{strings.currentBalance}</ZText>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Section */}
        <View style={localStyles.quickActionsSection}>
          <ZText type="S18" style={localStyles.sectionTitle}>{strings.quickActions}</ZText>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]} onPress={() => navigation.navigate(StackNav.ChefBranches)}>
              <View style={[localStyles.actionIcon, { backgroundColor: '#26A69A' }]}>
                <Ionicons name="location-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>{strings.branchesAndSchedules}</ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">{strings.manageBranchesDesc}</ZText>
            </TouchableOpacity>
            <TouchableOpacity style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]} onPress={() => navigateToSection('Menu')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="restaurant-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>{strings.manageMenu}</ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">{strings.addEditRemoveDishes}</ZText>
            </TouchableOpacity>
          </View>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]} onPress={() => navigateToSection('Orders')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.orange }]}>
                <Ionicons name="reader-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>{strings.viewOrders}</ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">{strings.managePendingOrders}</ZText>
            </TouchableOpacity>
            <TouchableOpacity style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]} onPress={() => navigation.navigate(StackNav.ChatList)}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.blue }]}>
                <Ionicons name="chatbubbles-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>{strings.customerChats}</ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">{strings.chatWithCustomers}</ZText>
            </TouchableOpacity>
          </View>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity style={[localStyles.actionCard, { backgroundColor: colors.inputBg }]} onPress={() => navigateToSection('Analytics')}>
              <View style={[localStyles.actionIcon, { backgroundColor: colors.green }]}>
                <Ionicons name="analytics-outline" size={moderateScale(24)} color={colors.white} />
              </View>
              <ZText type="S16" style={localStyles.actionTitle}>{strings.viewAnalytics}</ZText>
              <ZText type="M12" color={colors.grayScale7} align="center">{strings.checkPerformance}</ZText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={localStyles.statsContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>{strings.overview}</ZText>
          <View style={localStyles.statsGrid}>
            <DashboardCard title={strings.totalRevenue} value={`${strings.currency} ${formatCurrency(stats?.totalRevenue)}`} icon="cash-outline" color={colors.primary} containerStyle={localStyles.statCard} onPress={() => navigateToSection('Analytics')} />
            <DashboardCard title={strings.pendingOrders} value={stats?.pendingOrders?.toString() || '0'} icon="time-outline" color={colors.orange} containerStyle={localStyles.statCard} onPress={() => navigateToSection('Orders')} />
          </View>
          <View style={localStyles.statsGrid}>
            <DashboardCard title={strings.totalDishes} value={stats?.totalDishes?.toString() || '0'} icon="restaurant-outline" color={colors.blue} containerStyle={localStyles.statCard} onPress={() => navigateToSection('Menu')} />
            <DashboardCard title={strings.completedOrders} value={stats?.completedOrders?.toString() || '0'} icon="checkmark-circle-outline" color={colors.green} containerStyle={localStyles.statCard} onPress={() => navigateToSection('Analytics')} />
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={localStyles.sectionContainer}>
          <ZText type="S18" style={localStyles.sectionTitle}>{strings.recentActivity}</ZText>
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => (
              <TouchableOpacity key={activity.id || index} style={[localStyles.activityItem, { backgroundColor: colors.inputBg }]} onPress={() => navigation.navigate(StackNav.OrderManagement)} activeOpacity={0.7}>
                <View style={[localStyles.activityIconContainer, { backgroundColor: activity.color + '20' }]}>
                  <Ionicons name={activity.icon} size={moderateScale(20)} color={activity.color} />
                </View>
                <View style={localStyles.activityInfo}>
                  <ZText type="M14" numberOfLines={1}>{activity.message}</ZText>
                  <ZText type="M12" color={colors.grayScale7}>{activity.time}</ZText>
                </View>
                <Ionicons name={require('react-native').I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={moderateScale(16)} color={colors.grayScale7} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={[localStyles.activityCard, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="time-outline" size={moderateScale(32)} color={colors.grayScale7} />
              <ZText type="M16" align="center" color={colors.grayScale7} style={localStyles.activityText}>{strings.noRecentActivity}</ZText>
              <ZText type="M12" align="center" color={colors.grayScale7}>{strings.recentActivityDescription}</ZText>
            </View>
          )}
        </View>
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  welcomeSection: {
    paddingVertical: moderateScale(24),
  },
  welcomeText: {
    marginBottom: moderateScale(10),
  },
  walletCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
    ...styles.shadowStyle,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  walletInfo: {
    flex: 1,
  },
  walletFooter: {
    marginTop: moderateScale(12),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    marginBottom: moderateScale(32),
  },
  sectionTitle: {
    marginBottom: moderateScale(20),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  statCard: {
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: moderateScale(32),
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  actionCard: {
    flex: 1,
    padding: moderateScale(18),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  actionIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  actionTitle: {
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: moderateScale(32),
  },
  activityCard: {
    padding: moderateScale(28),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  activityText: {
    marginTop: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
    ...styles.shadowStyle,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  activityIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  activityInfo: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsCard: {
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
    gap: moderateScale(10),
  },
  settingsTextCol: {
    flex: 1,
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: moderateScale(4),
  },
  // Deposit configuration styles
  depositConfig: {
    paddingTop: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    gap: moderateScale(10),
  },
  depositConfigRow: {
    marginBottom: moderateScale(4),
  },
  depositInput: {
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: 14,
  },
  depositTypePicker: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  depositTypeButton: {
    flex: 1,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  // InstaPay Modal — Center Dialog styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  modalContainer: {
    width: '100%',
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  modalHeaderCenter: {
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(8),
  },
  modalBody: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(16),
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  modalTextInput: {
    flex: 1,
    fontSize: moderateScale(16),
    padding: 0,
  },
  modalButtonRow: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(24),
    paddingTop: moderateScale(8),
    gap: moderateScale(12),
  },
  modalBtn: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});