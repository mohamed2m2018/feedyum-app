import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import { StackNav } from '../../../../navigation/NavigationKeys';
import images from '../../../../assets/images';
import StarRating from '../../../../components/StarRating';

const { width } = Dimensions.get('window');
const horizontalPadding = moderateScale(32); // 16 on each side
const columnGap = moderateScale(12); // Gap between columns
const itemWidth = (width - horizontalPadding - columnGap) / 2;

const SearchDishes = ({ 
  dishes, 
  onEndReachedThreshold, 
  isFetching, 
  isFetchingNextPage, 
  onMomentumScrollBegin 
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  // Debug logging
const handleDishPress = (dish) => {
    navigation.navigate(StackNav.DishDetailScreen, { 
      dishId: dish._id,
      dish: dish 
    });
  };

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={[localStyles.dishItem, { backgroundColor: colors.inputBg }]}
      onPress={() => handleDishPress(item)}
    >
      <Image
        source={
          item.image
            ? { uri: item.image }
            : images.defaultDish
        }
        style={localStyles.dishImage}
        resizeMode="cover"
      />
      <View style={localStyles.dishInfo}>
        <ZText 
          type="B14" 
          color={colors.textColor}
          numberOfLines={2}
          style={localStyles.dishName}
        >
          {item.name}
        </ZText>
        <ZText 
          type="s12" 
          color={colors.grayScale5}
          numberOfLines={1}
          style={localStyles.chefName}
        >
          {item.chef?.fullName || item.user_id?.fullName || strings.unknownChef}
        </ZText>
        <View style={localStyles.priceContainer}>
          <ZText type="B16" color={colors.primary}>
            £{item.price?.toFixed(2)}
          </ZText>
          <StarRating
            rating={Number.isFinite(item?.average_rating)
              ? item.average_rating
              : (Number.isFinite(item?.rating) ? item.rating : 0)}
            size="small"
            showText={false}
            showCount={false}
            showWhenNoRating={true}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={localStyles.emptyState}>
      <ZText type="s16" color={colors.grayScale5} style={localStyles.emptyText}>
        {strings.trySearchingDifferentKeywords}
      </ZText>
    </View>
  );

  if (isFetching && (!dishes || dishes.length === 0)) {
    return (
      <View style={localStyles.emptyState}>
        <ZText type="s16" color={colors.grayScale5} style={localStyles.emptyText}>
          {strings.loading}
        </ZText>
      </View>
    );
  }

  if (!dishes || dishes.length === 0) {
    return renderEmptyState();
  }

  return (
    <FlatList
      data={dishes}
      renderItem={renderDishItem}
      keyExtractor={(item, index) => `dish-${item._id || index}`}
      numColumns={2}
      contentContainerStyle={localStyles.container}
      columnWrapperStyle={localStyles.row}
      onEndReached={onMomentumScrollBegin}
      onEndReachedThreshold={onEndReachedThreshold}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
    />
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(20),
  },
  row: {
    justifyContent: 'space-between',
    gap: moderateScale(12), // Add gap between columns
  },
  dishItem: {
    width: itemWidth,
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dishImage: {
    width: '100%',
    height: moderateScale(120),
  },
  dishInfo: {
    padding: moderateScale(12),
  },
  dishName: {
    marginBottom: moderateScale(4),
  },
  chefName: {
    marginBottom: moderateScale(8),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default SearchDishes;