/**
 * useTranslation Hook
 * Provides auto-translation functionality for chef input forms
 */

import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import request from '../api/request';

// Language detection using Arabic Unicode range
const detectLanguage = (text) => {
    if (!text || typeof text !== 'string') return 'en';

    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const arabicMatches = (text.match(arabicPattern) || []).length;
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;

    return arabicMatches > latinMatches ? 'ar' : 'en';
};

/**
 * Hook for managing bilingual input with auto-translation
 * 
 * @example
 * const { 
 *   primaryValue, 
 *   secondaryValue, 
 *   setPrimaryValue, 
 *   setSecondaryValue,
 *   isTranslating,
 *   originalLanguage 
 * } = useTranslatedField('');
 */
export const useTranslatedField = (initialValue = '') => {
    const [primaryValue, setPrimaryValueState] = useState(initialValue);
    const [secondaryValue, setSecondaryValueState] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [originalLanguage, setOriginalLanguage] = useState('en');
    const [translationError, setTranslationError] = useState(null);

    // Track if secondary was manually edited
    const wasSecondaryEdited = useRef(false);

    // Debounced translation function
    const translateText = useCallback(
        debounce(async (text, targetLang) => {
            if (!text || text.trim().length < 2) {
                setIsTranslating(false);
                return;
            }

            try {
                setIsTranslating(true);
                setTranslationError(null);

                const response = await request.post('/translate', {
                    text: text.trim(),
                    to: targetLang,
                });

                if (response.data?.success && response.data?.translation) {
                    // Only update if secondary wasn't manually edited
                    if (!wasSecondaryEdited.current) {
                        setSecondaryValueState(response.data.translation);
                    }
                }
            } catch (error) {
                console.error('Translation error:', error);
                setTranslationError(error.message || 'Translation failed');
            } finally {
                setIsTranslating(false);
            }
        }, 500),
        []
    );

    // Set primary value and trigger translation
    const setPrimaryValue = useCallback((text) => {
        setPrimaryValueState(text);
        wasSecondaryEdited.current = false;

        if (text && text.trim().length >= 2) {
            const detectedLang = detectLanguage(text);
            setOriginalLanguage(detectedLang);
            const targetLang = detectedLang === 'ar' ? 'en' : 'ar';
            translateText(text, targetLang);
        } else {
            setSecondaryValueState('');
        }
    }, [translateText]);

    // Set secondary value (manual edit)
    const setSecondaryValue = useCallback((text) => {
        setSecondaryValueState(text);
        wasSecondaryEdited.current = true;
    }, []);

    // Get values in the correct language format
    const getValues = useCallback(() => {
        if (originalLanguage === 'ar') {
            return {
                nameArabic: primaryValue,
                nameEnglish: secondaryValue,
            };
        }
        return {
            nameEnglish: primaryValue,
            nameArabic: secondaryValue,
        };
    }, [primaryValue, secondaryValue, originalLanguage]);

    // Reset all state
    const reset = useCallback(() => {
        setPrimaryValueState('');
        setSecondaryValueState('');
        setIsTranslating(false);
        setOriginalLanguage('en');
        setTranslationError(null);
        wasSecondaryEdited.current = false;
    }, []);

    // Initialize with existing bilingual data
    const initialize = useCallback((arabicValue, englishValue, originalLang = null) => {
        const lang = originalLang || (arabicValue && arabicValue.length > 0 ? 'ar' : 'en');
        setOriginalLanguage(lang);

        if (lang === 'ar') {
            setPrimaryValueState(arabicValue || '');
            setSecondaryValueState(englishValue || '');
        } else {
            setPrimaryValueState(englishValue || '');
            setSecondaryValueState(arabicValue || '');
        }
        wasSecondaryEdited.current = !!(arabicValue && englishValue);
    }, []);

    return {
        primaryValue,
        secondaryValue,
        setPrimaryValue,
        setSecondaryValue,
        isTranslating,
        originalLanguage,
        translationError,
        getValues,
        reset,
        initialize,
        detectLanguage,
    };
};

/**
 * Simple translation function for one-off translations
 */
export const translateText = async (text, targetLanguage) => {
    if (!text || text.trim().length === 0) {
        return { success: false, translation: '' };
    }

    try {
        const response = await request.post('/translate', {
            text: text.trim(),
            to: targetLanguage,
        });

        return {
            success: response.data?.success || false,
            translation: response.data?.translation || '',
            from: response.data?.from,
            to: response.data?.to,
        };
    } catch (error) {
        console.error('Translation error:', error);
        return { success: false, translation: '', error: error.message };
    }
};

/**
 * Get bilingual text (both Arabic and English versions)
 */
export const getBilingualText = async (text) => {
    if (!text || text.trim().length === 0) {
        return { arabic: '', english: '', originalLanguage: 'en' };
    }

    try {
        const response = await request.post('/translate/bilingual', {
            text: text.trim(),
        });

        return {
            arabic: response.data?.arabic || '',
            english: response.data?.english || '',
            originalLanguage: response.data?.originalLanguage || 'en',
        };
    } catch (error) {
        console.error('Bilingual translation error:', error);
        return { arabic: '', english: '', originalLanguage: detectLanguage(text) };
    }
};

export { detectLanguage };

export default useTranslatedField;
