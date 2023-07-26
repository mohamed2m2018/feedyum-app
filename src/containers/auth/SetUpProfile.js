/* eslint-disable curly */
// Libraries import
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {createRef, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import {StackNav} from '../../navigation/NavigationKeys';
import ProfilePicture from '../../components/models/ProfilePicture';
import ZButton from '../../components/common/ZButton';
import {setAsyncStorageData} from '../../utils/helpers';
import request from '../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import {useQuery, useQueryClient} from 'react-query';
import OneSignal from 'react-native-onesignal';
import {RNS3} from 'react-native-aws3';

const SetUpProfile = props => {
  const {navigation} = props;
  const headerTitle = props.route.params.title;
  const {email, password, type} = props.route.params;

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
        title: 'Error',
        textBody: err[Object.keys(err)?.[0]] || 'Sorry, an error has occured',
      });
    },
  });

  useEffect(() => {
    if (!isEdit) {
      setFullName(undefined);
      setGender(undefined);
      setPhoneNo(undefined);
      setNickname(undefined);
    }
  }, [isEdit]);

  const [fullName, setFullName] = useState(
    editUser?.data?.user?.fullName || '',
  );
  const [nickname, setNickname] = useState(
    editUser?.data?.user?.username || '',
  );
  const [phoneNo, setPhoneNo] = useState(editUser?.data?.user?.phone || '');
  const [gender, setGender] = useState(editUser?.data?.user?.gender || '');
  const [fullNameInputStyle, setFullNameInputStyle] = useState(BlurredStyle);
  const [phoneNoInputStyle, setPhoneNoInputStyle] = useState(BlurredStyle);
  const [nicknameInputStyle, setNicknameInputStyle] = useState(BlurredStyle);
  const [selectImage, setSelectImage] = useState(editUser?.data?.user?.avatar);
  const [isPhotoUploading, setisPhotoUploading] = useState(false);

  const onFocusInput = onHighlight => onHighlight(FocusedStyle);
  // const onFocusIcon = onHighlight => onHighlight(FocusedIconStyle);
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);
  // const onBlurIcon = onUnHighlight => onUnHighlight(BlurredIconStyle);

  const onFocusFullName = () => onFocusInput(setFullNameInputStyle);
  const onFocusNickName = () => onFocusInput(setNicknameInputStyle);
  const onFocusPhoneNo = () => onFocusInput(setPhoneNoInputStyle);

  const onBlurFullName = () => onBlurInput(setFullNameInputStyle);
  const onBlurNickName = () => onBlurInput(setNicknameInputStyle);
  const onBlurPhoneNo = () => onBlurInput(setPhoneNoInputStyle);

  const onChangedFullName = text => setFullName(text);
  const onChangedNickName = text => setNickname(text);
  const onChangedPhoneNo = text => setPhoneNo(text);
  const onChangedGender = text => setGender(text.value.toLowerCase());

  const queryClient = useQueryClient();

  const handleSubmit = () => {
    request
      .post('/user', {
        fullName,
        phone: phoneNo,
        userName: nickname,
        gender,
        email,
        password,
        type,
        avatar: selectImage,
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
          title: 'Error',
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
      const formData = new FormData();
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

  const CountryIcon = () => {
    return (
      <Ionicons
        name="flag"
        size={moderateScale(20)}
        color={colors.grayScale5}
      />
    );
  };

  const onPressUpdate = () => {
    const data = {};

    if (fullName) data.fullName = fullName;
    if (phoneNo) data.phone = phoneNo;
    if (nickname) data.userName = nickname;
    if (gender) data.gender = gender;
    if (email) data.email = email;
    if (password) data.password = password;
    if (type) data.type = type;
    if (selectImage) data.avatar = selectImage;

    request
      .patch('/user', {
        ...data,
      })
      .then(async () => {
        await queryClient.invalidateQueries({queryKey: 'user'});

        navigation.reset({
          index: 0,
          routes: [{name: StackNav.TabBar}],
        });
      })
      .catch(err =>
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: err[Object.keys(err)?.[0]],
        }),
      );
  };

  const onPressContinue = () => {
    handleSubmit();
  };

  // const onPressSkip = () => navigation.navigate(StackNav.SetPin);

  const onPressProfilePic = () => ProfilePictureSheetRef?.current.show();

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
                <ActivityIndicator size={'large'} />
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
          keyBoardType={'email-address'}
          _value={fullName}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangedFullName}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            fullNameInputStyle,
          ]}
          _onFocus={onFocusFullName}
          onBlur={onBlurFullName}
        />
        <ZInput
          placeHolder={strings.nickname}
          _value={nickname}
          autoCapitalize={'none'}
          toGetTextFieldValue={onChangedNickName}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            nicknameInputStyle,
          ]}
          _onFocus={onFocusNickName}
          onBlur={onBlurNickName}
        />

        <ZInput
          placeHolder={'Phone number must start with 01....'}
          keyBoardType={'number-pad'}
          _value={phoneNo}
          _maxLength={11}
          toGetTextFieldValue={onChangedPhoneNo}
          insideLeftIcon={() => <CountryIcon />}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            phoneNoInputStyle,
          ]}
          _onFocus={onFocusPhoneNo}
          onBlur={onBlurPhoneNo}
        />

        <Dropdown
          style={[
            localStyles.dropdownStyle,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBg,
              color: colors.white,
            },
          ]}
          placeholderStyle={{color: colors.grayScale5}}
          data={GenderData}
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
      </ZKeyBoardAvoidWrapper>
      {headerTitle === strings.editProfile ? (
        <ZButton
          textType={'b18'}
          disabled={isPhotoUploading}
          color={colors.white}
          isLoading={isPhotoUploading}
          title={strings.update}
          onPress={onPressUpdate}
          containerStyle={styles.m20}
        />
      ) : (
        <View style={localStyles.btnContainer}>
          {/* <ZButton
            title={strings.skip}
            textType={'b18'}
            color={colors.dark ? colors.white : colors.primary}
            containerStyle={[localStyles.skipBtnContainer]}
            bgColor={colors.dark3}
            onPress={onPressSkip}
          /> */}
          <ZButton
            title={strings.continue}
            textType={'b18'}
            disabled={
              !fullName ||
              !phoneNo ||
              !nickname ||
              !gender ||
              !email ||
              !password ||
              !type ||
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
