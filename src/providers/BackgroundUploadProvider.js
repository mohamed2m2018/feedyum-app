import React, { createContext, useEffect, useState } from 'react';
import { convertVideoToMP4, generateThumbnail } from '../utils/UploadUtils';
import BackgroundUpload from 'react-native-background-upload';
import { ALERT_TYPE, Dialog, Toast } from 'react-native-alert-notification';
import { showSuccessToast, showErrorToast, showWarningToast, showPersistentSuccessToast, hideToast } from '../utils/toast';
import { useMutation, useQueryClient } from 'react-query';
import request from '../api/request';
import { Platform } from 'react-native';
import strings from '../i18n/strings';
import { useNavigation } from '@react-navigation/native';
import { TabNav } from '../navigation/NavigationKeys';

const BackgroundUploadContext = createContext();

export function useBackgroundUpload() {
  return React.useContext(BackgroundUploadContext);
}

export function BackgroundUploadProvider({ children }) {
  const queryClient = useQueryClient();
  const [isFormFilled, setisFormFilled] = useState(false);
  const [dataToBeSent, setDataToBeSent] = useState({});
  const [editedData, seteditedData] = useState({});
  const [imageId, setImageId] = useState();
  const [videoId, setVideoId] = useState();
  const navigation = useNavigation();

  const [toastTitle, settoastTitle] = useState(strings.uploadingFile);

  function generateUniqueFileName() {
    const timestamp = new Date().getTime(); // Get current timestamp
    const randomString = Math.random().toString(36).substring(7); // Generate a random string

    return `${timestamp}_${randomString}`;
  }

  const addNewPost = data => {
    // Use different endpoint for review reels
    if (data.reviewMode) {
      // Map field names for review reel endpoint
      const reviewReelData = {
        caption: data.caption,
        rating: data.rating,
        reviewType: data.reviewType,
        dishId: data.reviewedDish,
        menuId: data.reviewedMenu,
        // Include media URLs if they exist
        uri: data.uri,
        avatarUri: data.avatarUri,
        poster: data.poster,
      };
      return request.post('/story/create-review-reel', reviewReelData);
    }
    return request.post('/story/add_story', data);
  };

  const editPost = () => {
    const { _id, ...data } = dataToBeSent;
    return request.patch('/story/update_story', {
      id: _id,
      ...data,
    });
  };

  const { mutate } = useMutation(dataToBeSent?.isEdit ? editPost : addNewPost, {
    onSuccess: () => {
      // Invalidate all stories queries to force refetch and show new post
      queryClient.invalidateQueries('stories');
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries('user');
      queryClient.invalidateQueries({ queryKey: 'profile-stories' });
      queryClient.invalidateQueries({ queryKey: 'profile-reviews' });
      queryClient.invalidateQueries({ queryKey: 'stories_following' });
      queryClient.invalidateQueries({ queryKey: ['stories-following'] });
      setImageId();
      setVideoId();
    },
    onError: () => {
      setImageId(undefined);
      setVideoId(undefined);
    },
  });

  useEffect(() => {
    if (isFormFilled) {
      showPersistentSuccessToast(
        dataToBeSent?.isEdit ? strings.editingPost : strings.addingPost,
        toastTitle
      );
    }
  }, [isFormFilled, toastTitle]);

  useEffect(() => {
    let EditValidation = true;
    if (dataToBeSent && dataToBeSent?.mediaIsEdited) {
      EditValidation =
        (dataToBeSent?.uri !== editedData?.uri &&
          editedData.poster !== dataToBeSent.poster) ||
        (editedData.avatarUri &&
          editedData.avatarUri !== dataToBeSent.avatarUri);
    }
    const validation =
      (dataToBeSent?.uri || dataToBeSent?.avatarUri) &&
      (dataToBeSent?.poster || dataToBeSent?.isImage) &&
      EditValidation;

    if (isFormFilled && validation) {
      handleCreatePost(dataToBeSent);
    }
  }, [isFormFilled, dataToBeSent, editedData]);

  const handleCreatePost = data => {
    console.log('--- DEBUG: handleCreatePost called ---');
    console.log('Data to be sent:', JSON.stringify(data, null, 2));

    if (isFormFilled) {
      settoastTitle(strings.processingThumbnail);

      mutate(data, {
        onSuccess: async res => {
          // Invalidate all stories to show new post in feed
          await queryClient.invalidateQueries({ queryKey: 'stories' });
          await queryClient.invalidateQueries({ queryKey: ['stories'] });
          await queryClient.invalidateQueries({ queryKey: ['stories-following'] });
          await queryClient.invalidateQueries({
            queryKey: 'profile-stories',
          });
          await queryClient.invalidateQueries({
            queryKey: 'profile-reviews',
          });
          await queryClient.invalidateQueries({ queryKey: 'user' });

          setisFormFilled(false);
          setDataToBeSent({});
          settoastTitle(strings.congratulations);
          setTimeout(() => {
            hideToast();
            settoastTitle('');
          }, 500);
          navigation.navigate(TabNav.FollowingTab, {
            storyId: res?.data?.story?._id,
          });
        },
        onError: err => {
          Dialog.hide();
          setisFormFilled(false);
          // Handle validation errors specifically
          if (err.details && typeof err.details === 'object') {
            const errorMessages = Object.values(err.details).join(', ');
            showErrorToast(strings.uploadError, `Validation error: ${errorMessages}`);
          } else if (err.message) {
            showErrorToast(strings.uploadError, err.message);
          } else {
            showErrorToast(strings.uploadError, err[Object.keys(err)?.[0]] || 'Unknown error occurred');
          }
        },
      });
    }
  };

  const handleDataToBeSent = formData => {
    const { uri, poster, avatarUri, ...data } = formData;
    setDataToBeSent(prevData => ({
      ...prevData,
      ...data,
    }));
  };

  const handleEditedData = data => {
    setDataToBeSent(data);
    seteditedData(data);
  };

  const handleEditUser = (phone, locations) => {
    request
      .patch('/user', {
        phone,
        locations,
      })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: 'user' });
      })
      .catch(err =>
        showErrorToast(strings.error, err[Object.keys(err)?.[0]])
      );
  };

  const uploadData = async (
    response,
    setIsMediaUploading,
    setlocalUri,
    isImage,
  ) => {
    if (isFormFilled) {
      showWarningToast(strings.pleaseWait, '');
      setlocalUri('');
      setTimeout(() => {
        showSuccessToast(strings.success, toastTitle);
      }, 4000);

      return;
    } else {
      try {
        await BackgroundUpload.cancelUpload(videoId);
      } catch { }
      try {
        await BackgroundUpload.cancelUpload(imageId);
      } catch { }
    }
    try {
      setIsMediaUploading(true);
      let poster =
        Platform.OS === 'ios'
          ? 'file://' + response.path
          : response.path?.replace('file://', '');
      if (!isImage) {
        poster = await generateThumbnail(response.path);
        setlocalUri(poster.path);
      } else {
        setlocalUri(response.path);
      }

      setIsMediaUploading(false);
      let fileInfoVideo = {};
      let mp4Path = {};
      if (!isImage) {
        settoastTitle(strings.processingThumbnail);
        mp4Path = await convertVideoToMP4(response.path);
        mp4Path =
          Platform.OS === 'ios'
            ? 'file://' + mp4Path
            : mp4Path?.replace('file://', '');
        poster =
          Platform.OS === 'ios'
            ? 'file://' + poster.path
            : poster.path?.replace('file://', '');
        fileInfoVideo = await BackgroundUpload.getFileInfo(mp4Path);
      }
      const fileInfoImage = await BackgroundUpload.getFileInfo(poster);

      // Helper function to upload using presigned URL with BackgroundUpload
      const uploadWithPresignedUrl = (filePath, fileType, mimeType) => {
        return new Promise(async (resolve, reject) => {
          try {
            // Step 1: Get presigned URL from backend (secrets stay on backend!)
            console.log(`Getting presigned URL for ${fileType}...`);
            const urlResponse = await request.get('/story/get-upload-url', {
              params: { type: fileType, extension: mimeType.split('/')[1] || 'jpg' }
            });

            if (!urlResponse.data?.success || !urlResponse.data?.presignedUrl) {
              reject(new Error('Failed to get presigned URL'));
              return;
            }

            const { presignedUrl, publicUrl, contentType } = urlResponse.data;
            console.log(`Got presigned URL, uploading ${fileType} directly to R2...`);

            // Step 2: Upload directly to R2 using BackgroundUpload with PUT method
            const uploadOptions = {
              url: presignedUrl,
              path: filePath,
              method: 'PUT',
              type: 'raw', // Raw body, not multipart
              headers: {
                'Content-Type': contentType,
              },
              maxRetries: 2,
            };

            BackgroundUpload.startUpload(uploadOptions)
              .then(uploadId => {
                BackgroundUpload.addListener('progress', uploadId, data => {
                  settoastTitle(`${strings.uploadingMedia} ${Number(data.progress)?.toFixed()}%..`);
                });

                BackgroundUpload.addListener('error', uploadId, data => {
                  console.log('R2 upload error:', data);
                  reject(new Error(data.error || 'Upload failed'));
                });

                BackgroundUpload.addListener('completed', uploadId, data => {
                  console.log(`${fileType} uploaded successfully:`, publicUrl);
                  console.log('R2 response status:', data.responseCode);
                  if (data.responseCode >= 200 && data.responseCode < 300) {
                    resolve(publicUrl);
                  } else {
                    reject(new Error(`Upload failed with status ${data.responseCode}`));
                  }
                });
              })
              .catch(err => {
                console.log('BackgroundUpload start error:', err);
                reject(err);
              });
          } catch (err) {
            reject(err);
          }
        });
      };

      // Upload poster/image using presigned URL (single direct R2 upload!)
      settoastTitle(strings.uploadingMedia);
      try {
        console.log('Uploading image via presigned URL:', poster);
        const secureUrlImage = await uploadWithPresignedUrl(
          poster,
          'image',
          fileInfoImage.mimeType || 'image/jpeg'
        );

        setDataToBeSent(prevData => ({
          ...prevData,
          ...(isImage
            ? {
              avatarUri: secureUrlImage,
              poster: secureUrlImage,
              uri: secureUrlImage, // Set uri as well for consistency
              isImage: true,
            }
            : {
              poster: secureUrlImage,
            }),
        }));
      } catch (imageErr) {
        console.error('Image upload error:', imageErr);
        showErrorToast(strings.error, strings.uploadFailed);
        setIsMediaUploading(false);
        return;
      }

      // Upload video if not just an image
      if (!isImage) {
        try {
          settoastTitle(`${strings.uploadingMedia}...`);
          console.log('Uploading video via presigned URL:', mp4Path);
          const secureUrlVideo = await uploadWithPresignedUrl(
            mp4Path,
            'video',
            fileInfoVideo.mimeType || 'video/mp4'
          );

          setDataToBeSent(prevData => ({
            ...prevData,
            isImage,
            uri: secureUrlVideo,
          }));
        } catch (videoErr) {
          console.error('Video upload error:', videoErr);
          showErrorToast(strings.error, strings.uploadFailed);
          setIsMediaUploading(false);
          return;
        }
      }

      setIsMediaUploading(false);
    } catch (err) {
      // Show error message
      showErrorToast(strings.error, strings.uploadFailed);
    }
  };

  // Background upload for dish creation
  const uploadDish = async (dishData, menuId, userId, onSuccess, onError) => {
    try {
      // Show persistent toast immediately
      showPersistentSuccessToast(
        strings.addingDish || 'Adding dish...',
        strings.uploadingDishImage || 'Uploading dish image...'
      );

      let imageUrl = dishData.image || '';

      // Upload image to S3 if it's a local file path
      if (imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('/'))) {
        try {
          // Get presigned URL
          const extension = imageUrl.toLowerCase().substring(imageUrl.lastIndexOf('.') + 1) || 'jpg';
          const urlResponse = await request.get('/story/get-upload-url', {
            params: { type: 'image', extension }
          });

          if (!urlResponse.data?.success || !urlResponse.data?.presignedUrl) {
            throw new Error('Failed to get presigned URL');
          }

          const { presignedUrl, publicUrl, contentType } = urlResponse.data;

          // Format path for upload
          let uploadPath = imageUrl;
          if (Platform.OS === 'android' && !imageUrl.startsWith('file://')) {
            uploadPath = `file://${imageUrl}`;
          } else if (Platform.OS === 'ios' && imageUrl.startsWith('file://')) {
            uploadPath = imageUrl.replace('file://', '');
          }

          // Upload to R2 with progress
          await new Promise((resolve, reject) => {
            const uploadOptions = {
              url: presignedUrl,
              path: uploadPath,
              method: 'PUT',
              type: 'raw',
              headers: {
                'Content-Type': contentType,
              },
              maxRetries: 2,
            };

            BackgroundUpload.startUpload(uploadOptions)
              .then(uploadId => {
                BackgroundUpload.addListener('progress', uploadId, data => {
                  const progress = Number(data.progress)?.toFixed(0);
                  showPersistentSuccessToast(
                    strings.addingDish || 'Adding dish...',
                    strings.formatString
                      ? strings.formatString(strings.dishUploadProgress || 'Uploading... {0}%', progress)
                      : `Uploading... ${progress}%`
                  );
                });

                BackgroundUpload.addListener('error', uploadId, data => {
                  console.log('Dish image upload error:', data);
                  reject(new Error(data.error || 'Image upload failed'));
                });

                BackgroundUpload.addListener('completed', uploadId, data => {
                  if (data.responseCode >= 200 && data.responseCode < 300) {
                    imageUrl = publicUrl;
                    resolve();
                  } else {
                    reject(new Error(`Upload failed with status ${data.responseCode}`));
                  }
                });
              })
              .catch(reject);
          });
        } catch (uploadError) {
          console.error('Failed to upload dish image:', uploadError);
          // Continue without image if upload fails (image is optional)
          imageUrl = '';
        }
      }

      // Update toast for dish creation
      showPersistentSuccessToast(
        strings.addingDish || 'Adding dish...',
        strings.processingThumbnail || 'Creating dish...'
      );

      // Prepare request data
      const requestData = {
        name: dishData.name.trim(),
        description: dishData.description.trim(),
        price: parseFloat(dishData.price),
        category: (dishData.category || '').trim(),
        categories: Array.isArray(dishData.categories)
          ? dishData.categories
          : ((dishData.category && dishData.category.trim()) ? [dishData.category.trim()] : []),
        sectionName: dishData.section.trim(),
        menuId: menuId,
        image: imageUrl,
        cookingTime: dishData.cookingTime ? parseInt(dishData.cookingTime) : undefined,
        ingredients: dishData.ingredients,
        visible: dishData.visible,
      };

      // Create the dish
      const response = await request.post('/dishes', requestData);

      // Success! Hide toast and show success message
      hideToast();

      setTimeout(() => {
        showSuccessToast(
          strings.success || 'Success',
          strings.dishAddedSuccess || 'Dish added successfully!'
        );
      }, 300);

      // Invalidate queries to refresh dish list
      queryClient.invalidateQueries('menuDishes');
      queryClient.invalidateQueries('menuSections');

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Dish upload error:', error);
      hideToast();

      const errorMessage = error?.response?.data?.message || error?.message || strings.dishUploadFailed || 'Failed to add dish';
      showErrorToast(strings.error, errorMessage);

      if (onError) {
        onError(error);
      }
    }
  };

  const providerValue = {
    uploadData,
    handleDataToBeSent,
    handleEditUser,
    handleEditedData,
    setisFormFilled,
    uploadDish,
  };

  return (
    <BackgroundUploadContext.Provider value={providerValue}>
      {children}
    </BackgroundUploadContext.Provider>
  );
}
