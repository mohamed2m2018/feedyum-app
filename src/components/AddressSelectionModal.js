import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import ZText from './common/ZText';
import ZSafeAreaView from './common/ZSafeAreaView';
import strings from '../i18n/strings';
import { setCurrentLocation, deleteAddress, getAddresses } from '../redux/actions/addressActions';
import { StackNav } from '../navigation/NavigationKeys';
import { useLocation } from '../navigation/locationContext';

const { height } = Dimensions.get('window');

const AddressSelectionModal = ({ 
  visible, 
  onClose, 
  onAddressSelect, 
  addresses, 
  selectedAddress,
  onAddressUpdated // Callback to refresh addresses after edit/delete
}) => {
  const colors = useSelector(state => state.theme.theme);
  const { settingCurrentLocation, deletingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const location = useLocation();
  
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  // Refresh addresses when modal becomes visible
  useEffect(() => {
    if (visible && onAddressUpdated) {
      onAddressUpdated();
    }
  }, [visible, onAddressUpdated]);

  const handleEditAddress = (address) => {
    onClose(); // Close modal first
    navigation.navigate(StackNav.EditAddress, { 
      address,
      onAddressUpdated: () => {
        // Callback to refresh addresses after editing
        if (onAddressUpdated) {
          onAddressUpdated();
        }
      }
    });
  };

  const handleDeleteAddress = (addressId, label) => {
    Alert.alert(
      strings.deleteAddress,
      strings.deleteAddressConfirmation.replace('{label}', label),
      [
        {
          text: strings.cancel,
          style: 'cancel',
        },
        {
          text: strings.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('AddressSelectionModal: Deleting address with ID:', addressId);
              const result = await dispatch(deleteAddress(addressId));
              console.log('AddressSelectionModal: Delete result:', result);
              
              // Refresh addresses after deletion
              if (onAddressUpdated) {
                console.log('AddressSelectionModal: Calling onAddressUpdated callback');
                onAddressUpdated();
              }
              
              Alert.alert(strings.success || 'Success', 'Address deleted successfully');
            } catch (error) {
              console.error('AddressSelectionModal: Delete error:', error);
              Alert.alert(strings.error, error.message || strings.failedToDeleteAddress || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleCurrentLocation = async () => {
    setLoadingCurrentLocation(true);
    
    try {
      // Get current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const locationData = {
            lat: latitude.toString(),
            long: longitude.toString(),
            label: strings.currentLocation,
            formattedAddress: strings.currentLocation,
            nameLine: strings.currentLocation,
            isCurrentLocation: true
          };
          
          const response = await dispatch(setCurrentLocation(locationData));
          
          // Update location context with current location
          if (location?.updateDeliveryLocation && response?.payload) {
            location.updateDeliveryLocation(response.payload);
          }
          
          setLoadingCurrentLocation(false);
          onClose();
        },
        (error) => {
          setLoadingCurrentLocation(false);
          Alert.alert(
            strings.error,
            strings.locationPermissionDenied
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      setLoadingCurrentLocation(false);
      Alert.alert(strings.error, strings.failedToGetLocation);
    }
  };

  const handleMapSelection = () => {
    // Close the modal before navigating
    onClose();
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: async (address) => {
        console.log('AddressSelectionModal: New address added:', address);
        
        // Update location context with the new address
        if (location?.updateDeliveryLocation) {
          location.updateDeliveryLocation(address);
        }
        
        // Refresh addresses list to show the new address
        if (onAddressUpdated) {
          console.log('AddressSelectionModal: Refreshing addresses list');
          await onAddressUpdated();
        }
        
        // Small delay to ensure address list is updated
        setTimeout(() => {
          console.log('AddressSelectionModal: Selecting new address');
          onAddressSelect(address);
        }, 100);
      }
    });
  };

  const renderAddressItem = ({ item }) => {
    const isSelected = selectedAddress?._id === item._id;
    
    return (
      <TouchableOpacity
        style={[
          localStyles.addressItem,
          { 
            backgroundColor: colors.inputBg,
            borderColor: isSelected ? colors.primary : colors.borderColor
          }
        ]}
        onPress={() => {
          // Update location context with selected address
          if (location?.updateDeliveryLocation) {
            location.updateDeliveryLocation(item);
          }
          onAddressSelect(item);
        }}
      >
        <View style={localStyles.addressContent}>
          <View style={localStyles.addressIcon}>
            <MaterialIcons
              name={
                item.addressType === 'apartment' ? 'apartment' :
                item.addressType === 'office' ? 'business' : 'home'
              }
              size={moderateScale(20)}
              color={isSelected ? colors.primary : colors.grayScale5}
            />
          </View>
          
          <View style={localStyles.addressDetails}>
            <ZText 
              type="s16" 
              color={isSelected ? colors.primary : colors.textColor}
              style={localStyles.addressLabel}
            >
              {item.label}
            </ZText>
            
            {/* Building Details - Floor, Apartment */}
            {(item.buildingDetails?.floorNumber || item.buildingDetails?.apartmentNumber || item.buildingDetails?.buildingName) && (
              <ZText 
                type="s13" 
                color={colors.primary}
                style={localStyles.buildingText}
              >
                {[
                  item.buildingDetails?.buildingName,
                  item.buildingDetails?.floorNumber && `Floor ${item.buildingDetails.floorNumber}`,
                  item.buildingDetails?.apartmentNumber && `Apt ${item.buildingDetails.apartmentNumber}`
                ].filter(Boolean).join(' • ')}
              </ZText>
            )}
            
            <ZText 
              type="s14" 
              color={colors.grayScale6}
              numberOfLines={2}
              style={localStyles.addressText}
            >
              {item.streetDetails?.streetName || item.formattedAddress || item.nameLine}
              {item.streetDetails?.area && `, ${item.streetDetails.area}`}
            </ZText>
            
            {item.contactInfo?.phoneNumber && (
              <ZText type="s12" color={colors.grayScale5}>
                {item.contactInfo.countryCode} {item.contactInfo.phoneNumber}
              </ZText>
            )}
          </View>
          
          <View style={localStyles.rightSection}>
            {isSelected && (
              <Feather
                name="check-circle"
                size={moderateScale(20)}
                color={colors.primary}
              />
            )}
            
            {/* Action Buttons */}
            <View style={localStyles.actionButtons}>
              <TouchableOpacity
                style={localStyles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditAddress(item);
                }}
              >
                <Feather name="edit-2" size={moderateScale(16)} color={colors.grayScale6} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={localStyles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteAddress(item._id, item.label);
                }}
                disabled={deletingAddress}
              >
                <Feather 
                  name="trash-2" 
                  size={moderateScale(16)} 
                  color={colors.red} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ZSafeAreaView style={{ backgroundColor: colors.backgroundColor }}>
        <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
          {/* Header */}
          <View style={localStyles.header}>
            <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
              <Feather name="x" size={moderateScale(24)} color={colors.textColor} />
            </TouchableOpacity>
            <ZText type="B18" color={colors.textColor}>
              {strings.chooseDeliveryLocation}
            </ZText>
            <View style={localStyles.placeholder} />
          </View>

          {/* Action Buttons */}
          <View style={localStyles.topActionButtons}>
            <TouchableOpacity
              style={[localStyles.topActionButton, { backgroundColor: colors.primary }]}
              onPress={handleMapSelection}
            >
              <Feather name="map-pin" size={moderateScale(20)} color={colors.white} />
              <ZText type="s16" color={colors.white} style={localStyles.topActionButtonText}>
                {strings.deliverToDifferentLocation}
              </ZText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.topActionButton, 
                { 
                  backgroundColor: colors.inputBg,
                  opacity: loadingCurrentLocation ? 0.6 : 1
                }
              ]}
              onPress={handleCurrentLocation}
              disabled={loadingCurrentLocation || settingCurrentLocation}
            >
              <MaterialIcons 
                name="my-location" 
                size={moderateScale(20)} 
                color={colors.primary} 
              />
              <ZText type="s16" color={colors.primary} style={localStyles.topActionButtonText}>
                {loadingCurrentLocation || settingCurrentLocation 
                  ? strings.gettingLocation 
                  : strings.deliverToCurrentLocation
                }
              </ZText>
            </TouchableOpacity>
          </View>

          {/* Saved Addresses */}
          <View style={localStyles.savedAddressesSection}>
            <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
              {strings.savedAddresses}
            </ZText>
            
            {addresses.length === 0 ? (
              <View style={localStyles.emptyState}>
                <MaterialIcons 
                  name="location-off" 
                  size={moderateScale(48)} 
                  color={colors.grayScale4} 
                />
                <ZText type="s16" color={colors.grayScale5} style={localStyles.emptyText}>
                  {strings.noSavedAddresses}
                </ZText>
              </View>
            ) : (
              <FlatList
                data={addresses}
                renderItem={renderAddressItem}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.addressList}
              />
            )}
          </View>
        </View>
      </ZSafeAreaView>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  placeholder: {
    width: moderateScale(32),
  },
  topActionButtons: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
  },
  topActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  topActionButtonText: {
    marginLeft: moderateScale(12),
  },
  savedAddressesSection: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  sectionTitle: {
    marginBottom: moderateScale(16),
  },
  addressList: {
    paddingBottom: moderateScale(20),
  },
  addressItem: {
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
    borderWidth: 1,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  addressIcon: {
    marginRight: moderateScale(12),
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    marginBottom: moderateScale(4),
  },
  buildingText: {
    marginBottom: moderateScale(4),
    fontWeight: '600',
  },
  addressText: {
    marginBottom: moderateScale(4),
  },
  rightSection: {
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: moderateScale(8),
  },
  actionButton: {
    padding: moderateScale(6),
    marginLeft: moderateScale(4),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
});

export default AddressSelectionModal;