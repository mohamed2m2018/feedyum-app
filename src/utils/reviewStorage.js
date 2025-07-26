import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STORAGE_KEY = 'review_prompts';
const MAX_REVIEW_PROMPTS = 2;

export const reviewStorage = {
  // Get review prompt count for a specific order
  async getReviewPromptCount(orderId) {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      const reviewPrompts = data ? JSON.parse(data) : {};
      return reviewPrompts[orderId] || 0;
    } catch (error) {
      console.error('Error getting review prompt count:', error);
      return 0;
    }
  },

  // Increment review prompt count for a specific order
  async incrementReviewPromptCount(orderId) {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      const reviewPrompts = data ? JSON.parse(data) : {};
      
      reviewPrompts[orderId] = (reviewPrompts[orderId] || 0) + 1;
      
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewPrompts));
      return reviewPrompts[orderId];
    } catch (error) {
      console.error('Error incrementing review prompt count:', error);
      return 0;
    }
  },

  // Check if we should show review prompt for an order
  async shouldShowReviewPrompt(orderId) {
    try {
      const count = await this.getReviewPromptCount(orderId);
      return count < MAX_REVIEW_PROMPTS;
    } catch (error) {
      console.error('Error checking review prompt eligibility:', error);
      return false;
    }
  },

  // Mark order as reviewed (no more prompts)
  async markOrderAsReviewed(orderId) {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      const reviewPrompts = data ? JSON.parse(data) : {};
      
      reviewPrompts[orderId] = MAX_REVIEW_PROMPTS; // Set to max to prevent further prompts
      
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewPrompts));
    } catch (error) {
      console.error('Error marking order as reviewed:', error);
    }
  },

  // Get all completed orders that need review prompts
  async getOrdersNeedingReview() {
    try {
      const data = await AsyncStorage.getItem('completed_orders');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting orders needing review:', error);
      return [];
    }
  },

  // Add completed order to review queue
  async addCompletedOrder(orderData) {
    try {
      const orders = await this.getOrdersNeedingReview();
      
      // Check if order already exists
      const existingIndex = orders.findIndex(order => order.orderId === orderData.orderId);
      
      if (existingIndex === -1) {
        orders.push({
          ...orderData,
          completedAt: new Date().toISOString(),
        });
        
        await AsyncStorage.setItem('completed_orders', JSON.stringify(orders));
      }
    } catch (error) {
      console.error('Error adding completed order:', error);
    }
  },

  // Remove order from review queue
  async removeCompletedOrder(orderId) {
    try {
      const orders = await this.getOrdersNeedingReview();
      const filteredOrders = orders.filter(order => order.orderId !== orderId);
      
      await AsyncStorage.setItem('completed_orders', JSON.stringify(filteredOrders));
    } catch (error) {
      console.error('Error removing completed order:', error);
    }
  },

  // Clear all review data (for testing/debugging)
  async clearAllReviewData() {
    try {
      await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
      await AsyncStorage.removeItem('completed_orders');
    } catch (error) {
      console.error('Error clearing review data:', error);
    }
  },

  // Get review statistics
  async getReviewStats() {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      const reviewPrompts = data ? JSON.parse(data) : {};
      
      const totalOrders = Object.keys(reviewPrompts).length;
      const reviewedOrders = Object.values(reviewPrompts).filter(count => count >= MAX_REVIEW_PROMPTS).length;
      const pendingOrders = totalOrders - reviewedOrders;
      
      return {
        totalOrders,
        reviewedOrders,
        pendingOrders,
        reviewRate: totalOrders > 0 ? (reviewedOrders / totalOrders) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      return {
        totalOrders: 0,
        reviewedOrders: 0,
        pendingOrders: 0,
        reviewRate: 0,
      };
    }
  },
};

export default reviewStorage;
