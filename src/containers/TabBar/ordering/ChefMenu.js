import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  InteractionManager,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { showErrorToast, showActionDialog, showSuccessToast, ALERT_TYPE } from '../../../utils/toast';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useInfiniteQuery } from 'react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../components/common/ZText';
import ZInput from '../../../components/common/ZInput';
import StarRating from '../../../components/StarRating';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZLoader from '../../../components/common/ZLoader';
import ZButton from '../../../components/common/ZButton';
import CartFloatingButton from '../../../components/common/CartFloatingButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { styles } from '../../../themes';
import request from '../../../api/request';
import branchService from '../../../api/branchService';
import images from '../../../assets/images';
import { StackNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import {
  addToCart,
  selectCartItemCount,
  selectPendingConflictItem,
  clearCartAndAddPending,
  clearPendingConflictItem,
} from '../../../redux/reducer/cartSlice';
import { useStorage } from '../../../utils/useStorage';
import { useLocation } from '../../../navigation/locationContext';
import FeaturedReelsSection from '../../../components/common/FeaturedReelsSection';
import FeaturedReviewsSection from '../../../components/common/FeaturedReviewsSection';
import FollowButton from '../../../components/common/FollowButton';
import Locations from '../../../components/models/Locations';

const ChefMenu = () => {
  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { chefId, scrollToDishId, chefName, averageDishRating: headerAvg = 0, ratedDishesCount: headerCount = 0 } = route.params;
  const [user] = useStorage('user');



  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);
  const locationsSheetRef = useRef(null);
  const hasAttemptedScrollRef = useRef(false);
  const [scrollRetryCount, setScrollRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [quantities, setQuantities] = useState({}); // Track quantities for each dish

  const cartItemCount = useSelector(selectCartItemCount);
  const pendingConflictItem = useSelector(selectPendingConflictItem);

  // Fetch chef/menu info (Static)
  const fetchChefInfo = async (chefId) => {
    try {
      let menu = null;
      let chef = null;

      // First try to get the chef's menu
      try {
        const menuResponse = await request.get(`/menus/chef/${chefId}`);
        menu = menuResponse.data;
      } catch (menuError) {
      }

      // Get chef information
      try {
        const chefResponse = await request.get(`/user/${chefId}`);
        // API returns { success, user, currentUserFollowed }
        const userData = chefResponse.data?.user || chefResponse.data;
        chef = {
          ...userData,
          currentUserFollowed: chefResponse.data?.currentUserFollowed || false
        };
      } catch (chefError) {
        chef = {
          _id: chefId,
          fullName: chefName || strings.unknownChef,
          avatar: null,
          currentUserFollowed: false,
        };
      }

      return { menu, chef };
    } catch (error) {
      throw error;
    }
  };

  const {
    data: chefInfoData,
    isLoading: isChefInfoLoading,
    error: chefInfoError,
    refetch: refetchChefInfo,
  } = useQuery(['chefInfo', chefId], () => fetchChefInfo(chefId), {
    enabled: !!chefId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch branches for this kitchen
  const { data: branchesData } = useQuery(
    ['chefBranches', chefId],
    () => branchService.getBranches(chefId),
    {
      enabled: !!chefId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );

  // Get user's location for delivery check
  const { stableLatitude, stableLongitude } = useLocation();

  // Check delivery eligibility to user's location
  const { data: deliveryData } = useQuery(
    ['deliveryEligibility', chefId, stableLatitude, stableLongitude],
    async () => {
      const response = await request.get(
        `/orders/check-delivery/${chefId}?lat=${stableLatitude}&long=${stableLongitude}`
      );
      return response.data;
    },
    {
      enabled: !!chefId && !!stableLatitude && !!stableLongitude,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Fetch dishes (Infinite Scroll)
  const {
    data: dishesData,
    isLoading: isDishesLoading,
    error: dishesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchDishes,
  } = useInfiniteQuery(
    ['chefDishes', chefId],
    async ({ pageParam = 1 }) => {
      // Use getDishesByChef endpoint which now supports pagination
      // Note: Endpoint returns OBJECT { dishes, ... } if page/limit present, or ARRAY if legacy
      // We explicitly ask for page/limit so we expect object style response if backend was updated correctly
      // However, to be safe given recent changes, we inspect response structure
      const response = await request.get(`/dishes/chef/${chefId}?page=${pageParam}&limit=20`);
      return response.data;
    },
    {
      enabled: !!chefId,
      getNextPageParam: (lastPage) => {
        // Handle both possible backend structures (Array vs Object)
        if (Array.isArray(lastPage)) {
          // Should not happen if page param is respected, but fallback
          return undefined;
        }
        if (lastPage.currentPage < lastPage.totalPages) {
          return lastPage.currentPage + 1;
        }
        return undefined;
      },
    }
  );

  // Flatten dishes
  const allDishes = React.useMemo(() => {
    if (!dishesData) return [];
    return dishesData.pages.flatMap(page => {
      // If page is array (Legacy), return it all
      if (Array.isArray(page)) return page;
      // If page is object (New Paginated), return .dishes
      return page.dishes || [];
    });
  }, [dishesData]);

  // Combine into a single 'menuData' object to minimize code changes downstream
  const menuData = React.useMemo(() => ({
    ...chefInfoData,
    dishes: allDishes
  }), [chefInfoData, allDishes]);

  const isLoading = isChefInfoLoading; // Initial loading only blocks on chef info, dishes can stream
  const error = chefInfoError;
  const refetch = () => { refetchChefInfo(); refetchDishes(); };

  // Scroll to dish logic (simplified to wait for dishes load)
  useEffect(() => {
    if (scrollToDishId && allDishes.length > 0 && flatListRef.current && !hasAttemptedScrollRef.current) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          const dishIndex = allDishes.findIndex(
            dish => dish._id === scrollToDishId || dish.id === scrollToDishId,
          );
          if (dishIndex !== -1) {
            try {
              flatListRef.current.scrollToIndex({
                index: dishIndex,
                animated: true,
                viewPosition: 0.1,
              });
              hasAttemptedScrollRef.current = true;
            } catch (e) {
            }
          }
        }, 500); // Increased timeout to allow rendering
      });
    }
  }, [scrollToDishId, allDishes]); // Re-run when new dishes loaded

  // Search state for within-chef menu
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);

  const onSearchInput = useCallback((text) => {
    setSearch(text);
    clearTimeout(onSearchInput._t);
    onSearchInput._t = setTimeout(() => setDebouncedSearch(text), 500);
    // Refocus the input after state update to prevent keyboard dismissal
    requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    });
  }, []);

  // Fetch searched dishes scoped to chef
  const fetchSearchedDishes = async ({ pageParam = null }) => {
    if (!debouncedSearch) return { data: { data: { dishes: menuData?.dishes || [], pagination: {} } } };
    const endpoint = useSemanticSearch ? '/dishes/semantic-search' : '/dishes/search';
    const params = useSemanticSearch
      ? { searchString: debouncedSearch, cursor: pageParam, limit: 10, searchType: 'hybrid', chefId }
      : { searchString: debouncedSearch, page: pageParam || 1, limit: 10, chefId };
    return request.get(endpoint, { params });
  };

  const { data: searchedDishes, isFetching: isSearching } = useQuery(
    ['chefMenuSearch', chefId, debouncedSearch, useSemanticSearch],
    async () => {
      const res = await fetchSearchedDishes({ pageParam: null });
      const dishes = res?.data?.data?.dishes || res?.data?.dishes || [];
      return dishes;
    },
    { enabled: !!chefId && debouncedSearch.length > 0 }
  );

  // Retry scroll when data changes and we have a target dish
  useEffect(() => {
    if (!menuData?.dishes || !scrollToDishId || !flatListRef.current) return;
    if (hasAttemptedScrollRef.current) return;

    const index = menuData.dishes.findIndex(
      d => d._id === scrollToDishId || d.id === scrollToDishId,
    );
    if (index === -1) return;

    const tryScroll = (attempt = 0) => {
      if (!flatListRef.current) return;
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.1,
        });
        hasAttemptedScrollRef.current = true;
      } catch (err) {
        if (attempt < 5) {
          setTimeout(() => tryScroll(attempt + 1), 200);
        } else {
        }
      }
    };

    InteractionManager.runAfterInteractions(() => tryScroll(0));
  }, [menuData?.dishes, scrollToDishId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleQuantityChange = (dishId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [dishId]: Math.max(0, (prev[dishId] || 0) + delta),
    }));
  };

  const handleAddToCart = async (dish, quantity = 1) => {
    if (!dish || quantity <= 0) return;

    // Block if kitchen doesn't deliver to user's location
    if (deliveryData && !deliveryData.canDeliver) {
      const distanceInfo = deliveryData.nearestDistance
        ? ` (${(strings.distanceAway || '{0} km').replace('{0}', deliveryData.nearestDistance)})`
        : '';
      showErrorToast(
        strings.doesNotDeliverHere || 'Does not deliver here',
        (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
      );
      return;
    }

    try {
      // Remove .unwrap() since addToCart is a regular action creator, not an async thunk
      dispatch(
        addToCart({
          dish,
          quantity,
          chefId,
          chefName: chefName || strings.unknownChef,
        }),
      );
    } catch (error) {
      showErrorToast(strings.error, strings.failedToAddItemToCart);
    }
  };

  const handleCartPress = () => {
    // Change from CheckoutScreen to ShoppingCart which is defined in NavigationKeys.js
    navigation.navigate(StackNav.ShoppingCart);
  };

  // Handle cart conflict - show modal when user tries to add from different chef
  useEffect(() => {
    if (pendingConflictItem) {
      showActionDialog({
        type: ALERT_TYPE.WARNING,
        title: strings.differentChefTitle,
        message: strings.differentChefMessage,
        confirmText: strings.clearCart,
        cancelText: strings.viewCart,
        onConfirm: () => {
          dispatch(clearCartAndAddPending());
          showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, pendingConflictItem.dish?.name));
        },
        onCancel: () => {
          dispatch(clearPendingConflictItem());
          navigation.navigate(StackNav.ShoppingCart);
        },
      });
    }
  }, [pendingConflictItem, dispatch, navigation]);

  // Helper function to generate color gradients for categories
  const getCategoryGradient = index => {
    const gradients = [
      { primary: '#FF6B8A', secondary: '#FF8FA3' },
      { primary: '#4ECDC4', secondary: '#7EDDD8' },
      { primary: '#45B7D1', secondary: '#6BCFF6' },
      { primary: '#FFA726', secondary: '#FFB74D' },
      { primary: '#AB47BC', secondary: '#BA68C8' },
      { primary: '#66BB6A', secondary: '#81C784' },
      { primary: '#EF5350', secondary: '#E57373' },
      { primary: '#26A69A', secondary: '#4DB6AC' },
    ];
    return gradients[index % gradients.length];
  };

  // Helper function to get category icons
  const getCategoryIcon = category => {
    const iconMap = {
      Italian: 'restaurant-outline',
      Pasta: 'restaurant',
      Pizza: 'pizza-outline',
      Dessert: 'ice-cream-outline',
      Appetizer: 'wine-outline',
      'Main Course': 'restaurant',
      Beverage: 'wine',
      Salad: 'leaf-outline',
      Soup: 'cafe-outline',
      'All Items': 'grid-outline',
    };
    return iconMap[category] || 'restaurant-outline';
  };

  const renderDishCard = ({ item: dish }) => {
    const currentQuantity = quantities[dish._id] || 0;
    const isAvailable = dish.visible !== false;

    return (
      <>
        <TouchableOpacity
          style={[
            localStyles.dishCard,
            { backgroundColor: colors.backgroundColor },
          ]}
          onPress={() => {
            navigation.navigate(StackNav.DishDetailScreen, {
              dishId: dish._id,
              chefId: chefId,
            });
          }}
          activeOpacity={0.9}>
          {/* Hero Image Section */}
          <View style={localStyles.heroImageContainer}>
            <Image
              source={
                dish.image
                  ? { uri: dish.image }
                  : colors.dark
                    ? images.dishplaceholder
                    : images.dishplaceholder
              }
              style={localStyles.heroImage}
            />
            {/* Subtle top gradient */}
            <View style={localStyles.topGradient} />
          </View>

          {/* Content Section */}
          <View style={localStyles.dishContent}>
            {/* Dish Info */}
            <View style={localStyles.dishInfo}>
              <ZText
                type="B16"
                numberOfLines={1}
                color={colors.textColor}
                style={localStyles.dishName}>
                {dish.name}
              </ZText>

              {dish.description && (
                <ZText
                  type="M12"
                  numberOfLines={2}
                  color={colors.grayScale7}
                  style={localStyles.dishDescription}>
                  {dish.description}
                </ZText>
              )}

              {/* Rating */}
              <StarRating
                rating={Number.isFinite(dish?.average_rating)
                  ? dish.average_rating
                  : (Number.isFinite(dish?.rating) ? dish.rating : 0)}
                size="small"
                showText={false}
                showCount={false}
                showWhenNoRating={true}
                style={{ marginBottom: moderateScale(6) }}
              />

              {/* Price and Category */}
              <View style={localStyles.priceRow}>
                <View style={localStyles.priceContainer}>
                  <ZText type="B18" color={colors.primary}>
                    {strings.currency} {dish.price?.toFixed(2) || '0.00'}
                  </ZText>
                  {dish.category && (
                    <View
                      style={[
                        localStyles.categoryBadge,
                        { backgroundColor: colors.primary + '15' },
                      ]}>
                      <ZText
                        type="M10"
                        color={colors.primary}
                        style={localStyles.categoryText}>
                        {dish.category}
                      </ZText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Action Section */}
            <View style={localStyles.actionSection}>
              {user?._id?.toString() === chefId?.toString() ? null : isAvailable ? (
                currentQuantity > 0 ? (
                  <View style={localStyles.quantityController}>
                    <TouchableOpacity
                      style={[
                        localStyles.quantityControl,
                        { backgroundColor: colors.grayScale4 },
                      ]}
                      onPress={() => handleQuantityChange(dish._id, -1)}
                      activeOpacity={0.7}>
                      <Ionicons
                        name="remove"
                        size={moderateScale(20)}
                        color={colors.white}
                      />
                    </TouchableOpacity>

                    <View style={localStyles.quantityBadge}>
                      <ZText type="B20" color={colors.primary}>
                        {currentQuantity}
                      </ZText>
                    </View>

                    <TouchableOpacity
                      style={[
                        localStyles.quantityControl,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        // Block if kitchen doesn't deliver
                        if (deliveryData && !deliveryData.canDeliver) {
                          const distanceInfo = deliveryData.nearestDistance
                            ? ` (${(strings.distanceAway || '{0} km').replace('{0}', deliveryData.nearestDistance)})`
                            : '';
                          showErrorToast(
                            strings.doesNotDeliverHere || 'Does not deliver here',
                            (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
                          );
                          return;
                        }
                        handleQuantityChange(dish._id, 1);
                        handleAddToCart(dish, 1);
                      }}
                      activeOpacity={0.7}>
                      <Ionicons
                        name="add"
                        size={moderateScale(20)}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      localStyles.addButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      // Block if kitchen doesn't deliver
                      if (deliveryData && !deliveryData.canDeliver) {
                        const distanceInfo = deliveryData.nearestDistance
                          ? ` (${(strings.distanceAway || '{0} km').replace('{0}', deliveryData.nearestDistance)})`
                          : '';
                        showErrorToast(
                          strings.doesNotDeliverHere || 'Does not deliver here',
                          (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
                        );
                        return;
                      }
                      handleQuantityChange(dish._id, 1);
                      handleAddToCart(dish, 1);
                    }}
                    activeOpacity={0.8}>
                    <Ionicons
                      name="add"
                      size={moderateScale(20)}
                      color={colors.white}
                    />
                    <ZText type="B14" color={colors.white}>
                      {strings.addToCart}
                    </ZText>
                  </TouchableOpacity>
                )
              ) : (
                // Unavailable State
                <View
                  style={[
                    localStyles.unavailableState,
                    { backgroundColor: colors.grayScale2 },
                  ]}>
                  <Ionicons
                    name="close-circle-outline"
                    size={moderateScale(20)}
                    color={colors.grayScale6}
                  />
                  <ZText type="M16" color={colors.grayScale6}>
                    {strings.currentlyUnavailable}
                  </ZText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  // Render sticky Browse Menu sections
  const renderStickyBrowseMenu = () => {
    if (!menuData?.dishes) return null;

    // Group dishes by category for sections
    const dishCategories = menuData.dishes.reduce((acc, dish) => {
      const category = dish.category || strings.allItems;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(dish);
      return acc;
    }, {});

    const categoryNames = Object.keys(dishCategories);

    if (categoryNames.length <= 1) return null;

    return (
      <View style={[localStyles.stickyBrowseContainer, { backgroundColor: colors.backgroundColor }]}>
        <View style={localStyles.stunningCategoriesContainer}>
          {/* Browse Menu title */}
          <View style={{ marginTop: moderateScale(-6), marginBottom: moderateScale(8) }}>
            <ZText
              type="B16"
              color={colors.textColor}
              style={[localStyles.categoriesTitle, { marginBottom: 0 }]}>
              {strings.browseMenu}
            </ZText>
          </View>
          <FlatList
            data={categoryNames}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.stunningCategoriesList}
            style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : null}
            renderItem={({ item: category, index }) => {
              const itemCount = dishCategories[category].length;
              const gradientColors = getCategoryGradient(index);

              return (
                <TouchableOpacity
                  style={[
                    localStyles.stunningCategoryCard,
                    {
                      backgroundColor: gradientColors.primary,
                      shadowColor: gradientColors.primary,
                    },
                    I18nManager.isRTL && { transform: [{ scaleX: -1 }] },
                  ]}
                  onPress={() => {
                    // Scroll to first dish in this category
                    const firstDishInCategory = menuData.dishes.find(
                      dish => (dish.category || strings.allItems) === category,
                    );
                    if (firstDishInCategory && flatListRef.current) {
                      const dishIndex = menuData.dishes.findIndex(
                        dish => dish._id === firstDishInCategory._id,
                      );
                      if (dishIndex !== -1) {
                        flatListRef.current.scrollToIndex({
                          index: dishIndex,
                          animated: true,
                          viewPosition: 0.1,
                        });
                      }
                    }
                  }}
                  activeOpacity={0.8}>
                  {/* Gradient Overlay */}
                  <View
                    style={[
                      localStyles.categoryGradientOverlay,
                      { backgroundColor: gradientColors.secondary },
                    ]}
                  />

                  {/* Category Icon */}
                  <View
                    style={[
                      localStyles.categoryIconContainer,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}>
                    <Ionicons
                      name={getCategoryIcon(category)}
                      size={moderateScale(24)}
                      color="white"
                    />
                  </View>

                  {/* Category Info */}
                  <View style={localStyles.categoryInfo}>
                    <ZText
                      type="B14"
                      color="white"
                      numberOfLines={1}
                      style={localStyles.categoryName}>
                      {category}
                    </ZText>
                    <ZText
                      type="M10"
                      color="rgba(255,255,255,0.9)"
                      style={localStyles.categoryItemCount}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </ZText>
                  </View>

                  {/* Shine Effect */}
                  <View style={localStyles.shineEffect} />
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item}
          />
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    // Create chef profile object for navigation
    const chefProfile = {
      _id: chefId,
      fullName: menuData?.chef?.fullName || chefName,
      avatar: menuData?.chef?.avatar,
    };

    return (
      <View style={{ backgroundColor: colors.backgroundColor }}>
        {/* Professional Restaurant Header */}
        <View style={localStyles.restaurantHeader}>
          {/* Restaurant Avatar & Info */}
          <View style={localStyles.restaurantInfoRow}>
            <Image
              source={
                menuData?.chef?.avatar
                  ? { uri: menuData.chef.avatar }
                  : colors.dark
                    ? images.userDark
                    : images.userLight
              }
              style={localStyles.restaurantAvatar}
            />
            <View style={localStyles.restaurantDetails}>
              <ZText type="B20" color={colors.textColor} numberOfLines={1}>
                {menuData?.chef?.fullName || chefName}
              </ZText>
              {/* Bio / Description */}
              {menuData?.chef?.bio && (
                <ZText type="M13" color={colors.grayScale6} numberOfLines={2} style={{ marginTop: 4 }}>
                  {menuData.chef.bio}
                </ZText>
              )}
              {/* Stats Row */}
              <View style={localStyles.restaurantStats}>
                {/* Dish count */}
                <View style={localStyles.statBadge}>
                  <Ionicons name="restaurant-outline" size={14} color={colors.primary} />
                  <ZText type="M13" color={colors.grayScale6} style={{ marginLeft: 4 }}>
                    {menuData?.dishes?.length || 0} {strings.dishes || 'dishes'}
                  </ZText>
                </View>
              </View>

              {/* Compact Info Badges Row - Rating, Branches, Delivery Status */}
              <View style={localStyles.badgesRow}>
                {/* Rating Badge - Compact */}
                {(() => {
                  const dishes = menuData?.dishes || [];
                  const ratedDishes = dishes.filter(d =>
                    typeof d.average_rating === 'number' && d.average_rating >= 1
                  );
                  const ratedCount = ratedDishes.length;
                  let rating = 0;
                  if (ratedCount > 0) {
                    const total = ratedDishes.reduce((sum, d) => sum + d.average_rating, 0);
                    rating = Math.round((total / ratedCount) * 10) / 10;
                  }
                  if (rating < 1) return null;
                  return (
                    <View style={[localStyles.compactBadge, { backgroundColor: '#FFD700' + '20' }]}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <ZText type="B12" color="#D4A800" style={{ marginLeft: 4 }}>
                        {rating.toFixed(1)}
                      </ZText>
                      <ZText type="M11" color={colors.grayScale6} style={{ marginLeft: 3 }}>
                        ({ratedCount} {strings.ratedDishes || 'rated'})
                      </ZText>
                    </View>
                  );
                })()}

                {/* Branches Badge */}
                {(() => {
                  const branchLocations = (branchesData?.branches || [])
                    .filter(b => b.isActive)
                    .map(b => ({
                      description: b.addressDetails?.formattedAddress || b.branchName,
                      lat: b.location?.lat,
                      long: b.location?.long,
                    }));
                  if (branchLocations.length === 0) return null;
                  return (
                    <TouchableOpacity
                      onPress={() => locationsSheetRef.current?.show()}
                      activeOpacity={0.7}
                    >
                      <View style={[localStyles.compactBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="location" size={14} color={colors.primary} />
                        <ZText type="B12" color={colors.primary} style={{ marginLeft: 4 }}>
                          {branchLocations.length} {branchLocations.length === 1 ? strings.branch : strings.branches}
                        </ZText>
                        <Ionicons name="chevron-forward" size={12} color={colors.primary} style={{ marginLeft: 2 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })()}

                {/* Delivery Status Badge */}
                {deliveryData && (
                  <View
                    style={[
                      localStyles.compactBadge,
                      {
                        backgroundColor: deliveryData.canDeliver
                          ? '#4CAF50' + '15'
                          : '#FF9800' + '15',
                      },
                    ]}
                  >
                    <Ionicons
                      name={deliveryData.canDeliver ? 'checkmark-circle' : 'alert-circle'}
                      size={14}
                      color={deliveryData.canDeliver ? '#4CAF50' : '#FF9800'}
                    />
                    <ZText
                      type="B12"
                      color={deliveryData.canDeliver ? '#4CAF50' : '#FF9800'}
                      style={{ marginLeft: 4 }}
                    >
                      {deliveryData.canDeliver
                        ? strings.deliversToYou
                        : strings.doesNotDeliverHere}
                    </ZText>
                    {!deliveryData.canDeliver && deliveryData.nearestDistance && (
                      <ZText type="M11" color={colors.grayScale6} style={{ marginLeft: 3 }}>
                        • {(strings.distanceAway || '{0} km').replace('{0}', deliveryData.nearestDistance)}
                      </ZText>
                    )}
                  </View>
                )}
              </View>

              {/* Follow Button - Only show if not current user's profile */}
              {chefId && user?._id?.toString() !== chefId?.toString() && (
                <FollowButton
                  userId={chefId}
                  isFollowed={menuData?.chef?.currentUserFollowed}
                  compact={false}
                  size="medium"
                  style={{ marginTop: moderateScale(10), alignSelf: 'flex-start' }}
                />
              )}
            </View>
          </View>
        </View>

        {/* Featured Reels Section */}
        <FeaturedReelsSection
          chefId={chefId}
          chefProfile={chefProfile}
          limit={5}
        />

        {/* Featured Reviews Section */}
        <FeaturedReviewsSection
          chefId={chefId}
          chefProfile={chefProfile}
          limit={5}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (error) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        <View style={localStyles.errorContainer}>
          <Ionicons
            name="restaurant-outline"
            size={moderateScale(64)}
            color={colors.grayScale7}
          />
          <ZText
            type="B16"
            align="center"
            color={colors.error}
            style={localStyles.errorTitle}>
            {strings.failedToLoadMenu}
          </ZText>
          <ZText
            type="M14"
            align="center"
            color={colors.grayScale7}
            style={localStyles.errorSubtitle}>
            {strings.menuLoadErrorSub}
          </ZText>
          <ZButton
            title={strings.retry}
            onPress={refetch}
            containerStyle={localStyles.retryButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  // Handle case where chef has no dishes
  if (menuData && (!menuData.dishes || menuData.dishes.length === 0)) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        {renderHeader()}
        <View style={localStyles.emptyContainer}>
          <Ionicons
            name="restaurant-outline"
            size={moderateScale(64)}
            color={colors.grayScale7}
          />
          <ZText
            type="B16"
            align="center"
            color={colors.textColor}
            style={localStyles.emptyTitle}>
            {strings.noDishesAvailable}
          </ZText>
          <ZText
            type="M14"
            align="center"
            color={colors.grayScale7}
            style={localStyles.emptySubtitle}>
            {strings.noDishesSub}
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title={menuData?.chef?.fullName || chefName || strings.menu} showBack />

      {/* Search Bar - Outside FlatList to prevent keyboard dismissal */}
      {menuData?.dishes?.length > 0 && (
        <View style={{ backgroundColor: colors.backgroundColor, paddingHorizontal: moderateScale(16), paddingVertical: moderateScale(8) }}>
          <ZInput
            fieldRef={searchInputRef}
            _value={search}
            placeHolder={strings.searchDishes}
            toGetTextFieldValue={onSearchInput}
            blurOnSubmit={false}
            insideLeftIcon={() => (
              <Ionicons name="search" size={moderateScale(16)} color={colors.grayScale6} />
            )}
            inputContainerStyle={{ backgroundColor: colors.inputBg || colors.grayScale2, borderColor: colors.bColor || colors.grayScale3, height: getHeight(42) }}
            inputBoxStyle={{ color: colors.textColor, height: getHeight(42), paddingVertical: moderateScale(6) }}
            rightAccessory={() => (
              isSearching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                search?.length > 0 ? (
                  <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
                    <Ionicons name="close-circle" size={moderateScale(18)} color={colors.grayScale6} />
                  </TouchableOpacity>
                ) : null
              )
            )}
          />
          {/* Search indicator */}
          {debouncedSearch.length > 0 && isSearching ? (
            <ZText type="M12" color={colors.grayScale7} style={{ marginTop: moderateScale(4) }}>{strings.searching}</ZText>
          ) : null}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={(debouncedSearch ? searchedDishes : menuData?.dishes) || []}
        renderItem={renderDishCard}
        keyExtractor={item => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={() => (
          <View style={{ backgroundColor: colors.backgroundColor }}>
            {/* Chef Info + Featured Sections */}
            {renderHeader()}

            {/* Categories Section (scrolls with content) */}
            {renderStickyBrowseMenu()}
          </View>
        )}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onScrollToIndexFailed={info => {
          // Fallback: scroll by approximate offset then retry
          try {
            if (flatListRef.current && Number.isFinite(info.averageItemLength)) {
              const approximateOffset = Math.max(0, info.averageItemLength * info.index);
              flatListRef.current.scrollToOffset({
                offset: approximateOffset,
                animated: true,
              });
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.1,

                  });
                } catch (e2) {
                }
              }, 250);
            }
          } catch (e) {
          }
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => isFetchingNextPage ?
          <View style={{ padding: 20 }}><ZLoader /></View> : null
        }
      />

      <CartFloatingButton onPress={handleCartPress} />

      {/* Branches Modal */}
      <Locations
        SheetRef={locationsSheetRef}
        selectedGov={
          (branchesData?.branches || [])
            .filter(b => b.isActive)
            .map(b => ({
              description: b.addressDetails?.formattedAddress || b.branchName,
              lat: b.location?.lat,
              long: b.location?.long,
            }))
        }
        onClose={() => { }}
      />
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  listContainer: {
    paddingBottom: moderateScale(20),
  },
  headerContainer: {
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: moderateScale(4),
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginRight: moderateScale(15),
  },
  chefDetails: {
    flex: 1,
  },
  // Professional Restaurant Header Styles
  restaurantHeader: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  restaurantInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  restaurantAvatar: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  restaurantDetails: {
    flex: 1,
    paddingTop: moderateScale(4),
  },
  restaurantStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
    gap: moderateScale(12),
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(6),
    gap: moderateScale(4),
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
  },
  // Compact Badges Row - Unified style for rating, branches, delivery
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: moderateScale(10),
    gap: moderateScale(8),
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
  },
  // Prominent Overall Rating Card
  overallRatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  ratingBigNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  ratingDetails: {
    flexDirection: 'column',
  },
  // Legacy styles (keeping for compatibility)
  premiumHeader: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(8),
  },
  chefInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefAvatarSmall: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  chefInfoText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
    gap: moderateScale(12),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  // Sticky Browse Menu Container
  stickyBrowseContainer: {
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // ✨ CLEAN & MODERN DISH CARD ✨
  dishCard: {
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  // Clean Hero Image Section
  heroImageContainer: {
    position: 'relative',
    height: moderateScale(140),
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(60),
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // Content Section
  dishContent: {
    padding: moderateScale(16),
  },
  dishInfo: {
    marginBottom: moderateScale(12),
  },
  dishName: {
    marginBottom: moderateScale(4),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dishDescription: {
    lineHeight: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  categoryBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  categoryText: {
    fontWeight: '600',
    fontSize: moderateScale(9),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action Section
  actionSection: {
    alignItems: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#FF4D67', // Background color for shadow efficiency
    gap: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityController: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  quantityControl: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityBadge: {
    minWidth: moderateScale(40),
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
  },
  unavailableState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    gap: moderateScale(6),
  },

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  errorTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  errorSubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  retryButton: {
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(12),
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    lineHeight: moderateScale(20),
  },

  // STUNNING Category Sections Styles
  stunningCategoriesContainer: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
  },
  categoriesTitle: {
    marginBottom: moderateScale(15),
    marginLeft: moderateScale(5),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stunningCategoriesList: {
    paddingHorizontal: moderateScale(5),
    gap: moderateScale(15),
  },
  stunningCategoryCard: {
    width: moderateScale(140),
    height: moderateScale(120),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    padding: moderateScale(16),
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  categoryIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryName: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryItemCount: {
    marginTop: moderateScale(2),
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  shineEffect: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    width: moderateScale(30),
    height: moderateScale(30),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: moderateScale(15),
    transform: [{ rotate: '45deg' }],
  },

  // Section Header Styles
  sectionHeader: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ChefMenu;
