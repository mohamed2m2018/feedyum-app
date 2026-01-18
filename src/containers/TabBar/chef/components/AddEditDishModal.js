// Library imports
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { showActionDialog } from '../../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useQuery } from 'react-query';
import debounce from 'lodash/debounce';

// Local imports
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import ZInput from '../../../../components/common/ZInput';
import CategorySelectionModal from '../../../../components/modals/CategorySelectionModal';
import SectionInputModal from '../../../../components/modals/SectionInputModal';
import request from '../../../../api/request';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';

// Helper function to translate category name based on current language
const translateCategoryName = (englishName) => {
  if (!englishName) return '';

  // Create a key from the English name (e.g., "Main Course" -> "categoryMainCourse")
  const key = 'category' + englishName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z]/g, '');

  // Return translated string if available, otherwise return original
  return strings[key] || englishName;
};

// PickerButton component moved outside to avoid React warning
const PickerButton = ({ label, value, onPress, error, colors }) => (
  <View style={localStyles.pickerContainer}>
    <ZText type="M14" color={colors.textColor} style={localStyles.label}>
      {label} *
    </ZText>
    <TouchableOpacity
      style={[
        localStyles.pickerButton,
        {
          backgroundColor: colors.inputBg,
          borderColor: error ? colors.redColor : colors.bColor,
        },
      ]}
      onPress={onPress}>
      <ZText type="M16" color={value ? colors.textColor : colors.grayScale7}>
        {value || strings.formatString(strings.selectLabel, label.toLowerCase())}
      </ZText>
      <Ionicons
        name="chevron-down-outline"
        size={moderateScale(20)}
        color={colors.grayScale7}
      />
    </TouchableOpacity>
    {error && (
      <ZText type="R12" color={colors.redColor} style={localStyles.errorText}>
        {error}
      </ZText>
    )}
  </View>
);

