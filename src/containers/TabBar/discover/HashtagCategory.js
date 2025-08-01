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
import React, {useCallback, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import ReelComponent from '../../../components/ReelComponent';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {useInfiniteQuery, useQuery} from 'react-query';
import request from '../../../api/request';
import ZLoader from '../../../components/common/ZLoader';
import { useStorage } from '../../../utils/useStorage';
import images from '../../../assets/images';
import strings from '../../../i18n/strings';

export default function HashtagCategory({selectedTag}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [userPage, setUserPage] = useState(1);
  const [limit] = useState(10);
  const [user] = useStorage('user');
  
  // State to track which tab is selected for each kitchen
  const [kitchenTabs, setKitchenTabs] = useState({});
  // Fetch users/kitchens by tag (these have reels with the tag)
  const {
    isLoading: isLoadingUsers,
    data: userPages,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ['users', selectedTag, userPage],
    ({pageParam = 1}) =>
      request
        .get(`/user/tag/${selectedTag}`, {params: {page: pageParam, limit}})
        .then(res => res.data),
    {
      getNextPageParam: lastPage => lastPage?.currentPage + 1,
      enabled: !!selectedTag,
    },
  );

  // Fetch all dishes for the current category
  const {
    data: categoryDishes,
    isLoading: isLoadingCategoryDishes,
  } = useQuery(
    ['categoryDishes', selectedTag],
    () =>
      request
        .get(`/dishes/category/${selectedTag}`)
        .then(res => res.data),
    {
      enabled: !!selectedTag,
    },
  );

  // Combine users and dishes based on the logic you described
  const kitchensWithTaggedContent = React.useMemo(() => {
    if (!userPages || !categoryDishes) return [];
    
    const allUsers = userPages.pages?.flatMap(page => page.users) || [];
    const kitchenMap = new Map();
    
    // 1. Add kitchens that appear because their reels have the tag
    allUsers.forEach(user => {
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
    categoryDishes.forEach(dish => {
      if (dish.user_id && dish.chef) {
        const chefId = dish.user_id._id || dish.user_id;
        
        // If this chef is not already in our map, add them
        if (!kitchenMap.has(chefId)) {
          kitchenMap.set(chefId, {
            _id: chefId,
            fullName: dish.chef.fullName,
            avatar: dish.chef.avatar,
            bio: dish.chef.bio,
            stories: [], // No stories for this chef
            dishes: [],
            reelDishes: [],
            categoryDishes: []
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
      }
    });
    
    // 3. Combine reelDishes and categoryDishes into final dishes array
    const result = Array.from(kitchenMap.values()).map(kitchen => ({
      ...kitchen,
      dishes: [...kitchen.reelDishes, ...kitchen.categoryDishes]
    }));
    
    // Only return kitchens that have either stories or dishes
    return result.filter(kitchen => 
      (kitchen.stories && kitchen.stories.length > 0) || 
      (kitchen.dishes && kitchen.dishes.length > 0)
    );
  }, [userPages, categoryDishes]);

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
    navigation.navigate(StackNav.TrendingHashtag, {item: item});
  // Function to handle tab change for a specific kitchen
  const handleKitchenTabChange = (kitchenId, tabIndex) => {
    setKitchenTabs(prev => ({
      ...prev,
      [kitchenId]: tabIndex
    }));
  };

  // Component to render dishes for a specific chef
  const RenderChefDishes = ({chefId, chefName}) => {
    const dishes = getChefDishes(chefId);

    if (isLoadingCategoryDishes) {
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
            No {selectedTag} dishes available
          </ZText>
        </View>
      );
    }

    return (
      <FlatList
        data={dishes.slice(0, 6)} // Show max 6 dishes
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              localStyles.dishCard,
              {backgroundColor: colors.backgroundColor},
            ]}
            onPress={() => {
              navigation.navigate(StackNav.ChefMenu, {
                chefId: chefId,
                chefName: chefName,
                scrollToDishId: item._id,
              });
            }}
            activeOpacity={0.9}>
            <Image
              source={
                item.image
                  ? {uri: item.image}
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
    ({item, index}) => {
      // Default to dishes tab (1) if no reels, otherwise reels tab (0)
      const hasReels = item.stories && item.stories.length > 0;
      const defaultTab = hasReels ? 0 : 1;
      const currentTab = kitchenTabs[item._id] !== undefined ? kitchenTabs[item._id] : defaultTab;
      
      return (
        <View key={index} style={localStyles.kitchenContainer}>
          {/* Kitchen Header */}
          <TouchableOpacity
            onPress={()=>onPressUser( item?._id, item?.fullName, item?.avatar)}
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
                source={item?.avatar? {uri: item?.avatar} : images.userDark}
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
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={() => {
                    navigation.navigate(StackNav.ChefMenu, {
                      chefId: item._id,
                      chefName: item.fullName,
                    });
                  }}
                  activeOpacity={0.8}>
                  <Ionicons
                    name="restaurant-outline"
                    size={moderateScale(14)}
                    color={colors.white}
                  />
                  <ZText style={localStyles.visitMenuText} color={colors.white}>
                    Menu
                  </ZText>
                </TouchableOpacity>
              </View>
              <ZText
                type="m14"
                numberOfLines={2}
                color={colors.dark ? colors.grayScale3 : colors.grayScale7}
                style={styles.mt5}>
                {item?.bio || 'Sharing delicious food content'}
              </ZText>
            </View>
          </TouchableOpacity>

          {/* Tab Bar for Kitchen - Only show if both reels and dishes exist */}
          {hasReels && getChefDishes(item._id).length > 0 ? (
            <View style={[localStyles.kitchenTabBar, {backgroundColor: colors.backgroundColor}]}>
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
                  data={item.stories.slice(0,3)} // Display the first 3 stories
                  renderItem={({item: story, index}) => (
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
                data={item.stories.slice(0,3)} // Display the first 3 stories
                renderItem={({item: story, index}) => (
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
              // Only dishes, no reels
              <RenderChefDishes chefId={item._id} chefName={item.fullName} />
            )}
          </View>
        </View>
      );
    },
    [colors, navigation, styles, kitchenTabs, selectedTag, kitchensWithTaggedContent, isLoadingCategoryDishes],
  );

  if (isLoadingUsers || isLoadingCategoryDishes) {
    return <ZLoader absolute height={80} top={300} />;
  }

  return (
    <FlatList
      data={kitchensWithTaggedContent}
      renderItem={({item, index}) => (
        <RenderKitchenItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => item._id.toString()}
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
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
});
