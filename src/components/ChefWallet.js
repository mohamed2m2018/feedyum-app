import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';

const ChefWallet = ({ chefId, userToken }) => {
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchWalletInfo();
    checkPaymentRequired();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      const response = await fetch(`/api/chef-wallet/info/${chefId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setWalletData(data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentRequired = async () => {
    try {
      const response = await fetch('/api/chef-wallet/payment-required', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });
      
      const data = await response.json();
      if (data.success && data.paymentRequired) {
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  };

  const processPayment = async (amount) => {
    setIsProcessingPayment(true);
    
    try {
      // In a real app, you would integrate with a payment processor here
      // For now, we'll simulate a successful payment
      const response = await fetch('/api/chef-wallet/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          amount: amount,
          paymentMethod: 'card',
          transactionId: `txn_${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Payment Successful', 'Your payment has been processed successfully!');
        setShowPaymentModal(false);
        fetchWalletInfo(); // Refresh wallet data
      } else {
        Alert.alert('Payment Failed', data.message || 'Payment could not be processed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatCurrency = (amount) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 'service_fee':
        return 'Service Fee';
      case 'payment_to_platform':
        return 'Payment';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (!walletData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load wallet information</Text>
        <TouchableOpacity onPress={fetchWalletInfo} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { wallet, summary } = walletData;

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[
          styles.balanceAmount,
          summary.currentBalance < 0 ? styles.negativeBalance : styles.positiveBalance
        ]}>
          {summary.currentBalance < 0 ? '-' : ''}
          {formatCurrency(summary.currentBalance)}
        </Text>
        
        {summary.isPaymentRequired && (
          <View style={styles.paymentWarning}>
            <Text style={styles.warningText}>
              ⚠️ Payment Required: {formatCurrency(summary.paymentDueAmount)}
            </Text>
            <TouchableOpacity 
              style={styles.payNowButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Service Fees:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalServiceFees)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Payments:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPayments)}</Text>
        </View>
        {summary.lastPaymentDate && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last Payment:</Text>
            <Text style={styles.summaryValue}>
              {new Date(summary.lastPaymentDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsCard}>
        <Text style={styles.cardTitle}>Recent Transactions</Text>
        {wallet.transactions && wallet.transactions.length > 0 ? (
          wallet.transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionRow}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {formatTransactionType(transaction.type)}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.timestamp).toLocaleDateString()}
                </Text>
                {transaction.description && (
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.transactionAmount,
                transaction.amount < 0 ? styles.negativeAmount : styles.positiveAmount
              ]}>
                {transaction.amount < 0 ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        )}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !summary.isPaymentRequired && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Required</Text>
            <Text style={styles.modalMessage}>
              Your service fee balance has exceeded £2,000. Please make a payment to continue receiving orders.
            </Text>
            
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentLabel}>Amount Due:</Text>
              <Text style={styles.paymentAmount}>
                {formatCurrency(summary.paymentDueAmount)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => processPayment(summary.paymentDueAmount)}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
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
    </ScrollView>
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
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  positiveBalance: {
    color: '#4CAF50',
  },
  negativeBalance: {
    color: '#F44336',
  },
  paymentWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    alignItems: 'center',
    width: '100%',
  },
  warningText: {
    color: '#856404',
    fontWeight: '600',
    marginBottom: 8,
  },
  payNowButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payNowButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#F44336',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
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
    marginBottom: 16,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  paymentDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  payButtonText: {
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

export default ChefWallet;