// Libraries import
import React, {useEffect, useLayoutEffect} from 'react';

// Local import
import ReelsComponentFollowing from './ReelsComponentFollowing';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import {TabNav} from '../../../navigation/NavigationKeys';

export default function Following() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.FollowingTab);
    }
  }, [isFocused, updateCurrentScreen]);

  useLayoutEffect(() => {
    navigation.setOptions({
      detachPreviousScreen: false,
      detachInactiveScreens: false,
    });
  }, [navigation]);
  return <ReelsComponentFollowing />;
}
