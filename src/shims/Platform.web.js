/**
 * Web shim for react-native Platform module
 * This is used when Metro resolves internal RN imports like
 * ../Utilities/Platform from LogBox.js on the web platform.
 */

const Platform = {
  __constants: null,
  OS: 'web',
  get Version() { return ''; },
  get constants() {
    return {
      isTesting: false,
      isDisableAnimations: false,
      osVersion: '',
      reactNativeVersion: { major: 0, minor: 79, patch: 6 },
      systemName: 'web',
    };
  },
  get isPad() { return false; },
  get isTV() { return false; },
  get isVision() { return false; },
  get isTesting() { return false; },
  get isDisableAnimations() { return false; },
  select: (spec) => 'web' in spec ? spec.web : 'default' in spec ? spec.default : undefined,
};

export default Platform;
