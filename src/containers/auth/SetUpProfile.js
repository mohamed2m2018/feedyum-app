/* eslint-disable curly */
// Libraries import
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import React, { createRef, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { Dropdown } from 'react-native-element-dropdown';
import { useForm, Controller } from 'react-hook-form';
import ImagePicker from 'react-native-image-crop-picker';
import { Image as ImageCompressor } from 'react-native-compressor';
import LinearGradient from 'react-native-linear-gradient';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import images from '../../assets/images';
import { styles } from '../../themes';
import {
  ACCESS_TOKEN,
  getGenderData,
  getHeight,
  moderateScale,
} from '../../common/constants';
import ZInput from '../../components/common/ZInput';
import { validateName } from '../../utils/validators';
import ZPhoneInput from '../../components/common/ZPhoneInput';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import { StackNav } from '../../navigation/NavigationKeys';
import ProfilePicture from '../../components/models/ProfilePicture';
import ZButton from '../../components/common/ZButton';
import request from '../../api/request';
import branchService from '../../api/branchService';
import { showErrorToast } from '../../utils/toast';
import { useQuery, useQueryClient } from 'react-query';
import { OneSignal } from 'react-native-onesignal';
import { RNS3 } from 'react-native-aws3';
import ZText from '../../components/common/ZText';
import { useStorage } from '../../utils/useStorage';

const SetUpProfile = props => {
  const { navigation } = props;
  const headerTitle = props.route.params.title;
  const { email, password, type } = props.route.params;

  const colors = useSelector(state => state.theme.theme);
  const ProfilePictureSheetRef = createRef();

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  // This screen is now registration-only
  const isChef = type === 'chef';

  // State for locations (branches for chefs)
  const [locations, setLocations] = useState([]);

  const { control, handleSubmit: hookFormSubmit, formState: { errors, isValid }, clearErrors } = useForm({
    defaultValues: { fullName: '', phoneNo: '', bio: '' },
    mode: 'onChange'
  });

  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const phoneInputRef = useRef(null);
  const [gender, setGender] = useState('');
  const [fullNameInputStyle, setFullNameInputStyle] = useState(BlurredStyle);
  const [phoneNoInputStyle, setPhoneNoInputStyle] = useState(BlurredStyle);
  const [bioStyle, setBioStyle] = useState(BlurredStyle);
  const [selectImage, setSelectImage] = useState(null);
  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [locationsError, setLocationsError] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

  const onFocusFullName = () => onFocusInput(setFullNameInputStyle);
  const onFocusPhoneNo = () => onFocusInput(setPhoneNoInputStyle);

  const onBlurFullName = () => onBlurInput(setFullNameInputStyle);
  const onBlurPhoneNo = () => onBlurInput(setPhoneNoInputStyle);

  const onFocusBio = () => onFocusInput(setBioStyle);

  const onBlurBio = () => onBlurInput(setBioStyle);
  const onChangedGender = text => setGender(text.value.toLowerCase());
  const [_, setAccessToken] = useStorage(ACCESS_TOKEN);
  const queryClient = useQueryClient();

  const handlePhoneValidation = (isValid) => {
    setIsPhoneValid(isValid);
    if (!isValid) {
      setPhoneError(strings.invalidPhoneNumber || 'Invalid phone number');
    } else {
      setPhoneError('');
      clearErrors('phoneNo');
    }
  };

  const onInvalidSubmit = () => {
    if (type === 'chef' && locations.length === 0) {
      setLocationsError(true);
    }
    if (!selectImage) setPhotoError(true);
  };

  const handleSubmit = async (data) => {
    const { fullName, phoneNo, bio } = data;

    if (!selectImage) {
      setPhotoError(true);
      showErrorToast(strings.error, strings.profilePhotoRequired || 'Profile photo is required');
      return;
    }

    if (type === 'user' && !gender) {
      showErrorToast(strings.error, strings.genderRequired || 'Gender is required');
      return;
    }

    if (type === 'chef' && locations.length === 0) {
      setLocationsError(true);
      showErrorToast(strings.error, strings.dontHaveBranches || 'Please add at least one branch');
      return;
    }

    // Check if phone is available (not already registered)
    setIsSubmitting(true);
    try {
      const checkResponse = await request.post('/user/check-availability', {
        phone: phoneNo,
      });
      if (checkResponse?.data?.fields?.phone?.available === false) {
        setIsSubmitting(false);
        showErrorToast(strings.error, strings.phoneAlreadyRegistered);
        setPhoneError(strings.phoneAlreadyRegistered);
        return;
      }
    } catch (error) {
      // Phone check failed, proceed anyway
    }

    try {
      // Create user account (without locations - we'll add branches separately)
      const res = await request.post('/user', {
        fullName,
        phone: phoneNo,
        gender,
        email,
        password,
        type,
        avatar: selectImage,
        bio,
        // Don't send locations here - use ChefBranch API instead
      });

      setAccessToken(res?.data?.token);
      try {
        OneSignal.logout(); // Clear stale identity from previous user on this device
        OneSignal.login(String(res?.data?.user?._id));
      } catch (e) {
        console.warn('[SetUpProfile] OneSignal identity switch failed:', e);
      }

      // If chef with locations, create branches using ChefBranch API
      if (type === 'chef' && locations.length > 0) {
        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i];
          try {
            await branchService.addBranch({
              branchName: loc.branchName || `Branch ${i + 1}`,
              streetName: loc.streetName || loc.description?.split(',')[0] || 'Street',
              buildingNumber: loc.buildingNumber || '1',
              area: loc.area || loc.city || 'Area',
              city: loc.city || 'City',
              state: loc.state || 'State',
              country: loc.country || 'Egypt',
              postalCode: loc.postalCode || '00000',
              lat: parseFloat(loc.latitude),
              long: parseFloat(loc.longitude),
              phoneNumber: loc.contactPhone || phoneNo,
              countryCode: loc.countryCode || '+20',
              isPrimary: i === 0, // First branch is primary
              
              // Defaults since we don't ask for these in SetUpProfile
              deliveryRadius: loc.deliveryRadius || 20,
              deliveryFee: loc.deliveryFee || 0,
              areaDeliveryFees: loc.areaDeliveryFees || [],
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              orderMode: loc.orderMode || 'asap',
              minLeadTime: loc.minLeadTime || 60,
              slotDuration: loc.slotDuration || 60,
              excludedAreas: loc.excludedAreas || [],
              operatingHours: []
            });
          } catch (branchError) {
            console.log('Failed to create branch:', branchError);
            // Continue with other branches
          }
        }
      }

      await queryClient.clear();
      setIsSubmitting(false);
      navigation.reset({
        index: 0,
        routes: [{ name: StackNav.TabBar }],
      });
    } catch (err) {
      setIsSubmitting(false);
      showErrorToast(strings.error, err[Object.keys(err)?.[0]]);
    }
  };

  // Helper function to upload image via backend API
  const uploadImageToBackend = async (imagePath, mimeType) => {
    let formattedPath = imagePath;
    if (Platform.OS === 'android' && !imagePath.startsWith('file://') && !imagePath.startsWith('http')) {
      formattedPath = `file://${imagePath}`;
    } else if (Platform.OS === 'ios' && !imagePath.startsWith('file://') && !imagePath.startsWith('http')) {
      formattedPath = `file://${imagePath}`;
    }

    const formData = new FormData();
    formData.append('image', {
      uri: formattedPath,
      type: mimeType || 'image/jpeg',
      name: 'profile_' + Date.now() + '.jpg',
    });

    // Use public endpoint for registration
    const uploadEndpoint = '/user/upload-profile-picture';

    const response = await request.post(uploadEndpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response?.data?.success && response?.data?.url) {
      return response.data.url;
    }
    throw new Error('Upload failed');
  };

  const onPressCamera = async () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      cropping: true,
      includeBase64: false,
    }).then(async response => {
      ProfilePictureSheetRef?.current?.hide();
      setisPhotoUploading(true);
      try {
        const result = await ImageCompressor.compress(response.path, {
          compressionMethod: 'auto',
        });
        const secureUrl = await uploadImageToBackend(result, response.mime);
        console.log('Camera upload successful:', secureUrl);
        setSelectImage(secureUrl);
        setPhotoError(false);
        setisPhotoUploading(false);
      } catch (error) {
        console.log('Camera upload error:', error);
        setisPhotoUploading(false);
        showErrorToast(strings.error, strings.uploadFailed || 'Upload failed');
      }
    }).catch(error => {
      // User cancelled
    });
  };

  const onPressGallery = async () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      includeBase64: false,
    }).then(async response => {
      ProfilePictureSheetRef?.current?.hide();
      setisPhotoUploading(true);
      try {
        const result = await ImageCompressor.compress(response.path, {
          compressionMethod: 'auto',
        });
        const secureUrl = await uploadImageToBackend(result, response.mime);
        console.log('Gallery upload successful:', secureUrl);
        setSelectImage(secureUrl);
        setPhotoError(false);
        setisPhotoUploading(false);
      } catch (error) {
        console.log('Gallery upload error:', error);
        setisPhotoUploading(false);
        showErrorToast(strings.error, strings.uploadFailed || 'Upload failed');
      }
    }).catch(error => {
      // User cancelled
    });
  };



  const onPressContinue = () => {
    handleSubmit();
  };

  const [locationIndexToEdit, setlocationIndexToEdit] = useState();

  const handleLocationSelect = (newLocation) => {
    setLocationsError(false);
    // Adapt newLocation to the structure SetUpProfile expects
    const adaptedLocation = {
      description: newLocation.formattedAddress || newLocation.address || '',
      latitude: newLocation.lat || newLocation.latitude,
      longitude: newLocation.long || newLocation.longitude,
      ...newLocation
    };

    if (locationIndexToEdit !== undefined && locationIndexToEdit !== null) {
      setLocations(prev => {
        const newLocs = [...prev];
        newLocs[locationIndexToEdit] = adaptedLocation;
        return newLocs;
      });
      setlocationIndexToEdit(null);
    } else {
      setLocations(prev => [...prev, adaptedLocation]);
    }
  };

  const onPressProfilePic = () => ProfilePictureSheetRef?.current.show();

  const onPressLocation = () => {
    setlocationIndexToEdit(null);
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: handleLocationSelect,
      isChefBranch: true,
    });
  };

  const onEditLocation = index => {
    setlocationIndexToEdit(index);
    const loc = locations[index];
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: handleLocationSelect,
      isChefBranch: true,
      initialLocation: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.description
      },
    });
  };

  const onDeleteLocation = indexToDelete => {
    setLocations(l => l.filter((_, index) => index !== indexToDelete));
  };

  // Get user type for display (registration only - type from params)
  const showBranches = type === 'chef';

  return (
    <ZSafeAreaView>
      <ZHeader title={headerTitle} />
      <ZKeyBoardAvoidWrapper containerStyle={localStyles.container}>
        {/* Premium Avatar Section */}
        <View style={localStyles.avatarSection}>
          <TouchableOpacity
            onPress={onPressProfilePic}
            activeOpacity={0.8}
            style={localStyles.avatarWrapper}>
            <LinearGradient
              colors={photoError ? [colors.lightRed, colors.lightRed + '80'] : [colors.primary, colors.primary + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={localStyles.avatarGradientBorder}>
              <View style={[localStyles.avatarInner, { backgroundColor: colors.backgroundColor }]}>
                {isPhotoUploading ? (
                  <ActivityIndicator size={'large'} color={colors.primary} />
                ) : selectImage ? (
                  <Image source={{ uri: selectImage }} style={localStyles.userImage} />
                ) : (
                  <Image
                    source={colors.dark ? images.userDark : images.userLight}
                    style={localStyles.userImage}
                  />
                )}
              </View>
            </LinearGradient>
            {!isPhotoUploading && (
              <View style={[localStyles.cameraIconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons
                  name="camera"
                  size={moderateScale(16)}
                  color={colors.white}
                />
              </View>
            )}
          </TouchableOpacity>
          <ZText type="m14" color={photoError ? colors.lightRed : colors.grayScale5} style={localStyles.avatarHint}>
            {selectImage
              ? (strings.tapToChangePhoto || 'Tap to change photo')
              : (strings.addPhoto || 'Add photo')
            }
          </ZText>
        </View>

        {/* Form Section with Cards */}
        <View style={localStyles.formSection}>
          {/* Personal Information Card */}
          <View style={[localStyles.formCard, { backgroundColor: colors.dark ? colors.inputBg : colors.white }]}>
            <View style={localStyles.cardHeader}>
              <View style={[localStyles.cardIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="person" size={moderateScale(18)} color={colors.primary} />
              </View>
              <ZText type="b16" color={colors.textColor}>{strings.aboutYou}</ZText>
            </View>

            <Controller
              control={control}
              name="fullName"
              rules={{
                required: strings.thisFieldIsMandatory,
                validate: (value) => {
                  const { status, msg } = validateName(value.trim());
                  return status || msg;
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ZInput
                  placeHolder={type === 'user' ? strings.fullName : (strings.fullNameChef || strings.fullName)}
                  keyboard
                  insideLeftIcon={() => (
                    <EntypoIcon
                      name="text"
                      size={moderateScale(18)}
                      color={colors.grayScale5}
                    />
                  )}
                  _value={value}
                  _errorText={errors.fullName?.message}
                  autoCapitalize={'none'}
                  toGetTextFieldValue={onChange}
                  inputContainerStyle={[
                    localStyles.inputStyle,
                    { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
                    fullNameInputStyle,
                  ]}
                  _onFocus={onFocusFullName}
                  _onBlur={() => { onBlur(); onBlurFullName(); }}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNo"
              rules={{
                required: strings.thisFieldIsMandatory,
                validate: () => (phoneInputRef.current?.isValidNumber() || isPhoneValid) || strings.pleaseProvideCorrectNo
              }}
              render={({ field: { onChange, value } }) => (
                <ZPhoneInput
                  ref={phoneInputRef}
                  value={value}
                  defaultCode="EG"
                  placeholder={strings.phoneNumber}
                  onChangeText={onChange}
                  onValidation={handlePhoneValidation}
                  errorText={errors.phoneNo?.message || phoneError}
                  containerStyle={localStyles.phoneInputContainer}
                />
              )}
            />

            <Controller
              control={control}
              name="bio"
              rules={{
                required: type !== 'user' ? strings.thisFieldIsMandatory : false
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ZInput
                  placeHolder={strings.addBio}
                  _value={value}
                  _errorText={errors.bio?.message}
                  multiline
                  _autoFocus={props.route.params?.isEditBio}
                  toGetTextFieldValue={onChange}
                  insideLeftIcon={() => (
                    <Ionicons
                      style={{ position: 'relative', top: -18 }}
                      name="information-circle"
                      size={moderateScale(20)}
                      color={colors.grayScale5}
                    />
                  )}
                  inputContainerStyle={[
                    localStyles.bioInputStyle,
                    { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
                    bioStyle,
                  ]}
                  _onFocus={onFocusBio}
                  _onBlur={() => { onBlur(); onBlurBio(); }}
                />
              )}
            />

            {type === 'user' && (
              <Dropdown
                style={[
                  localStyles.dropdownStyle,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.bColor,
                  },
                ]}
                placeholderStyle={{ color: colors.grayScale5, fontSize: moderateScale(14) }}
                data={getGenderData()}
                renderRightIcon={() => (
                  <FontAwesome
                    style={{ paddingRight: 10 }}
                    name="chevron-down"
                    size={12}
                    color={colors.textColor}
                  />
                )}
                maxHeight={moderateScale(180)}
                labelField="label"
                valueField="value"
                placeholder={strings.gender}
                value={gender}
                itemTextStyle={{
                  color: colors.textColor,
                  fontSize: moderateScale(14),
                }}
                onChange={onChangedGender}
                selectedTextStyle={{
                  color: colors.textColor,
                  fontSize: moderateScale(14),
                }}
                itemContainerStyle={{
                  backgroundColor: colors.inputBg,
                }}
                containerStyle={{
                  backgroundColor: colors.inputBg,
                  borderRadius: moderateScale(12),
                  borderWidth: 0,
                }}
                activeColor={colors.dark ? colors.primary + '40' : colors.primary + '20'}
              />
            )}
          </View>

          {/* Branches Section - Only for Chefs */}
          {showBranches && (
            <View style={[localStyles.formCard, { backgroundColor: colors.dark ? colors.inputBg : colors.white }]}>
              <View style={localStyles.cardHeader}>
                <View style={[localStyles.cardIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="location" size={moderateScale(18)} color={colors.primary} />
                </View>
                <ZText type="b16" color={colors.textColor}>{strings.yourBranches}</ZText>
                <TouchableOpacity
                  onPress={onPressLocation}
                  style={[localStyles.addBranchButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={moderateScale(18)} color={colors.white} />
                </TouchableOpacity>
              </View>

              {(locations?.length === 0 || !locations) && (
                <View style={localStyles.emptyBranchesContainer}>
                  <Ionicons name="location-outline" size={moderateScale(40)} color={locationsError ? colors.lightRed : colors.grayScale4} />
                  <ZText type="m14" color={locationsError ? colors.lightRed : colors.grayScale5} style={localStyles.emptyBranchesText}>
                    {strings.dontHaveBranches}
                  </ZText>
                </View>
              )}

              {locations?.map?.((item, index) => (
                <View
                  key={index}
                  style={[localStyles.branchItem, { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg }]}>
                  <View style={localStyles.branchInfo}>
                    <Ionicons
                      name="location"
                      size={moderateScale(20)}
                      color={colors.primary}
                      style={localStyles.branchIcon}
                    />
                    <ZText type="m14" numberOfLines={2} style={localStyles.branchText}>
                      {item.description}
                    </ZText>
                  </View>
                  <View style={localStyles.branchActions}>
                    <TouchableOpacity
                      onPress={() => onEditLocation(index)}
                      style={[localStyles.branchActionBtn, { backgroundColor: colors.primary + '15' }]}>
                      <MaterialIcon name="pencil" size={moderateScale(16)} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteLocation(index)}
                      style={[localStyles.branchActionBtn, { backgroundColor: '#FF6B6B15' }]}>
                      <MaterialIcon name="delete" size={moderateScale(16)} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ZKeyBoardAvoidWrapper>

      {/* Action Button - Registration only */}
      <View style={localStyles.btnContainer}>
        <ZButton
          title={strings.continue}
          textType={'b18'}
          disabled={isPhotoUploading || isSubmitting}
          color={colors.white}
          isLoading={isPhotoUploading || isSubmitting}
          containerStyle={localStyles.continueButton}
          onPress={hookFormSubmit(handleSubmit, onInvalidSubmit)}
        />
      </View>
      <ProfilePicture
        onPressCamera={onPressCamera}
        onPressGallery={onPressGallery}
        SheetRef={ProfilePictureSheetRef}
      />
    </ZSafeAreaView>
  );
};

export default SetUpProfile;

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradientBorder: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    padding: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: moderateScale(112),
    height: moderateScale(112),
    borderRadius: moderateScale(56),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    width: moderateScale(112),
    height: moderateScale(112),
    borderRadius: moderateScale(56),
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: moderateScale(4),
    right: moderateScale(4),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    marginTop: moderateScale(12),
  },

  // Form Section
  formSection: {
    flex: 1,
  },
  formCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  cardIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },

  // Input Styles
  inputStyle: {
    height: getHeight(56),
    borderRadius: moderateScale(14),
    borderWidth: moderateScale(1),
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  bioInputStyle: {
    height: getHeight(100),
    borderRadius: moderateScale(14),
    borderWidth: moderateScale(1),
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
    paddingTop: moderateScale(14),
  },
  dropdownStyle: {
    height: getHeight(56),
    borderRadius: moderateScale(14),
    borderWidth: moderateScale(1),
    paddingHorizontal: moderateScale(20),
    marginTop: moderateScale(4),
  },
  phoneInputContainer: {
    marginVertical: moderateScale(4),
  },

  // Branches Section
  addBranchButton: {
    marginLeft: 'auto',
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBranchesContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(24),
  },
  emptyBranchesText: {
    marginTop: moderateScale(12),
    textAlign: 'center',
    paddingHorizontal: moderateScale(20),
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  branchIcon: {
    marginRight: moderateScale(12),
  },
  branchText: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  branchActions: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  branchActionBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button Styles
  updateButton: {
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(60),
    borderRadius: moderateScale(14),
    height: moderateScale(56),
  },
  btnContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(60),
  },
  continueButton: {
    borderRadius: moderateScale(14),
    height: moderateScale(56),
  },

  // Dropdown Styles
  dropdownCard: {
    marginTop: moderateScale(8),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  dropdownIconContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  dropdownChevron: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(6),
    marginVertical: moderateScale(2),
  },
});
