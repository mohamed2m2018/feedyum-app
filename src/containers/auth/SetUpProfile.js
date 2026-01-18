/* eslint-disable curly */
// Libraries import
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  ScrollView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import React, { createRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { Dropdown } from 'react-native-element-dropdown';
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
import ZKeyBoardAvoidWrapper from '../../components/common/ZKeyBoardAvoidWrapper';
import { StackNav, TabNav } from '../../navigation/NavigationKeys';
import ProfilePicture from '../../components/models/ProfilePicture';
import ZButton from '../../components/common/ZButton';
import request from '../../api/request';
import { showErrorToast } from '../../utils/toast';
import { useQuery, useQueryClient } from 'react-query';
import OneSignal from 'react-native-onesignal';
import { RNS3 } from 'react-native-aws3';
import ZText from '../../components/common/ZText';
import { useStorage } from '../../utils/useStorage';

const SetUpProfile = props => {
  const { navigation } = props;
  const headerTitle = props.route.params.title;
  const { email, password, type } = props.route.params;
  const [isUpdating, setisUpdating] = useState(false);

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

  // Check if this is edit mode - handle both editProfile and editProfileAndBranches
  const isEdit = headerTitle === strings.editProfile || headerTitle === strings.editProfileAndBranches;
  const isChef = props.route.params?.type === 'chef' || type === 'chef';

  const { data: editUser } = useQuery('user', () => request.get('/user'), {
    retry: 0,
    refetchOnMount: true,
    enabled: isEdit,
    onError: err => {
      showErrorToast(strings.error, err[Object.keys(err)?.[0]] || strings.errorOccured);
    },
  });

  const { data: locationsData } = useQuery(
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
      onError: () => { },
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
  const onBlurInput = onUnHighlight => onUnHighlight(BlurredStyle);

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
  const [_, setAccessToken] = useStorage(ACCESS_TOKEN);
  const queryClient = useQueryClient();
  const validatePhoneNumber = input => {
    const pattern = /^01[0125][0-9]{8}$/;
    return pattern.test(input);
  };
  const handleSubmit = () => {
    if (!validatePhoneNumber(phoneNo)) {
      showErrorToast(strings.error, strings.pleaseProvideCorrectNo);
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
      })
      .then(async res => {
        setAccessToken(res?.data?.token);
        OneSignal.setExternalUserId(res?.data?.user?._id);
        // Clear React Query cache to force fresh data fetch for this device
        await queryClient.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: StackNav.TabBar }],
        });
      })
      .catch(err =>
        showErrorToast(strings.error, err[Object.keys(err)?.[0]])
      );
  };

  // Helper function to upload image via backend API
  const uploadImageToBackend = async (imagePath, mimeType) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imagePath,
      type: mimeType || 'image/jpeg',
      name: 'profile_' + Date.now() + '.jpg',
    });

    const response = await request.post('/messages/upload-image', formData, {
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
        await queryClient.invalidateQueries({ queryKey: 'user' });
        await queryClient.invalidateQueries({
          queryKey: 'location' + editUser?.data?.user?._id,
        });
        queryClient.invalidateQueries({ queryKey: 'stories_following' });
        queryClient.invalidateQueries({ queryKey: 'stories' });

        navigation.navigate(TabNav.Profile);
        setisUpdating(false);
      })
      .catch(err => {
        setisUpdating(false);
        showErrorToast(strings.error, err[Object.keys(err)?.[0]]);
      });
  };

  const onPressContinue = () => {
    handleSubmit();
  };

  const [locationIndexToEdit, setlocationIndexToEdit] = useState();

  const onPressProfilePic = () => ProfilePictureSheetRef?.current.show();
  const onPressLocation = () => {
    navigation.navigate(StackNav.locations, {
      locationIndexToEdit,
      setlocationIndexToEdit,
      setLocations,
      locations: locations,
    });
  };
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

  // Get user type for display
  const userType = editUser?.data?.user?.type || type;
  const showBranches = userType === 'chef' || type !== 'user';

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
              colors={[colors.primary, colors.primary + '80']}
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
          <ZText type="m14" color={colors.grayScale5} style={localStyles.avatarHint}>
            {strings.tapToChangePhoto || 'Tap to change photo'}
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

            <ZInput
              placeHolder={strings.fullName}
              keyboard
              insideLeftIcon={() => (
                <EntypoIcon
                  name="text"
                  size={moderateScale(18)}
                  color={colors.grayScale5}
                />
              )}
              _value={fullName}
              autoCapitalize={'none'}
              toGetTextFieldValue={onChangedFullName}
              inputContainerStyle={[
                localStyles.inputStyle,
                { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
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
              insideLeftIcon={() => (
                <EntypoIcon
                  name="phone"
                  size={moderateScale(18)}
                  color={colors.grayScale5}
                />
              )}
              inputContainerStyle={[
                localStyles.inputStyle,
                { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
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
              _onBlur={onBlurBio}
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
                  <Ionicons name="location-outline" size={moderateScale(40)} color={colors.grayScale4} />
                  <ZText type="m14" color={colors.grayScale5} style={localStyles.emptyBranchesText}>
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

      {/* Action Button */}
      {isEdit ? (
        <ZButton
          textType={'b18'}
          disabled={isPhotoUploading}
          color={colors.white}
          isLoading={isPhotoUploading || isUpdating}
          title={strings.update}
          onPress={onPressUpdate}
          containerStyle={localStyles.updateButton}
        />
      ) : (
        <View style={localStyles.btnContainer}>
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
            containerStyle={localStyles.continueButton}
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
