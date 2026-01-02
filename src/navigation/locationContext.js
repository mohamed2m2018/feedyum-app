import React, {createContext, useContext, useEffect, useState} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {Linking, Platform} from 'react-native';
import {
  PERMISSIONS,
  request,
  requestNotifications,
} from 'react-native-permissions'; // Import react-native-permissions
import {Toast} from 'react-native-alert-notification';

const LocationContext = createContext();

export const useLocation = () => {
  return useContext(LocationContext);
};

export const LocationProvider = ({children}) => {
  const [location, setLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [useDeliveryAddress, setUseDeliveryAddress] = useState(false);

  const handleRequestPermission = () => {
    if (Platform.OS === 'android') {
      requestNotifications(['alert', 'sound']).then(({status}) => {
        if (status === 'blocked' || status === 'denied') {
          setTimeout(() => {
            Toast.show({
              textBody:
                "You didn't grant notifications permission, You will be directed to settings",
              onPress: () => Linking.openSettings(),
            });
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
              handleRequestPermission();
            },
            error => {
handleRequestPermission();
            },
            {enableHighAccuracy: true, timeout: 60000},
          );
        } else {
handleRequestPermission();
        }
      } catch (err) {
}
    };

    requestLocationPermission();
  }, []);

  // Function to update delivery address location
  const updateDeliveryLocation = (address) => {
    if (address?.location?.lat && address?.location?.long) {
      const newDeliveryLocation = {
        latitude: parseFloat(address.location.lat),
        longitude: parseFloat(address.location.long),
        address: address
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
