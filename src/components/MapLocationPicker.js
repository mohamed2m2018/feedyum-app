import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
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
import strings from '../i18n/strings';
import addressService from '../services/addressService';
import { addAddress, editAddress } from '../redux/actions/addressActions';
import request from '../api/request';
import { useLocation } from '../navigation/locationContext';
import GoogleMapsService from '../services/GoogleMapsService';
import branchService from '../api/branchService';
import Geolocation from '@react-native-community/geolocation';

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
  const branchFormRef = useRef(null);
  const tiersSectionRef = useRef(null);
  const tiersSectionY = useRef(0);

  const { onLocationSelect, initialLocation, editMode, addressToEdit, isChefBranch } = route.params || {};

  // Fetch user data using the same pattern as other components
  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });
  const user = data?.data?.user;

  // Initial map region - in edit mode, use saved address; otherwise GPS, then initialLocation, then Cairo default
  const editLat = editMode && addressToEdit ? (addressToEdit.location?.lat || addressToEdit.lat) : null;
  const editLng = editMode && addressToEdit ? (addressToEdit.location?.long || addressToEdit.long || addressToEdit.lng) : null;

  const initialRegion = useMemo(() => {
    const region = {
      latitude: (editLat ? parseFloat(editLat) : null) || location?.latitude || initialLocation?.latitude || 30.0444,
      longitude: (editLng ? parseFloat(editLng) : null) || location?.longitude || initialLocation?.longitude || 31.2357,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    };
    return region;
  }, []);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(() => {
    const pos = {
      latitude: (editLat ? parseFloat(editLat) : null) || initialRegion.latitude,
      longitude: (editLng ? parseFloat(editLng) : null) || initialRegion.longitude,
    };
    return pos;
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
  const [coverageAreas, setCoverageAreas] = useState([]); // Array of { name, placeId }
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [excludedAreas, setExcludedAreas] = useState(
    editMode && addressToEdit?.excludedAreas ? addressToEdit.excludedAreas : []
  ); // Array of { name, placeId } chef excluded
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [deliveryTiers, setDeliveryTiers] = useState([{ maxDistance: 20, fee: '' }]);
  const [tierErrors, setTierErrors] = useState([]); // indices of tiers with invalid fees
  const [orderModeError, setOrderModeError] = useState(false);
  const [orderMode, setOrderMode] = useState(

    editMode && addressToEdit?.orderMode ? addressToEdit.orderMode : null
  );
  const savedLeadMinutes = editMode && addressToEdit?.minLeadTime ? addressToEdit.minLeadTime : null;
  const [leadTimeValue, setLeadTimeValue] = useState(
    savedLeadMinutes
      ? (savedLeadMinutes >= 1440 && savedLeadMinutes % 1440 === 0
          ? String(savedLeadMinutes / 1440)
          : String(savedLeadMinutes / 60))
      : ''
  );
  const [leadTimeUnit, setLeadTimeUnit] = useState(
    savedLeadMinutes && savedLeadMinutes >= 1440 && savedLeadMinutes % 1440 === 0
      ? 'days' : 'hours'
  );
  const [slotDuration, setSlotDuration] = useState(
    editMode && addressToEdit?.slotDuration ? addressToEdit.slotDuration : 60
  );

  // Auto-adjust delivery tiers when radius changes
  useEffect(() => {
    setDeliveryTiers(prev => {
      // Clamp all maxDistance values to not exceed radius
      let adjusted = prev.map(tier => ({
        ...tier,
        maxDistance: Math.min(tier.maxDistance, deliveryRadius),
      }));

      // Remove zero-range tiers (where From >= To after clamping)
      adjusted = adjusted.filter((tier, idx) => {
        const from = idx === 0 ? 0 : adjusted[idx - 1]?.maxDistance || 0;
        return tier.maxDistance > from;
      });

      if (adjusted.length === 0) {
        return [{ maxDistance: deliveryRadius, fee: '' }];
      }

      // Ensure last tier reaches the radius
      adjusted[adjusted.length - 1] = {
        ...adjusted[adjusted.length - 1],
        maxDistance: deliveryRadius,
      };

      return adjusted;
    });
  }, [deliveryRadius]);

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
        const editCoords = {
          latitude: parseFloat(editLat),
          longitude: parseFloat(editLng)
        };
        setMarkerPosition(editCoords);
        // Animate map camera to saved branch location
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...editCoords,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }, 500);
        }, 300);
      }

      // Show the appropriate form instantly in edit mode
      if (isChefBranch) {
        setShowBranchForm(true);
      } else {
        setShowAddressForm(true);
      }
      setLocationSaved(true);
      // Prevent GPS centering from overwriting the saved branch location
      setInitialGeocodeDone(true);

      // Initialize delivery config from existing branch data
      if (addressToEdit.deliveryRadius) {
        setDeliveryRadius(addressToEdit.deliveryRadius);
      }
      if (addressToEdit.deliveryTiers && addressToEdit.deliveryTiers.length > 0) {
        setDeliveryTiers(addressToEdit.deliveryTiers);
      }
      if (addressToEdit.branchName) {
        setBranchName(addressToEdit.branchName);
      }
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
  // Skip entirely in edit mode - the edit init effect handles positioning
  useEffect(() => {
    if (editMode) return;
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
  }, [location?.latitude, location?.longitude, initialGeocodeDone, editMode]);

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

  // Center map on current GPS location (fresh position, not cached context)
  const handleCenterOnCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setMarkerPosition({ latitude, longitude });

        // Animate the map camera to the fresh GPS position
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          },
          500,
        );

        // Reverse-geocode the new position silently
        reverseGeocodePositionSilent(latitude, longitude);
        setLocationSaved(false);
        setShowAddressForm(false);
      },
      (error) => {
        console.warn('GPS relocate failed:', error.message);
        // Fallback: use context location if GPS fails
        if (location?.latitude && location?.longitude) {
          const lat = location.latitude;
          const lng = location.longitude;

          setMarkerPosition({ latitude: lat, longitude: lng });
          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            },
            500,
          );
          reverseGeocodePositionSilent(lat, lng);
          setLocationSaved(false);
          setShowAddressForm(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
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

    // Validate order mode is chosen
    if (!orderMode) {
      showErrorToast(
        strings.orderModeRequiredTitle || 'Order Mode Required',
        strings.orderModeRequired || 'Choose how you receive orders: ASAP, Scheduled, or Both'
      );
      setOrderModeError(true);
      return;
    }

    // Validate minimum lead time is chosen when scheduling is enabled
    if ((orderMode === 'scheduled' || orderMode === 'both') && (!leadTimeValue || Number(leadTimeValue) <= 0)) {
      showErrorToast(
        strings.error,
        strings.minLeadTimeRequired || 'Please enter a minimum lead time'
      );
      return;
    }

    // Validate delivery tiers - all must have a fee > 0
    const invalidIndices = deliveryTiers
      .map((t, i) => (!t.fee || isNaN(Number(t.fee)) || Number(t.fee) <= 0) ? i : -1)
      .filter(i => i !== -1);
    if (invalidIndices.length > 0) {
      setTierErrors(invalidIndices);
      showErrorToast(
        strings.invalidDeliveryFee || 'Invalid Delivery Fee',
        strings.allTiersMustHaveFee || 'All delivery tiers must have a fee greater than 0'
      );
      // Auto-scroll to the delivery fee section so user sees the error
      if (branchFormRef.current && tiersSectionY.current > 0) {
        const scrollFn = branchFormRef.current.scrollToPosition || branchFormRef.current.scrollTo;
        if (scrollFn) {
          scrollFn.call(branchFormRef.current, 0, tiersSectionY.current - 20, true);
        }
      }
      return;
    }
    setTierErrors([]);

    // Format delivery tiers
    const validTiers = deliveryTiers.map(t => ({
      maxDistance: Number(t.maxDistance),
      fee: Number(t.fee),
    }));

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
      deliveryTiers: validTiers,
      excludedAreas: excludedAreas,
      area: selectedLocation.area,
      city: selectedLocation.city,
      orderMode: orderMode || 'asap',
      minLeadTime: (leadTimeUnit === 'days' ? Number(leadTimeValue) * 1440 : Number(leadTimeValue) * 60) || 60,
      slotDuration: slotDuration || 60,
    };

    if (onLocationSelect) {
      onLocationSelect(locationData);
    }
    navigation.goBack();
  }, [selectedLocation, branchName, deliveryRadius, deliveryTiers, excludedAreas, orderMode, leadTimeValue, leadTimeUnit, slotDuration, onLocationSelect, navigation]);

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
              onMapReady={() => console.log('[MAP] Map ready')}
              onMapLoaded={() => console.log('[MAP] Map tiles loaded')}
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
            ref={branchFormRef}
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

            {/* Order Mode Selector */}
            <View style={[localStyles.section, { 
              backgroundColor: colors.inputBg, 
              padding: moderateScale(14), 
              borderRadius: moderateScale(12),
              borderWidth: 1,
              borderColor: orderModeError ? colors.alertColor || '#FF4D4D' : colors.grayScale4,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(10) }}>
                <Ionicons name="time-outline" size={moderateScale(18)} color={colors.primary} />
                <ZText type="B16" color={colors.textColor} style={{ marginLeft: moderateScale(8), flex: 1 }}>
                  {strings.orderModeLabel || 'Order Mode'}
                </ZText>
              </View>
              <ZText type="s12" color={orderModeError ? colors.alertColor || '#FF4D4D' : colors.grayScale6} style={{ marginBottom: moderateScale(10) }}>
                {strings.orderModeDesc || 'How can customers place orders?'}
              </ZText>
              <View style={{ flexDirection: 'row', gap: moderateScale(8) }}>
                {[  
                  { key: 'asap', icon: 'flash', label: strings.asapOnly || 'ASAP Only' },
                  { key: 'scheduled', icon: 'calendar-outline', label: strings.scheduledOnly || 'Scheduled' },
                  { key: 'both', icon: 'time', label: strings.bothModes || 'Both' },
                ].map(opt => {
                  const isActive = orderMode === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        {
                          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          paddingVertical: moderateScale(10),
                          borderRadius: moderateScale(10),
                        },
                        isActive && { backgroundColor: colors.primary },
                        !isActive && { backgroundColor: colors.backgroundColor, borderWidth: 1, borderColor: colors.grayScale3 },
                      ]}
                      onPress={() => { setOrderMode(opt.key); setOrderModeError(false); }}
                    >
                      <Ionicons name={opt.icon} size={moderateScale(14)} color={isActive ? colors.white : colors.textColor} />
                      <ZText type={isActive ? 'B12' : 'M12'} color={isActive ? colors.white : colors.textColor} style={{ marginLeft: moderateScale(4) }}>
                        {opt.label}
                      </ZText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Minimum Lead Time — shown when scheduling is enabled */}
            {(orderMode === 'scheduled' || orderMode === 'both') && (
              <View style={[localStyles.section, {
                backgroundColor: colors.inputBg,
                padding: moderateScale(14),
                borderRadius: moderateScale(12),
                borderWidth: 1,
                borderColor: colors.grayScale4,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(8) }}>
                  <Ionicons name="hourglass-outline" size={moderateScale(18)} color={colors.primary} />
                  <ZText type="B16" color={colors.textColor} style={{ marginLeft: moderateScale(8), flex: 1 }}>
                    {strings.minLeadTimeLabel || 'Minimum Lead Time'} <ZText type="B16" color={colors.alertColor || '#FF5252'}>*</ZText>
                  </ZText>
                </View>
                <ZText type="s12" color={colors.grayScale6} style={{ marginBottom: moderateScale(10) }}>
                  {strings.minLeadTimeDesc || 'How far ahead must customers schedule?'}
                </ZText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
                  {/* Number input */}
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: colors.backgroundColor,
                      borderWidth: 1,
                      borderColor: colors.grayScale3,
                      borderRadius: moderateScale(10),
                      paddingVertical: moderateScale(12),
                      paddingHorizontal: moderateScale(16),
                      color: colors.textColor,
                      fontSize: moderateScale(16),
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                    value={leadTimeValue}
                    onChangeText={(text) => setLeadTimeValue(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.grayScale5}
                  />
                  {/* Unit toggle */}
                  {[
                    { key: 'hours', label: strings.hours || 'Hours' },
                    { key: 'days', label: strings.days || 'Days' },
                  ].map(unit => {
                    const isActive = leadTimeUnit === unit.key;
                    return (
                      <TouchableOpacity
                        key={unit.key}
                        style={[
                          {
                            paddingVertical: moderateScale(12), paddingHorizontal: moderateScale(18),
                            borderRadius: moderateScale(10),
                          },
                          isActive && { backgroundColor: colors.primary },
                          !isActive && { backgroundColor: colors.backgroundColor, borderWidth: 1, borderColor: colors.grayScale3 },
                        ]}
                        onPress={() => setLeadTimeUnit(unit.key)}
                      >
                        <ZText type={isActive ? 'B14' : 'M14'} color={isActive ? colors.white : colors.textColor}>
                          {unit.label}
                        </ZText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Slot Duration — shown when scheduling is enabled */}
            {(orderMode === 'scheduled' || orderMode === 'both') && (
              <View style={[localStyles.section, {
                backgroundColor: colors.inputBg,
                padding: moderateScale(14),
                borderRadius: moderateScale(12),
                borderWidth: 1,
                borderColor: colors.grayScale4,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(10) }}>
                  <Ionicons name="timer-outline" size={moderateScale(18)} color={colors.primary} />
                  <ZText type="B16" color={colors.textColor} style={{ marginLeft: moderateScale(8), flex: 1 }}>
                    {strings.slotDurationLabel || 'Time Slot Size'}
                  </ZText>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: moderateScale(8) }}>
                  {[
                    { value: 30, label: strings.thirtyMin || '30 min' },
                    { value: 60, label: strings.oneHour || '1 hour' },
                    { value: 120, label: strings.twoHours || '2 hours' },
                    { value: 180, label: strings.threeHours || '3 hours' },
                    { value: 360, label: strings.halfDay || 'Half day' },
                  ].map(opt => {
                    const isActive = slotDuration === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          {
                            paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(14),
                            borderRadius: moderateScale(10),
                          },
                          isActive && { backgroundColor: colors.primary },
                          !isActive && { backgroundColor: colors.backgroundColor, borderWidth: 1, borderColor: colors.grayScale3 },
                        ]}
                        onPress={() => setSlotDuration(opt.value)}
                      >
                        <ZText type={isActive ? 'B12' : 'M12'} color={isActive ? colors.white : colors.textColor}>
                          {opt.label}
                        </ZText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

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

            {/* Delivery Fee Tiers */}
            <View
              style={localStyles.section}
              onLayout={(e) => { tiersSectionY.current = e.nativeEvent.layout.y; }}
            >
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.deliveryTiers}
              </ZText>
              <ZText type="s12" color={colors.grayScale6} style={{ marginBottom: moderateScale(12) }}>
                {strings.deliveryTiersHint}
              </ZText>

              {deliveryTiers.map((tier, index) => (
                <View key={index} style={[localStyles.tierRow, { backgroundColor: colors.inputBg, borderColor: colors.grayScale4 }]}>
                  <View style={localStyles.tierInputGroup}>
                    <View style={localStyles.tierInputWrapper}>
                      <ZText type="s12" color={colors.grayScale6}>{strings.tierFromKm}</ZText>
                      <ZInput
                        placeHolder="0"
                        _value={index === 0 ? '0' : String(deliveryTiers[index - 1].maxDistance)}
                        keyBoardType="numeric"
                        editable={index !== 0}
                        toGetTextFieldValue={(val) => {
                          if (index > 0) {
                            const num = Math.min(parseInt(val) || 0, deliveryRadius);
                            const updated = [...deliveryTiers];
                            updated[index - 1] = { ...updated[index - 1], maxDistance: num };
                            setDeliveryTiers(updated);
                          }
                        }}
                        inputContainerStyle={[localStyles.tierFeeInput, {
                          backgroundColor: index === 0 ? colors.inputBg : colors.backgroundColor,
                          borderColor: colors.grayScale4,
                          opacity: index === 0 ? 0.6 : 1,
                        }]}
                      />
                    </View>
                    <View style={localStyles.tierInputWrapper}>
                      <ZText type="s12" color={colors.grayScale6}>{strings.tierToKm}</ZText>
                      <ZInput
                        placeHolder="0"
                        _value={String(tier.maxDistance)}
                        keyBoardType="numeric"
                        toGetTextFieldValue={(val) => {
                          const num = parseInt(val) || 0;
                          // Auto-expand delivery radius if tier exceeds it
                          if (num > deliveryRadius) {
                            setDeliveryRadius(num);
                          }
                          let updated = [...deliveryTiers];
                          updated[index] = { ...updated[index], maxDistance: num };
                          // Remove downstream tiers that become zero-range (From >= To)
                          updated = updated.filter((t, i) => {
                            if (i <= index) return true;
                            const from = updated[i - 1]?.maxDistance || 0;
                            return t.maxDistance > from;
                          });
                          setDeliveryTiers(updated);
                        }}
                        inputContainerStyle={[localStyles.tierFeeInput, { backgroundColor: colors.backgroundColor, borderColor: colors.grayScale4 }]}
                      />
                    </View>
                    <View style={localStyles.tierInputWrapper}>
                      <ZText type="s12" color={colors.grayScale6}>{strings.tierFeeEgp}</ZText>
                      <ZInput
                        placeHolder="10"
                        _value={String(tier.fee)}
                        keyBoardType="numeric"
                        toGetTextFieldValue={(val) => {
                          const updated = [...deliveryTiers];
                          updated[index] = { ...updated[index], fee: val };
                          setDeliveryTiers(updated);
                          // Clear error for this tier if value is now valid
                          if (val && !isNaN(Number(val)) && Number(val) > 0) {
                            setTierErrors(prev => prev.filter(i => i !== index));
                          }
                        }}
                        inputContainerStyle={[localStyles.tierFeeInput, {
                          backgroundColor: colors.backgroundColor,
                          borderColor: tierErrors.includes(index) ? '#FF5252' : colors.grayScale4,
                          borderWidth: tierErrors.includes(index) ? 1.5 : 1,
                        }]}
                      />
                      {tierErrors.includes(index) && (
                        <ZText type="s10" color="#FF5252" style={{ marginTop: moderateScale(2) }}>
                          {strings.invalidDeliveryFee || 'Required'}
                        </ZText>
                      )}
                    </View>
                  </View>
                  {deliveryTiers.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        const updated = deliveryTiers.filter((_, i) => i !== index);
                        setDeliveryTiers(updated);
                      }}
                      style={localStyles.tierRemoveButton}
                    >
                      <Feather name="x" size={moderateScale(16)} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[localStyles.addTierButton, { borderColor: colors.primary }]}
                onPress={() => {
                  const lastTier = deliveryTiers[deliveryTiers.length - 1];
                  const newMax = lastTier.maxDistance + 5;
                  // Auto-expand delivery radius to match
                  if (newMax > deliveryRadius) {
                    setDeliveryRadius(newMax);
                  }
                  const updated = [...deliveryTiers, { maxDistance: newMax, fee: '' }];
                  setDeliveryTiers(updated);
                }}
              >
                <Feather name="plus" size={moderateScale(16)} color={colors.primary} />
                <ZText type="M14" color={colors.primary} style={{ marginLeft: moderateScale(6) }}>
                  {strings.addTier}
                </ZText>
              </TouchableOpacity>
            </View>

            {/* Coverage Areas — tappable to exclude */}
            <View style={localStyles.section}>
              <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                {strings.areasYouCanDeliverTo}
              </ZText>
              <ZText type="s12" color={colors.grayScale6} style={{ marginBottom: moderateScale(8) }}>
                {strings.tapToExcludeArea || 'Press ✕ to stop delivering to an area'}
              </ZText>

              {/* Excluded count badge */}
              {excludedAreas.length > 0 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FF4D4D15',
                  paddingHorizontal: moderateScale(12),
                  paddingVertical: moderateScale(6),
                  borderRadius: moderateScale(8),
                  marginBottom: moderateScale(10),
                  borderWidth: 1,
                  borderColor: '#FF4D4D30',
                }}>
                  <Ionicons name="warning-outline" size={moderateScale(14)} color="#FF4D4D" />
                  <ZText type="s12" color="#FF4D4D" style={{ marginLeft: moderateScale(6) }}>
                    {strings.youWontDeliverTo || "You won't deliver to"} {excludedAreas.length} {excludedAreas.length === 1
                      ? (strings.areaWord || 'area')
                      : (strings.areasWord || 'areas')}
                  </ZText>
                </View>
              )}

              {loadingAreas ? (
                <View style={localStyles.loadingAreasContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <ZText type="s14" color={colors.grayScale6} style={{ marginLeft: moderateScale(8) }}>
                    {strings.loadingAreas}
                  </ZText>
                </View>
              ) : coverageAreas.length > 0 ? (
                <View style={localStyles.areasContainer}>
                  {coverageAreas.map((area, index) => {
                    const isExcluded = excludedAreas.some(ex => ex.placeId === area.placeId);
                    return (
                      <TouchableOpacity
                        key={area.placeId || index}
                        style={[
                          localStyles.areaTag,
                          isExcluded
                            ? { backgroundColor: colors.alertColor + '12', borderColor: colors.alertColor + '40' }
                            : { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' },
                        ]}
                        onPress={() => {
                          if (isExcluded) {
                            setExcludedAreas(prev => prev.filter(ex => ex.placeId !== area.placeId));
                          } else {
                            setExcludedAreas(prev => [...prev, { name: area.name, placeId: area.placeId }]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        {isExcluded ? (
                          <>
                            <ZText
                              type="s14"
                              color={colors.alertColor}
                              style={{ textDecorationLine: 'line-through', opacity: 0.7 }}
                            >
                              {area.name}
                            </ZText>
                            <Ionicons
                              name="arrow-undo-outline"
                              size={moderateScale(14)}
                              color={colors.alertColor}
                              style={{ marginLeft: moderateScale(6) }}
                            />
                          </>
                        ) : (
                          <>
                            <ZText type="s14" color={colors.primary}>
                              {area.name}
                            </ZText>
                            <Ionicons
                              name="close"
                              size={moderateScale(16)}
                              color={colors.primary}
                              style={{ marginLeft: moderateScale(6), opacity: 0.6 }}
                            />
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
                {strings.addressLabel}<ZText style={{ color: colors.lightRed }}>{' *'}</ZText>
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
                {strings.buildingDetails}<ZText style={{ color: colors.lightRed }}>{' *'}</ZText>
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
                    keyBoardType="numeric"
                    inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                  />
                </View>
                <View style={localStyles.halfWidth}>
                  <ZInput
                    placeHolder={strings.floorNumberPlaceholder}
                    _value={addressDetails.floorNumber}
                    toGetTextFieldValue={(value) => handleAddressDetailChange('floorNumber', value)}
                    keyBoardType="numeric"
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
                <ActivityIndicator size="small" color={colors.white} />
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
  // Delivery Tier Styles
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    marginBottom: moderateScale(8),
  },
  tierInputGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: moderateScale(8),
    alignItems: 'flex-end',
  },
  tierInputWrapper: {
    flex: 1,
  },
  tierInput: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  tierFeeInput: {
    borderRadius: moderateScale(8),
    borderWidth: 1,
    marginTop: moderateScale(4),
    height: moderateScale(38),
  },
  tierRemoveButton: {
    padding: moderateScale(6),
    marginLeft: moderateScale(4),
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: moderateScale(4),
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