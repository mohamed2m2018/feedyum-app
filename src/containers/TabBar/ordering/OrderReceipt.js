import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import { formatDate, formatTime } from '../../../utils/helpers';
import { selectCurrentOrder } from '../../../redux/reducer/orderSlice';
import { buildReceiptText } from '../../../utils/receiptTextBuilder';

const OrderReceipt = () => {
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile?.language);
  const route = useRoute();
  const currentOrder = useSelector(selectCurrentOrder);
  const [sharing, setSharing] = useState(false);

  const order = route.params?.order || currentOrder;

  if (!order) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.orderReceipt} />
        <View style={localStyles.emptyContainer}>
          <Ionicons name="receipt-outline" size={moderateScale(64)} color={colors.grayScale4} />
          <ZText type="B16" color={colors.grayScale7} style={{ marginTop: moderateScale(16) }}>
            {strings.noOrderFound || 'Order not found'}
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  const shortId = order._id?.slice(-8) || 'N/A';
  const chefName = order.chef?.fullName || order.chef?.username || '';
  const customerName = order.user?.fullName || order.user?.username || '';

  const handleShare = async () => {
    try {
      setSharing(true);
      const text = buildReceiptText({ order, shortId, chefName, customerName, language, strings });
      await Share.share({ message: text });
    } catch (error) {
      console.error('[OrderReceipt] Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  const InfoRow = ({ label, value, valueColor }) => (
    <View style={localStyles.infoRow}>
      <ZText type="M14" color={colors.grayScale7}>{label}</ZText>
      <ZText type="B14" color={valueColor || colors.textColor}>{value}</ZText>
    </View>
  );

  const renderItems = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
        {strings.orderItems}
      </ZText>
      {order.items?.map((item, index) => {
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || item.dish?.price || 0;
        const lineTotal = (unitPrice * qty).toFixed(2);

        return (
          <View key={index} style={localStyles.itemRow}>
            <View style={localStyles.itemLeft}>
              <ZText type="B14" color={colors.textColor} numberOfLines={2}>
                {item.dish?.name || strings.unknownDish}
              </ZText>
              {item.selectedOptions?.length > 0 && (
                <ZText type="M12" color={colors.grayScale7} numberOfLines={1}>
                  {item.selectedOptions.map(o => o.optionNames?.join(', ')).join(' • ')}
                </ZText>
              )}
              <ZText type="M12" color={colors.grayScale7}>
                {unitPrice.toFixed(2)} {strings.currency} × {qty}
              </ZText>
            </View>
            <ZText type="B14" color={colors.primary}>
              {lineTotal} {strings.currency}
            </ZText>
          </View>
        );
      })}
    </View>
  );

  const renderPricing = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
        {strings.pricingSummary}
      </ZText>
      <InfoRow label={strings.subtotal} value={`${order.subtotal?.toFixed(2) || '0.00'} ${strings.currency}`} />
      {order.deliveryFee > 0 && (
        <InfoRow label={strings.deliveryFee} value={`${order.deliveryFee.toFixed(2)} ${strings.currency}`} />
      )}
      {order.serviceFee > 0 && (
        <InfoRow label={strings.serviceFee || 'Service Fee:'} value={`${order.serviceFee.toFixed(2)} ${strings.currency}`} />
      )}
      {order.promocode?.discountAmount > 0 && (
        <InfoRow
          label={`${strings.discount} (${order.promocode.code})`}
          value={`-${order.promocode.discountAmount.toFixed(2)} ${strings.currency}`}
          valueColor="#4CAF50"
        />
      )}
      <View style={localStyles.totalDivider} />
      <InfoRow
        label={strings.total}
        value={`${order.totalPrice?.toFixed(2) || '0.00'} ${strings.currency}`}
        valueColor={colors.primary}
      />
    </View>
  );

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.orderReceipt} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}
      >
        {/* Thank You Banner */}
        <View style={[localStyles.banner, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="checkmark-circle" size={moderateScale(32)} color={colors.primary} />
          <ZText type="B16" color={colors.primary} style={{ marginTop: moderateScale(6) }}>
            {strings.thankYouForOrder}
          </ZText>
          <ZText type="M12" color={colors.grayScale7} style={{ marginTop: moderateScale(4) }}>
            {strings.receiptOrderId} #{shortId}
          </ZText>
        </View>

        {/* Order Info */}
        <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
          <InfoRow label={strings.orderId} value={`#${shortId}`} />
          <InfoRow label={strings.orderDate} value={order.created_at ? formatDate(order.created_at, language) : 'N/A'} />
          <InfoRow label={strings.orderTime || 'Time:'} value={order.created_at ? formatTime(order.created_at, language) : 'N/A'} />
          <InfoRow label={strings.chef} value={chefName} />
          <InfoRow label={strings.customer} value={customerName} />
          <InfoRow
            label={strings.paymentMethod}
            value={order.paymentMethod === 'cod' ? strings.cashOnDelivery : strings.online || 'Online'}
          />
        </View>

        {renderItems()}
        {renderPricing()}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
            <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
              {strings.deliveryInformation}
            </ZText>
            <View style={localStyles.addressRow}>
              <Ionicons name="location" size={moderateScale(18)} color={colors.primary} />
              <ZText type="M14" color={colors.textColor} style={{ marginStart: moderateScale(8), flex: 1 }}>
                {order.deliveryAddress.nameLine || ''}
              </ZText>
            </View>
          </View>
        )}

        {/* Share Button */}
        <ZButton
          title={strings.shareReceipt}
          onPress={handleShare}
          disabled={sharing}
          frontIcon={<Ionicons name="share-outline" size={moderateScale(18)} color="#FFFFFF" style={{ marginEnd: moderateScale(6) }} />}
          containerStyle={localStyles.shareButton}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  banner: {
    alignItems: 'center',
    paddingVertical: moderateScale(20),
    borderRadius: moderateScale(16),
    marginTop: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  section: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  itemLeft: {
    flex: 1,
    marginEnd: moderateScale(12),
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginVertical: moderateScale(8),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    marginTop: moderateScale(8),
    marginBottom: moderateScale(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderReceipt;
