// Library import
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
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
import {useNavigation} from '@react-navigation/native';
import {TabNav} from '../../../navigation/NavigationKeys';
import {useQueryClient, useMutation, useQuery} from 'react-query';
import request from '../../../api/request';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import images from '../../../assets/images';

export default function PostDetail() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [postedData, setpostedData] = useState({});
  const queryClient = useQueryClient();
  const {data: queryResult} = useQuery('user', () => request.get('/user'), {
    retry: 1,
  });

  const user = queryResult?.data?.user;

  const addNewPost = data => {
    return request.post('/story/add_story', data);
  };
  const {isLoading, mutate} = useMutation(addNewPost);
  const [isPhotoUploading, setisPhotoUploading] = useState(false);
  const [localUri, setlocalUri] = useState('');
  const [isClearingCache, setIsclearingCache] = useState(false);

  const [isEnabled, setIsEnabled] = useState({
    allowComments: false,
    allowDuet: false,
    allowStitch: false,
  });

  const postUploadData = [
    {
      title: strings.tagPeople,
      icon: 'person-outline',
    },
    {
      title: strings.location,
      icon: 'location-outline',
    },
    {
      title: strings.visibleEveryone,
      icon: 'lock-closed-outline',
    },
    {
      title: strings.allowComments,
      icon: 'chatbubble-ellipses-outline',
      rightIcon: true,
      value: isEnabled.allowComments,
      toggleSwitch: () =>
        setIsEnabled({
          ...isEnabled,
          allowComments: isEnabled.allowComments ? false : true,
        }),
    },
    {
      title: strings.allowDuet,
      icon: 'people-outline',
      rightIcon: true,
      value: isEnabled.allowDuet,
      toggleSwitch: () =>
        setIsEnabled({
          ...isEnabled,
          allowDuet: isEnabled.allowDuet ? false : true,
        }),
    },
    {
      title: strings.allowStitch,
      icon: 'newspaper-outline',
      rightIcon: true,
      value: isEnabled.allowStitch,
      toggleSwitch: () =>
        setIsEnabled({
          ...isEnabled,
          allowStitch: isEnabled.allowStitch ? false : true,
        }),
    },
    {
      title: strings.moreOption,
      icon: 'ellipsis-horizontal-circle',
    },
  ];

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
  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderData = ({item}) => {
    return (
      <TouchableOpacity style={localStyles.settingsContainer}>
        <View style={styles.rowCenter}>
          <Ionicons
            name={item.icon}
            size={moderateScale(28)}
            color={colors.textColor}
            style={styles.mr10}
          />
          <ZText type="s18">{item.title}</ZText>
        </View>
        <View style={localStyles.rightContainer}>
          {item?.rightIcon ? (
            <Switch
              trackColor={{
                false: colors.grayScale3,
                true: colors.primary,
              }}
              thumbColor={colors.white}
              onValueChange={item?.toggleSwitch}
              value={item?.value}
            />
          ) : (
            <Ionicons
              name="chevron-forward-outline"
              size={moderateScale(20)}
              color={colors.dark ? colors.white : colors.grayScale9}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderShare = ({icon}) => {
    return (
      <TouchableOpacity
        style={[
          localStyles.shareIcon,
          {
            backgroundColor: colors.primaryTransparent,
          },
        ]}>
        <Ionicons
          name={icon}
          size={moderateScale(26)}
          color={colors.primary}
          style={localStyles.instagramIcon}
        />
      </TouchableOpacity>
    );
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderCategory = ({icon, title}) => {
    return (
      <TouchableOpacity
        style={[
          localStyles.hashtagContainer,
          {
            borderColor: colors.primary,
          },
        ]}>
        <Feather
          name={icon}
          size={moderateScale(20)}
          style={styles.mr5}
          color={colors.primary}
        />
        <ZText type={'b14'} color={colors.primary}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };

  const onPressHome = async () => {
    if (
      !postedData?.title ||
      !postedData?.price ||
      !postedData?.caption ||
      !postedData?.uri
    ) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Please fill all inputs',
      });
      return;
    }

    const dataToBeSent = postedData?.linkToGo
      ? postedData
      : {...postedData, phone: user?.phone};

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
      <ScrollView
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
              placeholder={'Brief description of the meal'}
              multiline={true}
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
            <TextInput
              placeholder={'Meal Name'}
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
              placeholder={'price'}
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
            <TextInput
              placeholder={
                'link (optional), if not provided user will contact you through whatsapp'
              }
              multiline={true}
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
                {height: 100},
              ]}
              inputBoxStyle={localStyles.inputBoxStyle}
            />

            {/* <View
          style={[
            localStyles.categoryContainer,
            {
              borderBottomColor: colors.bColor,
            },
          ]}>
          <RenderCategory icon={'hash'} title={strings.hashtag} />
          <RenderCategory icon={'at-sign'} title={strings.mention} />
          <RenderCategory icon={'video'} title={strings.videos} />
        </View>
        <FlatList
          data={postUploadData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <RenderData item={item} />}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
        <ZText type={'b16'} color={colors.textColor} style={styles.mt10}>
          {strings.shareDesc}
        </ZText>
        <View style={localStyles.shareContainer}>
          <RenderShare icon={'logo-instagram'} />
          <RenderShare icon={'logo-facebook'} />
          <RenderShare icon={'logo-twitter'} />
          <RenderShare icon={'logo-whatsapp'} />
        </View> */}
          </>
        )}
        <View style={localStyles.btnContainer}>
          {localUri !== '' ? (
            <ZButton
              title={isPhotoUploading ? 'Upload..' : strings.post}
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
      </ScrollView>
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
