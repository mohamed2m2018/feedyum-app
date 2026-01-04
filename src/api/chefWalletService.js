import request from './request';

class ChefWalletService {
  async getWalletInfo(chefId) {
    try {
      const url = chefId ? `/chef-wallet/info/${chefId}` : '/chef-wallet/info';
      const response = await request.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async checkPaymentRequired() {
    try {
      const response = await request.get('/chef-wallet/payment-required');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async processPayment(amount, paymentMethod, transactionId) {
    try {
      const response = await request.post('/chef-wallet/payment', {
        amount,
        paymentMethod,
        transactionId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ChefWalletService();