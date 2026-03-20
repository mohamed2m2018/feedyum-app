import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
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
  const [quotePrice, setQuotePrice] = useState('');

  // Deposit override state
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositOverrideType, setDepositOverrideType] = useState('percentage');
  const [depositOverrideValue, setDepositOverrideValue] = useState('');

  useEffect(() => {
    if (visible && order) {
      // Pre-populate delivery fee from the order (auto-calculated at creation)
      const autoFee = order?.deliveryFee !== undefined ? String(order.deliveryFee) : '0';
      setDeliveryFee(autoFee);
      setIsDeliveryFeeCustom(false);
      setEstimatedTime('30');
      setIsProcessing(false);
      setQuotePrice(order.orderType === 'catering' && !order.totalPrice ? '' : String(order.totalPrice || ''));

      // Pre-populate deposit from order
      if (order.depositRequired) {
        setDepositEnabled(true);
        // Determine type/value from order's depositAmount vs subtotal
        const subtotal = order.subtotal || 0;
        const storedAmount = order.depositAmount || 0;
        // Check if it looks like a percentage of subtotal
        if (subtotal > 0 && storedAmount > 0) {
          const pct = (storedAmount / subtotal) * 100;
          // If it's a clean percentage, pre-select percentage type
          if (Number.isInteger(Math.round(pct)) && pct <= 100) {
            setDepositOverrideType('percentage');
            setDepositOverrideValue(String(Math.round(pct)));
          } else {
            setDepositOverrideType('fixed');
            setDepositOverrideValue(String(storedAmount));
          }
        } else {
          setDepositOverrideType('percentage');
          setDepositOverrideValue('50');
        }
      } else {
        setDepositEnabled(false);
        setDepositOverrideType('percentage');
        setDepositOverrideValue('');
      }
    }
  }, [visible, order]);

  const handleAcceptOrder = async () => {
    const fee = parseFloat(deliveryFee || '0');
    if (isNaN(fee) || fee < 0) {
      showErrorToast(strings.invalidDeliveryFee, strings.deliveryFeeCannotBeNegative);
      return;
    }

    // Catering orders require a quote price
    const isCatering = order?.orderType === 'catering';
    const quotedPrice = parseFloat(quotePrice || '0');
    if (isCatering && (!quotedPrice || quotedPrice <= 0)) {
      showErrorToast(strings.error, strings.enterQuotePrice || 'Please enter a price quote');
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

          // Update order status to accepted with delivery fee + deposit override
          const depositOverride = order.depositRequired ? {
            depositEnabled,
            depositType: depositOverrideType,
            depositValue: parseFloat(depositOverrideValue) || 0,
          } : undefined;

          const updatedOrder = await dispatch(
            updateOrderStatusAsync(order._id, 'confirmed', fee, depositOverride, isCatering ? quotedPrice : undefined),
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
    const isCatering = order?.orderType === 'catering';
    const subtotal = isCatering ? (parseFloat(quotePrice) || 0) : (order?.subtotal || 0);
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
              {order?.orderType === 'catering' && !(item.price || item.dish?.price)
                ? (strings.uponRequest || 'Upon Request')
                : `${strings.priceLabel}${(item.price || item.dish?.price || 0).toFixed(2)}${strings.eachLabel}`}
            </ZText>
          </View>
          <ZText type="B14" color={colors.primary}>
            {order?.orderType === 'catering' && !(item.price || item.dish?.price)
              ? (strings.uponRequest || 'Upon Request')
              : ((item.price || item.dish?.price || 0) * (item.quantity || 0)).toFixed(2)}
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

  const getCalculatedDepositAmount = () => {
    const subtotal = order?.subtotal || 0;
    const val = parseFloat(depositOverrideValue) || 0;
    if (!depositEnabled || val <= 0) return 0;
    if (depositOverrideType === 'percentage') {
      return Number(((subtotal * Math.min(val, 100)) / 100).toFixed(2));
    }
    return val;
  };

  const renderDepositOverride = () => (
    <View style={[localStyles.section, {
      backgroundColor: colors.inputBg,
      borderColor: colors.orange || '#FF9800',
      borderWidth: 1,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: moderateScale(12) }}>
        <ZText type="B16" color={colors.orange || '#FF9800'}>{strings.depositOverrideSection}</ZText>
        <TouchableOpacity
          onPress={() => setDepositEnabled(!depositEnabled)}
          style={{
            paddingHorizontal: moderateScale(12),
            paddingVertical: moderateScale(6),
            borderRadius: moderateScale(16),
            backgroundColor: depositEnabled ? (colors.orange || '#FF9800') + '20' : colors.grayScale3 || '#E0E0E0',
          }}
          activeOpacity={0.7}
        >
          <ZText type="B12" color={depositEnabled ? (colors.orange || '#FF9800') : colors.grayScale7}>
            {depositEnabled ? strings.depositOverrideLabel : strings.noDepositForOrder}
          </ZText>
        </TouchableOpacity>
      </View>

      {depositEnabled && (
        <>
          {/* Type selector */}
          <View style={{ flexDirection: 'row', marginBottom: moderateScale(12) }}>
            {['percentage', 'fixed'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setDepositOverrideType(type)}
                style={{
                  flex: 1,
                  paddingVertical: moderateScale(10),
                  borderRadius: moderateScale(8),
                  backgroundColor: depositOverrideType === type ? (colors.orange || '#FF9800') : 'transparent',
                  borderWidth: 1,
                  borderColor: depositOverrideType === type ? (colors.orange || '#FF9800') : (colors.bColor || '#DDD'),
                  marginHorizontal: moderateScale(4),
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <ZText type="B14" color={depositOverrideType === type ? '#FFF' : colors.textColor}>
                  {type === 'percentage' ? strings.depositTypePercentage : strings.depositTypeFixed}
                </ZText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Value input */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[
                localStyles.feeInput,
                {
                  flex: 1,
                  backgroundColor: colors.backgroundColor,
                  borderColor: colors.orange || '#FF9800',
                  color: colors.textColor,
                },
              ]}
              value={depositOverrideValue}
              onChangeText={setDepositOverrideValue}
              placeholder={depositOverrideType === 'percentage' ? '50' : '100'}
              placeholderTextColor={colors.grayScale7}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <ZText type="B14" color={colors.grayScale7} style={{ marginStart: moderateScale(8) }}>
              {depositOverrideType === 'percentage' ? '%' : (order?.currency || 'EGP')}
            </ZText>
          </View>

          {/* Calculated amount preview */}
          {depositOverrideType === 'percentage' && (
            <ZText type="M12" color={colors.grayScale7} style={{ marginTop: moderateScale(8) }}>
              {strings.depositOverrideLabel}: {getCalculatedDepositAmount().toFixed(2)} {order?.currency || 'EGP'}
            </ZText>
          )}
        </>
      )}
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
          {order?.orderType === 'catering' ? (parseFloat(quotePrice) || 0).toFixed(2) : (order?.subtotal?.toFixed(2) || '0.00')}
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

          {/* Quote Price Input — only for catering orders */}
          {order?.orderType === 'catering' && (
            <View style={[localStyles.section, {
              backgroundColor: colors.inputBg,
              borderColor: colors.primary,
              borderWidth: 1,
            }]}>
              <ZText type="B16" color={colors.primary} style={localStyles.sectionTitle}>
                {strings.setQuotePrice || 'Set Quote Price'}
              </ZText>
              <ZText type="M12" color={colors.grayScale7} style={{ marginBottom: moderateScale(10) }}>
                {strings.setQuotePriceDesc || 'Enter the total price for this catering order'}
              </ZText>
              <TextInput
                style={[
                  localStyles.feeInput,
                  {
                    backgroundColor: colors.backgroundColor,
                    borderColor: quotePrice ? colors.primary : colors.bColor,
                    color: colors.textColor,
                    fontSize: moderateScale(16),
                    fontWeight: 'bold',
                    fontFamily: 'Urbanist-Bold',
                    textAlign: 'center',
                  },
                ]}
                value={quotePrice}
                onChangeText={setQuotePrice}
                placeholder={strings.enterPrice || 'Enter price'}
                placeholderTextColor={colors.grayScale7}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          )}

          {renderDeliveryFeeInput()}
          {order?.depositRequired && renderDepositOverride()}
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
    fontFamily: 'Urbanist-Medium',
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
