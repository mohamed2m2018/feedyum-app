import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PERMISSIONS,
  request,
  requestNotifications,
} from 'react-native-permissions'; // Import react-native-permissions
import { showInfoToast } from '../utils/toast';
import GoogleMapsService from '../services/GoogleMapsService';
import { haversineDistance } from '../utils/haversineDistance';

const STABLE_LOCATION_KEY = '@stable_location';
const LOCATION_THRESHOLD_KM = 1.0; // 1km threshold for refetch

const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [useDeliveryAddress, setUseDeliveryAddress] = useState(false);

  // Stable location - only updates when location changes by > 1km
  // This is what query hooks should use for their query keys
  const [stableLocation, setStableLocation] = useState(null);
  const isInitialized = useRef(false);

  // Load persisted stable location on mount
  useEffect(() => {
    const loadStableLocation = async () => {
      try {
        const stored = await AsyncStorage.getItem(STABLE_LOCATION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[LocationContext] Loaded persisted stable location:', parsed);
          setStableLocation(parsed);
        }
        isInitialized.current = true;
      } catch (error) {
        console.warn('[LocationContext] Failed to load stable location:', error);
        isInitialized.current = true;
      }
    };
    loadStableLocation();
  }, []);

  // Update stable location only if distance exceeds threshold
  const updateStableLocationIfSignificant = useCallback(async (newCoords) => {
    if (!newCoords?.latitude || !newCoords?.longitude) return;

    const newLocation = {
      latitude: parseFloat(newCoords.latitude),
      longitude: parseFloat(newCoords.longitude),
    };

    // First time or no stable location - set immediately
    if (!stableLocation) {
      console.log('[LocationContext] Setting initial stable location:', newLocation);
      setStableLocation(newLocation);
      try {
        await AsyncStorage.setItem(STABLE_LOCATION_KEY, JSON.stringify(newLocation));
      } catch (error) {
        console.warn('[LocationContext] Failed to persist stable location:', error);
      }
      return;
    }

    // Calculate distance from current stable location
    const distance = haversineDistance(
      stableLocation.latitude,
      stableLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    console.log('[LocationContext] Distance from stable location:', distance.toFixed(2), 'km');

    // Only update if distance exceeds threshold
    if (distance >= LOCATION_THRESHOLD_KM) {
      console.log('[LocationContext] Location changed significantly (>', LOCATION_THRESHOLD_KM, 'km), updating stable location');
      setStableLocation(newLocation);
      try {
        await AsyncStorage.setItem(STABLE_LOCATION_KEY, JSON.stringify(newLocation));
      } catch (error) {
        console.warn('[LocationContext] Failed to persist stable location:', error);
      }
    } else {
      console.log('[LocationContext] Location change insignificant (<', LOCATION_THRESHOLD_KM, 'km), keeping stable location');
    }
  }, [stableLocation]);

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
          console.log('[LocationContext] Permission granted, getting location...');

          const getCurrentPositionPromise = (options) => {
            return new Promise((resolve, reject) => {
              Geolocation.getCurrentPosition(resolve, reject, options);
            });
          };

          const reverseGeocodeAsync = async (latitude, longitude) => {
            try {
              const geocodeResult = await GoogleMapsService.reverseGeocode(latitude, longitude);
              if (geocodeResult?.address) {
                return geocodeResult.address;
              }
            } catch (e) {
              console.warn('Reverse geocoding failed:', e.message);
            }
            return null;
          };

          // Strategy: Get FAST location first (cached/network), then refine with GPS
          const getLocationFast = async () => {
            console.log('[LocationContext] Getting fast location (low accuracy)...');

            try {
              // Step 1: Try LOW accuracy first - this uses cached/network location (INSTANT)
              const position = await getCurrentPositionPromise({
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000 // Accept 1 minute old cache
              });

              const { latitude, longitude } = position.coords;
              console.log('[LocationContext] Fast location obtained:', latitude, longitude);

              // Set location IMMEDIATELY with coordinates (before geocoding)
              setLocation({
                latitude,
                longitude,
                address: null // Will update after geocoding
              });

              // Geocode in parallel (don't block)
              reverseGeocodeAsync(latitude, longitude).then(address => {
                if (address) {
                  setLocation(prev => prev ? { ...prev, address } : { latitude, longitude, address });
                }
              });

              // Step 2: Get HIGH accuracy in background for better precision
              setTimeout(async () => {
                try {
                  const precisePosition = await getCurrentPositionPromise({
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000
                  });

                  const preciseLat = precisePosition.coords.latitude;
                  const preciseLng = precisePosition.coords.longitude;

                  // Only update if significantly different (> 50 meters)
                  const distance = Math.sqrt(
                    Math.pow(preciseLat - latitude, 2) +
                    Math.pow(preciseLng - longitude, 2)
                  ) * 111000; // rough meters conversion

                  if (distance > 50) {
                    console.log('[LocationContext] Updating with precise location, distance:', distance);
                    setLocation(prev => ({
                      ...prev,
                      latitude: preciseLat,
                      longitude: preciseLng
                    }));

                    // Re-geocode with precise location
                    const preciseAddress = await reverseGeocodeAsync(preciseLat, preciseLng);
                    if (preciseAddress) {
                      setLocation(prev => prev ? { ...prev, address: preciseAddress } : null);
                    }
                  }
                } catch (e) {
                  console.log('[LocationContext] High accuracy update skipped:', e.message);
                }
              }, 100); // Start high accuracy fetch immediately but don't block

              handleRequestPermission();
              return true;

            } catch (fastError) {
              console.warn('[LocationContext] Fast location failed:', fastError.message);

              // Fallback: Try high accuracy directly
              try {
                const position = await getCurrentPositionPromise({
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 10000
                });

                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude, address: null });

                const address = await reverseGeocodeAsync(latitude, longitude);
                setLocation({ latitude, longitude, address });

                handleRequestPermission();
                return true;
              } catch (e) {
                console.error('[LocationContext] All location attempts failed');
                handleRequestPermission();
                return false;
              }
            }
          };

          getLocationFast();
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

  // Trigger stable location update when currentLocation changes
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      updateStableLocationIfSignificant(currentLocation);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, updateStableLocationIfSignificant]);

  const contextValue = {
    ...currentLocation,
    updateDeliveryLocation,
    useDeviceLocation,
    isUsingDeliveryAddress: useDeliveryAddress,
    deliveryAddress: deliveryLocation?.address,
    // Stable coordinates for query hooks - only change on significant movement
    stableLatitude: stableLocation?.latitude ?? currentLocation?.latitude,
    stableLongitude: stableLocation?.longitude ?? currentLocation?.longitude,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};
