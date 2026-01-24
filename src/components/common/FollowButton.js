// Library import
import React, { useState, useEffect, useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZText from './ZText';
import { moderateScale } from '../../common/constants';
import request from '../../api/request';
import { useMutation, useQueryClient } from 'react-query';
import strings from '../../i18n/strings';
import { useHandleAuth } from '../../utils/useHandleAuth';
import { useFollowState } from '../../context/FollowStateContext';

/**
 * A compact, inline follow/unfollow button with optimistic updates
 * 
 * Uses global FollowStateContext to ensure all instances for the same user
 * sync immediately when follow state changes.
 * 
 * @param {string} userId - The ID of the user to follow/unfollow
 * @param {boolean} isFollowed - Initial follow state from server
 * @param {boolean} compact - If true, shows only icon (no text)
 * @param {string} size - 'small' | 'medium' | 'icon' - button size variant
 * @param {object} style - Additional container styles
 * @param {function} onFollowChange - Callback when follow state changes
 */
export default function FollowButton({
  userId,
  isFollowed = false,
  compact = false,
  size = 'small',
  style,
  onFollowChange,
}) {
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const { handleAuthToast } = useHandleAuth();
  const { getFollowStatus, setFollowStatus } = useFollowState();

  // Use global override if available, otherwise use prop value
  const globalOverride = getFollowStatus(userId);
  const isFollow = globalOverride !== undefined ? globalOverride : isFollowed;

  // Invalidate non-story queries that reflect follow relationship changes
  const invalidateFollowQueries = () => {
    // Invalidate follow statistics (profile counts)
    queryClient.invalidateQueries({ queryKey: 'followStatistics' });
    // Invalidate user following lists
    queryClient.invalidateQueries('IamFollowing');
    queryClient.invalidateQueries('IamFollowed');
    // Invalidate profile data
    queryClient.invalidateQueries({ queryKey: 'profile' });
    // Invalidate search results
    queryClient.invalidateQueries({ queryKey: 'search_user' });
  };

  // Update follow state directly in cached stories (no refetch, preserves scroll)
  const updateCachedFollowState = (targetUserId, newFollowState) => {
    console.log('[FollowButton] updateCachedFollowState called with:', targetUserId, newFollowState);

    // Helper to update stories in a query data structure
    const updateStoriesData = (oldData) => {
      if (!oldData) {
        console.log('[FollowButton] No cached data found');
        return oldData;
      }

      let matchCount = 0;

      // Update a single story - checks BOTH user and reviewedChef
      const updateStory = (story) => {
        let updated = story;

        // Update author (user) follow state
        if (story.user?._id === targetUserId) {
          console.log('[FollowButton] Matched story.user._id:', story.user._id);
          matchCount++;
          updated = {
            ...updated,
            user: { ...updated.user, currentUserFollowed: newFollowState }
          };
        }

        // Also update reviewed chef follow state (same story can have both)
        if (story.reviewedChef?._id === targetUserId) {
          console.log('[FollowButton] Matched story.reviewedChef._id:', story.reviewedChef._id);
          matchCount++;
          updated = {
            ...updated,
            reviewedChef: { ...updated.reviewedChef, currentUserFollowed: newFollowState }
          };
        }

        return updated;
      };

      // Handle paginated/infinite query structure
      if (oldData.pages) {
        console.log('[FollowButton] Found paginated data with', oldData.pages.length, 'pages');
        const result = {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            // API returns 'stories' array, not 'data'
            stories: page.stories?.map(updateStory)
          }))
        };
        console.log('[FollowButton] Total matches found:', matchCount);
        return result;
      }

      // Handle simple array structure
      if (Array.isArray(oldData)) {
        console.log('[FollowButton] Found array data with', oldData.length, 'items');
        return oldData.map(updateStory);
      }

      console.log('[FollowButton] Unknown data structure');
      return oldData;
    };

    // Update all cached story queries using partial key matching
    // Query keys are: ['stories', userId, categoryIds, lat, long] and ['stories-following', userId, lat, long]
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();

    allQueries.forEach(query => {
      const key = query.queryKey;
      // Match queries that start with 'stories' or 'stories-following'
      if (Array.isArray(key) && (key[0] === 'stories' || key[0] === 'stories-following')) {
        console.log('[FollowButton] Updating query with key:', key[0]);
        queryClient.setQueryData(key, updateStoriesData);
      }
    });

    console.log('[FollowButton] Updated', allQueries.filter(q =>
      Array.isArray(q.queryKey) && (q.queryKey[0] === 'stories' || q.queryKey[0] === 'stories-following')
    ).length, 'query caches');
  };

  const followMutation = useMutation(
    userToFollow => request.post('/follow', { userToFollow }),
    {
      onSuccess: (_, variables) => {
        invalidateFollowQueries();
        // Update cached stories directly (no refetch)
        updateCachedFollowState(variables._id, true);
        // Invalidate Following feed to fetch new content from followed user
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
      },
      onError: (_, variables) => {
        // Revert on error - update global state back to unfollowed
        setFollowStatus(variables._id, false);
      },
    },
  );

  const unfollowMutation = useMutation(
    userToUnfollow => request.delete('/follow', { data: { userToUnfollow } }),
    {
      onSuccess: (_, variables) => {
        invalidateFollowQueries();
        // Update cached stories directly (no refetch, preserves scroll position)
        updateCachedFollowState(variables._id, false);
        // Note: setQueryData should automatically notify subscribers
      },
      onError: (_, variables) => {
        // Revert on error - update global state back to followed
        setFollowStatus(variables._id, true);
      },
    },
  );

  const handlePress = () => {
    if (handleAuthToast()) {
      return;
    }

    if (!userId) return;

    // Optimistic update - change global state immediately
    const newFollowState = !isFollow;
    setFollowStatus(userId, newFollowState);

    console.log('[FollowButton] Action:', newFollowState ? 'FOLLOW' : 'UNFOLLOW', 'userId:', userId);

    if (newFollowState) {
      followMutation.mutate({ _id: userId });
    } else {
      unfollowMutation.mutate({ _id: userId });
    }

    onFollowChange?.(newFollowState);
  };

  const isLoading = followMutation.isLoading || unfollowMutation.isLoading;
  const sizeStyles = size === 'small' ? localStyles.small : localStyles.medium;
  const iconSize = size === 'small' ? moderateScale(12) : moderateScale(14);
  const textType = size === 'small' ? 'B10' : 'B12';

  // Icon-only mode - just a heart icon (for restaurant badges)
  if (compact && size === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          localStyles.iconOnlyContainer,
          { opacity: isLoading ? 0.7 : 1 },
          style,
        ]}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isFollow ? 'heart' : 'heart-outline'}
          size={moderateScale(18)}
          color={isFollow ? colors.primary : 'rgba(255, 255, 255, 0.8)'}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        localStyles.container,
        sizeStyles,
        {
          backgroundColor: isFollow ? 'rgba(255, 255, 255, 0.15)' : colors.primary,
          borderColor: isFollow ? 'rgba(255, 255, 255, 0.3)' : colors.primary,
          // Subtle opacity reduction during pending state
          opacity: isLoading ? 0.7 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {!compact && (
        <Ionicons
          name={isFollow ? 'checkmark' : 'add'}
          size={iconSize}
          color="#FFFFFF"
          style={localStyles.icon}
        />
      )}
      <ZText type={textType} color="#FFFFFF" style={localStyles.text}>
        {isFollow ? strings.following : strings.follow}
      </ZText>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  iconOnlyContainer: {
    padding: moderateScale(4),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    minWidth: moderateScale(55),
    minHeight: moderateScale(22),
  },
  medium: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    minWidth: moderateScale(70),
    minHeight: moderateScale(28),
  },
  icon: {
    marginRight: moderateScale(2),
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
