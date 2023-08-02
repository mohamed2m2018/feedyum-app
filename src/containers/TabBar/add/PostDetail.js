/* eslint-disable react-native/no-inline-styles */
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
import React, {useEffect, useState} from 'react';
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
import {TabNav} from '../../../navigation/NavigationKeys';
import {useQueryClient, useQuery} from 'react-query';
import request from '../../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import images from '../../../assets/images';
import DropdownGovr from '../home/DropDownGovr';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Dropdown} from 'react-native-element-dropdown';
import {useBackgroundUpload} from '../../../providers/BackgroundUploadProvider';

const Duration = [
  {label: 'Hours', value: 'Hours'},
  {label: 'Days', value: 'Days'},
];

export default function PostDetail() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});
  const queryClient = useQueryClient();

  const [toggleStatus, setToggleStatus] = useState('Hours');
  const route = useRoute();
  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries('stories'); // Invalidate the 'stories' query to trigger a refetch
    }, []),
  );
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
      setToggleStatus(postDataToBeEdited.duration?.split(' ')?.[1] || 'hours');
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
        title: 'Error',
        textBody: err[Object.keys(err)?.[0]] || 'Sorry, an error has occured',
      });
    },
  });

  const user = queryResult?.data?.user;

  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [phone, setPhone] = useState();

  const handleUpload = async (response, isImage) => {
    uploadData(
      response,
      setisPhotoUploading,
      setlocalUri,
      isImage,
      isPhotoUploading,
    );
  };

  const onPressHome = async () => {
    const validationChef =
      !postedData?.title ||
      !postedData?.price ||
      !postedData?.caption ||
      // !postedData?.uri ||
      !postedData.governorate ||
      // || !postedData.areas.length
      !postedData.duration ||
      (!user?.phone && !phone);
    const validationUser = !postedData?.title || !postedData?.caption;
    const validation = user?.type === 'chef' ? validationChef : validationUser;
    if (validation) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Please fill all inputs',
      });
      return;
    }
    if (postedData.caption?.length < 5) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Description is too short!',
      });
      return;
    }

    const dataToBeSent = postedData?.linkToGo
      ? {
          ...postedData,
          duration: postedData.duration + ' ' + toggleStatus,
          mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
        }
      : {
          ...postedData,
          duration: postedData.duration + ' ' + toggleStatus,
          phone: user?.phone || phone,
          mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
        };
    handleDataToBeSent(dataToBeSent);
    handleEditUser(phone);
    setisFormFilled(true);

    setTimeout(() => {
      navigation.navigate(TabNav.Profile);
    }, 100);
  };

  const handleMedia = value => {
    setmediaIsEdited(true);
    if (value.duration && value.duration > 60000) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Video Duration must be less than 1 minute',
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
    }).then(handleMedia);

  const handlepickImage = () =>
    ImagePicker.openPicker({
      mediaType: 'image',
      cropping: true,
    }).then(handleMedia);

  const handlePickVideo = () =>
    ImagePicker.openPicker({
      mediaType: 'video',
      compressVideoPreset: 'HighestQuality',
    }).then(handleMedia);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.post} />
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
              <ActivityIndicator style={{marginBottom: 15}} size={'large'} />
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
              placeholder={strings.mealName}
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
              placeholder={strings.description}
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
                <TextInput
                  placeholder={strings.price}
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
                    placeholder={`No of ${toggleStatus} to deliver this order`}
                    textAlign={I18nManager.isRTL ? 'right' : 'left'}
                    value={`${postedData?.duration?.split?.(' ')?.[0] || ''}`}
                    multiline={true}
                    keyboardType="number-pad"
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
                      // localStyles.smallInputContainerStyle,
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
                <DropdownGovr
                  setpostedData={setpostedData}
                  postedData={postedData}
                />
              </>
            )}
          </>
        )}
        <View style={localStyles.btnContainer}>
          {localUri !== '' ? (
            <ZButton
              title={postDataToBeEdited ? 'Edit' : strings.post}
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
});
