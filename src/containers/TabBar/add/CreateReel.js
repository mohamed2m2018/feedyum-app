// Library import
import {
  ActivityIndicator,
  I18nManager,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import {
  PERMISSIONS,
  request as requestPermission,
  check as checkPermission,
  RESULTS,
} from 'react-native-permissions';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import { styles } from '../../../themes';
import { getHeight, moderateScale } from '../../../common/constants';
import typography from '../../../themes/typography';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import { useQuery } from 'react-query';
import request from '../../../api/request';
import { showErrorToast, showSuccessToast, showInfoToast, showWarningToast } from '../../../utils/toast';
import { reelFormResolver, buildReelSubmitData } from './utils/reelFormValidation';
import BottomActionSheet from '../../../components/models/BottomActionSheet';
import images from '../../../assets/images';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useBackgroundUpload } from '../../../providers/BackgroundUploadProvider';
import { useScreen } from '../../../navigation/screenContext';
import AttachedDishesComponent from './components/AttachedDishesComponent';
import RestaurantSearch from '../../../components/RestaurantSearch';
import DishSelector from '../../../components/DishSelector';
import RatingInput from '../../../components/RatingInput';
import ZPhoneInput from '../../../components/common/ZPhoneInput';
import branchService from '../../../api/branchService';

// Default form values for RHF
const DEFAULT_FORM_VALUES = {
  title: '',
  caption: '',
  attachedDishes: [],
  phone: '',
  selectedRestaurant: null,
  selectedDish: null,
  rating: 0,
  locations: [],
};

