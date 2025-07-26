import request from './request';

export const reviewService = {
  // Add a new review
  async addReview(reviewData) {
    try {
      const response = await request.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get reviews with filtering and pagination
  async getReviews(params = {}) {
    try {
      const response = await request.get('/reviews', {params});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get review statistics
  async getReviewStats(params = {}) {
    try {
      const response = await request.get('/reviews/stats', {params});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get order review status
  async getOrderReviewStatus(orderId) {
    try {
      const response = await request.get(`/reviews/order/${orderId}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a review
  async updateReview(reviewId, updateData) {
    try {
      const response = await request.put(`/reviews/${reviewId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await request.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark review as helpful
  async markHelpful(reviewId) {
    try {
      const response = await request.post(`/reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Report a review
  async reportReview(reviewId, reason) {
    try {
      const response = await request.post(`/reviews/${reviewId}/report`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get chef reviews
  async getChefReviews(chefId, params = {}) {
    try {
      const response = await request.get('/reviews', {
        params: {chefId, ...params},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get dish reviews
  async getDishReviews(dishId, params = {}) {
    try {
      const response = await request.get('/reviews', {
        params: {dishId, ...params},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get chef review statistics
  async getChefReviewStats(chefId) {
    try {
      const response = await request.get('/reviews/stats', {
        params: {chefId},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get dish review statistics
  async getDishReviewStats(dishId) {
    try {
      const response = await request.get('/reviews/stats', {
        params: {dishId},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Submit multiple reviews for an order
  async submitOrderReviews(orderId, reviews) {
    try {
      const promises = reviews.map(review =>
        this.addReview({
          orderId,
          chefId: review.chefId,
          dishId: review.dishId,
          type: review.type,
          rating: review.rating,
          comment: review.comment || '',
          tags: review.tags || [],
          images: review.images || [],
        }),
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter(
        result => result.status === 'fulfilled',
      );
      const failed = results.filter(result => result.status === 'rejected');

      return {
        success: failed.length === 0,
        successful: successful.length,
        failed: failed.length,
        results: results,
        message:
          failed.length === 0
            ? 'All reviews submitted successfully'
            : `${successful.length} reviews submitted, ${failed.length} failed`,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default reviewService;
