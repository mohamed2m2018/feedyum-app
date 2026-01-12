// Library imports
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Custom imports
import { moderateScale } from '../../common/constants';
import { styles } from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import SharingUtils from '../../utils/SharingUtils';

const ShareOptionsSheet = props => {
    const { SheetRef, contentType = 'reel', contentId, contentData = {} } = props;
    const colors = useSelector(state => state.theme.theme);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingOption, setLoadingOption] = useState(null);

    const shareOptions = [
        {
            key: 'native',
            title: strings.shareMore || 'More Options',
            icon: 'share-outline',
            iconType: 'ionicons',
            color: colors.primary,
        },
        {
            key: 'copy',
            title: strings.copyLink || 'Copy Link',
            icon: 'link-outline',
            iconType: 'ionicons',
            color: '#6B7280',
        },
        {
            key: 'whatsapp',
            title: 'WhatsApp',
            icon: 'whatsapp',
            iconType: 'fontawesome',
            color: '#25D366',
        },
        {
            key: 'twitter',
            title: 'X (Twitter)',
            icon: 'logo-twitter',
            iconType: 'ionicons',
            color: '#1DA1F2',
        },
        {
            key: 'instagram',
            title: 'Instagram',
            icon: 'logo-instagram',
            iconType: 'ionicons',
            color: '#E4405F',
        },
    ];

    const handleShareOption = async option => {
        setIsLoading(true);
        setLoadingOption(option.key);

        try {
            const result = await SharingUtils.handleShareOption(
                option,
                contentType,
                contentId,
                contentData,
                {
                    title: contentData.title,
                    creator: contentData.creator,
                    description: contentData.description,
                },
            );

            if (result.success) {
                SheetRef.current?.hide();
            }
        } catch (error) {
            Alert.alert(strings.sharingError, strings.failedToShareContent);
        } finally {
            setIsLoading(false);
            setLoadingOption(null);
        }
    };

    const renderIcon = option => {
        const IconComponent = option.iconType === 'fontawesome' ? FontAwesome : Ionicons;
        return (
            <IconComponent
                name={option.icon}
                size={moderateScale(24)}
                color={option.color}
                style={localStyles.optionIcon}
            />
        );
    };

    return (
        <ActionSheet
            ref={SheetRef}
            gestureEnabled={true}
            indicatorStyle={{ width: moderateScale(100) }}
            containerStyle={[
                localStyles.actionSheetContainer,
                { backgroundColor: colors.backgroundColor },
            ]}>
            <View style={localStyles.bottomContainer}>
                <ZText type={'M24'} color={colors.primary} style={localStyles.title}>
                    {strings.share || 'Share'}
                </ZText>

                <View style={localStyles.optionsContainer}>
                    {shareOptions.map(option => (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                localStyles.optionButton,
                                {
                                    backgroundColor: colors.inputBgColor || colors.backgroundColor3,
                                },
                            ]}
                            onPress={() => handleShareOption(option)}
                            disabled={isLoading}>
                            <View style={localStyles.optionContent}>
                                {loadingOption === option.key ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={option.color}
                                        style={localStyles.optionIcon}
                                    />
                                ) : (
                                    renderIcon(option)
                                )}
                                <ZText type={'s16'} style={localStyles.optionText}>
                                    {option.title}
                                </ZText>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={moderateScale(18)}
                                color={colors.grayScale6 || '#9CA3AF'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        localStyles.cancelButton,
                        { borderColor: colors.textColor },
                    ]}
                    onPress={() => SheetRef.current?.hide()}>
                    <ZText type={'B16'} color={colors.textColor}>
                        {strings.cancel || 'Cancel'}
                    </ZText>
                </TouchableOpacity>
            </View>
        </ActionSheet>
    );
};

const localStyles = StyleSheet.create({
    actionSheetContainer: {
        ...styles.p20,
        borderTopLeftRadius: moderateScale(25),
        borderTopRightRadius: moderateScale(25),
    },
    bottomContainer: {
        width: '100%',
        ...styles.selfCenter,
        paddingHorizontal: moderateScale(16),
        ...styles.mv20,
    },
    title: {
        textAlign: 'center',
        marginBottom: moderateScale(20),
    },
    optionsContainer: {
        gap: moderateScale(10),
    },
    optionButton: {
        ...styles.flexRow,
        ...styles.itemsCenter,
        ...styles.justifyBetween,
        padding: moderateScale(14),
        borderRadius: moderateScale(12),
    },
    optionContent: {
        ...styles.flexRow,
        ...styles.itemsCenter,
    },
    optionIcon: {
        width: moderateScale(30),
    },
    optionText: {
        marginLeft: moderateScale(12),
    },
    cancelButton: {
        ...styles.itemsCenter,
        ...styles.justifyCenter,
        marginTop: moderateScale(16),
        padding: moderateScale(14),
        borderRadius: moderateScale(12),
        borderWidth: 1,
    },
});

export default ShareOptionsSheet;
