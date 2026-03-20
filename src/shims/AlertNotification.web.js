/**
 * Web shim for react-native-alert-notification
 */
import React from 'react';
import { View, Text } from 'react-native';

export const ALERT_TYPE = {
  SUCCESS: 'SUCCESS',
  DANGER: 'DANGER',
  WARNING: 'WARNING',
  INFO: 'INFO',
};

export const Dialog = {
  show: (options) => {
    if (typeof window !== 'undefined') {
      if (options.title || options.textBody) {
        window.alert(`${options.title || ''}\n${options.textBody || ''}`);
      }
    }
  },
  hide: () => {},
};

export const Toast = {
  show: (options) => {
    if (typeof window !== 'undefined') {
      console.log('Toast:', options.title, options.textBody);
      // Fallback to alert if no custom web toast is set up
      window.alert(`${options.title || ''}: ${options.textBody || ''}`);
    }
  },
  hide: () => {},
};

export const AlertNotificationRoot = ({ children }) => <>{children}</>;

export default { ALERT_TYPE, Dialog, Toast, AlertNotificationRoot };
