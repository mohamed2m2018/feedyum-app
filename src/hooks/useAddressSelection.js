import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAddresses, setSelectedAddress } from '../redux/actions/addressActions';
import { useLocation } from '../navigation/locationContext';

export const useAddressSelection = (onAddressSelect) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { addresses, selectedAddress, loading } = useSelector(state => state.address);
  const hasInitialized = useRef(false);

  // Load addresses once
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch(getAddresses());
    }
  }, [dispatch]);

  // Set initial address only once when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const primaryAddress = addresses.find(addr => addr.isPrimary) || addresses[0];
      
      dispatch(setSelectedAddress(primaryAddress));
      
      if (location?.updateDeliveryLocation) {
        location.updateDeliveryLocation(primaryAddress);
      }
      
      if (onAddressSelect && typeof onAddressSelect === 'function') {
        onAddressSelect(primaryAddress);
      }
    }
  }, [addresses.length, selectedAddress, dispatch, location?.updateDeliveryLocation, onAddressSelect]);

  return {
    addresses,
    selectedAddress,
    loading,
  };
};