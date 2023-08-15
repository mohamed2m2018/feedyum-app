// Libraries import
import React, {useLayoutEffect} from 'react';

// Local import
import ReelsComponent from './ReelsComponent';
import {useNavigation} from '@react-navigation/native';

export default function ForYou() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      detachPreviousScreen: false,
      detachInactiveScreens: false,
    });
  }, [navigation]);
  return <ReelsComponent />;
}
