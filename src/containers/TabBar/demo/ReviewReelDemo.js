import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import MenuCard from '../../../components/MenuCard';
import ReelComponent from '../../../components/ReelComponent';
import { moderateScale } from '../../../common/constants';
import { styles } from '../../../themes';

const ReviewReelDemo = () => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  // Demo data
  const demoMenu = {
    _id: 'demo-menu-1',
    name: 'Mediterranean Delights',
    description: 'Authentic Mediterranean cuisine with fresh ingredients and traditional recipes',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    chef: {
      _id: 'demo-chef-1',
      fullName: 'Chef Maria Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=100&h=100&fit=crop&crop=face',
    },
    dishes: [
      { _id: 'dish-1', name: 'Grilled Salmon' },
      { _id: 'dish-2', name: 'Greek Salad' },
      { _id: 'dish-3', name: 'Lamb Souvlaki' },
    ],
  };

  const demoDish = {
    _id: 'demo-dish-1',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon fillet with lemon herb butter and seasonal vegetables',
    price: 120,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    user_id: 'demo-chef-1',
  };

  const demoReviewReels = [
    {
      id: 'review-1',
      title: 'Amazing Mediterranean Experience!',
      poster: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
      reviewMode: true,
      rating: 5,
      author: {
        fullName: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
      },
      caption: 'This menu is absolutely incredible! Every dish was perfectly prepared.',
      views: 1250,
    },
    {
      id: 'review-2',
      title: 'Perfect Grilled Salmon',
      poster: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=600&fit=crop',
      reviewMode: true,
      rating: 4,
      author: {
        fullName: 'Mike Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      },
      caption: 'The salmon was cooked to perfection. Highly recommend!',
      views: 890,
    },
    {
      id: 'review-3',
      title: 'Great Value Menu',
      poster: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=600&fit=crop',
      reviewMode: true,
      rating: 4,
      author: {
        fullName: 'Emma Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      },
      caption: 'Amazing food at reasonable prices. Will definitely order again!',
      views: 2100,
    },
  ];

  const handleCreateDishReview = () => {
    navigation.navigate('ReviewReelCreator', {
      dishData: demoDish,
      reviewType: 'dish',
    });
  };

  const handleCreateMenuReview = () => {
    navigation.navigate('ReviewReelCreator', {
      menuData: demoMenu,
      reviewType: 'menu',
    });
  };

  const renderHeader = () => (
    <View style={[localStyles.header, { backgroundColor: colors.backgroundColor }]}>
      <TouchableOpacity
        style={localStyles.backButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={moderateScale(24)} color={colors.textColor} />
      </TouchableOpacity>

      <ZText type="B18" color={colors.textColor}>
        Review Reel System Demo
      </ZText>

      <View style={localStyles.backButton} />
    </View>
  );

  const renderFeatureOverview = () => (
    <View style={[localStyles.section, { backgroundColor: colors.white }]}>
      <ZText type="B18" color="#1A1A1A" style={localStyles.sectionTitle}>
        🎬 Review Reel Features
      </ZText>

      <View style={localStyles.featureList}>
        <View style={localStyles.featureItem}>
          <Ionicons name="videocam" size={moderateScale(20)} color={colors.primary} />
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Create video reviews for dishes and menus
          </ZText>
        </View>

        <View style={localStyles.featureItem}>
          <Ionicons name="star" size={moderateScale(20)} color="#FFD700" />
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Rate your experience with 1-5 stars
          </ZText>
        </View>

        <View style={localStyles.featureItem}>
          <Ionicons name="link" size={moderateScale(20)} color={colors.primary} />
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Reels are linked to specific dishes/menus
          </ZText>
        </View>

        <View style={localStyles.featureItem}>
          <Ionicons name="eye" size={moderateScale(20)} color={colors.primary} />
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Review badge clearly marks review content
          </ZText>
        </View>
      </View>
    </View>
  );

  const renderDemoMenu = () => (
    <View style={[localStyles.section, { backgroundColor: colors.backgroundColor }]}>
      <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
        📋 Demo Menu
      </ZText>

      <MenuCard menu={demoMenu} chefId={demoMenu.chef._id} />

      <ZButton
        title={strings.createMenuReviewReel}
        onPress={handleCreateMenuReview}
        containerStyle={[localStyles.actionButton, { backgroundColor: colors.primary }]}
      />
    </View>
  );

  const renderDemoDish = () => (
    <View style={[localStyles.section, { backgroundColor: colors.white }]}>
      <ZText type="B18" color="#1A1A1A" style={localStyles.sectionTitle}>
        🍽️ Demo Dish
      </ZText>

      <View style={localStyles.dishCard}>
        <ZText type="B16" color="#1A1A1A">
          {demoDish.name}
        </ZText>
        <ZText type="M14" color="#666666" style={styles.mt4}>
          {demoDish.description}
        </ZText>
        <ZText type="B14" color={colors.primary} style={styles.mt8}>
          {demoDish.price} EGP
        </ZText>
      </View>

      <ZButton
        title={strings.createDishReviewReel}
        onPress={handleCreateDishReview}
        containerStyle={[localStyles.actionButton, { backgroundColor: colors.primary }]}
      />
    </View>
  );

  const renderReviewReels = () => (
    <View style={[localStyles.section, { backgroundColor: colors.backgroundColor }]}>
      <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
        🎥 Sample Review Reels
      </ZText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={localStyles.reelsContainer}>
          {demoReviewReels.map((reel, index) => (
            <ReelComponent
              key={reel.id}
              data={reel.views}
              isPlay={true}
              reelUrl={reel.poster}
              id={reel.id}
              item={reel}
              style={localStyles.reelItem}
            />
          ))}
        </View>
      </ScrollView>

      <ZText type="M12" color={colors.grayScale5} style={localStyles.note}>
        Notice the "REVIEW" badge and star ratings on the reels above
      </ZText>
    </View>
  );

  const renderUserFlow = () => (
    <View style={[localStyles.section, { backgroundColor: colors.white }]}>
      <ZText type="B18" color="#1A1A1A" style={localStyles.sectionTitle}>
        🔄 User Flow
      </ZText>

      <View style={localStyles.flowSteps}>
        <View style={localStyles.flowStep}>
          <View style={[localStyles.stepNumber, { backgroundColor: colors.primary }]}>
            <ZText type="B12" color={colors.white}>1</ZText>
          </View>
          <ZText type="M14" color="#333333" style={styles.ml12}>
            User browses dishes/menus
          </ZText>
        </View>

        <View style={localStyles.flowStep}>
          <View style={[localStyles.stepNumber, { backgroundColor: colors.primary }]}>
            <ZText type="B12" color={colors.white}>2</ZText>
          </View>
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Taps "Create Review" button
          </ZText>
        </View>

        <View style={localStyles.flowStep}>
          <View style={[localStyles.stepNumber, { backgroundColor: colors.primary }]}>
            <ZText type="B12" color={colors.white}>3</ZText>
          </View>
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Records video review with rating
          </ZText>
        </View>

        <View style={localStyles.flowStep}>
          <View style={[localStyles.stepNumber, { backgroundColor: colors.primary }]}>
            <ZText type="B12" color={colors.white}>4</ZText>
          </View>
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Reel appears in feed with review badge
          </ZText>
        </View>

        <View style={localStyles.flowStep}>
          <View style={[localStyles.stepNumber, { backgroundColor: colors.primary }]}>
            <ZText type="B12" color={colors.white}>5</ZText>
          </View>
          <ZText type="M14" color="#333333" style={styles.ml12}>
            Others can view and navigate to dish/menu
          </ZText>
        </View>
      </View>
    </View>
  );

  return (
    <ZSafeAreaView>
      {renderHeader()}

      <ScrollView style={localStyles.container} showsVerticalScrollIndicator={false}>
        {renderFeatureOverview()}
        {renderDemoMenu()}
        {renderDemoDish()}
        {renderReviewReels()}
        {renderUserFlow()}
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

  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    padding: moderateScale(20),
    marginBottom: moderateScale(12),
  },

  sectionTitle: {
    marginBottom: moderateScale(16),
  },

  featureList: {
    gap: moderateScale(12),
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dishCard: {
    padding: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },

  actionButton: {
    marginTop: moderateScale(12),
  },

  reelsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(8),
  },

  reelItem: {
    marginHorizontal: moderateScale(4),
  },

  note: {
    textAlign: 'center',
    marginTop: moderateScale(12),
    fontStyle: 'italic',
  },

  flowSteps: {
    gap: moderateScale(16),
  },

  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReviewReelDemo;