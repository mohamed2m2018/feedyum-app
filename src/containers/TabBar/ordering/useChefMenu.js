import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useInfiniteQuery } from 'react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { showErrorToast, showActionDialog, showSuccessToast, ALERT_TYPE } from '../../../utils/toast';
import { formatDistance, getLocalizedText } from '../../../utils/helpers';
import request from '../../../api/request';
import branchService from '../../../api/branchService';
import { StackNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import {
  addToCart,
  selectCartItemCount,
  selectCartItems,
  selectPendingConflictItem,
  clearCartAndAddPending,
  clearPendingConflictItem,
  updateQuantity,
  removeFromCart,
} from '../../../redux/reducer/cartSlice';
import { useStorage } from '../../../utils/useStorage';
import { useLocation } from '../../../navigation/locationContext';

/**
 * Custom hook that encapsulates all data fetching, business logic,
 * and state management for the ChefMenu screen.
 */
const useChefMenu = () => {
  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const {
    chefId,
    scrollToDishId,
    chefName,
    averageDishRating: headerAvg = 0,
    ratedDishesCount: headerCount = 0,
  } = route.params;
  const [user] = useStorage('user');

  // Refs
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);
  const locationsSheetRef = useRef(null);
  const shareSheetRef = useRef(null);
  const hasAttemptedScrollRef = useRef(false);

  // Local state
  const [scrollRetryCount, setScrollRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  // Cart selectors
  const cartItemCount = useSelector(selectCartItemCount);
  const cartItems = useSelector(selectCartItems);
  const pendingConflictItem = useSelector(selectPendingConflictItem);

  // ─── Data Fetching ──────────────────────────────────────

  const fetchChefInfo = async (id) => {
    let menu = null;
    let chef = null;

    try {
      const menuResponse = await request.get(`/menus/chef/${id}`);
      menu = menuResponse.data;
    } catch (menuError) {
      // Menu may not exist yet
    }

    try {
      const chefResponse = await request.get(`/user/${id}`);
      const userData = chefResponse.data?.user || chefResponse.data;
      chef = {
        ...userData,
        currentUserFollowed: chefResponse.data?.currentUserFollowed || false,
      };
    } catch (chefError) {
      chef = {
        _id: id,
        fullName: chefName || strings.unknownChef,
        avatar: null,
        currentUserFollowed: false,
      };
    }

    return { menu, chef };
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

  // Branches
  const { data: branchesData } = useQuery(
    ['chefBranches', chefId],
    () => branchService.getBranches(chefId),
    { enabled: !!chefId, staleTime: 1000 * 60 * 10 }
  );

  // Open/closed status
  const { data: openStatusData } = useQuery(
    ['chefOpenStatus', chefId],
    () => branchService.getChefOpenStatus(chefId),
    { enabled: !!chefId, staleTime: 1000 * 60 * 2 }
  );
  const isChefClosedByApi = openStatusData?.success === true && !openStatusData?.isOpen;

  // Branch locations memo
  const branchLocations = useMemo(() => {
    return (branchesData?.branches || [])
      .filter(b => b.isActive)
      .map(b => ({
        _id: b._id,
        description: b.addressDetails?.formattedAddress || b.branchName,
        lat: b.location?.lat,
        long: b.location?.long,
        operatingHours: b.operatingHours || [],
        manualOverride: b.manualOverride || 'auto',
      }));
  }, [branchesData]);

  // Client-side schedule check
  const isChefClosedBySchedule = useMemo(() => {
    if (!branchLocations || branchLocations.length === 0) return false;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const todayKey = dayNames[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const anyBranchOpen = branchLocations.some(branch => {
      if (branch.manualOverride === 'forceOpen') return true;
      if (branch.manualOverride === 'forceClosed') return false;

      const hours = branch.operatingHours || [];
      if (hours.length === 0) return true;

      const todaySchedule = hours.find(h => h.day === todayKey);
      if (!todaySchedule || !todaySchedule.isOpen) return false;
      if (!todaySchedule.openTime || !todaySchedule.closeTime) return true;

      return currentTime >= todaySchedule.openTime && currentTime < todaySchedule.closeTime;
    });

    return !anyBranchOpen;
  }, [branchLocations]);

  const isChefClosed = isChefClosedByApi || isChefClosedBySchedule;

  // Delivery eligibility
  const location = useLocation();
  const userLat = location?.latitude;
  const userLng = location?.longitude;

  const { data: deliveryData } = useQuery(
    ['deliveryEligibility', chefId, userLat, userLng],
    async () => {
      const response = await request.get(
        `/orders/check-delivery/${chefId}?lat=${userLat}&long=${userLng}`
      );
      return response.data;
    },
    { enabled: !!chefId && !!userLat && !!userLng, staleTime: 1000 * 60 * 5 }
  );

  // Dishes (paginated)
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
      const response = await request.get(`/dishes/chef/${chefId}?page=${pageParam}&limit=20`);
      return response.data;
    },
    {
      enabled: !!chefId,
      getNextPageParam: (lastPage) => {
        if (Array.isArray(lastPage)) return undefined;
        if (lastPage.currentPage < lastPage.totalPages) return lastPage.currentPage + 1;
        return undefined;
      },
    }
  );

  const allDishes = useMemo(() => {
    if (!dishesData) return [];
    return dishesData.pages.flatMap(page => {
      if (Array.isArray(page)) return page;
      return page.dishes || [];
    });
  }, [dishesData]);

  const menuData = useMemo(() => ({
    ...chefInfoData,
    dishes: allDishes,
  }), [chefInfoData, allDishes]);

  const isLoading = isChefInfoLoading;
  const error = chefInfoError;
  const refetch = () => { refetchChefInfo(); refetchDishes(); };

  // ─── Search ─────────────────────────────────────────────

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const onSearchInput = useCallback((text) => {
    setSearch(text);
    clearTimeout(onSearchInput._t);
    onSearchInput._t = setTimeout(() => setDebouncedSearch(text), 500);
  }, []);

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
      return res?.data?.data?.dishes || res?.data?.dishes || [];
    },
    { enabled: !!chefId && debouncedSearch.length > 0 }
  );

  // ─── Scroll To Dish ─────────────────────────────────────

  useEffect(() => {
    if (scrollToDishId && allDishes.length > 0 && flatListRef.current && !hasAttemptedScrollRef.current) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          const dishIndex = allDishes.findIndex(
            dish => dish._id === scrollToDishId || dish.id === scrollToDishId,
          );
          if (dishIndex !== -1) {
            try {
              flatListRef.current.scrollToIndex({ index: dishIndex, animated: true, viewPosition: 0.1 });
              hasAttemptedScrollRef.current = true;
            } catch (e) { /* handled by onScrollToIndexFailed */ }
          }
        }, 500);
      });
    }
  }, [scrollToDishId, allDishes]);

  useEffect(() => {
    if (!menuData?.dishes || !scrollToDishId || !flatListRef.current) return;
    if (hasAttemptedScrollRef.current) return;

    const index = menuData.dishes.findIndex(d => d._id === scrollToDishId || d.id === scrollToDishId);
    if (index === -1) return;

    const tryScroll = (attempt = 0) => {
      if (!flatListRef.current) return;
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.1 });
        hasAttemptedScrollRef.current = true;
      } catch (err) {
        if (attempt < 5) setTimeout(() => tryScroll(attempt + 1), 200);
      }
    };

    InteractionManager.runAfterInteractions(() => tryScroll(0));
  }, [menuData?.dishes, scrollToDishId]);

  // ─── Cart Actions ───────────────────────────────────────

  const handleAddToCart = async (dish, quantity = 1) => {
    if (!dish || quantity <= 0) return;

    if (isChefClosed) {
      showErrorToast(strings.restaurantClosed, strings.restaurantClosedCannotOrder);
      return;
    }

    if (deliveryData && !deliveryData.canDeliver) {
      const distanceInfo = deliveryData.nearestDistance
        ? ` (${(strings.distanceAway || '{0} km').replace('{0}', formatDistance(deliveryData.nearestDistance))})`
        : '';
      showErrorToast(
        strings.doesNotDeliverHere || 'Does not deliver here',
        (strings.kitchenDoesNotDeliverMessage || 'This kitchen cannot deliver to your location.') + distanceInfo
      );
      return;
    }

    try {
      dispatch(addToCart({ dish, quantity, chefId, chefName: chefName || strings.unknownChef }));
      showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, getLocalizedText(dish?.name, dish?.nameArabic, dish?.nameEnglish)));
    } catch (err) {
      showErrorToast(strings.error, strings.failedToAddItemToCart);
    }
  };

  const handleQuantityChange = (dish, delta) => {
    const dishId = dish._id;
    const dishCartEntries = cartItems.filter(item => item.dishId === dishId);
    const totalQty = dishCartEntries.reduce((sum, item) => sum + item.quantity, 0);

    if (delta > 0) {
      handleAddToCart(dish, 1);
    } else if (delta < 0 && totalQty > 0) {
      const entry = dishCartEntries[0];
      if (entry.quantity <= 1) {
        dispatch(removeFromCart({ dishId, cartItemKey: entry.cartItemKey }));
      } else {
        dispatch(updateQuantity({ dishId, quantity: entry.quantity - 1, cartItemKey: entry.cartItemKey }));
      }
    }
  };

  const handleCartPress = () => navigation.navigate(StackNav.ShoppingCart);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Cart conflict resolution
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
          showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, getLocalizedText(pendingConflictItem.dish?.name, pendingConflictItem.dish?.nameArabic, pendingConflictItem.dish?.nameEnglish)));
        },
        onCancel: () => {
          dispatch(clearPendingConflictItem());
          navigation.navigate(StackNav.ShoppingCart);
        },
      });
    }
  }, [pendingConflictItem, dispatch, navigation]);

  return {
    // Route params
    chefId,
    chefName,
    user,
    // Data
    menuData,
    allDishes,
    isLoading,
    error,
    refetch,
    branchLocations,
    isChefClosed,
    openStatusData,
    deliveryData,
    // Cart
    cartItems,
    cartItemCount,
    // Search
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    isSearching,
    searchedDishes,
    onSearchInput,
    selectedCategory,
    setSelectedCategory,
    // Actions
    handleQuantityChange,
    handleAddToCart,
    handleCartPress,
    handleRefresh,
    refreshing,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Refs
    flatListRef,
    searchInputRef,
    locationsSheetRef,
    shareSheetRef,
    // Branch selection
    selectedBranchId,
    setSelectedBranchId,
    // Theme
    colors,
  };
};

export default useChefMenu;
