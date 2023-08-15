// Libraries import
import React, {useLayoutEffect} from 'react';

// Local import
import ReelsComponentFollowing from './ReelsComponentFollowing';
import {useNavigation} from '@react-navigation/native';

export default function Following() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      detachPreviousScreen: false,
      detachInactiveScreens: false,
    });
  }, [navigation]);
  return <ReelsComponentFollowing />;
}
