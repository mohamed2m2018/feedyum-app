// Library import
import {
    ActivityIndicator,
    I18nManager,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import {
    PERMISSIONS,
    request as requestPermission,
    check as checkPermission,
    RESULTS,
} from 'react-native-permissions';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import { styles } from '../../../themes';
import { getHeight, moderateScale } from '../../../common/constants';
import typography from '../../../themes/typography';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZInput from '../../../components/common/ZInput';
import {
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { StackNav, TabNav } from '../../../navigation/NavigationKeys';
import { useQuery } from 'react-query';
import request from '../../../api/request';
import { showErrorToast, showSuccessToast, showWarningToast } from '../../../utils/toast';
import { reelFormResolver, buildReelSubmitData } from './utils/reelFormValidation';
import BottomActionSheet from '../../../components/models/BottomActionSheet';
import images from '../../../assets/images';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { useBackgroundUpload } from '../../../providers/BackgroundUploadProvider';
import AttachedDishesComponent from './components/AttachedDishesComponent';
import RestaurantSearch from '../../../components/RestaurantSearch';
import DishSelector from '../../../components/DishSelector';
import RatingInput from '../../../components/RatingInput';
import ZPhoneInput from '../../../components/common/ZPhoneInput';
import branchService from '../../../api/branchService';

/**
 * EditPost - Dedicated screen for editing existing posts
 * Properly initializes review fields (selectedRestaurant, selectedDish, rating)
 * from existing post data that PostDetail.js was missing.
 */
// Default form values
const DEFAULT_FORM_VALUES = {
    title: '',
    caption: '',
    attachedDishes: [],
    phone: '',
    selectedRestaurant: null,
    selectedDish: null,
    rating: 0,
    locations: [],
};

export default function EditPost() {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const route = useRoute();

    const postDataToBeEdited = route?.params?.postDataToBeEdited;

    const {
        handleDataToBeSent,
        handleEditUser,
        setisFormFilled,
        handleEditedData,
        uploadData,
    } = useBackgroundUpload();

    // Fetch current user
    const { data: queryResult } = useQuery('user', () => request.get('/user'), {
        retry: 1,
        onError: err => {
            showErrorToast(strings.error, err[Object.keys(err)?.[0]] || strings.errorOccured);
        },
    });
    const user = queryResult?.data?.user;

    // ─── React Hook Form ──────────────────────────────────────────────────────────
    const {
        setValue, watch, reset,
        handleSubmit: rhfHandleSubmit,
        formState: { errors: formErrors },
    } = useForm({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: 'onTouched',
        resolver: (values) => reelFormResolver(values, {
            userType: user?.type || 'chef',
            isEditing: true, // Always true for EditReel
            userHasPhone: !!user?.phone,
            hasBranches: !!(branchesData?.branches?.length),
        }),
    });

    const formData = watch();

    const updateField = useCallback((field, value) => {
        setValue(field, value, { shouldValidate: false });
    }, [setValue]);

    // ─── Non-form UI state ────────────────────────────────────────────────────────
    const [localUri, setlocalUri] = useState('');
    const [isPhotoUploading, setisPhotoUploading] = useState(false);
    const [mediaIsEdited, setmediaIsEdited] = useState(false);
    const [locations, setLocations] = useState([]);
    const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });

    // Fetch chef branches if user is chef
    const { data: branchesData } = useQuery(
        ['chefBranches', user?._id],
        () => branchService.getBranches(user?._id),
        {
            retry: 0,
            enabled: !!user?._id && user?.type === 'chef',
            refetchOnMount: true,
            onSuccess: res => {
                const adaptedLocations = (res?.branches || []).map(branch => ({
                    _id: branch._id,
                    description: branch.addressDetails?.formattedAddress || branch.branchName,
                    lat: branch.location?.lat,
                    long: branch.location?.long,
                    latitude: branch.location?.lat,
                    longitude: branch.location?.long,
                    city: branch.addressDetails?.city,
                    country: branch.addressDetails?.country,
                }));
                setLocations(adaptedLocations);
            },
            onError: () => { },
        },
    );

    // ─── Initialize form from edit data ──────────────────────────────────────────
    useEffect(() => {
        if (!postDataToBeEdited) return;

        const editData = {
            ...postDataToBeEdited,
            attachedDishes: postDataToBeEdited.dishes || postDataToBeEdited.attachedDishes || [],
        };
        setlocalUri(editData?.poster || editData?.avatarUri || '');

        // Reconstruct review fields
        let reconstructedRestaurant = null;
        let reconstructedDish = null;

        if (postDataToBeEdited.isReview) {
            if (postDataToBeEdited.reviewedChef) {
                const chef = postDataToBeEdited.reviewedChef;
                reconstructedRestaurant = {
                    type: 'partner',
                    id: chef._id || chef,
                    chefId: chef._id || chef,
                    name: chef.fullName || chef.username || postDataToBeEdited.restaurantName || strings.partnerChef,
                    description: chef.bio || strings.partnerChefLabel,
                    avatar: chef.avatar,
                };
            } else if (postDataToBeEdited.googlePlaceId || postDataToBeEdited.restaurantName) {
                reconstructedRestaurant = {
                    type: 'google',
                    id: postDataToBeEdited.googlePlaceId || 'manual',
                    placeId: postDataToBeEdited.googlePlaceId,
                    name: postDataToBeEdited.restaurantName || strings.unknownRestaurant,
                    description: postDataToBeEdited.restaurantAddress || '',
                    address: postDataToBeEdited.restaurantAddress,
                };
            }

            const dishesArray = postDataToBeEdited.dishes || [];
            if (dishesArray.length > 0 && typeof dishesArray[0] === 'object') {
                const dish = dishesArray[0];
                reconstructedDish = {
                    type: 'menu',
                    id: dish._id,
                    dishId: dish._id,
                    name: dish.title || dish.name,
                    price: dish.price,
                    image: dish.image,
                };
            } else if (postDataToBeEdited.dishName) {
                reconstructedDish = {
                    type: 'manual',
                    name: postDataToBeEdited.dishName,
                };
            }
        }

        // Populate RHF with all data at once
        reset({
            title: editData.title || '',
            caption: editData.caption || '',
            attachedDishes: editData.attachedDishes || [],
            phone: '',
            selectedRestaurant: reconstructedRestaurant,
            selectedDish: reconstructedDish,
            rating: postDataToBeEdited.rating || 0,
            locations: [],
        });

        handleEditedData({
            ...editData,
            isImage: !!postDataToBeEdited.avatarUri,
            isEdit: true,
            mediaIsEdited: false,
        });
    }, [postDataToBeEdited]);

    // Handle media upload
    const handleUpload = async (response, isImage) => {
        uploadData(
            response,
            setisPhotoUploading,
            setlocalUri,
            isImage,
            isPhotoUploading,
        );
    };

    const handleMedia = value => {
        setmediaIsEdited(true);
        if (value.duration && value.duration > 60000) {
            showErrorToast(strings.error, strings.maxDuration);
            return;
        }
        setlocalUri(value.path);
        if (value.duration) {
            handleUpload(value, false);
        } else {
            handleUpload(value, true);
        }
    };

    // Permission request functions
    const requestCameraPermission = async () => {
        try {
            const permission = Platform.OS === 'ios'
                ? PERMISSIONS.IOS.CAMERA
                : PERMISSIONS.ANDROID.CAMERA;
            const currentStatus = await checkPermission(permission);
            if (currentStatus === RESULTS.GRANTED) return true;
            if (currentStatus === RESULTS.DENIED) {
                const result = await requestPermission(permission);
                return result === RESULTS.GRANTED;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const showPermissionAlert = (type) => {
        Alert.alert(
            strings.permissionRequired,
            strings.permissionMessage?.replace('{type}', type) || `${type} permission is required`,
            [
                { text: strings.cancel, style: 'cancel' },
                { text: strings.settings, onPress: () => Linking.openSettings() },
            ]
        );
    };

    const handleCaptureImage = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            showPermissionAlert('Camera');
            return;
        }
        ImagePicker.openCamera({
            cropping: true,
            compressImageQuality: 1,
        })
            .then(handleMedia)
            .catch(() => { });
    };

    const handlepickImage = async () => {
        try {
            const res = await ImagePicker.openPicker({
                mediaType: 'image',
                cropping: true,
                compressImageQuality: 1,
            });
            handleMedia(res);
        } catch (err) {
            const message = String(err?.message || err?.toString?.() || '');
            const code = err?.code;
            const permissionError =
                code === 'E_PERMISSION_MISSING' ||
                message.includes('permission') ||
                message.includes('denied');
            if (permissionError) {
                showPermissionAlert('Photo Library');
            }
        }
    };

    const handlePickVideo = async () => {
        try {
            const res = await ImagePicker.openPicker({
                mediaType: 'video',
                compressVideoPreset: 'HighestQuality',
            });
            handleMedia(res);
        } catch (err) {
            const message = String(err?.message || err?.toString?.() || '');
            const code = err?.code;
            const permissionError =
                code === 'E_PERMISSION_MISSING' ||
                message.includes('permission') ||
                message.includes('denied');
            if (permissionError) {
                showPermissionAlert('Photo Library');
            }
        }
    };

    const handleCaptureVideo = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            showPermissionAlert('Camera');
            return;
        }
        ImagePicker.openCamera({
            mediaType: 'video',
            cropping: false,
            maximumVideoDuration: 60,
        })
            .then(handleMedia)
            .catch(() => { });
    };

    // ─── RHF Submit Handlers ───────────────────────────────────────────────────────

    const onFormSubmit = useCallback(async (data) => {
        const valuesWithLocations = { ...data, locations };
        const dataToBeSent = buildReelSubmitData(valuesWithLocations, {
            user,
            mediaIsEdited,
            postDataToBeEdited,
        });

        handleDataToBeSent(dataToBeSent);
        handleEditUser(data.phone, locations);
        setisFormFilled(true);

        setTimeout(() => {
            if (user?.type === 'chef') {
                navigation.navigate(StackNav.TabBar, { screen: TabNav.ProfileTab });
            } else {
                navigation.navigate(StackNav.TabBar, { screen: TabNav.ForYou });
            }
        }, 100);
    }, [user, mediaIsEdited, postDataToBeEdited, locations, handleDataToBeSent, handleEditUser, setisFormFilled, navigation]);

    const onFormError = useCallback((errors) => {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
            showWarningToast(strings.error, firstError.message);
        }
    }, []);

    const onPressSubmit = useCallback(async () => {
        setValue('locations', locations, { shouldValidate: false });
        await rhfHandleSubmit(onFormSubmit, onFormError)();
    }, [locations, setValue, rhfHandleSubmit, onFormSubmit, onFormError]);

    return (
        <ZSafeAreaView>
            <ZHeader
                onPressBack={() => navigation.goBack()}
                title={strings.editPost}
            />
            <KeyboardAwareScrollView
                enableOnAndroid={true}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                extraScrollHeight={100}
                extraHeight={150}
                contentContainerStyle={styles.ph10}>
                {/* Media Preview */}
                <View style={localStyles.container}>
                    <TouchableOpacity
                        onPress={() => {
                            setlocalUri('');
                        }}>
                        {isPhotoUploading ? (
                            <ActivityIndicator
                                color={colors.primary}
                                style={{ marginBottom: 15 }}
                                size={'large'}
                            />
                        ) : (
                            <Image
                                source={
                                    localUri
                                        ? { uri: localUri }
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
                            {strings.uploadDishMedia}
                        </ZText>
                    </TouchableOpacity>
                </View>

                {localUri && (
                    <>
                        {/* Title and Caption */}
                        <View style={localStyles.inputsWrapper}>
                            <ZInput
                                label={strings.title}
                                placeholder={strings.titlePlaceholder}
                                _value={formData.title}
                                toGetTextFieldValue={input => updateField('title', input)}
                                _errorText={formErrors.title?.message}
                                required
                            />

                            <ZInput
                                label={strings.caption}
                                placeholder={strings.captionPlaceholder}
                                _value={formData.caption}
                                toGetTextFieldValue={input => updateField('caption', input)}
                                _errorText={formErrors.caption?.message}
                                multiline={true}
                                inputContainerStyle={{ height: moderateScale(100) }}
                                required
                            />
                        </View>

                        {/* User Review Section - only for regular users */}
                        {user?.type !== 'chef' && (
                            <>
                                {/* Restaurant Search */}
                                <View style={localStyles.reviewSection}>
                                    <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                                        {strings.whereIsThisFrom}
                                    </ZText>
                                    <RestaurantSearch
                                        selectedRestaurant={formData.selectedRestaurant}
                                        onRestaurantSelect={(restaurant) => {
                                            updateField('selectedRestaurant', restaurant);
                                        }}
                                        onClear={() => {
                                            updateField('selectedRestaurant', null);
                                            updateField('selectedDish', null);
                                        }}
                                        userLocation={{
                                            lat: locations?.[0]?.lat,
                                            lng: locations?.[0]?.long || locations?.[0]?.lng,
                                            country: user?.country || user?.chefSettings?.country
                                        }}
                                    />
                                </View>

                                {/* Dish Selector - only show if restaurant selected */}
                                {formData.selectedRestaurant && (
                                    <View style={localStyles.reviewSection}>
                                        <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                                            {strings.whatDidYouOrder}
                                        </ZText>
                                        <DishSelector
                                            restaurant={formData.selectedRestaurant}
                                            selectedDish={formData.selectedDish}
                                            onDishSelect={(dish) => updateField('selectedDish', dish)}
                                            onClear={() => updateField('selectedDish', null)}
                                        />
                                    </View>
                                )}

                                {/* Rating - only show if dish selected */}
                                {formData.selectedDish && (
                                    <View style={localStyles.reviewSection}>
                                        <RatingInput
                                            rating={formData.rating}
                                            onRatingChange={(val) => updateField('rating', val)}
                                            label={strings.rateThisDishOptional}
                                        />
                                    </View>
                                )}
                            </>
                        )}

                        {/* Chef-specific: Attached Dishes */}
                        {user?.type === 'chef' && (
                            <View style={localStyles.attachDishesSection}>
                                <View style={localStyles.sectionHeader}>
                                    <ZText type="B18" color={colors.textColor}>
                                        {strings.attachDishesFromMenu}
                                    </ZText>
                                    <ZText type="M12" color={colors.grayScale7}>
                                        {strings.showcaseDishesOptional}
                                    </ZText>
                                </View>
                                <AttachedDishesComponent
                                    colors={colors}
                                    userId={user?._id}
                                    attachedDishes={formData.attachedDishes || []}
                                    onDishesChange={dishes => updateField('attachedDishes', dishes)}
                                />
                            </View>
                        )}

                        {/* Phone input for chefs without phone */}
                        {user?.type === 'chef' && !user?.phone && (
                            <ZPhoneInput
                                label={strings.phoneNumber}
                                value={formData.phone}
                                defaultCode="EG"
                                placeholder={strings.addPhoneNumberPlaceholder}
                                onChangeText={(val) => updateField('phone', val)}
                                containerStyle={{ marginTop: moderateScale(10) }}
                            />
                        )}
                    </>
                )}

                {/* Submit/Media Buttons */}
                <View style={localStyles.btnContainer}>
                    {localUri !== '' ? (
                        <ZButton
                            title={strings.Edit}
                            textType={'b18'}
                            disabled={isPhotoUploading}
                            isLoading={isPhotoUploading}
                            color={colors.white}
                            containerStyle={localStyles.skipBtnContainer}
                            onPress={onPressSubmit}
                        />
                    ) : (
                        <View>
                            {postDataToBeEdited?.avatarUri && (
                                <>
                                    <ZButton
                                        title={strings.uploadDishPhoto}
                                        textType={'b18'}
                                        color={colors.white}
                                        containerStyle={{ paddingHorizontal: 20 }}
                                        onPress={handlepickImage}
                                    />
                                    <View style={{ height: 10 }} />
                                    <ZButton
                                        title={strings.captureDishPhoto}
                                        textType={'b18'}
                                        color={colors.white}
                                        containerStyle={{ paddingHorizontal: 20 }}
                                        onPress={handleCaptureImage}
                                    />
                                </>
                            )}
                            {!postDataToBeEdited?.avatarUri && (
                                <>
                                    <View style={{ height: 10 }} />
                                    <ZButton
                                        title={strings.uploadDishVideo}
                                        textType={'b18'}
                                        color={colors.white}
                                        containerStyle={{ paddingHorizontal: 20 }}
                                        onPress={handlePickVideo}
                                    />
                                    <View style={{ height: 10 }} />
                                    <ZButton
                                        title={strings.captureDishVideo}
                                        textType={'b18'}
                                        color={colors.white}
                                        containerStyle={{ paddingHorizontal: 20 }}
                                        onPress={handleCaptureVideo}
                                    />
                                    <View style={{ height: 10 }} />
                                    <ZText>{strings.maxDuration}</ZText>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>

            {modalState.visible && (
                <BottomActionSheet
                    visible={modalState.visible}
                    title={modalState.title}
                    message={modalState.message}
                    primaryLabel={strings.openMenuManagement}
                    secondaryLabel={strings.notNow}
                    onPrimary={() => {
                        setModalState({ visible: false, title: '', message: '' });
                        navigation.navigate(StackNav.MenuManagement, { fromTabs: true });
                    }}
                    onClose={() => setModalState({ visible: false, title: '', message: '' })}
                />
            )}
        </ZSafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        ...styles.rowSpaceBetween,
        alignSelf: 'center',
        ...styles.mt20,
    },
    imageContainer: {
        width: 140,
        height: 140,
        borderRadius: moderateScale(20),
        marginBottom: 10,
    },
    imageContainernoPhoto: {
        width: moderateScale(350),
        height: moderateScale(350),
        borderRadius: moderateScale(20),
    },
    coverPhotoStyle: {
        bottom: moderateScale(10),
        ...styles.mt10,
        ...styles.selfCenter,
    },
    inputsWrapper: {
        marginVertical: moderateScale(10),
        gap: moderateScale(10),
    },
    reviewSection: {
        marginVertical: moderateScale(16),
        paddingHorizontal: moderateScale(5),
    },
    sectionTitle: {
        marginBottom: moderateScale(12),
    },
    attachDishesSection: {
        marginVertical: moderateScale(20),
        paddingHorizontal: moderateScale(5),
    },
    sectionHeader: {
        marginBottom: moderateScale(12),
    },
    btnContainer: {
        ...styles.pv20,
        ...styles.mh20,
        ...styles.rowSpaceAround,
        marginBottom: moderateScale(40),
        paddingBottom: moderateScale(20),
    },
    skipBtnContainer: {
        width: '45%',
    },
});
