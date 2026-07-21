// Library imports
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useNavigationState, useRoute } from '@react-navigation/native';
import { StackNav } from '../../../navigation/NavigationKeys';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { showSuccessToast, showErrorToast, showActionDialog } from '../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import ZButton from '../../../components/common/ZButton';
import DishCard from './components/DishCard';
import AddEditDishModal from './components/AddEditDishModal';
import ChefDishPreviewModal from './components/ChefDishPreviewModal';
import MenuUploadModal from './components/MenuUploadModal';
import { useChefSocket } from './hooks/useChefSocket';
import { useBackgroundUpload } from '../../../providers/BackgroundUploadProvider';
import request from '../../../api/request';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import { uploadImageToS3 } from '../../../utils/UploadUtils';
import { getLocalizedText } from '../../../utils/helpers';
import { useStorage } from '../../../utils/useStorage';

const IMPERSONATION_SESSION_KEY = 'impersonation_session';

// Components moved outside to avoid React warnings
const SectionTab = ({ section, isSelected, onPress, colors }) => (
  <TouchableOpacity
    style={[
      localStyles.sectionTab,
      {
        backgroundColor: isSelected ? colors.primary : colors.inputBg,
        borderColor: isSelected ? colors.primary : colors.bColor,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.8}>
    <ZText type="M14" color={isSelected ? colors.white : colors.textColor}>
      {section.name || section}
    </ZText>
  </TouchableOpacity>
);

const OnboardingStep = ({ number, icon, title, description, colors }) => (
  <View style={localStyles.onboardingStep}>
    <View style={[localStyles.stepNumberCircle, { backgroundColor: colors.primary }]}>
      <ZText type="B16" color={colors.white}>{number}</ZText>
    </View>
    <View style={localStyles.stepContent}>
      <View style={localStyles.stepHeader}>
        <Ionicons name={icon} size={moderateScale(20)} color={colors.primary} />
        <ZText type="B16" color={colors.textColor} style={localStyles.stepTitle}>
          {title}
        </ZText>
      </View>
      <ZText type="M14" color={colors.grayScale7} style={localStyles.stepDesc}>
        {description}
      </ZText>
    </View>
  </View>
);

const SubmittedBanner = ({ colors }) => (
  <View style={[localStyles.submittedBanner, { backgroundColor: colors.inputBg }]}>
    <Ionicons name="checkmark-circle" size={moderateScale(40)} color="#4CAF50" />
    <ZText type="B18" color={colors.textColor} style={localStyles.submittedTitle}>
      {strings.menuSubmitted}
    </ZText>
    <ZText type="M14" color={colors.grayScale7} style={localStyles.submittedDesc}>
      {strings.menuSubmittedDesc}
    </ZText>
  </View>
);

const EmptyState = ({ searchQuery, colors, onAddDish, onUploadMenu, hasSubmittedMenu }) => (
  <ScrollView
    contentContainerStyle={localStyles.emptyContainer}
    showsVerticalScrollIndicator={false}>
    {searchQuery ? (
      <>
        <Ionicons
          name="search-outline"
          size={moderateScale(64)}
          color={colors.grayScale4}
        />
        <ZText type="B18" color={colors.grayScale7} style={localStyles.emptyTitle}>
          {strings.noDishesFound}
        </ZText>
        <ZText type="M14" color={colors.grayScale7} style={localStyles.emptySubtitle}>
          {strings.tryAdjustingSearch}
        </ZText>
      </>
    ) : (
      <>
        {/* PRIMARY: Upload menu (Talabat style) */}
        {hasSubmittedMenu ? (
          <SubmittedBanner colors={colors} />
        ) : (
          <View style={[localStyles.uploadHero, { backgroundColor: colors.inputBg }]}>
            <View style={[localStyles.uploadIconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="cloud-upload-outline" size={moderateScale(40)} color={colors.primary} />
            </View>
            <ZText type="B20" color={colors.textColor} style={localStyles.uploadHeroTitle}>
              {strings.menuUploadTitle}
            </ZText>
            <ZText type="M14" color={colors.grayScale7} style={localStyles.uploadHeroDesc}>
              {strings.uploadMenuInsteadDesc}
            </ZText>
            <ZButton
              title={strings.uploadMenuButton}
              textType={'b18'}
              color={colors.white}
              containerStyle={localStyles.uploadHeroBtn}
              frontIcon={
                <Ionicons
                  name="camera-outline"
                  size={moderateScale(20)}
                  color={colors.white}
                  style={{ marginRight: moderateScale(8) }}
                />
              }
              onPress={onUploadMenu}
            />
          </View>
        )}

        <ZButton
          title={strings.addDishesManually}
          textType={'b16'}
          color={colors.textColor}
          containerStyle={[localStyles.manualAddBtn, { borderColor: colors.bColor }]}
          bgColor="transparent"
          frontIcon={
            <Ionicons
              name="add"
              size={moderateScale(18)}
              color={colors.textColor}
              style={{ marginRight: moderateScale(8) }}
            />
          }
          onPress={onAddDish}
        />
      </>
    )}
  </ScrollView>
);

export default function MenuManagement() {
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const { uploadDish } = useBackgroundUpload();
  const navigation = useNavigation();
  const route = useRoute();
  const fromTabsParam = !!route?.params?.fromTabs;
  const isFromTabBar = useNavigationState(state => {
    try {
      const prevRoute = state?.routes?.[state?.index - 1];
      return prevRoute?.name === StackNav.TabBar;
    } catch (e) {
      return false;
    }
  });

  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  // Dish details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  // Menu upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [impersonationSession] = useStorage(IMPERSONATION_SESSION_KEY);
  const impersonatedUserId = impersonationSession?.targetUserId?.toString?.() || impersonationSession?.targetUserId;

  // Helper function to ensure chef has a menu (no default sections)
  const ensureMenu = async () => {
    try {
      // Try to get existing menu
      let menuResponse;
      try {
        menuResponse = await request.get(`/menus/chef/${userId}`);
      } catch (error) {
        // If menu doesn't exist, create one
        if (
          error?.response?.status === 404 ||
          error?.message?.includes('Menu not found')
        ) {
          menuResponse = await request.post('/menus', {
            name: 'My Restaurant Menu',
            description: 'Welcome to my restaurant!',
          });
        } else {
          throw error;
        }
      }

      // Backend returns a single menu object
      const menuId = menuResponse.data?._id;

      if (!menuId) {
        throw new Error('Menu ID not found in response');
      }

      return menuId;
    } catch (error) {
      throw error;
    }
  };

  // Mutations for CRUD operations - using real API calls
  const createDishMutation = useMutation(
    async dishData => {
      // Ensure chef has a menu
      const menuId = await ensureMenu();

      // Ensure all required fields are present and valid
      const needsPrice = dishData.pricingType !== 'upon_request';
      if (
        !dishData.name ||
        !dishData.description ||
        (needsPrice && !dishData.price) ||
        !dishData.category ||
        !dishData.section
      ) {
        throw new Error(
          'Missing required fields: name, description, price, category, or section',
        );
      }

      if (!menuId) {
        throw new Error('Menu ID is required but not found');
      }

      if (!userId) {
        throw new Error('User ID is required but not found');
      }

      // Upload image to S3 if it's a local file path
      let imageUrl = dishData.image || '';
      if (imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('/'))) {
        try {
          const uploadResult = await uploadImageToS3(imageUrl);
          if (uploadResult.success && uploadResult.url) {
            imageUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Failed to upload dish image:', uploadError);
          // Continue without image if upload fails
          imageUrl = '';
        }
      }

      // Send fields the controller expects (now with multi-categories)
      const requestData = {
        name: dishData.name.trim(),
        description: dishData.description.trim(),
        price: parseFloat(dishData.price),
        category: (dishData.category || '').trim(),
        categories: Array.isArray(dishData.categories) ? dishData.categories : ((dishData.category && dishData.category.trim()) ? [dishData.category.trim()] : []),
        sectionName: dishData.section.trim(),
        menuId: menuId,
        image: imageUrl,
        // Enhanced fields
        ingredients: dishData.ingredients,
        preparationTime: dishData.preparationTime,
        optionGroups: dishData.optionGroups,
        // Bilingual fields
        nameArabic: dishData.nameArabic,
        nameEnglish: dishData.nameEnglish,
        descriptionArabic: dishData.descriptionArabic,
        descriptionEnglish: dishData.descriptionEnglish,
        sectionNameArabic: dishData.sectionNameArabic,
        sectionNameEnglish: dishData.sectionNameEnglish,
        pricingType: dishData.pricingType || 'fixed',
      };



      // Create the dish with real API call
      try {
        const response = await request.post('/dishes', requestData);
        return response.data;
      } catch (error) {
        // Check if it's an authentication error
        if (error?.response?.status === 401) {
          throw new Error('Authentication failed - please log in again');
        }

        // Check if it's a validation error
        if (error?.response?.status === 400) {
          throw new Error(error?.response?.data?.message || 'Validation failed');
        }

        // Check if it's a server error
        if (error?.response?.status === 500) {
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Server error';
          throw new Error(`Server error: ${errorMessage}`);
        }

        throw error;
      }
    },
    {
      onSuccess: () => {
        // Invalidate broadly to avoid issues with stale closures capturing an undefined userId
        queryClient.invalidateQueries('menuDishes');
        queryClient.invalidateQueries('menuSections');
        setModalVisible(false);
        setEditingDish(null);
        showSuccessToast(strings.success, strings.dishAddedSuccess);
      },
      onError: error => {
        showErrorToast(
          strings.error,
          error?.response?.data?.message || error?.message || strings.failedToAddDish,
        );
      },
    },
  );

  const updateDishMutation = useMutation(
    async ({ dishId, dishData }) => {
      // Upload image to S3 if it's a local file path
      let imageUrl = dishData.image || '';
      if (imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('/'))) {
        try {
          const uploadResult = await uploadImageToS3(imageUrl);
          if (uploadResult.success && uploadResult.url) {
            imageUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Failed to upload dish image:', uploadError);
          // Keep existing image URL if upload fails
          imageUrl = dishData.image || '';
        }
      }

      // Explicitly clean and format data for update
      const requestData = {
        name: dishData.name?.trim(),
        description: dishData.description?.trim(),
        price: parseFloat(dishData.price),
        category: (dishData.category || '').trim(),
        categories: Array.isArray(dishData.categories) ? dishData.categories : ((dishData.category && dishData.category.trim()) ? [dishData.category.trim()] : []),
        sectionName: dishData.section?.trim(), // Send section name to backend
        image: imageUrl,
        visible: dishData.visible,
        // Enhanced fields
        ingredients: dishData.ingredients,
        preparationTime: dishData.preparationTime,
        optionGroups: dishData.optionGroups,
        // Bilingual fields
        nameArabic: dishData.nameArabic,
        nameEnglish: dishData.nameEnglish,
        descriptionArabic: dishData.descriptionArabic,
        descriptionEnglish: dishData.descriptionEnglish,
        sectionNameArabic: dishData.sectionNameArabic,
        sectionNameEnglish: dishData.sectionNameEnglish,
        pricingType: dishData.pricingType || 'fixed',
      };

      // Update dish with real API call
      const response = await request.put(`/dishes/${dishId}`, requestData);

      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate broadly to ensure refetch regardless of captured userId
        queryClient.invalidateQueries(['menuDishes']);
        queryClient.invalidateQueries('menuSections');
        setModalVisible(false);
        setEditingDish(null);
        showSuccessToast(strings.success, strings.dishUpdatedSuccess);
      },
      onError: error => {
        showErrorToast(
          strings.error,
          error?.response?.data?.message || error?.message || strings.failedToUpdateDish,
        );
      },
    },
  );

  const deleteDishMutation = useMutation(
    async dishId => {
      // Delete dish with real API call
      const response = await request.delete(`/dishes/${dishId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate broadly to ensure list refresh
        queryClient.invalidateQueries('menuDishes');
        showSuccessToast(strings.success, strings.dishDeletedSuccess);
      },
      onError: error => {
        showErrorToast(
          strings.error,
          error?.response?.data?.message || error?.message || strings.failedToDeleteDish,
        );
      },
    },
  );

  // Fetch current user first
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const userId = impersonatedUserId || userData?.data?.user?._id;

  // Connect to socket for real-time updates
  useChefSocket(userId);

  // Check if chef has submitted a menu upload request
  const { data: uploadStatusData } = useQuery(
    ['menuUploadStatus', userId],
    async () => {
      try {
        const res = await request.get('/menu-upload/status');
        return res.data?.request;
      } catch { return null; }
    },
    { enabled: !!userId }
  );
  const hasSubmittedMenu = uploadStatusData?.status === 'pending' || uploadStatusData?.status === 'processing';

  // Fetch menu sections - using real API call
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery(
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

  // Fetch dishes - using real API call
  const {
    data: dishesData,
    isLoading: dishesLoading,
    error: dishesError,
  } = useQuery(
    ['menuDishes', userId],
    async () => {
      try {
        // Fetch dishes directly by chef ID
        const dishesResponse = await request.get(`/dishes/chef/${userId}`);
        return dishesResponse.data || [];
      } catch (error) {
        throw error;
      }
    },
    {
      enabled: !!userId,
    },
  );

  // Prefer sections from API. If empty, derive from dishes to ensure UI shows the new section immediately
  const derivedSections = (Array.isArray(dishesData)
    ? Array.from(
      new Map(
        dishesData
          .map(d => {
            const name = d?.section?.name || d?.section || d?.category;
            return name ? [name.toLowerCase(), { name }] : null;
          })
          .filter(Boolean),
      ).values(),
    )
    : []);
  const finalSections = (sectionsData && sectionsData.length > 0)
    ? sectionsData
    : derivedSections;

  // Filter dishes based on selected section and search query
  const filteredDishes =
    dishesData?.filter(dish => {
      const matchesSection =
        selectedSection === 'all' ||
        dish.category === selectedSection ||
        dish.section?.name === selectedSection ||
        dish.section === selectedSection;

      const matchesSearch =
        !searchQuery ||
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.nameArabic && dish.nameArabic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dish.nameEnglish && dish.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase())) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.category && dish.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(dish.categories) && dish.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSection && matchesSearch;
    }) || [];

  // Debug logging
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries('menuSections');
      await queryClient.invalidateQueries('menuDishes');
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddDish = () => {
    setEditingDish(null);
    setModalVisible(true);
  };

  const handleEditDish = dish => {
    setEditingDish(dish);
    setModalVisible(true);
  };

  const handleDeleteDish = dish => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.deleteDishTitle,
      message: strings.formatString(strings.deleteDishConfirm, getLocalizedText(dish.name, dish.nameArabic, dish.nameEnglish)),
      confirmText: strings.delete,
      cancelText: strings.cancel,
      onConfirm: () => deleteDishMutation.mutate(dish._id),
    });
  };

  const handleSaveDish = async dishData => {
    if (editingDish) {
      // Update existing dish - keep blocking behavior
      updateDishMutation.mutate({
        dishId: editingDish._id,
        dishData,
      });
    } else {
      // Create new dish with background upload
      // Close modal immediately for better UX
      setModalVisible(false);
      setEditingDish(null);

      // Ensure chef has a menu first
      try {
        const menuId = await ensureMenu();

        // Use background upload
        uploadDish(
          dishData,
          menuId,
          userId,
          () => {
            // Success callback - queries are already invalidated in provider
          },
          (error) => {
            // Error callback - toast is already shown in provider
            console.error('Dish creation failed:', error);
          }
        );
      } catch (error) {
        showErrorToast(strings.error, error?.message || strings.dishUploadFailed);
      }
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingDish(null);
  };

  const handleToggleVisibility = async dish => {
    try {
      // Treat undefined as visible (true)
      const currentVisibility = dish.visible !== false;
      const newVisibility = !currentVisibility;

      // Update dish visibility with real API call
      // Only send the field we want to update to avoid backend validation errors
      // with populated fields like 'section'
      const response = await request.put(`/dishes/${dish._id}`, {
        visible: newVisibility,
      });

      queryClient.invalidateQueries(['menuDishes', userId]);
      showSuccessToast(strings.success, newVisibility ? strings.dishMadeVisible : strings.dishHidden);
    } catch (error) {
      showErrorToast(
        strings.error,
        error?.response?.data?.message || error?.message || strings.failedToUpdateVisibility,
      );
    }
  };

  const handleDishPress = (dish) => {
    setSelectedDish(dish);
    setDetailsModalVisible(true);
  };

  const renderDishItem = ({ item }) => (
    <View style={localStyles.dishItemContainer}>
      <DishCard
        dish={item}
        onPress={handleDishPress}
        onEdit={handleEditDish}
        onDelete={handleDeleteDish}
        onToggleVisibility={handleToggleVisibility}
      />
    </View>
  );

  const sections = [
    { name: strings.all, value: 'all' },
    ...(finalSections?.map(section => ({
      name: section.name,
      value: section.name,
    })) || []),
  ];

  return (
    <ZSafeAreaView>
      <ZHeader
        title={strings.menuManagement}
      />

      <View style={localStyles.container}>
        {/* Search Bar */}
        <View
          style={[
            localStyles.searchContainer,
            { backgroundColor: colors.inputBg },
          ]}>
          <Ionicons
            name="search-outline"
            size={moderateScale(20)}
            color={colors.grayScale7}
            style={localStyles.searchIcon}
          />
          <TextInput
            style={[localStyles.searchInput, { color: colors.textColor }]}
            placeholder={strings.searchDishes}
            placeholderTextColor={colors.grayScale7}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={localStyles.clearButton}>
              <Ionicons
                name="close-circle"
                size={moderateScale(20)}
                color={colors.grayScale7}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Tabs */}
        {sectionsLoading ? (
          <View style={localStyles.sectionsLoadingContainer}>
            <ZLoader />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={localStyles.sectionsContainer}
            contentContainerStyle={localStyles.sectionsContent}>
            {sections.map(section => (
              <SectionTab
                key={section.value}
                section={section}
                isSelected={selectedSection === section.value}
                onPress={() => setSelectedSection(section.value)}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}

        {/* Dishes List */}
        <View style={localStyles.dishesContainer}>
          {dishesLoading ? (
            <View style={localStyles.loadingContainer}>
              <ZLoader />
              <ZText
                type="M16"
                color={colors.grayScale7}
                style={localStyles.loadingText}>
                {strings.loadingDishes}
              </ZText>
            </View>
          ) : dishesError ? (
            <View style={localStyles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={moderateScale(48)}
                color={colors.redColor}
              />
              <ZText
                type="M16"
                color={colors.redColor}
                style={localStyles.errorText}>
                {strings.failedToLoadDishes}
              </ZText>
            </View>
          ) : (
            <FlatList
              data={filteredDishes}
              renderItem={renderDishItem}
              keyExtractor={item => item._id}
              numColumns={2}
              columnWrapperStyle={localStyles.dishRow}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <EmptyState
                  searchQuery={searchQuery}
                  colors={colors}
                  onAddDish={handleAddDish}
                  onUploadMenu={() => setUploadModalVisible(true)}
                  hasSubmittedMenu={hasSubmittedMenu}
                />
              }
              contentContainerStyle={localStyles.dishesContent}
            />
          )}
        </View>
      </View>

      {/* Add/Edit Dish Modal */}
      <AddEditDishModal
        visible={modalVisible}
        dish={editingDish}
        onClose={handleCloseModal}
        onSave={handleSaveDish}
        isLoading={editingDish ? updateDishMutation.isLoading : false}
      />

      {/* Dish Details Modal */}
      <ChefDishPreviewModal
        visible={detailsModalVisible}
        dish={selectedDish}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedDish(null);
        }}
        onEdit={handleEditDish}
        onDelete={handleDeleteDish}
        onToggleVisibility={handleToggleVisibility}
      />

      {/* Menu Upload Modal */}
      <MenuUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['menuUploadStatus', userId]);
        }}
      />

      {/* Floating Action Button */}
      {dishesData && dishesData.length > 0 && (
        <TouchableOpacity
          style={[localStyles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAddDish}
          activeOpacity={0.85}>
          <Ionicons
            name="add"
            size={moderateScale(24)}
            color={colors.white}
          />
          <ZText type="B14" color={colors.white} style={localStyles.fabText}>
            {strings.addDish}
          </ZText>
        </TouchableOpacity>
      )}
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  fab: {
    position: 'absolute',
    bottom: moderateScale(24),
    right: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    marginLeft: moderateScale(8),
  },
  addButton: {
    padding: moderateScale(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(8),
  },
  searchIcon: {
    marginRight: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    paddingVertical: 0,
  },
  clearButton: {
    padding: moderateScale(4),
  },
  sectionsContainer: {
    marginBottom: moderateScale(16),
    maxHeight: moderateScale(50),
  },
  sectionsContent: {
    paddingRight: moderateScale(20),
  },
  sectionsLoadingContainer: {
    height: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  sectionTab: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    marginRight: moderateScale(8),
  },
  dishesContainer: {
    flex: 1,
  },
  dishesContent: {
    paddingBottom: moderateScale(20),
  },
  dishRow: {
    justifyContent: 'space-between',
  },
  dishItemContainer: {
    flex: 1,
    maxWidth: '50%',
    marginHorizontal: moderateScale(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },
  errorText: {
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(4),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: moderateScale(32),
  },
  ctaButton: {
    marginTop: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    alignSelf: 'center',
    width: '85%',
  },
  uploadHero: {
    padding: moderateScale(24),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    width: '100%',
    gap: moderateScale(12),
  },
  uploadIconCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadHeroTitle: {
    textAlign: 'center',
  },
  uploadHeroDesc: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
    paddingHorizontal: moderateScale(8),
  },
  uploadHeroBtn: {
    marginTop: moderateScale(4),
    width: '90%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: moderateScale(20),
    gap: moderateScale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    textAlign: 'center',
  },
  manualAddBtn: {
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    alignSelf: 'center',
    width: '85%',
    borderWidth: 1,
  },
  stepsContainer: {
    width: '100%',
    gap: moderateScale(4),
  },
  onboardingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
    gap: moderateScale(12),
  },
  stepNumberCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  stepTitle: {
    flex: 1,
  },
  stepDesc: {
    lineHeight: moderateScale(20),
  },
  submittedBanner: {
    marginTop: moderateScale(24),
    padding: moderateScale(24),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    width: '100%',
    gap: moderateScale(8),
  },
  submittedTitle: {
    textAlign: 'center',
  },
  submittedDesc: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});
