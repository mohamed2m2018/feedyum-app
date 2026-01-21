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
import React, { useEffect, useState } from 'react';

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
import { showErrorToast, showSuccessToast, showInfoToast } from '../../../utils/toast';
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

export default function PostDetail() {

  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});


  const route = useRoute();

  const { currentScreen: previousScreen } = useScreen();
  const postDataToBeEdited = route?.params?.postDataToBeEdited;
  const isImage = route.params?.isImage;
  const [mediaIsEdited, setmediaIsEdited] = useState(false);
  const {
    handleDataToBeSent,
    handleEditUser,
    uploadData,
    setisFormFilled,
    handleEditedData,
  } = useBackgroundUpload();
  useEffect(() => {
    if (postDataToBeEdited) {
      setpostedData(postDataToBeEdited);
      handleEditedData({
        ...postDataToBeEdited,
        isImage: isImage || postDataToBeEdited.avatarUri,
        isEdit: true,
        mediaIsEdited,
      });

      setlocalUri(
        postDataToBeEdited?.poster || postDataToBeEdited?.avatarUri || '',
      );
    }
  }, [postDataToBeEdited, mediaIsEdited]);
  const { data: queryResult } = useQuery('user', () => request.get('/user'), {
    retry: 1,
    onError: err => {
      showErrorToast(strings.error, err[Object.keys(err)?.[0]] || strings.errorOccured);
    },
  });

  const user = queryResult?.data?.user;

  // Fetch chef branches using ChefBranch API (not legacy User.locations)
  const { data: branchesData } = useQuery(
    ['chefBranches', user?._id],
    () => branchService.getBranches(user?._id),
    {
      retry: 0,
      enabled: !!user?._id && user?.type === 'chef',
      refetchOnMount: true,
      onSuccess: res => {
        // Adapt ChefBranch format to the local locations state format
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

  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [phone, setPhone] = useState();
  const [locations, setLocations] = useState([]);
  const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });

  // Review-specific state for regular users
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [rating, setRating] = useState(0);



  const handleUpload = async (response, isImage) => {
    uploadData(
      response,
      setisPhotoUploading,
      setlocalUri,
      isImage,
      isPhotoUploading,
    );
  };

  const onPressLocation = () => {
    navigation.navigate(StackNav.locations, {
      locationIndexToEdit,
      setlocationIndexToEdit,
      setLocations,
      locations: locations,
    });
  };

  const onPressHome = async () => {
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
        // If fetching fails, fail safe with prompt to manage menu
        setModalState({
          visible: true,
          title: strings.noDishesFound,
          message: strings.noDishesMessage,
        });
        return;
      }
    }

    const validationChef =
      !postedData?.title ||
      !postedData?.caption ||
      (!user?.phone && !phone) ||
      !locations.length;

    // For regular users: require restaurant and dish, but not phone/locations
    const validationUser =
      !postedData?.caption ||
      !selectedRestaurant ||
      !selectedDish;
    const validation = user?.type === 'chef' ? validationChef : validationUser;
    if (validation) {
      showErrorToast(
        strings.error,
        user?.type === 'chef' ? strings.pleaseFillAllInputs : strings.selectRestaurantAndDish
      );
      return;
    }
    if (postedData.caption?.length < 5) {
      showErrorToast(strings.error, strings.descriptionTooShort);
      return;
    }
    if (postedData.title?.length > 45) {
      showErrorToast(strings.error, strings.tooLargeTitle);
      return;
    }



    // Derive categories from attached dishes (fallback to backend default if none)
    const derivedCategories = Array.from(
      new Set(
        (postedData?.attachedDishes || [])
          .flatMap(dish =>
            Array.isArray(dish?.categories) && dish.categories.length
              ? dish.categories
              : [dish?.category],
          )
          .filter(Boolean),
      ),
    );

    const dataToBeSent = {
      ...postedData,
      phone: user?.phone || phone,
      mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
      dishes: postedData?.attachedDishes?.map(dish => dish._id) || [],
    };

    // For regular users, add review-specific fields and mark as review
    if (user?.type !== 'chef') {
      dataToBeSent.isReview = true;
      dataToBeSent.title = selectedDish?.name || dataToBeSent.title; // Use dish name as title

      // Restaurant info
      if (selectedRestaurant?.type === 'partner') {
        dataToBeSent.reviewedChefId = selectedRestaurant.chefId;
      } else {
        dataToBeSent.googlePlaceId = selectedRestaurant.placeId;
        dataToBeSent.restaurantName = selectedRestaurant.name;
        dataToBeSent.restaurantAddress = selectedRestaurant.address;
      }

      // Dish info
      if (selectedDish?.type === 'menu') {
        dataToBeSent.reviewedDishId = selectedDish.dishId;
        dataToBeSent.dishes = [selectedDish.dishId];
      } else {
        dataToBeSent.dishName = selectedDish.name;
      }

      // Rating (optional)
      if (rating > 0) {
        dataToBeSent.rating = rating;
      }
    }

    // Only set category if derived from dishes; otherwise let backend/use existing
    if (derivedCategories.length > 0) {
      dataToBeSent.category = derivedCategories;
    } else {
      delete dataToBeSent.category;
    }

    // Remove fields not needed anymore
    delete dataToBeSent.attachedDishes;
    delete dataToBeSent.price;
    delete dataToBeSent.duration;
    delete dataToBeSent.linkToGo;
    handleDataToBeSent(dataToBeSent);
    handleEditUser(phone, locations);
    setisFormFilled(true);

    setTimeout(() => {
      navigation.navigate(StackNav.TabBar, { screen: TabNav.ForYou });
    }, 100);
  };

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
    navigation.navigate(StackNav.locations, {
      locationIndexToEdit: index,
      setlocationIndexToEdit,
      setLocations,
      locations: locations,
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
        title={strings.post}
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
              postedData.uri = '';
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
                _value={postedData?.title}
                toGetTextFieldValue={input =>
                  setpostedData(currentState => ({
                    ...currentState,
                    title: input,
                  }))
                }
                required
              />

              <ZInput
                label={strings.caption}
                placeholder={strings.captionPlaceholder}
                _value={postedData?.caption}
                toGetTextFieldValue={input =>
                  setpostedData(currentState => ({
                    ...currentState,
                    caption: input,
                  }))
                }
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
                    selectedRestaurant={selectedRestaurant}
                    onRestaurantSelect={setSelectedRestaurant}
                    onClear={() => {
                      setSelectedRestaurant(null);
                      setSelectedDish(null);
                    }}
                    userLocation={{
                      lat: locations?.[0]?.lat,
                      lng: locations?.[0]?.long || locations?.[0]?.lng,
                      country: user?.country || user?.chefSettings?.country
                    }}
                  />
                </View>

                {/* Dish Selector - only show if restaurant selected */}
                {selectedRestaurant && (
                  <View style={localStyles.reviewSection}>
                    <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                      {strings.whatDidYouOrder}
                    </ZText>
                    <DishSelector
                      restaurant={selectedRestaurant}
                      selectedDish={selectedDish}
                      onDishSelect={setSelectedDish}
                      onClear={() => setSelectedDish(null)}
                    />
                  </View>
                )}

                {/* Rating - only show if dish selected */}
                {selectedDish && (
                  <View style={localStyles.reviewSection}>
                    <RatingInput
                      rating={rating}
                      onRatingChange={setRating}
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
                    attachedDishes={postedData?.attachedDishes || []}
                    onDishesChange={dishes =>
                      setpostedData(currentState => ({
                        ...currentState,
                        attachedDishes: dishes,
                      }))
                    }
                  />
                </View>
              </>
            )}


            {user?.type === 'chef' && !user?.phone && (
              <ZPhoneInput
                label={strings.phoneNumber}
                value={phone}
                defaultCode="EG"
                placeholder={strings.addPhoneNumberPlaceholder}
                onChangeText={setPhone}
                containerStyle={{ marginTop: moderateScale(10) }}
              />
            )}


            {user?.type === 'chef' &&
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
