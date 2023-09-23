// Libraries import
import React, {useEffect} from 'react';

// Local import
import ReelsComponentFollowing from './ReelsComponentFollowing';
import {useIsFocused} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import {TabNav} from '../../../navigation/NavigationKeys';

export default function Following() {
  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.FollowingTab);
    }
  }, [isFocused, updateCurrentScreen]);

  return <ReelsComponentFollowing />;
}
