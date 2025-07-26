import React from 'react';
import {
  ActivityIndicator,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import {moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import {StackNav} from '../../../../navigation/NavigationKeys';
import images from '../../../../assets/images';

export default function SearchDishes({
  dishes = [],
  isFetchingNextPage,
  ...props
}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const handleDishPress = (dish) => {
    navigation.navigate(StackNav.DishDetailScreen, {
      dishId: dish._id,
      chefId: dish.user_id,
    });
  };

  const handleVisitMenu = (dish) => {
    navigation.navigate(StackNav.ChefMenu, {
      chefId: dish.user_id,
      scrollToDishId: dish._id,
    });
  };

  const renderDishItem = ({item}) => (
    <TouchableOpacity
      style={[localStyles.dishCard, {backgroundColor: colors.white}]}
      onPress={() => handleDishPress(item)}
      activeOpacity={0.95}
    >
      {/* Hero Image Section */}
      <View style={localStyles.heroImageContainer}>
        <Image
          source={item.image ? {uri: item.image} : images.dishPlaceholder}
          style={localStyles.heroImage}
          resizeMode="cover"
        />

        {/* Gradient Overlays for Depth */}
        <View style={localStyles.topGradient} />
        <View style={localStyles.bottomGradient} />

        {/* Floating Rating Badge */}
        {item.average_rating > 0 && (
          <View style={localStyles.floatingRating}>
            <Ionicons
              name="star"
              size={moderateScale(12)}
              color="#FFD700"
            />
            <ZText
              type="B12"
              color={colors.white}
              style={localStyles.ratingValue}>
              {item.average_rating.toFixed(1)}
            </ZText>
          </View>
        )}

        {/* Price Tag */}
        <View
          style={[localStyles.priceTag, {backgroundColor: colors.primary}]}>
          <ZText
            type="B14"
            color={colors.white}
            style={localStyles.priceText}>
            {item.price} EGP
          </ZText>
        </View>
      </View>

      {/* Content Section */}
      <View style={localStyles.contentSection}>
        {/* Title */}
        <ZText type="B16" color="#1A1A1A" numberOfLines={1} style={localStyles.dishName}>
          {item.name}
        </ZText>

        {/* Description */}
        <ZText
          type="M12"
          color="#666666"
          numberOfLines={2}
          style={localStyles.dishDesc}>
          {item.description}
        </ZText>

        {/* Category Badge */}
        {item.category && (
          <View style={[localStyles.categoryBadge, {backgroundColor: colors.grayScale1}]}>
            <ZText type="M10" color="#888888">
              {item.category}
            </ZText>
          </View>
        )}

        {/* Visit Menu Button */}
        <TouchableOpacity
          style={[localStyles.visitMenuButton, {borderColor: colors.primary}]}
          onPress={() => handleVisitMenu(item)}
        >
          <Ionicons name="restaurant-outline" size={moderateScale(14)} color={colors.primary} />
          <ZText type="B12" color={colors.primary} style={styles.ml4}>
            Visit Menu
          </ZText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.container}>
      <FlatList
        data={dishes}
        ListFooterComponent={
          <View style={{height: 100}}>
            {isFetchingNextPage && (
              <ActivityIndicator color={colors.primary} size={'small'} />
            )}
          </View>
        }
        ListEmptyComponent={
          !props.isFetching && (
            <View style={localStyles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={moderateScale(64)} color={colors.grayScale4} />
              <ZText style={localStyles.emptyTitle} type={'B18'} color={colors.textColor}>
                No Dishes Found
              </ZText>
              <ZText style={localStyles.emptySubtitle} type={'M14'} color={colors.grayScale5}>
                Try searching with different keywords
              </ZText>
            </View>
          )
        }
        renderItem={renderDishItem}
        {...props}
        keyExtractor={item => item?._id}
        numColumns={2}
        columnWrapperStyle={localStyles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.listContainer}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  listContainer: {
    padding: moderateScale(8),
  },

  row: {
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(8),
  },

  // ✨ UNIFIED MODERN DISH CARD ✨
  dishCard: {
    width: '48%',
    marginBottom: moderateScale(16),
    borderRadius: moderateScale(16),
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
    height: moderateScale(120),
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
    height: moderateScale(40),
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(60),
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  floatingRating: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    gap: moderateScale(3),
  },
  ratingValue: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceTag: {
    position: 'absolute',
    bottom: moderateScale(8),
    left: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  priceText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content Section
  contentSection: {
    padding: moderateScale(12),
  },
  dishName: {
    marginBottom: moderateScale(4),
    fontWeight: '600',
  },
  dishDesc: {
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(16),
    opacity: 0.8,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(8),
  },

  visitMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderRadius: moderateScale(6),
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(60),
  },

  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },

  emptySubtitle: {
    textAlign: 'center',
  },
});