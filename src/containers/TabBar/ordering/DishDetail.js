import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  I18nManager,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { showSuccessToast, showErrorToast, showSuccessDialog, showActionDialog, ALERT_TYPE } from '../../../utils/toast';
import { formatDistance, getLocalizedText } from '../../../utils/helpers';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZLoader from '../../../components/common/ZLoader';
import StarRating from '../../../components/StarRating';
import ReviewsList from '../../../components/ReviewsList';
import ReviewStoriesSection from '../../../components/ReviewStoriesSection';
import strings from '../../../i18n/strings';
import { moderateScale } from '../../../common/constants';
import { styles } from '../../../themes';
import { StackNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import images from '../../../assets/images';
import {
  selectPendingConflictItem,
  clearPendingConflictItem,
  clearCartAndAddPending,
  selectCartItemCount,
  addToCart,
  updateCartItem,
} from '../../../redux/reducer/cartSlice';
import { useStorage } from '../../../utils/useStorage';
import { useLocation } from '../../../navigation/locationContext';
import branchService from '../../../api/branchService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DishDetailScreen = () => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const queryClient = useQueryClient();
  const [user] = useStorage('user');

  const { dishId, chefId, editCartItemKey, editSelectedOptions, editQuantity } = route.params;
  const isEditMode = !!editCartItemKey;
  const [quantity, setQuantity] = useState(isEditMode ? (editQuantity || 1) : 1);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('reviews');
  const [scrollY] = useState(new Animated.Value(0));
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});  // { groupName: [optionNames] }

  // Cart selectors
  const cartItemCount = useSelector(selectCartItemCount);
  const pendingConflictItem = useSelector(selectPendingConflictItem);

  // Fetch dish details
  const {
    data: dishData,
    isLoading: dishLoading,
    error: dishError,
    refetch: refetchDish,
  } = useQuery(
    ['dishDetail', dishId],
    async () => {
      try {
        const response = await request.get(`/dishes/${dishId}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    {
      enabled: !!dishId,
      retry: 2,
    },
  );

  // Fetch dish reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery(
    ['dishReviews', dishId],
    async () => {
      const response = await request.get(`/reviews/dish/${dishId}`);
      return response.data;
    },
    {
      enabled: !!dishId && selectedTab === 'reviews',
      retry: 2,
    },
  );

  // Fetch review stories (reels) for this dish
  const {
    data: reviewStoriesData,
    isLoading: reviewStoriesLoading,
    refetch: refetchReviewStories,
  } = useQuery(
    ['dishReviewStories', dishId],
    async () => {
      const response = await request.get(`/story/reviews/dish/${dishId}`);
      return response.data;
    },
    {
      enabled: !!dishId,
      retry: 2,
    },
  );

  // Chef data comes from dish data, with fallback to separate fetch
  const chefData = dishData?.chef;

  // Fallback: fetch chef data separately if not included in dish data
  const { data: fallbackChefData } = useQuery(
    ['chefInfo', chefId],
    async () => {
      const response = await request.get(`/user/${chefId}`);
      return response.data;
    },
    {
      enabled: !!chefId && !chefData,
      retry: 1,
    },
  );

  // Use chef data from dish or fallback
  const finalChefData = chefData || fallbackChefData;

  // Derive effective chefId (from params or from dish data)
  const effectiveChefId = chefId || dishData?.user_id;

  // Get user's location for delivery check - use current location (respects delivery address)
  const location = useLocation();
  const userLat = location?.latitude;
  const userLng = location?.longitude;
  const destinationPlaceId =
    location?.selectedAddress?.deliveryArea?.placeId ||
    location?.selectedAddress?.deliveryAreaPlaceId;
  const destinationPlaceName =
    location?.selectedAddress?.deliveryArea?.nameAr ||
    location?.selectedAddress?.deliveryArea?.name ||
    location?.selectedAddress?.deliveryArea?.nameEn ||
    location?.selectedAddress?.deliveryAreaName;

  // Check delivery eligibility to user's location
  const { data: deliveryData } = useQuery(
    ['deliveryEligibility', effectiveChefId, userLat, userLng, destinationPlaceId],
    async () => {
      const response = await request.get(`/orders/check-delivery/${effectiveChefId}`, {
        params: {
          lat: userLat,
          long: userLng,
          ...(destinationPlaceId ? { placeId: destinationPlaceId } : {}),
          ...(destinationPlaceName ? { placeName: destinationPlaceName } : {}),
        },
      });
      return response.data;
    },
    {
      enabled: !!effectiveChefId && !!userLat && !!userLng,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Check if chef is currently open
  const { data: openStatusData } = useQuery(
    ['chefOpenStatus', effectiveChefId],
    () => branchService.getChefOpenStatus(effectiveChefId),
    {
      enabled: !!effectiveChefId,
      staleTime: 1000 * 60 * 2,
    }
  );
  const isChefClosed = openStatusData?.success === true && !openStatusData?.isOpen;

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation(
    async () => {
      const response = await request.post('/favorites/add', {
        dishId: dishId,
        type: 'dish',
      });
      return response.data;
    },
    {
      onSuccess: () => {
        showSuccessToast(
          strings.favoritesAddedTitle,
          strings.formatString(strings.favoritesAddedMsg, dishData?.name)
        );
        queryClient.invalidateQueries(['dishDetail', dishId]);
      },
      onError: error => {
        showErrorToast(strings.error, error.message || strings.failedToAddToFavorites);
      },
    },
  );

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation(
    async () => {
      const response = await request.delete(`/favorites/remove/${dishId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        showSuccessToast(
          strings.favoritesRemovedTitle,
          strings.formatString(strings.favoritesRemovedMsg, dishData?.name)
        );
        queryClient.invalidateQueries(['dishDetail', dishId]);
      },
      onError: error => {
        showErrorToast(
          strings.error,
          error.message || strings.failedToRemoveFromFavorites,
        );
      },
    },
  );

  // Initialize option selections when dish data loads
  React.useEffect(() => {
    if (dishData?.optionGroups && dishData.optionGroups.length > 0) {
      // In edit mode, restore selections from the cart item
      if (isEditMode && editSelectedOptions && editSelectedOptions.length > 0) {
        const restored = {};
        editSelectedOptions.forEach(so => {
          if (so.groupName && so.optionNames) {
            restored[so.groupName] = so.optionNames;
          }
        });
        setSelectedOptions(restored);
      } else {
        // Normal mode: pick defaults
        const defaults = {};
        dishData.optionGroups.forEach(group => {
          const defaultOpt = group.options.find(o => o.isDefault);
          if (defaultOpt) {
            defaults[group.name] = [defaultOpt.name];
          } else if (group.required && group.type === 'single' && group.options.length > 0) {
            defaults[group.name] = [group.options[0].name];
          }
        });
        setSelectedOptions(defaults);
      }
    }
  }, [dishData]);

  // Calculate total price including selected option adjustments
  const calculateTotalPrice = () => {
    if (!dishData) return 0;
    let adjustment = 0;
    if (dishData.optionGroups) {
      dishData.optionGroups.forEach(group => {
        const selectedNames = selectedOptions[group.name] || [];
        selectedNames.forEach(optName => {
          const opt = group.options.find(o => o.name === optName);
          if (opt) adjustment += (opt.priceAdjustment || 0);
        });
      });
    }
    return (dishData.price + adjustment) * quantity;
  };

  // Check if all required option groups are satisfied
  const areRequiredOptionsSatisfied = () => {
    if (!dishData?.optionGroups) return true;
    return dishData.optionGroups
      .filter(g => g.required)
      .every(group => {
        const selected = selectedOptions[group.name] || [];
        const minSelect = group.min || (group.type === 'single' ? 1 : 1);
        return selected.length >= minSelect;
      });
  };

  // Build selectedOptions array for cart dispatch
  const buildSelectedOptionsForCart = () => {
    if (!dishData?.optionGroups) return [];
    return dishData.optionGroups
      .filter(group => (selectedOptions[group.name] || []).length > 0)
      .map(group => {
        const selectedNames = selectedOptions[group.name] || [];
        let totalAdj = 0;
        selectedNames.forEach(optName => {
          const opt = group.options.find(o => o.name === optName);
          if (opt) totalAdj += (opt.priceAdjustment || 0);
        });
        return {
          groupName: group.name,
          optionNames: selectedNames,
          totalAdjustment: totalAdj,
        };
      });
  };

  // Handle option selection (single = radio, multiple = checkbox)
  const handleOptionSelect = (groupName, optionName, groupType) => {
    setSelectedOptions(prev => {
      const current = prev[groupName] || [];
      if (groupType === 'single') {
        return { ...prev, [groupName]: [optionName] };
      } else {
        // Multiple: toggle
        const exists = current.includes(optionName);
        return {
          ...prev,
          [groupName]: exists
            ? current.filter(n => n !== optionName)
            : [...current, optionName],
        };
      }
    });
  };

  const handleAddToCart = () => {
    if (!dishData) return;

    // Block if restaurant is closed
    if (isChefClosed) {
      showErrorToast(
        strings.restaurantClosed || 'Restaurant Closed',
        strings.restaurantClosedCannotOrder || 'This restaurant is currently closed'
      );
      return;
    }

    // Block if kitchen doesn't deliver to user's location
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

    const computedChefName =
      finalChefData?.fullName || route?.params?.chefName || strings.unknownChef;

    const cartSelectedOptions = buildSelectedOptionsForCart();

    dispatch(
      addToCart({
        dish: dishData,
        quantity,
        chefId,
        chefName: computedChefName,
        selectedOptions: cartSelectedOptions,
      }),
    );

    showActionDialog({
      type: ALERT_TYPE.SUCCESS,
      title: strings.addedToCartTitle,
      message: strings.formatString(strings.addedToCartMsg, quantity, dishData.name),
      confirmText: strings.viewCart,
      cancelText: strings.continueShoppingButton,
      onConfirm: () => navigation.navigate(StackNav.ShoppingCart),
      onCancel: () => {
        if (route?.params?.fromDiscover && chefId) {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'TabBar', params: { screen: 'Discover' } },
                {
                  name: StackNav.ChefMenu,
                  params: {
                    chefId: chefId,
                    chefName: computedChefName,
                  },
                },
              ],
            }),
          );
        } else {
          navigation.navigate(StackNav.ChefMenu, {
            chefId: chefId,
            chefName: computedChefName,
          });
        }
      },
    });
  };

  // Handle updating an existing cart item (edit mode)
  const handleUpdateCartItem = () => {
    if (!dishData) return;

    const cartSelectedOptions = buildSelectedOptionsForCart();

    dispatch(
      updateCartItem({
        oldCartItemKey: editCartItemKey,
        dish: dishData,
        selectedOptions: cartSelectedOptions,
        quantity,
      }),
    );

    showSuccessToast(
      strings.success,
      strings.cartUpdated || 'Cart updated',
    );
    navigation.goBack();
  };

  const handleQuantityChange = change => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleToggleFavorite = () => {
    if (dishData?.isFavorite) {
      removeFromFavoritesMutation.mutate();
    } else {
      addToFavoritesMutation.mutate();
    }
  };

  const handleBack = () => {
    const { fromDiscover, chefId, chefName } = route.params;

    if (fromDiscover && chefId) {
      // Reset navigation stack to show: Discover -> ChefMenu
      // This way back from ChefMenu goes to Discover, not to DishDetail
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'TabBar', params: { screen: 'Discover' } },
            {
              name: StackNav.ChefMenu,
              params: {
                chefId: chefId,
                chefName: chefName || 'Chef Menu',
              }
            },
          ],
        })
      );
    } else {
      navigation.goBack();
    }
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
          showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, getLocalizedText(pendingConflictItem.dish?.name, pendingConflictItem.dish?.nameArabic, pendingConflictItem.dish?.nameEnglish)));
        },
        onCancel: () => {
          dispatch(clearPendingConflictItem());
          navigation.navigate(StackNav.ShoppingCart);
        },
      });
    }
  }, [pendingConflictItem, dispatch, navigation]);

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 200],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          localStyles.animatedHeader,
          {
            backgroundColor: colors.backgroundColor,
            opacity: headerOpacity,
          },
        ]}>
        <TouchableOpacity
          style={[localStyles.headerButton, { backgroundColor: colors.white }]}
          onPress={handleBack}>
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={moderateScale(24)}
            color="#1A1A1A"
          />
        </TouchableOpacity>

        <ZText type="B18" color="#1A1A1A" numberOfLines={1}>
          {dishData ? getLocalizedText(dishData.name, dishData.nameArabic, dishData.nameEnglish) : ''}
        </ZText>

        <TouchableOpacity
          style={[localStyles.headerButton, { backgroundColor: colors.white }]}
          onPress={handleToggleFavorite}
          disabled={
            addToFavoritesMutation.isLoading ||
            removeFromFavoritesMutation.isLoading
          }>
          <Ionicons
            name={dishData?.isFavorite ? 'heart' : 'heart-outline'}
            size={moderateScale(24)}
            color={dishData?.isFavorite ? '#FF4D67' : '#1A1A1A'}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeroSection = () => (
    <View style={localStyles.heroSection}>
      <Image
        source={
          dishData?.image ? { uri: dishData.image } : images.dishPlaceholder
        }
        style={localStyles.heroImage}
        resizeMode="cover"
      />

      {/* Floating Action Buttons */}
      <View style={localStyles.floatingActions}>
        <TouchableOpacity
          style={localStyles.floatingButton}
          onPress={handleBack}>
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={moderateScale(24)}
            color="#1A1A1A"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.floatingButton}
          onPress={handleToggleFavorite}
          disabled={
            addToFavoritesMutation.isLoading ||
            removeFromFavoritesMutation.isLoading
          }>
          <Ionicons
            name={dishData?.isFavorite ? 'heart' : 'heart-outline'}
            size={moderateScale(24)}
            color={dishData?.isFavorite ? '#FF4D67' : '#1A1A1A'}
          />
        </TouchableOpacity>
      </View>

      {/* Rating Badge - always show stars; empty if no rating */}
      <View style={localStyles.ratingBadge}>
        <StarRating
          rating={Number.isFinite(dishData?.average_rating) ? dishData.average_rating : 0}
          size="medium"
          showText={true}
          showCount={false}
          showWhenNoRating={true}
        />
      </View>
    </View>
  );

  const renderDishInfo = () => (
      <View
        style={[localStyles.dishInfoSection, { backgroundColor: colors.white }]}>
        {/* Dish Name and Price */}
        <View style={localStyles.dishHeader}>
          <View style={localStyles.dishTitleSection}>
            <ZText type="B24" color="#1A1A1A" style={localStyles.dishName}>
              {dishData ? getLocalizedText(dishData.name, dishData.nameArabic, dishData.nameEnglish) : ''}
            </ZText>
            <ZText type="B20" color="#FF4D67" style={localStyles.dishPrice}>
              {dishData?.pricingType === 'upon_request'
                ? strings.uponRequest
                : `${dishData?.price} ${strings.currency}`}
            </ZText>
          </View>

          {/* Chef Info */}
          <TouchableOpacity
            style={localStyles.chefInfo}
            onPress={() => navigation.navigate(StackNav.ChefMenu, { chefId, chefName: finalChefData?.fullName || strings.unknownChef })}>
            <Image
              source={
                finalChefData?.avatar
                  ? { uri: finalChefData.avatar }
                  : colors.dark
                    ? images.userDark
                    : images.userLight
              }
              style={localStyles.chefAvatar}
            />
            <View>
              <ZText type="M12" color="#888888">
                {strings.chef ? strings.chef.replace(':', '') : 'Kitchen'}
              </ZText>
              <ZText type="B14" color="#1A1A1A">
                {finalChefData?.fullName || strings.unknownChef}
              </ZText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={localStyles.descriptionSection}>
          <ZText
            type="M16"
            color="#555555"
            style={localStyles.description}
            numberOfLines={showFullDescription ? undefined : 3}>
            {dishData ? getLocalizedText(dishData.description, dishData.descriptionArabic, dishData.descriptionEnglish) : ''}
          </ZText>

          {dishData?.description && dishData.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}>
              <ZText type="B14" color="#FF4D67" style={styles.mt5}>
                {showFullDescription ? strings.showLess : strings.readMore}
              </ZText>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags */}
        {dishData?.tags && dishData.tags.length > 0 && (
          <View style={localStyles.tagsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dishData.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[localStyles.tag, { backgroundColor: '#FF4D67' + '15' }]}>
                  <ZText type="M12" color="#FF4D67">
                    {tag}
                  </ZText>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
  );

  const renderTabBar = () => (
    <View style={[localStyles.tabBar, { backgroundColor: colors.white }]}>
      <TouchableOpacity
        style={[
          localStyles.tab,
          selectedTab === 'reviews' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setSelectedTab('reviews')}>
        <ZText
          type="B14"
          color={selectedTab === 'reviews' ? colors.white : colors.textColor}>
          {strings.formatString(strings.reviewsCount, reviewStoriesData?.reviewStories?.length || 0)}
        </ZText>
      </TouchableOpacity>

      {dishData?.ingredients && dishData.ingredients.length > 0 && (
        <TouchableOpacity
          style={[
            localStyles.tab,
            selectedTab === 'ingredients' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setSelectedTab('ingredients')}>
          <ZText
            type="B14"
            color={selectedTab === 'ingredients' ? colors.white : colors.textColor}>
            {strings.ingredients}
          </ZText>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'reviews':
        return renderReviewsTab();
      case 'ingredients':
        return renderIngredientsTab();
      default:
        return renderReviewsTab();
    }
  };

  const renderDetailsTab = () => (
    <View style={[localStyles.tabContent, { backgroundColor: colors.white }]}>
      {/* Nutritional Info */}
      {dishData?.nutritionalInfo && (
        <View style={localStyles.nutritionSection}>
          <ZText type="B18" color="#1A1A1A" style={styles.mb15}>
            {strings.nutritionalInfo}
          </ZText>
          <View style={localStyles.nutritionGrid}>
            {Object.entries(dishData.nutritionalInfo).map(([key, value]) => (
              <View key={key} style={localStyles.nutritionItem}>
                <ZText type="M12" color="#888888">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </ZText>
                <ZText type="B14" color="#1A1A1A">
                  {value}
                </ZText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Preparation Time */}
      {dishData?.preparationTime && (
        <View style={localStyles.infoRow}>
          <MaterialIcon
            name="clock-outline"
            size={moderateScale(20)}
            color={colors.primary}
          />
          <ZText type="M16" color="#1A1A1A" style={styles.ml10}>
            {strings.formatString(strings.preparationTime, dishData.preparationTime)}
          </ZText>
        </View>
      )}

      {/* Dietary Info */}
      {dishData?.dietaryInfo && dishData.dietaryInfo.length > 0 && (
        <View style={localStyles.dietarySection}>
          <ZText type="B16" color="#1A1A1A" style={styles.mb10}>
            {strings.dietaryInfo}
          </ZText>
          {dishData.dietaryInfo.map((info, index) => (
            <View key={index} style={localStyles.dietaryItem}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(16)}
                color={colors.success}
              />
              <ZText type="M14" color="#1A1A1A" style={styles.ml8}>
                {info}
              </ZText>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderReviewsTab = () => {
    if (reviewsLoading && reviewStoriesLoading) {
      return (
        <View style={localStyles.loadingContainer}>
          <ZLoader />
        </View>
      );
    }

    const reviewStories = reviewStoriesData?.reviewStories || [];
    const displayedReviews = reviewStories.slice(0, 4);
    const hasMoreReviews = reviewStories.length > 4;

    return (
      <View style={[localStyles.tabContent, { backgroundColor: colors.white }]}>
        {/* Stunning Review Posts Section */}
        <View style={localStyles.reviewPostsContainer}>
          <View style={localStyles.reviewPostsHeader}>
            <ZText type="B18" color={colors.textColor}>
              {strings.formatString(strings.reviewPostsCount, reviewStories.length)}
            </ZText>
            <TouchableOpacity onPress={refetchReviewStories}>
              <Ionicons name="refresh" size={moderateScale(20)} color={colors.primary} />
            </TouchableOpacity>
          </View>



          {displayedReviews.length > 0 ? (
            <View style={localStyles.reviewGrid}>
              {displayedReviews.map((story, index) => (
                <TouchableOpacity
                  key={story._id}
                  style={[localStyles.reviewPostCard, { backgroundColor: colors.backgroundColor }]}
                  onPress={() => handleReviewStoryPress(story)}
                >
                  {/* Rating Badge */}
                  <View style={[localStyles.reviewRatingBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="star" size={moderateScale(12)} color={colors.white} />
                    <ZText type="B12" color={colors.white} style={styles.ml4}>
                      {story.rating}/5
                    </ZText>
                  </View>

                  {/* Media */}
                  <View style={localStyles.reviewMediaContainer}>
                    {story.avatarUri || story.poster ? (
                      <Image
                        source={{ uri: story.avatarUri || story.poster }}
                        style={localStyles.reviewMedia}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[localStyles.reviewMediaPlaceholder, { backgroundColor: colors.grayScale2 }]}>
                        <Ionicons name="image" size={moderateScale(32)} color={colors.grayScale5} />
                      </View>
                    )}

                    {story.uri && (
                      <View style={localStyles.playButton}>
                        <Ionicons name="play" size={moderateScale(20)} color={colors.white} />
                      </View>
                    )}
                  </View>

                  {/* Author Info */}
                  <View style={localStyles.reviewAuthor}>
                    <Image
                      source={
                        story.author?.avatar
                          ? { uri: story.author.avatar }
                          : require('../../../assets/images/userLight.png')
                      }
                      style={localStyles.reviewAuthorAvatar}
                    />
                    <View style={localStyles.reviewAuthorInfo}>
                      <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                        {story.author?.fullName || strings.anonymous}
                      </ZText>
                      <View style={localStyles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={story.rating && story.rating > 0
                              ? (star <= story.rating ? 'star' : 'star-outline')
                              : 'star'
                            }
                            size={moderateScale(12)}
                            color={story.rating && story.rating > 0
                              ? (star <= story.rating ? '#FFD700' : colors.grayScale4)
                              : (colors.grayScale4 || "#CCCCCC")
                            }
                            style={{
                              opacity: story.rating && story.rating > 0 ? 1 : 0.4
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={localStyles.emptyReviewsContainer}>
              <Ionicons name="star-outline" size={moderateScale(64)} color={colors.grayScale4} />
              <ZText type="B16" color={colors.grayScale5} style={styles.mt16}>
                {strings.noReviewPosts}
              </ZText>
              <ZText type="M14" color={colors.grayScale5} style={styles.mt8}>
                {strings.beTheFirstToReview}
              </ZText>
            </View>
          )}

          {hasMoreReviews && (
            <TouchableOpacity
              style={[localStyles.seeMoreButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate(StackNav.ReviewReelDetail, {
                dishId,
                reviews: reviewStories
              })}
            >
              <ZText type="B16" color={colors.white}>
                {strings.formatString(strings.seeMoreReviews, reviewStories.length - 4)}
              </ZText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderIngredientsTab = () => (
    <View style={[localStyles.tabContent, { backgroundColor: colors.white }]}>
      {dishData?.ingredients && dishData.ingredients.length > 0 ? (
        <View style={localStyles.ingredientsSection}>
          <ZText type="B18" color="#1A1A1A" style={styles.mb15}>
            {strings.ingredients}
          </ZText>
          {dishData.ingredients.map((ingredient, index) => (
            <View key={index} style={localStyles.ingredientItem}>
              <View style={localStyles.ingredientBullet} />
              <ZText type="M16" color="#1A1A1A" style={styles.ml10}>
                {ingredient}
              </ZText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  const handleReviewStoryPress = (story) => {
    navigation.navigate(StackNav.SingleReel, {
      storyId: story._id,
      profile: { _id: story.author._id },
      stories: [story],
    });
  };

  const handleCreateReviewReel = () => {
    navigation.navigate('ReviewReelCreator', {
      dishData,
      reviewType: 'dish',
    });
  };

  // Render option groups (Talabat-style premium)
  const renderOptionGroups = () => {
    if (!dishData?.optionGroups || dishData.optionGroups.length === 0) return null;

    return (
      <View style={localStyles.optionGroupsContainer}>
        {/* Section Header */}
        <View style={localStyles.optionGroupsSectionHeader}>
          <View style={localStyles.optionGroupsTitleRow}>
            <Ionicons name="options-outline" size={moderateScale(20)} color="#FF4D67" />
            <ZText type="B18" color="#1A1A1A" style={{ marginLeft: moderateScale(8) }}>
              {strings.customizeYourOrder || 'Customize Your Order'}
            </ZText>
          </View>
        </View>

        {dishData.optionGroups.map((group, gIdx) => {
          const currentSelections = selectedOptions[group.name] || [];

          return (
            <View key={gIdx} style={localStyles.optionGroupBlock}>
              {/* Group Header */}
              <View style={localStyles.optionGroupHeader}>
                <View style={{ flex: 1 }}>
                  <ZText type="B16" color="#1A1A1A">
                    {group.name}
                  </ZText>
                  <ZText type="R12" color="#888888" style={{ marginTop: moderateScale(2) }}>
                    {group.type === 'single'
                      ? (strings.selectOne || 'Select one')
                      : group.max > 0
                        ? strings.formatString(strings.selectUpTo || 'Select up to {0}', group.max)
                        : (strings.selectAny || 'Select as many as you like')}
                  </ZText>
                </View>
                {group.required && (
                  <View style={localStyles.requiredBadge}>
                    <ZText type="B10" color="#FF4D67">
                      {strings.required || 'Required'}
                    </ZText>
                  </View>
                )}
              </View>

              {/* Options */}
              {group.options.map((opt, oIdx) => {
                const isSelected = currentSelections.includes(opt.name);
                const isLast = oIdx === group.options.length - 1;

                return (
                  <TouchableOpacity
                    key={oIdx}
                    activeOpacity={0.7}
                    style={[
                      localStyles.optionItem,
                      {
                        backgroundColor: isSelected ? '#FF4D6710' : '#FFFFFF',
                        borderColor: isSelected ? '#FF4D67' : '#F0F0F0',
                      },
                      !isLast && { marginBottom: moderateScale(8) },
                    ]}
                    onPress={() => handleOptionSelect(group.name, opt.name, group.type)}>
                    {/* Custom Radio / Checkbox */}
                    <View style={[
                      localStyles.optionIndicator,
                      group.type === 'single' ? localStyles.radioOuter : localStyles.checkboxOuter,
                      {
                        borderColor: isSelected ? '#FF4D67' : '#CCCCCC',
                      },
                    ]}>
                      {isSelected && (
                        <View style={[
                          group.type === 'single' ? localStyles.radioInner : localStyles.checkboxInner,
                          { backgroundColor: '#FF4D67' },
                        ]}>
                          {group.type !== 'single' && (
                            <Ionicons name="checkmark" size={moderateScale(12)} color="#FFF" />
                          )}
                        </View>
                      )}
                    </View>

                    {/* Option Name */}
                    <ZText
                      type={isSelected ? 'B14' : 'M14'}
                      color={isSelected ? '#1A1A1A' : '#555555'}
                      style={{ flex: 1, marginLeft: moderateScale(12) }}>
                      {opt.name}
                    </ZText>

                    {/* Price Badge */}
                    {opt.priceAdjustment > 0 ? (
                      <View style={localStyles.priceBadge}>
                        <ZText type="B12" color="#FF4D67">
                          +{opt.priceAdjustment} {strings.currency}
                        </ZText>
                      </View>
                    ) : (
                      <ZText type="R12" color="#AAAAAA">
                        {strings.noExtraCost || 'Free'}
                      </ZText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  const renderBottomSection = () => {
    // Hide cart controls if current user is the chef/owner of the dish
    const currentUserId = user?._id?.toString();
    const dishOwnerId = (dishData?.user_id || chefId)?.toString();

    const isOwner = currentUserId === dishOwnerId;
    if (isOwner) return null;

    const isUponRequest = dishData?.pricingType === 'upon_request';

    // ─── Upon Request: Clean CTA → opens notes modal ───
    if (isUponRequest) {
      return (
        <View style={[localStyles.bottomSection, { backgroundColor: colors.white }]}>
          <ZButton
            title={strings.requestQuote}
            onPress={() => setShowQuoteModal(true)}
            containerStyle={localStyles.addToCartButton}
            frontIcon={
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={moderateScale(18)}
                color={colors.white}
                style={{ marginRight: moderateScale(6) }}
              />
            }
          />
        </View>
      );
    }

    // ─── Fixed Price: Normal quantity + add to cart ───
    const totalPrice = calculateTotalPrice();
    const requiredSatisfied = areRequiredOptionsSatisfied();

    return (
      <View style={[localStyles.bottomSection, { backgroundColor: colors.white }]}>


        {/* Quantity Selector */}
        <View style={localStyles.quantitySection}>
          <ZText type="B16" color="#1A1A1A" style={styles.mb10}>
            {strings.quantity}
          </ZText>
          <View style={localStyles.quantityControls}>
            <TouchableOpacity
              style={[
                localStyles.quantityButton,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => handleQuantityChange(-1)}>
              <Ionicons
                name="remove"
                size={moderateScale(20)}
                color={colors.textColor}
              />
            </TouchableOpacity>

            <View style={localStyles.quantityDisplay}>
              <ZText type="B20" color={colors.primary}>
                {quantity}
              </ZText>
            </View>

            <TouchableOpacity
              style={[
                localStyles.quantityButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => handleQuantityChange(1)}>
              <Ionicons
                name="add"
                size={moderateScale(20)}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ZButton
          title={isEditMode
            ? strings.formatString(strings.updateCartPrice || 'Update Cart - {0} {1}', totalPrice.toFixed(0), strings.currency)
            : strings.formatString(strings.addToCartPrice, totalPrice.toFixed(0), strings.currency)}
          onPress={isEditMode ? handleUpdateCartItem : handleAddToCart}
          containerStyle={[
            localStyles.addToCartButton,
            !requiredSatisfied && { opacity: 0.5 },
          ]}
          disabled={!dishData?.visible || !requiredSatisfied}
        />
      </View>
    );
  };

  if (dishLoading) {
    return (
      <ZSafeAreaView>
        {renderHeader()}
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (dishError || !dishData) {
    return (
      <ZSafeAreaView>
        {renderHeader()}
        <View style={localStyles.errorContainer}>
          <MaterialIcon
            name="food-off"
            size={moderateScale(64)}
            color={colors.grayScale7}
          />
          <ZText
            type="B16"
            align="center"
            color={colors.error}
            style={localStyles.errorTitle}>
            {strings.failedToLoadDish}
          </ZText>
          <ZText
            type="M14"
            align="center"
            color={colors.grayScale7}
            style={localStyles.errorSubtitle}>
            {strings.dishLoadErrorMsg}
          </ZText>
          <ZButton
            title={strings.retry}
            onPress={refetchDish}
            containerStyle={localStyles.retryButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      {renderHeader()}

      <Animated.ScrollView
        style={localStyles.container}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}>
        {renderHeroSection()}
        {renderDishInfo()}
        {renderOptionGroups()}
        {/* Prominent Add Review Button - Immediately Visible (Hidden for Chefs) */}
        {user?.type !== 'chef' && (
          <View style={localStyles.prominentButtonContainer}>
            <View style={localStyles.prominentAddReviewButton}>
              <TouchableOpacity
                style={localStyles.touchableButton}
                onPress={handleCreateReviewReel}>
                <LinearGradient
                  colors={['#FF6B8A', '#FF4D67', '#E63946']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={localStyles.gradientButton}>
                  <View style={localStyles.addReviewContent}>
                    <View style={localStyles.starContainer}>
                      <Ionicons
                        name="star"
                        size={moderateScale(28)}
                        color="#FFD700"
                      />
                      <Ionicons
                        name="star"
                        size={moderateScale(24)}
                        color="#FFD700"
                        style={styles.ml2}
                      />
                      <Ionicons
                        name="star"
                        size={moderateScale(20)}
                        color="#FFD700"
                        style={styles.ml1}
                      />
                    </View>
                    <View style={localStyles.reviewTextContainer}>
                      <ZText type="B16" color={colors.white} numberOfLines={1}>
                        {strings.shareYourExperience}
                      </ZText>
                      <ZText type="M12" color={colors.white} style={styles.opacity90} numberOfLines={2}>
                        {strings.createReviewReelDesc}
                      </ZText>
                    </View>
                    <View style={localStyles.arrowContainer}>
                      <View style={localStyles.arrowCircle}>
                        <Ionicons
                          name="chevron-forward"
                          size={moderateScale(20)}
                          color={colors.white}
                        />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {renderTabBar()}
        {renderTabContent()}
      </Animated.ScrollView>

      {renderBottomSection()}

      {/* Quote Request Modal */}
      <Modal
        visible={showQuoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuoteModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowQuoteModal(false)}>
          <View style={localStyles.quoteModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={localStyles.quoteModalContent}
              >
                <View style={[localStyles.quoteModalCard, { backgroundColor: colors.backgroundColor }]}>
                  {/* Header */}
                  <View style={localStyles.quoteModalHeader}>
                    <ZText type="B18" color={colors.textColor}>
                      {strings.requestQuote}
                    </ZText>
                    <TouchableOpacity onPress={() => setShowQuoteModal(false)}>
                      <Ionicons name="close" size={moderateScale(24)} color={colors.grayScale5} />
                    </TouchableOpacity>
                  </View>

                  {/* Dish Name */}
                  <ZText type="M14" color={colors.grayScale7} style={{ marginBottom: moderateScale(12) }}>
                    {getLocalizedText(dishData?.name, dishData?.nameArabic, dishData?.nameEnglish)}
                  </ZText>

                  {/* Notes Input */}
                  <ZText type="B14" color={colors.textColor} style={{ marginBottom: moderateScale(6) }}>
                    {strings.quoteNotesLabel}
                  </ZText>
                  <TextInput
                    style={[
                      localStyles.quoteNotesInput,
                      {
                        backgroundColor: colors.inputBg,
                        color: colors.textColor,
                        borderColor: colors.bColor,
                        textAlign: I18nManager.isRTL ? 'right' : 'left',
                        writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                    placeholder={strings.quoteNotesPlaceholder}
                    placeholderTextColor={colors.grayScale5}
                    value={quoteNotes}
                    onChangeText={setQuoteNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoFocus
                  />

                  {/* Send Button */}
                  <ZButton
                    title={strings.sendQuoteRequest}
                    onPress={async () => {
                      if (!quoteNotes.trim()) {
                        showErrorToast(strings.quoteNotesRequired || 'Please describe your order details');
                        return;
                      }
                      try {
                        const optionsSummary = buildSelectedOptionsForCart();
                        const selectedOptionNames = optionsSummary.flatMap(o => o.optionNames);

                        const response = await request.post('/chat/quote-request', {
                          receiverId: chefId,
                          dishId: dishData?._id,
                          selectedOptions: selectedOptionNames,
                          notes: quoteNotes.trim(),
                        });

                        const orderId = response?.data?.order?._id;

                        setShowQuoteModal(false);
                        setQuoteNotes('');
                        showSuccessToast(strings.quoteRequestSent);
                        navigation.navigate(StackNav.OrderTracking, { orderId });
                      } catch (err) {
                        console.error('Quote request failed:', err);
                        showErrorToast(strings.somethingWentWrong);
                      }
                    }}
                    containerStyle={[
                      localStyles.addToCartButton,
                      !quoteNotes.trim() && { opacity: 0.5 },
                    ]}
                    disabled={!quoteNotes.trim()}
                    frontIcon={
                      <Ionicons
                        name="send-outline"
                        size={moderateScale(18)}
                        color={colors.white}
                        style={{ marginRight: moderateScale(6) }}
                      />
                    }
                  />
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Animated Header
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    zIndex: 1000,
    elevation: 10,
  },

  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Background color for shadow efficiency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Hero Section
  heroSection: {
    position: 'relative',
    height: moderateScale(300),
  },

  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  floatingActions: {
    position: 'absolute',
    top: moderateScale(16),
    left: moderateScale(16),
    right: moderateScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },

  floatingButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 11,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: moderateScale(16),
    right: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    zIndex: 10,
  },

  // Dish Info Section
  dishInfoSection: {
    padding: moderateScale(24),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    marginTop: moderateScale(-28),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },

  dishHeader: {
    marginBottom: moderateScale(16),
  },

  dishTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },

  dishName: {
    flex: 1,
    marginRight: moderateScale(16),
    lineHeight: moderateScale(30),
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  dishPrice: {
    textAlign: 'right',
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  chefAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },

  descriptionSection: {
    marginBottom: moderateScale(16),
  },

  description: {
    lineHeight: moderateScale(22),
  },

  tagsSection: {
    marginBottom: moderateScale(8),
  },

  tag: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(8),
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  tab: {
    flex: 1,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    marginHorizontal: moderateScale(4),
  },

  // Tab Content
  tabContent: {
    padding: moderateScale(12),
  },

  nutritionSection: {
    marginBottom: moderateScale(20),
  },

  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  nutritionItem: {
    width: '48%',
    padding: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
    alignItems: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },

  dietarySection: {
    marginBottom: moderateScale(20),
  },

  dietaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },

  ingredientsSection: {
    marginBottom: moderateScale(20),
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },

  ingredientBullet: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#FF4D67',
  },

  // Bottom Section
  bottomSection: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(30),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  reviewReelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderWidth: 1.5,
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(20),
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
  },

  quantitySection: {
    marginBottom: moderateScale(20),
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityDisplay: {
    marginHorizontal: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    borderRadius: moderateScale(12),
    minWidth: moderateScale(60),
    alignItems: 'center',
  },

  addToCartButton: {
    height: moderateScale(56),
    borderRadius: moderateScale(16),
  },
  quoteNotesInput: {
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    minHeight: moderateScale(80),
    fontSize: moderateScale(14),
    marginBottom: moderateScale(12),
  },
  quoteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  quoteModalContent: {
    justifyContent: 'flex-end',
  },
  quoteModalCard: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    paddingBottom: moderateScale(32),
  },
  quoteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },

  errorTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },

  errorSubtitle: {
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(20),
  },

  retryButton: {
    marginTop: moderateScale(20),
    height: moderateScale(40),
    paddingHorizontal: moderateScale(30),
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },

  // Review Posts Section Styles
  reviewPostsContainer: {
    paddingHorizontal: moderateScale(4),
    paddingTop: moderateScale(8),
  },

  reviewPostsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(8),
  },

  prominentButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
  },

  prominentAddReviewButton: {
    borderRadius: moderateScale(20),
    backgroundColor: '#FF4D67', // Background color for shadow efficiency
    shadowColor: '#FF4D67',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },

  touchableButton: {
    borderRadius: moderateScale(20),
  },

  gradientButton: {
    borderRadius: moderateScale(20),
  },

  addReviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    minHeight: moderateScale(80),
  },

  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(12),
    width: moderateScale(80),
  },

  reviewTextContainer: {
    flex: 1,
    marginRight: moderateScale(8),
    justifyContent: 'center',
  },

  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: moderateScale(4),
  },

  reviewPostCard: {
    width: '48%',
    marginBottom: moderateScale(10),
    marginHorizontal: '1%',
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
    padding: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  reviewRatingBadge: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    zIndex: 1,
  },

  reviewMediaContainer: {
    position: 'relative',
    marginBottom: moderateScale(8),
  },

  reviewMedia: {
    width: '100%',
    height: moderateScale(100),
    borderRadius: moderateScale(10),
  },

  reviewMediaPlaceholder: {
    width: '100%',
    height: moderateScale(100),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: moderateScale(16),
    width: moderateScale(32),
    height: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
  },

  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewAuthorAvatar: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(8),
  },

  reviewAuthorInfo: {
    flex: 1,
  },

  starsContainer: {
    flexDirection: 'row',
    marginTop: moderateScale(4),
  },

  emptyReviewsContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(24),
  },

  seeMoreButton: {
    marginTop: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  // Option Groups (Customer-side — Premium)
  optionGroupsContainer: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(4),
    backgroundColor: '#FFFFFF',
  },
  optionGroupsSectionHeader: {
    marginBottom: moderateScale(16),
  },
  optionGroupsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionGroupBlock: {
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    backgroundColor: '#F8F9FA',
  },
  optionGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(14),
  },
  requiredBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    backgroundColor: '#FF4D6715',
    borderWidth: 1,
    borderColor: '#FF4D6730',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  optionIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    borderWidth: 2,
  },
  radioInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
  },
  checkboxOuter: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 2,
  },
  checkboxInner: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
});

export default DishDetailScreen;
