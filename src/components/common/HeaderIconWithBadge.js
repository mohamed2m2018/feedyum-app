import React, { useRef, useEffect, memo } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from './ZText';
import { moderateScale } from '../../common/constants';

/**
 * HeaderIconWithBadge - Icon with animated notification badge
 * Features:
 * - Shows exact count (caps at 99+)
 * - Animated scale-in when count changes
 * - Premium styling with theme support
 */
const HeaderIconWithBadge = ({
    name,
    size = 26,
    count = 0,
    onPress,
    style,
    color,
}) => {
    const colors = useSelector(state => state.theme.theme);
    const scaleAnim = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;
    const prevCountRef = useRef(count);

    // Animate badge when count changes
    useEffect(() => {
        const prevCount = prevCountRef.current;

        if (count > 0 && prevCount === 0) {
            // Badge appearing
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 200,
                useNativeDriver: true,
            }).start();
        } else if (count === 0 && prevCount > 0) {
            // Badge disappearing
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        } else if (count > prevCount && prevCount > 0) {
            // Count increased - bounce animation
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1.3,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(bounceAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        prevCountRef.current = count;
    }, [count, scaleAnim, bounceAnim]);

    const displayCount = count > 99 ? '99+' : count.toString();
    const iconColor = color || (colors.dark ? colors.white : colors.darkColor);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[localStyles.container, style]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <View style={localStyles.iconWrapper}>
                <Ionicons
                    name={name}
                    size={moderateScale(size)}
                    color={iconColor}
                />

                {/* Badge */}
                {count > 0 && (
                    <Animated.View
                        style={[
                            localStyles.badge,
                            {
                                backgroundColor: colors.primary,
                                transform: [
                                    { scale: Animated.multiply(scaleAnim, bounceAnim) },
                                ],
                                // Adjust position for 3-digit numbers
                                minWidth: count > 99 ? moderateScale(26) : moderateScale(18),
                            },
                        ]}
                    >
                        <ZText
                            type="s10"
                            color={colors.white}
                            style={localStyles.badgeText}
                        >
                            {displayCount}
                        </ZText>
                    </Animated.View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const localStyles = StyleSheet.create({
    container: {
        padding: moderateScale(5),
        marginLeft: moderateScale(5),
    },
    iconWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -moderateScale(6),
        right: -moderateScale(8),
        minWidth: moderateScale(18),
        height: moderateScale(18),
        borderRadius: moderateScale(9),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(4),
        // Premium shadow
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    badgeText: {
        fontWeight: '700',
        fontSize: moderateScale(10),
        lineHeight: moderateScale(12),
    },
});

export default memo(HeaderIconWithBadge);
