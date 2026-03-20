/**
 * Comprehensive web shims for all remaining native-only modules.
 * Each module gets its own exported object matching the native API surface.
 */

// ─── @react-native-firebase/app ───
export const FirebaseApp = {
  initializeApp: () => Promise.resolve(),
  app: () => ({ name: 'web', options: {} }),
  apps: [],
  messaging: () => ({
    getToken: () => Promise.resolve('web-fcm-token'),
    onMessage: () => () => {},
    requestPermission: () => Promise.resolve(1),
  }),
};
export default FirebaseApp;
