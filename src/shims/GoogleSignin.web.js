/** Web shim for @react-native-google-signin/google-signin */
export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: () => Promise.resolve(true),
  signIn: () => Promise.resolve({ user: null }),
  signInSilently: () => Promise.resolve({ user: null }),
  signOut: () => Promise.resolve(),
  revokeAccess: () => Promise.resolve(),
  isSignedIn: () => Promise.resolve(false),
  getCurrentUser: () => null,
};
export const statusCodes = { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' };
export default GoogleSignin;
