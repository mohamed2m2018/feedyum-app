/**
 * EditProfileScreen - Dedicated profile editing with auto-save
 * 
 * This screen handles editing existing user profiles with:
 * - Auto-save on field blur (no Update button needed)
 * - Real-time visual feedback when saving
 * - Separate branch management via ChefBranchesScreen
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ImagePicker from 'react-native-image-crop-picker';
import { Image as ImageCompressor } from 'react-native-compressor';
import LinearGradient from 'react-native-linear-gradient';
import debounce from 'lodash.debounce';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZInput from '../../../components/common/ZInput';
import ZPhoneInput from '../../../components/common/ZPhoneInput';
import ZKeyBoardAvoidWrapper from '../../../components/common/ZKeyBoardAvoidWrapper';
import ZText from '../../../components/common/ZText';
import ProfilePicture from '../../../components/models/ProfilePicture';
import strings from '../../../i18n/strings';
import images from '../../../assets/images';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKeys';
import request from '../../../api/request';
import { showErrorToast, showSuccessToast } from '../../../utils/toast';
import { useQuery, useQueryClient } from 'react-query';

const EditProfileScreen = ({ navigation }) => {
    const colors = useSelector(state => state.theme.theme);
    const ProfilePictureSheetRef = useRef(null);
    const phoneInputRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch current user data
    const { data: userData, isLoading: isLoadingUser } = useQuery(
        'user',
        () => request.get('/user'),
        {
            retry: 1,
            refetchOnMount: true,
        }
    );

    const user = userData?.data?.user;
    const isChef = user?.type === 'chef';

    // Track if form has been initialized to avoid overwriting user edits
    const [formInitialized, setFormInitialized] = useState(false);

    // Form state - Initialize with empty values, will be populated from useEffect
    const [fullName, setFullName] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [isPhoneValid, setIsPhoneValid] = useState(true);

    // Saving state for each field
    const [savingField, setSavingField] = useState(null); // 'name' | 'phone' | 'bio' | 'avatar'
    const [savedFields, setSavedFields] = useState(new Set()); // Fields that were just saved
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);

    // Input styles
    const BlurredStyle = {
        backgroundColor: colors.inputBg,
        borderColor: colors.bColor,
    };
    const FocusedStyle = {
        backgroundColor: colors.inputFocusColor,
        borderColor: colors.primary,
    };
    const [fullNameInputStyle, setFullNameInputStyle] = useState(BlurredStyle);
    const [bioStyle, setBioStyle] = useState(BlurredStyle);

    // Initialize form with user data when it loads - only once
    useEffect(() => {
        if (user?._id && !formInitialized) {
            console.log('[EditProfileScreen] Initializing form with user data:', user.fullName, user.phone);
            setFullName(user.fullName || '');
            setPhoneNo(user.phone || '');
            setBio(user.bio || '');
            setAvatar(user.avatar || null);
            setFormInitialized(true);
        }
    }, [user, formInitialized]);

    // Auto-save function
    const saveField = useCallback(async (fieldName, value) => {
        if (!value && fieldName !== 'bio') return; // Don't save empty required fields

        setSavingField(fieldName);
        try {
            const data = {};

            switch (fieldName) {
                case 'name':
                    if (!value || value.trim().length < 2) {
                        showErrorToast(strings.error, strings.nameTooShort);
                        setSavingField(null);
                        return;
                    }
                    data.fullName = value.trim();
                    break;
                case 'phone':
                    if (!phoneInputRef.current?.isValidNumber()) {
                        showErrorToast(strings.error, strings.pleaseProvideCorrectNo);
                        setSavingField(null);
                        return;
                    }
                    data.phone = value;
                    break;
                case 'bio':
                    data.bio = value;
                    break;
                case 'avatar':
                    data.avatar = value;
                    break;
                default:
                    return;
            }

            await request.patch('/user', data);

            // Show saved indicator
            setSavedFields(prev => new Set([...prev, fieldName]));

            // Clear saved indicator after 2 seconds
            setTimeout(() => {
                setSavedFields(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(fieldName);
                    return newSet;
                });
            }, 2000);

            // Invalidate user query to refresh data
            queryClient.invalidateQueries('user');

        } catch (error) {
            console.error('Failed to save field:', fieldName, error);
            showErrorToast(strings.error, error?.message || strings.errorOccured);
        } finally {
            setSavingField(null);
        }
    }, [queryClient]);

    // Debounced save handlers
    const debouncedSaveName = useCallback(
        debounce((value) => saveField('name', value), 1000),
        [saveField]
    );

    const debouncedSavePhone = useCallback(
        debounce((value) => saveField('phone', value), 1000),
        [saveField]
    );

    const debouncedSaveBio = useCallback(
        debounce((value) => saveField('bio', value), 1000),
        [saveField]
    );

    // Handle field changes
    const onChangedFullName = (text) => {
        setFullName(text);
        debouncedSaveName(text);
    };

    const onChangedBio = (text) => {
        setBio(text);
        debouncedSaveBio(text);
    };

    const onChangedPhoneNo = (text) => {
        setPhoneNo(text);
        
        // Auto-save phone as they type, just like name and bio
        // We only save if validation passes internally, which is handled in saveField
        debouncedSavePhone(text);
    };

    const handlePhoneBlur = () => {
        if (phoneNo && phoneNo !== user?.phone) {
            saveField('phone', phoneNo);
        }
    };

    const handlePhoneValidation = (isValid) => {
        setIsPhoneValid(isValid);
    };

    // Image upload handlers
    const uploadImageToBackend = async (imagePath, mimeType) => {
        const formData = new FormData();
        formData.append('image', {
            uri: imagePath,
            type: mimeType || 'image/jpeg',
            name: 'profile_' + Date.now() + '.jpg',
        });

        const response = await request.post('/messages/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response?.data?.success && response?.data?.url) {
            return response.data.url;
        }
        throw new Error('Upload failed');
    };

    const onPressCamera = async () => {
        try {
            const response = await ImagePicker.openCamera({
                mediaType: 'photo',
                cropping: true,
                includeBase64: false,
            });
            ProfilePictureSheetRef.current?.hide();
            setIsPhotoUploading(true);

            const result = await ImageCompressor.compress(response.path, {
                compressionMethod: 'auto',
            });
            const secureUrl = await uploadImageToBackend(result, response.mime);
            setAvatar(secureUrl);
            await saveField('avatar', secureUrl);
            setIsPhotoUploading(false);
        } catch (error) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.error('Camera error:', error);
                showErrorToast(strings.error, strings.uploadFailed);
            }
            setIsPhotoUploading(false);
        }
    };

    const onPressGallery = async () => {
        try {
            const response = await ImagePicker.openPicker({
                mediaType: 'photo',
                cropping: true,
                includeBase64: false,
            });
            ProfilePictureSheetRef.current?.hide();
            setIsPhotoUploading(true);

            const result = await ImageCompressor.compress(response.path, {
                compressionMethod: 'auto',
            });
            const secureUrl = await uploadImageToBackend(result, response.mime);
            setAvatar(secureUrl);
            await saveField('avatar', secureUrl);
            setIsPhotoUploading(false);
        } catch (error) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.error('Gallery error:', error);
                showErrorToast(strings.error, strings.uploadFailed);
            }
            setIsPhotoUploading(false);
        }
    };

    const onPressProfilePic = () => ProfilePictureSheetRef.current?.show();

    // Navigate to branch management
    const onPressManageBranches = () => {
        navigation.navigate(StackNav.ChefBranches);
    };

    // Render saved indicator
    const renderFieldStatus = (fieldName) => {
        if (savingField === fieldName) {
            return <ActivityIndicator size="small" color={colors.primary} />;
        }
        if (savedFields.has(fieldName)) {
            return <Ionicons name="checkmark-circle" size={moderateScale(20)} color="#28a745" />;
        }
        return null;
    };

    if (isLoadingUser) {
        return (
            <ZSafeAreaView>
                <ZHeader title={isChef ? strings.editProfileAndBranches : strings.editProfile} />
                <View style={localStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ZSafeAreaView>
        );
    }

    return (
        <ZSafeAreaView>
            <ZHeader title={isChef ? strings.editProfileAndBranches : strings.editProfile} />
            <ZKeyBoardAvoidWrapper containerStyle={localStyles.container}>
                {/* Avatar Section */}
                <View style={localStyles.avatarSection}>
                    <TouchableOpacity
                        onPress={onPressProfilePic}
                        activeOpacity={0.8}
                        style={localStyles.avatarWrapper}>
                        <LinearGradient
                            colors={[colors.primary, colors.primary + '80']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={localStyles.avatarGradientBorder}>
                            <View style={[localStyles.avatarInner, { backgroundColor: colors.backgroundColor }]}>
                                {isPhotoUploading ? (
                                    <ActivityIndicator size="large" color={colors.primary} />
                                ) : avatar ? (
                                    <Image source={{ uri: avatar }} style={localStyles.userImage} />
                                ) : (
                                    <Image
                                        source={colors.dark ? images.userDark : images.userLight}
                                        style={localStyles.userImage}
                                    />
                                )}
                            </View>
                        </LinearGradient>
                        {!isPhotoUploading && (
                            <View style={[localStyles.cameraIconContainer, { backgroundColor: colors.primary }]}>
                                <Ionicons name="camera" size={moderateScale(16)} color={colors.white} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <ZText type="m14" color={colors.grayScale5} style={localStyles.avatarHint}>
                        {avatar ? strings.tapToChangePhoto : strings.addPhoto}
                    </ZText>
                </View>

                {/* Form Section */}
                <View style={localStyles.formSection}>
                    {/* Personal Information Card */}
                    <View style={[localStyles.formCard, { backgroundColor: colors.dark ? colors.inputBg : colors.white }]}>
                        <View style={localStyles.cardHeader}>
                            <View style={[localStyles.cardIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="person" size={moderateScale(18)} color={colors.primary} />
                            </View>
                            <ZText type="b16" color={colors.textColor}>{strings.aboutYou}</ZText>
                        </View>

                        {/* Name Field */}
                        <View style={localStyles.fieldContainer}>
                            <ZInput
                                placeHolder={isChef ? strings.fullNameChef : strings.fullName}
                                insideLeftIcon={() => (
                                    <EntypoIcon name="text" size={moderateScale(18)} color={colors.grayScale5} />
                                )}
                                _value={fullName}
                                autoCapitalize="none"
                                toGetTextFieldValue={onChangedFullName}
                                inputContainerStyle={[
                                    localStyles.inputStyle,
                                    { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
                                    fullNameInputStyle,
                                ]}
                                _onFocus={() => setFullNameInputStyle(FocusedStyle)}
                                _onBlur={() => setFullNameInputStyle(BlurredStyle)}
                            />
                            <View style={localStyles.fieldStatus}>
                                {renderFieldStatus('name')}
                            </View>
                        </View>

                        {/* Phone Field */}
                        <View style={localStyles.fieldContainer}>
                            <ZPhoneInput
                                ref={phoneInputRef}
                                value={phoneNo}
                                defaultCode="EG"
                                placeholder={strings.phoneNumber}
                                onChangeText={onChangedPhoneNo}
                                onValidation={handlePhoneValidation}
                                onBlur={handlePhoneBlur}
                                containerStyle={localStyles.phoneInputContainer}
                            />
                            <View style={localStyles.fieldStatus}>
                                {renderFieldStatus('phone')}
                            </View>
                        </View>

                        {/* Bio Field */}
                        <View style={localStyles.fieldContainer}>
                            <ZInput
                                placeHolder={isChef ? strings.addRestaurantBio : strings.addBio}
                                _value={bio}
                                multiline
                                toGetTextFieldValue={onChangedBio}
                                insideLeftIcon={() => (
                                    <Ionicons
                                        style={{ position: 'relative', top: -18 }}
                                        name="information-circle"
                                        size={moderateScale(20)}
                                        color={colors.grayScale5}
                                    />
                                )}
                                inputContainerStyle={[
                                    localStyles.bioInputStyle,
                                    { backgroundColor: colors.dark ? colors.backgroundColor : colors.inputBg },
                                    bioStyle,
                                ]}
                                _onFocus={() => setBioStyle(FocusedStyle)}
                                _onBlur={() => setBioStyle(BlurredStyle)}
                            />
                            <View style={localStyles.fieldStatus}>
                                {renderFieldStatus('bio')}
                            </View>
                        </View>
                    </View>

                    {/* Branch Management - Only for Chefs */}
                    {isChef && (
                        <TouchableOpacity
                            style={[localStyles.branchesCard, { backgroundColor: colors.dark ? colors.inputBg : colors.white }]}
                            activeOpacity={0.7}
                            onPress={onPressManageBranches}>
                            <View style={localStyles.branchesCardContent}>
                                <View style={[localStyles.cardIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="location" size={moderateScale(18)} color={colors.primary} />
                                </View>
                                <View style={localStyles.branchesTextContainer}>
                                    <ZText type="b16" color={colors.textColor}>{strings.yourBranches}</ZText>
                                    <ZText type="m12" color={colors.grayScale5}>
                                        {strings.manageBranchLocations || 'Manage your branch locations'}
                                    </ZText>
                                </View>
                            </View>
                            <View style={[localStyles.chevronContainer, { backgroundColor: colors.primary + '10' }]}>
                                <Ionicons
                                    name="chevron-forward-outline"
                                    style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}}
                                    size={moderateScale(18)}
                                    color={colors.primary}
                                />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Auto-save hint */}
                    <View style={localStyles.autoSaveHint}>
                        <Ionicons name="checkmark-done-circle-outline" size={moderateScale(16)} color={colors.grayScale5} />
                        <ZText type="m12" color={colors.grayScale5} style={localStyles.autoSaveText}>
                            {strings.changesSavedAutomatically || 'Changes are saved automatically'}
                        </ZText>
                    </View>
                </View>
            </ZKeyBoardAvoidWrapper>

            <ProfilePicture
                onPressCamera={onPressCamera}
                onPressGallery={onPressGallery}
                SheetRef={ProfilePictureSheetRef}
            />
        </ZSafeAreaView>
    );
};

export default EditProfileScreen;

const localStyles = StyleSheet.create({
    container: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(20),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Avatar Section
    avatarSection: {
        alignItems: 'center',
        paddingTop: moderateScale(20),
        paddingBottom: moderateScale(24),
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarGradientBorder: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        padding: moderateScale(4),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: moderateScale(112),
        height: moderateScale(112),
        borderRadius: moderateScale(56),
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userImage: {
        width: moderateScale(112),
        height: moderateScale(112),
        borderRadius: moderateScale(56),
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: moderateScale(4),
        right: moderateScale(4),
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHint: {
        marginTop: moderateScale(12),
    },

    // Form Section
    formSection: {
        flex: 1,
    },
    formCard: {
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        marginBottom: moderateScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(16),
    },
    cardIconContainer: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },

    // Fields
    fieldContainer: {
        position: 'relative',
        marginBottom: moderateScale(12),
    },
    fieldStatus: {
        position: 'absolute',
        right: moderateScale(12),
        top: moderateScale(16),
        zIndex: 1,
    },
    inputStyle: {
        borderWidth: 1,
        borderRadius: moderateScale(12),
        paddingRight: moderateScale(40),
    },
    bioInputStyle: {
        borderWidth: 1,
        borderRadius: moderateScale(12),
        minHeight: moderateScale(100),
        paddingRight: moderateScale(40),
    },
    phoneInputContainer: {
        marginBottom: moderateScale(4),
    },

    // Branches Card
    branchesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        marginBottom: moderateScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    branchesCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    branchesTextContainer: {
        flex: 1,
    },
    chevronContainer: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: moderateScale(12),
    },

    // Auto-save hint
    autoSaveHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(16),
    },
    autoSaveText: {
        marginLeft: moderateScale(6),
    },
});
