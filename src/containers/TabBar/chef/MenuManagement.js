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
import { Toast, ALERT_TYPE } from 'react-native-alert-notification';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZLoader from '../../../components/common/ZLoader';
import ZButton from '../../../components/common/ZButton';
import DishCard from './components/DishCard';
import AddEditDishModal from './components/AddEditDishModal';
import request from '../../../api/request';
import { moderateScale } from '../../../common/constants';

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

const EmptyState = ({ searchQuery, colors, onAddDish }) => (
  <View style={localStyles.emptyContainer}>
    <Ionicons
      name="restaurant-outline"
      size={moderateScale(64)}
      color={colors.grayScale4}
    />
    <ZText type="B18" color={colors.grayScale7} style={localStyles.emptyTitle}>
      No dishes found
    </ZText>
    <ZText
      type="M14"
      color={colors.grayScale7}
      style={localStyles.emptySubtitle}>
      {searchQuery
        ? 'Try adjusting your search terms'
        : 'Start by adding your first dish to the menu'}
    </ZText>
    {!searchQuery && (
      <ZButton
        title={'Add your first dish'}
        textType={'b18'}
        color={colors.white}
        containerStyle={localStyles.ctaButton}
        frontIcon={
          <Ionicons
            name="add"
            size={moderateScale(18)}
            color={colors.white}
            style={{ marginRight: moderateScale(8) }}
          />
        }
        onPress={onAddDish}
      />
    )}
  </View>
);

export default function MenuManagement() {
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
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
      if (
        !dishData.name ||
        !dishData.description ||
        !dishData.price ||
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

      // Send fields the controller expects (now with multi-categories)
      const requestData = {
        name: dishData.name.trim(),
        description: dishData.description.trim(),
        price: parseFloat(dishData.price),
        category: (dishData.category || '').trim(),
        categories: Array.isArray(dishData.categories) ? dishData.categories : ((dishData.category && dishData.category.trim()) ? [dishData.category.trim()] : []),
        sectionName: dishData.section.trim(),
        menuId: menuId,
        image: dishData.image || '',
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
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Dish added successfully!',
        });
      },
      onError: error => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to add dish',
        });
      },
    },
  );

  const updateDishMutation = useMutation(
    async ({ dishId, dishData }) => {
      // Explicitly clean and format data for update
      const requestData = {
        name: dishData.name?.trim(),
        description: dishData.description?.trim(),
        price: parseFloat(dishData.price),
        category: (dishData.category || '').trim(),
        categories: Array.isArray(dishData.categories) ? dishData.categories : ((dishData.category && dishData.category.trim()) ? [dishData.category.trim()] : []),
        sectionName: dishData.section?.trim(), // Send section name to backend
        image: dishData.image || '',
        cookingTime: dishData.cookingTime,
        ingredients: dishData.ingredients,
        visible: dishData.visible
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
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Dish updated successfully!',
        });
      },
      onError: error => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update dish',
        });
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
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Dish deleted successfully!',
        });
      },
      onError: error => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to delete dish',
        });
      },
    },
  );

  // Fetch current user first
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const userId = userData?.data?.user?._id;



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
        return [];
      }
    },
    {
      enabled: !!userId,
    },
  );

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
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to delete "${dish.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDishMutation.mutate(dish._id),
        },
      ],
    );
  };

  const handleSaveDish = dishData => {
    if (editingDish) {
      // Update existing dish
      updateDishMutation.mutate({
        dishId: editingDish._id,
        dishData,
      });
    } else {
      // Create new dish
      createDishMutation.mutate(dishData);
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
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: `Dish ${newVisibility ? 'made visible' : 'hidden'}`,
      });
    } catch (error) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update dish visibility',
      });
    }
  };

  const renderDishItem = ({ item }) => (
    <View style={localStyles.dishItemContainer}>
      <DishCard
        dish={item}
        onEdit={handleEditDish}
        onDelete={handleDeleteDish}
        onToggleVisibility={handleToggleVisibility}
      />
    </View>
  );

  const sections = [
    { name: 'All', value: 'all' },
    ...(finalSections?.map(section => ({
      name: section.name,
      value: section.name,
    })) || []),
  ];

  return (
    <ZSafeAreaView>
      <ZHeader
        title="Menu Management"
        isHideBack={fromTabsParam || isFromTabBar || !navigation.canGoBack()}
        rightIcon={
          <TouchableOpacity
            onPress={handleAddDish}
            style={localStyles.addButton}>
            <Ionicons
              name="add-circle"
              size={moderateScale(28)}
              color={colors.primary}
            />
          </TouchableOpacity>
        }
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
            placeholder="Search dishes..."
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
                Loading dishes...
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
                Failed to load dishes
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
        isLoading={createDishMutation.isLoading || updateDishMutation.isLoading}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(60),
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
    marginTop: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    alignSelf: 'center',
    width: '75%',
  },
});
