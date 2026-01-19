import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { showErrorToast } from '../utils/toast';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from 'react-query';
import FreeAddressSearch from './FreeAddressSearch';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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
import { useLocation } from '../navigation/locationContext';
import GoogleMapsService from '../services/GoogleMapsService';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;

const MapLocationPicker = () => {
  const colors = useSelector(state => state.theme.theme);
  const { addingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const location = useLocation();
  const mapRef = useRef(null);

  const { onLocationSelect, initialLocation, editMode, addressToEdit } = route.params || {};

  // Fetch user data using the same pattern as other components
  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const user = data?.data?.user;

  // Initial map region - use current location or Cairo default
  const initialRegion = {
    latitude: initialLocation?.latitude || location?.latitude || 30.0444,
    longitude: initialLocation?.longitude || location?.longitude || 31.2357,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [loading, setLoading] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    label: editMode ? addressToEdit?.label || 'Home' : 'Home',
    addressType: editMode ? addressToEdit?.addressType || 'house' : 'house',
    buildingName: editMode ? addressToEdit?.buildingDetails?.buildingName || '' : '',
    apartmentNumber: editMode ? addressToEdit?.buildingDetails?.apartmentNumber || '' : '',
    floorNumber: editMode ? addressToEdit?.buildingDetails?.floorNumber || '' : '',
    area: editMode ? addressToEdit?.streetDetails?.area || '' : '',
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

  // Reverse geocode marker position
  const reverseGeocodePosition = useCallback(async (latitude, longitude) => {
    setReverseGeocoding(true);
    try {
      const result = await GoogleMapsService.reverseGeocode(latitude, longitude);
      if (result?.address) {
        setSelectedLocation({
          description: result.address,
          lat: latitude.toString(),
          lng: longitude.toString(),
          formattedAddress: result.address
        });
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  // Handle map drag end
  const handleMapDragEnd = useCallback((e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    reverseGeocodePosition(latitude, longitude);
  }, [reverseGeocodePosition]);

  // Handle map press
  const handleMapPress = useCallback((e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    reverseGeocodePosition(latitude, longitude);
  }, [reverseGeocodePosition]);

  // Handle location select from search
  const handleLocationSelect = (data, details = null) => {
    if (details) {
      const lat = details.geometry.location.lat;
      const lng = details.geometry.location.lng;

      setSelectedLocation({
        description: data.description,
        lat: lat.toString(),
        lng: lng.toString(),
        formattedAddress: data.description
      });

      setMarkerPosition({ latitude: lat, longitude: lng });

      // Animate map to new location
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);

      setShowAddressForm(true);
    }
  };

  // Center map on current GPS location
  const handleCenterOnCurrentLocation = useCallback(() => {
    if (location?.latitude && location?.longitude) {
      const lat = location.latitude;
      const lng = location.longitude;

      setMarkerPosition({ latitude: lat, longitude: lng });

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);

      reverseGeocodePosition(lat, lng);
    }
  }, [location, reverseGeocodePosition]);

  const handleAddressDetailChange = (field, value) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      showErrorToast(strings.error, strings.pleaseSelectLocation);
      return;
    }

    // Validate required fields
    if (!addressDetails.label.trim()) {
      showErrorToast(strings.error, strings.addressLabelRequired);
      return;
    }
    if (!addressDetails.apartmentNumber.trim()) {
      showErrorToast(strings.error, strings.apartmentRequired);
      return;
    }
    if (!addressDetails.floorNumber.trim()) {
      showErrorToast(strings.error, strings.floorRequired);
      return;
    }
    if (!addressDetails.area.trim()) {
      showErrorToast(strings.error, strings.areaRequired);
      return;
    }
    if (!addressDetails.phoneNumber.trim()) {
      showErrorToast(strings.error, strings.phoneNumberRequired);
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
          showErrorToast(strings.error, 'Address was saved but response is invalid');
        }
      }

      navigation.goBack();
    } catch (error) {
      showErrorToast(strings.error, error.message || strings.failedToSaveLocation);
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

        {/* Search Bar */}
        <View style={localStyles.searchContainer}>
          <FreeAddressSearch
            placeholder={strings.searchLocationPlaceholder}
            onLocationSelect={handleLocationSelect}
            onClear={() => {
              setSelectedLocation(null);
              setShowAddressForm(false);
            }}
            autoFocus={false}
          />
        </View>

        {/* Interactive Map */}
        <View style={localStyles.mapWrapper}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={localStyles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={handleMapDragEnd}
            >
              <View style={[localStyles.customMarker, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="restaurant" size={moderateScale(20)} color={colors.white} />
              </View>
            </Marker>
          </MapView>

          {/* Center on GPS button */}
          <TouchableOpacity
            style={[localStyles.gpsButton, { backgroundColor: colors.white }]}
            onPress={handleCenterOnCurrentLocation}
          >
            <MaterialIcons name="my-location" size={moderateScale(22)} color={colors.primary} />
          </TouchableOpacity>

          {/* Reverse geocoding indicator */}
          {reverseGeocoding && (
            <View style={localStyles.geocodingIndicator}>
              <ZLoader size="small" />
            </View>
          )}
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
          <KeyboardAwareScrollView
            style={localStyles.formContainer}
            contentContainerStyle={localStyles.formContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            {/* Address Label */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.addressLabel} *
              </ZText>
              <ZInput
                placeHolder={strings.addressLabelPlaceholder}
                _value={addressDetails.label}
                toGetTextFieldValue={(value) => handleAddressDetailChange('label', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
            </View>

            {/* Building Details */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.buildingDetails}
              </ZText>
              <ZInput
                placeHolder={strings.buildingNamePlaceholder}
                _value={addressDetails.buildingName}
                toGetTextFieldValue={(value) => handleAddressDetailChange('buildingName', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
              <View style={localStyles.row}>
                <View style={localStyles.halfWidth}>
                  <ZInput
                    placeHolder={strings.apartmentNumberPlaceholder}
                    _value={addressDetails.apartmentNumber}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('apartmentNumber', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
                <View style={localStyles.halfWidth}>
                  <ZInput
                    placeHolder={strings.floorNumberPlaceholder}
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
                {strings.areaDetails}
              </ZText>
              <ZInput
                placeHolder={strings.areaPlaceholder}
                _value={addressDetails.area}
                toGetTextFieldValue={(value) => handleAddressDetailChange('area', value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
            </View>

            {/* Contact Info */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.contactInfo}
              </ZText>
              <View style={localStyles.phoneContainer}>
                <View style={localStyles.countryCodeContainer}>
                  <ZInput
                    placeHolder={strings.phoneCodePlaceholder}
                    _value={addressDetails.countryCode}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('countryCode', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
                <View style={localStyles.phoneNumberContainer}>
                  <ZInput
                    placeHolder={strings.phoneNumberPlaceholder}
                    _value={addressDetails.phoneNumber}
                    keyBoardType="phone-pad"
                    toGetTextFieldValue={(value) => handleAddressDetailChange('phoneNumber', value)}
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
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
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: moderateScale(4),
  },
  placeholder: {
    width: moderateScale(32),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    flexShrink: 0,
  },
  mapWrapper: {
    height: MAP_HEIGHT,
    marginHorizontal: moderateScale(16),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gpsButton: {
    position: 'absolute',
    bottom: moderateScale(12),
    right: moderateScale(12),
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  geocodingIndicator: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: moderateScale(20),
    padding: moderateScale(8),
  },
  selectedLocationContainer: {
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(12),
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
    padding: moderateScale(14),
  },
  locationIcon: {
    marginRight: moderateScale(12),
  },
  locationTextContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(24),
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
    marginTop: moderateScale(12),
  },
  formContent: {
    paddingBottom: moderateScale(20),
  },
  section: {
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    marginBottom: moderateScale(10),
  },
  inputContainer: {
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
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