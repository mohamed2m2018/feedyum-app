import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const TYPE_CONFIG = {
  review_commission: {icon: '💰', label: 'Commission'},
  scout_bonus: {icon: '🎁', label: 'Scout Bonus'},
  milestone_bonus: {icon: '🏆', label: 'Milestone Bonus'},
  commission_reversal: {icon: '❌', label: 'Reversal'},
  transfer_to_wallet: {icon: '↗️', label: 'Transfer'},
};

const getAmountColor = (type, status) => {
  if (type === 'commission_reversal') return commonColor.redColor;
  if (type === 'transfer_to_wallet') return commonColor.grayScale7;
  if (status === 'pending') return commonColor.orange;
  if (type === 'scout_bonus' || type === 'milestone_bonus')
    return commonColor.primary;
  return commonColor.green;
};

const getAmountPrefix = type => {
  if (type === 'commission_reversal') return '-';
  return '+';
};

const formatRelativeTime = dateStr => {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const EarningsCard = ({transaction}) => {
  const colors = useSelector(state => state.theme.theme);

  const config = TYPE_CONFIG[transaction?.type] || TYPE_CONFIG.review_commission;
  const amountColor = getAmountColor(transaction?.type, transaction?.status);
  const prefix = getAmountPrefix(transaction?.type);
  const relativeTime = formatRelativeTime(transaction?.createdAt);

  const formattedAmount =
    typeof transaction?.amount === 'number'
      ? transaction.amount.toFixed(2)
      : '0.00';

  return (
    <View style={[localStyles.row, {backgroundColor: colors.inputBg}]}>
      <View style={localStyles.iconContainer}>
        <ZText type="b18">{config.icon}</ZText>
      </View>

      <View style={localStyles.center}>
        <ZText type="s14" numberOfLines={1}>
          {transaction?.description || config.label}
        </ZText>
        {!!transaction?.missionName && (
          <ZText
            type="r12"
            color={commonColor.grayScale7}
            numberOfLines={1}>
            {transaction.missionName}
          </ZText>
        )}
        {!!relativeTime && (
          <ZText type="r12" color={commonColor.grayScale5}>
            {relativeTime}
          </ZText>
        )}
      </View>

      <ZText type="b14" color={amountColor}>
        {prefix}
        {transaction?.currency || 'EGP'} {formattedAmount}
      </ZText>
    </View>
  );
};

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: commonColor.grayScale1,
  },
  center: {
    flex: 1,
    marginLeft: moderateScale(10),
    marginRight: moderateScale(8),
  },
});

export default EarningsCard;
