import request from './request';

class PaymobService {
    async createPaymentIntention(amount) {
        try {
            const response = await request.post('/paymob/create-intention', { amount });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async verifyPayment(transactionId) {
        try {
            const response = await request.get(`/paymob/verify/${transactionId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new PaymobService();
