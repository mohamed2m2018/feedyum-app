import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useQuery} from 'react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import strings from '../../../i18n/strings';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZLoader from '../../../components/common/ZLoader';
import {moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import request from '../../../api/request';

const MenuDetailScreen = () => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();

  const {menuId, chefId} = route.params;

  // Fetch menu details
  const {
    data: menuData,
    isLoading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useQuery(
    ['menuDetail', menuId],
    async () => {
      const response = await request.get(`/menus/${menuId}`);
      return response.data;
    },
    {
      enabled: !!menuId,
      retry: 2,
    },
  );

  const handleCreateReviewReel = () => {
    navigation.navigate('ReviewReelCreator', {
      menuData,
      reviewType: 'menu',
    });
  };

  const handleDishPress = (dish) => {
    navigation.navigate('DishDetailScreen', {
      dishId: dish._id,
      chefId: chefId,
    });
  };

  const renderHeader = () => (
    <View style={[localStyles.header, {backgroundColor: colors.backgroundColor}]}>
      <TouchableOpacity
        style={localStyles.headerButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.textColor} />
      </TouchableOpacity>
      
      <ZText type="B18" color={colors.textColor} numberOfLines={1}>
        {menuData?.name || 'Menu'}
      </ZText>
      
      <View style={localStyles.headerButton} />
    </View>
  );

  const renderMenuInfo = () => (
    <View style={[localStyles.menuInfoSection, {backgroundColor: colors.white}]}>
      <ZText type="B24" color="#1A1A1A" style={localStyles.menuName}>
        {menuData?.name}
      </ZText>
      
      {menuData?.description && (
        <ZText type="M16" color="#555555" style={localStyles.menuDescription}>
          {menuData.description}
        </ZText>
      )}

      {/* Chef Info */}
      {menuData?.chef && (
        <TouchableOpacity
          style={localStyles.chefInfo}
          onPress={() => navigation.navigate('ChefProfile', {chefId})}>
          <ZText type="M12" color="#888888">
            Chef
          </ZText>
          <ZText type="B14" color="#1A1A1A">
            {menuData.chef.fullName || strings.unknownChef}
          </ZText>
        </TouchableOpacity>
      )}

      {/* Review Reel Button */}
      <TouchableOpacity
        style={[localStyles.reviewReelButton, {borderColor: colors.primary}]}
        onPress={handleCreateReviewReel}>
        <Ionicons
          name="star"
          size={moderateScale(20)}
          color={colors.primary}
        />
        <ZText type="B14" color={colors.primary} style={styles.ml8}>
          Review This Menu
        </ZText>
      </TouchableOpacity>
    </View>
  );

  const renderDishItem = ({item: dish}) => (
    <TouchableOpacity
      style={[localStyles.dishItem, {backgroundColor: colors.white}]}
      onPress={() => handleDishPress(dish)}>
      <View style={localStyles.dishInfo}>
        <ZText type="B16" color="#1A1A1A" style={localStyles.dishName}>
          {dish.name}
        </ZText>
        
        {dish.description && (
          <ZText type="M14" color="#666666" numberOfLines={2} style={localStyles.dishDescription}>
            {dish.description}
          </ZText>
        )}
        
        <ZText type="B16" color={colors.primary} style={localStyles.dishPrice}>
          {dish.price} EGP
        </ZText>
      </View>
      
      <Ionicons
        name="chevron-forward"
        size={moderateScale(20)}
        color={colors.grayScale5}
      />
    </TouchableOpacity>
  );

  const renderDishes = () => (
    <View style={[localStyles.dishesSection, {backgroundColor: colors.backgroundColor}]}>
      <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
        Dishes ({menuData?.dishes?.length || 0})
      </ZText>
      
      <FlatList
        data={menuData?.dishes || []}
        renderItem={renderDishItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={localStyles.separator} />}
      />
    </View>
  );

  if (menuLoading) {
    return (
      <ZSafeAreaView>
        {renderHeader()}
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (menuError || !menuData) {
    return (
      <ZSafeAreaView>
        {renderHeader()}
        <View style={localStyles.errorContainer}>
          <Ionicons
            name="restaurant-outline"
            size={moderateScale(64)}
            color={colors.grayScale7}
          />
          <ZText
            type="B16"
            align="center"
            color={colors.error}
            style={localStyles.errorTitle}>
            Failed to load menu
          </ZText>
          <ZButton
            title="Retry"
            onPress={refetchMenu}
            containerStyle={localStyles.retryButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      {renderHeader()}
      
      <ScrollView style={localStyles.container} showsVerticalScrollIndicator={false}>
        {renderMenuInfo()}
        {renderDishes()}
      </ScrollView>
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuInfoSection: {
    padding: moderateScale(24),
    marginBottom: moderateScale(16),
  },

  menuName: {
    marginBottom: moderateScale(12),
    fontWeight: '800',
  },

  menuDescription: {
    marginBottom: moderateScale(16),
    lineHeight: moderateScale(22),
  },

  chefInfo: {
    marginBottom: moderateScale(20),
  },

  reviewReelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderWidth: 1.5,
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
  },

  dishesSection: {
    flex: 1,
    padding: moderateScale(20),
  },

  sectionTitle: {
    marginBottom: moderateScale(16),
  },

  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    marginBottom: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  dishInfo: {
    flex: 1,
  },

  dishName: {
    marginBottom: moderateScale(4),
  },

  dishDescription: {
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(18),
  },

  dishPrice: {
    fontWeight: '700',
  },

  separator: {
    height: moderateScale(8),
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },

  errorTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(20),
  },

  retryButton: {
    marginTop: moderateScale(20),
    height: moderateScale(40),
    paddingHorizontal: moderateScale(30),
  },
});

export default MenuDetailScreen;