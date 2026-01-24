/**
 * ReelCaption Component
 * Title, description with see more/less, and duration display
 */

import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ZText from '../common/ZText';
import { styles } from '../../themes';
import strings from '../../i18n/strings';
import { captionStyles } from './styles';

/**
 * Props for ReelCaption
 * @typedef {Object} ReelCaptionProps
 * @property {string} title - Post title
 * @property {string} caption - Post description/caption
 * @property {string} duration - Delivery duration (e.g., "30 minutes")
 */

const ReelCaption = React.memo(({ title, caption, duration }) => {
    const colors = useSelector((state) => state.theme.theme);
    const [isExpanded, setIsExpanded] = useState(false);

    const shouldTruncate = caption?.length > 50;

    const toggleExpand = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    // Parse duration
    const durationParts = duration?.split(' ');
    const hasDuration = durationParts?.[0] && durationParts[0] !== 'undefined';

    return (
        <View>
            {/* Duration */}
            {hasDuration && (
                <ZText style={captionStyles.duration}>
                    ⏰ Receivable in {durationParts[0]} {durationParts[1]?.toLowerCase()}
                </ZText>
            )}

            {/* Title */}
            <ZText
                style={captionStyles.title}
                align="left"
                type="b12"
                color={colors.white}
            >
                {title}
            </ZText>

            {/* Caption */}
            <ZText type="m13" color={colors.white} style={styles.mv10}>
                {shouldTruncate && !isExpanded
                    ? caption?.slice(0, 50) + '...'
                    : caption}
            </ZText>

            {/* See More/Less Button */}
            {shouldTruncate && (
                <TouchableOpacity onPress={toggleExpand} style={captionStyles.seeMoreButton}>
                    <ZText type="m14" color={colors.primary}>
                        {isExpanded ? strings.seeLessDescription : strings.seeMoreDescription}
                    </ZText>
                </TouchableOpacity>
            )}
        </View>
    );
});

ReelCaption.displayName = 'ReelCaption';

export default ReelCaption;
