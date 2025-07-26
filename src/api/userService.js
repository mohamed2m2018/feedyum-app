import { API_BASE_URL } from '../config/constants';

class UserService {
  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:4800/api';
  }

  async getUserProfile(userId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}/profile`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('User profile fetch error:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async getChefProfile(chefId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/user/chef/${chefId}/profile`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chef profile fetch error:', error);
      throw new Error('Failed to fetch chef profile');
    }
  }

  async getUserById(userId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('User fetch error:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async searchUsers(query, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/user/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('User search error:', error);
      throw new Error('Failed to search users');
    }
  }

  async getAllUsers(userToken) {
    try {
      const response = await fetch(`${this.baseURL}/user/all`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getChefMenu(chefId, userToken) {
    try {
      const response = await fetch(`${this.baseURL}/menus/chef/${chefId}`, {
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chef menu fetch error:', error);
      throw new Error('Failed to fetch chef menu');
    }
  }
}

export default new UserService();