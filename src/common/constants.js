import { Dimensions, Platform, StatusBar } from 'react-native';
import strings from '../i18n/strings';
export const API_BASE_URL = __DEV__ ? 'http://192.168.1.101:4800/api' : 'https://feedyum.com/api';
export const API_STAGING_URL = 'https://makeit-be-staging-5lua2axahq-ew.a.run.app/api';
export const ENVIRONMENT_KEY = 'APP_ENVIRONMENT'; // 'production' or 'staging'

// Initial Dimensions
const windowDimensions = Dimensions.get('window');
const windowHeight = windowDimensions.height;
const windowWidth = windowDimensions.width;

let iPhoneX = windowHeight === 812 ? true : false;

// StatusBar Height
export const STATUSBAR_HEIGHT =
  Platform.OS === 'ios' ? (iPhoneX ? 44 : 22) : StatusBar.currentHeight;

export const screenHeight = windowHeight - STATUSBAR_HEIGHT;
export const screenWidth = windowWidth;
export const screenFullHeight = windowHeight;
export const isAndroid = Platform.OS === 'ios' ? false : true;

let sampleHeight = 926;
let sampleWidth = 428;

export const isShowLog = true;


//Get Width of Screen
export function getWidth(value) {
  return (value / sampleWidth) * screenWidth;
}

//Get Height of Screen
export function getHeight(value) {
  return (value / sampleHeight) * screenHeight;
}
const scale = size => (screenWidth / sampleWidth) * size;

// Moderate Scale Function
export function moderateScale(size, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}

export const iosReelHeight = screenFullHeight - getHeight(100);
export const androidReelHeight = screenFullHeight - getHeight(70);

// Navigation Heights - Single Source of Truth
export const BOTTOM_TAB_HEIGHT = 60;
export const TOP_TAB_HEIGHT = 48;

export const THEME = 'THEME';
export const APP_OPEN_FIRST_TIME = 'APP_OPEN_FIRST_TIME';
export const ACCESS_TOKEN = 'ACCESS_TOKEN';
export const REGISTRATION_COMPLETED = 'REGISTRATION_COMPLETED';

// Function to get translated gender options - must be called at runtime
export const getGenderData = () => [
  { label: strings.male, value: 'male' },
  { label: strings.female, value: 'female' },
  { label: strings.other, value: 'other' },
];

// Deprecated: Use getGenderData() instead
export const GenderData = [
  { label: strings.male, value: 'male' },
  { label: strings.female, value: 'female' },
  { label: strings.other, value: 'other' },
];

export function getVideoExtension(url) {
  var extension = url.substring(url.lastIndexOf('.') + 1);
  // Return the video extension
  return extension;
}