export default function PostDetail() {

  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();

  const { currentScreen: previousScreen } = useScreen();
  const postDataToBeEdited = route?.params?.postDataToBeEdited;
  const isImage = route.params?.isImage;
  const mediaData = route.params?.mediaData;
  const [mediaIsEdited, setmediaIsEdited] = useState(false);
  const {
    handleDataToBeSent,
    handleEditUser,
    uploadData,
    setisFormFilled,
    handleEditedData,
  } = useBackgroundUpload();

  // Fetch current user
  const { data: queryResult } = useQuery('user', () => request.get('/user'), {
    retry: 1,
    onError: err => {
      showErrorToast(strings.error, err[Object.keys(err)?.[0]] || strings.errorOccured);
    },
  });
  const user = queryResult?.data?.user;

  // ─── React Hook Form ──────────────────────────────────────────────────────────
  const {
    setValue, watch, reset,
    handleSubmit: rhfHandleSubmit,
    formState: { errors: formErrors },
  } = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onTouched',
    resolver: (values) => reelFormResolver(values, {
      userType: user?.type || 'chef',
      isEditing: !!postDataToBeEdited,
      userHasPhone: !!user?.phone,
      hasBranches: !!(branchesData?.branches?.length),
    }),
  });

  const formData = watch();

  // Convenience: update a field with validation
  const updateField = useCallback((field, value) => {
    setValue(field, value, { shouldValidate: false });
  }, [setValue]);

  // ─── Non-form UI state ────────────────────────────────────────────────────────
  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [locations, setLocations] = useState([]);
  const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });

  // ─── Initialize edit mode ────────────────────────────────────────────────────
  useEffect(() => {
    if (postDataToBeEdited) {
      const editData = {
        ...postDataToBeEdited,
        attachedDishes: postDataToBeEdited.dishes || postDataToBeEdited.attachedDishes || [],
      };
      // Populate RHF
      reset({
        title: editData.title || '',
        caption: editData.caption || '',
        attachedDishes: editData.attachedDishes || [],
        phone: '',
        selectedRestaurant: null,
        selectedDish: null,
        rating: editData.rating || 0,
        locations: [],
      });
      handleEditedData({
        ...editData,
        isImage: isImage || editData.avatarUri,
        isEdit: true,
        mediaIsEdited,
      });
      setlocalUri(editData?.poster || editData?.avatarUri || '');
    }
  }, [postDataToBeEdited, mediaIsEdited]);

  // Handle pre-captured media from modal
  useEffect(() => {
    if (mediaData && mediaData.path) {
      if (mediaData.duration && mediaData.duration > 60000) {
        showErrorToast(strings.error, strings.maxDuration);
        return;
      }
      setlocalUri(mediaData.path);
      const isMediaImage = !mediaData.duration;
      uploadData(mediaData, setisPhotoUploading, setlocalUri, isMediaImage, false);
    }
  }, [mediaData]);

  // Fetch chef branches
  const { data: branchesData } = useQuery(
    ['chefBranches', user?._id],
    () => branchService.getBranches(user?._id),
    {
      retry: 0,
      enabled: !!user?._id && user?.type === 'chef',
      refetchOnMount: true,
      onSuccess: res => {
        const adaptedLocations = (res?.branches || []).map(branch => ({
          _id: branch._id,
          description: branch.addressDetails?.formattedAddress || branch.branchName,
          lat: branch.location?.lat,
          long: branch.location?.long,
          latitude: branch.location?.lat,
          longitude: branch.location?.long,
          city: branch.addressDetails?.city,
          country: branch.addressDetails?.country,
        }));
        setLocations(adaptedLocations);
      },
      onError: () => { },
    },
  );



  const handleUpload = async (response, isImage) => {
    uploadData(
      response,
      setisPhotoUploading,
      setlocalUri,
      isImage,
      isPhotoUploading,
    );
  };

  const handleLocationSelect = (newLocation) => {
    // Adapt newLocation to the structure PostDetail expects
    const adaptedLocation = {
      description: newLocation.formattedAddress || newLocation.address || '',
      lat: newLocation.lat || newLocation.latitude,
      long: newLocation.long || newLocation.longitude,
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
      setlocationIndexToEdit(undefined);
    } else {
      setLocations(prev => [...prev, adaptedLocation]);
    }
  };

  const onPressLocation = () => {
    setlocationIndexToEdit(undefined);
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: handleLocationSelect,
      isChefBranch: true,
    });
  };

  // ─── RHF Submit Handlers ───────────────────────────────────────────────────────

  // Called only when validation passes
  const onFormSubmit = useCallback(async (data) => {
    // Include locations from separate state into the data for buildReelSubmitData
    const valuesWithLocations = { ...data, locations };

    const dataToBeSent = buildReelSubmitData(valuesWithLocations, {
      user,
      mediaIsEdited,
      postDataToBeEdited,
    });

    handleDataToBeSent(dataToBeSent);
    handleEditUser(data.phone, locations);
    setisFormFilled(true);

    setTimeout(() => {
      console.log('[PostDetail] User type:', user?.type, 'Navigating to:', user?.type === 'chef' ? 'ProfileTab' : 'ForYou');
      if (user?.type === 'chef') {
        navigation.navigate(StackNav.TabBar, { screen: TabNav.ProfileTab });
      } else {
        navigation.navigate(StackNav.TabBar, { screen: TabNav.ForYou });
      }
    }, 100);
  }, [user, mediaIsEdited, postDataToBeEdited, locations, handleDataToBeSent, handleEditUser, setisFormFilled, navigation]);

  // Called when validation fails — shows first error as toast
  const onFormError = useCallback((errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showWarningToast(strings.error, firstError.message);
    }
  }, []);

  // Main submit — checks menu first (for chef), then runs RHF validation + submit
  const onPressHome = useCallback(async () => {
    // If chef, ensure they have at least one dish in menu before posting
    if (user?.type === 'chef') {
      try {
        const menuResponse = await request.get(`/menus/chef/${user?._id}`);
        const menuId = menuResponse?.data?._id;
        if (!menuId) {
          setModalState({
            visible: true,
            title: strings.createMenuFirst,
            message: strings.createMenuMessage,
          });
          return;
        }

        const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
        const dishes = dishesResponse?.data || [];
        if (!Array.isArray(dishes) || dishes.length === 0) {
          setModalState({
            visible: true,
            title: strings.noDishesFound,
            message: strings.noDishesMessage,
          });
          return;
        }
      } catch (e) {
        setModalState({
          visible: true,
          title: strings.noDishesFound,
          message: strings.noDishesMessage,
        });
        return;
      }
    }

    // Inject locations into form values for the resolver (since locations are separate state)
    setValue('locations', locations, { shouldValidate: false });

    // RHF handles validation + calls onFormSubmit or onFormError
    await rhfHandleSubmit(onFormSubmit, onFormError)();
  }, [user, locations, setValue, rhfHandleSubmit, onFormSubmit, onFormError]);

  const handleMedia = value => {
    setmediaIsEdited(true);
    if (value.duration && value.duration > 60000) {
      showErrorToast(strings.error, strings.maxDuration);
      return;
    }
    setlocalUri(value.path);
    if (value.duration) {
      handleUpload(value, false);
    } else {
      handleUpload(value, true);
    }
  };

  const [locationIndexToEdit, setlocationIndexToEdit] = useState();

  const onEditLocation = index => {
    setlocationIndexToEdit(index);
    const loc = locations[index];
    navigation.navigate(StackNav.MapLocationPicker, {
      onLocationSelect: handleLocationSelect,
      isChefBranch: true,
      initialLocation: {
        latitude: loc.lat || loc.latitude,
        longitude: loc.long || loc.longitude,
        address: loc.description
      },
    });
  };
  const onDeleteLocation = indexToDelete => {
    setLocations(l => l.filter((_, index) => index !== indexToDelete));
  };

  // Permission request functions
  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      // First check existing status to avoid unnecessary prompts
      const currentStatus = await checkPermission(permission);
      if (currentStatus === RESULTS.GRANTED) {
        return true;
      }

      if (currentStatus === RESULTS.DENIED) {
        const result = await requestPermission(permission);
        return result === RESULTS.GRANTED;
      }

      // BLOCKED or UNAVAILABLE
      return false;
    } catch (error) {

      return false;
    }
  };

  const requestPhotoLibraryPermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      // Check status first
      const currentStatus = await checkPermission(permission);
      if (
        currentStatus === RESULTS.GRANTED ||
        (Platform.OS === 'ios' && currentStatus === RESULTS.LIMITED)
      ) {
        return true;
      }

      if (currentStatus === RESULTS.DENIED) {
        const result = await requestPermission(permission);
        return (
          result === RESULTS.GRANTED ||
          (Platform.OS === 'ios' && result === RESULTS.LIMITED)
        );
      }

      // BLOCKED or UNAVAILABLE
      return false;
    } catch (error) {

      return false;
    }
  };

  const showPermissionAlert = (type) => {
    showActionDialog({
      type: ALERT_TYPE.WARNING,
      title: strings.permissionRequired,
      message: strings.permissionMessage.replace('{type}', type),
      confirmText: strings.settings,
      cancelText: strings.cancel,
      onConfirm: () => Linking.openSettings(),
    });
  };

  const handleCaptureVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }

    ImagePicker.openCamera({
      mediaType: 'video',
      cropping: false,
      maximumVideoDuration: 60,
    })
      .then(handleMedia)
      .catch(() => { });
  };

  const handleCaptureImage = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }

    ImagePicker.openCamera({
      cropping: true,
      compressImageQuality: 1,
    })
      .then(handleMedia)
      .catch(() => { });
  };

  const handlepickImage = async () => {
    try {
      // Try to open directly; iOS will prompt if needed
      const res = await ImagePicker.openPicker({
        mediaType: 'image',
        cropping: true,
        compressImageQuality: 1,
      });
      handleMedia(res);
    } catch (err) {
      const message = String(err?.message || err?.toString?.() || '');
      const code = err?.code;
      const permissionError =
        code === 'E_PERMISSION_MISSING' ||
        message.includes('permission') ||
        message.includes('denied') ||
        message.includes('not authorized');
      if (permissionError) {
        showPermissionAlert('Photo Library');
      } else if (code !== 'E_PICKER_CANCELLED') {

      }
    }
  };

  // Pick any media type (photos or videos) from gallery
  const handlePickAny = async () => {
    try {
      const res = await ImagePicker.openPicker({
        mediaType: 'any',
        compressImageQuality: 1,
        compressVideoPreset: 'MediumQuality',
      });
      handleMedia(res);
    } catch (err) {
      const message = String(err?.message || err?.toString?.() || '');
      const code = err?.code;
      const permissionError =
        code === 'E_PERMISSION_MISSING' ||
        message.includes('permission') ||
        message.includes('denied') ||
        message.includes('not authorized');
      if (permissionError) {
        showPermissionAlert('Photo Library');
      } else if (code !== 'E_PICKER_CANCELLED') {

      }
    }
  };

  const handlePickVideo = async () => {
    try {
      const res = await ImagePicker.openPicker({
        mediaType: 'video',
        compressVideoPreset: 'HighestQuality',
      });
      handleMedia(res);
    } catch (err) {
      const message = String(err?.message || err?.toString?.() || '');
      const code = err?.code;
      const permissionError =
        code === 'E_PERMISSION_MISSING' ||
        message.includes('permission') ||
        message.includes('denied') ||
        message.includes('not authorized');
      if (permissionError) {
        showPermissionAlert('Photo Library');
      } else if (code !== 'E_PICKER_CANCELLED') {

      }
    }
  };

  return (
    <ZSafeAreaView>
      <ZHeader
        onPressBack={() => navigation.goBack()}
        title={postDataToBeEdited ? strings.editPost : strings.createNewPost}
      />
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
        extraHeight={150}
        contentContainerStyle={styles.ph10}>
        <View style={localStyles.container}>
          <TouchableOpacity
            onPress={() => {
              setlocalUri('');
            }}>
            {isPhotoUploading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginBottom: 15 }}
                size={'large'}
              />
            ) : (
              <Image
                source={
                  localUri
                    ? {
                      uri: localUri || postDataToBeEdited.poster,
                    }
                    : images.dishPlaceholder
                }
                resizeMode="cover"
                style={
                  !localUri
                    ? localStyles.imageContainernoPhoto
                    : localStyles.imageContainer
                }
              />
            )}
            <ZText
              type={!localUri ? 'b30' : 'b12'}
              color={colors.white}
              align={'center'}
              style={localStyles.coverPhotoStyle}>
              {strings.uploadDishMedia}
            </ZText>
          </TouchableOpacity>
        </View>
        {localUri && (
          <>
            <View style={localStyles.inputsWrapper}>
              <ZInput
                label={strings.title}
                placeholder={strings.titlePlaceholder}
                _value={formData.title}
                toGetTextFieldValue={input => updateField('title', input)}
                _errorText={formErrors.title?.message}
                required
              />

              <ZInput
                label={strings.caption}
                placeholder={strings.captionPlaceholder}
                _value={formData.caption}
                toGetTextFieldValue={input => updateField('caption', input)}
                _errorText={formErrors.caption?.message}
                multiline={true}
                inputContainerStyle={{ height: moderateScale(100) }}
                required
              />
            </View>

            {/* User Review Section - only for regular users */}
            {user?.type !== 'chef' && (
              <>
                {/* Restaurant Search */}
                <View style={localStyles.reviewSection}>
                  <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                    {strings.whereIsThisFrom}
                  </ZText>
                  <RestaurantSearch
                    selectedRestaurant={formData.selectedRestaurant}
                    onRestaurantSelect={(restaurant) => {
                      updateField('selectedRestaurant', restaurant);
                    }}
                    onClear={() => {
                      updateField('selectedRestaurant', null);
                      updateField('selectedDish', null);
                    }}
                    userLocation={{
                      lat: locations?.[0]?.lat,
                      lng: locations?.[0]?.long || locations?.[0]?.lng,
                      country: user?.country || user?.chefSettings?.country
                    }}
                  />
                </View>

                {/* Dish Selector - only show if restaurant selected */}
                {formData.selectedRestaurant && (
                  <View style={localStyles.reviewSection}>
                    <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                      {strings.whatDidYouOrder}
                    </ZText>
                    <DishSelector
                      restaurant={formData.selectedRestaurant}
                      selectedDish={formData.selectedDish}
                      onDishSelect={(dish) => updateField('selectedDish', dish)}
                      onClear={() => updateField('selectedDish', null)}
                    />
                  </View>
                )}

                {/* Rating - only show if dish selected */}
                {formData.selectedDish && (
                  <View style={localStyles.reviewSection}>
                    <RatingInput
                      rating={formData.rating}
                      onRatingChange={(val) => updateField('rating', val)}
                      label={strings.rateThisDishOptional}
                    />
                  </View>
                )}
              </>
            )}

            {user?.type === 'chef' && (
              <>
                {/* Attach Dishes Section */}
                <View style={localStyles.attachDishesSection}>
                  <View style={localStyles.sectionHeader}>
                    <ZText type="B18" color={colors.textColor}>
                      {strings.attachDishesFromMenu}
                    </ZText>
                    <ZText type="M12" color={colors.grayScale7}>
                      {strings.showcaseDishesOptional}
                    </ZText>
                  </View>
                  <AttachedDishesComponent
                    colors={colors}
                    userId={user?._id}
                    attachedDishes={formData.attachedDishes || []}
                    onDishesChange={dishes => updateField('attachedDishes', dishes)}
                  />
                </View>
              </>
            )}


            {user?.type === 'chef' && !user?.phone && (
              <ZPhoneInput
                label={strings.phoneNumber}
                value={formData.phone}
                defaultCode="EG"
                placeholder={strings.addPhoneNumberPlaceholder}
                onChangeText={(val) => updateField('phone', val)}
                containerStyle={{ marginTop: moderateScale(10) }}
              />
            )}


            {user?.type === 'chef' &&
              !postDataToBeEdited &&
              !branchesData?.branches?.length && (
                <>
                  <ZText style={{ marginVertical: 10 }} type={'B20'}>
                    {strings.branches}
                  </ZText>

                  {(locations?.length === 0 || !locations) && (
                    <View style={{ flexDirection: 'row' }}>
                      <ZText style={{ marginVertical: 5, width: '70%' }}>
                        {strings.dontHaveBranches}
                      </ZText>
                      <MaterialIcon
                        name="plus"
                        onPress={onPressLocation}
                        size={moderateScale(25)}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  {locations?.map?.((item, index) => (
                    <View style={{ flexDirection: 'row' }}>
                      <ZText style={{ marginVertical: 5, width: '70%' }}>
                        {index + 1}- {item.description}
                      </ZText>
                      <MaterialIcon
                        name="pencil-box"
                        size={moderateScale(25)}
                        onPress={() => onEditLocation(index)}
                        color={colors.primary}
                      />
                      <MaterialIcon
                        name="delete"
                        onPress={() => onDeleteLocation(index)}
                        size={moderateScale(25)}
                        color={colors.primary}
                      />
                      {index === locations.length - 1 && (
                        <MaterialIcon
                          name="plus"
                          onPress={onPressLocation}
                          size={moderateScale(25)}
                          color={colors.primary}
                        />
                      )}
                    </View>
                  ))}
                </>
              )}

          </>
        )}
        <View style={localStyles.btnContainer}>
          {localUri !== '' ? (
            <ZButton
              title={postDataToBeEdited ? strings.Edit : strings.doPost}
              textType={'b18'}
              disabled={isPhotoUploading}
              isLoading={isPhotoUploading}
              color={colors.white}
              containerStyle={localStyles.skipBtnContainer}
              onPress={onPressHome}
            />
          ) : (
            <View>
              {(postDataToBeEdited
                ? postDataToBeEdited.title && postDataToBeEdited.avatarUri
                : isImage) && (
                  <>
                    <ZButton
                      title={strings.uploadDishPhoto}
                      textType={'b18'}
                      color={colors.white}
                      containerStyle={{ paddingHorizontal: 20 }}
                      onPress={handlepickImage}
                    />
                    <View style={{ height: 10 }} />
                    <ZButton
                      title={strings.captureDishPhoto}
                      textType={'b18'}
                      color={colors.white}
                      containerStyle={{ paddingHorizontal: 20 }}
                      onPress={handleCaptureImage}
                    />
                  </>
                )}
              <View style={{ height: 10 }} />

              {(postDataToBeEdited
                ? postDataToBeEdited.title && !postDataToBeEdited.avatarUri
                : !isImage) && (
                  <>
                    <ZButton
                      title={strings.uploadDishVideo}
                      textType={'b18'}
                      color={colors.white}
                      containerStyle={{ paddingHorizontal: 20 }}
                      onPress={handlePickVideo}
                    />
                    <View style={{ height: 10 }} />
                    <ZButton
                      title={strings.captureDishVideo}
                      textType={'b18'}
                      color={colors.white}
                      containerStyle={{ paddingHorizontal: 20 }}
                      onPress={handleCaptureVideo}
                    />
                    <View style={{ height: 10 }} />
                    <ZText>{strings.maxDuration}</ZText>
                  </>
                )}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView >
      {
        modalState.visible && (
          <BottomActionSheet
            visible={modalState.visible}
            title={modalState.title}
            message={modalState.message}
            primaryLabel={strings.openMenuManagement}
            secondaryLabel={strings.notNow}
            onPrimary={() => {
              setModalState({ visible: false, title: '', message: '' });
              navigation.navigate(StackNav.MenuManagement, { fromTabs: true });
            }}
            onClose={() => setModalState({ visible: false, title: '', message: '' })}
          />
        )
      }
    </ZSafeAreaView >
  );
}

const localStyles = StyleSheet.create({
  container: {
    ...styles.rowSpaceBetween,
    alignSelf: 'center',
    ...styles.mt20,
  },
  dropdownStyle: {
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    width: moderateScale(120),
    ...styles.ph15,
    ...styles.mt15,
  },
  inputContainerStyle: {
    ...styles.flex,
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    height: getHeight(150),
    ...styles.p20,
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
    ...styles.mr15,
    ...styles.mt25,
  },
  smallInputContainerStyle: {
    ...styles.flex,
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    height: getHeight(100),
    ...styles.p20,
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
    ...styles.mr15,
    ...styles.mt15,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: moderateScale(20),
    marginBottom: 10,
  },
  imageContainernoPhoto: {
    width: moderateScale(350),
    height: moderateScale(350),
    borderRadius: moderateScale(20),
  },
  coverPhotoStyle: {
    bottom: moderateScale(10),
    ...styles.mt10,
    ...styles.selfCenter,
  },
  categoryContainer: {
    ...styles.flexRow,

    ...styles.mb20,
    ...styles.pv20,
    borderBottomWidth: moderateScale(1),
  },
  hashtagContainer: {
    ...styles.mr10,
    ...styles.rowCenter,
    ...styles.pv10,
    ...styles.ph20,
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
  },
  settingsContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mb15,
  },
  rightContainer: {
    ...styles.flex,
    ...styles.rowEnd,
  },
  shareIcon: {
    ...styles.mb20,
    ...styles.mr20,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    ...styles.center,
  },
  shareContainer: {
    ...styles.mv20,
    ...styles.flexRow,
  },

  skipBtnContainer: {
    width: '45%',
  },
  attachDishesSection: {
    marginVertical: moderateScale(20),
    paddingHorizontal: moderateScale(5),
  },
  sectionHeader: {
    marginBottom: moderateScale(12),
  },
  reviewSection: {
    marginVertical: moderateScale(16),
    paddingHorizontal: moderateScale(5),
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  inputsWrapper: {
    marginVertical: moderateScale(10),
    gap: moderateScale(10),
  },
  btnContainer: {
    ...styles.pv20,
    ...styles.mh20,
    ...styles.rowSpaceAround,
    marginBottom: moderateScale(40), // Add extra bottom margin for safety
    paddingBottom: moderateScale(20),
  },
});
