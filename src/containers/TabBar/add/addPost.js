import React, { useEffect } from 'react';
import strings from '../../../i18n/strings';
import { useQuery } from 'react-query';
import request from '../../../api/request';
import ProfilePicture from '../../../components/models/ProfilePicture';
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
  const ProfilePictureSheetRef = React.createRef();
  const { data } = useQuery('user', () => request.get('/user'));
  const user = data?.data?.user;
  const [canShowSheet, setCanShowSheet] = React.useState(false);
  const [modalState, setModalState] = React.useState({ visible: false, title: '', message: '' });
  const onPressPost = isImage => {
    ProfilePictureSheetRef?.current?.hide();
    navigation.navigate(StackNav.PostDetail, { isImage });
  };

  const { handleAuthToast, isGuest } = useHandleAuth();

  useEffect(() => {
    let cancelled = false;
    async function verifyChefCanPost() {
      // Guests handled separately
      if (!isFocused || isGuest) return;

      // Non-chef users can proceed
      if (user?.type !== 'chef') {
        if (!cancelled) setCanShowSheet(true);
        return;
      }

      try {
        const menuResponse = await request.get(`/menus/chef/${user?._id}`);
        const menuId = menuResponse?.data?._id;
        if (!menuId) {
          if (!cancelled) setCanShowSheet(false);
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
          if (!cancelled) setCanShowSheet(false);
          setModalState({
            visible: true,
            title: strings.noDishesFoundTitle,
            message: strings.noDishesFoundMessage,
          });
          return;
        }

        if (!cancelled) setCanShowSheet(true);
      } catch (e) {
        if (!cancelled) setCanShowSheet(false);
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

  useEffect(() => {
    if (ProfilePictureSheetRef.current && isFocused && !isGuest && canShowSheet) {
      ProfilePictureSheetRef?.current?.show?.();
    }
  }, [isFocused, isGuest, canShowSheet]);

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
        <ProfilePicture
          SheetRef={ProfilePictureSheetRef}
          post={true}
          live={false}
          isFromSwipe
          title={
            data?.data?.user?.type === 'user'
              ? strings.chooseUser
              : strings.choose
          }
          onPressCamera={onPressPost}
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
