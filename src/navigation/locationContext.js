import React, {createContext, useContext, useEffect, useState} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {Platform} from 'react-native';
import {PERMISSIONS, request} from 'react-native-permissions'; // Import react-native-permissions

const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({children}) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        let permission;
        if (Platform.OS === 'ios') {
          // Request location permission specifically for iOS
          permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        } else {
          // Request location permission for Android
          permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        }

        const result = await request(permission);
        if (result === 'granted') {
          Geolocation.getCurrentPosition(
            position => {
              const {latitude, longitude} = position.coords;
              setLocation({latitude, longitude});
            },
            error => {
              console.warn('Error getting location:', error.message);
            },
            {enableHighAccuracy: true, timeout: 60000},
          );
        } else {
          console.warn('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestLocationPermission();
  }, []);

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
};
