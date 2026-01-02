import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from 'react-query';
import FreeAddressSearch from './FreeAddressSearch';
import ZInput from './common/ZInput';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import ZText from './common/ZText';
import ZSafeAreaView from './common/ZSafeAreaView';
import ZLoader from './common/ZLoader';
import strings from '../i18n/strings';
import addressService from '../services/addressService';
import { addAddress } from '../redux/actions/addressActions';
import request from '../api/request';
const { width, height } = Dimensions.get('window');

const MapLocationPicker = () => {
  const colors = useSelector(state => state.theme.theme);
  const { addingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { onLocationSelect, initialLocation } = route.params || {};
  
  // Fetch user data using the same pattern as other components
  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const user = data?.data?.user;
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    label: 'Home',
    addressType: 'house',
    buildingName: '',
    apartmentNumber: '',
    floorNumber: '',
    area: '',
    phoneNumber: '',
    countryCode: '+20',
    additionalInstructions: ''
  });

  // Update phone number when user data is loaded
  useEffect(() => {
    if (user?.phone && !addressDetails.phoneNumber) {
      setAddressDetails(prev => ({
        ...prev,
        phoneNumber: user.phone
      }));
    }
  }, [user?.phone, addressDetails.phoneNumber]);



  const handleLocationSelect = (data, details = null) => {
    if (details) {
      setSelectedLocation({
        description: data.description,
        lat: details.geometry.location.lat.toString(),
        lng: details.geometry.location.lng.toString(),
        formattedAddress: data.description
      });
      setShowAddressForm(true);
    }
  };

  const handleAddressDetailChange = (field, value) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert(strings.error, strings.pleaseSelectLocation);
      return;
    }

    // Validate required fields
    if (!addressDetails.label.trim()) {
      Alert.alert(strings.error, 'Address label is required');
      return;
    }
    if (!addressDetails.apartmentNumber.trim()) {
      Alert.alert(strings.error, 'Apartment number is required');
      return;
    }
    if (!addressDetails.floorNumber.trim()) {
      Alert.alert(strings.error, 'Floor number is required');
      return;
    }
    if (!addressDetails.area.trim()) {
      Alert.alert(strings.error, 'Area is required');
      return;
    }
    if (!addressDetails.phoneNumber.trim()) {
      Alert.alert(strings.error, 'Phone number is required');
      return;
    }

    setLoading(true);

    const locationData = {
      lat: selectedLocation.lat,
      long: selectedLocation.lng,
      label: addressDetails.label,
      formattedAddress: selectedLocation.formattedAddress,
      nameLine: selectedLocation.formattedAddress,
      addressType: addressDetails.addressType,
      streetDetails: {
        streetName: selectedLocation.formattedAddress,
        area: addressDetails.area,
        neighborhood: ''
      },
      buildingDetails: {
        buildingName: addressDetails.buildingName,
        apartmentNumber: addressDetails.apartmentNumber,
        floorNumber: addressDetails.floorNumber
      },
      contactInfo: {
        phoneNumber: addressDetails.phoneNumber,
        countryCode: addressDetails.countryCode
      },
      additionalInstructions: addressDetails.additionalInstructions,
      isPrimary: true // Set new address as primary by default
    };

    try {
const response = await dispatch(addAddress(locationData));
if (onLocationSelect) {
        if (response && response.payload) {
onLocationSelect(response.payload);
        } else {
Alert.alert(strings.error, 'Address was saved but response is invalid');
        }
      }
      
      navigation.goBack();
    } catch (error) {
Alert.alert(strings.error, error.message || strings.failedToSaveLocation);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ZSafeAreaView style={{ backgroundColor: colors.backgroundColor }}>
      <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
        {/* Header */}
        <View style={[localStyles.header, { backgroundColor: colors.backgroundColor }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={localStyles.backButton}
          >
            <Feather name="arrow-left" size={moderateScale(24)} color={colors.textColor} />
          </TouchableOpacity>
          <ZText type="B18" color={colors.textColor}>
            {strings.selectLocation}
          </ZText>
          <View style={localStyles.placeholder} />
        </View>

        {/* Search Instructions */}
        <View style={localStyles.instructionsContainer}>
          <MaterialIcons 
            name="search" 
            size={moderateScale(24)} 
            color={colors.grayScale5} 
          />
          <ZText type="s16" color={colors.grayScale6} style={localStyles.instructionsText}>
            {strings.searchForLocation}
          </ZText>
        </View>

        {/* Free Address Search */}
        <View style={localStyles.searchContainer}>
          <FreeAddressSearch
            placeholder={strings.searchLocationPlaceholder}
            onLocationSelect={handleLocationSelect}
            autoFocus={true}
          />
        </View>

        {/* Selected Location Display */}
        {selectedLocation && (
          <View style={[localStyles.selectedLocationContainer, { backgroundColor: colors.inputBg }]}>
            <View style={localStyles.selectedLocationContent}>
              <Feather 
                name="map-pin" 
                size={moderateScale(20)} 
                color={colors.primary} 
                style={localStyles.locationIcon}
              />
              <View style={localStyles.locationTextContainer}>
                <ZText type="B14" color={colors.textColor}>
                  {strings.selectedLocation}
                </ZText>
                <ZText type="s14" color={colors.grayScale6} numberOfLines={2}>
                  {selectedLocation.formattedAddress}
                </ZText>
              </View>
              <Feather 
                name="check-circle" 
                size={moderateScale(20)} 
                color={colors.primary} 
              />
            </View>
          </View>
        )}

        {/* Address Details Form */}
        {showAddressForm && (
          <ScrollView 
            style={localStyles.formContainer}
            contentContainerStyle={localStyles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Address Label */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.addressLabel || 'Address Label'} *
              </ZText>
              <ZInput
                placeHolder="Home, Work, Friend's Place"
                _value={addressDetails.label}
                toGetTextFieldValue={(value) => handleAddressDetailChange('label', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
            </View>

            {/* Building Details */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.buildingDetails || 'Building Details'}
              </ZText>
              <ZInput
                placeHolder="Building Name"
                _value={addressDetails.buildingName}
                toGetTextFieldValue={(value) => handleAddressDetailChange('buildingName', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
              <View style={localStyles.row}>
                <View style={localStyles.halfWidth}>
                  <ZInput
                    placeHolder="Apartment Number *"
                    _value={addressDetails.apartmentNumber}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('apartmentNumber', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
                <View style={localStyles.halfWidth}>
                  <ZInput
                    placeHolder="Floor Number *"
                    _value={addressDetails.floorNumber}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('floorNumber', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
              </View>
            </View>

            {/* Area Details */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.areaDetails || 'Area Details'}
              </ZText>
              <ZInput
                placeHolder="Area *"
                _value={addressDetails.area}
                toGetTextFieldValue={(value) => handleAddressDetailChange('area', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
            </View>

            {/* Contact Info */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.contactInfo || 'Contact Info'}
              </ZText>
              <View style={localStyles.phoneContainer}>
                <View style={localStyles.countryCodeContainer}>
                  <ZInput
                    placeHolder="+20"
                    _value={addressDetails.countryCode}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('countryCode', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
                <View style={localStyles.phoneNumberContainer}>
                  <ZInput
                    placeHolder="Phone Number *"
                    _value={addressDetails.phoneNumber}
                    keyBoardType="phone-pad"
                    toGetTextFieldValue={(value) => handleAddressDetailChange('phoneNumber', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Confirm Button */}
        <View style={localStyles.buttonContainer}>
          <TouchableOpacity
            style={[
              localStyles.confirmButton,
              { 
                backgroundColor: colors.primary,
                opacity: (loading || addingAddress || !selectedLocation) ? 0.6 : 1
              }
            ]}
            onPress={handleConfirmLocation}
            disabled={loading || addingAddress || !selectedLocation}
          >
            {(loading || addingAddress) ? (
              <ZLoader size="small" color={colors.white} />
            ) : (
              <ZText type="B16" color={colors.white}>
                {strings.confirmLocation}
              </ZText>
            )}
          </TouchableOpacity>
        </View>
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
  placeholder: {
    width: moderateScale(32),
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(20),
  },
  instructionsText: {
    marginLeft: moderateScale(12),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    flexShrink: 0,
  },
  selectedLocationContainer: {
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  locationIcon: {
    marginRight: moderateScale(12),
  },
  locationTextContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  confirmButton: {
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
  },
  formContent: {
    paddingBottom: moderateScale(20),
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  inputContainer: {
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  phoneContainer: {
    flexDirection: 'row',
  },
  countryCodeContainer: {
    width: moderateScale(80),
    marginRight: moderateScale(12),
  },
  phoneNumberContainer: {
    flex: 1,
  },
});

export default MapLocationPicker;