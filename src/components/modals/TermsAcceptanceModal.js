/**
 * TermsAcceptanceModal
 * A focused modal that appears after user selects their account type.
 * Requires acceptance of Terms of Service & Privacy Policy before proceeding.
 * Features a clean, premium design with animated checkbox and tappable links.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TouchableOpacity,
    Animated,
    Dimensions,
    I18nManager,
    Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { moderateScale, getHeight } from '../../common/constants';
import strings from '../../i18n/strings';
import { commonColor, styles } from '../../themes';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';
import { showErrorToast } from '../../utils/toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TERMS_URL = 'https://feedyum.com/terms-of-service';
const PRIVACY_URL = 'https://feedyum.com/privacy-policy';

const TermsAcceptanceModal = ({ visible, onAccept, onClose }) => {
    const colors = useSelector(state => state.theme.theme);
    const [accepted, setAccepted] = useState(false);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const checkboxScale = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setAccepted(false);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 9,
                    tension: 70,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleCheckboxPress = () => {
        setAccepted(prev => !prev);
        Animated.sequence([
            Animated.timing(checkboxScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
            Animated.spring(checkboxScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
        ]).start();
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleContinue = () => {
        if (!accepted) {
            triggerShake();
            showErrorToast(
                strings.importantNotice || 'Important Notice',
                strings.youMustAcceptTerms || 'You must accept the Terms of Service and Privacy Policy to continue',
            );
            return;
        }
        onAccept();
    };

    const openLink = (url) => {
        Linking.openURL(url).catch(() => {});
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent>
            <Animated.View style={[localStyles.backdrop, { opacity: fadeAnim }]}>
                <View style={localStyles.darkOverlay} />

                <Animated.View
                    style={[
                        localStyles.modalContainer,
                        { transform: [{ translateY: slideAnim }] },
                    ]}>
                    {/* Bottom Sheet */}
                    <View style={[localStyles.sheet, { backgroundColor: colors.backgroundColor }]}>
                        {/* Handle bar */}
                        <View style={localStyles.handleContainer}>
                            <View style={[localStyles.handle, { backgroundColor: colors.grayScale5 + '50' }]} />
                        </View>

                        {/* Shield Icon */}
                        <View style={localStyles.iconSection}>
                            <LinearGradient
                                colors={[colors.primary, colors.primary + '80']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={localStyles.shieldCircle}>
                                <Ionicons name="shield-checkmark" size={moderateScale(36)} color={commonColor.white} />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <ZText type="b22" align="center" style={localStyles.title}>
                            {strings.termsServices || 'Terms of Service'}
                        </ZText>
                        <ZText type="r14" align="center" color={colors.grayScale5} style={localStyles.subtitle}>
                            {strings.youMustAcceptTerms || 'You must accept the Terms of Service and Privacy Policy to continue'}
                        </ZText>

                        {/* Legal Links */}
                        <View style={localStyles.linksContainer}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => openLink(TERMS_URL)}
                                style={[localStyles.linkCard, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                                <View style={[localStyles.linkIconCircle, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="document-text-outline" size={moderateScale(20)} color={colors.primary} />
                                </View>
                                <ZText type="s15" style={localStyles.linkText}>
                                    {strings.termsServices || 'Terms of Service'}
                                </ZText>
                                <Ionicons
                                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                                    size={moderateScale(18)}
                                    color={colors.grayScale5}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => openLink(PRIVACY_URL)}
                                style={[localStyles.linkCard, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                                <View style={[localStyles.linkIconCircle, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="lock-closed-outline" size={moderateScale(20)} color={colors.primary} />
                                </View>
                                <ZText type="s15" style={localStyles.linkText}>
                                    {strings.privacyPolicy || 'Privacy Policy'}
                                </ZText>
                                <Ionicons
                                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                                    size={moderateScale(18)}
                                    color={colors.grayScale5}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Checkbox */}
                        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleCheckboxPress}
                                style={[
                                    localStyles.checkboxRow,
                                    {
                                        backgroundColor: accepted ? colors.primary + '12' : colors.inputBg,
                                        borderColor: accepted ? colors.primary : colors.bColor,
                                    },
                                ]}>
                                <Animated.View
                                    style={[
                                        localStyles.checkbox,
                                        {
                                            borderColor: accepted ? colors.primary : colors.grayScale5,
                                            backgroundColor: accepted ? colors.primary : 'transparent',
                                            transform: [{ scale: checkboxScale }],
                                        },
                                    ]}>
                                    {accepted && (
                                        <Ionicons name="checkmark" size={moderateScale(15)} color={commonColor.white} />
                                    )}
                                </Animated.View>
                                <View style={localStyles.checkboxTextContainer}>
                                    <ZText type="r14" color={colors.textColor}>
                                        {strings.iAgreeToThe || 'I agree to the'}{' '}
                                    </ZText>
                                    <ZText type="s14" color={colors.primary} style={localStyles.underlined}>
                                        {strings.termsServices || 'Terms of Service'}
                                    </ZText>
                                    <ZText type="r14" color={colors.textColor}>
                                        {' '}{strings.andThe || 'and'}{' '}
                                    </ZText>
                                    <ZText type="s14" color={colors.primary} style={localStyles.underlined}>
                                        {strings.privacyPolicy || 'Privacy Policy'}
                                    </ZText>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Buttons */}
                        <View style={localStyles.buttonsContainer}>
                            <ZButton
                                title={strings.continue || 'Continue'}
                                textType="b18"
                                color={commonColor.white}
                                containerStyle={[
                                    localStyles.continueBtn,
                                    !accepted && localStyles.disabledBtn,
                                ]}
                                bgColor={accepted ? colors.primary : colors.grayScale5}
                                onPress={handleContinue}
                            />
                            <TouchableOpacity
                                onPress={onClose}
                                style={localStyles.cancelBtn}
                                activeOpacity={0.7}>
                                <ZText type="s15" color={colors.grayScale5}>
                                    {strings.cancel || 'Cancel'}
                                </ZText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const localStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: moderateScale(28),
        borderTopRightRadius: moderateScale(28),
        paddingHorizontal: moderateScale(24),
        paddingBottom: moderateScale(40),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(8),
    },
    handle: {
        width: moderateScale(40),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
    },
    iconSection: {
        alignItems: 'center',
        marginTop: moderateScale(16),
        marginBottom: moderateScale(16),
    },
    shieldCircle: {
        width: moderateScale(72),
        height: moderateScale(72),
        borderRadius: moderateScale(36),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: moderateScale(8),
    },
    subtitle: {
        marginBottom: moderateScale(24),
        paddingHorizontal: moderateScale(16),
    },
    linksContainer: {
        gap: moderateScale(10),
        marginBottom: moderateScale(20),
    },
    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(14),
        borderRadius: moderateScale(14),
        borderWidth: 1,
    },
    linkIconCircle: {
        width: moderateScale(38),
        height: moderateScale(38),
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(14),
    },
    linkText: {
        flex: 1,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        borderRadius: moderateScale(14),
        borderWidth: 1.5,
        marginBottom: moderateScale(24),
    },
    checkbox: {
        width: moderateScale(24),
        height: moderateScale(24),
        borderRadius: moderateScale(7),
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: I18nManager.isRTL ? 0 : moderateScale(14),
        marginLeft: I18nManager.isRTL ? moderateScale(14) : 0,
    },
    checkboxTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    underlined: {
        textDecorationLine: 'underline',
    },
    buttonsContainer: {
        gap: moderateScale(12),
    },
    continueBtn: {
        height: moderateScale(56),
        borderRadius: moderateScale(16),
    },
    disabledBtn: {
        opacity: 0.6,
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: moderateScale(8),
    },
});

export default TermsAcceptanceModal;
