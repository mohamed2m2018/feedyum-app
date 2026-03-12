/**
 * UserTypeSelectionModal
 * A premium full-screen modal for selecting account type during registration.
 * Features glassmorphism design, animated selection states, and bilingual support.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { moderateScale, getHeight, deviceWidth } from '../../common/constants';
import strings from '../../i18n/strings';
import { commonColor, styles } from '../../themes';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Feature item component
const FeatureItem = ({ icon, text, colors }) => (
    <View style={localStyles.featureRow}>
        <View style={[localStyles.checkCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark" size={moderateScale(14)} color={colors.primary} />
        </View>
        <ZText type="r14" style={localStyles.featureText} numberOfLines={2}>
            {text}
        </ZText>
    </View>
);

// Selection Card component
const SelectionCard = ({
    selected,
    onPress,
    title,
    subtitle,
    features,
    icon,
    iconType = 'ionicons',
    gradientColors,
    colors,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: selected ? 1.02 : 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    }, [selected]);

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <Animated.View
                style={[
                    localStyles.card,
                    {
                        backgroundColor: colors.inputBg,
                        borderColor: selected ? colors.primary : colors.bColor,
                        borderWidth: selected ? 2.5 : 1,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}>
                {/* Gradient header */}
                <LinearGradient
                    colors={selected ? gradientColors : [colors.dark3, colors.dark3]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={localStyles.cardHeader}>
                    <View style={localStyles.iconCircle}>
                        {iconType === 'material' ? (
                            <MaterialCommunityIcons
                                name={icon}
                                size={moderateScale(36)}
                                color={selected ? commonColor.white : colors.textColor}
                            />
                        ) : (
                            <Ionicons
                                name={icon}
                                size={moderateScale(36)}
                                color={selected ? commonColor.white : colors.textColor}
                            />
                        )}
                    </View>
                    <View style={localStyles.headerTextContainer}>
                        <ZText
                            type="b20"
                            color={selected ? commonColor.white : colors.textColor}
                            style={localStyles.cardTitle}>
                            {title}
                        </ZText>
                        <ZText
                            type="r14"
                            color={selected ? 'rgba(255,255,255,0.85)' : colors.grayScale5}
                            numberOfLines={1}>
                            {subtitle}
                        </ZText>
                    </View>
                    {selected && (
                        <View style={localStyles.selectedBadge}>
                            <Ionicons name="checkmark-circle" size={moderateScale(24)} color={commonColor.white} />
                        </View>
                    )}
                </LinearGradient>

                {/* Features list */}
                <View style={localStyles.featuresContainer}>
                    {features.map((feature, index) => (
                        <FeatureItem key={index} text={feature} colors={colors} />
                    ))}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const UserTypeSelectionModal = ({ visible, onSelect, onClose }) => {
    const colors = useSelector(state => state.theme.theme);
    const [selectedType, setSelectedType] = useState(null);
    const [showValidationError, setShowValidationError] = useState(false);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const errorFadeAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setSelectedType(null);
            setShowValidationError(false);
            errorFadeAnim.setValue(0);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 65,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleContinue = () => {
        if (!selectedType) {
            setShowValidationError(true);
            Animated.parallel([
                Animated.timing(errorFadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
            ]).start();
            // Auto-hide after 3 seconds
            setTimeout(() => {
                Animated.timing(errorFadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setShowValidationError(false));
            }, 3000);
            return;
        }
        onSelect(selectedType === 'chef');
    };

    const foodLoverFeatures = [
        strings.foodLoverFeature1 || 'Discover amazing dishes nearby',
        strings.foodLoverFeature2 || 'Order from home kitchens & restaurants',
        strings.foodLoverFeature3 || 'Share food reviews and videos',
        strings.foodLoverFeature4 || 'Save your favorite dishes',
    ];

    const chefFeatures = [
        strings.chefKitchenFeature1 || 'Create and manage your menu',
        strings.chefKitchenFeature2 || 'Receive and track customer orders',
        strings.chefKitchenFeature3 || 'Build your food brand',
        strings.chefKitchenFeature4 || 'Connect directly with customers',
    ];

    const getButtonText = () => {
        if (!selectedType) {
            return strings.selectAccountType || 'Please select an account type';
        }
        const typeName = selectedType === 'user'
            ? (strings.foodLoverTitle || 'Food Lover')
            : (strings.chefKitchenTitle || 'Kitchen / Restaurant');
        return `${strings.continueAs || 'Continue as'} ${typeName}`;
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent>
            <Animated.View style={[localStyles.backdrop, { opacity: fadeAnim }]}>
                <View style={localStyles.blurContainer}>
                    {/* Fallback dark overlay if BlurView doesn't work */}
                    <View style={[localStyles.darkOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
                </View>

                <Animated.View
                    style={[
                        localStyles.modalContainer,
                        { transform: [{ translateY: slideAnim }] },
                    ]}>
                    <ScrollView
                        style={localStyles.scrollView}
                        contentContainerStyle={localStyles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}>
                        {/* Header */}
                        <View style={localStyles.header}>
                            <ZText type="b28" align="center" color={commonColor.white}>
                                {strings.userTypeSelectionTitle || 'Choose Your Account Type'}
                            </ZText>
                            <ZText
                                type="r16"
                                align="center"
                                color="rgba(255,255,255,0.7)"
                                style={styles.mt10}>
                                {strings.userTypeSelectionSubtitle || 'This will determine your experience in FoodTok'}
                            </ZText>
                        </View>

                        {/* Selection Cards */}
                        <View style={localStyles.cardsContainer}>
                            {/* Food Lover Card */}
                            <SelectionCard
                                selected={selectedType === 'user'}
                                onPress={() => setSelectedType('user')}
                                title={strings.foodLoverTitle || 'Food Lover'}
                                subtitle={strings.foodLoverSubtitle || 'I want to discover and order food'}
                                features={foodLoverFeatures}
                                icon="restaurant-outline"
                                gradientColors={['#FF8C42', colors.primary]}
                                colors={colors}
                            />

                            {/* Kitchen Card */}
                            <SelectionCard
                                selected={selectedType === 'chef'}
                                onPress={() => setSelectedType('chef')}
                                title={strings.chefKitchenTitle || 'Kitchen / Restaurant'}
                                subtitle={strings.chefKitchenSubtitle || 'I want to sell my food'}
                                features={chefFeatures}
                                icon="chef-hat"
                                iconType="material"
                                gradientColors={[commonColor.blue, colors.primary]}
                                colors={colors}
                            />
                        </View>

                        {/* Warning Notice */}
                        <View style={[localStyles.warningContainer, { backgroundColor: commonColor.yellow + '15' }]}>
                            <View style={localStyles.warningHeader}>
                                <Ionicons name="warning" size={moderateScale(20)} color={commonColor.yellow} />
                                <ZText type="s14" color={commonColor.yellow} style={styles.ml10}>
                                    {strings.importantNotice || 'Important Notice'}
                                </ZText>
                            </View>
                            <ZText type="r13" color="rgba(255,255,255,0.7)" style={styles.mt5}>
                                {strings.accountTypeWarning || 'Your account type affects your entire app experience. Choose carefully!'}
                            </ZText>
                        </View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View style={[localStyles.buttonContainer, { backgroundColor: colors.backgroundColor }]}>
                        {showValidationError && (
                            <Animated.View
                                style={[
                                    localStyles.errorContainer,
                                    {
                                        opacity: errorFadeAnim,
                                        transform: [
                                            { translateX: shakeAnim },
                                            { translateY: errorFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                                        ],
                                    },
                                ]}>
                                <Ionicons name="alert-circle" size={moderateScale(16)} color={commonColor.red} />
                                <ZText type="s13" color={commonColor.red} style={styles.ml5}>
                                    {strings.selectAccountType || 'Please select an account type to continue'}
                                </ZText>
                            </Animated.View>
                        )}
                        <ZButton
                            title={getButtonText()}
                            textType="b18"
                            color={commonColor.white}
                            containerStyle={[
                                localStyles.continueButton,
                                !selectedType && localStyles.disabledButton,
                            ]}
                            bgColor={selectedType ? colors.primary : colors.grayScale5}
                            onPress={handleContinue}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const localStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: moderateScale(60),
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(100),
    },
    header: {
        marginBottom: moderateScale(30),
        paddingHorizontal: moderateScale(10),
    },
    cardsContainer: {
        gap: moderateScale(16),
    },
    card: {
        borderRadius: moderateScale(20),
        overflow: 'hidden',
        marginBottom: moderateScale(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        paddingVertical: moderateScale(20),
    },
    iconCircle: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginHorizontal: moderateScale(14),
    },
    cardTitle: {
        marginBottom: moderateScale(2),
    },
    selectedBadge: {
        marginLeft: 'auto',
    },
    featuresContainer: {
        padding: moderateScale(16),
        paddingTop: moderateScale(12),
        gap: moderateScale(10),
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkCircle: {
        width: moderateScale(22),
        height: moderateScale(22),
        borderRadius: moderateScale(11),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    featureText: {
        flex: 1,
    },
    warningContainer: {
        marginTop: moderateScale(24),
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: commonColor.yellow + '30',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(34),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    continueButton: {
        height: moderateScale(56),
        borderRadius: moderateScale(16),
    },
    disabledButton: {
        opacity: 0.7,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateScale(10),
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(14),
        borderRadius: moderateScale(10),
        backgroundColor: 'rgba(255, 75, 75, 0.12)',
    },
});

export default UserTypeSelectionModal;
