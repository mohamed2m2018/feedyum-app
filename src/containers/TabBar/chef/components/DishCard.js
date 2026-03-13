// Library imports
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import StarRating from '../../../../components/StarRating';
import strings from '../../../../i18n/strings';

const DishCard = ({
  dish,
  onEdit,
  onDelete,
  onToggleVisibility,
  onPress,
  containerStyle,
}) => {
  const colors = useSelector(state => state.theme.theme);

  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility(dish);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(dish);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(dish);
    }
  };

  return (
    <TouchableOpacity
      style={[
        localStyles.container,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.bColor,
        },
        containerStyle,
      ]}
      onPress={() => onPress && onPress(dish)}
      activeOpacity={0.8}>
      {/* Dish Image */}
      <View style={localStyles.imageContainer}>
        <Image
          source={{
            uri:
              dish.image || 'https://via.placeholder.com/150x150?text=No+Image',
          }}
          style={localStyles.dishImage}
          resizeMode="cover"
        />
        {dish.visible === false && (
          <View style={localStyles.hiddenOverlay}>
            <ZText type="S12" color={colors.white}>
              HIDDEN
            </ZText>
          </View>
        )}
      </View>

      {/* Dish Info */}
      <View style={localStyles.dishInfo}>
        <ZText type="B16" numberOfLines={1} style={localStyles.dishName}>
          {dish.name}
        </ZText>
        <ZText
          type="M14"
          color={colors.grayScale7}
          numberOfLines={2}
          style={localStyles.dishDescription}>
          {dish.description}
        </ZText>
        <StarRating
          rating={Number.isFinite(dish?.average_rating)
            ? dish.average_rating
            : (Number.isFinite(dish?.rating) ? dish.rating : 0)}
          size="small"
          showText={false}
          showCount={false}
          showWhenNoRating={true}
          style={{ marginBottom: moderateScale(6) }}
        />
        <View style={localStyles.priceRow}>
          <ZText type="B16" color={colors.primary}>
            {dish.price} {strings.currency}
          </ZText>
          {dish.cookingTime && (
            <ZText type="M12" color={colors.grayScale7}>
              {dish.cookingTime}min
            </ZText>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={localStyles.actionsContainer}>
        <TouchableOpacity
          style={[
            localStyles.actionButton,
            {
              backgroundColor: dish.visible !== false
                ? colors.primary
                : colors.grayScale4,
            },
          ]}
          onPress={handleToggleVisibility}>
          <Ionicons
            name={dish.visible !== false ? 'eye' : 'eye-off'}
            size={moderateScale(16)}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: colors.blue }]}
          onPress={handleEdit}>
          <Ionicons
            name="create-outline"
            size={moderateScale(16)}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.actionButton, { backgroundColor: colors.redColor }]}
          onPress={handleDelete}>
          <Ionicons
            name="trash-outline"
            size={moderateScale(16)}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(16),
    borderWidth: 0,
    overflow: 'hidden',
    marginBottom: moderateScale(16),
    ...styles.shadowStyle,
    shadowOpacity: 0.15,
    elevation: 4,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: moderateScale(140),
  },
  hiddenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishInfo: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  dishName: {
    marginBottom: moderateScale(6),
    fontWeight: '600',
  },
  dishDescription: {
    marginBottom: moderateScale(12),
    lineHeight: moderateScale(20),
    opacity: 0.8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    gap: moderateScale(8),
  },
  actionButton: {
    flex: 1,
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});

export default DishCard;