const AddEditDishModal = ({
  visible,
  onClose,
  dish = null,
  onSave,
  isLoading = false,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const isEditing = !!dish;

  // Form state with bilingual fields
  const [formData, setFormData] = useState({
    name: '',
    nameArabic: '',
    nameEnglish: '',
    description: '',
    descriptionArabic: '',
    descriptionEnglish: '',
    price: '',
    category: '',
    categories: [],
    section: '',
    sectionNameArabic: '',
    sectionNameEnglish: '',
    image: '',
    cookingTime: '',
    ingredients: '',
    visible: true,
  });

  // Translation states
  const [isTranslatingName, setIsTranslatingName] = useState(false);
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
  const [nameTranslationEdited, setNameTranslationEdited] = useState(false);
  const [descTranslationEdited, setDescTranslationEdited] = useState(false);

  const [errors, setErrors] = useState({});
  const [imageUri, setImageUri] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Fetch current user first
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const userId = userData?.data?.user?._id;

  // Fetch categories and sections - using real API calls
  const { data: categoriesData } = useQuery('categories', async () => {
    // Fetch categories from real API
    const response = await request.get('/categories');
    return response.data;
  });

  const { data: sectionsData } = useQuery(
    ['menuSections', userId],
    async () => {
      try {
        // Fetch sections from real API
        const response = await request.get(`/sections/chef/${userId}`);
        return response.data;
      } catch (error) {
        // If sections endpoint fails, return empty array (will use defaults)
        return [];
      }
    },
    {
      enabled: !!userId,
    },
  );

  // State for managing custom sections
  const [customSections, setCustomSections] = useState([]);

  // Only use sections from API (which now only returns sections with dishes)
  // No default sections fallback - only show sections the chef has actually used
  const apiSections = sectionsData || [];

  // Combine API sections with custom sections, avoiding duplicates
  const availableSections = [
    ...apiSections,
    ...customSections.filter(customSection =>
      !apiSections.some(apiSection => apiSection.name.toLowerCase() === customSection.name.toLowerCase())
    )
  ];

  // Initialize form data when dish prop changes
  useEffect(() => {
    if (dish) {
      setFormData({
        name: dish.name || '',
        nameArabic: dish.nameArabic || '',
        nameEnglish: dish.nameEnglish || '',
        description: dish.description || '',
        descriptionArabic: dish.descriptionArabic || '',
        descriptionEnglish: dish.descriptionEnglish || '',
        price: dish.price?.toString() || '',
        category: dish.category || '',
        categories: Array.isArray(dish.categories) ? dish.categories : (dish.category ? [dish.category] : []),
        section: dish.section?.name || dish.section || '',
        sectionNameArabic: dish.section?.nameArabic || '',
        sectionNameEnglish: dish.section?.nameEnglish || '',
        image: dish.image || '',
        cookingTime: dish.cookingTime?.toString() || '',
        ingredients: dish.ingredients || '',
        visible: dish.visible !== false,
      });
      setImageUri(dish.image || '');
      // Reset translation states for editing
      setNameTranslationEdited(true);
      setDescTranslationEdited(true);
    } else {
      // Reset form for new dish
      setFormData({
        name: '',
        nameArabic: '',
        nameEnglish: '',
        description: '',
        descriptionArabic: '',
        descriptionEnglish: '',
        price: '',
        category: '',
        categories: [],
        section: '',
        sectionNameArabic: '',
        sectionNameEnglish: '',
        image: '',
        cookingTime: '',
        ingredients: '',
        visible: true,
      });
      setImageUri('');
      setNameTranslationEdited(false);
      setDescTranslationEdited(false);
    }
    setErrors({});
    setIsTranslatingName(false);
    setIsTranslatingDesc(false);
  }, [dish, visible]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Detect language from text (Arabic vs English)
  const detectLanguage = useCallback((text) => {
    if (!text || typeof text !== 'string') return 'en';
    // Use global flag (g) to count all matches
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
    const arabicMatches = (text.match(arabicPattern) || []).length;
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
    // If any Arabic, prioritize Arabic detection (for mixed content)
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
      console.error('Translation error:', error);
      return '';
    }
  }, []);

  // Debounced name translation
  const debouncedTranslateName = useCallback(
    debounce(async (name) => {
      if (!name || name.trim().length < 2 || nameTranslationEdited) {
        setIsTranslatingName(false);
        return;
      }
      setIsTranslatingName(true);
      const detectedLang = detectLanguage(name);
      const targetLang = detectedLang === 'ar' ? 'en' : 'ar';
      const translation = await translateText(name, targetLang);

      if (translation) {
        setFormData(prev => ({
          ...prev,
          nameArabic: detectedLang === 'ar' ? name : translation,
          nameEnglish: detectedLang === 'en' ? name : translation,
        }));
      }
      setIsTranslatingName(false);
    }, 700),
    [nameTranslationEdited, detectLanguage, translateText]
  );

  // Debounced description translation
  const debouncedTranslateDesc = useCallback(
    debounce(async (description) => {
      if (!description || description.trim().length < 5 || descTranslationEdited) {
        setIsTranslatingDesc(false);
        return;
      }
      setIsTranslatingDesc(true);
      const detectedLang = detectLanguage(description);
      const targetLang = detectedLang === 'ar' ? 'en' : 'ar';
      const translation = await translateText(description, targetLang);

      if (translation) {
        setFormData(prev => ({
          ...prev,
          descriptionArabic: detectedLang === 'ar' ? description : translation,
          descriptionEnglish: detectedLang === 'en' ? description : translation,
        }));
      }
      setIsTranslatingDesc(false);
    }, 700),
    [descTranslationEdited, detectLanguage, translateText]
  );

  // Handle name change with translation
  const handleNameChange = useCallback((text) => {
    updateFormData('name', text);
    setNameTranslationEdited(false);
    debouncedTranslateName(text);
  }, [debouncedTranslateName]);

  // Handle description change with translation
  const handleDescriptionChange = useCallback((text) => {
    updateFormData('description', text);
    setDescTranslationEdited(false);
    debouncedTranslateDesc(text);
  }, [debouncedTranslateDesc]);

  // Handle manual edit of translated name
  const handleTranslatedNameChange = useCallback((text, isArabic) => {
    setNameTranslationEdited(true);
    if (isArabic) {
      updateFormData('nameArabic', text);
    } else {
      updateFormData('nameEnglish', text);
    }
  }, []);

  // Handle manual edit of translated description
  const handleTranslatedDescChange = useCallback((text, isArabic) => {
    setDescTranslationEdited(true);
    if (isArabic) {
      updateFormData('descriptionArabic', text);
    } else {
      updateFormData('descriptionEnglish', text);
    }
  }, []);

  const handleSectionSelection = (sectionName) => {
    updateFormData('section', sectionName);

    // Add to custom sections if it's not already in available sections
    const existingSection = availableSections.find(section =>
      section.name.toLowerCase() === sectionName.toLowerCase()
    );

    if (!existingSection) {
      const newSection = {
        name: sectionName,
        description: `Custom section: ${sectionName}`
      };
      setCustomSections(prev => [...prev, newSection]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Image validation
    if (!imageUri && !formData.image) {
      newErrors.image = strings.dishImageRequired || 'Dish image is required';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = strings.dishNameRequired;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = strings.dishNameTooShort || 'Dish name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = strings.dishNameTooLong || 'Dish name must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = strings.descriptionRequired;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = strings.descriptionTooShort || 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = strings.descriptionTooLong || 'Description must be less than 500 characters';
    }

    // Price validation
    if (!formData.price.trim()) {
      newErrors.price = strings.priceRequired;
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = strings.validPriceRequired;
    } else if (parseFloat(formData.price) > 99999) {
      newErrors.price = strings.priceTooHigh || 'Price cannot exceed 99,999 EGP';
    }

    // Category validation
    if ((!Array.isArray(formData.categories) || formData.categories.length === 0) && !formData.category.trim()) {
      newErrors.category = strings.categoryRequired;
    }

    // Section validation
    if (!formData.section.trim()) {
      newErrors.section = strings.sectionRequired;
    }

    // Cooking time validation (optional but must be valid if provided)
    if (formData.cookingTime) {
      const cookingTimeNum = parseInt(formData.cookingTime);
      if (isNaN(cookingTimeNum) || cookingTimeNum < 0) {
        newErrors.cookingTime = strings.validCookingTime;
      } else if (cookingTimeNum > 480) {
        newErrors.cookingTime = strings.cookingTimeTooLong || 'Cooking time cannot exceed 8 hours (480 minutes)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const dishData = {
      ...formData,
      price: parseFloat(formData.price),
      cookingTime: formData.cookingTime
        ? parseInt(formData.cookingTime)
        : undefined,
      image: imageUri || formData.image,
      // Ensure both single and multi are present for backward compatibility
      category: formData.category || formData.categories?.[0] || '',
      categories: formData.categories || (formData.category ? [formData.category] : []),
      // Bilingual fields
      nameArabic: formData.nameArabic || '',
      nameEnglish: formData.nameEnglish || '',
      descriptionArabic: formData.descriptionArabic || '',
      descriptionEnglish: formData.descriptionEnglish || '',
      // Section bilingual names
      sectionNameArabic: formData.sectionNameArabic || '',
      sectionNameEnglish: formData.sectionNameEnglish || '',
    };

    onSave(dishData);
  };

  const handleImagePicker = () => {
    showActionDialog({
      type: ALERT_TYPE.INFO,
      title: strings.selectImage,
      message: strings.chooseImageSelection,
      confirmText: strings.camera,
      cancelText: strings.gallery,
      onConfirm: openCamera,
      onCancel: openGallery,
    });
  };

  const openCamera = () => {
    ImageCropPicker.openCamera({
      compressImageQuality: 0.8,
      mediaType: 'photo',
    })
      .then(image => {
        setImageUri(image.path);
      })
      .catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
        }
      });
  };

  const openGallery = () => {
    ImageCropPicker.openPicker({
      compressImageQuality: 0.8,
      mediaType: 'photo',
    })
      .then(image => {
        setImageUri(image.path);
      })
      .catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
        }
      });
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View
        style={[
          localStyles.container,
          { backgroundColor: colors.backgroundColor },
        ]}>
        {/* Header */}
        <View style={localStyles.header}>
          <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
            <Ionicons
              name="close"
              size={moderateScale(24)}
              color={colors.textColor}
            />
          </TouchableOpacity>
          <ZText type="B20" style={localStyles.headerTitle}>
            {isEditing ? strings.editDish : strings.addNewDish}
          </ZText>
          <View style={localStyles.placeholder} />
        </View>

        <ScrollView
          style={localStyles.content}
          showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={localStyles.imageSection}>
            <ZText
              type="M14"
              color={colors.textColor}
              style={localStyles.label}>
              {strings.dishImage || 'Dish Image'} *
            </ZText>
            <TouchableOpacity
              style={[
                localStyles.imageContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: errors.image ? colors.redColor : colors.bColor,
                },
              ]}
              onPress={handleImagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={localStyles.dishImage} />
              ) : (
                <View style={localStyles.imagePlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={moderateScale(32)}
                    color={errors.image ? colors.redColor : colors.grayScale7}
                  />
                  <ZText
                    type="M14"
                    color={errors.image ? colors.redColor : colors.grayScale7}
                    style={localStyles.imageText}>
                    {strings.tapToAddImage || 'Tap to add image'}
                  </ZText>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && (
              <ZText type="R12" color={colors.redColor} style={localStyles.imageErrorText}>
                {errors.image}
              </ZText>
            )}
          </View>

          {/* Form Fields */}
          {/* Primary Name Input */}
          <ZInput
            label={strings.dishName}
            _value={formData.name}
            toGetTextFieldValue={handleNameChange}
            placeHolder={strings.enterNameInYourLanguage || 'Enter dish name in your language'}
            _errorText={errors.name}
          />

          {/* Translated Name (Auto-generated, Editable) */}
          {formData.name && formData.name.length >= 2 && (
            <View style={localStyles.translationContainer}>
              <View style={localStyles.translationHeader}>
                <ZText type="M12" color={colors.grayScale7}>
                  {detectLanguage(formData.name) === 'ar'
                    ? (strings.englishTranslation || 'English Translation')
                    : (strings.arabicTranslation || 'Arabic Translation')}
                </ZText>
                {isTranslatingName && (
                  <View style={localStyles.translatingBadge}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <ZText type="R10" color={colors.primary} style={{ marginLeft: 4 }}>
                      {strings.translating}
                    </ZText>
                  </View>
                )}
              </View>
              <ZInput
                _value={detectLanguage(formData.name) === 'ar'
                  ? formData.nameEnglish
                  : formData.nameArabic}
                toGetTextFieldValue={(text) => handleTranslatedNameChange(
                  text,
                  detectLanguage(formData.name) !== 'ar'
                )}
                placeHolder={strings.translatedName || 'Translated name'}
                inputContainerStyle={localStyles.translatedInput}
              />
              {!isTranslatingName && (formData.nameArabic || formData.nameEnglish) && (
                <ZText type="R10" color={colors.grayScale6} style={localStyles.translationHint}>
                  {strings.autoTranslated}
                </ZText>
              )}
            </View>
          )}

          {/* Primary Description Input */}
          <ZInput
            label={strings.dishDescription}
            _value={formData.description}
            toGetTextFieldValue={handleDescriptionChange}
            placeHolder={strings.describeDish}
            multiline
            numberOfLines={3}
            _errorText={errors.description}
          />

          {/* Translated Description (Auto-generated, Editable) */}
          {formData.description && formData.description.length >= 5 && (
            <View style={localStyles.translationContainer}>
              <View style={localStyles.translationHeader}>
                <ZText type="M12" color={colors.grayScale7}>
                  {detectLanguage(formData.description) === 'ar'
                    ? (strings.englishTranslation || 'English Translation')
                    : (strings.arabicTranslation || 'Arabic Translation')}
                </ZText>
                {isTranslatingDesc && (
                  <View style={localStyles.translatingBadge}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <ZText type="R10" color={colors.primary} style={{ marginLeft: 4 }}>
                      {strings.translating}
                    </ZText>
                  </View>
                )}
              </View>
              <ZInput
                _value={detectLanguage(formData.description) === 'ar'
                  ? formData.descriptionEnglish
                  : formData.descriptionArabic}
                toGetTextFieldValue={(text) => handleTranslatedDescChange(
                  text,
                  detectLanguage(formData.description) !== 'ar'
                )}
                placeHolder={strings.translatedDescription || 'Translated description'}
                multiline
                numberOfLines={2}
                inputContainerStyle={localStyles.translatedInput}
              />
              {!isTranslatingDesc && (formData.descriptionArabic || formData.descriptionEnglish) && (
                <ZText type="R10" color={colors.grayScale6} style={localStyles.translationHint}>
                  {strings.autoTranslated}
                </ZText>
              )}
            </View>
          )}

          <ZInput
            label={strings.priceEGP}
            _value={formData.price}
            toGetTextFieldValue={text => updateFormData('price', text)}
            placeHolder="0.00"
            keyBoardType="decimal-pad"
            _errorText={errors.price}
          />

          {/* Category Picker (now supports multi-select) */}
          <PickerButton
            label={strings.category}
            value={(formData.categories && formData.categories.length > 0)
              ? formData.categories.map(translateCategoryName).join(', ')
              : translateCategoryName(formData.category)}
            error={errors.category}
            colors={colors}
            onPress={() => setShowCategoryModal(true)}
          />

          {/* Section Picker */}
          <PickerButton
            label={strings.section}
            value={formData.section}
            error={errors.section}
            colors={colors}
            onPress={() => setShowSectionModal(true)}
          />

          <ZInput
            label={strings.cookingTimeMinutes}
            _value={formData.cookingTime}
            toGetTextFieldValue={text => updateFormData('cookingTime', text)}
            placeHolder="15"
            keyBoardType="numeric"
            _errorText={errors.cookingTime}
          />

          <ZInput
            label={strings.ingredients}
            _value={formData.ingredients}
            toGetTextFieldValue={text => updateFormData('ingredients', text)}
            placeHolder={strings.listMainIngredients}
            multiline
            numberOfLines={2}
          />

          {/* Visibility Toggle */}
          <View style={localStyles.visibilityContainer}>
            <ZText type="M14" color={colors.textColor}>
              {strings.makeDishVisible || 'Make dish visible to customers'}
            </ZText>
            <TouchableOpacity
              style={[
                localStyles.toggleButton,
                {
                  backgroundColor: formData.visible
                    ? colors.primary
                    : colors.grayScale4,
                },
              ]}
              onPress={() => updateFormData('visible', !formData.visible)}>
              <View
                style={[
                  localStyles.toggleThumb,
                  {
                    backgroundColor: colors.white,
                    transform: [
                      { translateX: formData.visible ? moderateScale(20) : 0 },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={localStyles.footer}>
          <ZButton
            title={strings.cancel}
            onPress={onClose}
            textType="M16"
            color={colors.textColor}
            bgColor={colors.inputBg}
            containerStyle={[localStyles.button, localStyles.cancelButton]}
          />
          <ZButton
            title={isEditing ? strings.updateDish : strings.addDish}
            onPress={handleSave}
            textType="M16"
            color={colors.white}
            containerStyle={[localStyles.button, localStyles.saveButton]}
            disabled={isLoading}
          />
        </View>
      </View>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categoriesData || []}
        // multi-select enabled
        multiSelect
        selectedCategories={formData.categories}
        selectedCategory={formData.category}
        onToggleCategory={(category) => {
          const name = category.name;
          setFormData(prev => {
            const current = Array.isArray(prev.categories) ? prev.categories : [];
            const exists = current.includes(name);
            const next = exists ? current.filter(c => c !== name) : [...current, name];
            return {
              ...prev,
              categories: next,
              category: next[0] || '',
            };
          });
        }}
        onDone={() => setShowCategoryModal(false)}
        onSelectCategory={(category) => updateFormData('category', category.name)}
        title={strings.selectCategory}
        subtitle={strings.chooseCategoryForDish}
      />

      {/* Section Input Modal */}
      <SectionInputModal
        visible={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        availableSections={availableSections || []}
        onSelectSection={handleSectionSelection}
        selectedSection={formData.section}
        title={strings.selectSection}
        subtitle={strings.chooseSectionForDish}
      />
      {/* Full Screen Loading Overlay */}
      {isLoading && (
        <View style={localStyles.loadingOverlay}>
          <View style={localStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ZText type="M16" color={colors.white} style={localStyles.loadingText}>
              {isEditing ? (strings.updatingDish || 'Updating dish...') : (strings.addingDish || 'Adding dish...')}
            </ZText>
          </View>
        </View>
      )}
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: moderateScale(32),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  imageSection: {
    marginVertical: moderateScale(20),
  },
  label: {
    marginBottom: moderateScale(8),
  },
  imageContainer: {
    height: moderateScale(200),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    marginTop: moderateScale(8),
  },
  pickerContainer: {
    marginBottom: moderateScale(16),
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  errorText: {
    marginTop: moderateScale(4),
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: moderateScale(20),
  },
  toggleButton: {
    width: moderateScale(50),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(2),
  },
  toggleThumb: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: moderateScale(12),
  },
  button: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    // Primary button styling is handled by ZButton
  },
  imageErrorText: {
    marginTop: moderateScale(4),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: moderateScale(40),
    paddingVertical: moderateScale(30),
    borderRadius: moderateScale(16),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  // Translation UI Styles
  translationContainer: {
    marginTop: moderateScale(-8),
    marginBottom: moderateScale(8),
    paddingLeft: moderateScale(12),
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(4),
  },
  translatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatedInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderStyle: 'dashed',
  },
  translationHint: {
    marginTop: moderateScale(2),
    marginLeft: moderateScale(4),
    fontStyle: 'italic',
  },
});

export default AddEditDishModal;
