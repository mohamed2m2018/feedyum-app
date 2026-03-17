/**
 * ChefBrandSetupModal
 * A premium modal shown after Google Sign-In for chefs.
 * Asks ONLY for: professional kitchen name + kitchen photo/logo.
 * Fields start empty — the chef creates their brand identity from scratch.
 * Design matches UserTypeSelectionModal premium patterns.
 */
import React, { useState, useEffect, useRef, createRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-crop-picker';
import { Image as ImageCompressor } from 'react-native-compressor';

import { moderateScale, getHeight } from '../../common/constants';
import strings from '../../i18n/strings';
import { commonColor, styles as themeStyles } from '../../themes';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';
import ZInput from '../common/ZInput';
import ProfilePicture from '../models/ProfilePicture';
import request from '../../api/request';
import { showErrorToast } from '../../utils/toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Reusable shake animation
const triggerShake = (animValue) => {
  animValue.setValue(0);
  Animated.sequence([
    Animated.timing(animValue, { toValue: 12, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: -12, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 5, duration: 50, useNativeDriver: true }),
    Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
};

const ChefBrandSetupModal = ({ visible, onComplete, onDismiss }) => {
  const colors = useSelector(state => state.theme.theme);
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenPhoto, setKitchenPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [nameError, setNameError] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [showConfirmDismiss, setShowConfirmDismiss] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const photoShakeAnim = useRef(new Animated.Value(0)).current;
  const nameShakeAnim = useRef(new Animated.Value(0)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const ProfilePictureSheetRef = createRef();

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.bColor,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };
  const ErrorStyle = {
    backgroundColor: colors.inputBg,
    borderColor: commonColor.red,
  };
  const [nameInputStyle, setNameInputStyle] = useState(BlurredStyle);

  useEffect(() => {
    if (visible) {
      setKitchenName('');
      setKitchenPhoto(null);
      setPhotoError('');
      setNameError('');
      setShowValidationError(false);
      errorFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Clear errors when user starts fixing
  useEffect(() => {
    if (kitchenName.trim().length >= 2) {
      setNameError('');
      setNameInputStyle(BlurredStyle);
      if (kitchenPhoto) hideValidationError();
    }
  }, [kitchenName]);

  useEffect(() => {
    if (kitchenPhoto) {
      setPhotoError('');
      if (kitchenName.trim().length >= 2) hideValidationError();
    }
  }, [kitchenPhoto]);

  const hideValidationError = () => {
    Animated.timing(errorFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowValidationError(false));
  };

  // Upload image via public endpoint
  const uploadImageToBackend = async (imagePath, mimeType) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imagePath,
      type: mimeType || 'image/jpeg',
      name: 'kitchen_' + Date.now() + '.jpg',
    });

    const response = await request.post('/user/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('[ChefBrand] Upload response:', JSON.stringify(response?.data));

    if (response?.data?.success && response?.data?.url) {
      return response.data.url;
    }
    // Try direct response in case request module unwraps .data
    if (response?.success && response?.url) {
      return response.url;
    }
    throw new Error('Upload failed');
  };

  const handleImagePick = async (source) => {
    const pickerFn = source === 'camera'
      ? ImagePicker.openCamera
      : ImagePicker.openPicker;

    try {
      const response = await pickerFn({
        mediaType: 'photo',
        cropping: true,
        includeBase64: false,
      });

      ProfilePictureSheetRef?.current?.hide();
      setIsUploading(true);
      setPhotoError('');

      const result = await ImageCompressor.compress(response.path, {
        compressionMethod: 'auto',
      });
      const secureUrl = await uploadImageToBackend(result, response.mime);
      console.log('[ChefBrand] Setting kitchenPhoto to:', secureUrl);
      setKitchenPhoto(secureUrl);
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      if (error?.code !== 'E_PICKER_CANCELLED') {
        showErrorToast(strings.error, strings.uploadFailed || 'Upload failed');
      }
    }
  };

  const handleSave = () => {
    let hasError = false;

    if (!kitchenName.trim() || kitchenName.trim().length < 2) {
      setNameError(strings.nameRequired);
      setNameInputStyle(ErrorStyle);
      triggerShake(nameShakeAnim);
      hasError = true;
    }

    if (!kitchenPhoto) {
      setPhotoError(strings.photoRequired);
      triggerShake(photoShakeAnim);
      hasError = true;
    }

    if (hasError) {
      // Show animated inline error banner
      setShowValidationError(true);
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      // Auto-hide after 4 seconds
      setTimeout(() => {
        Animated.timing(errorFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowValidationError(false));
      }, 4000);
      return;
    }

    onComplete(kitchenName.trim(), kitchenPhoto);
  };

  const canContinue = kitchenName.trim().length >= 2 && !!kitchenPhoto && !isUploading;

  // Photo border color based on state
  const photoBorderColor = photoError
    ? commonColor.red
    : kitchenPhoto
      ? (colors.primary || '#FF6B35')
      : (colors.bColor || '#444');

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      statusBarTranslucent>
      <Animated.View style={[localStyles.backdrop, { opacity: fadeAnim }]}>
        {/* Dark overlay */}
        <View style={[localStyles.darkOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]} />

        <Animated.View
          style={[
            localStyles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}>

          {/* Floating Header — outside card, white text on dark */}
          <View style={localStyles.floatingHeader}>
            {/* X Close Button */}
            <TouchableOpacity
              onPress={() => setShowConfirmDismiss(true)}
              style={localStyles.closeButton}
              activeOpacity={0.7}>
              <Ionicons name="close" size={moderateScale(22)} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={[localStyles.headerIconBg, { backgroundColor: colors.primary || '#FF6B35' }]}>
              <MaterialCommunityIcons
                name="chef-hat"
                size={moderateScale(28)}
                color={commonColor.white}
              />
            </View>
            <ZText type="b26" align="center" color={commonColor.white} style={localStyles.headerTitle}>
              {strings.setupYourKitchen}
            </ZText>
            <ZText
              type="r14"
              align="center"
              color="rgba(255,255,255,0.65)"
              style={localStyles.headerSubtitle}>
              {strings.customizeYourBrand}
            </ZText>
          </View>

          {/* Content Card */}
          <View style={[localStyles.contentCard, { backgroundColor: colors.backgroundColor }]}>

            {/* Photo Upload Section */}
            <Animated.View style={[localStyles.photoSection, { transform: [{ translateX: photoShakeAnim }] }]}>
              <TouchableOpacity
                onPress={() => ProfilePictureSheetRef?.current?.show()}
                activeOpacity={0.8}
                style={localStyles.photoWrapper}>
                <View
                  style={[
                    localStyles.photoBorder,
                    {
                      borderColor: photoBorderColor,
                      borderWidth: kitchenPhoto ? moderateScale(3) : moderateScale(2),
                    },
                  ]}>
                  <View style={[localStyles.photoInner, { backgroundColor: colors.inputBg || colors.backgroundColor }]}>
                    {isUploading ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                    ) : kitchenPhoto ? (
                      <Image source={{ uri: kitchenPhoto }} style={localStyles.photoImage} />
                    ) : (
                      <View style={localStyles.photoPlaceholder}>
                        <Ionicons
                          name="storefront-outline"
                          size={moderateScale(36)}
                          color={photoError ? commonColor.red : (colors.grayScale5 || '#888')}
                        />
                        <ZText
                          type="r11"
                          color={photoError ? commonColor.red : (colors.grayScale5 || '#888')}
                          align="center"
                          style={localStyles.photoPlaceholderText}>
                          {strings.addKitchenLogo}
                        </ZText>
                      </View>
                    )}
                  </View>
                </View>
                {/* Camera badge */}
                <View style={[localStyles.cameraIcon, { backgroundColor: colors.primary || '#FF6B35' }]}>
                  <Ionicons name="camera" size={moderateScale(13)} color={commonColor.white} />
                </View>
              </TouchableOpacity>

              {/* Photo status text */}
              {kitchenPhoto && (
                <TouchableOpacity
                  onPress={() => ProfilePictureSheetRef?.current?.show()}
                  activeOpacity={0.7}>
                  <ZText type="m12" color={colors.primary} align="center" style={localStyles.changePhotoLink}>
                    {strings.tapToChangePhoto || 'Tap to change'}
                  </ZText>
                </TouchableOpacity>
              )}
            </Animated.View>


            {/* Divider */}
            <View style={[localStyles.divider, { backgroundColor: colors.bColor || '#333' }]} />

            {/* Name Input Section */}
            <Animated.View style={{ transform: [{ translateX: nameShakeAnim }] }}>
              <ZText type="s14" color={colors.textColor} style={localStyles.inputLabel}>
                {strings.kitchenNamePlaceholder}
              </ZText>
              <ZInput
                placeHolder={strings.kitchenNamePlaceholder}
                keyboard
                insideLeftIcon={() => (
                  <MaterialCommunityIcons
                    name="store"
                    size={moderateScale(18)}
                    color={nameError ? commonColor.red : (colors.grayScale5 || '#888')}
                  />
                )}
                _value={kitchenName}
                autoCapitalize="words"
                toGetTextFieldValue={setKitchenName}
                inputContainerStyle={[
                  localStyles.nameInput,
                  { backgroundColor: colors.inputBg },
                  nameInputStyle,
                ]}
                _onFocus={() => {
                  setNameInputStyle(FocusedStyle);
                  setNameError('');
                }}
                _onBlur={() => {
                  if (!nameError) setNameInputStyle(BlurredStyle);
                }}
              />
              {!!nameError && (
                <ZText type="r12" color={commonColor.red} style={localStyles.fieldError}>
                  {nameError}
                </ZText>
              )}
            </Animated.View>
          </View>

          {/* Bottom Button Area */}
          <View style={localStyles.bottomArea}>
            {/* Animated inline error banner */}
            {showValidationError && (
              <Animated.View
                style={[
                  localStyles.errorBanner,
                  {
                    opacity: errorFadeAnim,
                    transform: [{
                      translateY: errorFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    }],
                  },
                ]}>
                <Ionicons name="alert-circle" size={moderateScale(16)} color={commonColor.red} />
                <ZText type="s13" color={commonColor.red} style={themeStyles.ml5}>
                  {strings.pleaseFillAllInputs}
                </ZText>
              </Animated.View>
            )}
            <ZButton
              title={strings.letsGo}
              textType="b18"
              color={commonColor.white}
              containerStyle={[
                localStyles.continueButton,
                !canContinue && localStyles.disabledButton,
              ]}
              bgColor={canContinue ? (colors.primary || '#FF6B35') : (colors.grayScale5 || '#888')}
              onPress={handleSave}
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Dismiss Confirmation Overlay */}
      {showConfirmDismiss && (
        <View style={localStyles.confirmOverlay}>
          <View style={[localStyles.confirmCard, { backgroundColor: colors.backgroundColor }]}>
            <View style={[localStyles.confirmIconCircle, { backgroundColor: 'rgba(255, 75, 75, 0.12)' }]}>
              <Ionicons name="warning" size={moderateScale(28)} color={commonColor.red} />
            </View>
            <ZText type="b18" align="center" style={localStyles.confirmTitle}>
              {strings.cancelRegistration || 'Cancel Registration?'}
            </ZText>
            <ZText
              type="r14"
              align="center"
              color={colors.grayScale5}
              style={localStyles.confirmMessage}>
              {strings.dismissBrandSetup}
            </ZText>
            <View style={localStyles.confirmButtons}>
              <TouchableOpacity
                onPress={() => setShowConfirmDismiss(false)}
                style={[localStyles.confirmBtn, localStyles.confirmBtnCancel, { borderColor: colors.bColor || '#444' }]}
                activeOpacity={0.8}>
                <ZText type="s16" color={colors.textColor}>
                  {strings.cancel}
                </ZText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmDismiss(false);
                  onDismiss();
                }}
                style={[localStyles.confirmBtn, localStyles.confirmBtnYes, { backgroundColor: commonColor.red }]}
                activeOpacity={0.8}>
                <ZText type="s16" color={commonColor.white}>
                  {strings.yes || 'Yes'}
                </ZText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ProfilePicture
        title={strings.uploadKitchenLogo}
        onPressCamera={() => handleImagePick('camera')}
        onPressGallery={() => handleImagePick('gallery')}
        SheetRef={ProfilePictureSheetRef}
      />
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  // Floating header
  floatingHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerIconBg: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  headerTitle: {
    marginBottom: moderateScale(6),
  },
  headerSubtitle: {
    paddingHorizontal: moderateScale(20),
  },
  // Content card
  contentCard: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  // Photo section
  photoSection: {
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  photoWrapper: {
    position: 'relative',
  },
  photoBorder: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInner: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
  },
  photoPlaceholderText: {
    marginTop: moderateScale(4),
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  changePhotoLink: {
    marginTop: moderateScale(8),
  },
  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: moderateScale(20),
  },
  // Name input
  inputLabel: {
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  nameInput: {
    height: getHeight(52),
    borderRadius: moderateScale(14),
    borderWidth: moderateScale(1),
    paddingHorizontal: moderateScale(16),
  },
  fieldError: {
    marginTop: moderateScale(6),
    paddingHorizontal: moderateScale(4),
  },
  // Bottom area
  bottomArea: {
    marginTop: moderateScale(20),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
  },
  continueButton: {
    height: moderateScale(56),
    borderRadius: moderateScale(16),
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Confirmation overlay
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
    zIndex: 100,
  },
  confirmCard: {
    width: '100%',
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  confirmIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  confirmTitle: {
    marginBottom: moderateScale(8),
  },
  confirmMessage: {
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(10),
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnCancel: {
    borderWidth: moderateScale(1),
  },
  confirmBtnYes: {},
});

export default ChefBrandSetupModal;
