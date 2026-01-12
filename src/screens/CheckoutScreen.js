import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import strings from '../i18n/strings';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartChef,
  selectCartPromocode,
  applyPromocode,
  removePromocode,
  clearCart,
} from '../redux/reducer/cartSlice';
import PromoCodeInput from '../components/PromoCodeInput';

const CheckoutScreen = ({ navigation, userToken }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const chef = useSelector(selectCartChef);
  const appliedPromocode = useSelector(selectCartPromocode);

  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Calculate totals
  const serviceFee = subtotal * 0.05; // 5% service fee
  const tax = subtotal * 0.1; // 10% tax
  const discountAmount = appliedPromocode ? appliedPromocode.discountAmount : 0;
  const totalBeforeDelivery = subtotal + serviceFee + tax - discountAmount;

  useEffect(() => {
    // Load saved delivery address or prompt user to select one
    loadDeliveryAddress();
  }, []);

  const loadDeliveryAddress = async () => {
    // Implementation to load user's saved addresses
    // For now, we'll use a placeholder
    setDeliveryAddress({
      nameLine: '123 Main Street, City, Postcode',
      location: { lat: '51.5074', long: '-0.1278' }
    });
  };

  const handlePromoCodeApplied = (promocodeData) => {
    dispatch(applyPromocode(promocodeData));
  };

  const handleRemovePromoCode = () => {
    dispatch(removePromocode());
  };

  const processCheckout = async () => {
    if (!deliveryAddress) {
      Alert.alert(strings.error, strings.selectDeliveryAddress);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(strings.error, strings.cartEmpty);
      return;
    }

    setIsProcessingOrder(true);

    try {
      const checkoutData = {
        deliveryAddress,
        specialInstructions,
        promocode: appliedPromocode ? {
          code: appliedPromocode.code,
          discountAmount: appliedPromocode.discountAmount,
          discountType: appliedPromocode.discountType,
        } : null,
      };

      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (data.order) {
        dispatch(clearCart());
        Alert.alert(
          strings.orderPlacedExclamation,
          strings.orderPlacedSuccessMessage,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OrderTracking', { orderId: data.order._id })
            }
          ]
        );
      } else {
        Alert.alert(strings.error, data.message || strings.failedToPlaceOrder);
      }
    } catch (error) {
      Alert.alert(strings.error, strings.failedToProcessOrder);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const formatCurrency = (amount) => `£${amount.toFixed(2)}`;

  return (
    <ScrollView style={styles.container}>
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.orderSummary}</Text>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.dish.name}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.dish.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Chef Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.kitchen}</Text>
        <Text style={styles.chefName}>{chef.name}</Text>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.deliveryAddress}</Text>
        <Text style={styles.addressText}>
          {deliveryAddress?.nameLine || strings.noAddressSelected}
        </Text>
        <TouchableOpacity style={styles.changeAddressButton}>
          <Text style={styles.changeAddressText}>{strings.changeAddress}</Text>
        </TouchableOpacity>
      </View>

      {/* Promo Code */}
      <PromoCodeInput
        onPromoCodeApplied={handlePromoCodeApplied}
        orderAmount={subtotal}
        chefId={chef.id}
        appliedPromoCode={appliedPromocode}
        onRemovePromoCode={handleRemovePromoCode}
      />

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.priceBreakdown}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{strings.subtotal}</Text>
          <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{strings.serviceFeePercentage}</Text>
          <Text style={styles.priceValue}>{formatCurrency(serviceFee)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{strings.taxPercentage}</Text>
          <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
        </View>

        {appliedPromocode && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, styles.discountLabel]}>
              {strings.discount} ({appliedPromocode.code})
            </Text>
            <Text style={[styles.priceValue, styles.discountValue]}>
              -{formatCurrency(discountAmount)}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{strings.deliveryFee}</Text>
          <Text style={styles.priceValue}>{strings.tbd}</Text>
        </View>

        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{strings.totalBeforeDelivery}</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBeforeDelivery)}</Text>
        </View>
      </View>

      {/* Special Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.specialInstructionsOptional}</Text>
        <TextInput
          style={styles.instructionsInput}
          placeholder={strings.anySpecialRequests}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        style={[styles.placeOrderButton, isProcessingOrder && styles.disabledButton]}
        onPress={processCheckout}
        disabled={isProcessingOrder}
      >
        {isProcessingOrder ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.placeOrderButtonText}>
            {strings.placeOrder} • {formatCurrency(totalBeforeDelivery)} + {strings.delivery}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chefName: {
    fontSize: 16,
    color: '#333',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  changeAddressButton: {
    alignSelf: 'flex-start',
  },
  changeAddressText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
  },
  discountLabel: {
    color: '#4CAF50',
  },
  discountValue: {
    color: '#4CAF50',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CheckoutScreen;