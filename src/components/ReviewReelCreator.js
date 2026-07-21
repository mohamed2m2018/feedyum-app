import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { showErrorToast, showWarningToast } from '../utils/toast';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import { useMutation, useQueryClient } from 'react-query';
import { useBackgroundUpload } from '../providers/BackgroundUploadProvider';

import ZSafeAreaView from './common/ZSafeAreaView';
import ZText from './common/ZText';
import ZButton from './common/ZButton';
import ZLoader from './common/ZLoader';
import MediaSelectionModal from './modals/MediaSelectionModal';
import { moderateScale } from '../common/constants';
import { styles } from '../themes';
import request from '../api/request';
import strings from '../i18n/strings';
import { StackNav } from '../navigation/NavigationKeys';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ReviewReelCreator = ({ route }) => {
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
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Handle create, edit, and mission modes
  const {
    dishData,
    menuData,
    missionData,
    missionId: missionParamId,
    reviewType = 'dish',
    editMode = false,
    reviewData = null,
    scoutData = null,
  } = route.params;

  const isMissionReview = reviewType === 'mission';
  const displayName = isMissionReview
    ? (missionData?.restaurantName || missionData?.title || 'Restaurant')
    : (reviewType === 'dish' ? dishData?.name : menuData?.name);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'video' or 'image'
  const [caption, setCaption] = useState(editMode ? (reviewData?.caption || '') : '');
  const [rating, setRating] = useState(editMode ? (reviewData?.rating || 5) : 5);
  const [isLoading, setIsLoading] = useState(false);
  const submissionKey = useRef(
    `review-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const allowExitRef = useRef(false);

  // Pre-populate media for edit mode
  useEffect(() => {
    if (editMode && reviewData) {
      if (reviewData.uri) {
        setSelectedMedia({ path: reviewData.uri, mime: 'video/mp4' });
        setMediaType('video');
      } else if (reviewData.avatarUri) {
        setSelectedMedia({ path: reviewData.avatarUri, mime: 'image/jpeg' });
        setMediaType('image');
      }
    }
  }, [editMode, reviewData]);

  const hasUnsavedWork = Boolean(selectedMedia || caption.trim() || isMediaUploading);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowExitRef.current || !hasUnsavedWork) return;
      event.preventDefault();
      Alert.alert(
        strings.discardChanges || 'Leave this review?',
        isMediaUploading
          ? (strings.uploadInProgressExitWarning || 'Your upload is still in progress. Leaving will cancel this submission.')
          : (strings.unsavedChangesWarning || 'Your selected media and review text will be discarded.'),
        [
          {text: strings.stay || 'Stay', style: 'cancel'},
          {
            text: strings.leave || 'Leave',
            style: 'destructive',
            onPress: () => {
              allowExitRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedWork, isMediaUploading]);

  const handleClose = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(StackNav.MissionsHub);
  };


  const handleSelectMedia = () => {
    setIsModalVisible(true);
  };

  const recordVideo = async () => {
    try {
      const video = await ImagePicker.openCamera({
        mediaType: 'video',
        quality: 0.8,
        duration: 60, // 60 seconds max
      });

      setSelectedMedia(video);
      setMediaType('video');

      // Start background upload - user can fill form while uploading
      handleMediaUpload(video, false);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        showErrorToast(strings.error, strings.failedToRecordVideo);
      }
    }
  };

  const takePhoto = async () => {
    try {
      const image = await ImagePicker.openCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      setSelectedMedia(image);
      setMediaType('image');

      // Start background upload - user can fill form while uploading
      handleMediaUpload(image, true);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        showErrorToast(strings.error, strings.failedToTakePhoto);
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const media = await ImagePicker.openPicker({
        mediaType: 'any',
        quality: 0.8,
      });

      const isImage = media.mime.startsWith('image/');
      setSelectedMedia(media);
      setMediaType(isImage ? 'image' : 'video');

      // Start background upload - user can fill form while uploading
      handleMediaUpload(media, isImage);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        showErrorToast(strings.error, strings.failedToSelectMedia);
      }
    }
  };

  // Handle media upload when media is selected - fires in background (no await)
  const handleMediaUpload = (media, isImage) => {
    // Start background upload - don't await, let user fill form while uploading
    uploadData(
      media,
      setIsMediaUploading,
      setLocalUri,
      isImage,
    );
  };

  const handleSubmitReview = () => {


    if (!selectedMedia) {
      showWarningToast(strings.error, strings.pleaseSelectPhotoOrVideo);
      return;
    }

    if (!caption.trim()) {
      showWarningToast(strings.error, strings.pleaseAddCaption);
      return;
    }

    if (caption.trim().length < 10) {
      showWarningToast(strings.error, strings.captionMustBe10Characters);
      return;
    }

    // Additional validation (skip for mission reviews)
    if (!isMissionReview) {
      if (reviewType === 'dish' && !dishData?._id) {
        showErrorToast(strings.error, strings.dishDataMissing);
        return;
      }

      if (reviewType === 'menu' && !menuData?._id) {
        showErrorToast(strings.error, strings.menuDataMissing);
        return;
      }
    }

    // Find category ID if dish has a category, otherwise use default
    let categoryIds = [];
    if (dishData?.category) {
      categoryIds = [dishData.category];
    } else {
      categoryIds = ['Food'];
    }

    // Prepare the post data for review
    const postData = {
      caption: caption.trim(),
      reviewMode: true,
      reviewType: isMissionReview ? 'restaurant' : reviewType,
      rating: rating,
      dishes: reviewType === 'dish' ? [dishData?._id] : [],
      reviewedDish: reviewType === 'dish' ? dishData?._id : undefined,
      reviewedMenu: reviewType === 'menu' ? menuData?._id : undefined,
      title: `Review: ${displayName}`,
      allowContact: true,
      category: categoryIds,
      ...(isMissionReview && {
        missionId: missionParamId || missionData?._id,
        idempotencyKey: submissionKey.current,
        targetChefId: missionData?.restaurantId,
        ...(scoutData && {
          googlePlaceId: scoutData.googlePlaceId,
          restaurantName: scoutData.restaurantName,
          restaurantAddress: scoutData.restaurantAddress,
          ...(scoutData.location && { location: scoutData.location }),
        }),
      }),
      ...(editMode && {
        _id: reviewData._id,
        isEdit: true
      })
    };



    // Set the data and trigger submission

    handleDataToBeSent(postData);


    setisFormFilled(true);


    // Navigate to For You screen - BackgroundUploadProvider now correctly navigates to TabNav.ForYou
    allowExitRef.current = true;
    handleClose();
  };

  const renderHeader = () => (
    <View style={[localStyles.header, { backgroundColor: colors.backgroundColor }]}>
      <TouchableOpacity
        style={localStyles.headerButton}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel={strings.close || 'Close'}
        testID="review-creator-close"
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
      </TouchableOpacity>

      <ZText type="B18" color={colors.textColor}>
        {editMode
          ? strings.editReview
          : isMissionReview
            ? (missionData?.title || displayName)
            : `${strings.review} ${displayName}`
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
          {strings.createYourReviewPost}
        </ZText>

        <ZText type="M16" color={colors.grayScale5} style={localStyles.selectionSubtitle}>
          {isMissionReview
            ? `Create content for ${displayName}`
            : `${strings.shareExperienceWith} ${displayName}`
          }
        </ZText>

        <View style={localStyles.videoButtons}>
          <TouchableOpacity
            style={[localStyles.videoButton, { backgroundColor: colors.primary }]}
            onPress={handleSelectMedia}
            disabled={isLoading}>
            <Ionicons name="camera" size={moderateScale(24)} color={colors.white} />
            <ZText type="B16" color={colors.white} style={styles.ml8}>
              {strings.addPhotoVideo}
            </ZText>
          </TouchableOpacity>
        </View>

        <ZText type="M12" color={colors.grayScale5} style={localStyles.videoNote}>
          {strings.mediaNote}
        </ZText>
      </View>
    </View>
  );

  const renderReviewForm = () => (
    <View style={[localStyles.reviewForm, { backgroundColor: colors.backgroundColor }]}>
      {/* Media Preview */}
      <View style={localStyles.videoPreviewSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          {strings.yourReview} {mediaType === 'video' ? strings.videoMedia : strings.photo}
        </ZText>
        <View style={localStyles.videoPreview}>
          <Ionicons
            name={mediaType === 'video' ? 'videocam' : 'image'}
            size={moderateScale(40)}
            color={colors.primary}
          />
          <ZText type="M14" color={colors.textColor} style={styles.mt8}>
            {isMediaUploading
              ? strings.uploading
              : `${mediaType === 'video' ? strings.videoMedia : strings.photo} ${strings.mediaReady}`
            }
          </ZText>
          <TouchableOpacity
            style={localStyles.changeVideoButton}
            onPress={handleSelectMedia}>
            <ZText type="B12" color={colors.primary}>
              {strings.change} {mediaType === 'video' ? strings.videoMedia : strings.photo}
            </ZText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rating */}
      <View style={localStyles.ratingSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          {strings.rateYourExperience}
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
          {strings.shareYourThoughts}
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
          placeholder={strings.reviewPlaceholderMinChars}
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
            ? strings.updateReview
            : strings.postReview
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

      <MediaSelectionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onRecordVideo={recordVideo}
        onTakePhoto={takePhoto}
        onPickFromGallery={pickFromGallery}
      />
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
