// Library import
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import React, { useState, useEffect } from 'react';
import ZText from './common/ZText';
import ZButton from './common/ZButton';
import { getHeight, moderateScale } from '../common/constants';
import { styles } from '../themes';
import { StackNav, TabNav } from '../navigation/NavigationKeys';
import { useNavigation } from '@react-navigation/native';
import images from '../assets/images';
import request from '../api/request';
import { useMutation, useQueryClient } from 'react-query';
import strings from '../i18n/strings';
import { useHandleAuth } from '../utils/useHandleAuth';
import { useFollowState } from '../context/FollowStateContext';

export default function UserDetailComponent({
  id,
  userName,
  userImage,
  isFollowed,
  userDescription,
  isSuggested = false,
  currentUserId,
  isSearch,
  setIsAdding = () => { },
  userType,
  currentUserType,
}) {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);
  const queryClient = useQueryClient();
  const { getFollowStatus, setFollowStatus } = useFollowState();

  // Use global override if available, otherwise use prop value
  const globalOverride = getFollowStatus(id);
  const isFollow = globalOverride !== undefined ? globalOverride : isFollowed;

  const followMutation = useMutation(
    userToFollow => request.post('/follow', { userToFollow }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
        queryClient.invalidateQueries({ queryKey: 'stories' });
        if (!isSearch) {
          queryClient.invalidateQueries({ queryKey: 'search_user' });
        }
        queryClient.invalidateQueries({ queryKey: 'followStatistics' });
        queryClient.invalidateQueries({ queryKey: 'profile' });
        queryClient.invalidateQueries({ queryKey: 'chefInfo' });
        queryClient.invalidateQueries('IamFollowing');
        queryClient.invalidateQueries('IamFollowed');
        setTimeout(() => {
          setIsAdding?.(false);
        }, 100);
      },
      onError: () => {
        // Revert on error
        setFollowStatus(id, false);
        setTimeout(() => {
          setIsAdding?.(false);
        }, 100);
      },
    },
  );

  const unfollowMutation = useMutation(
    userToUnfollow => request.delete('/follow', { data: { userToUnfollow } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
        queryClient.invalidateQueries({ queryKey: 'stories' });
        if (!isSearch) {
          queryClient.invalidateQueries({ queryKey: 'search_user' });
        }
        queryClient.invalidateQueries({ queryKey: 'followStatistics' });
        queryClient.invalidateQueries({ queryKey: 'profile' });
        queryClient.invalidateQueries({ queryKey: 'chefInfo' });
        queryClient.invalidateQueries('IamFollowing');
        queryClient.invalidateQueries('IamFollowed');
        setTimeout(() => {
          setIsAdding?.(false);
        }, 100);
      },
      onError: () => {
        // Revert on error
        setFollowStatus(id, true);
        setIsAdding?.(false);
      },
    },
  );
  const { handleAuthToast } = useHandleAuth();

  const onPressFollow = () => {
    if (handleAuthToast()) {
      return;
    }
    setIsAdding?.(true);

    // Optimistic update - change global state immediately
    const newFollowState = !isFollow;
    setFollowStatus(id, newFollowState);

    if (isFollow) {
      unfollowMutation.mutate({ _id: id });
    } else {
      followMutation.mutate({ _id: id });
    }
  };
  const onPressUser = () => {
    if (currentUserId === id) {
      navigation.navigate(TabNav.Profile);
    } else {
      if (userType === 'chef') {
        navigation.navigate(StackNav.ChefMenu, {
          chefId: id,
          chefName: userName,
        });
      } else {
        navigation.navigate(StackNav.ProfileDetail, {
          userName: userName,
          userImage: userImage,
          id,
        });
      }
    }
  };
  return (
    <View style={localStyles.rootContainer}>
      <TouchableOpacity onPress={onPressUser} style={localStyles.userItem}>
        <Image
          source={
            userImage
              ? { uri: userImage }
              : colors.dark
                ? images.userDark
                : images.userLight
          }
          style={localStyles.imageStyle}
        />
        <View style={localStyles.userDescription}>
          <ZText type="b18" numberOfLines={1}>
            {userName}
          </ZText>
          {!!userDescription && (
            <ZText
              type="m14"
              style={styles.mt5}
              color={colors.dark ? colors.grayScale3 : colors.grayScale7}
              numberOfLines={1}>
              {userDescription}
            </ZText>
          )}
        </View>
      </TouchableOpacity>
      {id !== currentUserId && currentUserType !== 'chef' && (
        <ZButton
          title={!isFollow ? strings.follow : strings.following}
          color={!isFollow ? colors.white : colors.primary}
          textType="b14"
          containerStyle={[
            localStyles.buttonContainer,
            { borderColor: colors.primary },
          ]}
          bgColor={!isFollow ? colors.primary : colors.tranparent}
          onPress={onPressFollow}
        />
      )}
      {isSuggested && (
        <TouchableOpacity style={styles.ml5}>
          <Ionicons
            name="close-sharp"
            size={moderateScale(26)}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  rootContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
    ...styles.flex,
  },
  userItem: {
    flex: 1,
    ...styles.rowCenter,
  },
  imageStyle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    resizeMode: 'contain',
  },
  userDescription: {
    ...styles.mh10,
    ...styles.flex,
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(35),
    borderRadius: moderateScale(17),
    borderWidth: moderateScale(1),
  },
});
