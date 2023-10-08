import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './Type/StackNavigation';
import {useSelector} from 'react-redux';
import {BackgroundUploadProvider} from '../providers/BackgroundUploadProvider';
import {LocationProvider} from './locationContext';

export default function pAppNavigator() {
  const color = useSelector(state => state.theme.theme);

  const colors = {
    colors: {background: color.backgroundColor},
  };
  return (
    <NavigationContainer theme={colors}>
      <BackgroundUploadProvider>
        <LocationProvider>
          <StackNavigation />
        </LocationProvider>
      </BackgroundUploadProvider>
    </NavigationContainer>
  );
}
