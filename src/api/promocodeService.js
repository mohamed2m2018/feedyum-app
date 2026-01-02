import { API_BASE_URL } from '../config/constants';

class PromoCodeService {
  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:4800/api';
  }

  async validatePromoCode(code, orderAmount, chefId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/promocode/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          code,
          orderAmount,
          chefId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
throw new Error('Failed to validate promo code');
    }
  }

  async createPromoCode(promocodeData, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/promocode/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(promocodeData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
throw new Error('Failed to create promo code');
    }
  }
}

export default new PromoCodeService();