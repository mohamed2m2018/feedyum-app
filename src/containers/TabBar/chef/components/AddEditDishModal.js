// Library imports
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useQuery } from 'react-query';

// Local imports
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import ZInput from '../../../../components/common/ZInput';
import CategorySelectionModal from '../../../../components/modals/CategorySelectionModal';
import SectionInputModal from '../../../../components/modals/SectionInputModal';
import request from '../../../../api/request';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';

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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    categories: [],
    section: '',
    image: '',
    cookingTime: '',
    ingredients: '',
    visible: true,
  });

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
        description: dish.description || '',
        price: dish.price?.toString() || '',
        category: dish.category || '',
        categories: Array.isArray(dish.categories) ? dish.categories : (dish.category ? [dish.category] : []),
        section: dish.section?.name || dish.section || '',
        image: dish.image || '',
        cookingTime: dish.cookingTime?.toString() || '',
        ingredients: dish.ingredients || '',
        visible: dish.visible !== false,
      });
      setImageUri(dish.image || '');
    } else {
      // Reset form for new dish
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        categories: [],
        section: '',
        image: '',
        cookingTime: '',
        ingredients: '',
        visible: true,
      });
      setImageUri('');
    }
    setErrors({});
  }, [dish, visible]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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

    if (!formData.name.trim()) {
      newErrors.name = strings.dishNameRequired;
    }

    if (!formData.description.trim()) {
      newErrors.description = strings.descriptionRequired;
    }

    if (!formData.price.trim()) {
      newErrors.price = strings.priceRequired;
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = strings.validPriceRequired;
    }

    if ((!Array.isArray(formData.categories) || formData.categories.length === 0) && !formData.category.trim()) {
      newErrors.category = strings.categoryRequired;
    }

    if (!formData.section.trim()) {
      newErrors.section = strings.sectionRequired;
    }

    if (
      formData.cookingTime &&
      (isNaN(parseInt(formData.cookingTime)) ||
        parseInt(formData.cookingTime) < 0)
    ) {
      newErrors.cookingTime = strings.validCookingTime;
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
    };

    onSave(dishData);
  };

  const handleImagePicker = () => {
    Alert.alert(strings.selectImage, strings.chooseImageSelection, [
      { text: strings.camera, onPress: openCamera },
      { text: strings.gallery, onPress: openGallery },
      { text: strings.cancel, style: 'cancel' },
    ]);
  };

  const openCamera = () => {
    ImageCropPicker.openCamera({
      width: 800,
      height: 600,
      cropping: true,
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
      width: 800,
      height: 600,
      cropping: true,
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
              Dish Image
            </ZText>
            <TouchableOpacity
              style={[
                localStyles.imageContainer,
                { backgroundColor: colors.inputBg, borderColor: colors.bColor },
              ]}
              onPress={handleImagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={localStyles.dishImage} />
              ) : (
                <View style={localStyles.imagePlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={moderateScale(32)}
                    color={colors.grayScale7}
                  />
                  <ZText
                    type="M14"
                    color={colors.grayScale7}
                    style={localStyles.imageText}>
                    Tap to add image
                  </ZText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <ZInput
            label={strings.dishName}
            value={formData.name}
            onChangeText={text => updateFormData('name', text)}
            placeholder={strings.enterDishName}
            error={errors.name}
          />

          <ZInput
            label={strings.dishDescription}
            value={formData.description}
            onChangeText={text => updateFormData('description', text)}
            placeholder={strings.describeDish}
            multiline
            numberOfLines={3}
            error={errors.description}
          />

          <ZInput
            label={strings.priceEGP}
            value={formData.price}
            onChangeText={text => updateFormData('price', text)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.price}
          />

          {/* Category Picker (now supports multi-select) */}
          <PickerButton
            label={strings.category}
            value={(formData.categories && formData.categories.length > 0)
              ? formData.categories.join(', ')
              : formData.category}
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
            value={formData.cookingTime}
            onChangeText={text => updateFormData('cookingTime', text)}
            placeholder="15"
            keyboardType="numeric"
            error={errors.cookingTime}
          />

          <ZInput
            label={strings.ingredients}
            value={formData.ingredients}
            onChangeText={text => updateFormData('ingredients', text)}
            placeholder={strings.listMainIngredients}
            multiline
            numberOfLines={2}
          />

          {/* Visibility Toggle */}
          <View style={localStyles.visibilityContainer}>
            <ZText type="M14" color={colors.textColor}>
              Make dish visible to customers
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
            isLoading={isLoading}
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
});

export default AddEditDishModal;
