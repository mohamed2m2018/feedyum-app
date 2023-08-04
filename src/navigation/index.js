import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './Type/StackNavigation';

export default function AppNavigator() {
  const colors = {
    colors: {background: 'black'},
  };
  return (
    <NavigationContainer theme={colors}>
      <StackNavigation />
    </NavigationContainer>
  );
}
