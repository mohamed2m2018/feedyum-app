/**
 * Web shim for reactotron-react-native
 * Reactotron is a dev-only desktop app for native. On web, we use browser devtools.
 * This shim provides no-ops so the app doesn't crash from deep RN imports.
 */

const Reactotron = {
  configure: () => Reactotron,
  useReactNative: () => Reactotron,
  use: () => Reactotron,
  connect: () => Reactotron,
  setAsyncStorageHandler: () => Reactotron,
  clear: () => {},
  log: () => {},
  logImportant: () => {},
  display: () => {},
  error: () => {},
};

export default Reactotron;
