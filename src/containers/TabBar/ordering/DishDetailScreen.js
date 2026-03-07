import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { showSuccessToast, showErrorToast, showSuccessDialog, showActionDialog, ALERT_TYPE } from '../../../utils/toast';
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
} from '../../../redux/reducer/cartSlice';
import { useStorage } from '../../../utils/useStorage';
import { useLocation } from '../../../navigation/locationContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DishDetailScreen = () => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const queryClient = useQueryClient();
  const [user] = useStorage('user');

  const { dishId, chefId } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('reviews');
  const [scrollY] = useState(new Animated.Value(0));
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  // Check delivery eligibility to user's location
  const { data: deliveryData } = useQuery(
    ['deliveryEligibility', effectiveChefId, userLat, userLng],
    async () => {
      const response = await request.get(
        `/orders/check-delivery/${effectiveChefId}?lat=${userLat}&long=${userLng}`
      );
      return response.data;
    },
    {
      enabled: !!effectiveChefId && !!userLat && !!userLng,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

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

  const handleAddToCart = () => {
    if (!dishData) return;

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

    const computedChefName =
      finalChefData?.fullName || route?.params?.chefName || strings.unknownChef;

    dispatch(
      addToCart({
        dish: dishData,
        quantity,
        chefId,
        chefName: computedChefName,
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
          showSuccessToast(strings.dishAddedTitle, strings.formatString(strings.dishAddedMessage, pendingConflictItem.dish?.name));
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
            name="arrow-back"
            size={moderateScale(24)}
            color="#1A1A1A"
          />
        </TouchableOpacity>

        <ZText type="B18" color="#1A1A1A" numberOfLines={1}>
          {dishData?.name}
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
            name="arrow-back"
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
            {dishData?.name}
          </ZText>
          <ZText type="B20" color="#FF4D67" style={localStyles.dishPrice}>
            {dishData?.price} {strings.currency}
          </ZText>
        </View>

        {/* Chef Info */}
        <TouchableOpacity
          style={localStyles.chefInfo}
          onPress={() => navigation.navigate('ChefProfile', { chefId })}>
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
          {dishData?.description}
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
                  <View style={[localStyles.ratingBadge, { backgroundColor: colors.primary }]}>
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
    navigation.navigate(StackNav.reelsOne, {
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

  const renderBottomSection = () => {
    // Hide cart controls if current user is the chef/owner of the dish
    const currentUserId = user?._id?.toString();
    const dishOwnerId = (dishData?.user_id || chefId)?.toString();



    const isOwner = currentUserId === dishOwnerId;
    if (isOwner) return null;

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
          title={strings.formatString(strings.addToCartPrice, (dishData?.price * quantity).toFixed(0), strings.currency)}
          onPress={handleAddToCart}
          containerStyle={localStyles.addToCartButton}
          disabled={!dishData?.visible}
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
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
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

  ratingBadge: {
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
});

export default DishDetailScreen;
