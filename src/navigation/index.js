import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './Type/StackNavigation';
import {useSelector} from 'react-redux';

export default function AppNavigator() {
  const color = useSelector(state => state.theme.theme);

  const colors = {
    colors: {background: color.backgroundColor},
  };
  return (
    <NavigationContainer theme={colors}>
      <StackNavigation />
    </NavigationContainer>
  );
}
