import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import { formatTime } from '../../../../utils/helpers';

const STATUS_CONFIG = {
  pending: { icon: 'time-outline', color: '#F5A623' },
  accepted: { icon: 'checkmark-circle', color: '#4CAF50' },
  declined: { icon: 'close-circle', color: '#FF4D67' },
  expired: { icon: 'alert-circle', color: '#9E9E9E' },
};

const PriceOfferBubble = ({
  priceOffer,
  isCurrentUser,
  isChef,
  colors,
  onAccept,
  onDecline,
  createdAt,
  language,
}) => {
  const [actionLoading, setActionLoading] = useState(null); // 'accept' | 'decline' | null
  const { dishName, offeredPrice, currency, selectedOptions, note, status } = priceOffer;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isPending = status === 'pending';
  const isCustomer = !isChef;

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'accept') {
        await onAccept?.();
      } else {
        await onDecline?.();
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.15)' : colors.inputBg },
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="pricetag" size={moderateScale(16)} color={colors.primary} />
        <ZText type="B14" color={isCurrentUser ? colors.white : colors.textColor} style={styles.headerText}>
          {strings.priceOffer}
        </ZText>
      </View>

      {/* Dish Name */}
      <ZText type="B16" color={isCurrentUser ? colors.white : colors.textColor} style={styles.dishName}>
        {dishName}
      </ZText>

      {/* Price */}
      <View style={styles.priceRow}>
        <ZText type="B24" color={colors.primary}>
          {offeredPrice}
        </ZText>
        <ZText type="M14" color={isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.grayScale7} style={styles.currency}>
          {currency || 'EGP'}
        </ZText>
      </View>

      {/* Selected Options */}
      {selectedOptions?.length > 0 && (
        <View style={styles.optionsRow}>
          <Ionicons name="list-outline" size={moderateScale(14)} color={isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.grayScale7} />
          <ZText type="R12" color={isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.grayScale7} style={styles.optionsText}>
            {selectedOptions.join(' • ')}
          </ZText>
        </View>
      )}

      {/* Note */}
      {note ? (
        <ZText type="R12" color={isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.grayScale7} style={styles.note}>
          {note}
        </ZText>
      ) : null}

      {/* Status Badge (non-pending) */}
      {!isPending && (
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
          <Ionicons name={statusConfig.icon} size={moderateScale(14)} color={statusConfig.color} />
          <ZText type="B12" color={statusConfig.color} style={styles.statusText}>
            {status === 'accepted' ? strings.offerAccepted
              : status === 'declined' ? strings.offerDeclined
              : strings.offerExpired}
          </ZText>
        </View>
      )}

      {/* Accept / Decline Buttons (only for customer, only when pending) */}
      {isPending && isCustomer && !isCurrentUser && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton, { borderColor: colors.grayScale5 }]}
            onPress={() => handleAction('decline')}
            disabled={!!actionLoading}
            activeOpacity={0.7}>
            {actionLoading === 'decline' ? (
              <ActivityIndicator size="small" color={colors.grayScale7} />
            ) : (
              <>
                <Ionicons name="close" size={moderateScale(16)} color={colors.grayScale7} />
                <ZText type="B14" color={colors.grayScale7} style={styles.actionText}>
                  {strings.declineOffer}
                </ZText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAction('accept')}
            disabled={!!actionLoading}
            activeOpacity={0.7}>
            {actionLoading === 'accept' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={moderateScale(16)} color={colors.white} />
                <ZText type="B14" color={colors.white} style={styles.actionText}>
                  {strings.acceptOffer}
                </ZText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Time */}
      <ZText type="R10" color={isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.grayScale5} style={styles.time}>
        {formatTime(createdAt, language)}
      </ZText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    minWidth: moderateScale(220),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  headerText: {
    marginLeft: moderateScale(6),
  },
  dishName: {
    marginBottom: moderateScale(4),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: moderateScale(8),
  },
  currency: {
    marginLeft: moderateScale(4),
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  optionsText: {
    marginLeft: moderateScale(4),
    flex: 1,
  },
  note: {
    marginBottom: moderateScale(8),
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  statusText: {
    marginLeft: moderateScale(4),
  },
  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {},
  actionText: {
    marginLeft: moderateScale(4),
  },
  time: {
    marginTop: moderateScale(6),
    alignSelf: 'flex-end',
  },
});

export default PriceOfferBubble;
