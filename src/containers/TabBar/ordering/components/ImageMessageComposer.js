import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import { compressImage, validateImageFile, getFileSize, formatFileSize } from '../../../../utils/UploadUtils';
import strings from '../../../../i18n/strings';

const { width: screenWidth } = Dimensions.get('window');

const ImageMessageComposer = ({ onSend, onCancel }) => {
  const colors = useSelector(state => state.theme.theme);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const showImagePicker = () => {
    setIsVisible(true);
    Alert.alert(
      'Select Image',
      strings.chooseImageSelectionMethod,
      [
        { text: strings.camera, onPress: openCamera },
        { text: strings.gallery, onPress: openGallery },
        { text: strings.cancel, style: 'cancel', onPress: () => setIsVisible(false) },
      ]
    );
  };

  const processImage = async (image) => {
    setIsProcessing(true);
    try {
      // Validate image file
      if (!validateImageFile(image.path)) {
        Alert.alert(strings.invalidFile, strings.selectValidImageFile);
        return;
      }

      // Get file size
      const fileSize = await getFileSize(image.path);
      
      // Compress image if it's too large (> 2MB)
      let processedPath = image.path;
      if (fileSize > 2 * 1024 * 1024) {
        processedPath = await compressImage(image.path, 0.7);
      }

      const processedImage = {
        ...image,
        path: processedPath,
      };

      setSelectedImage(processedImage);
      setFileInfo({
        originalSize: fileSize,
        processedSize: await getFileSize(processedPath),
      });
      setIsVisible(false);
    } catch (error) {
Alert.alert(strings.processingError, strings.failedToProcessImage);
    } finally {
      setIsProcessing(false);
    }
  };

  const openCamera = () => {
    ImageCropPicker.openCamera({
      mediaType: 'photo',
      width: 1024,
      height: 1024,
      cropping: true,
      compressImageQuality: 0.8,
    }).then(processImage).catch(error => {
setIsVisible(false);
    });
  };

  const openGallery = () => {
    ImageCropPicker.openPicker({
      mediaType: 'photo',
      width: 1024,
      height: 1024,
      cropping: true,
      compressImageQuality: 0.8,
    }).then(processImage).catch(error => {
setIsVisible(false);
    });
  };

  const handleSend = () => {
    if (!selectedImage) {
      showImagePicker();
      return;
    }

    const imageMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: messageText.trim(),
      createdAt: new Date(),
      image: selectedImage.path,
    };

    onSend(imageMessage);
    resetComposer();
  };

  const resetComposer = () => {
    setSelectedImage(null);
    setMessageText('');
    onCancel?.();
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  if (isProcessing) {
    return (
      <View style={[styles.addImageButton, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="small" color={colors.white} />
      </View>
    );
  }

  if (!selectedImage) {
    return (
      <TouchableOpacity
        style={[styles.addImageButton, { backgroundColor: colors.primary }]}
        onPress={showImagePicker}
      >
        <Ionicons
          name="camera"
          size={moderateScale(24)}
          color={colors.white}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBg }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: selectedImage.path }}
          style={styles.selectedImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.red }]}
          onPress={removeImage}
        >
          <Ionicons
            name="close"
            size={moderateScale(16)}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.textColor,
              backgroundColor: colors.backgroundColor,
              borderColor: colors.bColor,
            }
          ]}
          placeholder={strings.addCaption}
          placeholderTextColor={colors.grayScale7}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.grayScale3 }]}
            onPress={resetComposer}
          >
            <ZText type="M14" color={colors.textColor}>{strings.cancel}</ZText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
          >
            <ZText type="M14" color={colors.white}>{strings.send}</ZText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    margin: moderateScale(8),
    borderWidth: 1,
  },
  addImageButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(4),
    marginRight: moderateScale(4),
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: moderateScale(12),
  },
  selectedImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.4,
    borderRadius: moderateScale(8),
  },
  removeButton: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    gap: moderateScale(12),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    minHeight: moderateScale(40),
    maxHeight: moderateScale(100),
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  actionButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
});

export default ImageMessageComposer;