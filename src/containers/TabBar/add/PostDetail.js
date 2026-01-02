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
import React, {useEffect, useState} from 'react';
 
import {useSelector} from 'react-redux';
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
import {styles} from '../../../themes';
import {getHeight, moderateScale} from '../../../common/constants';
import typography from '../../../themes/typography';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {useQuery} from 'react-query';
import request from '../../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import BottomActionSheet from '../../../components/models/BottomActionSheet';
import images from '../../../assets/images';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
 
import {useBackgroundUpload} from '../../../providers/BackgroundUploadProvider';
import {useScreen} from '../../../navigation/screenContext';
import AttachedDishesComponent from './components/AttachedDishesComponent';

export default function PostDetail() {

  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});

 
  const route = useRoute();

  const {currentScreen: previousScreen} = useScreen();
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
  const {data: queryResult} = useQuery('user', () => request.get('/user'), {
    retry: 1,
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: err[Object.keys(err)?.[0]] || strings.errorOccured,
      });
    },
  });

  const user = queryResult?.data?.user;

  const {data: locationsData} = useQuery(
    'location' + user?._id,
    () =>
      request.get('/user/location', {
        params: {
          id: user?._id,
        },
      }),
    {
      retry: 0,
      enabled: !!user?._id,
      refetchOnMount: true,
      onSuccess: res => {
        setLocations(res?.data?.locations);
      },
      onError: err => const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [phone, setPhone] = useState();
  const [locations, setLocations] = useState(locationsData?.data?.locations);
  const [modalState, setModalState] = useState({visible: false, title: '', message: ''});

  

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
            title: 'Create your menu first',
            message: 'To start posting, please create your menu and add your dishes so customers can order easily.',
          });
          return;
        }

        const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
        const dishes = dishesResponse?.data || [];
        if (!Array.isArray(dishes) || dishes.length === 0) {
          setModalState({
            visible: true,
            title: 'No dishes found',
            message: 'We didn’t find any dishes in your menu. Please add at least one dish before posting.',
          });
          return;
        }
      } catch (e) {
        // If fetching fails, fail safe with prompt to manage menu
        setModalState({
          visible: true,
          title: 'No dishes found',
          message: 'We didn’t find any dishes in your menu. Please add at least one dish before posting.',
        });
        return;
      }
    }

    const validationChef =
      !postedData?.title ||
      !postedData?.caption ||
      (!user?.phone && !phone) ||
      !locations.length;

    const validationUser =
      !postedData?.title || !postedData?.caption;
    const validation = user?.type === 'chef' ? validationChef : validationUser;
    if (validation) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: strings.pleaseFillAllInputs,
      });
      return;
    }
    if (postedData.caption?.length < 5) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: strings.descriptionTooShort,
      });
      return;
    }
    if (postedData.title?.length > 45) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: strings.tooLargeTitle,
      });
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
      navigation.navigate(StackNav.TabBar, {screen: TabNav.ForYou});
    }, 100);
  };

  const handleMedia = value => {
    setmediaIsEdited(true);
    if (value.duration && value.duration > 60000) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: strings.maxDuration,
      });
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
    Alert.alert(
      'Permission Required',
      `${type} access is required to use this feature. Please enable it in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() }
      ]
    );
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
      .catch(err => };

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
      .catch(err => };

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
                style={{marginBottom: 15}}
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
            <TextInput
              placeholder={strings.mealName + ' *'}
              multiline={false}
              textAlign={I18nManager.isRTL ? 'right' : 'left'}
              value={postedData?.title}
              onChangeText={input =>
                setpostedData(currentState => ({
                  ...currentState,
                  title: input,
                }))
              }
              placeholderTextColor={colors.placeHolderColor}
              style={[
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.bColor,
                  color: colors.textColor,
                },
                localStyles.smallInputContainerStyle,
              ]}
              inputBoxStyle={localStyles.inputBoxStyle}
            />
            <TextInput
              placeholder={strings.description + ' *'}
              textAlign={I18nManager.isRTL ? 'right' : 'left'}
              multiline={true}
              value={postedData?.caption}
              onChangeText={input => {
                setpostedData(currentState => ({
                  ...currentState,
                  caption: input,
                }));
              }}
              placeholderTextColor={colors.placeHolderColor}
              style={[
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.bColor,
                  color: colors.textColor,
                },
                localStyles.inputContainerStyle,

                {
                  paddingTop: 20,
                },
              ]}
              inputBoxStyle={localStyles.inputBoxStyle}
            />

            {user?.type === 'chef' && (
              <>
                {/* Attach Dishes Section */}
                <View style={localStyles.attachDishesSection}>
                  <View style={localStyles.sectionHeader}>
                    <ZText type="B18" color={colors.textColor}>
                      Attach Dishes from Menu
                    </ZText>
                    <ZText type="M12" color={colors.grayScale7}>
                      Showcase up to 3 dishes (optional)
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

                
                {!user?.phone && (
                  <TextInput
                    placeholder={'Please add your phone number'}
                    textAlign={I18nManager.isRTL ? 'right' : 'left'}
                    multiline={false}
                    value={phone}
                    onChangeText={input => setPhone(input)}
                    placeholderTextColor={colors.placeHolderColor}
                    style={[
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.bColor,
                        color: colors.textColor,
                      },
                      localStyles.smallInputContainerStyle,
                    ]}
                    inputBoxStyle={localStyles.inputBoxStyle}
                  />
                )}
                

                {user?.type === 'chef' &&
                  !locationsData?.data?.locations?.length && (
                    <>
                      <ZText style={{marginVertical: 10}} type={'B20'}>
                        {strings.branches}
                      </ZText>

                      {(locations?.length === 0 || !locations) && (
                        <View style={{flexDirection: 'row'}}>
                          <ZText style={{marginVertical: 5, width: '70%'}}>
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
                        <View style={{flexDirection: 'row'}}>
                          <ZText style={{marginVertical: 5, width: '70%'}}>
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
                    containerStyle={{paddingHorizontal: 20}}
                    onPress={handlepickImage}
                  />
                  <View style={{height: 10}} />
                  <ZButton
                    title={strings.captureDishPhoto}
                    textType={'b18'}
                    color={colors.white}
                    containerStyle={{paddingHorizontal: 20}}
                    onPress={handleCaptureImage}
                  />
                </>
              )}
              <View style={{height: 10}} />

              {(postDataToBeEdited
                ? postDataToBeEdited.title && !postDataToBeEdited.avatarUri
                : !isImage) && (
                <>
                  <ZButton
                    title={strings.uploadDishVideo}
                    textType={'b18'}
                    color={colors.white}
                    containerStyle={{paddingHorizontal: 20}}
                    onPress={handlePickVideo}
                  />
                  <View style={{height: 10}} />
                  <ZButton
                    title={strings.captureDishVideo}
                    textType={'b18'}
                    color={colors.white}
                    containerStyle={{paddingHorizontal: 20}}
                    onPress={handleCaptureVideo}
                  />
                  <View style={{height: 10}} />
                  <ZText>{strings.maxDuration}</ZText>
                </>
              )}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      {modalState.visible && (
        <BottomActionSheet
          visible={modalState.visible}
          title={modalState.title}
          message={modalState.message}
          primaryLabel={'Open Menu Management'}
          secondaryLabel={'Not now'}
          onPrimary={() => {
            setModalState({visible: false, title: '', message: ''});
            navigation.navigate(StackNav.MenuManagement, {fromTabs: true});
          }}
          onClose={() => setModalState({visible: false, title: '', message: ''})}
        />
      )}
    </ZSafeAreaView>
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
  btnContainer: {
    ...styles.pv20,
    ...styles.mh20,
    ...styles.rowSpaceAround,
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
});
