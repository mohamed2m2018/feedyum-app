const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

const config = getDefaultConfig(__dirname);

// ─── SDK Source Resolution ────────────────────────────────────────────────────
// Point to the SDK workspace root (the package.json directory).
// We tell Metro to watch the entire SDK folder so any TypeScript change
// in src/ triggers Hot Module Replacement in Feedyum without needing
// a `npm run prepare` (bob build) step.
const SDK_ROOT = path.resolve(__dirname, '../../mobileai-suite-copy/react-native-ai-agent');
const SDK_SRC = path.resolve(SDK_ROOT, 'src/index.ts');

// Track watched folders so Metro rebuilds when SDK src/ changes.
config.watchFolders = [...(config.watchFolders ?? []), SDK_ROOT];

// Add SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Web shims: map native-only modules to browser-compatible replacements
const webShims = {
  'react-native-image-crop-picker': path.resolve(__dirname, 'src/shims/ImageCropPicker.web.js'),
  'react-native-permissions': path.resolve(__dirname, 'src/shims/Permissions.web.js'),
  '@notifee/react-native': path.resolve(__dirname, 'src/shims/Notifee.web.js'),
  'react-native-crisp-chat-sdk': path.resolve(__dirname, 'src/shims/CrispChat.web.js'),
  'react-native-linear-gradient': path.resolve(__dirname, 'src/shims/LinearGradient.web.js'),
  '@react-native-community/blur': path.resolve(__dirname, 'src/shims/BlurView.web.js'),
  'react-native-google-mobile-ads': path.resolve(__dirname, 'src/shims/GoogleMobileAds.web.js'),
  'react-native-background-upload': path.resolve(__dirname, 'src/shims/BackgroundUpload.web.js'),
  'react-native-maps': path.resolve(__dirname, 'src/shims/Maps.web.js'),
  'react-native-fast-image': path.resolve(__dirname, 'src/shims/FastImage.web.js'),
  'react-native-video': path.resolve(__dirname, 'src/shims/Video.web.js'),
  'react-native-share': path.resolve(__dirname, 'src/shims/Share.web.js'),
  'react-native-localization': path.resolve(__dirname, 'src/shims/Localization.web.js'),
  'react-native-mmkv-storage': path.resolve(__dirname, 'src/shims/MMKVStorage.web.js'),
  '@react-native-firebase/app': path.resolve(__dirname, 'src/shims/Firebase.web.js'),
  'react-native-onesignal': path.resolve(__dirname, 'src/shims/OneSignal.web.js'),
  'react-native-vision-camera': path.resolve(__dirname, 'src/shims/VisionCamera.web.js'),
  'react-native-audio-record': path.resolve(__dirname, 'src/shims/AudioRecord.web.js'),
  'react-native-fs': path.resolve(__dirname, 'src/shims/RNFS.web.js'),
  'react-native-compressor': path.resolve(__dirname, 'src/shims/Compressor.web.js'),
  'react-native-create-thumbnail': path.resolve(__dirname, 'src/shims/Thumbnail.web.js'),
  'react-native-restart': path.resolve(__dirname, 'src/shims/Restart.web.js'),
  '@react-native-google-signin/google-signin': path.resolve(__dirname, 'src/shims/GoogleSignin.web.js'),
  '@react-native-community/geolocation': path.resolve(__dirname, 'src/shims/Geolocation.web.js'),
  '@react-native-community/slider': path.resolve(__dirname, 'src/shims/Slider.web.js'),
  'react-native-webview': path.resolve(__dirname, 'src/shims/WebView.web.js'),
  'react-native-admob-native-ads': path.resolve(__dirname, 'src/shims/AdmobNativeAds.web.js'),
  'react-native-aws3': path.resolve(__dirname, 'src/shims/AWS3.web.js'),
  'sovran-react-native': path.resolve(__dirname, 'src/shims/Sovran.web.js'),
  '@segment/analytics-react-native': path.resolve(__dirname, 'src/shims/SegmentAnalytics.web.js'),
  'react-native-sound': path.resolve(__dirname, 'src/shims/Sound.web.js'),
  '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/shims/AsyncStorage.web.js'),
  'reactotron-react-native': path.resolve(__dirname, 'src/shims/Reactotron.web.js'),
  'react-native-alert-notification': path.resolve(__dirname, 'src/shims/AlertNotification.web.js'),
};

const exclusionList = require('metro-config/src/defaults/exclusionList');
  
config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    // Safely combine any existing blockList (which might be a RegExp, not an Array)
    ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : (config.resolver.blockList ? [config.resolver.blockList] : [])),
    new RegExp(SDK_ROOT.replace(/[/\\]/g, '[/\\\\]') + '[/\\\\]node_modules[/\\\\].*')
  ]),
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg', 'ts', 'tsx'],
  unstable_enablePackageExports: false,
  // Redirect @mobileai/react-native to SDK src/ so Metro compiles TypeScript
  // Set nodeModulesPaths so that when Metro is parsing the external SDK source,
  // it knows to resolve third-party imports (like 'react-native') from Feedyum's node_modules.
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
  ],
  // Redirect native-only modules to web shims when building for web
  resolveRequest: (context, moduleName, platform) => {
    // Intercept the SDK import to force Metro to read the raw TypeScript src
    // instead of following the package.json symlink to the compiled lib/module/
    if (moduleName === '@mobileai/react-native') {
      return {
        filePath: SDK_SRC,
        type: 'sourceFile',
      };
    }

    if (platform === 'web' && webShims[moduleName]) {
      return {
        filePath: webShims[moduleName],
        type: 'sourceFile',
      };
    }

    // Fix broken main field in react-async-hook (points to root instead of dist/)
    if (moduleName === 'react-async-hook') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/react-async-hook/dist/index.js'),
        type: 'sourceFile',
      };
    }

    // Fall back to default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Auto-generate the AI screen map on start for the React Native Agentic AI
try {
  require('@mobileai/react-native/generate-map').autoGenerate(__dirname);
} catch {
  // generate-map is optional during dev when SDK src is linked directly
}

module.exports = config;
