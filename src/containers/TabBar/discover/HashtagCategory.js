// Library import
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
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
import ZLoader from '../../../components/common/ZLoader';
import { useStorage } from '../../../utils/useStorage';
import images from '../../../assets/images';

import strings from '../../../i18n/strings';
import { useLocation } from '../../../navigation/locationContext';
import StarRating from '../../../components/StarRating';
import { optimizeImageUrl, ImagePresets } from '../../../utils/imageOptimizer';
import { useDiscoverCategoryPaginated } from '../../../hooks/useDiscoverBatch';
import { getLocalizedText } from '../../../utils/helpers';

export default function HashtagCategory({ selectedTag, isLocationChanging }) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const location = useLocation();
  const [user] = useStorage('user');

  // State to track which tab is selected for each kitchen
  const [kitchenTabs, setKitchenTabs] = useState({});

  // UNIFIED PAGINATED LOADING — batch page 1 + paginated page 2+
  const {
    users: finalUsers,
    dishes: finalDishes,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: dataError,
    hasData
  } = useDiscoverCategoryPaginated(selectedTag, location, user?._id && typeof user._id === 'string' ? user._id : undefined);

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
          kmAway: user.kmAway ?? user.distance ?? undefined, // Map batch distance to kmAway
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
          stories: [], // No stories for this chef
          dishes: [],
          reelDishes: [],
          categoryDishes: [],
          // Include rating data from chef info
          averageDishRating: chefInfo.averageRating || 0,
          ratedDishesCount: chefInfo.totalReviews || 0
        });
      }

      const kitchen = kitchenMap.get(chefId);

      // Check if this dish is already in reelDishes
      const isInReelDishes = kitchen.reelDishes.find(d => d._id === dish._id);

      if (isInReelDishes) {
        // Dish is attached to a reel, don't add to categoryDishes
      } else {
        // Dish matches category but not attached to reel
        kitchen.categoryDishes.push(dish);
      }
    });

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

  // Pick diverse, representative dishes for the grid preview.
  // Groups by section, sorts each group by price (main courses first),
  // then round-robins across groups for maximum variety.
  const diversifyDishes = (dishes, limit = 6) => {
    if (dishes.length <= limit) return dishes;

    // Group by section (granular), fallback to category
    const groups = {};
    dishes.forEach(d => {
      const key = d.section?._id || d.section || d.category || 'Other';
      const groupKey = typeof key === 'object' ? key.toString() : key;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(d);
    });

    // Sort each group by price descending (main courses > sides)
    Object.values(groups).forEach(arr =>
      arr.sort((a, b) => (b.price || 0) - (a.price || 0))
    );

    const groupKeys = Object.keys(groups);
    if (groupKeys.length <= 1) return dishes.sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, limit);

    // Sort groups by their top dish price (most premium sections first)
    groupKeys.sort((a, b) => (groups[b][0]?.price || 0) - (groups[a][0]?.price || 0));

    // Round-robin pick from each group
    const result = [];
    let round = 0;
    while (result.length < limit) {
      let added = false;
      for (const key of groupKeys) {
        if (result.length >= limit) break;
        if (groups[key][round]) {
          result.push(groups[key][round]);
          added = true;
        }
      }
      if (!added) break;
      round++;
    }
    return result;
  };

  // Component to render dishes for a specific chef
  const RenderChefDishes = ({ chefId, chefName }) => {
    const dishes = getChefDishes(chefId);

    if (isInitialLoading) {
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
        data={diversifyDishes(dishes, 6)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              localStyles.dishCard,
              { backgroundColor: colors.backgroundColor },
            ]}
            onPress={() => {
              navigation.navigate(StackNav.DishDetail, {
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
                {getLocalizedText(item.name, item.nameArabic, item.nameEnglish)}
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
                {strings.currency} {item.price?.toFixed(2) || '0.00'}
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
            onPress={() => {
              navigation.navigate(StackNav.ChefMenu, {
                chefId: item._id,
                chefName: item.fullName,
                averageDishRating: item.averageDishRating || 0,
                ratedDishesCount: item.ratedDishesCount || 0,
              });
            }}
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
                {item?.bio || strings.defaultBio}
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
                  {strings.reelsTab}
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
                  {strings.dishesTab}
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
                  renderItem={({ item: story, index }) => {
                    return (
                      <ReelComponent
                        data={story?.views}
                        reelUrl={story?.poster || story?.avatarUri}
                        id={story?._id}
                        profileId={item}
                        item={story}
                        isPlay={!story?.poster && !story?.avatarUri}
                      />
                    );
                  }}
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
    [colors, navigation, styles, kitchenTabs, selectedTag, kitchensWithTaggedContent, isInitialLoading],
  );

  // Show loading during initial load or location changes
  // BUT NOT during pagination (isFetchingNextPage)
  if (isInitialLoading || isLocationChanging) {
    return <ZLoader absolute height={80} top={300} />;
  }

  // Empty state component
  const renderEmptyState = () => (
    <View style={localStyles.emptyStateContainer}>
      <Ionicons
        name="restaurant-outline"
        size={moderateScale(64)}
        color={colors.grayScale7}
      />
      <ZText
        type="b18"
        align="center"
        color={colors.dark ? colors.grayScale3 : colors.grayScale7}
        style={styles.mt20}>
        {strings.noCategoryItemsInExplore}
      </ZText>
      <ZText
        type="m14"
        align="center"
        color={colors.grayScale7}
        style={styles.mt10}>
        {strings.noCategoryItemsInExploreDesc}
      </ZText>
    </View>
  );

  return (
    <FlatList
      data={kitchensWithTaggedContent}
      renderItem={({ item, index }) => (
        <RenderKitchenItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item) => item._id.toString()}
      onEndReached={() => {
        // Guard: only fetch if there are more pages and we're not already loading
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={
        isFetchingNextPage ? (
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
    paddingTop: moderateScale(100),
    paddingBottom: moderateScale(40),
    width: '100%',
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
