import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Platform, UIManager, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  try {
    return Number(value).toFixed(2);
  } catch (e) {
    return String(value);
  }
};

const StatusPill = ({ status, colors }) => {
  const normalized = String(status || 'pending').toLowerCase();
  const map = {
    pending: { bg: colors.statusPendingBg, fg: colors.statusPendingFg, icon: 'time-outline', label: strings.pendingCustomer || strings.pending },
    awaiting_confirmation: { bg: '#FFF3E0', fg: '#E65100', icon: 'alert-circle-outline', label: strings.awaitingConfirmation || 'Awaiting Confirmation' },
    accepted: { bg: colors.statusAcceptedBg, fg: colors.statusAcceptedFg, icon: 'checkmark-circle-outline', label: strings.accepted },
    confirmed: { bg: colors.statusAcceptedBg, fg: colors.statusAcceptedFg, icon: 'checkmark-circle-outline', label: strings.confirmed },
    preparing: { bg: colors.statusPreparingBg, fg: colors.statusPreparingFg, icon: 'restaurant-outline', label: strings.preparing },
    delivering: { bg: colors.statusPreparingBg, fg: colors.statusPreparingFg, icon: 'bicycle-outline', label: strings.delivering },
    completed: { bg: colors.statusCompletedBg, fg: colors.statusCompletedFg, icon: 'checkmark-done-circle-outline', label: strings.completed },
    cancelled: { bg: colors.statusCancelledBg, fg: colors.statusCancelledFg, icon: 'close-circle-outline', label: strings.cancelled },
  };
  const c = map[normalized] || { bg: colors.statusDefaultBg, fg: colors.statusDefaultFg, icon: 'help-circle-outline', label: status };
  return (
    <View style={[styles.statusPill, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={moderateScale(12)} color={c.fg} style={{ marginRight: moderateScale(4) }} />
      <ZText type="M12" color={c.fg}>
        {String(c.label || 'PENDING').toUpperCase()}
      </ZText>
    </View>
  );
};

const PriceRow = ({ label, value, colors, bold }) => (
  <View style={styles.rowBetween}>
    <ZText type={bold ? 'B14' : 'M14'} color={bold ? colors.textColor : colors.grayScale7}>{label}</ZText>
    <ZText type={bold ? 'B16' : 'M14'} color={bold ? colors.primary : colors.textColor}>{formatCurrency(value)}</ZText>
  </View>
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OrderSummaryCard = ({ order, colors, onPressPrimary, initialCollapsed = true, onClose, autoPeek = true, peekDurationMs = 400, isChef, onAccept, onReject }) => {
  const [collapsed, setCollapsed] = useState(!!initialCollapsed);
  const [contentOpacity] = useState(new Animated.Value(initialCollapsed ? 0 : 1));
  const hasPeekedRef = useRef(false);
  const items = order?.items || [];
  const showItems = items.slice(0, 3);
  const extraCount = Math.max(items.length - showItems.length, 0);

  const expand = () => {
    setCollapsed(false);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  const collapse = () => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCollapsed(true);
    });
  };

  useEffect(() => {
    if (autoPeek && collapsed && !hasPeekedRef.current) {
      hasPeekedRef.current = true;
      expand();
      const t = setTimeout(() => collapse(), peekDurationMs);
      return () => clearTimeout(t);
    }
  }, []);


  const containerStyle = collapsed
    ? [styles.collapsedContainer, { backgroundColor: colors.inputBg, borderColor: 'rgba(255,255,255,0.06)' }]
    : [styles.card, { backgroundColor: colors.backgroundColor, borderColor: 'rgba(255,255,255,0.06)' }];

  const renderDetails = () => (
    <View>
      <View style={styles.itemsContainer}>
        {showItems.map((it, idx) => {
          const imageUri = typeof it?.image === 'string' ? it.image : (it?.image?.url || it?.image?.uri || '');
          return (
            <View key={idx} style={[styles.itemRow, { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: moderateScale(12) }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="fast-food-outline" size={moderateScale(20)} color={colors.grayScale7} />
                </View>
              )}
              <View style={styles.itemInfo}>
                <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                  {it?.name || 'Item'}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  {`${it?.quantity || 1} × ${formatCurrency(it?.unitPrice)}`}
                </ZText>
              </View>
              <ZText type="B14" color={colors.textColor}>
                {formatCurrency((it?.quantity || 1) * (it?.unitPrice || 0))}
              </ZText>
            </View>
          );
        })}

        {extraCount > 0 && (
          <View style={[styles.extraRow, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
            <Ionicons name="add-circle-outline" size={moderateScale(14)} color={colors.grayScale7} style={{ marginRight: moderateScale(4) }} />
            <ZText type="M12" color={colors.grayScale7}>{strings.moreItems.replace('{count}', extraCount)}</ZText>
          </View>
        )}
      </View>

      <View style={[styles.pricesContainer, { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: moderateScale(12), padding: moderateScale(12) }]}>
        <PriceRow label={strings.subtotal} value={order?.subtotal} colors={colors} />
        {order?.deliveryFee !== undefined && (
          <PriceRow label={strings.delivery} value={order?.deliveryFee} colors={colors} />
        )}
        {order?.serviceFee !== undefined && !!order?.serviceFee && (
          <PriceRow label={strings.service} value={order?.serviceFee} colors={colors} />
        )}
        {order?.tax !== undefined && !!order?.tax && (
          <PriceRow label={strings.tax} value={order?.tax} colors={colors} />
        )}
        {order?.promocode?.discountAmount ? (
          <PriceRow label={`${strings.promo} (${order?.promocode?.code || ''})`} value={-Math.abs(order?.promocode?.discountAmount)} colors={colors} />
        ) : null}
        <View style={styles.divider} />
        <PriceRow label={strings.total} value={order?.totalPrice} colors={colors} bold />
      </View>

      {!!order?.address && (
        <View style={[styles.addressContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
          <Ionicons name="location-outline" size={moderateScale(14)} color={colors.grayScale7} style={{ marginRight: moderateScale(6) }} />
          <ZText type="M12" color={colors.grayScale7} numberOfLines={2} style={{ flex: 1 }}>
            {order?.address}
          </ZText>
        </View>
      )}

      <View style={styles.actionsRow}>
        {isChef && order?.status === 'pending' ? (
          <>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: '#EF5350' }]} onPress={onReject}>
              <Ionicons name="close-outline" size={moderateScale(18)} color="#EF5350" style={{ marginRight: moderateScale(4) }} />
              <ZText type="B14" color="#EF5350">{strings.reject}</ZText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onAccept}>
              <Ionicons name="checkmark-outline" size={moderateScale(18)} color={colors.white} style={{ marginRight: moderateScale(4) }} />
              <ZText type="B14" color={colors.white}>{strings.acceptOrder}</ZText>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onPressPrimary}>
            <Ionicons name="navigate-outline" size={moderateScale(16)} color={colors.white} style={{ marginRight: moderateScale(6) }} />
            <ZText type="B14" color={colors.white}>{strings.trackOrder}</ZText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={styles.headerRow} activeOpacity={0.7} onPress={collapsed ? expand : collapse}>
        {/* Order icon */}
        <View style={[styles.orderIcon, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="receipt-outline" size={moderateScale(16)} color={colors.primary} />
        </View>

        <View style={styles.headerLeft}>
          {/* Top row: order number + status pill + chevron */}
          <View style={styles.titleRow}>
            <ZText type={collapsed ? 'B14' : 'B16'} color={colors.textColor} style={{ flex: 1 }}>
              {strings.orderNumber}{String(order?.id || order?._id || '').slice(-6) || '—'}
            </ZText>
            <View style={styles.headerRight}>
              <StatusPill status={order?.status} colors={colors} />
              <View style={[styles.chevronCircle, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={moderateScale(16)} color={colors.textColor} />
              </View>
            </View>
          </View>

          {/* Scheduled order badge */}
          {order?.orderType === 'scheduled' && order?.scheduledFor && (
            <View style={[styles.scheduledBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="time-outline" size={moderateScale(12)} color={colors.primary} style={{ marginRight: moderateScale(4) }} />
              <ZText type="M12" color={colors.primary}>
                {strings.scheduledFor?.replace('{0}', new Date(order.scheduledFor).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })) || `Scheduled for ${new Date(order.scheduledFor).toLocaleString()}`}
              </ZText>
            </View>
          )}

          {/* Bottom row: date + price */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="calendar-outline" size={moderateScale(11)} color={colors.grayScale7} style={{ marginRight: moderateScale(3) }} />
              <ZText type="M12" color={colors.grayScale7} numberOfLines={1}>{order?.formattedDate || ''}</ZText>
            </View>
            {collapsed && (
              <ZText type="B14" color={colors.primary}>{formatCurrency(order?.totalPrice)}</ZText>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <Animated.View style={{ opacity: contentOpacity }}>
          <View style={[styles.expandDivider, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          {renderDetails()}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(18),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  orderIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    marginRight: moderateScale(6),
  },
  chevronCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandDivider: {
    height: 1,
    marginTop: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  itemsContainer: {
    marginTop: moderateScale(12),
    gap: moderateScale(8),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    gap: moderateScale(12),
    minHeight: moderateScale(56),
  },
  itemImage: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    backgroundColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  extraRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginTop: moderateScale(4),
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
  },
  pricesContainer: {
    marginTop: moderateScale(16),
    gap: moderateScale(10),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: moderateScale(6),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(4),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    minHeight: moderateScale(44),
    borderRadius: moderateScale(12),
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedContainer: {
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(6),
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: moderateScale(8),
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    marginTop: moderateScale(4),
    alignSelf: 'flex-start',
  },
});

export default OrderSummaryCard;
