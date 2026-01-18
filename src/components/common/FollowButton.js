// Library import
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZText from './ZText';
import { moderateScale } from '../../common/constants';
import request from '../../api/request';
import { useMutation, useQueryClient } from 'react-query';
import strings from '../../i18n/strings';
import { useHandleAuth } from '../../utils/useHandleAuth';

/**
 * A compact, inline follow/unfollow button
 * @param {string} userId - The ID of the user to follow/unfollow
 * @param {boolean} isFollowed - Initial follow state
 * @param {boolean} compact - If true, shows only icon (no text)
 * @param {string} size - 'small' | 'medium' - button size variant
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
  const [isFollow, setIsFollow] = useState(isFollowed);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { handleAuthToast } = useHandleAuth();

  useEffect(() => {
    setIsFollow(isFollowed);
  }, [isFollowed]);

  // Invalidate all relevant queries to reflect changes app-wide
  const invalidateAllFollowQueries = () => {
    // Invalidate Following feed - critical for updating the following tab
    queryClient.invalidateQueries({ queryKey: 'stories_following' });
    // Invalidate For You feed in case it needs refresh
    queryClient.invalidateQueries({ queryKey: 'stories' });
    // Invalidate follow statistics (profile counts)
    queryClient.invalidateQueries({ queryKey: 'followStatistics' });
    // Invalidate user following lists
    queryClient.invalidateQueries('IamFollowing');
    queryClient.invalidateQueries('IamFollowed');
    // Invalidate profile data
    queryClient.invalidateQueries({ queryKey: 'profile' });
    // Invalidate search results
    queryClient.invalidateQueries({ queryKey: 'search_user' });
    // Invalidate chef info (for ChefMenu screen)
    queryClient.invalidateQueries({ queryKey: 'chefInfo' });
  };

  const followMutation = useMutation(
    userToFollow => request.post('/follow', { userToFollow }),
    {
      onSuccess: () => {
        invalidateAllFollowQueries();
        setIsLoading(false);
      },
      onError: () => {
        setIsFollow(false); // Revert on error
        setIsLoading(false);
      },
    },
  );

  const unfollowMutation = useMutation(
    userToUnfollow => request.delete('/follow', { data: { userToUnfollow } }),
    {
      onSuccess: () => {
        invalidateAllFollowQueries();
        setIsLoading(false);
      },
      onError: () => {
        setIsFollow(true); // Revert on error
        setIsLoading(false);
      },
    },
  );

  const handlePress = () => {
    if (handleAuthToast()) {
      return;
    }

    if (!userId) return;

    setIsLoading(true);
    const newFollowState = !isFollow;
    setIsFollow(newFollowState);

    if (newFollowState) {
      followMutation.mutate({ _id: userId });
    } else {
      unfollowMutation.mutate({ _id: userId });
    }

    onFollowChange?.(newFollowState);
  };

  const sizeStyles = size === 'small' ? localStyles.small : localStyles.medium;
  const iconSize = size === 'small' ? moderateScale(12) : moderateScale(14);
  const textType = size === 'small' ? 'B10' : 'B12';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={[
        localStyles.container,
        sizeStyles,
        {
          backgroundColor: isFollow ? 'rgba(255, 255, 255, 0.15)' : colors.primary,
          borderColor: isFollow ? 'rgba(255, 255, 255, 0.3)' : colors.primary,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
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
        </>
      )}
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
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
