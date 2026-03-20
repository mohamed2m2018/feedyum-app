/**
 * Web shim for react-native-onesignal
 * Uses browser Notification API. Silent no-op for most methods.
 */
const OneSignal = {
  initialize: (_appId) => {},
  setAppId: (_appId) => {},
  promptForPushNotificationsWithUserResponse: () => Promise.resolve(true),
  setNotificationWillShowInForegroundHandler: (_handler) => {},
  setNotificationOpenedHandler: (_handler) => {},
  getDeviceState: () => Promise.resolve({ userId: 'web-user', pushToken: 'web-token', subscribed: true }),
  addTrigger: (_key, _value) => {},
  removeTrigger: (_key) => {},
  setExternalUserId: (_id) => {},
  removeExternalUserId: () => {},
  sendTag: (_key, _value) => {},
  sendTags: (_tags) => {},
  deleteTag: (_key) => {},
  setEmail: (_email) => {},
  logoutEmail: () => {},
  addSubscriptionObserver: () => ({ remove: () => {} }),
  addEventListener: () => ({ remove: () => {} }),
  login: (_id) => {},
  logout: () => {},
  User: { addTag: () => {}, addTags: () => {}, removeTag: () => {}, setLanguage: () => {}, pushSubscription: { getIdAsync: () => Promise.resolve('web-sub-id') } },
  Notifications: { requestPermission: () => Promise.resolve(true), addEventListener: () => ({ remove: () => {} }) },
  InAppMessages: { addEventListener: () => ({ remove: () => {} }) },
};
export { OneSignal };
export default OneSignal;
