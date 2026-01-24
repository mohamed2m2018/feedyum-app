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

    // Only show for reviews
    if (!isReview) {
        return null;
    }

    const hasRating = rating && rating > 0;

    return (
        <View style={styles.infoContainer}>
            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={hasRating ? (star <= rating ? 'star' : 'star-outline') : 'star-outline'}
                        size={moderateScale(12)}
                        color={hasRating ? (star <= rating ? '#FFD700' : 'rgba(255, 255, 255, 0.5)') : 'rgba(255, 255, 255, 0.8)'}
                        style={[styles.starIcon, { opacity: hasRating ? 1 : 0.8 }]}
                    />
                ))}
                <ZText type="B14" color={colors.white} style={{ marginLeft: 4, fontWeight: '800' }}>
                    {rating || 0}/5
                </ZText>
            </View>
        </View>
    );
});

ReelReviewRating.displayName = 'ReelReviewRating';

export default ReelReviewRating;
