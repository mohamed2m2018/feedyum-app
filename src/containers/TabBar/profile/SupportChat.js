import React, { useEffect } from 'react';
import {
  configure,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  setTokenId,
  setSessionString,
  show,
} from 'react-native-crisp-chat-sdk';
import { useQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import request from '../../../api/request';

// Crisp Website ID
const CRISP_WEBSITE_ID = 'dcd331d3-58d2-4d93-aa4f-b5c8feab9d11';

export default function SupportChat({ route }) {
  const navigation = useNavigation();
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const user = userData?.data?.user;
  const orderId = route?.params?.orderId;

  useEffect(() => {
    // Configure Crisp with website ID
    configure(CRISP_WEBSITE_ID);

    // Use a unique token per order so each order gets its own chat thread
    // General support (no orderId) uses just the userId
    if (user?._id) {
      const tokenId = orderId
        ? `${user._id}_order_${orderId}`
        : user._id.toString();
      setTokenId(tokenId);
    }

    // Set user info
    if (user?.email) setUserEmail(user.email, null);
    if (user?.fullName || user?.username) {
      setUserNickname(user.fullName || user.username);
    }
    if (user?.phone) setUserPhone(user.phone);

    // Attach order context if available (when coming from disabled chat)
    if (orderId) {
      setSessionString('orderId', orderId);
      setSessionString('orderRef', `Order #${orderId.slice(-6)}`);
    }

    // Open Crisp as a native overlay and go back immediately
    // When user closes the overlay, they're back on the previous screen
    show();
    navigation.goBack();
  }, []);

  return null;
}
