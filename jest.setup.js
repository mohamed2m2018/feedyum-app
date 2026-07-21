// React Native's Jest environment exposes `window` without the DOM event API
// that React 19's test renderer uses to report asynchronous errors.
if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
  window.dispatchEvent = jest.fn();
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NativeModules } = require('react-native');

NativeModules.ReactLocalization = NativeModules.ReactLocalization || {
  language: 'en',
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  setRNConfiguration: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: { LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE' },
    ANDROID: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked' },
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  requestNotifications: jest.fn(() => Promise.resolve({ status: 'granted' })),
  checkNotifications: jest.fn(() => Promise.resolve({ status: 'granted' })),
  openSettings: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getDeviceState: jest.fn(() => Promise.resolve(null)),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    User: {
      setLanguage: jest.fn(),
      addTag: jest.fn(),
      addTags: jest.fn(),
      removeTags: jest.fn(),
      pushSubscription: {
        getPushSubscriptionId: jest.fn(),
        getOptedIn: jest.fn(),
      },
    },
  },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve('orders')),
    displayNotification: jest.fn(() => Promise.resolve()),
    cancelNotification: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PUBLIC: 1 },
  AndroidCategory: { ALARM: 'alarm' },
  EventType: { PRESS: 1, DISMISSED: 0 },
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(() => Promise.resolve()),
          stopAsync: jest.fn(() => Promise.resolve()),
          unloadAsync: jest.fn(() => Promise.resolve()),
          setIsLoopingAsync: jest.fn(() => Promise.resolve()),
        },
      })),
    },
  },
}));

jest.mock('react-native-mmkv-storage', () => {
  const values = new Map();
  const instance = {
    getString: jest.fn(key => values.get(key)),
    setString: jest.fn((key, value) => values.set(key, value)),
    removeItem: jest.fn(key => values.delete(key)),
    getItem: jest.fn(key => Promise.resolve(values.get(key))),
    setItem: jest.fn((key, value) => {
      values.set(key, value);
      return Promise.resolve(true);
    }),
  };

  class MMKVLoader {
    withInstanceID() {
      return this;
    }

    initialize() {
      return instance;
    }
  }

  return {
    MMKVLoader,
    create: jest.fn(() => instance),
    useMMKVStorage: jest.fn((key, storage, initialValue) => [
      storage.getString(key) ?? initialValue,
      value => storage.setString(key, value),
    ]),
  };
});
