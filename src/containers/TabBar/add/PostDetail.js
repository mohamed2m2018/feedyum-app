// Library import
import {
  ActivityIndicator,
  I18nManager,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import React, {useEffect, useState} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
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
import images from '../../../assets/images';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Dropdown} from 'react-native-element-dropdown';
import {useBackgroundUpload} from '../../../providers/BackgroundUploadProvider';
import {useScreen} from '../../../navigation/screenContext';
import AttachedDishesComponent from './components/AttachedDishesComponent';

export default function PostDetail() {
  const Duration = [
    {label: strings.hours, value: 'Hours'},
    {label: strings.days, value: 'Days'},
  ];

  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});

  const [toggleStatus, setToggleStatus] = useState('Hours');
  const route = useRoute();

  const {currentScreen: previousScreen} = useScreen();

  // Override the back button behavior
  useFocusEffect(() => {
    const onBackPress = () => {
      // Your custom logic here
      // For example, navigate to a different screen or show an alert
      navigation.navigate(previousScreen);
      return true; // Return true to prevent default back behavior
    };

    navigation.addListener('beforeRemove', e => {
      if (!onBackPress()) {
        e.preventDefault();
      }
    });

    return () => navigation.removeListener('beforeRemove');
  });
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
      setToggleStatus(postDataToBeEdited.duration?.split(' ')?.[1] || 'Hours');
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
      onError: err => console.log('err ', err),
    },
  );

  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [phone, setPhone] = useState();
  const [locations, setLocations] = useState(locationsData?.data?.locations);
  const [categoryIds, setcategoryIds] = useState(
    route.params?.postDataToBeEdited?.category?.map(item => item._id) || [],
  );
  const [categoryNames, setCategoryNames] = useState(
    route.params?.postDataToBeEdited?.category?.map(item =>
      I18nManager?.isRTL ? item?.nameArabic : item.name,
    ) || [],
  );
  const onPressCategory = () => {
    navigation.navigate(StackNav.SelectCategory, {
      setcategoryIds,
      categoryIds,
      setCategoryNames,
      categoryNames,
    });
  };

  useEffect(() => {
    setpostedData(currentState => ({
      ...currentState,
      category: categoryIds,
    }));
  }, [categoryIds]);

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
    const validationChef =
      !postedData?.title ||
      !postedData?.caption ||
      (!user?.phone && !phone) ||
      !locations.length ||
      !postedData.category.length;

    const validationUser =
      !postedData?.title || !postedData?.caption || !postedData.category.length;
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

    if (postedData.category?.length < 1) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: 'Please select at least one category',
      });
      return;
    }

    const dataToBeSent = postedData?.linkToGo
      ? {
          ...postedData,
          duration: postedData.duration + ' ' + toggleStatus,
          mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
          // Transform attachedDishes to dishes for backend compatibility
          dishes: postedData?.attachedDishes?.map(dish => dish._id) || [],
        }
      : {
          ...postedData,
          duration: postedData.duration + ' ' + toggleStatus,
          phone: user?.phone || phone,
          mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
          // Transform attachedDishes to dishes for backend compatibility
          dishes: postedData?.attachedDishes?.map(dish => dish._id) || [],
        };

    // Remove attachedDishes from the data sent to backend since we're using dishes
    delete dataToBeSent.attachedDishes;
    handleDataToBeSent(dataToBeSent);
    handleEditUser(phone, locations);
    setisFormFilled(true);

    setTimeout(() => {
      navigation.navigate(TabNav.ForYou);
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

  const handleCaptureVideo = () =>
    ImagePicker.openCamera({
      mediaType: 'video',
      cropping: false,
      maximumVideoDuration: 60,
    })
      .then(handleMedia)
      .catch(err => console.log('err ', err));

  const handleCaptureImage = () =>
    ImagePicker.openCamera({
      cropping: true,
      compressImageQuality: 1,
    }).then(handleMedia);

  const handlepickImage = () =>
    ImagePicker.openPicker({
      mediaType: 'image',
      cropping: true,
      compressImageQuality: 1,
    }).then(handleMedia);

  const handlePickVideo = () =>
    ImagePicker.openPicker({
      mediaType: 'video',
      compressVideoPreset: 'HighestQuality',
    }).then(handleMedia);

  return (
    <ZSafeAreaView>
      <ZHeader
        onPressBack={() => navigation.navigate(previousScreen)}
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

                <TextInput
                  placeholder={strings.price + ' ' + strings.optional}
                  keyboardType="number-pad"
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                  value={`${postedData?.price || ''}`}
                  onChangeText={input =>
                    setpostedData(currentState => ({
                      ...currentState,
                      price: input,
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
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TextInput
                    placeholder={`${strings.no} ${
                      toggleStatus === 'Hours' ? strings.hours : strings.days
                    } ${strings.toDeliver} ${strings.optional}`}
                    keyboardType="number-pad"
                    textAlign={I18nManager.isRTL ? 'right' : 'left'}
                    value={`${
                      postedData?.duration?.split?.(' ')?.[0] !== 'undefined' &&
                      !!postedData?.duration?.split?.(' ')?.[0]
                        ? // postedData?.duration?.split?.(' ')?.[0] !== undefined
                          postedData?.duration?.split?.(' ')?.[0]
                        : ''
                    }`}
                    multiline={true}
                    onChangeText={input =>
                      setpostedData(currentState => ({
                        ...currentState,
                        duration: input,
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
                      {
                        maxWidth: '58%',
                        paddingTop: 20,
                      },
                    ]}
                    inputBoxStyle={localStyles.inputBoxStyle}
                  />
                  <View>
                    <Dropdown
                      style={[
                        localStyles.dropdownStyle,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBg,
                          color: colors.white,
                          zIndex: 10000,
                        },
                      ]}
                      renderRightIcon={() => (
                        <FontAwesome
                          style={{paddingRight: 10}}
                          name="chevron-down"
                          size={12}
                          color={colors.textColor}
                        />
                      )}
                      placeholderStyle={{color: colors.grayScale5}}
                      data={Duration}
                      maxHeight={moderateScale(180)}
                      labelField="label"
                      valueField="value"
                      placeholder={'Duration'}
                      value={toggleStatus}
                      itemTextStyle={{
                        color: colors.textColor,
                        fontSize: moderateScale(16),
                      }}
                      onChange={text => setToggleStatus(text.value)}
                      selectedTextStyle={{
                        color: colors.textColor,
                      }}
                      itemContainerStyle={{
                        backgroundColor: colors.inputBg,
                      }}
                      activeColor={colors.inputBg}
                    />
                  </View>
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
                <TextInput
                  placeholder={strings.linkOptional}
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                  multiline={true}
                  value={postedData?.linkToGo}
                  onChangeText={input =>
                    setpostedData(currentState => ({
                      ...currentState,
                      linkToGo: input,
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
            <View style={{flexDirection: 'row', marginVertical: 15}}>
              <ZText type={'B20'}>
                {categoryNames.length
                  ? strings.editCategory
                  : strings.addCategory}
              </ZText>
              {categoryNames.length ? (
                <MaterialIcon
                  name="pencil"
                  onPress={onPressCategory}
                  size={moderateScale(25)}
                  color={colors.primary}
                />
              ) : (
                <MaterialIcon
                  name="plus"
                  onPress={onPressCategory}
                  size={moderateScale(25)}
                  color={colors.primary}
                />
              )}
            </View>
            <View style={{flexDirection: 'row'}}>
              {categoryNames.map((item, index) => (
                <ZText key={item}>
                  {index !== categoryNames.length - 1 ? item + ', ' : item}
                </ZText>
              ))}
            </View>
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
