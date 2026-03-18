import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showErrorToast, showActionDialog } from '../../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import ZHeader from '../../../../components/common/ZHeader';
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZButton from '../../../../components/common/ZButton';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import images from '../../../../assets/images';
import { updateOrderStatusAsync } from '../../../../redux/reducer/orderSlice';
import strings from '../../../../i18n/strings';

const OrderReviewModal = ({ visible, order, onClose, onAccept, onReject }) => {
  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();

  const [deliveryFee, setDeliveryFee] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [isDeliveryFeeCustom, setIsDeliveryFeeCustom] = useState(false);

  useEffect(() => {
    if (visible && order) {
      // Pre-populate delivery fee from the order (auto-calculated at creation)
      const autoFee = order?.deliveryFee !== undefined ? String(order.deliveryFee) : '0';
      setDeliveryFee(autoFee);
      setIsDeliveryFeeCustom(false);
      setEstimatedTime('30');
      setIsProcessing(false);
    }
  }, [visible, order]);

  const handleAcceptOrder = async () => {
    const fee = parseFloat(deliveryFee || '0');
    if (isNaN(fee) || fee < 0) {
      showErrorToast(strings.invalidDeliveryFee, strings.deliveryFeeCannotBeNegative);
      return;
    }

    showActionDialog({
      type: ALERT_TYPE.SUCCESS,
      title: strings.acceptOrder,
      message: strings.acceptOrderWithFee.replace('{fee}', fee.toFixed(2)),
      confirmText: strings.accept,
      cancelText: strings.cancel,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          // Update order status to accepted with delivery fee
          const updatedOrder = await dispatch(
            updateOrderStatusAsync(order._id, 'confirmed', fee),
          );

          // Call parent callback with actual status from backend
          // (backend may redirect 'confirmed' → 'awaiting_confirmation')
          if (onAccept) {
            onAccept(order, fee, updatedOrder?.status);
          }

          onClose();
        } catch (error) {
          showErrorToast(
            strings.error,
            error.message || strings.failedToAcceptOrder
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleRejectOrder = () => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.rejectOrder,
      message: strings.rejectOrderConfirmation,
      confirmText: strings.reject,
      cancelText: strings.cancel,
      onConfirm: async () => {
        try {
          setIsProcessing(true);

          // Update order status to cancelled
          await dispatch(
            updateOrderStatusAsync(order._id, 'cancelled'),
          );

          // Call parent callback
          if (onReject) {
            onReject(order);
          }

          onClose();
        } catch (error) {
          showErrorToast(
            strings.error,
            error.message || strings.failedToRejectOrder
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const calculateTotal = () => {
    const subtotal = order?.subtotal || 0;
    const fee = parseFloat(deliveryFee) || 0;
    const discount = order?.promocode?.discountAmount || 0;
    return subtotal + fee - discount;
  };

  const renderCustomerInfo = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText
        type="B16"
        color={colors.textColor}
        style={localStyles.sectionTitle}>
        Customer Information
      </ZText>

      <View style={localStyles.customerContainer}>
        <Image
          source={
            order?.user?.avatar
              ? { uri: order.user.avatar }
              : colors.dark
                ? images.userDark
                : images.userLight
          }
          style={localStyles.customerAvatar}
        />
        <View style={localStyles.customerDetails}>
          <ZText type="B16" color={colors.textColor}>
            {order?.user?.fullName || strings.unknownCustomer}
          </ZText>
          {order?.user?.phone && (
            <TouchableOpacity style={localStyles.phoneContainer}>
              <Ionicons
                name="call"
                size={moderateScale(16)}
                color={colors.primary}
              />
              <ZText
                type="M14"
                color={colors.primary}
                style={localStyles.phoneText}>
                {order.user.phone}
              </ZText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderDeliveryAddress = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText
        type="B16"
        color={colors.textColor}
        style={localStyles.sectionTitle}>
        Delivery Address
      </ZText>

      <View style={localStyles.addressContainer}>
        <Ionicons
          name="location"
          size={moderateScale(20)}
          color={colors.primary}
        />
        <View style={localStyles.addressText}>
          <ZText type="M14" color={colors.textColor} numberOfLines={2}>
            {order?.deliveryAddress?.nameLine || 'No address provided'}
          </ZText>
        </View>
      </View>

      {order?.specialInstructions && (
        <View style={localStyles.instructionsContainer}>
          <ZText type="B14" color={colors.textColor}>
            Special Instructions:
          </ZText>
          <ZText type="M14" color={colors.grayScale7}>
            {order.specialInstructions}
          </ZText>
        </View>
      )}
    </View>
  );

  const renderOrderItems = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText
        type="B16"
        color={colors.textColor}
        style={localStyles.sectionTitle}>
        Order Items
      </ZText>

      {order?.items?.map((item, index) => (
        <View key={index} style={localStyles.orderItem}>
          <Image
            source={
              item.dish?.image ? { uri: item.dish.image } : images.dishPlaceholder
            }
            style={localStyles.itemImage}
          />
          <View style={localStyles.itemInfo}>
            <ZText type="B14" color={colors.textColor}>
              {item.dish?.name || strings.unknownDish}
            </ZText>
            <ZText type="M12" color={colors.grayScale7}>
              {strings.quantityLabel}{item.quantity}
            </ZText>
            <ZText type="M12" color={colors.grayScale7}>
              {strings.priceLabel}{(item.price || item.dish?.price || 0).toFixed(2)}{strings.eachLabel}
            </ZText>
          </View>
          <ZText type="B14" color={colors.primary}>
            {((item.price || item.dish?.price || 0) * (item.quantity || 0)).toFixed(2)}
          </ZText>
        </View>
      ))}
    </View>
  );

  const renderDeliveryFeeInput = () => (
    <View style={[localStyles.section, {
      backgroundColor: colors.inputBg,
      borderColor: colors.primary,
      borderWidth: 1, // Highlight this section
    }]}>
      <ZText
        type="B16"
        color={colors.primary} // Make title primary color
        style={localStyles.sectionTitle}>
        {strings.setDeliveryDetails}
      </ZText>

      <View style={localStyles.rowContainer}>
        <View style={[localStyles.inputWrapper, { marginRight: moderateScale(10) }]}>
          <ZText type="M14" color={colors.textColor} style={localStyles.inputLabel}>
            {isDeliveryFeeCustom ? (strings.deliveryFeeCustom || 'Delivery Fee (custom)') : (strings.deliveryFeeAutoCalculated || 'Delivery Fee (auto-calculated)')}
          </ZText>
          <TextInput
            style={[
              localStyles.feeInput,
              {
                backgroundColor: colors.backgroundColor, // Contrast against section bg
                borderColor: deliveryFee ? colors.primary : colors.bColor,
                color: colors.textColor,
              },
            ]}
            value={deliveryFee}
            onChangeText={(val) => {
              setDeliveryFee(val);
              const autoFee = order?.deliveryFee !== undefined ? String(order.deliveryFee) : '0';
              setIsDeliveryFeeCustom(val !== autoFee);
            }}
            placeholder={strings.zeroPlaceholder}
            placeholderTextColor={colors.grayScale7}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View style={localStyles.inputWrapper}>
          <ZText type="M14" color={colors.textColor} style={localStyles.inputLabel}>
            {strings.timeLabel}
          </ZText>
          <TextInput
            style={[
              localStyles.feeInput,
              {
                backgroundColor: colors.backgroundColor,
                borderColor: colors.bColor,
                color: colors.textColor,
              },
            ]}
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            placeholder={strings.timePlaceholder}
            placeholderTextColor={colors.grayScale7}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );

  const renderPricingSummary = () => (
    <View style={[localStyles.section, { backgroundColor: colors.inputBg }]}>
      <ZText
        type="B16"
        color={colors.textColor}
        style={localStyles.sectionTitle}>
        Order Summary
      </ZText>

      <View style={localStyles.pricingRow}>
        <ZText type="M14" color={colors.textColor}>
          {strings.subtotalLabel}
        </ZText>
        <ZText type="B14" color={colors.textColor}>
          {order?.subtotal?.toFixed(2) || '0.00'}
        </ZText>
      </View>

      <View style={localStyles.pricingRow}>
        <ZText type="M14" color={colors.textColor}>
          {strings.deliveryFeeLabel}:
        </ZText>
        <ZText type="B14" color={colors.textColor}>
          {parseFloat(deliveryFee || 0).toFixed(2)}
        </ZText>
      </View>

      {order?.promocode?.discountAmount > 0 && (
        <View style={localStyles.pricingRow}>
          <ZText type="M14" color={colors.primary}>
            {strings.discount} ({order.promocode.code})
          </ZText>
          <ZText type="B14" color={colors.primary}>
            -{order.promocode.discountAmount?.toFixed(2)}
          </ZText>
        </View>
      )}

      <View style={[localStyles.pricingRow, localStyles.totalRow]}>
        <ZText type="B16" color={colors.textColor}>
          {strings.totalLabel}
        </ZText>
        <ZText type="B16" color={colors.primary}>
          {calculateTotal().toFixed(2)}
        </ZText>
      </View>
    </View>
  );

  if (!order) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ZSafeAreaView>
        <ZHeader
          title={strings.reviewOrder}
          onBack={onClose}
          rightIcon={
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={moderateScale(24)}
                color={colors.textColor}
              />
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={localStyles.container}
          showsVerticalScrollIndicator={false}>
          {renderCustomerInfo()}
          {renderDeliveryAddress()}
          {renderOrderItems()}
          {renderDeliveryFeeInput()}
          {renderPricingSummary()}
        </ScrollView>

        <View
          style={[
            localStyles.actionContainer,
            { backgroundColor: colors.backgroundColor },
          ]}>
          <ZButton
            title={isProcessing ? strings.processingOrder : strings.rejectOrderButton}
            textType="B16"
            color={colors.error}
            containerStyle={[
              localStyles.actionButton,
              localStyles.rejectButton,
              { borderColor: colors.error },
            ]}
            onPress={handleRejectOrder}
            disabled={isProcessing}
          />

          <ZButton
            title={isProcessing ? strings.processingOrder : strings.acceptOrder}
            textType="B16"
            color={colors.white}
            containerStyle={[
              localStyles.actionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleAcceptOrder}
            disabled={isProcessing}
          />
        </View>
      </ZSafeAreaView>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // This will be overridden by inline styles
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: moderateScale(16),
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(16),
  },
  customerDetails: {
    flex: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  phoneText: {
    marginLeft: moderateScale(8),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  instructionsContainer: {
    marginTop: moderateScale(16),
    padding: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: moderateScale(8),
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  itemInfo: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: moderateScale(16),
  },
  inputLabel: {
    marginBottom: moderateScale(8),
  },
  feeInput: {
    height: moderateScale(48),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    fontSize: moderateScale(16),
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: moderateScale(12),
    marginTop: moderateScale(8),
  },
  actionContainer: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginHorizontal: moderateScale(8),
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flex: 1,
  },
});

export default OrderReviewModal;
