import request from './request';

class UserService {
  async getUserProfile(userId) {
    try {
      const response = await request.get(`/user/${userId}/profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getChefProfile(chefId) {
    try {
      const response = await request.get(`/user/chef/${chefId}/profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const response = await request.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async searchUsers(query) {
    try {
      const response = await request.get(`/user/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await request.get(`/user/all`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getChefMenu(chefId) {
    try {
      const response = await request.get(`/menus/chef/${chefId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();