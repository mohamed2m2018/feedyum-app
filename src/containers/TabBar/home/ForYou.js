// Libraries import
import React, {useEffect, useLayoutEffect} from 'react';

// Local import
import ReelsComponent from './ReelsComponent';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import {TabNav} from '../../../navigation/NavigationKeys';

export default function ForYou() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.ForYou);
    }
  }, [isFocused, updateCurrentScreen]);
  useLayoutEffect(() => {
    navigation.setOptions({
      detachPreviousScreen: false,
      detachInactiveScreens: false,
    });
  }, [navigation]);
  return <ReelsComponent />;
}
