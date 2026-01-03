import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Platform, UIManager, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';

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
    pending: { bg: '#FFF4E5', fg: '#C47F00' },
    accepted: { bg: '#E8FFF3', fg: '#0A7A45' },
    preparing: { bg: '#E8F1FF', fg: '#2456E6' },
    delivering: { bg: '#E8F1FF', fg: '#2456E6' },
    completed: { bg: '#EAFBF3', fg: '#0D8556' },
    cancelled: { bg: '#FFEAEA', fg: '#C62828' },
  };
  const c = map[normalized] || { bg: colors.inputBg, fg: colors.textColor };
  return (
    <View style={[styles.statusPill, { backgroundColor: c.bg }]}>
      <ZText type="M12" color={c.fg}>
        {String(status || 'PENDING').toUpperCase()}
      </ZText>
    </View>
  );
};

const PriceRow = ({ label, value, colors, bold }) => (
  <View style={styles.rowBetween}>
    <ZText type={bold ? 'B14' : 'M14'} color={colors.grayScale7}>{label}</ZText>
    <ZText type={bold ? 'B14' : 'M14'} color={colors.textColor}>{formatCurrency(value)}</ZText>
  </View>
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OrderSummaryCard = ({ order, colors, onPressPrimary, initialCollapsed = true, onClose, autoPeek = true, peekDurationMs = 900, isChef, onAccept, onReject }) => {
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
    ? [styles.collapsedContainer, { backgroundColor: colors.inputBg }]
    : [styles.card, { backgroundColor: colors.backgroundColor }];

  const renderDetails = () => (
    <View>
      <View style={styles.itemsContainer}>
        {showItems.map((it, idx) => {
          const imageUri = typeof it?.image === 'string' ? it.image : (it?.image?.url || it?.image?.uri || '');
          return (
            <View key={idx} style={styles.itemRow}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.itemImage} />
              ) : null}
              <View style={styles.itemInfo}>
                <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                  {it?.name || 'Item'}
                </ZText>
                <ZText type="M12" color={colors.grayScale7}>
                  {`${it?.quantity || 1} x ${formatCurrency(it?.unitPrice)}`}
                </ZText>
              </View>
              <ZText type="B14" color={colors.textColor}>
                {formatCurrency((it?.quantity || 1) * (it?.unitPrice || 0))}
              </ZText>
            </View>
          );
        })}

        {extraCount > 0 && (
          <View style={[styles.extraRow, { backgroundColor: colors.inputBg }]}>
            <ZText type="M12" color={colors.grayScale7}>+{extraCount} more item(s)</ZText>
          </View>
        )}
      </View>

      <View style={styles.pricesContainer}>
        <PriceRow label="Subtotal" value={order?.subtotal} colors={colors} />
        {order?.deliveryFee !== undefined && (
          <PriceRow label="Delivery" value={order?.deliveryFee} colors={colors} />
        )}
        {order?.serviceFee !== undefined && !!order?.serviceFee && (
          <PriceRow label="Service" value={order?.serviceFee} colors={colors} />
        )}
        {order?.tax !== undefined && !!order?.tax && (
          <PriceRow label="Tax" value={order?.tax} colors={colors} />
        )}
        {order?.promocode?.discountAmount ? (
          <PriceRow label={`Promo (${order?.promocode?.code || ''})`} value={-Math.abs(order?.promocode?.discountAmount)} colors={colors} />
        ) : null}
        <View style={styles.divider} />
        <PriceRow label="Total" value={order?.totalPrice} colors={colors} bold />
      </View>

      {!!order?.address && (
        <View style={[styles.addressContainer, { backgroundColor: colors.inputBg }]}>
          <ZText type="M12" color={colors.grayScale7} numberOfLines={2}>
            {order?.address}
          </ZText>
        </View>
      )}

      <View style={styles.actionsRow}>
        {isChef && order?.status === 'pending' ? (
          <>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.error, marginRight: moderateScale(10) }]} onPress={onReject}>
              <ZText type="B14" color={colors.error}>Reject</ZText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onAccept}>
              <ZText type="B14" color={colors.white}>Accept Order</ZText>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onPressPrimary}>
            <ZText type="B14" color={colors.white}>Track order</ZText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={styles.headerRow} activeOpacity={0.8} onPress={collapsed ? expand : collapse}>
        <View style={styles.headerLeft}>
          <ZText type={collapsed ? 'B14' : 'B16'} color={colors.textColor}>
            Order #{String(order?.id || order?._id || '').slice(-6) || '—'}
          </ZText>
          {collapsed ? (
            <View style={styles.collapseMeta}>
              <View style={styles.metaLeft}>
                <ZText type="M12" color={colors.grayScale7}>{order?.formattedDate}</ZText>
              </View>
              <ZText type="M12" color={colors.textColor}>{formatCurrency(order?.totalPrice)}</ZText>
            </View>
          ) : (
            <ZText type="M12" color={colors.grayScale7}>{order?.formattedDate || ''}</ZText>
          )}
        </View>
        <View style={styles.headerRight}>
          <StatusPill status={order?.status} colors={colors} />
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={moderateScale(18)} color={colors.textColor} />
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <Animated.View style={{ opacity: contentOpacity }}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  statusPill: {
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
  },
  itemsContainer: {
    marginTop: moderateScale(12),
    gap: moderateScale(12),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(6),
    gap: moderateScale(12),
    minHeight: moderateScale(56),
  },
  itemImage: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(8),
    backgroundColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  extraRow: {
    alignSelf: 'flex-start',
    marginTop: moderateScale(6),
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
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: moderateScale(8),
  },
  addressContainer: {
    marginTop: moderateScale(16),
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
    gap: moderateScale(4),
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    minHeight: moderateScale(44),
    borderRadius: moderateScale(12),
  },
  secondaryBtn: {
    flex: 1,
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
  iconBtn: {
    padding: moderateScale(6),
  },
  collapsedContainer: {
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseMain: {
    flex: 1,
  },
  collapseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(8),
    marginTop: moderateScale(4),
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    flex: 1,
  },
  collapseRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#999999',
  }
});

export default OrderSummaryCard;


