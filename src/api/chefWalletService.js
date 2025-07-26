import { API_BASE_URL } from '../config/constants';

class ChefWalletService {
  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:4800/api';
  }

  async getWalletInfo(chefId, userToken) {
    try {
      const url = chefId 
        ? `${this.baseURL}/chef-wallet/info/${chefId}`
        : `${this.baseURL}/chef-wallet/info`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Wallet info fetch error:', error);
      throw new Error('Failed to fetch wallet information');
    }
  }

  async checkPaymentRequired(userToken) {
    try {
      const response = await fetch(`${this.baseURL}/chef-wallet/payment-required`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment check error:', error);
      throw new Error('Failed to check payment status');
    }
  }

  async processPayment(amount, paymentMethod, transactionId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/chef-wallet/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          transactionId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Failed to process payment');
    }
  }
}

export default new ChefWalletService();