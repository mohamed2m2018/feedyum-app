import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from './common/ZText';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import images from '../assets/images';

const MenuCard = ({ menu, chefId, style }) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const handleMenuPress = () => {
    navigation.navigate('MenuDetail', {
      menuId: menu._id,
      chefId: chefId || menu.chef?._id,
    });
  };

  const handleCreateReviewReel = (e) => {
    e.stopPropagation();
    navigation.navigate('ReviewReelCreator', {
      menuData: menu,
      reviewType: 'menu',
    });
  };

  return (
    <TouchableOpacity
      style={[localStyles.container, { backgroundColor: colors.white }, style]}
      onPress={handleMenuPress}
      activeOpacity={0.8}>

      {/* Menu Image */}
      <Image
        source={
          menu.image
            ? { uri: menu.image }
            : images.dishPlaceholder
        }
        style={localStyles.menuImage}
        resizeMode="cover"
      />

      {/* Menu Info */}
      <View style={localStyles.menuInfo}>
        <ZText type="B16" color="#1A1A1A" numberOfLines={2} style={localStyles.menuName}>
          {menu.name}
        </ZText>

        {menu.description && (
          <ZText type="M14" color="#666666" numberOfLines={3} style={localStyles.menuDescription}>
            {menu.description}
          </ZText>
        )}

        {/* Chef Info */}
        {menu.chef && (
          <View style={localStyles.chefInfo}>
            <ZText type="M12" color="#888888">
              by {menu.chef.fullName || 'Chef'}
            </ZText>
          </View>
        )}

        {/* Dishes Count */}
        <View style={localStyles.dishesInfo}>
          <Ionicons
            name="restaurant"
            size={moderateScale(14)}
            color={colors.primary}
          />
          <ZText type="M12" color={colors.primary} style={styles.ml4}>
            {menu.dishes?.length || 0} dishes
          </ZText>
        </View>

        {/* Action Buttons */}
        <View style={localStyles.actionButtons}>
          <TouchableOpacity
            style={[localStyles.reviewButton, { borderColor: colors.primary }]}
            onPress={handleCreateReviewReel}>
            <Ionicons
              name="star"
              size={moderateScale(16)}
              color={colors.primary}
            />
            <ZText type="B12" color={colors.primary} style={styles.ml4}>
              Review
            </ZText>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.viewButton}>
            <ZText type="B12" color={colors.white}>
              View Menu
            </ZText>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(14)}
              color={colors.white}
              style={styles.ml4}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: moderateScale(16),
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  menuImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },

  menuInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },

  menuName: {
    marginBottom: moderateScale(4),
    fontWeight: '700',
  },

  menuDescription: {
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(18),
  },

  chefInfo: {
    marginBottom: moderateScale(8),
  },

  dishesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    backgroundColor: '#FF4D67',
    borderRadius: moderateScale(16),
  },
});

export default MenuCard;