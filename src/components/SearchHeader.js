// Library import
import React, { memo, useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    I18nManager,
    Animated,
    Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Local imports
import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import strings from '../i18n/strings';

/**
 * SearchHeader - Premium unified search header for all tabs
 * Features: glassmorphism, gradient border, micro-animations, tab-aware placeholder
 */
function SearchHeader({
    value,
    onChangeText,
    activeTab = 'discover', // 'discover' | 'kitchens' | 'reviews'
    useSemanticSearch = true,
    onToggleSemantic,
}) {
    const colors = useSelector(state => state.theme.theme);
    const isRTL = I18nManager.isRTL;

    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Tab-specific placeholders
    const getPlaceholder = () => {
        switch (activeTab) {
            case 'discover':
                return strings.whatDishesWantToEat || 'What do you want to eat today?';
            case 'kitchens':
                return strings.searchKitchens || 'Search for kitchens...';
            case 'reviews':
                return strings.searchReviews || 'Search food stories...';
            default:
                return strings.search || 'Search...';
        }
    };

    // Tab-specific titles
    const getTitle = () => {
        switch (activeTab) {
            case 'discover':
                return strings.discoverTab || 'Discover';
            case 'kitchens':
                return strings.kitchensTab || 'Kitchens';
            case 'reviews':
                return strings.reviewsTab || 'Reviews';
            default:
                return strings.search || 'Search';
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        Animated.parallel([
            Animated.spring(focusAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1.02,
                friction: 8,
                useNativeDriver: false, // Must match other animations on same view
            }),
        ]).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.parallel([
            Animated.spring(focusAnim, {
                toValue: 0,
                friction: 8,
                tension: 100,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: false, // Must match other animations on same view
            }),
        ]).start();
    };

    const handleClear = () => {
        onChangeText('');
        Keyboard.dismiss();
    };

    // Animated border color
    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.bColor || '#333', colors.primary],
    });

    // Animated shadow
    const shadowOpacity = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.3],
    });

    return (
        <View style={localStyles.container}>
            {/* Title Section */}
            <View style={[localStyles.titleRow, isRTL && styles.flexRowReverse]}>
                <View>
                    <ZText type="b24" color={colors.textColor}>
                        {getTitle()}
                    </ZText>
                    <ZText type="m14" color={colors.grayScale5} style={styles.mt5}>
                        {strings.findYourCraving || 'Find your next craving'}
                    </ZText>
                </View>
            </View>

            {/* Search Input with Glassmorphism */}
            <Animated.View
                style={[
                    localStyles.inputWrapper,
                    {
                        transform: [{ scale: scaleAnim }],
                        borderColor: borderColor,
                        backgroundColor: colors.inputBg + 'E6', // Semi-transparent
                    },
                ]}
            >
                {/* Gradient overlay for premium feel */}
                {isFocused && (
                    <View style={localStyles.gradientOverlay}>
                        <LinearGradient
                            colors={[colors.primary + '10', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                )}

                <View style={[localStyles.inputContainer, isRTL && styles.flexRowReverse]}>
                    {/* Search Icon */}
                    <Animated.View
                        style={{
                            opacity: focusAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.6, 1],
                            }),
                        }}
                    >
                        <Ionicons
                            name="search"
                            size={24}
                            color={isFocused ? colors.primary : colors.grayScale5}
                            style={isRTL ? styles.ml15 : styles.mr15}
                        />
                    </Animated.View>

                    {/* Text Input */}
                    <TextInput
                        style={[
                            localStyles.input,
                            { color: colors.textColor },
                            isRTL && { textAlign: 'right' },
                        ]}
                        placeholder={getPlaceholder()}
                        placeholderTextColor={colors.placeHolderColor}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        returnKeyType="search"
                        autoCorrect={false}
                    />

                    {/* Clear Button */}
                    {value?.length > 0 && (
                        <TouchableOpacity
                            onPress={handleClear}
                            style={localStyles.clearBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={[localStyles.clearIcon, { backgroundColor: colors.grayScale5 }]}>
                                <Ionicons name="close" size={14} color={colors.white} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {/* Search Examples - Show when empty */}
            {(!value || value.length === 0) && (
                <View style={localStyles.examplesContainer}>
                    <ZText type="m12" color={colors.grayScale5} style={localStyles.examplesLabel}>
                        {strings.trySearching || 'Try searching:'}
                    </ZText>
                    <View style={localStyles.examplesRow}>
                        {getSearchExamples().map((example, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => onChangeText(example)}
                                style={[localStyles.exampleChip, { backgroundColor: colors.primaryTransparent }]}
                            >
                                <ZText type="s12" color={colors.primary}>
                                    {example}
                                </ZText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}


        </View>
    );

    // Tab-specific search examples
    function getSearchExamples() {
        switch (activeTab) {
            case 'discover':
                return ['نفسي في حاجة دسمة', 'حلويات شرقية', 'وجبة سريعة'];
            case 'kitchens':
                return ['فراخ مشوية', 'أكل بيتي', 'حلويات'];
            case 'reviews':
                return ['أكل بيتي لذيذ', 'تجربة جديدة', 'مطعم شعبي'];
            default:
                return ['برجر', 'بيتزا', 'سلطة'];
        }
    }
}

const localStyles = StyleSheet.create({
    container: {
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(16),
        paddingBottom: moderateScale(12),
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: moderateScale(16),
    },

    inputWrapper: {
        borderRadius: moderateScale(20),
        borderWidth: 2,
        overflow: 'hidden',
        // Glassmorphism shadow
        shadowColor: '#FF4D67',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: moderateScale(20),
        overflow: 'hidden',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(16),
    },
    input: {
        flex: 1,
        fontSize: moderateScale(16),
        fontWeight: '500',
        padding: 0,
    },
    clearBtn: {
        marginLeft: moderateScale(10),
    },
    clearIcon: {
        width: moderateScale(22),
        height: moderateScale(22),
        borderRadius: moderateScale(11),
        ...styles.center,
    },
    examplesContainer: {
        marginTop: moderateScale(12),
    },
    examplesLabel: {
        marginBottom: moderateScale(8),
    },
    examplesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(8),
    },
    exampleChip: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
        borderRadius: moderateScale(16),
    },

});

export default memo(SearchHeader);
