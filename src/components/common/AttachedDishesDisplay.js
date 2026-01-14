import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StarRating from '../StarRating';
import ZText from './ZText';
import { moderateScale } from '../../common/constants';
import images from '../../assets/images';
import { StackNav } from '../../navigation/NavigationKeys';
import strings from '../../i18n/strings';

const AttachedDishesDisplay = ({
  attachedDishes = [],
  onDishPress,
  containerStyle,
  showPrices = true,
  compact = false,
  chefId,
  chefName,
  restaurantName,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  if (!attachedDishes || attachedDishes.length === 0) {
    return null;
  }

  const handleDishPress = (dish) => {
    if (onDishPress) {
      onDishPress(dish);
    } else {
      // Use dish's user_id (chef/owner) if available, otherwise fall back to passed chefId
      const dishChefId = dish?.user_id?._id || dish?.user_id || chefId;
      const dishChefName = dish?.user_id?.fullName || chefName;

      // If checks for partner status - usually defined by having a valid chef ID or specific type
      const isPartnerDish = !!dishChefId && (dish.type === 'menu' || !!dish.menuId || !!dish._id);

      if (isPartnerDish) {
        // Partner Dish: Navigate to Chef Menu
        navigation.navigate(StackNav.ChefMenu, {
          chefId: dishChefId,
          scrollToDishId: dish?._id || dish?.id,
          chefName: dishChefName,
        });
      } else {
        // Manual/Unlinked Dish: Google Search
        // Prioritize passed restaurantName (from post) over dishChefName (which might be the reviewer)
        const searchEntity = restaurantName || dishChefName || '';
        const query = `${searchEntity} ${dish.name}`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
        Linking.openURL(searchUrl);
      }
    }
  };

  const renderDish = (dish, index) => (
    <TouchableOpacity
      key={dish._id || index}
      style={[
        compact ? localStyles.compactDishCard : localStyles.dishCard,
        {
          backgroundColor: colors.backgroundColor + 'E6', // Semi-transparent background
          borderColor: colors.white + '40', // Semi-transparent border
        },
      ]}
      onPress={() => handleDishPress(dish)}
      activeOpacity={0.8}>
      <Image
        source={(dish.image || dish.dishImage || dish.imageUrl)
          ? { uri: dish.image || dish.dishImage || dish.imageUrl }
          : images.dishPlaceholder}
        style={compact ? localStyles.compactDishImage : localStyles.dishImage}
        resizeMode="cover"
      />



      {/* Dish Info Overlay */}
      <View style={localStyles.dishInfoOverlay}>
        <View style={localStyles.dishInfo}>
          <ZText
            type={compact ? "B12" : "B14"}
            color={colors.white}
            numberOfLines={1}
            style={localStyles.dishName}>
            {dish.name}
          </ZText>
          <StarRating
            rating={Number.isFinite(dish?.average_rating)
              ? dish.average_rating
              : (Number.isFinite(dish?.rating) ? dish.rating : 0)}
            size={compact ? 'small' : 'medium'}
            showText={false}
            showCount={false}
            showWhenNoRating={true}
            style={{ marginBottom: moderateScale(2) }}
          />

          {showPrices && (
            <View style={localStyles.priceContainer}>
              <Ionicons
                name="pricetag"
                size={moderateScale(compact ? 10 : 12)}
                color={colors.white}
              />
              <ZText
                type={compact ? "B10" : "B12"}
                color={colors.white}
                style={localStyles.priceText}>
                {strings.currency} {dish.price}
              </ZText>
            </View>
          )}
        </View>
      </View>

      {/* Shine Effect */}
      <View style={localStyles.shineEffect} />
    </TouchableOpacity>
  );

  return (
    <View style={[localStyles.container, containerStyle]}>
      {/* Dishes Display */}
      {compact ? (
        // Vertical column for compact mode (reels) - no header to save space
        <View style={localStyles.verticalDishesContainer}>
          {attachedDishes.slice(0, 3).map((dish, index) => renderDish(dish, index))}
        </View>
      ) : (
        // Horizontal scroll for full mode with header
        <>
          {/* Header */}
          <View style={localStyles.header}>
            <View style={localStyles.headerIcon}>
              <Ionicons
                name="restaurant"
                size={moderateScale(16)}
                color={colors.primary}
              />
            </View>
            <ZText type="B14" color={colors.white} style={localStyles.headerText}>
              Featured Dishes
            </ZText>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.dishesContainer}
            decelerationRate="fast"
            snapToInterval={moderateScale(130)}
            snapToAlignment="start">
            {attachedDishes.map((dish, index) => renderDish(dish, index))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: moderateScale(280),
    right: moderateScale(16),
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  headerIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  headerText: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dishesContainer: {
    paddingRight: moderateScale(16),
  },
  verticalDishesContainer: {
    alignItems: 'flex-end',
  },
  dishCard: {
    width: moderateScale(120),
    height: moderateScale(140),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF',
    marginRight: moderateScale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  compactDishCard: {
    width: moderateScale(80),
    height: moderateScale(90),
    borderRadius: moderateScale(14),
    backgroundColor: '#1a1a1a',
    marginBottom: moderateScale(8),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  compactDishImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  dishInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(5),
  },
  dishInfo: {
    zIndex: 2,
  },
  dishName: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: moderateScale(2),
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
    marginTop: moderateScale(2),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  priceText: {
    marginLeft: moderateScale(3),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontWeight: '700',
  },
  shineEffect: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default AttachedDishesDisplay;