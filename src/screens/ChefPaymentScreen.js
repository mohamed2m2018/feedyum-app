import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import chefWalletService from '../api/chefWalletService';

const ChefPaymentScreen = ({ navigation, userToken, route }) => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Check if this screen was opened due to payment requirement
  const paymentRequired = route?.params?.paymentRequired || false;

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      setIsLoading(true);
      const data = await chefWalletService.getWalletInfo(null, userToken);
      setWalletInfo(data);
      
      // If payment is required, show the payment modal immediately
      if (data.summary?.isPaymentRequired) {
        setPaymentAmount(data.summary.paymentDueAmount.toString());
        setShowPaymentModal(true);
      }
    } catch (error) {
Alert.alert('Error', 'Failed to load wallet information');
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    // Basic card validation (in a real app, use a proper payment processor)
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Error', 'Please enter expiry date in MM/YY format');
      return;
    }

    if (!cvv || cvv.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // In a real app, you would integrate with Stripe, PayPal, etc.
      // For now, we'll simulate a successful payment
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await chefWalletService.processPayment(
        parseFloat(paymentAmount),
        'card',
        transactionId,
        userToken
      );

      if (result.success) {
        Alert.alert(
          'Payment Successful!',
          'Your payment has been processed successfully. You can now continue receiving orders.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPaymentModal(false);
                if (paymentRequired) {
                  // If payment was required, navigate back to previous screen
                  navigation.goBack();
                } else {
                  // Refresh wallet info
                  fetchWalletInfo();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.message || 'Payment could not be processed');
      }
    } catch (error) {
Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatCurrency = (amount) => `£${Math.abs(amount).toFixed(2)}`;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payment information...</Text>
      </View>
    );
  }

  if (!walletInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load payment information</Text>
        <TouchableOpacity onPress={fetchWalletInfo} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary } = walletInfo;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment Required</Text>
        <Text style={styles.subtitle}>
          Your service fee balance has exceeded £2,000
        </Text>
      </View>

      {/* Balance Info */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          -{formatCurrency(summary.currentBalance)}
        </Text>
        <Text style={styles.balanceDescription}>
          This represents accumulated service fees from your orders
        </Text>
      </View>

      {/* Payment Due */}
      <View style={styles.paymentDueCard}>
        <Text style={styles.paymentDueLabel}>Amount Due</Text>
        <Text style={styles.paymentDueAmount}>
          {formatCurrency(summary.paymentDueAmount)}
        </Text>
        <Text style={styles.paymentDueDescription}>
          Pay this amount to continue receiving orders
        </Text>
      </View>

      {/* Warning Message */}
      <View style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          You cannot receive new orders until this payment is made. 
          Existing orders can still be completed.
        </Text>
      </View>

      {/* Pay Now Button */}
      <TouchableOpacity
        style={styles.payNowButton}
        onPress={() => {
          setPaymentAmount(summary.paymentDueAmount.toString());
          setShowPaymentModal(true);
        }}
      >
        <Text style={styles.payNowButtonText}>
          Pay Now • {formatCurrency(summary.paymentDueAmount)}
        </Text>
      </TouchableOpacity>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !summary.isPaymentRequired && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            
            <View style={styles.paymentForm}>
              <Text style={styles.inputLabel}>Payment Amount (£)</Text>
              <TextInput
                style={styles.input}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                placeholder="0.00"
              />

              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />

              <View style={styles.cardDetailsRow}>
                <View style={styles.cardDetailHalf}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </View>
                <View style={styles.cardDetailHalf}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    placeholder="123"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.processPaymentButton}
                onPress={processPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.processPaymentButtonText}>
                    Process Payment
                  </Text>
                )}
              </TouchableOpacity>
              
              {!summary.isPaymentRequired && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  paymentDueCard: {
    backgroundColor: '#FFF3CD',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  paymentDueLabel: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 8,
  },
  paymentDueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  paymentDueDescription: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#F8D7DA',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#721C24',
    lineHeight: 20,
  },
  payNowButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  paymentForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetailHalf: {
    flex: 0.48,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  processPaymentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  processPaymentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChefPaymentScreen;