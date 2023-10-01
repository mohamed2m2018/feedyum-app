/* eslint-disable curly */
// Libraries import
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import React, {createRef, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Entypo';
import {Dropdown} from 'react-native-element-dropdown';
import ImagePicker from 'react-native-image-crop-picker';
import {Image as ImageCompressor} from 'react-native-compressor';

// Local import
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import strings from '../../i18n/strings';
import images from '../../assets/images';
import {styles} from '../../themes';
import {
  ACCESS_TOKEN,
  GenderData,
  getHeight,
  moderateScale,
} from '../../common/constants';
import ZInput from '../../components/common/ZInput';
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import {StackNav, TabNav} from '../../navigation/NavigationKeys';
import ProfilePicture from '../../components/models/ProfilePicture';
import ZButton from '../../components/common/ZButton';
import {setAsyncStorageData} from '../../utils/helpers';
import request from '../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import {useQuery, useQueryClient} from 'react-query';
import OneSignal from 'react-native-onesignal';
import {RNS3} from 'react-native-aws3';
import ZText from '../../components/common/ZText';
import Location from '../../components/models/location';

const SetUpProfile = props => {
  const {navigation} = props;
  const headerTitle = props.route.params.title;
  const {email, password, type} = props.route.params;
  const [isUpdating, setisUpdating] = useState(false);

  const colors = useSelector(state => state.theme.theme);
  const ProfilePictureSheetRef = createRef();
  const locationSheetRef = createRef();

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };
  // const BlurredIconStyle = colors.grayScale5;
  // const FocusedIconStyle = colors.primary;

  const isEdit = headerTitle === strings.editProfile;

  const {data: editUser} = useQuery('user', () => request.get('/user'), {
    retry: 0,
    refetchOnMount: true,
    enabled: isEdit,
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: err[Object.keys(err)?.[0]] || strings.errorOccured,
      });
    },
  });

  const {data: locationsData} = useQuery(
    'location' + editUser?.data?.user?._id,
    () =>
      request.get('/user/location', {
        params: {
          id: editUser?.data?.user?._id,
        },
      }),
    {
      retry: 0,
      enabled: !!editUser?.data?.user?._id,
      refetchOnMount: true,
      onSuccess: res => setLocations(res?.data?.locations),
      onError: err => console.log('err ', err),
    },
  );

  useEffect(() => {
    if (!isEdit) {
      setFullName(undefined);
      setGender(undefined);
      setPhoneNo(undefined);
      setBio(undefined);
    }
  }, [isEdit]);

  const [fullName, setFullName] = useState(
    editUser?.data?.user?.fullName || '',
  );

  const [locations, setLocations] = useState(
    locationsData?.data?.locations || [],
  );

  const [phoneNo, setPhoneNo] = useState(editUser?.data?.user?.phone || '');
  const [gender, setGender] = useState(editUser?.data?.user?.gender || '');
  const [bio, setBio] = useState(editUser?.data?.user?.bio || '');
  const [fullNameInputStyle, setFullNameInputStyle] = useState(BlurredStyle);
  const [phoneNoInputStyle, setPhoneNoInputStyle] = useState(BlurredStyle);
  const [bioStyle, setBioStyle] = useState(BlurredStyle);
  const [selectImage, setSelectImage] = useState(editUser?.data?.user?.avatar);
  const [isPhotoUploading, setisPhotoUploading] = useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  // const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  // const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

  const onFocusFullName = () => onFocusInput(setFullNameInputStyle);
  const onFocusPhoneNo = () => onFocusInput(setPhoneNoInputStyle);

  const onBlurFullName = () => onBlurInput(setFullNameInputStyle);
  const onBlurPhoneNo = () => onBlurInput(setPhoneNoInputStyle);

  const onFocusBio = () => onFocusInput(setBioStyle);

  const onBlurBio = () => onBlurInput(setBioStyle);

  const onChangedFullName = text => setFullName(text);
  const onChangedPhoneNo = text => setPhoneNo(text);
  const onChangedSetBio = text => setBio(text);
  const onChangedGender = text => setGender(text.value.toLowerCase());

  const queryClient = useQueryClient();
  const validatePhoneNumber = input => {
    const pattern = /^01[0125][0-9]{8}$/;
    return pattern.test(input);
  };
  const handleSubmit = () => {
    if (!validatePhoneNumber(phoneNo)) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: strings.error,
        textBody: strings.pleaseProvideCorrectNo,
      });
      return;
    }
    request
      .post('/user', {
        fullName,
        phone: phoneNo,
        gender,
        email,
        password,
        type,
        avatar: selectImage,
        bio,
        locations,
        // categories,
      })
      .then(async res => {
        await setAsyncStorageData(ACCESS_TOKEN, res?.data?.token);
        OneSignal.setExternalUserId(res?.data?.user?._id);
        request.defaults.headers.common.Authorization = res?.data?.token;
        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabBar}],
        });
      })
      .catch(err =>
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: strings.error,
          textBody: err[Object.keys(err)?.[0]],
        }),
      );
  };

  const onPressCamera = () => {
    ImagePicker.openCamera({
      // cropping: true,
      mediaType: 'photo',
      includeBase64: true,
    }).then(image => {
      setSelectImage(image);
    });
  };

  const onPressGallery = async () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      includeBase64: true,
    }).then(async response => {
      ProfilePictureSheetRef?.current?.hide();
      setisPhotoUploading(true);
      const result = await ImageCompressor.compress(response.path, {
        compressionMethod: 'auto',
      });
      const file = {
        uri: result,
        type: response.mime,
        name: response?.fileName + response.path,
      };
      const options = {
        keyPrefix: 'uploads/', // optional (default: "uploads/")
        bucket: 'foodtokforever', // required
        region: 'eu-central-1', // required
        accessKey: '***REMOVED***', // required
        secretKey: '***REMOVED***', // required
        successActionStatus: 201,
      };
      RNS3.put(file, options)
        .then(res => {
          if (res.status !== 201) {
            throw new Error('Failed to upload image to S3');
          }

          const secureUrl = res.body.postResponse.location;
          setSelectImage(secureUrl);
          setisPhotoUploading(false);
        })
        .catch(error => {
          setisPhotoUploading(false);
          console.log('Upload failed!');
          console.log(error);
        });
    });
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const PhoneIcon = () => {
    return (
      <Ionicons
        name="phone"
        size={moderateScale(20)}
        color={colors.textColor}
      />
    );
  };

  const onPressUpdate = () => {
    const data = {};

    if (fullName) data.fullName = fullName;
    if (phoneNo) data.phone = phoneNo;
    if (bio) data.bio = bio;
    if (gender) data.gender = gender;
    if (email) data.email = email;
    if (password) data.password = password;
    if (type) data.type = type;
    if (selectImage) data.avatar = selectImage;
    if (locations) data.locations = locations;
    setisUpdating(true);

    request
      .patch('/user', {
        ...data,
      })
      .then(async () => {
        await queryClient.invalidateQueries({queryKey: 'user'});
        await queryClient.invalidateQueries({
          queryKey: 'location' + editUser?.data?.user?._id,
        });

        navigation.navigate(TabNav.ForYou);
        setisUpdating(false);
      })
      .catch(err => {
        setisUpdating(false);
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: strings.error,
          textBody: err[Object.keys(err)?.[0]],
        });
      });
  };

  const onPressContinue = () => {
    handleSubmit();
  };

  const [locationIndexToEdit, setlocationIndexToEdit] = useState();

  const onPressProfilePic = () => ProfilePictureSheetRef?.current.show();
  const onPressLocation = () => locationSheetRef?.current.show();
  const onEditLocation = index => {
    locationSheetRef?.current.show();
    setlocationIndexToEdit(index);
  };
  const onDeleteLocation = indexToDelete => {
    setLocations(l => l.filter((_, index) => index !== indexToDelete));
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={headerTitle} />
      <ZKeyBoardAvoidWrapper containerStyle={[styles.p20]}>
        <TouchableOpacity
          onPress={onPressProfilePic}
          style={[styles.selfCenter, styles.mb20]}>
          {selectImage ? (
            <Image source={{uri: selectImage}} style={localStyles.userImage} />
          ) : (
            <>
              {isPhotoUploading ? (
                <ActivityIndicator size={'large'} color={colors.primary} />
              ) : (
                <Image
                  source={colors.dark ? images.userDark : images.userLight}
                  style={localStyles.userImage}
                />
              )}
            </>
          )}
          {!isPhotoUploading && (
            <MaterialIcon
              name="pencil-box"
              size={moderateScale(30)}
              color={colors.primary}
              style={localStyles.editIcon}
            />
          )}
        </TouchableOpacity>

        <ZInput
          placeHolder={strings.fullName}
          keyboard
          insideLeftIcon={() => (
            <Ionicons
              name="text"
              size={moderateScale(20)}
              color={colors.textColor}
            />
          )}
          _value={fullName}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangedFullName}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            fullNameInputStyle,
          ]}
          _onFocus={onFocusFullName}
          _onBlur={onBlurFullName}
        />

        <ZInput
          placeHolder={strings.phoneNumberStarts}
          keyBoardType={'number-pad'}
          _value={phoneNo}
          _maxLength={11}
          toGetTextFieldValue={onChangedPhoneNo}
          insideLeftIcon={() => <PhoneIcon />}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            phoneNoInputStyle,
          ]}
          _onFocus={onFocusPhoneNo}
          _onBlur={onBlurPhoneNo}
        />

        <ZInput
          placeHolder={strings.addBio}
          _value={bio}
          multiline
          _autoFocus={props.route.params.isEditBio}
          toGetTextFieldValue={onChangedSetBio}
          // eslint-disable-next-line react/no-unstable-nested-components
          insideLeftIcon={() => (
            <Ionicons
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                position: 'relative',
                top: -18,
              }}
              name="info-with-circle"
              size={moderateScale(20)}
              color={colors.textColor}
            />
          )}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle2,
            bioStyle,
          ]}
          _onFocus={onFocusBio}
          _onBlur={onBlurBio}
        />
        {type !== 'user' && (
          <>
            <ZText style={{marginVertical: 5}} type={'B20'}>
              Branches
            </ZText>
            {(locations?.length === 0 || !locations) && (
              <View style={{flexDirection: 'row'}}>
                <ZText style={{marginVertical: 5, width: '70%'}}>
                  You don't have branches, click on plus icon to add one.
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
        {type === 'user' && (
          <Dropdown
            style={[
              localStyles.dropdownStyle,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBg,
                color: colors.textColor,
              },
            ]}
            placeholderStyle={{color: colors.iconColor}}
            data={GenderData}
            renderRightIcon={() => (
              <FontAwesome
                style={{paddingRight: 10}}
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
              fontSize: moderateScale(16),
            }}
            onChange={onChangedGender}
            selectedTextStyle={{
              color: colors.textColor,
            }}
            itemContainerStyle={{
              backgroundColor: colors.inputBg,
            }}
            activeColor={colors.inputBg}
          />
        )}
      </ZKeyBoardAvoidWrapper>
      {headerTitle === strings.editProfile ? (
        <ZButton
          textType={'b18'}
          disabled={isPhotoUploading}
          color={colors.white}
          isLoading={isPhotoUploading || isUpdating}
          title={strings.update}
          onPress={onPressUpdate}
          containerStyle={styles.m20}
        />
      ) : (
        <View style={localStyles.btnContainer}>
          {console.log('kss', !locations.length && type !== 'user')}
          <ZButton
            title={strings.continue}
            textType={'b18'}
            disabled={
              !fullName ||
              !phoneNo ||
              (!gender && type === 'user') ||
              (!bio && type !== 'user') ||
              !email ||
              !password ||
              !type ||
              (!locations.length && type !== 'user') ||
              isPhotoUploading
            }
            color={colors.white}
            isLoading={isPhotoUploading}
            containerStyle={[localStyles.skipBtnContainer]}
            onPress={onPressContinue}
          />
        </View>
      )}
      <ProfilePicture
        onPressCamera={onPressCamera}
        onPressGallery={onPressGallery}
        SheetRef={ProfilePictureSheetRef}
      />
      <Location
        locationIndexToEdit={locationIndexToEdit}
        setlocationIndexToEdit={setlocationIndexToEdit}
        setLocations={setLocations}
        SheetRef={locationSheetRef}
        locations={locations}
      />
    </ZSafeAreaView>
  );
};

export default SetUpProfile;

const localStyles = StyleSheet.create({
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  inputContainerStyle: {
    height: getHeight(60),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph15,
  },
  inputContainerStyle2: {
    height: getHeight(120),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph15,
  },
  dropdownStyle: {
    height: getHeight(60),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph25,
    ...styles.mt15,
  },
  btnContainer: {
    ...styles.p20,
    ...styles.rowSpaceAround,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
