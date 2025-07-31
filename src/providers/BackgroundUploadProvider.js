import React, {createContext, useEffect, useState} from 'react';
import {convertVideoToMP4, generateThumbnail} from '../utils/UploadUtils';
import BackgroundUpload from 'react-native-background-upload';
import {S3Policy} from 'react-native-aws3/src/S3Policy';
import {ALERT_TYPE, Dialog, Toast} from 'react-native-alert-notification';
import {useMutation, useQueryClient} from 'react-query';
import request from '../api/request';
import {Platform} from 'react-native';
import strings from '../i18n/strings';
import {useNavigation} from '@react-navigation/native';
import {TabNav} from '../navigation/NavigationKeys';

const BackgroundUploadContext = createContext();

export function useBackgroundUpload() {
  return React.useContext(BackgroundUploadContext);
}

export function BackgroundUploadProvider({children}) {
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
      
      console.log('Sending review reel data:', reviewReelData);
      return request.post('/story/create-review-reel', reviewReelData);
    }
    return request.post('/story/add_story', data);
  };

  const editPost = () => {
    const {_id, ...data} = dataToBeSent;
    return request.patch('/story/update_story', {
      id: _id,
      ...data,
    });
  };

  const {mutate} = useMutation(dataToBeSent?.isEdit ? editPost : addNewPost, {
    onSuccess: () => {
      // queryClient.invalidateQueries('stories'); // Invalidate the 'stories' query to trigger a refetch
      queryClient.invalidateQueries('user');
      queryClient.invalidateQueries({queryKey: 'profile-stories'});
      queryClient.invalidateQueries({queryKey: 'stories_following'});
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
      Toast.show({
        title: dataToBeSent?.isEdit ? strings.editingPost : strings.addingPost,
        textBody: toastTitle,
        autoClose: false,
        type: ALERT_TYPE.SUCCESS,
      });
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
    if (isFormFilled) {
      settoastTitle(strings.processingThumbnail);

      mutate(data, {
        onSuccess: async res => {
          // await queryClient.invalidateQueries({queryKey: 'stories'});
          await queryClient.invalidateQueries({
            queryKey: 'profile-stories',
          });
          await queryClient.invalidateQueries({queryKey: 'user'});

          setisFormFilled(false);
          setDataToBeSent({});
          settoastTitle(strings.congratulations);
          setTimeout(() => {
            Toast.hide();
            settoastTitle('');
          }, 500);
          navigation.navigate(TabNav.FollowingTab, {
            storyId: res?.data?.story?._id,
          });
        },
        onError: err => {
          Dialog.hide();
          setisFormFilled(false);
          
          console.error('Story creation error:', err);
          
          // Handle validation errors specifically
          if (err.details && typeof err.details === 'object') {
            const errorMessages = Object.values(err.details).join(', ');
            Toast.show({
              type: ALERT_TYPE.DANGER,
              title: strings.uploadError,
              textBody: `Validation error: ${errorMessages}`,
            });
          } else if (err.message) {
            Toast.show({
              type: ALERT_TYPE.DANGER,
              title: strings.uploadError,
              textBody: err.message,
            });
          } else {
            Toast.show({
              type: ALERT_TYPE.DANGER,
              title: strings.uploadError,
              textBody: err[Object.keys(err)?.[0]] || 'Unknown error occurred',
            });
          }
        },
      });
    }
  };

  const handleDataToBeSent = formData => {
    const {uri, poster, avatarUri, ...data} = formData;
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
        await queryClient.invalidateQueries({queryKey: 'user'});
      })
      .catch(err =>
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: strings.error,
          textBody: err[Object.keys(err)?.[0]],
        }),
      );
  };

  const uploadData = async (
    response,
    setIsMediaUploading,
    setlocalUri,
    isImage,
  ) => {
    if (isFormFilled) {
      Toast.show({
        textBody: strings.pleaseWait,
        type: ALERT_TYPE.WARNING,
      });
      setlocalUri('');
      setTimeout(() => {
        Toast.show({
          textBody: toastTitle,
          type: ALERT_TYPE.SUCCESS,
        });
      }, 4000);

      return;
    } else {
      try {
        await BackgroundUpload.cancelUpload(videoId);
      } catch {}
      try {
        await BackgroundUpload.cancelUpload(imageId);
      } catch {}
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
      let secureUrlImage = '';
      const optionsImage = {
        type: 'multipart',
        method: 'POST',
        headers: {
          'content-type': fileInfoImage.mimeType || 'image/jpg', // server requires a content-type header
          // 'content-length': `${fileInfoImage.size}`,
        },
        url: 'https://foodtokforever.s3.amazonaws.com',
        field: 'file',
        path: poster,
        maxRetries: 2,
        parameters: {
          ...S3Policy.generate({
            bucket: 'foodtokforever',
            region: 'eu-central-1',
            accessKey: '***REMOVED***',
            secretKey: '***REMOVED***',
            successActionStatus: 201,
            key: `${fileInfoImage.name}`,
            date: new Date(),
            contentType: fileInfoImage.mimeType || 'image/jpg',
          }),
        },
      };

      BackgroundUpload.startUpload(optionsImage)
        .then(uploadId => {
          setImageId(uploadId);
          BackgroundUpload.addListener('progress', uploadId, data => {
            settoastTitle(
              `${strings.uploadingMedia} ${Number(
                data.progress,
              )?.toFixed()}%..`,
            );
          });
          BackgroundUpload.addListener('error', uploadId, data => {
            console.log(`${strings.uploadError} ${data.error}%`);
          });
          BackgroundUpload.addListener('cancelled', uploadId, data => {
            console.log('Cancelled!', data);
          });
          BackgroundUpload.addListener('completed', uploadId, data => {
            // data includes responseCode: number and responseBody: Object
            const startTag = '<Location>';
            const endTag = '</Location>';
            const startIndex =
              data.responseBody.indexOf(startTag) + startTag.length;
            const endIndex = data.responseBody.indexOf(endTag);
            const link = data.responseBody.substring(startIndex, endIndex);
            secureUrlImage = link;
            setDataToBeSent(prevData => ({
              ...prevData,
              ...(isImage
                ? {
                    avatarUri: secureUrlImage,
                    isImage: true,
                  }
                : {
                    poster: secureUrlImage,
                  }),
            }));
          });
        })
        .catch(err => {
          console.log(`${strings.uploadError} ${err}`);
        });
      if (!isImage) {
        const optionsVideo = {
          type: 'multipart',
          method: 'POST',
          headers: {
            'content-type': fileInfoVideo.mimeType, // server requires a content-type header
            'content-length': `${fileInfoVideo.size}`,
          },
          url: 'https://foodtokforever.s3.amazonaws.com',
          field: 'file',
          path: mp4Path,
          maxRetries: 2,
          parameters: {
            ...S3Policy.generate({
              bucket: 'foodtokforever',
              region: 'eu-central-1',
              accessKey: '***REMOVED***',
              secretKey: '***REMOVED***',
              successActionStatus: 201,
              key: generateUniqueFileName(),
              date: new Date(),
              contentType: fileInfoVideo.mimeType,
            }),
          },
        };
        BackgroundUpload.startUpload(optionsVideo)
          .then(async uploadId => {
            setVideoId(uploadId);
            BackgroundUpload.addListener('progress', uploadId, data => {
              settoastTitle(
                `${strings.uploadingMedia} ${Number(
                  data.progress,
                )?.toFixed()}%..`,
              );
            });
            BackgroundUpload.addListener('error', uploadId, data => {
              console.log(`${strings.uploadError} ${data.error}%`);
            });
            BackgroundUpload.addListener('cancelled', uploadId, data => {
              console.log('Cancelled!', data);
            });
            BackgroundUpload.addListener('completed', uploadId, data => {
              // data includes responseCode: number and responseBody: Object
              const startTag = '<Location>';
              const endTag = '</Location>';
              const startIndex =
                data.responseBody.indexOf(startTag) + startTag.length;
              const endIndex = data.responseBody.indexOf(endTag);
              const link = data.responseBody.substring(startIndex, endIndex);
              let imagePoster = {
                avatarUri: link,
              };
              setDataToBeSent(prevData => ({
                ...prevData,
                isImage,
                uri: link,
                ...(isImage && imagePoster),
              }));
            });
          })
          .catch(err => {
            console.log(`${strings.uploadError} ${err}`);
          });
      }

      setIsMediaUploading(false);
    } catch (err) {
      // Show error message
      Toast.show({
        message: strings.uploadFailed,
        type: 'danger',
        duration: 3000,
        hideOnPress: true,
      });
      console.log(`${strings.uploadError} ${err}`);
    }
  };

  const providerValue = {
    uploadData,
    handleDataToBeSent,
    handleEditUser,
    handleEditedData,
    setisFormFilled,
  };

  return (
    <BackgroundUploadContext.Provider value={providerValue}>
      {children}
    </BackgroundUploadContext.Provider>
  );
}
