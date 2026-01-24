/**
 * ReelLikeAnimation Component
 * Heart animation on double-tap like
 */

import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../common/constants';
import { styles } from '../../themes';
import { likeAnimationStyles } from './styles';

/**
 * Props for ReelLikeAnimation
 * @typedef {Object} ReelLikeAnimationProps
 * @property {boolean} isVisible - Whether animation is visible
 */

const ReelLikeAnimation = React.memo(({ isVisible }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <View style={[likeAnimationStyles.container, styles.p15]}>
            <Ionicons
                name="heart"
                size={moderateScale(120)}
                color="red"
            />
        </View>
    );
});

ReelLikeAnimation.displayName = 'ReelLikeAnimation';

export default ReelLikeAnimation;
