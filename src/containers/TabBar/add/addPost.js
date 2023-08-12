import React, {useEffect} from 'react';
import strings from '../../../i18n/strings';
import {useQuery} from 'react-query';
import request from '../../../api/request';
import ProfilePicture from '../../../components/models/ProfilePicture';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNav} from '../../../navigation/NavigationKeys';
import {useHandleAuth} from '../../../utils/useHandleAuth';

export default function AddPost() {
  const navigation = useNavigation();
  const ProfilePictureSheetRef = React.createRef();
  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});
  const onPressPost = isImage => {
    ProfilePictureSheetRef?.current?.hide();
    navigation.navigate(StackNav.PostDetail, {isImage});
  };
  const {handleAuthToast, isGuest} = useHandleAuth();

  useFocusEffect(
    React.useCallback(() => {
      handleAuthToast();
    }, []),
  );

  return (
    <>
      {!isGuest && (
        <ProfilePicture
          SheetRef={ProfilePictureSheetRef}
          post={true}
          live={false}
          title={
            data?.data?.user?.type === 'user'
              ? strings.chooseUser
              : strings.choose
          }
          onPressCamera={onPressPost}
        />
      )}
    </>
  );
}
