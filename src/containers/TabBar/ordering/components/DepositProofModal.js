import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { showErrorToast, showActionDialog } from '../../../../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZHeader from '../../../../components/common/ZHeader';
import { moderateScale } from '../../../../common/constants';
import { styles as themeStyles } from '../../../../themes';
import { compressImage, validateImageFile, uploadImageToS3 } from '../../../../utils/UploadUtils';
import strings from '../../../../i18n/strings';

const { width: screenWidth } = Dimensions.get('window');

const DepositProofModal = ({ visible, order, onClose, onConfirm }) => {
  const colors = useSelector(state => state.theme.theme);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickImage = () => {
    showActionDialog({
      type: ALERT_TYPE.INFO,
      title: strings.depositProofSelectMethod,
      confirmText: strings.depositProofCamera,
      cancelText: strings.depositProofGallery,
      onConfirm: openCamera,
      onCancel: openGallery,
    });
  };

  const processImage = async (image) => {
    try {
      if (!validateImageFile(image.path)) {
        showErrorToast(strings.invalidFile, strings.selectValidImageFile);
        return;
      }

      // Compress if > 2MB
      let processedPath = image.path;
      try {
        const RNFS = require('react-native-fs');
        const stats = await RNFS.stat(
          image.path.startsWith('file://')
            ? image.path.replace('file://', '')
            : image.path,
        );
        if (stats.size > 2 * 1024 * 1024) {
          processedPath = await compressImage(image.path, 0.7);
        }
      } catch (e) {
        console.warn('Compression check failed', e);
      }

      setSelectedImage({ ...image, path: processedPath });
    } catch (error) {
      showErrorToast(strings.error, strings.failedToProcessImage);
    }
  };

  const openCamera = () => {
    ImageCropPicker.openCamera({
      mediaType: 'photo',
      cropping: false,
      compressImageQuality: 0.8,
    })
      .then(processImage)
      .catch(() => {});
  };

  const openGallery = () => {
    ImageCropPicker.openPicker({
      mediaType: 'photo',
      cropping: false,
      compressImageQuality: 0.8,
    })
      .then(processImage)
      .catch(() => {});
  };

  const handleConfirm = async () => {
    if (!selectedImage) {
      showErrorToast(strings.depositProofRequired, strings.depositProofInstructions);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to S3
      const uploadResult = await uploadImageToS3(selectedImage.path, (progress) => {
        setUploadProgress(progress);
      });

      if (!uploadResult?.url) {
        throw new Error('Upload failed');
      }

      // Call parent with the uploaded URL
      await onConfirm(uploadResult.url);

      // Reset state
      setSelectedImage(null);
      setUploadProgress(0);
    } catch (error) {
      showErrorToast(strings.error, error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedImage(null);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <ZSafeAreaView>
        <ZHeader
          title={strings.depositProofTitle}
          onBack={handleClose}
        />

        <ScrollView
          style={localStyles.container}
          contentContainerStyle={localStyles.contentContainer}
          showsVerticalScrollIndicator={false}>

          {/* Deposit Amount Card */}
          <View style={[localStyles.amountCard, {
            backgroundColor: (colors.orange || '#FF9800') + '15',
            borderColor: colors.orange || '#FF9800',
          }]}>
            <Ionicons
              name="wallet-outline"
              size={moderateScale(28)}
              color={colors.orange || '#FF9800'}
            />
            <View style={localStyles.amountInfo}>
              <ZText type="M14" color={colors.grayScale7}>
                {strings.depositProofAmount}
              </ZText>
              <ZText type="B24" color={colors.orange || '#FF9800'}>
                {order.depositAmount?.toFixed(2)} {strings.currency}
              </ZText>
            </View>
          </View>

          {/* Instructions */}
          <View style={[localStyles.instructionCard, { backgroundColor: colors.inputBg }]}>
            <Ionicons
              name="information-circle-outline"
              size={moderateScale(20)}
              color={colors.primary}
            />
            <ZText
              type="M14"
              color={colors.textColor}
              style={localStyles.instructionText}>
              {strings.depositProofInstructions}
            </ZText>
          </View>

          {/* Image Upload Area */}
          {selectedImage ? (
            <View style={localStyles.previewContainer}>
              <Image
                source={{ uri: selectedImage.path }}
                style={localStyles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[localStyles.changePhotoButton, { backgroundColor: colors.primary + '20' }]}
                onPress={handlePickImage}
                disabled={isUploading}>
                <Ionicons
                  name="camera-outline"
                  size={moderateScale(18)}
                  color={colors.primary}
                />
                <ZText type="B14" color={colors.primary} style={themeStyles.ml5}>
                  {strings.depositProofChangePhoto}
                </ZText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[localStyles.uploadArea, {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '08',
              }]}
              onPress={handlePickImage}
              activeOpacity={0.7}>
              <Ionicons
                name="cloud-upload-outline"
                size={moderateScale(48)}
                color={colors.primary}
              />
              <ZText
                type="B16"
                color={colors.primary}
                style={localStyles.uploadText}>
                {strings.depositProofUpload}
              </ZText>
            </TouchableOpacity>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <View style={localStyles.progressContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ZText type="M14" color={colors.grayScale7} style={themeStyles.ml10}>
                {strings.depositProofUploading} {uploadProgress}%
              </ZText>
            </View>
          )}
        </ScrollView>

        {/* Confirm Button */}
        <View style={[localStyles.buttonContainer, { backgroundColor: colors.backgroundColor }]}>
          <ZButton
            title={isUploading ? strings.depositProofUploading : strings.depositProofConfirm}
            textType="B16"
            color={colors.white}
            containerStyle={[
              localStyles.confirmButton,
              {
                backgroundColor: selectedImage && !isUploading ? colors.primary : colors.grayScale5,
              },
            ]}
            onPress={handleConfirm}
            disabled={!selectedImage || isUploading}
          />
        </View>
      </ZSafeAreaView>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: moderateScale(16),
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    marginBottom: moderateScale(16),
  },
  amountInfo: {
    marginStart: moderateScale(12),
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  instructionText: {
    flex: 1,
    marginStart: moderateScale(8),
    lineHeight: moderateScale(20),
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: screenWidth - moderateScale(32),
    height: screenWidth * 0.7,
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(16),
  },
  buttonContainer: {
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  confirmButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
});

export default DepositProofModal;
