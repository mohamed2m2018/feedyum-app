import request from './request';

export const missionService = {
  async getMissions(params = {}) {
    try {
      const response = await request.get('/missions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMissionById(id) {
    try {
      const response = await request.get(`/missions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async acceptMission(id) {
    try {
      const response = await request.post(`/missions/${id}/accept`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async submitContent(id, data) {
    try {
      const response = await request.post(`/missions/${id}/submit`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async withdrawFromMission(id) {
    try {
      const response = await request.put(`/missions/${id}/withdraw`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMyMissions(params = {}) {
    try {
      const response = await request.get('/missions/my', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMissionProgress(id) {
    try {
      const response = await request.get(`/missions/${id}/my-progress`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getLeaderboard(id, params = {}) {
    try {
      const response = await request.get(`/missions/${id}/leaderboard`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async claimRestaurant(profileId, data = {}) {
    try {
      const response = await request.post(`/missions/claim-restaurant/${profileId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async trackAttribution(data) {
    try {
      const response = await request.post('/missions/track-attribution', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search places for scouting
  async searchPlaces(query, missionId) {
    try {
      const response = await request.get('/missions/search-places', {
        params: { query, missionId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getScoutedRestaurant(id) {
    const response = await request.get(`/missions/scouted-restaurants/${id}`);
    return response.data;
  },

  async createClaimEvidenceUpload(data) {
    const response = await request.post('/missions/claims/evidence-upload-url', data);
    return response.data;
  },

  async submitRestaurantClaim(restaurantId, data) {
    const response = await request.post(`/missions/scouted-restaurants/${restaurantId}/claims`, data);
    return response.data;
  },

  async getMyRestaurantClaims() {
    const response = await request.get('/missions/claims/my');
    return response.data;
  },

  // Ambassador Wallet
  async getWalletInfo() {
    try {
      const response = await request.get('/ambassador-wallet/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getEarningsHistory(params = {}) {
    try {
      const response = await request.get('/ambassador-wallet/earnings', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      const response = await request.get('/ambassador-wallet/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async transferToWallet(amount) {
    try {
      const idempotencyKey = `wallet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await request.post('/ambassador-wallet/transfer-to-wallet', { amount, idempotencyKey });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default missionService;
