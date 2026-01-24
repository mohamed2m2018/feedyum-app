/**
 * ReelPauseIndicator Component
 * Play/pause triangle overlay when video is paused
 */

import React from 'react';
import { View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import { moderateScale } from '../../common/constants';
import { styles } from '../../themes';
import { pauseIndicatorStyles } from './styles';

/**
 * Props for ReelPauseIndicator
 * @typedef {Object} ReelPauseIndicatorProps
 * @property {boolean} isPaused - Whether video is paused
 * @property {boolean} isSeeking - Whether user is seeking
 * @property {boolean} hasVideo - Whether item has video
 */

const ReelPauseIndicator = React.memo(({ isPaused, isSeeking, hasVideo }) => {
    // Only show when paused (not while seeking) and has video
    if (!isPaused || isSeeking || !hasVideo) {
        return null;
    }

    return (
        <View style={[pauseIndicatorStyles.container, styles.p15]}>
            <Entypo
                name="triangle-right"
                size={moderateScale(60)}
                color="white"
            />
        </View>
    );
});

ReelPauseIndicator.displayName = 'ReelPauseIndicator';

export default ReelPauseIndicator;
