import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { StyleSheet, View, I18nManager } from 'react-native';
import { useSelector } from 'react-redux';
import PhoneInput from 'react-native-phone-number-input';
import { getHeight, moderateScale } from '../../common/constants';
import { styles } from '../../themes';
import typography from '../../themes/typography';
import ZText from './ZText';

/**
 * ZPhoneInput - A professional phone number input component with validation
 * 
 * @param {Object} props
 * @param {string} props.value - The phone number value (without country code)
 * @param {function} props.onChangeText - Callback when phone number changes
 * @param {function} props.onChangeFormattedText - Callback with full formatted number (with country code)
 * @param {function} props.onChangeCountryCode - Callback when country code changes
 * @param {function} props.onValidation - Callback with validation status (isValid: boolean)
 * @param {string} props.defaultCode - Default country code (e.g., 'EG' for Egypt)
 * @param {string} props.label - Label text above input
 * @param {boolean} props.required - Show required asterisk
 * @param {string} props.errorText - Error message to display
 * @param {Object} props.containerStyle - Custom container style
 * @param {boolean} props.disabled - Disable the input
 * @param {string} props.placeholder - Placeholder text
 * @param {function} props.onBlur - Callback when input loses focus
 * 
 * Ref Methods:
 * - isValidNumber(): Returns true if the current number is valid
 * - getFormattedNumber(): Returns the formatted phone number with country code
 * - getCountryCode(): Returns the current country code
 */
