import React from 'react';
import { View, Image, FlatList, TouchableOpacity, I18nManager } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../../../common/constants';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import styles from '../chefMenuStyles';

// Color gradients for categories
const CATEGORY_GRADIENTS = [
  { primary: '#FF6B8A', secondary: '#FF8FA3' },
  { primary: '#4ECDC4', secondary: '#7EDDD8' },
  { primary: '#45B7D1', secondary: '#6BCFF6' },
  { primary: '#FFA726', secondary: '#FFB74D' },
  { primary: '#AB47BC', secondary: '#BA68C8' },
  { primary: '#66BB6A', secondary: '#81C784' },
  { primary: '#EF5350', secondary: '#E57373' },
  { primary: '#26A69A', secondary: '#4DB6AC' },
];

// Icon mapping for categories
const CATEGORY_ICONS = {
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

/**
 * Horizontal category browser with image/icon cards.
 */
const CategoryBrowser = ({ dishes, flatListRef }) => {
  const colors = useSelector(state => state.theme.theme);

  if (!dishes || dishes.length === 0) return null;

  // Group dishes by category
  const dishCategories = dishes.reduce((acc, dish) => {
    const category = dish.category || strings.allItems;
    if (!acc[category]) acc[category] = [];
    acc[category].push(dish);
    return acc;
  }, {});

  const categoryNames = Object.keys(dishCategories);
  if (categoryNames.length <= 1) return null;

  const handleCategoryPress = (category) => {
    const firstDishInCategory = dishes.find(
      dish => (dish.category || strings.allItems) === category,
    );
    if (firstDishInCategory && flatListRef.current) {
      const dishIndex = dishes.findIndex(dish => dish._id === firstDishInCategory._id);
      if (dishIndex !== -1) {
        flatListRef.current.scrollToIndex({ index: dishIndex, animated: true, viewPosition: 0.1 });
      }
    }
  };

  const renderCategoryCard = ({ item: category, index }) => {
    const categoryDishes = dishCategories[category];
    const gradientColors = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
    const categoryImage = categoryDishes.find(d => d.image)?.image;
    const iconName = CATEGORY_ICONS[category] || 'restaurant-outline';

    return (
      <TouchableOpacity
        style={[
          styles.stunningCategoryCard,
          { shadowColor: gradientColors.primary },
          I18nManager.isRTL && { transform: [{ scaleX: -1 }] },
        ]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        {categoryImage ? (
          <View>
            <Image source={{ uri: categoryImage }} style={styles.categoryCardImage} />
            <ZText type="B13" color={colors.textColor} numberOfLines={1} align="center" style={styles.categoryLabelBelow}>
              {category}
            </ZText>
          </View>
        ) : (
          <View>
            <View style={[styles.categoryCardFallback, { backgroundColor: gradientColors.primary }]}>
              <Ionicons name={iconName} size={moderateScale(28)} color="white" />
            </View>
            <ZText type="B13" color={colors.textColor} numberOfLines={1} align="center" style={styles.categoryLabelBelow}>
              {category}
            </ZText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.stickyBrowseContainer, { backgroundColor: colors.backgroundColor }]}>
      <View style={styles.stunningCategoriesContainer}>
        <View style={{ marginTop: moderateScale(-6), marginBottom: moderateScale(8) }}>
          <ZText type="B16" color={colors.textColor} style={[styles.categoriesTitle, { marginBottom: 0 }]}>
            {strings.browseMenu}
          </ZText>
        </View>
        <FlatList
          data={categoryNames}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stunningCategoriesList}
          style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : null}
          renderItem={renderCategoryCard}
          keyExtractor={item => item}
        />
      </View>
    </View>
  );
};

export default React.memo(CategoryBrowser);
