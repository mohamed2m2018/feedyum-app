import React from 'react';
import strings from '../../../i18n/strings';
import {useQuery} from 'react-query';
import request from '../../../api/request';
import ProfilePicture from '../../../components/models/ProfilePicture';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNav} from '../../../navigation/NavigationKeys';
import {useHandleAuth} from '../../../utils/useHandleAuth';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

export default function AddPost() {
  const navigation = useNavigation();
  const color = useSelector(state => state.theme.theme);
  const ProfilePictureSheetRef = React.createRef();
  const {data} = useQuery('user', () => request.get('/user'));
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

const localStyles = StyleSheet.create({
  loader: {
    alignSelf: 'center',
    position: 'absolute',
    top: '50%',
  },
});
