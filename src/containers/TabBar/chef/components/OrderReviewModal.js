import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
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

  useEffect(() => {
    if (visible && order) {
      // Reset form when modal opens
      setDeliveryFee('');
      setEstimatedTime('30');
      setIsProcessing(false);
    }
  }, [visible, order]);

  const handleAcceptOrder = async () => {
    if (!deliveryFee || isNaN(parseFloat(deliveryFee))) {
      Alert.alert(
        'Invalid Delivery Fee',
        strings.pleaseEnterValidDeliveryFee,
      );
      return;
    }

    const fee = parseFloat(deliveryFee);
    if (fee < 0) {
      Alert.alert(strings.invalidDeliveryFee, strings.deliveryFeeCannotBeNegative);
      return;
    }

    Alert.alert(
      strings.acceptOrder,
      strings.acceptOrderWithFee.replace('{fee}', fee.toFixed(2)),
      [
        { text: strings.cancel, style: 'cancel' },
        {
          text: strings.accept,
          onPress: async () => {
            try {
              setIsProcessing(true);

              // Update order status to accepted with delivery fee
              await dispatch(
                updateOrderStatusAsync(order._id, 'confirmed', fee),
              );

              // Call parent callback
              if (onAccept) {
                onAccept(order, fee);
              }

              onClose();
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || strings.failedToAcceptOrder,
                [{ text: 'OK' }],
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectOrder = () => {
    Alert.alert(
      strings.rejectOrder,
      strings.rejectOrderConfirmation,
      [
        { text: strings.cancel, style: 'cancel' },
        {
          text: strings.reject,
          style: 'destructive',
          onPress: async () => {
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
              Alert.alert(
                'Error',
                error.message || strings.failedToRejectOrder,
                [{ text: 'OK' }],
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const calculateTotal = () => {
    const subtotal = order?.subtotal || 0;
    const fee = parseFloat(deliveryFee) || 0;
    return subtotal + fee;
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
              {item.dish?.name || 'Unknown Dish'}
            </ZText>
            <ZText type="M12" color={colors.grayScale7}>
              Quantity: {item.quantity}
            </ZText>
            <ZText type="M12" color={colors.grayScale7}>
              Price: {(item.price || item.dish?.price || 0).toFixed(2)} each
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
        Set Delivery Details
      </ZText>

      <View style={localStyles.rowContainer}>
        <View style={[localStyles.inputWrapper, { marginRight: moderateScale(10) }]}>
          <ZText type="M14" color={colors.textColor} style={localStyles.inputLabel}>
            Delivery Fee ($)
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
            onChangeText={setDeliveryFee}
            placeholder="0.00"
            placeholderTextColor={colors.grayScale7}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View style={localStyles.inputWrapper}>
          <ZText type="M14" color={colors.textColor} style={localStyles.inputLabel}>
            Time (mins)
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
            placeholder="30"
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
          Subtotal:
        </ZText>
        <ZText type="B14" color={colors.textColor}>
          {order?.subtotal?.toFixed(2) || '0.00'}
        </ZText>
      </View>

      <View style={localStyles.pricingRow}>
        <ZText type="M14" color={colors.textColor}>
          Delivery Fee:
        </ZText>
        <ZText type="B14" color={colors.textColor}>
          {parseFloat(deliveryFee || 0).toFixed(2)}
        </ZText>
      </View>

      <View style={[localStyles.pricingRow, localStyles.totalRow]}>
        <ZText type="B16" color={colors.textColor}>
          Total:
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
            title={isProcessing ? 'Processing...' : 'Accept Order'}
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
