import request from './request';

class PromoCodeService {
  async validatePromoCode(code, orderAmount, chefId) {
    try {
      const response = await request.post('/promocode/validate', {
        code,
        orderAmount,
        chefId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createPromoCode(promocodeData) {
    try {
      const response = await request.post('/promocode/create', promocodeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new PromoCodeService();