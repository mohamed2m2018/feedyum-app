// Library import
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';
// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from 'react-native-compressor';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import {styles} from '../../../themes';
import {
  getHeight,
  getVideoExtension,
  moderateScale,
} from '../../../common/constants';
import typography from '../../../themes/typography';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {TabNav} from '../../../navigation/NavigationKeys';
import {useQueryClient, useMutation, useQuery} from 'react-query';
import request from '../../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import images from '../../../assets/images';
import DropdownGovr from '../home/DropDownGovr';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export default function PostDetail() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});
  const queryClient = useQueryClient();
  const [toggleStatus, setToggleStatus] = useState('hours');
  const route = useRoute();
  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries('stories'); // Invalidate the 'stories' query to trigger a refetch
    }, []),
  );
  const postDataToBeEdited = route?.params?.postDataToBeEdited;
  useEffect(() => {
    if (postDataToBeEdited) {
      setpostedData(postDataToBeEdited);
      setToggleStatus(postDataToBeEdited.duration?.split(' ')?.[1] || 'hours');
      setlocalUri(postDataToBeEdited?.uri || '');
    }
  }, [postDataToBeEdited]);
  const {data: queryResult} = useQuery('user', () => request.get('/user'), {
    retry: 1,
    onError: err => {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err[Object.keys(err)?.[0]] || 'Sorry, an error has occured',
      });
    },
  });

  const user = queryResult?.data?.user;

  const addNewPost = data => {
    return request.post('/story/add_story', data);
  };

  const editPost = data => {
    const {_id, ...dataToBeSent} = data;
    return request.patch('/story/update_story', {
      id: _id,
      ...dataToBeSent,
    });
  };
  const {isLoading, mutate} = useMutation(
    postDataToBeEdited ? editPost : addNewPost,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stories'); // Invalidate the 'stories' query to trigger a refetch
        queryClient.invalidateQueries('user');
        queryClient.invalidateQueries({queryKey: 'profile-stories'});
        queryClient.invalidateQueries({queryKey: 'stories_following'});
      },
    },
  );
  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [isClearingCache, setIsclearingCache] = useState(false);
  const [phone, setPhone] = useState();

  const editUser = () => {
    request
      .patch('/user', {
        phone,
      })
      .then(async () => {
        await queryClient.invalidateQueries({queryKey: 'user'});
      })
      .catch(err =>
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: err[Object.keys(err)?.[0]],
        }),
      );
  };

  const handleUpload = async (response, isImage) => {
    setisPhotoUploading(true);
    const formData = new FormData();
    const result = response?.duration
      ? await VideoCompressor.compress(response.path, {
          compressionMethod: 'auto',
        })
      : await ImageCompressor.compress(response.path, {
          compressionMethod: 'auto',
        });

    formData.append('file', {
      uri: result,
      type: response.mime,
      name: response?.fileName + response.path,
    });
    formData.append('upload_preset', 'cookbook'); // Replace with your Cloudinary upload preset

    const axiosInstance = axios.create();
    delete axiosInstance.defaults.headers.common.Authorization;
    axiosInstance
      .post(
        `https://api.cloudinary.com/v1_1/givantk/${
          isImage ? 'image' : 'video'
        }/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      .then(res => {
        setisPhotoUploading(false);
        let imagePoster = {
          avatarUri: res?.data?.secure_url,
          poster: res?.data?.secure_url,
        };
        setpostedData(currentState => ({
          ...currentState,
          isImage,
          uri: res?.data?.secure_url,
          category: 'Fast Food',
          ...(isImage && imagePoster),
        }));
      })
      .catch(err => {
        setisPhotoUploading(false);
        console.log('Upload failed!');
        console.log(err);
      });
  };

  const onPressHome = async () => {
    const validationChef =
      !postedData?.title ||
      !postedData?.price ||
      !postedData?.caption ||
      !postedData?.uri ||
      !postedData.governorate ||
      // || !postedData.areas.length
      !postedData.duration ||
      (!user?.phone && !phone);
    const validationUser = !postedData?.title || !postedData?.caption;
    const validation = user?.type === 'chef' ? validationChef : validationUser;
    if (validation) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Please fill all inputs',
      });
      return;
    }

    const dataToBeSent = postedData?.linkToGo
      ? {...postedData, duration: postedData.duration + ' ' + toggleStatus}
      : {
          ...postedData,
          duration: postedData.duration + ' ' + toggleStatus,
          phone: user?.phone || phone,
        };
    editUser();

    await mutate(dataToBeSent, {
      onSuccess: async () => {
        setIsclearingCache(true);
        await queryClient.invalidateQueries({queryKey: 'stories'});
        await queryClient.invalidateQueries({queryKey: 'profile-stories'});
        await queryClient.invalidateQueries({queryKey: 'user'});
        setIsclearingCache(false);
        navigation.navigate(TabNav.Home);
      },
      onError: err => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: err[Object.keys(err)?.[0]],
        });
      },
    });
  };

  const handlepickImage = () =>
    ImagePicker.openPicker({
      mediaType: 'any',
    }).then(value => {
      if (value.duration && value.duration > 60000) {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Video Duration must be less than 1 minute',
        });
        return;
      }
      setlocalUri(value);
      if (value.duration) {
        handleUpload(value, false);
      } else {
        handleUpload(value, true);
      }
    });

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.post} />
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mh20}>
        <View style={localStyles.container}>
          <TouchableOpacity onPress={handlepickImage}>
            {isPhotoUploading ? (
              <ActivityIndicator style={{marginBottom: 15}} size={'large'} />
            ) : (
              <Image
                source={
                  postedData?.uri
                    ? {
                        uri: postedData?.uri?.replace(
                          getVideoExtension(postedData?.uri),
                          'jpg',
                        ),
                      }
                    : images.dishPlaceholder
                }
                resizeMode="cover"
                style={
                  !localUri
                    ? localStyles.imageContainernoPhoto
                    : localStyles.imageContainer
                }
              />
            )}
            <ZText
              type={!localUri ? 'b30' : 'b12'}
              color={colors.white}
              align={'center'}
              style={localStyles.coverPhotoStyle}>
              {'Upload dish video or photo'}
            </ZText>
          </TouchableOpacity>
        </View>
        {localUri && (
          <>
            <TextInput
              placeholder={'Meal Name'}
              value={postedData?.title}
              onChangeText={input =>
                setpostedData(currentState => ({
                  ...currentState,
                  title: input,
                }))
              }
              placeholderTextColor={colors.placeHolderColor}
              style={[
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.bColor,
                  color: colors.textColor,
                },
                localStyles.smallInputContainerStyle,
              ]}
              inputBoxStyle={localStyles.inputBoxStyle}
            />
            <TextInput
              placeholder={'Brief description of the meal'}
              multiline={true}
              value={postedData?.caption}
              onChangeText={input => {
                setpostedData(currentState => ({
                  ...currentState,
                  caption: input,
                }));
              }}
              placeholderTextColor={colors.placeHolderColor}
              style={[
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.bColor,
                  color: colors.textColor,
                },
                localStyles.inputContainerStyle,
                // eslint-disable-next-line react-native/no-inline-styles
                {
                  paddingTop: 20,
                },
              ]}
              inputBoxStyle={localStyles.inputBoxStyle}
            />

            {user?.type === 'chef' && (
              <>
                <TextInput
                  placeholder={'price'}
                  keyboardType="number-pad"
                  value={`${postedData?.price || ''}`}
                  onChangeText={input =>
                    setpostedData(currentState => ({
                      ...currentState,
                      price: input,
                    }))
                  }
                  placeholderTextColor={colors.placeHolderColor}
                  style={[
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.bColor,
                      color: colors.textColor,
                    },
                    localStyles.smallInputContainerStyle,
                  ]}
                  inputBoxStyle={localStyles.inputBoxStyle}
                />
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TextInput
                    placeholder={`No of ${toggleStatus} to deliver this order`}
                    value={`${postedData?.duration?.split?.(' ')?.[0] || ''}`}
                    multiline={true}
                    keyboardType="number-pad"
                    onChangeText={input =>
                      setpostedData(currentState => ({
                        ...currentState,
                        duration: input,
                      }))
                    }
                    placeholderTextColor={colors.placeHolderColor}
                    style={[
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.bColor,
                        color: colors.textColor,
                      },
                      localStyles.smallInputContainerStyle,
                      {
                        maxWidth: '77%',
                        paddingTop: 12,
                      },
                    ]}
                    inputBoxStyle={localStyles.inputBoxStyle}
                  />
                  <View>
                    <Switch
                      trackColor={{
                        false: colors.grayScale3,
                        true: colors.primary,
                      }}
                      style={{
                        transform: [{scaleX: 0.8}, {scaleY: 0.8}],
                        marginTop: 10,
                      }}
                      thumbColor={colors.white}
                      onValueChange={() =>
                        setToggleStatus(prev =>
                          prev === 'days' ? 'hours' : 'days',
                        )
                      }
                      value={
                        postedData?.duration?.split?.(' ')?.[1] === 'hours' ||
                        toggleStatus === 'hours'
                          ? true
                          : false
                      }
                    />
                    <ZText
                      style={{
                        marginTop: 5,
                        alignSelf: 'center',
                        textAlign: 'center',
                      }}>
                      {toggleStatus}
                    </ZText>
                  </View>
                </View>
                {!user?.phone && (
                  <TextInput
                    placeholder={'Please add your phone number'}
                    multiline={false}
                    value={phone}
                    onChangeText={input => setPhone(input)}
                    placeholderTextColor={colors.placeHolderColor}
                    style={[
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.bColor,
                        color: colors.textColor,
                      },
                      localStyles.smallInputContainerStyle,
                    ]}
                    inputBoxStyle={localStyles.inputBoxStyle}
                  />
                )}
                <TextInput
                  placeholder={
                    'link (optional), if not provided user will contact you through whatsapp'
                  }
                  multiline={true}
                  value={postedData?.linkToGo}
                  onChangeText={input =>
                    setpostedData(currentState => ({
                      ...currentState,
                      linkToGo: input,
                    }))
                  }
                  placeholderTextColor={colors.placeHolderColor}
                  style={[
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.bColor,
                      color: colors.textColor,
                    },
                    localStyles.smallInputContainerStyle,
                    {height: 80},
                  ]}
                  inputBoxStyle={localStyles.inputBoxStyle}
                />
                <DropdownGovr
                  setpostedData={setpostedData}
                  postedData={postedData}
                />
              </>
            )}
          </>
        )}
        <View style={localStyles.btnContainer}>
          {localUri !== '' ? (
            <ZButton
              title={
                isPhotoUploading
                  ? 'Upload..'
                  : postDataToBeEdited
                  ? 'Edit'
                  : strings.post
              }
              textType={'b18'}
              disabled={isLoading || isPhotoUploading || isClearingCache}
              isLoading={isLoading || isPhotoUploading || isClearingCache}
              color={colors.white}
              containerStyle={localStyles.skipBtnContainer}
              onPress={onPressHome}
            />
          ) : (
            <ZButton
              title={'Upload dish video or photo'}
              textType={'b18'}
              color={colors.white}
              containerStyle={{paddingHorizontal: 20}}
              onPress={handlepickImage}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    ...styles.rowSpaceBetween,
    alignSelf: 'center',
    ...styles.mt20,
  },
  inputContainerStyle: {
    ...styles.flex,
    height: getHeight(132),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    ...styles.p20,
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
    ...styles.mr15,
    ...styles.mt25,
  },
  smallInputContainerStyle: {
    ...styles.flex,
    height: getHeight(80),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    ...styles.p20,
    ...typography.fontSizes.f16,
    ...typography.fontWeights.Regular,
    ...styles.mr15,
    ...styles.mt15,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: moderateScale(20),
    marginBottom: 10,
  },
  imageContainernoPhoto: {
    width: moderateScale(400),
    height: moderateScale(400),
    borderRadius: moderateScale(20),
  },
  coverPhotoStyle: {
    bottom: moderateScale(10),
    ...styles.mt10,
    ...styles.selfCenter,
  },
  categoryContainer: {
    ...styles.flexRow,

    ...styles.mb20,
    ...styles.pv20,
    borderBottomWidth: moderateScale(1),
  },
  hashtagContainer: {
    ...styles.mr10,
    ...styles.rowCenter,
    ...styles.pv10,
    ...styles.ph20,
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
  },
  settingsContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mb15,
  },
  rightContainer: {
    ...styles.flex,
    ...styles.rowEnd,
  },
  shareIcon: {
    ...styles.mb20,
    ...styles.mr20,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    ...styles.center,
  },
  shareContainer: {
    ...styles.mv20,
    ...styles.flexRow,
  },
  btnContainer: {
    ...styles.pv20,
    ...styles.mh20,
    ...styles.rowSpaceAround,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
