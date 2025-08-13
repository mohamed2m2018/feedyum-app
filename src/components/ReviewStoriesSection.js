import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from './common/ZText';
import ZLoader from './common/ZLoader';
import {moderateScale} from '../common/constants';
import {styles} from '../themes';
import {StackNav} from '../navigation/NavigationKeys';

const {width: screenWidth} = Dimensions.get('window');

const ReviewStoriesSection = ({
  reviewStories = [],
  isLoading = false,
  onRefresh,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const handleReviewStoryPress = (story) => {
    // Navigate to the story in the reels view
    navigation.navigate(StackNav.reelsOne, {
      storyId: story._id,
      profile: { _id: story.author._id },
      stories: [story],
    });
  };

  if (isLoading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ZLoader />
      </View>
    );
  }

  if (!reviewStories || reviewStories.length === 0) {
    return (
      <View style={[localStyles.emptyContainer, {backgroundColor: colors.backgroundColor}]}>
        <Ionicons name="star-outline" size={moderateScale(48)} color={colors.grayScale5} />
        <ZText type="M16" color={colors.grayScale5} style={localStyles.emptyText}>
          No review posts yet
        </ZText>
        <ZText type="M14" color={colors.grayScale5} style={localStyles.emptySubtext}>
          Be the first to share your experience!
        </ZText>
      </View>
    );
  }

  return (
    <View style={[localStyles.container, {backgroundColor: colors.backgroundColor}]}>
      <View style={localStyles.header}>
        <ZText type="B16" color={colors.textColor}>
          Review Posts ({reviewStories.length})
        </ZText>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={localStyles.refreshButton}>
            <Ionicons name="refresh" size={moderateScale(20)} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContainer}
      >
        {reviewStories.map((story, index) => (
          <TouchableOpacity
            key={story._id}
            style={[localStyles.reviewCard, {backgroundColor: colors.white}]}
            onPress={() => handleReviewStoryPress(story)}
          >
            {/* Review Badge */}
            <View style={[localStyles.reviewBadge, {backgroundColor: colors.primary}]}>
              <Ionicons name="star" size={moderateScale(10)} color={colors.white} />
              <ZText type="B10" color={colors.white} style={styles.ml2}>
                {story.rating}/5
              </ZText>
            </View>

            {/* Media Preview */}
            <View style={localStyles.mediaContainer}>
              {story.avatarUri ? (
                <Image
                  source={{ uri: story.avatarUri }}
                  style={localStyles.mediaImage}
                  resizeMode="cover"
                />
              ) : story.poster ? (
                <Image
                  source={{ uri: story.poster }}
                  style={localStyles.mediaImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[localStyles.placeholderMedia, {backgroundColor: colors.grayScale2}]}>
                  <Ionicons name="image" size={moderateScale(24)} color={colors.grayScale5} />
                </View>
              )}
              
              {/* Play icon for videos */}
              {story.uri && (
                <View style={localStyles.playIconContainer}>
                  <Ionicons name="play" size={moderateScale(16)} color={colors.white} />
                </View>
              )}
            </View>

            {/* Author Info */}
            <View style={localStyles.authorContainer}>
              <Image
                source={
                  story.author?.avatar
                    ? { uri: story.author.avatar }
                    : require('../assets/images/userLight.png')
                }
                style={localStyles.authorAvatar}
              />
              <View style={localStyles.authorInfo}>
                <ZText type="B12" color={colors.textColor} numberOfLines={1}>
                  {story.author?.fullName || 'Anonymous'}
                </ZText>
                <View style={localStyles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={story.rating && story.rating > 0 
                        ? (star <= story.rating ? 'star' : 'star-outline')
                        : 'star'
                      }
                      size={moderateScale(10)}
                      color={story.rating && story.rating > 0 
                        ? (star <= story.rating ? '#FFD700' : colors.grayScale5)
                        : (colors.grayScale4 || "#CCCCCC")
                      }
                      style={{
                        opacity: story.rating && story.rating > 0 ? 1 : 0.4
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Caption Preview */}
            {story.caption && (
              <ZText 
                type="M11" 
                color={colors.grayScale6} 
                numberOfLines={2}
                style={localStyles.caption}
              >
                {story.caption}
              </ZText>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(16),
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
  },

  refreshButton: {
    padding: moderateScale(4),
  },

  scrollContainer: {
    paddingHorizontal: moderateScale(16),
  },

  reviewCard: {
    width: moderateScale(140),
    marginRight: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    padding: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  reviewBadge: {
    position: 'absolute',
    top: moderateScale(4),
    right: moderateScale(4),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    zIndex: 1,
  },

  mediaContainer: {
    position: 'relative',
    marginBottom: moderateScale(8),
  },

  mediaImage: {
    width: '100%',
    height: moderateScale(100),
    borderRadius: moderateScale(8),
  },

  placeholderMedia: {
    width: '100%',
    height: moderateScale(100),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },

  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(12),
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },

  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },

  authorAvatar: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    marginRight: moderateScale(6),
  },

  authorInfo: {
    flex: 1,
  },

  ratingContainer: {
    flexDirection: 'row',
    marginTop: moderateScale(2),
  },

  caption: {
    lineHeight: moderateScale(14),
  },

  loadingContainer: {
    height: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: moderateScale(32),
    alignItems: 'center',
  },

  emptyText: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(4),
  },

  emptySubtext: {
    textAlign: 'center',
  },
});

export default ReviewStoriesSection;