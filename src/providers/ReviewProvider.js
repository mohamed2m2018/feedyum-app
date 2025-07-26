import React, { createContext, useContext } from 'react';
import { useReviewManager } from '../hooks/useReviewManager';
import ReviewPrompt from '../components/ReviewPrompt';
import ReviewModal from '../components/ReviewModal';

const ReviewContext = createContext();

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

export const ReviewProvider = ({ children }) => {
  const reviewManager = useReviewManager();

  const contextValue = {
    ...reviewManager,
  };

  return (
    <ReviewContext.Provider value={contextValue}>
      {children}
      
      {/* Review Prompt Modal */}
      <ReviewPrompt
        visible={reviewManager.showReviewPrompt}
        onClose={reviewManager.handleSkipReview}
        onReviewNow={reviewManager.handleReviewNow}
        onRemindLater={reviewManager.handleRemindLater}
        orderData={reviewManager.currentOrderForReview}
      />

      {/* Review Submission Modal */}
      <ReviewModal
        visible={reviewManager.showReviewModal}
        onClose={reviewManager.closeReviewModal}
        orderData={reviewManager.currentOrderForReview}
        onSubmitReview={reviewManager.handleSubmitReviews}
        loading={reviewManager.reviewLoading}
      />
    </ReviewContext.Provider>
  );
};

export default ReviewProvider;
