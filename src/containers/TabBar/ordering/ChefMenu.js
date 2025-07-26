import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useQuery} from 'react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../components/common/ZText';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZLoader from '../../../components/common/ZLoader';
import ZButton from '../../../components/common/ZButton';
import CartFloatingButton from '../../../components/common/CartFloatingButton';
import {moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import request from '../../../api/request';
import images from '../../../assets/images';
import {StackNav} from '../../../navigation/NavigationKeys';
import {
  addToCart,
  selectCartItemCount,
  selectCartError,
  clearError,
} from '../../../redux/reducer/cartSlice';

const ChefMenu = () => {
  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const {chefId, scrollToDishId, chefName} = route.params;

  const flatListRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quantities, setQuantities] = useState({}); // Track quantities for each dish

  // Cart selectors
  const cartItemCount = useSelector(selectCartItemCount);
  const cartError = useSelector(selectCartError);

  // Define fetch function first
  const fetchChefMenu = async chefId => {
    try {
      console.log('Fetching menu for chef:', chefId);

      let menu = null;
      let dishes = [];
      let chef = null;

      // First try to get the chef's menu
      try {
        const menuResponse = await request.get(`/menus/chef/${chefId}`);
        menu = menuResponse.data;
        console.log('Menu response:', menu);
      } catch (menuError) {
        console.log('No menu found for chef:', menuError.message);
      }

      // Get chef information
      try {
        const chefResponse = await request.get(`/user/${chefId}`);
        chef = chefResponse.data;
        console.log('Chef info:', chef);
      } catch (chefError) {
        console.log('Could not fetch chef info:', chefError.message);
        // If we can't get chef info, create a basic chef object
        chef = {
          _id: chefId,
          fullName: chefName || 'Unknown Chef',
          avatar: null,
        };
      }

      // Fetch dishes directly by chef ID (this works regardless of menu structure)
      try {
        const dishesResponse = await request.get(`/dishes/chef/${chefId}`);
        dishes = dishesResponse.data || [];
        console.log('Dishes from chef:', dishes);

        // Filter only visible dishes for customers
        dishes = dishes.filter(dish => dish.visible !== false);
        console.log('Visible dishes for customers:', dishes);
      } catch (dishError) {
        console.log('Could not fetch dishes from chef:', dishError.message);

        // Fallback: try to get all dishes and filter
        try {
          const allDishesResponse = await request.get('/dishes');
          const allDishes = allDishesResponse.data || [];
          // Filter dishes by chef and visibility
          dishes = allDishes.filter(
            dish =>
              (dish.user_id === chefId ||
                dish.chef === chefId ||
                dish.owner === chefId) &&
              dish.visible !== false,
          );
          console.log('Fallback visible dishes:', dishes);
        } catch (fallbackError) {
          console.log(
            'Could not fetch fallback dishes:',
            fallbackError.message,
          );
          dishes = [];
        }
      }

      return {
        chef: chef,
        dishes: dishes,
        menu: menu,
      };
    } catch (error) {
      console.error('Failed to fetch chef menu:', error);
      throw error;
    }
  };

  // Fetch chef menu data
  const {
    data: menuData,
    isLoading,
    error,
    refetch,
  } = useQuery(['chefMenu', chefId], () => fetchChefMenu(chefId), {
    enabled: !!chefId,
    retry: 2,
    retryDelay: 1000,
  });

  // Auto-scroll to specific dish if provided
  useEffect(() => {
    if (menuData?.dishes && scrollToDishId && flatListRef.current) {
      const dishIndex = menuData.dishes.findIndex(
        dish => dish._id === scrollToDishId,
      );
      if (dishIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: dishIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
      }
    }
  }, [menuData, scrollToDishId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddToCart = (dish, quantity = 1) => {
    dispatch(
      addToCart({
        dish,
        quantity,
        chefId,
        chefName: menuData?.chef?.fullName || chefName,
      }),
    );
  };

  const handleQuantityChange = (dishId, change) => {
    setQuantities(prev => {
      const currentQty = prev[dishId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return {...prev, [dishId]: newQty};
    });
  };

  const handleAddWithQuantity = dish => {
    const quantity = quantities[dish._id] || 1;
    handleAddToCart(dish, quantity);
    // Reset quantity after adding to cart
    setQuantities(prev => ({...prev, [dish._id]: 0}));
  };

  const handleCartPress = () => {
    navigation.navigate(StackNav.ShoppingCart);
  };

  // Handle cart errors
  useEffect(() => {
    if (cartError) {
      Alert.alert('Cart Error', cartError, [
        {
          text: 'OK',
          onPress: () => dispatch(clearError()),
        },
      ]);
    }
  }, [cartError, dispatch]);

  const handleVisitFullMenu = () => {
    // Navigate to full menu if needed
    console.log('Visit full menu');
  };

  // Helper function to get stunning gradient colors for categories
  const getCategoryGradient = index => {
    const gradients = [
      {primary: '#FF6B6B', secondary: '#FF8E8E'}, // Red
      {primary: '#4ECDC4', secondary: '#6ED5CE'}, // Teal
      {primary: '#45B7D1', secondary: '#6BC5D8'}, // Blue
      {primary: '#96CEB4', secondary: '#A8D4BE'}, // Green
      {primary: '#FFEAA7', secondary: '#FFED4A'}, // Yellow
      {primary: '#DDA0DD', secondary: '#E6B3E6'}, // Purple
      {primary: '#FFB347', secondary: '#FFC266'}, // Orange
      {primary: '#87CEEB', secondary: '#9BD6F0'}, // Sky Blue
    ];
    return gradients[index % gradients.length];
  };

  // Helper function to get category-specific icons
  const getCategoryIcon = category => {
    const categoryLower = category.toLowerCase();
    if (
      categoryLower.includes('appetizer') ||
      categoryLower.includes('starter')
    ) {
      return 'restaurant-outline';
    } else if (
      categoryLower.includes('main') ||
      categoryLower.includes('entree')
    ) {
      return 'pizza-outline';
    } else if (
      categoryLower.includes('dessert') ||
      categoryLower.includes('sweet')
    ) {
      return 'ice-cream-outline';
    } else if (
      categoryLower.includes('drink') ||
      categoryLower.includes('beverage')
    ) {
      return 'wine-outline';
    } else if (categoryLower.includes('salad')) {
      return 'leaf-outline';
    } else if (categoryLower.includes('soup')) {
      return 'cafe-outline';
    } else if (categoryLower.includes('burger')) {
      return 'fast-food-outline';
    } else if (categoryLower.includes('sandwich')) {
      return 'fast-food-outline';
    } else {
      return 'restaurant';
    }
  };

  const renderDishCard = ({item: dish, index}) => {
    const currentQuantity = quantities[dish._id] || 0;
    const isInCart = currentQuantity > 0;

    // Check if this is the first dish in a new category for section header
    const currentCategory = dish.category || 'Main Dishes';
    const previousDish = index > 0 ? menuData.dishes[index - 1] : null;
    const previousCategory = previousDish
      ? previousDish.category || 'Main Dishes'
      : null;
    const showCategoryHeader =
      currentCategory !== previousCategory;

    return (
      <>
        {showCategoryHeader && (
          <View style={localStyles.sectionHeader}>
            <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
              {currentCategory}
            </ZText>
          </View>
        )}
        <TouchableOpacity 
          style={[localStyles.dishCard, {backgroundColor: colors.white}]}
          onPress={() => navigation.navigate('DishDetailScreen', {
            dishId: dish._id,
            chefId: chefId,
          })}
          activeOpacity={0.95}>
          {/* Hero Image Section */}
          <View style={localStyles.heroImageContainer}>
            <Image
              source={dish.image ? {uri: dish.image} : images.dishPlaceholder}
              style={localStyles.heroImage}
              resizeMode="cover"
            />

            {/* Gradient Overlays for Depth */}
            <View style={localStyles.topGradient} />
            <View style={localStyles.bottomGradient} />

            {/* Floating Rating Badge */}
            {dish.average_rating > 0 && (
              <View style={localStyles.floatingRating}>
                <Ionicons
                  name="star"
                  size={moderateScale(14)}
                  color="#FFD700"
                />
                <ZText
                  type="B14"
                  color={colors.white}
                  style={localStyles.ratingValue}>
                  {dish.average_rating.toFixed(1)}
                </ZText>
              </View>
            )}

            {/* Price Tag */}
            <View
              style={[localStyles.priceTag, {backgroundColor: colors.primary}]}>
              <ZText
                type="B18"
                color={colors.white}
                style={localStyles.priceText}>
                {dish.price} EGP
              </ZText>
            </View>
          </View>

          {/* Content Section */}
          <View style={localStyles.contentSection}>
            {/* Title */}
            <ZText type="B22" numberOfLines={1} style={localStyles.dishName}>
              {dish.name}
            </ZText>

            {/* Description */}
            <ZText
              type="M14"
              color={colors.grayScale6}
              numberOfLines={2}
              style={localStyles.dishDesc}>
              {dish.description}
            </ZText>

            {/* Action Row */}
            <View style={localStyles.actionRow}>
              {dish.visible ? (
                !isInCart ? (
                  // Stunning Add to Cart Button
                  <TouchableOpacity
                    style={[
                      localStyles.stunningAddBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => {
                      handleQuantityChange(dish._id, 1);
                      handleAddToCart(dish, 1);
                    }}
                    activeOpacity={0.85}>
                    <View style={localStyles.addBtnContent}>
                      <Ionicons
                        name="add-circle"
                        size={moderateScale(24)}
                        color={colors.white}
                      />
                      <ZText
                        type="B18"
                        color={colors.white}
                        style={localStyles.addBtnText}>
                        Add to Cart
                      </ZText>
                    </View>
                  </TouchableOpacity>
                ) : (
                  // Quantity Controls
                  <View style={localStyles.quantityRow}>
                    <TouchableOpacity
                      style={[
                        localStyles.quantityControl,
                        {backgroundColor: colors.inputBg},
                      ]}
                      onPress={() => {
                        const newQty = Math.max(0, currentQuantity - 1);
                        handleQuantityChange(dish._id, -1);
                        if (newQty === 0) {
                          // Remove from cart
                          handleAddToCart(dish, -currentQuantity);
                        } else {
                          handleAddToCart(dish, -1);
                        }
                      }}
                      activeOpacity={0.7}>
                      <Ionicons
                        name="remove"
                        size={moderateScale(20)}
                        color={colors.textColor}
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
                        {backgroundColor: colors.primary},
                      ]}
                      onPress={() => {
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
                )
              ) : (
                // Unavailable State
                <View
                  style={[
                    localStyles.unavailableState,
                    {backgroundColor: colors.grayScale2},
                  ]}>
                  <Ionicons
                    name="close-circle-outline"
                    size={moderateScale(20)}
                    color={colors.grayScale6}
                  />
                  <ZText type="M16" color={colors.grayScale6}>
                    Currently Unavailable
                  </ZText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  const renderHeader = () => {
    // Group dishes by category for sections
    const dishCategories =
      menuData?.dishes?.reduce((acc, dish) => {
        const category = dish.category || 'All Items';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(dish);
        return acc;
      }, {}) || {};

    const categoryNames = Object.keys(dishCategories);

    return (
      <View
        style={[
          localStyles.headerContainer,
          {backgroundColor: colors.backgroundColor},
        ]}>
        <View style={localStyles.chefInfo}>
          <Image
            source={
              menuData?.chef?.avatar
                ? {uri: menuData.chef.avatar}
                : colors.dark
                  ? images.userDark
                  : images.userLight
            }
            style={localStyles.chefAvatar}
          />
          <View style={localStyles.chefDetails}>
            <ZText type="B18" color={colors.textColor}>
              {menuData?.chef?.fullName || chefName}
            </ZText>
            <ZText type="M14" color={colors.grayScale7}>
              {menuData?.dishes?.length || 0} dishes available
            </ZText>
          </View>
        </View>

        {/* STUNNING CATEGORY SECTIONS */}
        {categoryNames.length > 1 && (
          <View style={localStyles.stunningCategoriesContainer}>
            <ZText
              type="B16"
              color={colors.textColor}
              style={localStyles.categoriesTitle}>
              Browse Menu
            </ZText>
            <FlatList
              data={categoryNames}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.stunningCategoriesList}
              renderItem={({item: category, index}) => {
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
                    ]}
                    onPress={() => {
                      // Scroll to first dish in this category
                      const firstDishInCategory = menuData.dishes.find(
                        dish => (dish.category || 'All Items') === category,
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
                        {backgroundColor: gradientColors.secondary},
                      ]}
                    />

                    {/* Category Icon */}
                    <View
                      style={[
                        localStyles.categoryIconContainer,
                        {backgroundColor: 'rgba(255,255,255,0.2)'},
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
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ZSafeAreaView>
        <ZHeader title="Menu" showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (error) {
    return (
      <ZSafeAreaView>
        <ZHeader title="Menu" showBack />
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
            Failed to load menu
          </ZText>
          <ZText
            type="M14"
            align="center"
            color={colors.grayScale7}
            style={localStyles.errorSubtitle}>
            This chef might not have a menu available yet, or there was a
            connection issue.
          </ZText>
          <ZButton
            title="Retry"
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
        <ZHeader title="Menu" showBack />
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
            No dishes available
          </ZText>
          <ZText
            type="M14"
            align="center"
            color={colors.grayScale7}
            style={localStyles.emptySubtitle}>
            This chef hasn't added any dishes to their menu yet.
          </ZText>
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title="Menu" showBack />

      <FlatList
        ref={flatListRef}
        data={menuData?.dishes || []}
        renderItem={renderDishCard}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
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
          console.log('Scroll to index failed:', info);
        }}
      />

      <CartFloatingButton onPress={handleCartPress} />
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
    marginBottom: moderateScale(10),
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(15),
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
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(80),
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  floatingRating: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    gap: moderateScale(4),
  },
  ratingValue: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceTag: {
    position: 'absolute',
    bottom: moderateScale(12),
    left: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    backgroundColor: '#FF4D67',
  },
  priceText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Clean Content Section
  contentSection: {
    padding: moderateScale(16),
  },
  dishName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: moderateScale(6),
    lineHeight: moderateScale(22),
  },
  dishDesc: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(16),
    color: '#666666',
    fontWeight: '400',
  },

  // Clean Action Row
  actionRow: {
    marginTop: moderateScale(4),
  },

  // Clean Add to Cart Button
  stunningAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(12),
  },
  addBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  addBtnText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  // Compact Quantity Controls Row
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(4),
  },
  quantityControl: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  quantityBadge: {
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },

  // Unavailable State
  unavailableState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(16),
    gap: moderateScale(10),
    opacity: 0.6,
  },
  // Error and Empty States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  retryButton: {
    marginTop: moderateScale(20),
    height: moderateScale(40),
    paddingHorizontal: moderateScale(30),
  },
  errorTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  errorSubtitle: {
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(20),
  },
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
    marginTop: moderateScale(20),
    paddingTop: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
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
    padding: moderateScale(16),
    position: 'relative',
    overflow: 'hidden',
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
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  categoryItemCount: {
    marginTop: moderateScale(2),
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 0, height: 1},
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
    transform: [{rotate: '45deg'}],
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
