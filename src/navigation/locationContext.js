import React, { createContext, useContext, useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { Linking, Platform } from 'react-native';
import {
  PERMISSIONS,
  request,
  requestNotifications,
} from 'react-native-permissions'; // Import react-native-permissions
import { showInfoToast } from '../utils/toast';
import GoogleMapsService from '../services/GoogleMapsService';

const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [useDeliveryAddress, setUseDeliveryAddress] = useState(false);

  const handleRequestPermission = () => {
    if (Platform.OS === 'android') {
      requestNotifications(['alert', 'sound']).then(({ status }) => {
        if (status === 'blocked' || status === 'denied') {
          setTimeout(() => {
            showInfoToast('', "You didn't grant notifications permission, You will be directed to settings");
            setTimeout(() => {
              Linking.openSettings();
            }, 2000);
          }, 5000);
        }
      });
    }
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      console.log('[LocationContext] Starting location permission request...');
      try {
        let permission;
        if (Platform.OS === 'ios') {
          // Request location permission specifically for iOS
          permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
          console.log('[LocationContext] Platform: iOS, requesting LOCATION_WHEN_IN_USE');
        } else {
          // Request location permission for Android
          permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
          console.log('[LocationContext] Platform: Android, requesting ACCESS_FINE_LOCATION');
        }

        console.log('[LocationContext] Calling request() for permission...');
        const result = await request(permission);
        console.log('[LocationContext] Permission result:', result);

        if (result === 'granted') {
          console.log('[LocationContext] Permission granted, calling getCurrentPosition...');
          // Helper function to get location with retries and fallback
          const getLocation = async () => {
            console.log('[LocationContext] Attempting to get location...');

            const getCurrentPositionPromise = (options) => {
              return new Promise((resolve, reject) => {
                Geolocation.getCurrentPosition(resolve, reject, options);
              });
            };

            try {
              // Attempt 1: High Accuracy with shorter timeout
              console.log('[LocationContext] Attempt 1: High Accuracy');
              let position = await getCurrentPositionPromise({ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
              processPosition(position);
            } catch (error) {
              console.warn('[LocationContext] High accuracy failed:', error.message);

              try {
                // Attempt 2: Low Accuracy (Network/Wifi)
                console.log('[LocationContext] Attempt 2: Low Accuracy (Fallback)');
                let position = await getCurrentPositionPromise({ enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 });
                processPosition(position);
              } catch (secondError) {
                console.error('[LocationContext] All location attempts failed:', secondError.message);
                handleRequestPermission(); // Treat as permission/location failure
              }
            }
          };

          const processPosition = async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Got GPS coordinates:', latitude, longitude);

            let addressDetails = null;

            // Retry mechanism for reverse geocoding
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`Reverse geocoding attempt ${attempt}/${maxRetries}...`);
                const geocodeResult = await GoogleMapsService.reverseGeocode(latitude, longitude);
                console.log('Geocode result:', geocodeResult);

                if (geocodeResult && geocodeResult.address) {
                  addressDetails = geocodeResult.address;
                  console.log('Address resolved:', addressDetails);
                  break; // Success, exit retry loop
                } else {
                  console.warn('Geocode response missing address:', geocodeResult);
                }
              } catch (e) {
                console.error(`Reverse geocoding attempt ${attempt} failed:`, e.message || e);
                if (attempt < maxRetries) {
                  // Wait a bit before retrying
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }

            setLocation({
              latitude,
              longitude,
              address: addressDetails
            });
            handleRequestPermission();
          };

          getLocation();
        } else {
          console.log('[LocationContext] Permission NOT granted, result was:', result);
          handleRequestPermission();
        }
      } catch (err) {
        console.error('[LocationContext] Error in requestLocationPermission:', err);
      }
    };

    console.log('[LocationContext] useEffect triggered, calling requestLocationPermission...');
    requestLocationPermission();
  }, []);

  // Function to update delivery address location
  const updateDeliveryLocation = (address) => {
    if (address?.location?.lat && address?.location?.long) {
      const newDeliveryLocation = {
        latitude: parseFloat(address.location.lat),
        longitude: parseFloat(address.location.long),
        address: address.formattedAddress || address.nameLine || 'Selected Address', // Use string, not object
        selectedAddress: address // Keep full object for reference if needed
      };
      setDeliveryLocation(newDeliveryLocation);
      setUseDeliveryAddress(true);
    } else {
      setUseDeliveryAddress(false);
    }
  };

  // Function to use device location
  const useDeviceLocation = () => {
    setUseDeliveryAddress(false);
  };

  // Determine which location to return
  const currentLocation = useDeliveryAddress && deliveryLocation ? deliveryLocation : location;

  const contextValue = {
    ...currentLocation,
    updateDeliveryLocation,
    useDeviceLocation,
    isUsingDeliveryAddress: useDeliveryAddress,
    deliveryAddress: deliveryLocation?.address
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};
