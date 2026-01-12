// Library import
import {
  FlatList,
  I18nManager,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

// Local import
import { moderateScale } from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import { styles } from '../../../themes';
import ReelComponent from '../../../components/ReelComponent';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import { useInfiniteQuery, useQuery, useQueryClient } from 'react-query';
import request from '../../../api/request';
import ZLoader from '../../../components/common/ZLoader';
import { useStorage } from '../../../utils/useStorage';
import images from '../../../assets/images';
import strings from '../../../i18n/strings';
import { useLocation } from '../../../navigation/locationContext';
import StarRating from '../../../components/StarRating';
import { optimizeImageUrl, ImagePresets } from '../../../utils/imageOptimizer';
import { useDiscoverCategory } from '../../../hooks/useDiscoverBatch';

export default function HashtagCategory({ selectedTag, isLocationChanging }) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const location = useLocation();
  const [user] = useStorage('user');

  // State to track which tab is selected for each kitchen
  const [kitchenTabs, setKitchenTabs] = useState({});

  // OPTIMIZED BATCH LOADING - Single API call for all data
  const {
    users: batchUsers,
    dishes: batchDishes,
    isLoading: isBatchLoading,
    error: batchError,
    hasData
  } = useDiscoverCategory(selectedTag, location, user?._id && typeof user._id === 'string' ? user._id : undefined);

  // Fallback to individual API calls if batch fails or for pagination
  const {
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isFetchingNextPage: isFetchingNextPageUsers,
    data: userPages,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ['discover-users-fallback', selectedTag, location?.latitude, location?.longitude],
    async ({ pageParam = 1 }) => {
      const response = await request.get(`/user/tag/${selectedTag}`, {
        params: {
          page: pageParam,
          limit: 10,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage?.currentPage < lastPage?.totalPages
          ? lastPage.currentPage + 1
          : undefined,
      enabled: !!selectedTag && (!hasData || !!batchError), // Only use fallback if batch fails
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: categoryDishes,
    isLoading: isLoadingCategoryDishes,
    isFetching: isFetchingCategoryDishes,
  } = useQuery(
    ['discover-dishes-fallback', selectedTag, location?.latitude, location?.longitude],
    async () => {
      const response = await request.get(`/dishes/category/${selectedTag}`, {
        params: {
          page: 1,
          limit: 20,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      enabled: !!selectedTag && (!hasData || !!batchError), // Only use fallback if batch fails
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Safely extract users from paginated response in case some pages are undefined
  const fallbackUsers = React.useMemo(() => {
    const pages = userPages?.pages;
    if (!Array.isArray(pages)) return [];
    return pages.flatMap(page => {
      if (!page) return [];
      const users = Array.isArray(page?.users)
        ? page.users
        : Array.isArray(page?.data?.users)
          ? page.data.users
          : [];
      return users;
    });
  }, [userPages]);

  // Use batch data if available, otherwise fallback to individual calls
  const finalUsers = hasData && !batchError ? batchUsers : fallbackUsers;
  const finalDishes = hasData && !batchError ? batchDishes : (categoryDishes || []);

  // Show loading until we have at least some data
  const isInitialLoading = isBatchLoading || (!!batchError && (isLoadingUsers || isLoadingCategoryDishes));

  // Combine users and dishes based on the logic you described
  const kitchensWithTaggedContent = React.useMemo(() => {
    if (!finalUsers.length && !finalDishes.length) {
      return [];
    }

    const kitchenMap = new Map();

    // 1. Add kitchens that appear because their reels have the tag
    finalUsers.forEach(user => {
      if (!kitchenMap.has(user._id)) {
        kitchenMap.set(user._id, {
          ...user,
          dishes: [],
          reelDishes: [], // Dishes attached to tagged reels
          categoryDishes: [] // Dishes that match category but not attached to reels
        });
      }

      const kitchen = kitchenMap.get(user._id);

      // Extract dishes from tagged stories/reels
      if (user.stories) {
        user.stories.forEach(story => {
          if (story.dishes && story.dishes.length > 0) {
            story.dishes.forEach(dish => {
              // Add dishes from reels to reelDishes
              if (!kitchen.reelDishes.find(d => d._id === dish._id)) {
                kitchen.reelDishes.push(dish);
              }
            });
          }
        });
      }
    });

    // 2. Add dishes that match the category (whether attached to reels or not)
    finalDishes.forEach(dish => {
      // Handle different dish structures from API
      let chefId, chefInfo;

      if (dish.chef && dish.chef._id) {
        // New API structure with populated chef
        chefId = dish.chef._id;
        chefInfo = dish.chef;
      } else if (dish.user_id) {
        // Fallback structure
        chefId = dish.user_id._id || dish.user_id;
        chefInfo = dish.user_id;
      } else {
        return;
      }

      // If this chef is not already in our map, add them
      if (!kitchenMap.has(chefId)) {
        kitchenMap.set(chefId, {
          _id: chefId,
          fullName: chefInfo.fullName || 'Unknown Chef',
          avatar: chefInfo.avatar,
          bio: chefInfo.bio || strings.foodCreator,
          kmAway: dish.distance, // Use distance from dish
          stories: [], // No stories for this chef
          dishes: [],
          reelDishes: [],
          categoryDishes: []
        });
      }

      const kitchen = kitchenMap.get(chefId);

      // Update distance to keep the minimum distance (closest location)
      if (dish.distance !== undefined && (kitchen.kmAway === undefined || dish.distance < kitchen.kmAway)) {
        kitchen.kmAway = dish.distance;
      }

      // Check if this dish is already in reelDishes
      const isInReelDishes = kitchen.reelDishes.find(d => d._id === dish._id);

      if (isInReelDishes) {
        // Dish is attached to a reel, don't add to categoryDishes
      } else {
        // Dish matches category but not attached to reel
        kitchen.categoryDishes.push(dish);
      }
    });

    // 3. Combine reelDishes and categoryDishes into final dishes array
    const result = Array.from(kitchenMap.values()).map(kitchen => ({
      ...kitchen,
      dishes: [...kitchen.reelDishes, ...kitchen.categoryDishes]
    }));

    // Only return kitchens that have either stories or dishes
    const filteredResult = result.filter(kitchen =>
      (kitchen.stories && kitchen.stories.length > 0) ||
      (kitchen.dishes && kitchen.dishes.length > 0)
    );
    return filteredResult;
  }, [finalUsers, finalDishes]);

  // Function to get dishes for a specific chef
  const getChefDishes = (chefId) => {
    const kitchen = kitchensWithTaggedContent.find(k => k._id === chefId);
    return kitchen ? kitchen.dishes || [] : [];
  };


  const onPressUser = (id, userName, userImage) => {
    if (user?._id === id) {
      navigation.navigate(TabNav.Profile);
    } else {
      navigation.navigate(StackNav.ProfileDetail, {
        userName,
        userImage,
        id,
      });
    }
  };

  const onPressTrendingHashtag = item =>
    navigation.navigate(StackNav.TrendingHashtag, { item: item });
  // Function to handle tab change for a specific kitchen
  const handleKitchenTabChange = (kitchenId, tabIndex) => {
    setKitchenTabs(prev => ({
      ...prev,
      [kitchenId]: tabIndex
    }));
  };

  // Component to render dishes for a specific chef
  const RenderChefDishes = ({ chefId, chefName }) => {
    const dishes = getChefDishes(chefId);

    if (isBatchLoading || (!!batchError && isLoadingCategoryDishes)) {
      return (
        <View style={localStyles.loadingContainer}>
          <ZLoader />
        </View>
      );
    }

    if (dishes.length === 0) {
      return (
        <View style={localStyles.emptyDishesContainer}>
          <Ionicons
            name="restaurant-outline"
            size={moderateScale(32)}
            color={colors.grayScale7}
          />
          <ZText
            type="m14"
            align="center"
            color={colors.grayScale7}
            style={styles.mt10}>
            {strings.noCategoryDishesAvailable.replace('{category}', selectedTag)}
          </ZText>
        </View>
      );
    }

    return (
      <FlatList
        data={dishes.slice(0, 6)} // Show max 6 dishes
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              localStyles.dishCard,
              { backgroundColor: colors.backgroundColor },
            ]}
            onPress={() => {
              navigation.navigate(StackNav.DishDetailScreen, {
                dishId: item._id,
                chefId: chefId,
                fromDiscover: true,
                chefName: chefName,
              });
            }}
            activeOpacity={0.9}>
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : images.dishPlaceholder
              }
              style={localStyles.dishImage}
            />
            <View style={localStyles.dishOverlay}>
              <ZText
                type="b12"
                color={colors.white}
                numberOfLines={1}
                style={localStyles.dishName}>
                {item.name}
              </ZText>
              <StarRating
                rating={Number.isFinite(item?.average_rating)
                  ? item.average_rating
                  : (Number.isFinite(item?.rating) ? item.rating : 0)}
                size="small"
                showText={false}
                showCount={false}
                showWhenNoRating={true}
                style={{ marginBottom: moderateScale(2) }}
              />
              <ZText
                type="b14"
                color={colors.white}
                style={localStyles.dishPrice}>
                ${item.price?.toFixed(2) || '0.00'}
              </ZText>
            </View>
          </TouchableOpacity>
        )}
        numColumns={3}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={localStyles.dishesGrid}
        columnWrapperStyle={localStyles.dishesRow}
        scrollEnabled={false}
      />
    );
  };

  const RenderKitchenItem = useCallback(
    ({ item, index }) => {
      // Default to dishes tab (1) if no reels, otherwise reels tab (0)
      const hasReels = item.stories && item.stories.length > 0;
      const defaultTab = hasReels ? 0 : 1;
      const currentTab = kitchenTabs[item._id] !== undefined ? kitchenTabs[item._id] : defaultTab;

      return (
        <View key={index} style={localStyles.kitchenContainer}>
          {/* Kitchen Header */}
          <TouchableOpacity
            onPress={() => onPressUser(item?._id, item?.fullName, item?.avatar)}
            style={localStyles.kitchenHeader}>
            <View
              style={[
                localStyles.kitchenAvatar,
                {
                  backgroundColor: colors.primaryTransparent,
                },
              ]}>
              <Image
                style={localStyles.kitchenAvatar}
                source={item?.avatar ? { uri: item?.avatar } : images.userDark}
              />
            </View>
            <View style={[styles.mh10, styles.flex]}>
              <View style={localStyles.chefNameContainer}>
                <ZText type="b18" numberOfLines={1} style={styles.flex}>
                  {item.fullName}
                </ZText>
                {/* Visit Menu Button */}
                <TouchableOpacity
                  style={[
                    localStyles.visitMenuButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    navigation.navigate(StackNav.ChefMenu, {
                      chefId: item._id,
                      chefName: item.fullName,
                      averageDishRating: item.averageDishRating || 0,
                      ratedDishesCount: item.ratedDishesCount || 0,
                    });
                  }}
                  activeOpacity={0.8}>
                  <Ionicons
                    name="restaurant-outline"
                    size={moderateScale(14)}
                    color={colors.white}
                  />
                  <ZText style={localStyles.visitMenuText} color={colors.white}>
                    {strings.menu}
                  </ZText>
                </TouchableOpacity>
              </View>
              {/* Rating next to name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: moderateScale(4) }}>
                <StarRating
                  rating={item?.averageDishRating || 0}
                  totalReviews={item?.ratedDishesCount || 0}
                  size="small"
                  showText={true}
                  showCount={item?.ratedDishesCount > 0}
                  showWhenNoRating={true}
                />
              </View>
              <ZText
                type="m14"
                numberOfLines={2}
                color={colors.dark ? colors.grayScale3 : colors.grayScale7}
                style={styles.mt5}>
                {item?.bio || 'Sharing delicious food content'}
              </ZText>
              {/* Distance Display */}
              {item?.kmAway !== undefined && item?.kmAway !== null && (
                <View style={localStyles.distanceContainer}>
                  <Ionicons
                    name="location-outline"
                    size={moderateScale(12)}
                    color={colors.primary}
                  />
                  <ZText
                    type="s12"
                    color={colors.primary}
                    style={styles.ml5}>
                    {item.kmAway.toFixed(1) + strings.kmAway}
                  </ZText>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Tab Bar for Kitchen - Only show if both reels and dishes exist */}
          {hasReels && getChefDishes(item._id).length > 0 ? (
            <View style={[localStyles.kitchenTabBar, { backgroundColor: colors.backgroundColor }]}>
              <TouchableOpacity
                style={[
                  localStyles.kitchenTabItem,
                  {
                    borderBottomColor: currentTab === 0 ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleKitchenTabChange(item._id, 0)}>
                <Ionicons
                  name="videocam"
                  size={moderateScale(16)}
                  color={currentTab === 0 ? colors.primary : colors.grayScale7}
                />
                <ZText
                  type={currentTab === 0 ? 'b14' : 'm14'}
                  color={currentTab === 0 ? colors.primary : colors.grayScale7}
                  style={styles.ml5}>
                  Reels
                </ZText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  localStyles.kitchenTabItem,
                  {
                    borderBottomColor: currentTab === 1 ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleKitchenTabChange(item._id, 1)}>
                <Ionicons
                  name="restaurant"
                  size={moderateScale(16)}
                  color={currentTab === 1 ? colors.primary : colors.grayScale7}
                />
                <ZText
                  type={currentTab === 1 ? 'b14' : 'm14'}
                  color={currentTab === 1 ? colors.primary : colors.grayScale7}
                  style={styles.ml5}>
                  Dishes
                </ZText>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Tab Content */}
          <View style={localStyles.kitchenTabContent}>
            {/* If both reels and dishes exist, show based on current tab */}
            {hasReels && getChefDishes(item._id).length > 0 ? (
              currentTab === 0 ? (
                // Reels Tab
                <FlatList
                  data={item.stories.slice(0, 3)} // Display the first 3 stories
                  renderItem={({ item: story, index }) => (
                    <ReelComponent
                      data={story?.views}
                      reelUrl={
                        story?.poster?.replace(
                          'https://foodtokforever.s3.amazonaws.com',
                          'https://d1wfcrbbkg3bzd.cloudfront.net',
                        ) ||
                        story?.avatarUri?.replace(
                          'https://foodtokforever.s3.amazonaws.com',
                          'https://d1wfcrbbkg3bzd.cloudfront.net',
                        )
                      }
                      id={story?._id}
                      profileId={item}
                      item={story}
                      isPlay={!story?.poster && !story?.avatarUri}
                    />
                  )}
                  numColumns={3}
                  keyExtractor={(story, index) => index.toString()}
                  contentContainerStyle={localStyles.reelsGrid}
                  columnWrapperStyle={localStyles.reelsRow}
                  scrollEnabled={false}
                />
              ) : (
                // Dishes Tab
                <RenderChefDishes chefId={item._id} chefName={item.fullName} />
              )
            ) : hasReels ? (
              // Only reels, no dishes
              <FlatList
                data={item.stories.slice(0, 3)} // Display the first 3 stories
                renderItem={({ item: story, index }) => (
                  <ReelComponent
                    data={story?.views}
                    reelUrl={
                      optimizeImageUrl(
                        story?.poster || story?.avatarUri,
                        ImagePresets.REEL_POSTER
                      )
                    }
                    id={story?._id}
                    profileId={item}
                    item={story}
                    isPlay={!story?.poster && !story?.avatarUri}
                  />
                )}
                numColumns={3}
                keyExtractor={(story, index) => index.toString()}
                contentContainerStyle={localStyles.reelsGrid}
                columnWrapperStyle={localStyles.reelsRow}
                scrollEnabled={false}
              />
            ) : (
              // Only dishes, no reels
              <RenderChefDishes chefId={item._id} chefName={item.fullName} />
            )}
          </View>
        </View>
      );
    },
    [colors, navigation, styles, kitchenTabs, selectedTag, kitchensWithTaggedContent, isBatchLoading, !!batchError, isLoadingCategoryDishes, isFetchingCategoryDishes],
  );

  // Show loading during initial load, location changes, or when refetching due to location changes
  // BUT NOT during pagination (isFetchingNextPageUsers)
  const isInitialOrLocationLoading = isInitialLoading ||
    (!!batchError && ((isFetchingUsers && !isFetchingNextPageUsers) || isFetchingCategoryDishes)) ||
    isLocationChanging;

  if (isInitialOrLocationLoading) {
    return <ZLoader absolute height={80} top={300} />;
  }

  return (
    <FlatList
      data={kitchensWithTaggedContent}
      renderItem={({ item, index }) => (
        <RenderKitchenItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => item._id.toString()}
      onEndReached={() => {
        // Only enable pagination for fallback mode (when batch fails)
        if (!!batchError && hasNextPage && !isFetchingNextPageUsers) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        !!batchError && isFetchingNextPageUsers ? (
          <View style={localStyles.paginationLoader}>
            <ZLoader height={50} />
          </View>
        ) : null
      }
    />
  );
}

const localStyles = StyleSheet.create({
  // Kitchen Container
  kitchenContainer: {
    marginVertical: moderateScale(10),
    marginHorizontal: moderateScale(20),
    backgroundColor: 'transparent',
  },

  // Kitchen Header
  kitchenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(15),
  },
  kitchenAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chefNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  visitMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    gap: moderateScale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  visitMenuText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },

  // Kitchen Tab Bar
  kitchenTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: moderateScale(15),
  },
  kitchenTabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: moderateScale(2),
  },

  // Kitchen Tab Content
  kitchenTabContent: {
    minHeight: moderateScale(120),
  },

  // Reels Grid
  reelsGrid: {
    paddingHorizontal: moderateScale(8),
  },
  reelsRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(0),
  },

  // Dishes Grid
  dishesGrid: {
    paddingHorizontal: moderateScale(5),
  },
  dishesRow: {
    justifyContent: 'flex-start',
    gap: moderateScale(8),
  },
  dishCard: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
    marginBottom: moderateScale(8),
  },
  dishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dishOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: moderateScale(6),
  },
  dishName: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  dishPrice: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },

  // Loading and Empty States
  loadingContainer: {
    height: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDishesContainer: {
    height: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(5),
  },
  paginationLoader: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
});
