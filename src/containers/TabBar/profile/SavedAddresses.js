import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../../../common/constants';
import { styles } from '../../../themes';
import ZText from '../../../components/common/ZText';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZLoader from '../../../components/common/ZLoader';
import strings from '../../../i18n/strings';
import { getAddresses, deleteAddress } from '../../../redux/actions/addressActions';
import { StackNav } from '../../../navigation/NavigationKeys';

const SavedAddresses = () => {
  const colors = useSelector(state => state.theme.theme);
  const { addresses, loading, deletingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(getAddresses());
  }, [dispatch]);

  // Refresh addresses when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      dispatch(getAddresses());
    }, [dispatch])
  );

  const handleEditAddress = (address) => {
    navigation.navigate(StackNav.EditAddress, { 
      address,
      onAddressUpdated: () => {
        // Refresh addresses after editing
        dispatch(getAddresses());
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
const result = await dispatch(deleteAddress(addressId));
// The deleteAddress action already calls getAddresses(), but let's be explicit
dispatch(getAddresses());
              
              Alert.alert(strings.success || 'Success', 'Address deleted successfully');
            } catch (error) {
Alert.alert(strings.error, error.message || strings.failedToDeleteAddress || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleAddNewAddress = () => {
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: () => {
        // Refresh addresses after adding new one
        dispatch(getAddresses());
      }
    });
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'apartment':
        return 'apartment';
      case 'office':
        return 'business';
      default:
        return 'home';
    }
  };

  const formatAddress = (address) => {
    const parts = [];
    
    if (address.buildingDetails?.buildingName) {
      parts.push(address.buildingDetails.buildingName);
    }
    
    if (address.buildingDetails?.apartmentNumber) {
      parts.push(`Apt ${address.buildingDetails.apartmentNumber}`);
    }
    
    if (address.streetDetails?.streetName) {
      parts.push(address.streetDetails.streetName);
    } else if (address.formattedAddress) {
      parts.push(address.formattedAddress);
    } else if (address.nameLine) {
      parts.push(address.nameLine);
    }
    
    if (address.streetDetails?.area) {
      parts.push(address.streetDetails.area);
    }
    
    return parts.join(', ');
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[localStyles.addressItem, { backgroundColor: colors.inputBg }]}
      onPress={() => handleEditAddress(item)}
    >
      <View style={localStyles.addressContent}>
        <View style={localStyles.addressIcon}>
          <MaterialIcons
            name={getAddressTypeIcon(item.addressType)}
            size={moderateScale(24)}
            color={colors.primary}
          />
        </View>
        
        <View style={localStyles.addressDetails}>
          <View style={localStyles.addressHeader}>
            <ZText type="B16" color={colors.textColor}>
              {item.label}
            </ZText>
            {item.isPrimary && (
              <View style={[localStyles.primaryBadge, { backgroundColor: colors.primary }]}>
                <ZText type="s10" color={colors.white}>
                  {strings.primary}
                </ZText>
              </View>
            )}
          </View>
          
          <ZText 
            type="s14" 
            color={colors.grayScale6}
            numberOfLines={2}
            style={localStyles.addressText}
          >
            {formatAddress(item)}
          </ZText>
          
          {item.contactInfo?.phoneNumber && (
            <ZText type="s12" color={colors.grayScale5} style={localStyles.phoneText}>
              {item.contactInfo.countryCode} {item.contactInfo.phoneNumber}
            </ZText>
          )}
        </View>
        
        <View style={localStyles.actionButtons}>
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => handleEditAddress(item)}
          >
            <Feather name="edit-2" size={moderateScale(18)} color={colors.grayScale5} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => handleDeleteAddress(item._id, item.label)}
            disabled={deletingAddress}
          >
            <Feather 
              name="trash-2" 
              size={moderateScale(18)} 
              color={colors.white} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={localStyles.emptyState}>
      <MaterialIcons 
        name="location-off" 
        size={moderateScale(64)} 
        color={colors.grayScale4} 
      />
      <ZText type="B18" color={colors.grayScale5} style={localStyles.emptyTitle}>
        {strings.noSavedAddresses}
      </ZText>
      <ZText type="s14" color={colors.grayScale5} style={localStyles.emptySubtitle}>
        {strings.addFirstAddress}
      </ZText>
      <TouchableOpacity
        style={[localStyles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddNewAddress}
      >
        <ZText type="B16" color={colors.white}>
          {strings.addNewAddress}
        </ZText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ZSafeAreaView style={{ backgroundColor: colors.backgroundColor }}>
      <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
        {/* Header */}
        <View style={localStyles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={localStyles.backButton}
          >
            <Feather name="arrow-left" size={moderateScale(24)} color={colors.textColor} />
          </TouchableOpacity>
          <ZText type="B20" color={colors.textColor}>
            {strings.savedAddresses}
          </ZText>
          <TouchableOpacity 
            onPress={handleAddNewAddress}
            style={localStyles.addIconButton}
          >
            <Feather name="plus" size={moderateScale(24)} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <ZLoader />
        ) : addresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={localStyles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ZSafeAreaView>
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
  backButton: {
    padding: moderateScale(4),
  },
  addIconButton: {
    padding: moderateScale(4),
  },
  listContainer: {
    padding: moderateScale(16),
  },
  addressItem: {
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(16),
  },
  addressIcon: {
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  addressDetails: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  primaryBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(8),
  },
  buildingDetailsText: {
    marginBottom: moderateScale(2),
    fontWeight: '500',
  },
  addressText: {
    marginBottom: moderateScale(4),
  },
  phoneText: {
    marginTop: moderateScale(4),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(4),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: moderateScale(32),
  },
  addButton: {
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
  },
});

export default SavedAddresses;