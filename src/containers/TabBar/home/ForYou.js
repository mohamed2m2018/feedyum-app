// Libraries import
import React, {useEffect} from 'react';

// Local import
import ReelsComponent from './ReelsComponent';
import {useIsFocused} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import {TabNav} from '../../../navigation/NavigationKeys';

export default function ForYou() {
  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.ForYou);
    }
  }, [isFocused, updateCurrentScreen]);

  return <ReelsComponent />;
}
