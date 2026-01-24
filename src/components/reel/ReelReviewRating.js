/**
 * ReelReviewRating Component
 * Star rating display for review reels
 */

import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import ZText from '../common/ZText';
import { moderateScale } from '../../common/constants';
import { reviewStyles as styles } from './styles';

/**
 * Props for ReelReviewRating
 * @typedef {Object} ReelReviewRatingProps
 * @property {number} rating - Rating value (1-5)
 * @property {boolean} isReview - Whether this is a review reel
 */

const ReelReviewRating = React.memo(({ rating, isReview }) => {
    const colors = useSelector((state) => state.theme.theme);

    // Only show for reviews that have a valid rating
    const hasRating = rating && rating > 0;

    // Don't render anything if not a review OR if no rating was provided
    if (!isReview || !hasRating) {
        return null;
    }

    return (
        <View style={styles.infoContainer}>
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={moderateScale(12)}
                        color={star <= rating ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
                        style={styles.starIcon}
                    />
                ))}
                <ZText type="B14" color={colors.white} style={{ marginLeft: 4, fontWeight: '800' }}>
                    {rating}/5
                </ZText>
            </View>
        </View>
    );
});

ReelReviewRating.displayName = 'ReelReviewRating';

export default ReelReviewRating;
