// Library import
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showSuccessToast, showErrorToast, showActionDialog } from '../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import millify from 'millify';

// Local import
import images from '../assets/images';
import { getHeight, moderateScale } from '../common/constants';
import ZText from '../components/common/ZText';
import { styles } from '../themes';
import { StackNav } from '../navigation/NavigationKeys';
import request from '../api/request';
import { useQueryClient } from 'react-query';
import strings from '../i18n/strings';
import { optimizeImageUrl, ImagePresets } from '../utils/imageOptimizer';

const ReelComponent = ({
  data = 0,
  isPlay = false,
  reelUrl = '',
  style,
  id,
  profileId,
  item = {},
  isDeleteAllowed = false,
  setisLoadingSomething,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const onDeleteStory = async () => {
    try {
      setisLoadingSomething(true);
      await request.delete(`story/deleteById/${id}`);

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries('stories');
      queryClient.invalidateQueries('user');
      await queryClient.invalidateQueries({ queryKey: 'profile-stories' });
      await queryClient.invalidateQueries({ queryKey: 'profile-reviews' });
      queryClient.invalidateQueries({ queryKey: 'stories_following' });
      queryClient.invalidateQueries({ queryKey: 'search_user' });
      queryClient.invalidateQueries({ queryKey: 'followStatistics' });

      setisLoadingSomething(false);

      // Show success feedback
      showSuccessToast(strings.success,
        item?.reviewMode ? strings.reviewDeleted : strings.postDeleted
      );
    } catch (error) {
      setisLoadingSomething(false);
      showErrorToast(strings.error,
        item?.reviewMode ? 'Failed to delete review. Please try again.' : 'Failed to delete post. Please try again.'
      );
    }
  };

  const confirmDeleteStory = () => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.deletePost,
      message: strings.areYouSure,
      confirmText: strings.delete,
      cancelText: strings.cancel,
      onConfirm: onDeleteStory,
    });
  };

  const onPressReel = () => {
    navigation.navigate(StackNav.SingleReel, {
      storyId: id,
      profile: profileId,
    });
  };

  return (
    <TouchableOpacity
      onPress={onPressReel}
      style={[
        localStyles.postContainer,
        {
          ...style,
        },
      ]}>
      <ImageBackground
        source={
          reelUrl
            ? {
              uri: optimizeImageUrl(
                item?.poster || item?.avatarUri || reelUrl,
                ImagePresets.REEL_POSTER
              ),
            }
            : images.post
        }
        style={localStyles.postImgStyle}
        resizeMode="cover"
        imageStyle={{ borderRadius: moderateScale(10) }}>
        {/* Video Play Button - Show for videos (uri contains story_videos) */}
        {item?.uri?.includes('story_videos') && (
          <View style={localStyles.videoPlayOverlay}>
            <View style={localStyles.playButtonCircle}>
              <Ionicons
                name="play"
                size={moderateScale(20)}
                color={colors.white}
                style={{ marginLeft: moderateScale(2) }}
              />
            </View>
          </View>
        )}
        {!!data && (
          <View style={localStyles.playStyle}>
            <Ionicons
              name="eye"
              size={moderateScale(16)}
              color={colors.primary}
            />
            <ZText type="s14" style={styles.ml5} color={colors.white}>
              {data > 10 ? millify(data || 0) : data} views
            </ZText>
          </View>
        )}
      </ImageBackground>
      {isDeleteAllowed && (
        <TouchableOpacity
          onPress={confirmDeleteStory}
          style={localStyles.deleteIconStyle}
          activeOpacity={0.7}>
          <Ionicons
            name="trash"
            size={moderateScale(24)}
            color={colors.white}
          />
        </TouchableOpacity>
      )}

      {isDeleteAllowed && (
        <TouchableOpacity
          onPress={() => {
            if (item?.reviewMode) {
              // Navigate to review edit screen with review-specific data
              navigation.navigate(StackNav.ReviewReelCreator, {
                editMode: true,
                reviewData: item,
                dishData: item?.reviewedDish ? {
                  _id: item.reviewedDish._id || item.reviewedDish,
                  name: item.reviewedDish.name,
                  image: item.reviewedDish.image,
                  category: item.reviewedDish.category
                } : null,
                menuData: item?.reviewedMenu ? {
                  _id: item.reviewedMenu._id || item.reviewedMenu,
                  name: item.reviewedMenu.name,
                  description: item.reviewedMenu.description
                } : null,
                reviewType: item.reviewType
              });
            } else {
              // Navigate to edit post screen
              navigation.navigate(StackNav.EditReel, {
                postDataToBeEdited: item,
              });
            }
          }}
          style={localStyles.editIconStyle}
          activeOpacity={0.7}>
          <Ionicons
            name="pencil"
            size={moderateScale(24)}
            color={colors.white}
          />
        </TouchableOpacity>
      )}

      {/* Review Badge */}
      {item?.reviewMode && !isDeleteAllowed && (
        <View style={localStyles.reviewBadge}>
          <Ionicons
            name="star"
            size={moderateScale(10)}
            color="#FFD700"
          />
          <ZText type="B8" color={colors.white} style={styles.ml2}>
            {strings.review.toUpperCase()}
          </ZText>
        </View>
      )}

      {/* Rating Badge for Reviews */}
      {item?.reviewMode && item?.rating && !isDeleteAllowed && (
        <View style={localStyles.ratingBadge}>
          <ZText type="B12" color={colors.white}>
            {item.rating}
          </ZText>
          <Ionicons
            name="star"
            size={moderateScale(10)}
            color="#FFD700"
            style={styles.ml2}
          />
        </View>
      )}

      <View style={styles.textContainer}>
        <ZText style={[localStyles.titleText, { color: colors.textColor }]} numberOfLines={2}>
          {item?.title}
        </ZText>
        {!!item?.price && (
          <ZText style={[localStyles.priceText, { color: colors.textColor }]}>
            {item?.price} LE
          </ZText>
        )}
        {item?.reviewMode && !isDeleteAllowed && (
          <View style={localStyles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={item?.rating && item.rating > 0
                  ? (star <= item.rating ? 'star' : 'star-outline')
                  : 'star'
                }
                size={moderateScale(12)}
                color={item?.rating && item.rating > 0
                  ? (star <= item.rating ? '#FFD700' : colors.grayScale5)
                  : (colors.grayScale4 || "#CCCCCC")
                }
                style={{
                  opacity: item?.rating && item.rating > 0 ? 1 : 0.4
                }}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(ReelComponent);

const localStyles = StyleSheet.create({
  postContainer: {
    flex: 1,
    minHeight: getHeight(240),
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScale(6),
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 7,
    height: moderateScale(50),
  },
  postImgStyle: {
    ...styles.mt5,
    height: getHeight(190),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  playStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: getHeight(10),
    left: moderateScale(10),
  },
  videoPlayOverlay: {
    position: 'absolute',
    bottom: moderateScale(8),
    right: moderateScale(8),
  },
  playButtonCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playIconStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  deleteIconStyle: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(20),
    padding: moderateScale(6),
  },
  editIconStyle: {
    position: 'absolute',
    top: moderateScale(50),
    right: moderateScale(10),
  },
  reviewBadge: {
    position: 'absolute',
    top: moderateScale(8),
    left: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 103, 0.9)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    zIndex: 10,
  },
  titleText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  priceText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: moderateScale(4),
  },
});
