import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    ActivityIndicator,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../common/constants';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';

const { height: screenHeight } = Dimensions.get('window');

const MediaSelectionModal = ({
    visible,
    onClose,
    onRecordVideo,
    onTakePhoto,
    onPickFromGallery,
    title,
    subtitle,
}) => {
    const colors = useSelector(state => state.theme.theme);
    const [slideAnim] = useState(new Animated.Value(screenHeight));
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsProcessing(false);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleAction = async (action) => {
        if (isProcessing) return;
        setIsProcessing(true);
        onClose();
        if (action) {
            await action();
        }
        setIsProcessing(false);
    };

    const renderOption = (icon, optionTitle, optionSubtitle, onPress, color) => (
        <TouchableOpacity
            style={[styles.optionItem, { backgroundColor: colors.inputBg }]}
            onPress={() => handleAction(onPress)}
            activeOpacity={0.7}
            disabled={isProcessing}>
            <View style={[styles.iconContainer, { backgroundColor: (color || colors.primary) + '15' }]}>
                <Ionicons
                    name={icon}
                    size={moderateScale(24)}
                    color={color || colors.primary}
                />
            </View>
            <View style={styles.textContainer}>
                <ZText type="B16" color={colors.textColor}>
                    {optionTitle}
                </ZText>
                {optionSubtitle && (
                    <ZText type="M12" color={colors.grayScale5} style={styles.subtitle}>
                        {optionSubtitle}
                    </ZText>
                )}
            </View>
            <Ionicons
                name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                size={moderateScale(20)}
                color={colors.grayScale5}
            />
        </TouchableOpacity>
    );

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={onClose}>
                <View style={[styles.overlay, { backgroundColor: colors.black + '50' }]}>
                    <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                backgroundColor: colors.backgroundColor,
                                transform: [{ translateY: slideAnim }],
                                paddingBottom: Platform.OS === 'ios' ? moderateScale(30) : moderateScale(10),
                            },
                        ]}>

                        {/* Handle Bar */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: colors.grayScale3 }]} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <ZText type="B20" color={colors.textColor} style={styles.title}>
                                {title || strings.createReviewPost}
                            </ZText>
                            <ZText type="R14" color={colors.grayScale5} style={styles.headerSubtitle}>
                                {subtitle || strings.chooseHowToCreateReview}
                            </ZText>
                        </View>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                            {renderOption(
                                'videocam',
                                strings.recordVideo,
                                strings.recordVideoSubtitle,
                                onRecordVideo,
                                '#FF4D67'
                            )}

                            {renderOption(
                                'camera',
                                strings.takePhoto,
                                strings.takePhotoSubtitle,
                                onTakePhoto,
                                '#4CAF50'
                            )}

                            {renderOption(
                                'images',
                                strings.chooseFromGalleryTitle,
                                strings.chooseFromGallerySubtitle,
                                onPickFromGallery,
                                '#2196F3'
                            )}
                        </View>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.bColor }]}
                            onPress={onClose}
                            disabled={isProcessing}>
                            <ZText type="B16" color={colors.textColor}>
                                {strings.cancel}
                            </ZText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Processing overlay - shows loading during picker and navigation */}
            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={styles.processingOverlay}>
                    <View style={[styles.processingCard, { backgroundColor: colors.backgroundColor }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <ZText type="B16" color={colors.textColor} style={styles.processingText}>
                            {strings.loading || 'Loading...'}
                        </ZText>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(10),
    },
    handleContainer: {
        alignItems: 'center',
        marginBottom: moderateScale(20),
    },
    handle: {
        width: moderateScale(40),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
    },
    header: {
        alignItems: 'center',
        marginBottom: moderateScale(24),
    },
    title: {
        marginBottom: moderateScale(8),
    },
    headerSubtitle: {
        textAlign: 'center',
    },
    optionsContainer: {
        gap: moderateScale(12),
        marginBottom: moderateScale(24),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        borderRadius: moderateScale(16),
    },
    iconContainer: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: moderateScale(16),
    },
    textContainer: {
        flex: 1,
    },
    subtitle: {
        marginTop: moderateScale(2),
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(16),
        borderRadius: moderateScale(30),
        borderWidth: 1,
        marginBottom: moderateScale(10),
    },
    processingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingCard: {
        paddingHorizontal: moderateScale(40),
        paddingVertical: moderateScale(30),
        borderRadius: moderateScale(16),
        alignItems: 'center',
    },
    processingText: {
        marginTop: moderateScale(16),
    },
});

export default MediaSelectionModal;
