import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from './ZText';
import {moderateScale} from '../../common/constants';
import images from '../../assets/images';
import {StackNav} from '../../navigation/NavigationKeys';

const AttachedDishesDisplay = ({
  attachedDishes = [],
  onDishPress,
  containerStyle,
  showPrices = true,
  compact = false,
  chefId,
  chefName,
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
      // Navigate to chef menu with dish ID for auto-scroll
      navigation.navigate(StackNav.ChefMenu, {
        chefId: chefId,
        scrollToDishId: dish._id,
        chefName: chefName,
      });
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
        source={dish.image ? {uri: dish.image} : images.dishPlaceholder}
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
                ${dish.price}
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
    bottom: moderateScale(280), // Positioned much higher to be well above action icons
    right: moderateScale(16),
    // Remove left constraint for compact mode to allow right alignment
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
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  dishesContainer: {
    paddingRight: moderateScale(16),
  },
  verticalDishesContainer: {
    alignItems: 'flex-end', // Align dishes to the right side above action icons
  },
  dishCard: {
    width: moderateScale(120),
    height: moderateScale(140),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(12),
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  compactDishCard: {
    width: moderateScale(75),
    height: moderateScale(85),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: moderateScale(10),
    borderBottomRightRadius: moderateScale(10),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(4),
  },
  dishInfo: {
    zIndex: 2,
  },
  dishName: {
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
    marginBottom: moderateScale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    alignSelf: 'flex-start',
    marginTop: moderateScale(2),
  },
  priceText: {
    marginLeft: moderateScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  shineEffect: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.7,
  },
});

export default AttachedDishesDisplay;