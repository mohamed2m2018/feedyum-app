import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {useQuery} from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import ZLoader from '../../../../components/common/ZLoader';
import request from '../../../../api/request';
import {moderateScale} from '../../../../common/constants';
import images from '../../../../assets/images';
import strings from '../../../../i18n/strings';

const AttachedDishesComponent = ({
  colors,
  userId,
  attachedDishes = [],
  onDishesChange,
}) => {
  const [showDishSelector, setShowDishSelector] = useState(false);

  // Fetch chef's dishes
  const {
    data: dishesData,
    isLoading: dishesLoading,
    error: dishesError,
  } = useQuery(
    ['chefDishes', userId],
    async () => {
      try {
        // Get the chef's menu first, then fetch dishes
        const menuResponse = await request.get(`/menus/chef/${userId}`);
        const menuId = menuResponse.data?._id;

        if (!menuId) {
          return [];
        }

        // Fetch dishes by menu ID
        const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
        return dishesResponse.data || [];
      } catch (error) {
return [];
      }
    },
    {
      enabled: !!userId && showDishSelector,
    },
  );

  const handleAddDish = dish => {
    if (attachedDishes.length >= 3) {
      Alert.alert(strings.maximumReached, strings.canAttachUpTo3Dishes);
      return;
    }

    if (attachedDishes.find(d => d._id === dish._id)) {
      Alert.alert(strings.alreadyAdded, strings.dishAlreadyAttached);
      return;
    }

    const newDishes = [...attachedDishes, dish];
    onDishesChange(newDishes);
    setShowDishSelector(false);
  };

  const handleRemoveDish = dishId => {
    const newDishes = attachedDishes.filter(dish => dish._id !== dishId);
    onDishesChange(newDishes);
  };

  const renderDishItem = ({item}) => (
    <TouchableOpacity
      style={[localStyles.dishSelectorItem, {backgroundColor: colors.inputBg}]}
      onPress={() => handleAddDish(item)}
      activeOpacity={0.8}>
      <Image
        source={item.image ? {uri: item.image} : images.dishPlaceholder}
        style={localStyles.dishSelectorImage}
        resizeMode="cover"
      />
      <View style={localStyles.dishSelectorInfo}>
        <ZText type="B16" color={colors.textColor} numberOfLines={1}>
          {item.name}
        </ZText>
        <ZText type="M14" color={colors.grayScale7} numberOfLines={2}>
          {item.description}
        </ZText>
        <ZText type="B14" color={colors.primary}>
          ${item.price}
        </ZText>
      </View>
      <Ionicons
        name="add-circle"
        size={moderateScale(24)}
        color={colors.primary}
      />
    </TouchableOpacity>
  );

  const renderAttachedDish = (dish, index) => (
    <View
      key={dish._id}
      style={[
        localStyles.attachedDishCard,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.bColor,
        },
      ]}>
      <Image
        source={dish.image ? {uri: dish.image} : images.dishPlaceholder}
        style={localStyles.attachedDishImage}
        resizeMode="cover"
      />
      <View style={localStyles.attachedDishOverlay}>
        <TouchableOpacity
          style={[
            localStyles.removeDishButton,
            {backgroundColor: colors.redColor},
          ]}
          onPress={() => handleRemoveDish(dish._id)}
          activeOpacity={0.8}>
          <Ionicons name="close" size={moderateScale(16)} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={localStyles.attachedDishInfo}>
        <ZText
          type="B14"
          color={colors.textColor}
          numberOfLines={1}
          style={localStyles.dishName}>
          {dish.name}
        </ZText>
        <ZText type="B12" color={colors.primary}>
          ${dish.price}
        </ZText>
      </View>
    </View>
  );

  return (
    <View style={localStyles.container}>
      {/* Attached Dishes Display */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.attachedDishesContainer}>
        {attachedDishes.map((dish, index) => renderAttachedDish(dish, index))}

        {/* Add Dish Button */}
        {attachedDishes.length < 3 && (
          <TouchableOpacity
            style={[
              localStyles.addDishButton,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.bColor,
              },
            ]}
            onPress={() => setShowDishSelector(true)}
            activeOpacity={0.8}>
            <Ionicons
              name="add-circle-outline"
              size={moderateScale(32)}
              color={colors.primary}
            />
            <ZText type="M12" color={colors.grayScale7} style={localStyles.addDishText}>
              Add Dish
            </ZText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Dish Selector Modal */}
      <Modal
        visible={showDishSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDishSelector(false)}>
        <View style={[localStyles.modalContainer, {backgroundColor: colors.backgroundColor}]}>
          {/* Modal Header */}
          <View style={[localStyles.modalHeader, {borderBottomColor: colors.bColor}]}>
            <TouchableOpacity
              onPress={() => setShowDishSelector(false)}
              style={localStyles.closeButton}>
              <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
            </TouchableOpacity>
            <ZText type="B20" color={colors.textColor}>
              Select Dishes from Menu
            </ZText>
            <View style={localStyles.placeholder} />
          </View>

          {/* Dishes List */}
          <View style={localStyles.modalContent}>
            {dishesLoading ? (
              <View style={localStyles.loadingContainer}>
                <ZLoader />
                <ZText type="M16" color={colors.grayScale7} style={localStyles.loadingText}>
                  Loading your dishes...
                </ZText>
              </View>
            ) : dishesError ? (
              <View style={localStyles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={moderateScale(48)}
                  color={colors.redColor}
                />
                <ZText type="M16" color={colors.redColor} style={localStyles.errorText}>
                  Failed to load dishes
                </ZText>
              </View>
            ) : dishesData?.length === 0 ? (
              <View style={localStyles.emptyContainer}>
                <Ionicons
                  name="restaurant-outline"
                  size={moderateScale(64)}
                  color={colors.grayScale4}
                />
                <ZText type="B18" color={colors.grayScale7} style={localStyles.emptyTitle}>
                  No dishes found
                </ZText>
                <ZText type="M14" color={colors.grayScale7} style={localStyles.emptySubtitle}>
                  Add dishes to your menu first to attach them to posts
                </ZText>
              </View>
            ) : (
              <FlatList
                data={dishesData}
                renderItem={renderDishItem}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.dishesListContent}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(16),
  },
  attachedDishesContainer: {
    paddingRight: moderateScale(16),
  },
  attachedDishCard: {
    width: moderateScale(120),
    height: moderateScale(140),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(12),
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  attachedDishImage: {
    width: '100%',
    height: moderateScale(90),
  },
  attachedDishOverlay: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
  },
  removeDishButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachedDishInfo: {
    padding: moderateScale(8),
    flex: 1,
    justifyContent: 'space-between',
  },
  dishName: {
    marginBottom: moderateScale(4),
  },
  addDishButton: {
    width: moderateScale(120),
    height: moderateScale(140),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDishText: {
    marginTop: moderateScale(8),
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: moderateScale(4),
  },
  placeholder: {
    width: moderateScale(32),
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  dishSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(6),
  },
  dishSelectorImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  dishSelectorInfo: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  dishesListContent: {
    paddingVertical: moderateScale(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: moderateScale(32),
  },
});

export default AttachedDishesComponent;