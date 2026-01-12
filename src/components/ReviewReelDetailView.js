import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery } from 'react-query';

import ZText from './common/ZText';
import ZButton from './common/ZButton';
import StarRating from './StarRating';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import request from '../api/request';
import images from '../assets/images';

const { width: screenWidth } = Dimensions.get('window');

const ReviewReelDetailView = ({ reviewReel, onClose }) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  // Fetch detailed review data
  const { data: reviewDetails } = useQuery(
    ['reviewReelDetails', reviewReel?.id],
    async () => {
      const response = await request.get(`/stories/${reviewReel.id}`);
      return response.data;
    },
    {
      enabled: !!reviewReel?.id,
    },
  );

  const handleViewDish = () => {
    if (reviewDetails?.reviewedDish) {
      navigation.navigate('DishDetailScreen', {
        dishId: reviewDetails.reviewedDish._id,
        chefId: reviewDetails.reviewedDish.user_id,
      });
      onClose();
    }
  };

  const handleViewMenu = () => {
    if (reviewDetails?.reviewedMenu) {
      navigation.navigate('MenuDetailScreen', {
        menuId: reviewDetails.reviewedMenu._id,
        chefId: reviewDetails.reviewedMenu.chef._id,
      });
      onClose();
    }
  };

  const handleViewChef = () => {
    if (reviewDetails?.author) {
      navigation.navigate('ChefProfile', {
        chefId: reviewDetails.author._id,
      });
      onClose();
    }
  };

  const renderReviewHeader = () => (
    <View style={[localStyles.header, { backgroundColor: colors.backgroundColor }]}>
      <TouchableOpacity style={localStyles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
      </TouchableOpacity>

      <ZText type="B16" color={colors.textColor}>
        Review Details
      </ZText>

      <View style={localStyles.closeButton} />
    </View>
  );

  const renderReviewerInfo = () => (
    <View style={[localStyles.reviewerSection, { backgroundColor: colors.white }]}>
      <TouchableOpacity style={localStyles.reviewerInfo} onPress={handleViewChef}>
        <Image
          source={
            reviewDetails?.author?.avatar
              ? { uri: reviewDetails.author.avatar }
              : colors.dark
                ? images.userDark
                : images.userLight
          }
          style={localStyles.reviewerAvatar}
        />
        <View style={localStyles.reviewerDetails}>
          <ZText type="B16" color="#1A1A1A">
            {reviewDetails?.author?.fullName || 'Anonymous'}
          </ZText>
          <ZText type="M12" color="#666666">
            Reviewer
          </ZText>
        </View>
      </TouchableOpacity>

      <View style={localStyles.ratingSection}>
        <StarRating
          rating={reviewDetails?.rating || 0}
          size={moderateScale(20)}
          readonly
        />
        <ZText type="B14" color={colors.primary} style={styles.ml8}>
          {reviewDetails?.rating}/5
        </ZText>
      </View>
    </View>
  );

  const renderReviewedItem = () => {
    const item = reviewDetails?.reviewedDish || reviewDetails?.reviewedMenu;
    const isMenu = !!reviewDetails?.reviewedMenu;

    if (!item) return null;

    return (
      <View style={[localStyles.reviewedItemSection, { backgroundColor: colors.white }]}>
        <ZText type="B16" color="#1A1A1A" style={localStyles.sectionTitle}>
          {isMenu ? strings.reviewedMenu : strings.reviewedDish}
        </ZText>

        <TouchableOpacity
          style={localStyles.reviewedItem}
          onPress={isMenu ? handleViewMenu : handleViewDish}>
          <Image
            source={
              item.image
                ? { uri: item.image }
                : images.dishPlaceholder
            }
            style={localStyles.itemImage}
          />

          <View style={localStyles.itemInfo}>
            <ZText type="B16" color="#1A1A1A" numberOfLines={2}>
              {item.name}
            </ZText>

            {item.description && (
              <ZText type="M14" color="#666666" numberOfLines={3} style={styles.mt4}>
                {item.description}
              </ZText>
            )}

            {!isMenu && item.price && (
              <ZText type="B14" color={colors.primary} style={styles.mt8}>
                {item.price} EGP
              </ZText>
            )}
          </View>

          <Ionicons
            name="chevron-forward"
            size={moderateScale(20)}
            color={colors.grayScale5}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderReviewContent = () => (
    <View style={[localStyles.reviewContentSection, { backgroundColor: colors.white }]}>
      <ZText type="B16" color="#1A1A1A" style={localStyles.sectionTitle}>
        Review
      </ZText>

      <ZText type="M16" color="#333333" style={localStyles.reviewText}>
        {reviewDetails?.caption || 'No review text provided.'}
      </ZText>

      {reviewDetails?.created_at && (
        <ZText type="M12" color="#888888" style={localStyles.reviewDate}>
          {new Date(reviewDetails.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </ZText>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={[localStyles.actionSection, { backgroundColor: colors.backgroundColor }]}>
      {reviewDetails?.reviewedDish && (
        <ZButton
          title={strings.viewDish}
          onPress={handleViewDish}
          containerStyle={[localStyles.actionButton, { backgroundColor: colors.primary }]}
        />
      )}

      {reviewDetails?.reviewedMenu && (
        <ZButton
          title={strings.viewMenu}
          onPress={handleViewMenu}
          containerStyle={[localStyles.actionButton, { backgroundColor: colors.primary }]}
        />
      )}
    </View>
  );

  return (
    <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
      {renderReviewHeader()}

      <ScrollView style={localStyles.content} showsVerticalScrollIndicator={false}>
        {renderReviewerInfo()}
        {renderReviewedItem()}
        {renderReviewContent()}
      </ScrollView>

      {renderActionButtons()}
    </View>
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

  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },

  reviewerSection: {
    padding: moderateScale(20),
    marginBottom: moderateScale(12),
  },

  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },

  reviewerAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
  },

  reviewerDetails: {
    flex: 1,
  },

  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
    borderRadius: moderateScale(12),
  },

  reviewedItemSection: {
    padding: moderateScale(20),
    marginBottom: moderateScale(12),
  },

  sectionTitle: {
    marginBottom: moderateScale(16),
  },

  reviewedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: moderateScale(12),
  },

  itemImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },

  itemInfo: {
    flex: 1,
  },

  reviewContentSection: {
    padding: moderateScale(20),
    marginBottom: moderateScale(12),
  },

  reviewText: {
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(12),
  },

  reviewDate: {
    textAlign: 'right',
  },

  actionSection: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(30),
  },

  actionButton: {
    marginBottom: moderateScale(12),
  },
});

export default ReviewReelDetailView;