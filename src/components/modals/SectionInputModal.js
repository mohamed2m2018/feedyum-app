import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash/debounce';
import { moderateScale, getHeight } from '../../common/constants';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';
import ZInput from '../common/ZInput';
import strings from '../../i18n/strings';
import request from '../../api/request';

const { height: screenHeight } = Dimensions.get('window');

const SectionInputModal = ({
  visible,
  onClose,
  availableSections = [],
  onSelectSection,
  selectedSection = '',
  title = strings.selectSection,
  subtitle = strings.chooseSectionForDish,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [customSection, setCustomSection] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Translation states
  const [translatedName, setTranslatedName] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationEdited, setTranslationEdited] = useState(false);

  // Detect language from text
  const detectLanguage = useCallback((text) => {
    if (!text || typeof text !== 'string') return 'en';
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
    const arabicMatches = (text.match(arabicPattern) || []).length;
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
    return arabicMatches > 0 && arabicMatches >= latinMatches ? 'ar' : 'en';
  }, []);

  // Translate text to target language
  const translateText = useCallback(async (text, targetLang) => {
    if (!text || text.trim().length < 2) return '';
    try {
      const response = await request.post('/translate', {
        text: text.trim(),
        to: targetLang,
      });
      return response.data?.translation || '';
    } catch (error) {
      console.error('Section translation error:', error);
      return '';
    }
  }, []);

  // Debounced translation
  const debouncedTranslate = useCallback(
    debounce(async (name) => {
      if (!name || name.trim().length < 2 || translationEdited) {
        setIsTranslating(false);
        return;
      }
      setIsTranslating(true);
      const detectedLang = detectLanguage(name);
      const targetLang = detectedLang === 'ar' ? 'en' : 'ar';
      const translation = await translateText(name, targetLang);
      if (translation) {
        setTranslatedName(translation);
      }
      setIsTranslating(false);
    }, 700),
    [translationEdited, detectLanguage, translateText]
  );

  // Handle section name change
  const handleNameChange = useCallback((text) => {
    setCustomSection(text);
    setTranslationEdited(false);
    debouncedTranslate(text);
  }, [debouncedTranslate]);

  // Track keyboard height
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setCustomSection(selectedSection);
      setTranslatedName('');
      setTranslationEdited(false);
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
  }, [visible, selectedSection]);

  // Always show all sections - no filtering
  const filteredSections = useMemo(() => {
    return availableSections;
  }, [availableSections]);

  // Check if the typed section name is new (doesn't exist in available sections)
  const isNewSection = useMemo(() => {
    if (!customSection.trim()) return false;
    return !availableSections.some(section =>
      section.name.toLowerCase() === customSection.trim().toLowerCase()
    );
  }, [availableSections, customSection]);

  const handleSelectSection = (sectionName) => {
    setCustomSection(sectionName);
    // If selecting an existing section, show its existing translation
    const existing = availableSections.find(s => s.name === sectionName);
    if (existing) {
      const lang = detectLanguage(sectionName);
      setTranslatedName(lang === 'ar' ? (existing.nameEnglish || '') : (existing.nameArabic || ''));
      setTranslationEdited(true);
    } else {
      setTranslatedName('');
      setTranslationEdited(false);
      debouncedTranslate(sectionName);
    }
  };

  const handleConfirm = () => {
    if (customSection.trim()) {
      const detectedLang = detectLanguage(customSection.trim());
      onSelectSection(customSection.trim(), {
        nameArabic: detectedLang === 'ar' ? customSection.trim() : translatedName,
        nameEnglish: detectedLang === 'en' ? customSection.trim() : translatedName,
        originalLanguage: detectedLang,
      });
      onClose();
    }
  };

  const getSectionIcon = (sectionName) => {
    const iconMap = {
      'Appetizers': '🥗',
      'Main Courses': '🍽️',
      'Desserts': '🧁',
      'Beverages': '🥤',
      'Salads': '🥙',
      'Soups': '🍲',
      'Grilled': '🔥',
      'Fried': '🍟',
      'Healthy': '🥬',
      'Spicy': '🌶️',
      'Sweet': '🍯',
      'Vegan': '🌱',
      'Seafood': '🐟',
      'Meat': '🥩',
    };
    return iconMap[sectionName] || '📂';
  };

  const renderSectionItem = ({ item, index }) => {
    const isSelected = customSection === item.name;

    return (
      <TouchableOpacity
        style={[
          styles.sectionItem,
          {
            backgroundColor: isSelected ? colors.primary + '20' : colors.backgroundColor,
            borderColor: isSelected ? colors.primary : colors.bColor,
          }
        ]}
        onPress={() => handleSelectSection(item.name)}
        activeOpacity={0.7}>
        <View style={styles.sectionContent}>
          <View style={styles.sectionIconContainer}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: isSelected ? colors.primary + '30' : colors.primary + '10',
                }
              ]}>
              <ZText
                type="B16"
                color={colors.primary}
                style={styles.sectionEmoji}>
                {getSectionIcon(item.name)}
              </ZText>
            </View>
          </View>

          <View style={styles.sectionTextContainer}>
            <ZText
              type={isSelected ? "B16" : "M16"}
              color={isSelected ? colors.primary : colors.textColor}
              style={styles.sectionName}>
              {item.name}
            </ZText>
            {item.description && (
              <ZText
                type="R12"
                color={colors.grayScale7}
                style={styles.sectionDescription}>
                {item.description}
              </ZText>
            )}
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={colors.primary}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <View style={[styles.overlay, { backgroundColor: colors.black + '50' }]}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.backgroundColor,
                transform: [{ translateY: slideAnim }],
                height: keyboardHeight > 0
                  ? screenHeight - keyboardHeight - moderateScale(50)
                  : screenHeight * 0.80,
              }
            ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.bColor }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={colors.grayScale7}
                />
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <ZText type="B20" color={colors.textColor} style={styles.title}>
                  {title}
                </ZText>
                <ZText type="R14" color={colors.grayScale7} style={styles.subtitle}>
                  {subtitle}
                </ZText>
              </View>
            </View>

            {/* Custom Input - Fixed at top */}
            <View style={styles.inputContainer}>
              <ZText type="M14" color={colors.textColor} style={styles.inputLabel}>
                {strings.sectionName || "Section Name"}
              </ZText>
              <View style={[styles.textInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: colors.textColor,
                    }
                  ]}
                  placeholder={strings.enterSectionName || "Enter section name or choose from below"}
                  placeholderTextColor={colors.grayScale7}
                  value={customSection}
                  onChangeText={handleNameChange}
                  returnKeyType="done"
                  autoCapitalize="words"
                />
                {customSection.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { setCustomSection(''); setTranslatedName(''); setTranslationEdited(false); }}
                    style={styles.clearInputButton}>
                    <Ionicons
                      name="close-circle"
                      size={moderateScale(18)}
                      color={colors.grayScale7}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Translation Field */}
              {customSection && customSection.length >= 2 && (
                <View style={styles.translationContainer}>
                  <View style={styles.translationHeader}>
                    <ZText type="M12" color={colors.grayScale7}>
                      {detectLanguage(customSection) === 'ar'
                        ? (strings.englishTranslation || 'English Translation')
                        : (strings.arabicTranslation || 'Arabic Translation')}
                    </ZText>
                    {isTranslating && (
                      <View style={styles.translatingBadge}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <ZText type="R10" color={colors.primary} style={{ marginLeft: 4 }}>
                          {strings.translating}
                        </ZText>
                      </View>
                    )}
                  </View>
                  <View style={[styles.textInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textColor }]}
                      placeholder={strings.translatedName || 'Translated name'}
                      placeholderTextColor={colors.grayScale7}
                      value={translatedName}
                      onChangeText={(text) => { setTranslatedName(text); setTranslationEdited(true); }}
                    />
                  </View>
                  {!isTranslating && translatedName ? (
                    <ZText type="R10" color={colors.grayScale6} style={styles.translationHint}>
                      {strings.autoTranslated}
                    </ZText>
                  ) : null}
                </View>
              )}
            </View>

            {/* Sections List */}
            <View style={styles.listContainer}>
              <View style={styles.sectionHeaderContainer}>
                <ZText type="M16" color={colors.textColor} style={styles.sectionHeader}>
                  {strings.availableSections || "Available Sections"}
                </ZText>
                <ZText type="R12" color={colors.grayScale7}>
                  {filteredSections.length} {strings.sections || "sections"}
                </ZText>
              </View>

              <FlatList
                data={filteredSections}
                renderItem={renderSectionItem}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={
                  isNewSection ? (
                    <TouchableOpacity
                      style={[
                        styles.createNewSectionItem,
                        {
                          backgroundColor: colors.primary + '15',
                          borderColor: colors.primary,
                        }
                      ]}
                      onPress={handleConfirm}
                      activeOpacity={0.7}>
                      <View style={styles.sectionContent}>
                        <View style={styles.sectionIconContainer}>
                          <View
                            style={[
                              styles.sectionIcon,
                              {
                                backgroundColor: colors.primary + '30',
                              }
                            ]}>
                            <Ionicons
                              name="add-circle"
                              size={moderateScale(20)}
                              color={colors.primary}
                            />
                          </View>
                        </View>

                        <View style={styles.sectionTextContainer}>
                          <ZText
                            type="B16"
                            color={colors.primary}
                            style={styles.sectionName}>
                            {strings.createNewSection || "Create new section"}
                          </ZText>
                          <ZText
                            type="R12"
                            color={colors.primary}
                            style={styles.sectionDescription}>
                            "{customSection.trim()}"
                          </ZText>
                        </View>

                        <View style={styles.selectedIndicator}>
                          <Ionicons
                            name="arrow-forward-circle"
                            size={moderateScale(20)}
                            color={colors.primary}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="folder-outline"
                      size={moderateScale(48)}
                      color={colors.grayScale5}
                    />
                    <ZText type="B16" color={colors.grayScale7} style={styles.emptyTitle}>
                      {customSection.trim() ?
                        (strings.createNewSection || "Create new section") :
                        (strings.noSectionsFound || "No sections found")
                      }
                    </ZText>
                    <ZText type="R14" color={colors.grayScale5} style={styles.emptySubtitle}>
                      {customSection.trim() ?
                        (strings.newSectionWillBeCreated || "This will create a new section") :
                        (strings.startTypingSection || "Start typing to create a section")
                      }
                    </ZText>
                  </View>
                }
              />
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonContainer, { borderTopColor: colors.bColor }]}>
              <View style={styles.buttonRow}>
                <ZButton
                  title={strings.cancel}
                  color={colors.grayScale7}
                  textType="B16"
                  onPress={onClose}
                  containerStyle={[styles.button, styles.cancelButton, { backgroundColor: colors.grayScale1 }]}
                />
                <ZButton
                  title={strings.confirm || "Confirm"}
                  color={colors.white}
                  textType="B16"
                  onPress={handleConfirm}
                  disabled={!customSection.trim()}
                  containerStyle={[
                    styles.button,
                    styles.confirmButton,
                    {
                      backgroundColor: customSection.trim() ? colors.primary : colors.grayScale5,
                    }
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: moderateScale(32),
  },
  title: {
    marginBottom: moderateScale(4),
  },
  subtitle: {
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
  },
  inputLabel: {
    marginBottom: moderateScale(8),
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    padding: 0,
  },
  clearInputButton: {
    marginLeft: moderateScale(8),
  },
  listContainer: {
    flex: 1,
    paddingTop: moderateScale(8),
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  sectionHeader: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  sectionItem: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  createNewSectionItem: {
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: moderateScale(12),
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
  },
  sectionIconContainer: {
    marginRight: moderateScale(12),
  },
  sectionIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: {
    fontSize: moderateScale(16),
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionName: {
    marginBottom: moderateScale(2),
  },
  sectionDescription: {
    lineHeight: moderateScale(16),
  },
  selectedIndicator: {
    marginLeft: moderateScale(12),
  },
  separator: {
    height: moderateScale(8),
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
    paddingVertical: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  buttonContainer: {
    borderTopWidth: 1,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  button: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
  },
  cancelButton: {
    marginRight: moderateScale(6),
  },
  confirmButton: {
    marginLeft: moderateScale(6),
  },
  translationContainer: {
    marginTop: moderateScale(10),
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  translatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translationHint: {
    marginTop: moderateScale(4),
    textAlign: 'right',
  },
});

export default SectionInputModal;
