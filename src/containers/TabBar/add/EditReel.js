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
import React, { useEffect, useState, useMemo } from 'react';

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
import { showErrorToast, showSuccessToast } from '../../../utils/toast';
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
export default function EditPost() {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const route = useRoute();

    const postDataToBeEdited = route?.params?.postDataToBeEdited;

    // Form state
    const [postedData, setpostedData] = useState({});
    const [localUri, setlocalUri] = useState('');
    const [isPhotoUploading, setisPhotoUploading] = useState(false);
    const [mediaIsEdited, setmediaIsEdited] = useState(false);
    const [phone, setPhone] = useState();
    const [locations, setLocations] = useState([]);
    const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });

    // Review-specific state - these need to be initialized from edit data
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [selectedDish, setSelectedDish] = useState(null);
    const [rating, setRating] = useState(0);

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

    /**
     * Initialize form from existing post data
     * This is the key difference from PostDetail.js - we reconstruct review fields
     */
    useEffect(() => {
        if (!postDataToBeEdited) {
            return;
        }

        // Initialize basic form data
        const editData = {
            ...postDataToBeEdited,
            attachedDishes: postDataToBeEdited.dishes || postDataToBeEdited.attachedDishes || [],
        };
        setpostedData(editData);
        setlocalUri(editData?.poster || editData?.avatarUri || '');

        // Initialize rating
        if (postDataToBeEdited.rating) {
            setRating(postDataToBeEdited.rating);
        }

        // Reconstruct selectedRestaurant from stored data
        if (postDataToBeEdited.isReview) {
            if (postDataToBeEdited.reviewedChef) {
                // Partner chef restaurant
                const chef = postDataToBeEdited.reviewedChef;
                setSelectedRestaurant({
                    type: 'partner',
                    id: chef._id || chef,
                    chefId: chef._id || chef,
                    name: chef.fullName || chef.username || postDataToBeEdited.restaurantName || strings.partnerChef,
                    description: chef.bio || strings.partnerChefLabel,
                    avatar: chef.avatar,
                });
            } else if (postDataToBeEdited.googlePlaceId || postDataToBeEdited.restaurantName) {
                // Google Places restaurant
                setSelectedRestaurant({
                    type: 'google',
                    id: postDataToBeEdited.googlePlaceId || 'manual',
                    placeId: postDataToBeEdited.googlePlaceId,
                    name: postDataToBeEdited.restaurantName || strings.unknownRestaurant,
                    description: postDataToBeEdited.restaurantAddress || '',
                    address: postDataToBeEdited.restaurantAddress,
                });
            }

            // Reconstruct selectedDish from stored data
            const dishesArray = postDataToBeEdited.dishes || [];
            if (dishesArray.length > 0 && typeof dishesArray[0] === 'object') {
                // Dish is populated with full object
                const dish = dishesArray[0];
                setSelectedDish({
                    type: 'menu',
                    id: dish._id,
                    dishId: dish._id,
                    name: dish.title || dish.name,
                    price: dish.price,
                    image: dish.image,
                });
            } else if (postDataToBeEdited.dishName) {
                // Manual dish name entry
                setSelectedDish({
                    type: 'manual',
                    name: postDataToBeEdited.dishName,
                });
            }
        }

        // Notify background upload provider
        handleEditedData({
            ...editData,
            isImage: postDataToBeEdited.avatarUri ? true : false,
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

    // Submit edit
    const onPressSubmit = async () => {
        // Validation for chef users
        const validationChef =
            !postedData?.title ||
            !postedData?.caption ||
            (!user?.phone && !phone);

        // Validation for regular users (reviews)
        const validationUser =
            !postedData?.caption ||
            !selectedRestaurant ||
            !selectedDish;

        const validation = user?.type === 'chef' ? validationChef : validationUser;
        if (validation) {
            showErrorToast(
                strings.error,
                user?.type === 'chef' ? strings.pleaseFillAllInputs : strings.selectRestaurantAndDish
            );
            return;
        }

        if (postedData.caption?.length < 5) {
            showErrorToast(strings.error, strings.descriptionTooShort);
            return;
        }
        if (postedData.title?.length > 45) {
            showErrorToast(strings.error, strings.tooLargeTitle);
            return;
        }

        // Build data to send
        const derivedCategories = Array.from(
            new Set(
                (postedData?.attachedDishes || [])
                    .flatMap(dish => {
                        const cats = Array.isArray(dish?.categories) && dish.categories.length
                            ? dish.categories
                            : [dish?.category];
                        return cats.map(cat => {
                            if (!cat) return null;
                            if (typeof cat === 'object' && cat._id) return cat._id;
                            if (typeof cat === 'string' && /^[a-fA-F0-9]{24}$/.test(cat)) return cat;
                            return null;
                        });
                    })
                    .filter(Boolean),
            ),
        );

        const dataToBeSent = {
            ...postedData,
            phone: user?.phone || phone,
            mediaIsEdited,
            dishes: postedData?.attachedDishes?.map(dish => dish._id) || [],
        };

        // For regular users, add review-specific fields
        if (user?.type !== 'chef') {
            dataToBeSent.isReview = true;
            dataToBeSent.title = selectedDish?.name || dataToBeSent.title;

            // Restaurant info
            if (selectedRestaurant?.type === 'partner') {
                dataToBeSent.reviewedChefId = selectedRestaurant.chefId;
            } else {
                dataToBeSent.googlePlaceId = selectedRestaurant.placeId;
                dataToBeSent.restaurantName = selectedRestaurant.name;
                dataToBeSent.restaurantAddress = selectedRestaurant.address;
            }

            // Dish info
            if (selectedDish?.type === 'menu') {
                dataToBeSent.reviewedDishId = selectedDish.dishId;
                dataToBeSent.dishes = [selectedDish.dishId];
            } else {
                dataToBeSent.dishName = selectedDish.name;
            }

            // Rating
            if (rating > 0) {
                dataToBeSent.rating = rating;
            }
        }

        if (derivedCategories.length > 0) {
            dataToBeSent.category = derivedCategories;
        } else {
            delete dataToBeSent.category;
        }

        // Clean up
        delete dataToBeSent.attachedDishes;
        delete dataToBeSent.price;
        delete dataToBeSent.duration;
        delete dataToBeSent.linkToGo;

        handleDataToBeSent(dataToBeSent);
        handleEditUser(phone, locations);
        setisFormFilled(true);

        setTimeout(() => {
            if (user?.type === 'chef') {
                navigation.navigate(StackNav.TabBar, { screen: TabNav.ProfileTab });
            } else {
                navigation.navigate(StackNav.TabBar, { screen: TabNav.ForYou });
            }
        }, 100);
    };

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
                            postedData.uri = '';
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
                                _value={postedData?.title}
                                toGetTextFieldValue={input =>
                                    setpostedData(currentState => ({
                                        ...currentState,
                                        title: input,
                                    }))
                                }
                                required
                            />

                            <ZInput
                                label={strings.caption}
                                placeholder={strings.captionPlaceholder}
                                _value={postedData?.caption}
                                toGetTextFieldValue={input =>
                                    setpostedData(currentState => ({
                                        ...currentState,
                                        caption: input,
                                    }))
                                }
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
                                        selectedRestaurant={selectedRestaurant}
                                        onRestaurantSelect={setSelectedRestaurant}
                                        onClear={() => {
                                            setSelectedRestaurant(null);
                                            setSelectedDish(null);
                                        }}
                                        userLocation={{
                                            lat: locations?.[0]?.lat,
                                            lng: locations?.[0]?.long || locations?.[0]?.lng,
                                            country: user?.country || user?.chefSettings?.country
                                        }}
                                    />
                                </View>

                                {/* Dish Selector - only show if restaurant selected */}
                                {selectedRestaurant && (
                                    <View style={localStyles.reviewSection}>
                                        <ZText type="B18" color={colors.textColor} style={localStyles.sectionTitle}>
                                            {strings.whatDidYouOrder}
                                        </ZText>
                                        <DishSelector
                                            restaurant={selectedRestaurant}
                                            selectedDish={selectedDish}
                                            onDishSelect={setSelectedDish}
                                            onClear={() => setSelectedDish(null)}
                                        />
                                    </View>
                                )}

                                {/* Rating - only show if dish selected */}
                                {selectedDish && (
                                    <View style={localStyles.reviewSection}>
                                        <RatingInput
                                            rating={rating}
                                            onRatingChange={setRating}
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
                                    attachedDishes={postedData?.attachedDishes || []}
                                    onDishesChange={dishes =>
                                        setpostedData(currentState => ({
                                            ...currentState,
                                            attachedDishes: dishes,
                                        }))
                                    }
                                />
                            </View>
                        )}

                        {/* Phone input for chefs without phone */}
                        {user?.type === 'chef' && !user?.phone && (
                            <ZPhoneInput
                                label={strings.phoneNumber}
                                value={phone}
                                defaultCode="EG"
                                placeholder={strings.addPhoneNumberPlaceholder}
                                onChangeText={setPhone}
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
