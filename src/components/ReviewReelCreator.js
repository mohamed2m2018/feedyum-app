import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import {useMutation, useQueryClient} from 'react-query';
import {useBackgroundUpload} from '../providers/BackgroundUploadProvider';

import ZSafeAreaView from './common/ZSafeAreaView';
import ZText from './common/ZText';
import ZButton from './common/ZButton';
import ZLoader from './common/ZLoader';
import {moderateScale} from '../common/constants';
import {styles} from '../themes';
import request from '../api/request';
import strings from '../i18n/strings';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const ReviewReelCreator = ({route}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {
    handleDataToBeSent,
    setisFormFilled,
    uploadData,
  } = useBackgroundUpload();
  
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [localUri, setLocalUri] = useState('');
  
  // Handle both create and edit modes
  const {
    dishData, 
    menuData, 
    reviewType = 'dish',
    editMode = false,
    reviewData = null
  } = route.params;
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'video' or 'image'
  const [caption, setCaption] = useState(editMode ? (reviewData?.caption || '') : '');
  const [rating, setRating] = useState(editMode ? (reviewData?.rating || 5) : 5);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-populate media for edit mode
  useEffect(() => {
    if (editMode && reviewData) {
      if (reviewData.uri) {
        setSelectedMedia({path: reviewData.uri, mime: 'video/mp4'});
        setMediaType('video');
      } else if (reviewData.avatarUri) {
        setSelectedMedia({path: reviewData.avatarUri, mime: 'image/jpeg'});
        setMediaType('image');
      }
    }
  }, [editMode, reviewData]);


  const handleSelectMedia = () => {
    Alert.alert(
      'Create Review Post',
      'Choose how you want to create your review',
      [
        {
          text: 'Record Video',
          onPress: recordVideo,
        },
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const recordVideo = async () => {
    try {
      setIsLoading(true);
      const video = await ImagePicker.openCamera({
        mediaType: 'video',
        quality: 0.8,
        duration: 60, // 60 seconds max
      });
      
      setSelectedMedia(video);
      setMediaType('video');
      
      // Upload the media immediately
      await handleMediaUpload(video, false);
    } catch (error) {
      setIsLoading(false);
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert(strings.error, strings.failedToRecordVideo);
      }
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      const image = await ImagePicker.openCamera({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      setSelectedMedia(image);
      setMediaType('image');
      
      // Upload the media immediately
      await handleMediaUpload(image, true);
    } catch (error) {
      setIsLoading(false);
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert(strings.error, strings.failedToTakePhoto);
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsLoading(true);
      const media = await ImagePicker.openPicker({
        mediaType: 'any',
        quality: 0.8,
      });
      
      const isImage = media.mime.startsWith('image/');
      setSelectedMedia(media);
      setMediaType(isImage ? 'image' : 'video');
      
      // Upload the media immediately
      await handleMediaUpload(media, isImage);
    } catch (error) {
      setIsLoading(false);
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert(strings.error, strings.failedToSelectMedia);
      }
    }
  };

  // Handle media upload when media is selected
  const handleMediaUpload = async (media, isImage) => {
    try {
      setIsLoading(true);
      await uploadData(
        media,
        setIsMediaUploading,
        setLocalUri,
        isImage,
      );
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Media upload error:', error);
      Alert.alert(strings.error, strings.failedToUploadMedia);
    }
  };

  const handleSubmitReview = () => {

    
    if (!selectedMedia) {

      Alert.alert(strings.error, strings.pleaseSelectPhotoOrVideo);
      return;
    }

    if (!caption.trim()) {

      Alert.alert(strings.error, strings.pleaseAddCaption);
      return;
    }

    if (caption.trim().length < 10) {

      Alert.alert(strings.error, strings.captionMustBe10Characters);
      return;
    }

    // Additional validation
    if (reviewType === 'dish' && !dishData?._id) {

      Alert.alert(strings.error, strings.dishDataMissing);
      return;
    }

    if (reviewType === 'menu' && !menuData?._id) {

      Alert.alert(strings.error, strings.menuDataMissing);
      return;
    }

    // Find category ID if dish has a category, otherwise use default
    let categoryIds = [];
    if (dishData?.category) {
      categoryIds = [dishData.category];
    } else {
      // Use a default category for reviews
      categoryIds = ['Food'];
    }

    // Prepare the post data for review
    const postData = {
      caption: caption.trim(),
      reviewMode: true,
      reviewType: reviewType,
      rating: rating,
      dishes: reviewType === 'dish' ? [dishData._id] : [],
      reviewedDish: reviewType === 'dish' ? dishData._id : undefined,
      reviewedMenu: reviewType === 'menu' ? menuData?._id : undefined,
      title: `Review: ${reviewType === 'dish' ? dishData?.name : menuData?.name}`,
      allowContact: true,
      category: categoryIds,
      // Add edit-specific fields
      ...(editMode && {
        _id: reviewData._id,
        isEdit: true
      })
    };



    // Set the data and trigger submission

    handleDataToBeSent(postData);
    

    setisFormFilled(true);


    // Navigate to For You screen - BackgroundUploadProvider now correctly navigates to TabNav.ForYou
    navigation.goBack();
  };

  const renderHeader = () => (
    <View style={[localStyles.header, {backgroundColor: colors.backgroundColor}]}>
      <TouchableOpacity
        style={localStyles.headerButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
      </TouchableOpacity>
      
      <ZText type="B18" color={colors.textColor}>
        {editMode 
          ? 'Edit Review' 
          : `Review ${reviewType === 'dish' ? dishData?.name : menuData?.name}`
        }
      </ZText>
      
      <View style={localStyles.headerButton} />
    </View>
  );

  const renderVideoSelection = () => (
    <View style={localStyles.videoSelectionContainer}>
      <View style={localStyles.videoSelectionContent}>
        <Ionicons
          name="videocam"
          size={moderateScale(80)}
          color={colors.primary}
          style={localStyles.videoIcon}
        />
        
        <ZText type="B20" color={colors.textColor} style={localStyles.selectionTitle}>
          Create Your Review Post
        </ZText>
        
        <ZText type="M16" color={colors.grayScale5} style={localStyles.selectionSubtitle}>
          Share your experience with {reviewType === 'dish' ? dishData?.name : menuData?.name}
        </ZText>
        
        <View style={localStyles.videoButtons}>
          <TouchableOpacity
            style={[localStyles.videoButton, {backgroundColor: colors.primary}]}
            onPress={handleSelectMedia}
            disabled={isLoading}>
            <Ionicons name="camera" size={moderateScale(24)} color={colors.white} />
            <ZText type="B16" color={colors.white} style={styles.ml8}>
              Add Photo/Video
            </ZText>
          </TouchableOpacity>
        </View>
        
        <ZText type="M12" color={colors.grayScale5} style={localStyles.videoNote}>
          You can add photos or videos (max 60 seconds for videos)
        </ZText>
      </View>
    </View>
  );

  const renderReviewForm = () => (
    <View style={[localStyles.reviewForm, {backgroundColor: colors.backgroundColor}]}>
      {/* Media Preview */}
      <View style={localStyles.videoPreviewSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          Your Review {mediaType === 'video' ? 'Video' : 'Photo'}
        </ZText>
        <View style={localStyles.videoPreview}>
          <Ionicons 
            name={mediaType === 'video' ? 'videocam' : 'image'} 
            size={moderateScale(40)} 
            color={colors.primary} 
          />
          <ZText type="M14" color={colors.textColor} style={styles.mt8}>
            {isMediaUploading 
              ? 'Uploading...' 
              : `${mediaType === 'video' ? 'Video' : 'Photo'} Ready`
            }
          </ZText>
          <TouchableOpacity
            style={localStyles.changeVideoButton}
            onPress={handleSelectMedia}>
            <ZText type="B12" color={colors.primary}>
              Change {mediaType === 'video' ? 'Video' : 'Photo'}
            </ZText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rating */}
      <View style={localStyles.ratingSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          Rate your experience
        </ZText>
        <View style={localStyles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={moderateScale(32)}
                color={star <= rating ? '#FFD700' : colors.grayScale5}
                style={localStyles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Caption Input */}
      <View style={localStyles.captionSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          Share your thoughts
        </ZText>
        <TextInput
          style={[
            localStyles.captionInput,
            {
              backgroundColor: colors.inputBg,
              color: colors.textColor,
              borderColor: colors.borderColor,
            },
          ]}
          placeholder="Tell others about your experience... (minimum 10 characters)"
          placeholderTextColor={colors.grayScale5}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <ZText 
          type="M12" 
          color={caption.length < 10 ? '#FF4D67' : colors.grayScale5} 
          style={localStyles.characterCount}
        >
          {caption.length}/500 {caption.length < 10 ? '(minimum 10 characters)' : ''}
        </ZText>
      </View>

      {/* Submit Button */}
      <ZButton
        title={isLoading || isMediaUploading 
          ? 'Processing...' 
          : editMode 
            ? 'Update Review' 
            : 'Post Review'
        }
        onPress={handleSubmitReview}
        disabled={isLoading || isMediaUploading || !selectedMedia}
        containerStyle={localStyles.submitButton}
      />
    </View>
  );



  return (
    <ZSafeAreaView>
      {renderHeader()}
      
      {!selectedMedia ? (
        renderVideoSelection()
      ) : (
        renderReviewForm()
      )}
      
      {isLoading && (
        <View style={localStyles.loadingOverlay}>
          <ZLoader />
        </View>
      )}
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  headerButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },

  videoSelectionContent: {
    alignItems: 'center',
    width: '100%',
  },

  videoIcon: {
    marginBottom: moderateScale(20),
  },

  selectionTitle: {
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },

  selectionSubtitle: {
    marginBottom: moderateScale(40),
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },

  videoButtons: {
    width: '100%',
    gap: moderateScale(16),
    marginBottom: moderateScale(20),
  },

  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(12),
  },

  videoNote: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  reviewForm: {
    flex: 1,
    padding: moderateScale(20),
  },

  videoPreviewSection: {
    marginBottom: moderateScale(30),
  },

  videoPreview: {
    alignItems: 'center',
    padding: moderateScale(20),
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.2)',
  },

  changeVideoButton: {
    marginTop: moderateScale(12),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
  },

  ratingSection: {
    marginBottom: moderateScale(30),
  },

  sectionTitle: {
    marginBottom: moderateScale(15),
  },

  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  star: {
    marginHorizontal: moderateScale(8),
  },

  captionSection: {
    marginBottom: moderateScale(30),
  },

  captionInput: {
    height: moderateScale(120),
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8),
  },

  characterCount: {
    textAlign: 'right',
  },

  submitButton: {
    marginTop: moderateScale(20),
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: moderateScale(20),
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default ReviewReelCreator;