const ZPhoneInput = forwardRef(({
    value,
    onChangeText,
    onChangeFormattedText,
    onChangeCountryCode,
    onValidation,
    defaultCode = 'EG',
    label,
    required = false,
    errorText,
    containerStyle,
    disabled = false,
    placeholder,
    onBlur,
}, ref) => {
    const colors = useSelector(state => state.theme.theme);
    const phoneInputRef = useRef(null);

    // Track internal value to handle external value prop changes
    // react-native-phone-number-input's defaultValue is not reactive
    const [internalValue, setInternalValue] = useState(value || '');
    const [inputKey, setInputKey] = useState(0);

    // Sync internal value with external value prop when it changes from outside
    useEffect(() => {
        // Only update if value is coming from external source (e.g., API data load)
        // and is different from what user has typed
        if (value !== undefined && value !== internalValue) {
            setInternalValue(value || '');
            // Force remount of PhoneInput to apply new defaultValue
            setInputKey(prev => prev + 1);
        }
    }, [value]);

    // Expose validation methods to parent via ref
    useImperativeHandle(ref, () => ({
        isValidNumber: () => {
            return phoneInputRef.current?.isValidNumber(value) || false;
        },
        getFormattedNumber: () => {
            return phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero()?.formattedNumber || '';
        },
        getCountryCode: () => {
            const code = phoneInputRef.current?.getCallingCode();
            return code ? `+${code}` : '+20';
        },
    }));

    const handlePhoneChange = (text) => {
        // Update internal state to track user input
        setInternalValue(text);

        if (onChangeText) {
            onChangeText(text);
        }

        // Validate and notify parent
        if (onValidation && phoneInputRef.current) {
            // Small delay to ensure ref is updated
            setTimeout(() => {
                const isValid = phoneInputRef.current?.isValidNumber(text);
                onValidation(isValid);
            }, 100);
        }
    };

    const handleFormattedTextChange = (text) => {
        if (onChangeFormattedText) {
            onChangeFormattedText(text);
        }
    };

    const handleCountryChange = (country) => {
        if (onChangeCountryCode) {
            onChangeCountryCode(`+${country.callingCode[0]}`);
        }

        // Re-validate when country changes
        if (onValidation && phoneInputRef.current && value) {
            setTimeout(() => {
                const isValid = phoneInputRef.current?.isValidNumber(value);
                onValidation(isValid);
            }, 100);
        }
    };

    return (
        <View style={[styles.mv10, containerStyle]}>
            {label && (
                <View style={localStyles.labelContainer}>
                    <View style={styles.flexRow}>
                        <ZText style={localStyles.labelText} type={'b18'}>
                            {label}
                        </ZText>
                        {required && <ZText style={{ color: colors.lightRed }}>{' *'}</ZText>}
                    </View>
                </View>
            )}

            <View
                style={[
                    localStyles.inputWrapper,
                    {
                        borderColor: errorText ? colors.lightRed : colors.bColor,
                        backgroundColor: colors.inputBg || colors.backgroundColor,
                    },
                ]}
            >
                <PhoneInput
                    key={inputKey}
                    ref={phoneInputRef}
                    defaultValue={internalValue}
                    defaultCode={defaultCode}
                    layout="first"
                    onChangeText={handlePhoneChange}
                    onChangeFormattedText={handleFormattedTextChange}
                    onChangeCountry={handleCountryChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    containerStyle={[
                        localStyles.phoneContainer,
                        { backgroundColor: 'transparent' },
                    ]}
                    textContainerStyle={[
                        localStyles.textContainer,
                        { backgroundColor: 'transparent' },
                    ]}
                    textInputStyle={[
                        localStyles.textInput,
                        { color: colors.textColor },
                        disabled && { color: colors.placeHolderColor },
                    ]}
                    codeTextStyle={[
                        localStyles.codeText,
                        { color: colors.textColor },
                    ]}
                    flagButtonStyle={localStyles.flagButton}
                    countryPickerButtonStyle={localStyles.countryPickerButton}
                    textInputProps={{
                        placeholderTextColor: colors.placeHolderColor,
                        textAlign: I18nManager.isRTL ? 'right' : 'left',
                        onBlur: onBlur,
                    }}
                    countryPickerProps={{
                        withFilter: true,
                        withFlag: true,
                        withCountryNameButton: false,
                        withCallingCode: true,
                        withCallingCodeButton: true,
                        filterProps: {
                            style: {
                                backgroundColor: colors.backgroundColor,
                                color: colors.textColor,
                            },
                            placeholderTextColor: colors.placeHolderColor,
                        },
                        theme: {
                            backgroundColor: colors.backgroundColor,
                            primaryColor: colors.primary,
                            primaryColorVariant: colors.primary + '20',
                            onBackgroundTextColor: colors.textColor,
                            fontSize: moderateScale(14),
                            filterPlaceholderTextColor: colors.placeHolderColor,
                        },
                    }}
                />
            </View>

            {/* Error Text */}
            {!!errorText?.length && (
                <ZText
                    type={'r12'}
                    style={[localStyles.errorText, { color: colors.lightRed }]}
                >
                    {errorText}
                </ZText>
            )}
        </View>
    );
});

const localStyles = StyleSheet.create({
    labelContainer: {
        marginTop: moderateScale(10),
        marginBottom: moderateScale(5),
    },
    labelText: {
        textAlign: 'left',
        opacity: 0.9,
    },
    inputWrapper: {
        borderWidth: moderateScale(1),
        borderRadius: moderateScale(15),
        overflow: 'hidden',
        marginTop: moderateScale(5),
    },
    phoneContainer: {
        width: '100%',
        height: getHeight(52),
        borderRadius: moderateScale(15),
    },
    textContainer: {
        borderRadius: moderateScale(15),
        paddingVertical: 0,
        paddingLeft: 0,
    },
    textInput: {
        ...typography.fontSizes.f16,
        ...typography.fontWeights.Regular,
        height: getHeight(52),
        paddingVertical: 0,
    },
    codeText: {
        ...typography.fontSizes.f14,
        ...typography.fontWeights.Medium,
    },
    flagButton: {
        width: moderateScale(70),
        paddingLeft: moderateScale(10),
    },
    countryPickerButton: {
        paddingHorizontal: moderateScale(10),
    },
    errorText: {
        textAlign: 'left',
        marginTop: moderateScale(5),
        marginLeft: moderateScale(10),
    },
});

export default ZPhoneInput;
