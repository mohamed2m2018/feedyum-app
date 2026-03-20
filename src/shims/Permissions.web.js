/**
 * Web shim for react-native-permissions
 * On web, permissions are handled natively by the browser.
 * This shim always returns GRANTED so app logic flows through cleanly.
 */

export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};

export const PERMISSIONS = {
  IOS: {
    CAMERA: 'ios.permission.CAMERA',
    PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    NOTIFICATIONS: 'ios.permission.NOTIFICATIONS',
    MICROPHONE: 'ios.permission.MICROPHONE',
  },
  ANDROID: {
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
  },
};

export const check = async (_permission) => RESULTS.GRANTED;
export const request = async (_permission) => RESULTS.GRANTED;
export const checkMultiple = async (permissions) => {
  const result = {};
  permissions.forEach((p) => { result[p] = RESULTS.GRANTED; });
  return result;
};
export const requestMultiple = async (permissions) => checkMultiple(permissions);
export const openSettings = () => {
  // No-op on web
  console.log('[Web] openSettings is not available on web');
};

export default {
  RESULTS,
  PERMISSIONS,
  check,
  request,
  checkMultiple,
  requestMultiple,
  openSettings,
};
