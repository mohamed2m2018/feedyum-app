import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { showErrorToast } from '../utils/toast';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from 'react-query';
import FreeAddressSearch from './FreeAddressSearch';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Slider from '@react-native-community/slider';

import ZInput from './common/ZInput';
import ZPhoneInput from './common/ZPhoneInput';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import ZText from './common/ZText';
import ZSafeAreaView from './common/ZSafeAreaView';
import ZLoader from './common/ZLoader';
import strings from '../i18n/strings';
import addressService from '../services/addressService';
import { addAddress, editAddress } from '../redux/actions/addressActions';
import request from '../api/request';
import { useLocation } from '../navigation/locationContext';
import GoogleMapsService from '../services/GoogleMapsService';
import branchService from '../api/branchService';

const { width, height } = Dimensions.get('window');



const MapLocationPicker = () => {
  const colors = useSelector(state => state.theme.theme);
  const { addingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const location = useLocation();
  const mapRef = useRef(null);
  const phoneInputRef = useRef(null);

  const { onLocationSelect, initialLocation, editMode, addressToEdit, isChefBranch } = route.params || {};

  // Fetch user data using the same pattern as other components
  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const user = data?.data?.user;

  // Initial map region - prioritize GPS location, then initialLocation, then Cairo default
  const initialRegion = useMemo(() => ({
    latitude: location?.latitude || initialLocation?.latitude || 30.0444,
    longitude: location?.longitude || initialLocation?.longitude || 31.2357,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  }), []);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [loading, setLoading] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false); // Track if user clicked Save Location
  const [initialGeocodeDone, setInitialGeocodeDone] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    label: editMode ? addressToEdit?.label || (isChefBranch ? strings.branch || 'Branch' : 'Home') : (isChefBranch ? strings.branch || 'Branch' : 'Home'),
    addressType: editMode ? addressToEdit?.addressType || (isChefBranch ? 'business' : 'house') : (isChefBranch ? 'business' : 'house'),
    buildingName: editMode ? addressToEdit?.buildingDetails?.buildingName || '' : '',
    apartmentNumber: editMode ? addressToEdit?.buildingDetails?.apartmentNumber || '' : '',
    floorNumber: editMode ? addressToEdit?.buildingDetails?.floorNumber || '' : '',
    phoneNumber: editMode ? addressToEdit?.contactInfo?.phoneNumber || '' : '',
    countryCode: editMode ? addressToEdit?.contactInfo?.countryCode || '+20' : '+20',
    additionalInstructions: ''
  });
  const [isPhoneValid, setIsPhoneValid] = useState(editMode ? true : false);

  // Chef branch specific state
  const [deliveryRadius, setDeliveryRadius] = useState(20); // Default 20km
  const [branchName, setBranchName] = useState('');
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);

  // Initialize state for edit mode - show form instantly with existing data
  useEffect(() => {
    if (editMode && addressToEdit) {
      // Set selected location from existing address
      const editLat = addressToEdit.location?.lat || addressToEdit.lat;
      const editLng = addressToEdit.location?.long || addressToEdit.long || addressToEdit.lng;

      if (editLat && editLng) {
        setSelectedLocation({
          description: addressToEdit.formattedAddress || addressToEdit.nameLine || '',
          lat: editLat.toString(),
          lng: editLng.toString(),
          formattedAddress: addressToEdit.formattedAddress || addressToEdit.nameLine || '',
          area: addressToEdit.streetDetails?.area || ''
        });
        setMarkerPosition({
          latitude: parseFloat(editLat),
          longitude: parseFloat(editLng)
        });
      }

      // Show form instantly in edit mode
      setShowAddressForm(true);
      setLocationSaved(true);
    }
  }, [editMode, addressToEdit]);

  // Update phone number when user data is loaded
  useEffect(() => {
    if (user?.phone && !addressDetails.phoneNumber) {
      setAddressDetails(prev => ({
        ...prev,
        phoneNumber: user.phone
      }));
    }
  }, [user?.phone, addressDetails.phoneNumber]);

  // Initial GPS centering effect - run once when location becomes available
  useEffect(() => {
    if (location?.latitude && location?.longitude && !initialGeocodeDone) {
      setInitialGeocodeDone(true);

      // Set marker to GPS location
      const newPos = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setMarkerPosition(newPos);

      // Do initial reverse geocode
      reverseGeocodePositionSilent(location.latitude, location.longitude);
    }
  }, [location?.latitude, location?.longitude, initialGeocodeDone]);

  // Silent reverse geocode - doesn't show address form automatically
  const reverseGeocodePositionSilent = useCallback(async (latitude, longitude) => {
    setReverseGeocoding(true);
    try {
      const result = await GoogleMapsService.reverseGeocode(latitude, longitude);
      if (result?.address) {
        setSelectedLocation({
          description: result.address,
          lat: latitude.toString(),
          lng: longitude.toString(),
          formattedAddress: result.address,
          // Auto-extract area from geocode response
          area: result.addressComponents?.area || result.addressComponents?.city || ''
        });
        // Do NOT show address form here - wait for Save Location button
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  // Reverse geocode marker position (called on map interactions)
  const reverseGeocodePosition = useCallback(async (latitude, longitude) => {
    setReverseGeocoding(true);
    try {
      const result = await GoogleMapsService.reverseGeocode(latitude, longitude);
      if (result?.address) {
        setSelectedLocation({
          description: result.address,
          lat: latitude.toString(),
          lng: longitude.toString(),
          formattedAddress: result.address,
          // Auto-extract area from geocode response
          area: result.addressComponents?.area || result.addressComponents?.city || ''
        });
        // Reset locationSaved when user moves pin
        setLocationSaved(false);
        setShowAddressForm(false);
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
  const handleLocationSelect = useCallback((data, details = null) => {
    if (details) {
      const lat = details.geometry.location.lat;
      const lng = details.geometry.location.lng;

      // Extract area from Google Places address_components if available
      let extractedArea = '';
      if (details.address_components) {
        for (const component of details.address_components) {
          if (component.types?.includes('sublocality') || component.types?.includes('neighborhood')) {
            extractedArea = component.long_name;
            break;
          } else if (component.types?.includes('locality') || component.types?.includes('administrative_area_level_2')) {
            extractedArea = extractedArea || component.long_name;
          }
        }
      }

      setSelectedLocation({
        description: data.description,
        lat: lat.toString(),
        lng: lng.toString(),
        formattedAddress: data.description,
        area: extractedArea
      });

      setMarkerPosition({ latitude: lat, longitude: lng });

      // Center map on the selected location
      mapRef.current?.setCamera({
        center: { latitude: lat, longitude: lng },
        zoom: 17,
      });

      // If no area extracted from search, trigger reverse geocode to get it
      if (!extractedArea) {
        reverseGeocodePositionSilent(lat, lng);
      }

      // Reset save state - user needs to click Save Location
      setLocationSaved(false);
      setShowAddressForm(false);
    }
  }, [reverseGeocodePositionSilent]);

  // Center map on current GPS location
  const handleCenterOnCurrentLocation = useCallback(() => {
    if (location?.latitude && location?.longitude) {
      const lat = location.latitude;
      const lng = location.longitude;

      setMarkerPosition({ latitude: lat, longitude: lng });

      // Use silent geocode - don't auto-show form
      reverseGeocodePositionSilent(lat, lng);
      setLocationSaved(false);
      setShowAddressForm(false);
    }
  }, [location, reverseGeocodePositionSilent]);

  // Fetch coverage areas when radius changes
  const fetchCoverageAreas = useCallback(async (lat, lng, radius) => {
    if (!lat || !lng) return;

    setLoadingAreas(true);
    try {
      const response = await branchService.getCoverageAreas(lat, lng, radius);
      if (response?.success && response.areas) {
        setCoverageAreas(response.areas);
      }
    } catch (error) {
      console.error('Error fetching coverage areas:', error);
      setCoverageAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  // Debounced radius change handler
  const handleRadiusChange = useCallback((value) => {
    setDeliveryRadius(value);
  }, []);

  // Fetch areas when radius changes (with debounce effect)
  useEffect(() => {
    if (showBranchForm && selectedLocation?.lat && selectedLocation?.lng) {
      const timeoutId = setTimeout(() => {
        fetchCoverageAreas(selectedLocation.lat, selectedLocation.lng, deliveryRadius);
      }, 500); // Debounce 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [deliveryRadius, showBranchForm, selectedLocation, fetchCoverageAreas]);

  // Handle Save Location button press
  const handleSaveLocation = useCallback(() => {
    if (selectedLocation) {
      // For chef branches, show the branch form
      if (isChefBranch) {
        setShowBranchForm(true);
        setLocationSaved(true);
        // Fetch initial coverage areas
        fetchCoverageAreas(selectedLocation.lat, selectedLocation.lng, deliveryRadius);
        return;
      }
      // For regular users, show address form
      setLocationSaved(true);
      setShowAddressForm(true);
    }
  }, [selectedLocation, isChefBranch, fetchCoverageAreas, deliveryRadius]);

  // Handle branch confirmation
  const handleConfirmBranch = useCallback(() => {
    if (!selectedLocation) {
      showErrorToast(strings.error, strings.pleaseSelectLocation);
      return;
    }

    const locationData = {
      lat: selectedLocation.lat,
      latitude: selectedLocation.lat,
      long: selectedLocation.lng,
      longitude: selectedLocation.lng,
      formattedAddress: selectedLocation.formattedAddress,
      address: selectedLocation.formattedAddress,
      description: selectedLocation.formattedAddress,
      branchName: branchName.trim() || `${selectedLocation.area || 'New'} Branch`,
      deliveryRadius: deliveryRadius,
      area: selectedLocation.area,
      city: selectedLocation.city,
    };

    if (onLocationSelect) {
      onLocationSelect(locationData);
    }
    navigation.goBack();
  }, [selectedLocation, branchName, deliveryRadius, onLocationSelect, navigation]);

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
    if (!addressDetails.phoneNumber.trim()) {
      showErrorToast(strings.error, strings.phoneNumberRequired);
      return;
    }

    // Validate phone number format using ref
    if (phoneInputRef.current && !phoneInputRef.current.isValidNumber()) {
      showErrorToast(strings.error, strings.invalidPhoneNumber || 'Invalid phone number format');
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
        // Auto-populated from reverse geocoding
        area: selectedLocation.area || '',
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
      let response;
      if (editMode && addressToEdit?._id) {
        // Edit existing address
        response = await dispatch(editAddress(addressToEdit._id, locationData));
      } else {
        // Add new address
        response = await dispatch(addAddress(locationData));
      }

      if (onLocationSelect) {
        if (response && response.payload) {
          onLocationSelect(response.payload);
        } else {
          // For edit mode, the response structure might differ, just call callback
          onLocationSelect(locationData);
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

        {/* Search Bar - shows selected address */}
        <View style={localStyles.searchContainer}>
          <FreeAddressSearch
            placeholder={strings.searchLocationPlaceholder}
            initialValue={selectedLocation?.formattedAddress || ''}
            onLocationSelect={handleLocationSelect}
            onClear={() => {
              setSelectedLocation(null);
              setShowAddressForm(false);
              setLocationSaved(false);
            }}
            autoFocus={false}
            onFocus={() => {
              // When user clicks address input while form is visible, hide form and show map
              if (showAddressForm) {
                setShowAddressForm(false);
                setLocationSaved(false);
              }
            }}
          />
        </View>

        {/* Interactive Map - Full size when selecting, mini preview when form is visible */}
        {!showAddressForm && (
          <View style={showBranchForm ? localStyles.miniMapWrapper : localStyles.mapWrapper}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={showBranchForm ? localStyles.miniMap : localStyles.map}
              initialRegion={initialRegion}
              onPress={showBranchForm ? undefined : handleMapPress}
              showsUserLocation={!showBranchForm}
              showsMyLocationButton={false}
              loadingEnabled={false}
              moveOnMarkerPress={false}
              pitchEnabled={false}
              rotateEnabled={false}
              toolbarEnabled={false}
              scrollEnabled={!showBranchForm}
              zoomEnabled={!showBranchForm}
            >
              <Marker
                coordinate={markerPosition}
                draggable={!showBranchForm}
                onDragEnd={handleMapDragEnd}
                pinColor={colors.primary}
              />
              {/* Delivery Radius Circle - only shown for chef branches */}
              {isChefBranch && selectedLocation && (
                <Circle
                  center={markerPosition}
                  radius={deliveryRadius * 1000} // Convert km to meters
                  fillColor="rgba(40, 167, 69, 0.15)"
                  strokeColor="rgba(40, 167, 69, 0.6)"
                  strokeWidth={2}
                />
              )}
            </MapView>

            {/* Expand map button - shown on mini map */}
            {showBranchForm && (
              <TouchableOpacity
                style={[localStyles.expandMapButton, { backgroundColor: colors.backgroundColor + 'DD' }]}
                onPress={() => setShowBranchForm(false)}
              >
                <MaterialIcons name="fullscreen" size={moderateScale(20)} color={colors.primary} />
                <ZText type="s12" color={colors.primary} style={{ marginLeft: moderateScale(4) }}>
                  {strings.editLocation || 'Edit Location'}
                </ZText>
              </TouchableOpacity>
            )}

            {/* Center on GPS button - only shown on full map */}
            {!showBranchForm && (
              <TouchableOpacity
                style={[localStyles.gpsButton, { backgroundColor: colors.white }]}
                onPress={handleCenterOnCurrentLocation}
              >
                <MaterialIcons name="my-location" size={moderateScale(22)} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Selected Location Display - hidden when branch form is visible (mini map shows location) */}
        {selectedLocation && !showBranchForm && (
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
              {locationSaved && (
                <Feather
                  name="check-circle"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
              )}
            </View>
          </View>
        )}

        {/* Save Location Button - shown when location selected but form not yet visible */}
        {selectedLocation && !showAddressForm && !showBranchForm && (
          <View style={localStyles.saveButtonContainer}>
            <TouchableOpacity
              style={[
                localStyles.saveLocationButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleSaveLocation}
              disabled={reverseGeocoding}
            >
              {reverseGeocoding ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="check" size={moderateScale(20)} color={colors.white} />
                  <ZText type="B16" color={colors.white} style={{ marginLeft: moderateScale(8) }}>
                    {strings.selectLocation}
                  </ZText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Chef Branch Form - shown when adding a branch location */}
        {showBranchForm && (
          <KeyboardAwareScrollView
            style={localStyles.formContainer}
            contentContainerStyle={localStyles.formContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            {/* Branch Name */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.branchNameLabel}
              </ZText>
              <ZInput
                placeHolder={strings.branchNamePlaceholder}
                _value={branchName}
                toGetTextFieldValue={(value) => setBranchName(value)}
                inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
              />
            </View>

            {/* Delivery Radius Slider */}
            <View style={localStyles.section}>
              <View style={localStyles.radiusHeader}>
                <ZText type="B16" color={colors.textColor}>
                  {strings.deliveryRadius}
                </ZText>
                <View style={[localStyles.radiusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ZText type="B18" color={colors.primary}>
                    {deliveryRadius} {strings.deliveryRadiusKm}
                  </ZText>
                </View>
              </View>
              <ZText type="s12" color={colors.grayScale6} style={{ marginBottom: moderateScale(12) }}>
                {strings.deliveryRadiusHint}
              </ZText>
              <View style={localStyles.sliderContainer}>
                <ZText type="s12" color={colors.grayScale6}>1km</ZText>
                <Slider
                  style={localStyles.slider}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={deliveryRadius}
                  onValueChange={handleRadiusChange}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.grayScale4}
                  thumbTintColor={colors.primary}
                />
                <ZText type="s12" color={colors.grayScale6}>50km</ZText>
              </View>
            </View>

            {/* Coverage Areas */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.areasYouCanDeliverTo}
              </ZText>
              {loadingAreas ? (
                <View style={localStyles.loadingAreasContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <ZText type="s14" color={colors.grayScale6} style={{ marginLeft: moderateScale(8) }}>
                    {strings.loadingAreas}
                  </ZText>
                </View>
              ) : coverageAreas.length > 0 ? (
                <View style={localStyles.areasContainer}>
                  {coverageAreas.map((area, index) => (
                    <View
                      key={index}
                      style={[localStyles.areaTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                    >
                      <Ionicons name="location-outline" size={moderateScale(14)} color={colors.primary} />
                      <ZText type="s14" color={colors.primary} style={{ marginLeft: moderateScale(4) }}>
                        {area}
                      </ZText>
                    </View>
                  ))}
                </View>
              ) : (
                <ZText type="s14" color={colors.grayScale6}>
                  {strings.noAreasFound}
                </ZText>
              )}
            </View>

            {/* Selected Address Display */}
            <View style={[localStyles.selectedAddressCard, { backgroundColor: colors.inputBg, borderColor: colors.grayScale4 }]}>
              <Feather name="map-pin" size={moderateScale(18)} color={colors.primary} />
              <ZText type="s14" color={colors.textColor} style={{ marginLeft: moderateScale(8), flex: 1 }} numberOfLines={2}>
                {selectedLocation?.formattedAddress || strings.gettingAddress}
              </ZText>
            </View>

            {/* Confirm Branch Button */}
            <TouchableOpacity
              style={[localStyles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirmBranch}
            >
              <Ionicons name="checkmark-circle" size={moderateScale(22)} color={colors.white} />
              <ZText type="B16" color={colors.white} style={{ marginLeft: moderateScale(8) }}>
                {strings.confirm}
              </ZText>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
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



            {/* Contact Info */}
            <View style={localStyles.section}>
              <ZPhoneInput
                ref={phoneInputRef}
                value={addressDetails.phoneNumber}
                defaultCode="EG"
                label={strings.contactInfo}
                placeholder={strings.phoneNumberPlaceholder}
                required={true}
                onChangeText={(text) => handleAddressDetailChange('phoneNumber', text)}
                onChangeCountryCode={(code) => handleAddressDetailChange('countryCode', code)}
                onValidation={(isValid) => setIsPhoneValid(isValid)}
              />
            </View>
          </KeyboardAwareScrollView>
        )}

        {/* Confirm Button - only shown when address form is visible */}
        {showAddressForm && (
          <View style={localStyles.buttonContainer}>
            <TouchableOpacity
              style={[
                localStyles.confirmButton,
                {
                  backgroundColor: colors.primary,
                  opacity: (loading || addingAddress) ? 0.6 : 1
                }
              ]}
              onPress={handleConfirmLocation}
              disabled={loading || addingAddress}
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
    height: height * 0.55,
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(8),
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
  saveButtonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(24),
  },
  saveLocationButton: {
    flexDirection: 'row',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  // Chef Branch Form Styles
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  radiusBadge: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  slider: {
    flex: 1,
    height: moderateScale(40),
    marginHorizontal: moderateScale(8),
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: moderateScale(8),
    gap: moderateScale(8),
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },
  loadingAreasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(16),
    borderWidth: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  // Mini Map Styles (collapsed view when branch form is visible)
  miniMapWrapper: {
    height: moderateScale(120),
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(8),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(12),
  },
  expandMapButton: {
    position: 'absolute',
    bottom: moderateScale(8),
    right: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
});

export default MapLocationPicker;