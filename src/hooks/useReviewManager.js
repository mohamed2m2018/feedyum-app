import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { reviewStorage } from '../utils/reviewStorage';
import { reviewService } from '../api/reviewService';
import strings from '../i18n/strings';

export const useReviewManager = () => {
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentOrderForReview, setCurrentOrderForReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Check for completed orders that need review prompts
  const checkForReviewPrompts = useCallback(async () => {
    try {
      const completedOrders = await reviewStorage.getOrdersNeedingReview();
      
      for (const order of completedOrders) {
        const shouldShow = await reviewStorage.shouldShowReviewPrompt(order.orderId);
        
        if (shouldShow) {
          // Check if order was completed recently (within last 7 days)
          const completedDate = new Date(order.completedAt);
          const daysSinceCompletion = (new Date() - completedDate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceCompletion <= 7) {
            setCurrentOrderForReview(order);
            setShowReviewPrompt(true);
            break; // Show one at a time
          }
        }
      }
    } catch (error) {
      console.error('Error checking for review prompts:', error);
    }
  }, []);

  // Handle when user completes an order
  const handleOrderCompleted = useCallback(async (orderData) => {
    try {
      await reviewStorage.addCompletedOrder(orderData);
      
      // Show review prompt after a short delay
      setTimeout(() => {
        checkForReviewPrompts();
      }, 2000);
    } catch (error) {
      console.error('Error handling completed order:', error);
    }
  }, [checkForReviewPrompts]);

  // Handle review prompt actions
  const handleReviewNow = useCallback(async () => {
    if (currentOrderForReview) {
      setShowReviewPrompt(false);
      
      try {
        // Get order review status from backend
        const response = await reviewService.getOrderReviewStatus(currentOrderForReview.orderId);
        
        if (response.success && response.data.canReview) {
          setCurrentOrderForReview({
            ...currentOrderForReview,
            ...response.data,
          });
          setShowReviewModal(true);
        } else {
          Alert.alert(strings.unableToReview, response.message || strings.cannotReviewAtThisTime);
        }
      } catch (error) {
        console.error('Error getting order review status:', error);
        Alert.alert(strings.error, strings.unableToLoadReviewInfo);
      }
      
      // Increment prompt count
      await reviewStorage.incrementReviewPromptCount(currentOrderForReview.orderId);
    }
  }, [currentOrderForReview]);

  const handleRemindLater = useCallback(async () => {
    if (currentOrderForReview) {
      setShowReviewPrompt(false);
      
      // Increment prompt count
      await reviewStorage.incrementReviewPromptCount(currentOrderForReview.orderId);
      
      // Schedule reminder for later (this could be enhanced with push notifications)
      setTimeout(() => {
        checkForReviewPrompts();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  }, [currentOrderForReview, checkForReviewPrompts]);

  const handleSkipReview = useCallback(async () => {
    if (currentOrderForReview) {
      setShowReviewPrompt(false);
      
      // Mark as reviewed to prevent further prompts
      await reviewStorage.markOrderAsReviewed(currentOrderForReview.orderId);
      await reviewStorage.removeCompletedOrder(currentOrderForReview.orderId);
      
      setCurrentOrderForReview(null);
    }
  }, [currentOrderForReview]);

  // Handle review submission
  const handleSubmitReviews = useCallback(async (reviews) => {
    if (!currentOrderForReview) return;

    setReviewLoading(true);
    
    try {
      // Add chef and order IDs to reviews
      const reviewsWithIds = reviews.map(review => ({
        ...review,
        chefId: currentOrderForReview.chef?.id,
        orderId: currentOrderForReview.orderId,
      }));

      const result = await reviewService.submitOrderReviews(
        currentOrderForReview.orderId,
        reviewsWithIds
      );

      if (result.success) {
        Alert.alert(
          strings.thankYou,
          strings.reviewsSubmittedSuccessfully,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowReviewModal(false);
                setCurrentOrderForReview(null);
              },
            },
          ]
        );

        // Mark order as reviewed
        await reviewStorage.markOrderAsReviewed(currentOrderForReview.orderId);
        await reviewStorage.removeCompletedOrder(currentOrderForReview.orderId);
      } else {
        Alert.alert(strings.submissionError, result.message || strings.someReviewsCouldNotBeSubmitted);
      }
    } catch (error) {
      console.error('Error submitting reviews:', error);
      Alert.alert(strings.error, strings.failedToSubmitReviews);
    } finally {
      setReviewLoading(false);
    }
  }, [currentOrderForReview]);

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
    setCurrentOrderForReview(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkForReviewPrompts();
  }, [checkForReviewPrompts]);

  return {
    showReviewPrompt,
    showReviewModal,
    currentOrderForReview,
    reviewLoading,
    handleOrderCompleted,
    handleReviewNow,
    handleRemindLater,
    handleSkipReview,
    handleSubmitReviews,
    closeReviewModal,
    checkForReviewPrompts,
  };
};

export default useReviewManager;
