/**
 * ReelReviewBadge Component
 * "REVIEW" badge displayed at top corner for review reels
 */

import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../common/ZText';
import { moderateScale } from '../../common/constants';
import { reviewBadgeStyles as styles } from './styles';

/**
 * Props for ReelReviewBadge
 * @typedef {Object} ReelReviewBadgeProps
 * @property {boolean} isReview - Whether this is a review reel
 */

const ReelReviewBadge = React.memo(({ isReview }) => {
    if (!isReview) {
        return null;
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Ionicons name="star" size={moderateScale(10)} color="#FFFFFF" />
                <ZText type="B10" color="#FFFFFF" style={styles.text}>
                    REVIEW
                </ZText>
            </LinearGradient>
        </View>
    );
});

ReelReviewBadge.displayName = 'ReelReviewBadge';

export default ReelReviewBadge;
