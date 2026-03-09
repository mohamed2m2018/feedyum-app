/**
 * ReelOverlay Component
 * Bottom gradient container that orchestrates overlay children
 */

import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { overlayStyles as styles } from './styles';

/**
 * Props for ReelOverlay
 * @typedef {Object} ReelOverlayProps
 * @property {boolean} isVisible - Whether overlay should be visible
 * @property {React.ReactNode} children - Child components to render
 */

const ReelOverlay = React.memo(({ isVisible, children }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <View pointerEvents="box-none" style={styles.container}>
            {/* Gradient for text readability */}
            <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.9)']}
                locations={[0, 0.4, 1]}
                style={styles.gradient}
            />
            {children}
        </View>
    );
});

ReelOverlay.displayName = 'ReelOverlay';

export default ReelOverlay;
