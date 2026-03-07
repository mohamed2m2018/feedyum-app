import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import strings from '../../../i18n/strings';
import { useQuery } from 'react-query';
import request from '../../../api/request';
import MediaSelectionModal from '../../../components/modals/MediaSelectionModal';
import ImagePicker from 'react-native-image-crop-picker';
import { PERMISSIONS, request as requestPermission, check as checkPermission, RESULTS } from 'react-native-permissions';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { StackNav } from '../../../navigation/NavigationKeys';
import { useHandleAuth } from '../../../utils/useHandleAuth';
import { ActivityIndicator, StyleSheet } from 'react-native';
import BottomActionSheet from '../../../components/models/BottomActionSheet';
import { useSelector } from 'react-redux';

export default function AddPost() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const color = useSelector(state => state.theme.theme);
  const { data } = useQuery('user', () => request.get('/user'));
  const user = data?.data?.user;
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState({ visible: false, title: '', message: '' });

  const { handleAuthToast, isGuest } = useHandleAuth();

  // Permission helpers
  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const currentStatus = await checkPermission(permission);
      if (currentStatus === RESULTS.GRANTED) return true;
      if (currentStatus === RESULTS.DENIED) {
        const result = await requestPermission(permission);
        return result === RESULTS.GRANTED;
      }
      return false;
    } catch { return false; }
  };

  const showPermissionAlert = (type) => {
    Alert.alert(
      strings.permissionRequired || 'Permission Required',
      `${type} access is required. Please enable it in Settings.`,
      [
        { text: strings.cancel || 'Cancel', style: 'cancel' },
        { text: strings.settings || 'Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  // Callbacks for MediaSelectionModal - open picker first, navigate with media
  const handleRecordVideo = async () => {
    setShowModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }
    try {
      const result = await ImagePicker.openCamera({
        mediaType: 'video',
        compressVideoPreset: 'MediumQuality',
      });
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage: false, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  const handleTakePhoto = async () => {
    setShowModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showPermissionAlert('Camera');
      return;
    }
    try {
      const result = await ImagePicker.openCamera({
        cropping: true,
        compressImageQuality: 1,
      });
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage: true, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  const handlePickFromGallery = async () => {
    setShowModal(false);
    try {
      const result = await ImagePicker.openPicker({
        mediaType: 'any',
        compressImageQuality: 1,
        compressVideoPreset: 'MediumQuality',
      });
      const isImage = !result.duration;
      navigation.navigate({ name: StackNav.CreateReel, params: { isImage, mediaData: result }, merge: true });
    } catch (err) {
      // User cancelled or error - do nothing
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function verifyChefCanPost() {
      if (!isFocused || isGuest) return;

      if (user?.type !== 'chef') {
        if (!cancelled) setShowModal(true);
        return;
      }

      try {
        const menuResponse = await request.get(`/menus/chef/${user?._id}`);
        const menuId = menuResponse?.data?._id;
        if (!menuId) {
          if (!cancelled) setShowModal(false);
          setModalState({
            visible: true,
            title: strings.createMenuFirst,
            message: strings.createMenuMessage,
          });
          return;
        }

        const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
        const dishes = dishesResponse?.data || [];
        if (!Array.isArray(dishes) || dishes.length === 0) {
          if (!cancelled) setShowModal(false);
          setModalState({
            visible: true,
            title: strings.noDishesFoundTitle,
            message: strings.noDishesFoundMessage,
          });
          return;
        }

        if (!cancelled) setShowModal(true);
      } catch (e) {
        if (!cancelled) setShowModal(false);
        setModalState({
          visible: true,
          title: strings.noDishesFoundTitle,
          message: strings.noDishesFoundMessage,
        });
      }
    }

    verifyChefCanPost();
    return () => {
      cancelled = true;
    };
  }, [isFocused, isGuest, user?._id, user?.type]);

  useFocusEffect(
    React.useCallback(() => {
      handleAuthToast();
    }, []),
  );

  return (
    <>
      <ActivityIndicator
        size={'large'}
        style={localStyles.loader}
        color={color.primary}
      />
      {!isGuest && (
        <MediaSelectionModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onRecordVideo={handleRecordVideo}
          onTakePhoto={handleTakePhoto}
          onPickFromGallery={handlePickFromGallery}
          title={strings.createNewPost}
          subtitle={strings.chooseHowToCreatePost}
        />
      )}
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
    </>
  );
}

const localStyles = StyleSheet.create({
  loader: {
    alignSelf: 'center',
    position: 'absolute',
    top: '50%',
  },
});
