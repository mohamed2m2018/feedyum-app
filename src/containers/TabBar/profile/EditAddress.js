import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// Removed react-native-maps dependency - using MapLocationPicker navigation instead
import { moderateScale } from '../../../common/constants';
import { styles } from '../../../themes';
import ZText from '../../../components/common/ZText';
import ZInput from '../../../components/common/ZInput';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZLoader from '../../../components/common/ZLoader';
import strings from '../../../i18n/strings';
import { editAddress, deleteAddress, addAddress } from '../../../redux/actions/addressActions';
import { StackNav } from '../../../navigation/NavigationKeys';

const { width } = Dimensions.get('window');

const EditAddress = () => {
  const colors = useSelector(state => state.theme.theme);
  const { editingAddress, addingAddress, deletingAddress } = useSelector(state => state.address);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { address: initialAddress } = route.params || {};
  const isEditing = !!initialAddress;
  
  const [formData, setFormData] = useState({
    label: '',
    addressType: 'house',
    buildingName: '',
    apartmentNumber: '',
    floorNumber: '',
    streetName: '',
    area: '',
    neighborhood: '',
    phoneNumber: '',
    countryCode: '+20',
    isPrimary: false,
    lat: '30.0444',
    lng: '31.2357',
    formattedAddress: ''
  });

  useEffect(() => {
    if (initialAddress) {
      setFormData({
        label: initialAddress.label || '',
        addressType: initialAddress.addressType || 'house',
        buildingName: initialAddress.buildingDetails?.buildingName || '',
        apartmentNumber: initialAddress.buildingDetails?.apartmentNumber || '',
        floorNumber: initialAddress.buildingDetails?.floorNumber || '',
        streetName: initialAddress.streetDetails?.streetName || '',
        area: initialAddress.streetDetails?.area || '',
        neighborhood: initialAddress.streetDetails?.neighborhood || '',
        phoneNumber: initialAddress.contactInfo?.phoneNumber || '',
        countryCode: initialAddress.contactInfo?.countryCode || '+20',
        isPrimary: initialAddress.isPrimary || false,
        lat: initialAddress.location?.lat || '30.0444',
        lng: initialAddress.location?.long || '31.2357',
        formattedAddress: initialAddress.formattedAddress || initialAddress.nameLine || ''
      });
    }
  }, [initialAddress]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      addressType: type
    }));
  };

  const handleMapPress = () => {
    navigation.navigate(StackNav.MapLocationPicker, {
      initialLocation: {
        latitude: parseFloat(formData.lat),
        longitude: parseFloat(formData.lng)
      },
      onLocationSelect: (locationData) => {
        setFormData(prev => ({
          ...prev,
          lat: locationData.lat,
          lng: locationData.lng,
          formattedAddress: locationData.formattedAddress,
          streetName: locationData.streetDetails?.streetName || locationData.formattedAddress
        }));
      }
    });
  };

  const validateForm = () => {
    if (!formData.label.trim()) {
      Alert.alert(strings.error, strings.labelRequired);
      return false;
    }
    if (!formData.streetName.trim() && !formData.formattedAddress.trim()) {
      Alert.alert(strings.error, strings.addressRequired);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const addressData = {
      label: formData.label.trim(),
      addressType: formData.addressType,
      buildingDetails: {
        buildingName: formData.buildingName.trim(),
        apartmentNumber: formData.apartmentNumber.trim(),
        floorNumber: formData.floorNumber.trim()
      },
      streetDetails: {
        streetName: formData.streetName.trim(),
        area: formData.area.trim(),
        neighborhood: formData.neighborhood.trim()
      },
      contactInfo: {
        phoneNumber: formData.phoneNumber.trim(),
        countryCode: formData.countryCode
      },
      location: {
        lat: formData.lat,
        long: formData.lng
      },
      formattedAddress: formData.formattedAddress || formData.streetName,
      nameLine: formData.formattedAddress || formData.streetName,
      isPrimary: formData.isPrimary
    };

    try {
      if (isEditing) {
        await dispatch(editAddress(initialAddress._id, addressData));
      } else {
        await dispatch(addAddress(addressData));
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(strings.error, strings.failedToSaveAddress);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      strings.deleteAddress,
      strings.deleteAddressConfirmation.replace('{label}', formData.label),
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
              await dispatch(deleteAddress(initialAddress._id));
              navigation.goBack();
            } catch (error) {
              Alert.alert(strings.error, strings.failedToDeleteAddress);
            }
          },
        },
      ]
    );
  };

  const addressTypes = [
    { key: 'house', label: strings.house, icon: 'home' },
    { key: 'apartment', label: strings.apartment, icon: 'apartment' },
    { key: 'office', label: strings.office, icon: 'business' }
  ];

  const renderAddressTypeSelector = () => (
    <View style={localStyles.section}>
      <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
        {strings.addressType}
      </ZText>
      <View style={localStyles.addressTypeContainer}>
        {addressTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              localStyles.addressTypeButton,
              {
                backgroundColor: formData.addressType === type.key ? colors.primary : colors.inputBg,
                borderColor: formData.addressType === type.key ? colors.primary : colors.borderColor
              }
            ]}
            onPress={() => handleAddressTypeSelect(type.key)}
          >
            <MaterialIcons
              name={type.icon}
              size={moderateScale(20)}
              color={formData.addressType === type.key ? colors.white : colors.grayScale5}
            />
            <ZText
              type="s14"
              color={formData.addressType === type.key ? colors.white : colors.textColor}
              style={localStyles.addressTypeText}
            >
              {type.label}
            </ZText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMapView = () => (
    <View style={localStyles.section}>
      <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
        {strings.location}
      </ZText>
      <TouchableOpacity 
        style={[localStyles.mapContainer, { backgroundColor: colors.inputBg }]} 
        onPress={handleMapPress}
      >
        <View style={localStyles.locationPreview}>
          <View style={[localStyles.customMarker, { backgroundColor: colors.primary }]}>
            <Feather name="map-pin" size={moderateScale(16)} color={colors.white} />
          </View>
          <View style={localStyles.locationInfo}>
            <ZText type="s14" color={colors.textColor} numberOfLines={2}>
              {formData.formattedAddress || strings.selectLocationOnMap}
            </ZText>
            <ZText type="s12" color={colors.grayScale5}>
              {`${parseFloat(formData.lat).toFixed(4)}, ${parseFloat(formData.lng).toFixed(4)}`}
            </ZText>
          </View>
          <Feather name="edit-2" size={moderateScale(16)} color={colors.primary} />
        </View>
        <View style={localStyles.mapOverlay}>
          <ZText type="s12" color={colors.primary}>
            {strings.tapToChangeLocation}
          </ZText>
        </View>
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
          <ZText type="B18" color={colors.textColor}>
            {isEditing ? strings.editAddress : strings.addNewAddress}
          </ZText>
          <View style={localStyles.placeholder} />
        </View>

        <ScrollView 
          style={localStyles.scrollView}
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Address Label */}
          <View style={localStyles.section}>
            <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
              {strings.addressLabel}
            </ZText>
            <ZInput
              placeHolder={strings.addressLabelPlaceholder}
              _value={formData.label}
              toGetTextFieldValue={(value) => handleInputChange('label', value)}
              inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
            />
          </View>

          {/* Address Type */}
          {renderAddressTypeSelector()}

          {/* Building Details */}
          <View style={localStyles.section}>
            <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
              {strings.buildingDetails}
            </ZText>
            <ZInput
              placeHolder={strings.buildingName}
              _value={formData.buildingName}
              toGetTextFieldValue={(value) => handleInputChange('buildingName', value)}
              inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
            />
            <View style={localStyles.row}>
              <View style={localStyles.halfWidth}>
                <ZInput
                  placeHolder={strings.apartmentNumber}
                  _value={formData.apartmentNumber}
                  toGetTextFieldValue={(value) => handleInputChange('apartmentNumber', value)}
                  inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                />
              </View>
              <View style={localStyles.halfWidth}>
                <ZInput
                  placeHolder={strings.floorNumber}
                  _value={formData.floorNumber}
                  toGetTextFieldValue={(value) => handleInputChange('floorNumber', value)}
                  inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                />
              </View>
            </View>
          </View>

          {/* Street Details */}
          <View style={localStyles.section}>
            <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
              {strings.streetDetails}
            </ZText>
            <ZInput
              placeHolder={strings.streetName}
              _value={formData.streetName}
              toGetTextFieldValue={(value) => handleInputChange('streetName', value)}
              inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
            />
            <ZInput
              placeHolder={strings.area}
              _value={formData.area}
              toGetTextFieldValue={(value) => handleInputChange('area', value)}
              inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
            />
            <ZInput
              placeHolder={strings.neighborhood}
              _value={formData.neighborhood}
              toGetTextFieldValue={(value) => handleInputChange('neighborhood', value)}
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
                  placeHolder="+20"
                  _value={formData.countryCode}
                  toGetTextFieldValue={(value) => handleInputChange('countryCode', value)}
                  inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                />
              </View>
              <View style={localStyles.phoneNumberContainer}>
                <ZInput
                  placeHolder={strings.phoneNumber}
                  _value={formData.phoneNumber}
                  keyBoardType="phone-pad"
                  toGetTextFieldValue={(value) => handleInputChange('phoneNumber', value)}
                  inputContainerStyle={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}
                />
              </View>
            </View>
          </View>

          {/* Map View */}
          {renderMapView()}

          {/* Primary Address Toggle */}
          <TouchableOpacity
            style={localStyles.primaryToggle}
            onPress={() => handleInputChange('isPrimary', !formData.isPrimary)}
          >
            <View style={localStyles.primaryToggleContent}>
              <ZText type="s16" color={colors.textColor}>
                {strings.setPrimaryAddress}
              </ZText>
              <View style={[
                localStyles.toggleSwitch,
                { backgroundColor: formData.isPrimary ? colors.primary : colors.grayScale3 }
              ]}>
                <View style={[
                  localStyles.toggleThumb,
                  {
                    backgroundColor: colors.white,
                    transform: [{ translateX: formData.isPrimary ? moderateScale(20) : 0 }]
                  }
                ]} />
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Action Buttons */}
        <View style={localStyles.actionButtons}>
          <TouchableOpacity
            style={[localStyles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={editingAddress || addingAddress}
          >
            {(editingAddress || addingAddress) ? (
              <ZLoader size="small" color={colors.white} />
            ) : (
              <ZText type="B16" color={colors.white}>
                {strings.saveAddress}
              </ZText>
            )}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={[localStyles.deleteButton, { backgroundColor: colors.red }]}
              onPress={handleDelete}
              disabled={deletingAddress}
            >
              {deletingAddress ? (
                <ZLoader size="small" color={colors.white} />
              ) : (
                <ZText type="B16" color={colors.white}>
                  {strings.deleteAddress}
                </ZText>
              )}
            </TouchableOpacity>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(20),
  },
  section: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(24),
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
  addressTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    marginHorizontal: moderateScale(4),
  },
  addressTypeText: {
    marginLeft: moderateScale(8),
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
  mapContainer: {
    minHeight: moderateScale(80),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
  },
  locationInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
    marginRight: moderateScale(8),
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: moderateScale(8),
    alignItems: 'center',
  },
  customMarker: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryToggle: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  primaryToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleSwitch: {
    width: moderateScale(50),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(2),
  },
  toggleThumb: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
  },
  actionButtons: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
  },
  saveButton: {
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EditAddress;