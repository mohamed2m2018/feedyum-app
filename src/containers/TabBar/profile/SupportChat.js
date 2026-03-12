import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import CrispChat, {
  configure,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  setUserTokenId,
} from 'react-native-crisp-chat-sdk';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import request from '../../../api/request';
import strings from '../../../i18n/strings';

// Crisp Website ID
const CRISP_WEBSITE_ID = 'dcd331d3-58d2-4d93-aa4f-b5c8feab9d11';

export default function SupportChat({ route }) {
  const colors = useSelector(state => state.theme.theme);
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const user = userData?.data?.user;

  useEffect(() => {
    // Configure Crisp with website ID
    configure(CRISP_WEBSITE_ID);

    // Set user token ID so chats persist across sessions
    if (user?._id) {
      setUserTokenId(user._id.toString());
    }

    // Set user info
    if (user?.email) setUserEmail(user.email);
    if (user?.fullName || user?.username) {
      setUserNickname(user.fullName || user.username);
    }
    if (user?.phone) setUserPhone(user.phone);
  }, [user]);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.supportChat} showBack />
      <CrispChat />
    </ZSafeAreaView>
  );
}
