import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';
import strings from '../i18n/strings';
import AddressSelectionModal from './AddressSelectionModal';
import { getAddresses, setSelectedAddress } from '../redux/actions/addressActions';
import { useLocation } from '../navigation/locationContext';

const AddressDropdown = ({ onAddressSelect, style, compact = false }) => {
  const colors = useSelector(state => state.theme.theme);
  const { addresses, selectedAddress, loading } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const location = useLocation();

  const [modalVisible, setModalVisible] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const hasLoadedAddresses = useRef(false);
  const hasSetInitialAddress = useRef(false);

  // Load addresses only once
  useEffect(() => {
    if (!hasLoadedAddresses.current) {
      hasLoadedAddresses.current = true;
      dispatch(getAddresses());
    }
  }, []);

  // Set initial address only once when addresses are available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress && !hasSetInitialAddress.current) {
      hasSetInitialAddress.current = true;
      const primaryAddress = addresses.find(addr => addr.isPrimary) || addresses[0];

      // Use setTimeout to prevent synchronous state updates
      setTimeout(() => {
        dispatch(setSelectedAddress(primaryAddress));

        if (location?.updateDeliveryLocation) {
          location.updateDeliveryLocation(primaryAddress);
        }

        if (onAddressSelect && typeof onAddressSelect === 'function') {
          onAddressSelect(primaryAddress);
        }
      }, 0);
    }
  }, [addresses.length, selectedAddress]);

  // Sync selectedAddress to LocationContext on mount/reload
  // Handles case where Redux already has a persisted selectedAddress
  // but LocationContext was reset (e.g., app reload)
  const hasSyncedToLocation = useRef(false);
  useEffect(() => {
    if (selectedAddress && !hasSyncedToLocation.current && location?.updateDeliveryLocation) {
      hasSyncedToLocation.current = true;
      location.updateDeliveryLocation(selectedAddress);
    }
  }, [selectedAddress, location?.updateDeliveryLocation]);

  const handleAddressSelect = useCallback((address) => {
    dispatch(setSelectedAddress(address));

    if (location?.updateDeliveryLocation) {
      location.updateDeliveryLocation(address);
    }

    if (onAddressSelect && typeof onAddressSelect === 'function') {
      onAddressSelect(address);
    }
    setModalVisible(false);
  }, [dispatch, location?.updateDeliveryLocation, onAddressSelect]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setModalVisible(true);
  }, [animatedValue]);

  const getDisplayText = useCallback(() => {
    if (loading) return strings.loading;

    // If no address is selected (using device location), show the detected address if available
    if (!selectedAddress) {
      if (location?.address) {
        // Increase limit for better visibility, use ellipsis only for very long addresses
        const maxLength = compact ? 45 : 80;
        return location.address.length > maxLength
          ? `${location.address.substring(0, maxLength)}...`
          : location.address;
      }
      // While waiting for location, show loading indicator
      return '...';
    }

    const addressText = selectedAddress.formattedAddress || selectedAddress.nameLine || 'Address';
    // Increase limit for better visibility
    const maxLength = compact ? 45 : 80;
    return addressText.length > maxLength ? `${addressText.substring(0, maxLength)}...` : addressText;
  }, [loading, selectedAddress, compact, location?.address]);

  const getSubText = useCallback(() => {
    if (!selectedAddress) return '';
    return selectedAddress.label || '';
  }, [selectedAddress]);

  const getAddressIcon = useCallback(() => {
    if (!selectedAddress) return 'my-location';

    switch (selectedAddress.addressType) {
      case 'apartment':
        return 'apartment';
      case 'office':
        return 'business';
      default:
        return 'home';
    }
  }, [selectedAddress]);

  const animatedStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.95],
        }),
      },
    ],
  };

  if (compact) {
    return (
      <View style={style}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[
              localStyles.compactContainer,
              {
                backgroundColor: colors.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderColor: colors.primary + '30'
              }
            ]}
            onPress={handlePress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={getAddressIcon()}
              size={moderateScale(16)}
              color={colors.primary}
            />
            <View style={localStyles.compactTextContainer}>
              <ZText type="s12" color={colors.textColor} numberOfLines={1}>
                {getDisplayText()}
              </ZText>
            </View>
            <Feather
              name="chevron-down"
              size={moderateScale(14)}
              color={colors.grayScale5}
            />
          </TouchableOpacity>
        </Animated.View>

        <AddressSelectionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddressSelect={handleAddressSelect}
          addresses={addresses}
          selectedAddress={selectedAddress}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={[
            colors.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            colors.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          ]}
          style={localStyles.gradientContainer}
        >
          <TouchableOpacity
            style={[
              localStyles.dropdownContainer,
              {
                backgroundColor: 'transparent',
                borderColor: colors.primary + '20'
              }
            ]}
            onPress={handlePress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={localStyles.contentContainer}>
              <View style={localStyles.iconContainer}>
                <MaterialIcons
                  name={getAddressIcon()}
                  size={moderateScale(20)}
                  color={colors.primary}
                />
              </View>

              <View style={localStyles.textContainer}>
                <View style={localStyles.headerRow}>
                  <ZText type="s12" color={colors.grayScale5}>
                    {strings.deliverTo}
                  </ZText>
                  {selectedAddress?.isPrimary && (
                    <View style={[localStyles.primaryBadge, { backgroundColor: colors.primary }]}>
                      <ZText type="s10" color={colors.white}>
                        {strings.primary}
                      </ZText>
                    </View>
                  )}
                </View>

                <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                  {getDisplayText()}
                </ZText>

                {getSubText() && (
                  <ZText type="s12" color={colors.grayScale5} numberOfLines={1}>
                    {getSubText()}
                  </ZText>
                )}
              </View>

              <View style={localStyles.chevronContainer}>
                <Feather
                  name="chevron-down"
                  size={moderateScale(18)}
                  color={colors.primary}
                />
              </View>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <AddressSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddressSelect={handleAddressSelect}
        addresses={addresses}
        selectedAddress={selectedAddress}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  gradientContainer: {
    borderRadius: moderateScale(12),
    marginHorizontal: moderateScale(6),
    marginVertical: moderateScale(6),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    maxHeight: moderateScale(60),
    maxWidth: '98%',
    alignSelf: 'flex-start',
  },
  dropdownContainer: {
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: moderateScale(12),
    padding: moderateScale(2),
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(2),
  },
  primaryBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  chevronContainer: {
    marginLeft: moderateScale(8),
    padding: moderateScale(2),
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    minHeight: moderateScale(36),
    maxHeight: moderateScale(40),
    width: '100%', // Use full width of parent container
  },
  compactTextContainer: {
    flex: 1,
    marginHorizontal: moderateScale(8),
  },
});

export default React.memo(AddressDropdown);