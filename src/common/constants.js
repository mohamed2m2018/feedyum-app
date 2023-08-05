import {Dimensions, Platform, StatusBar} from 'react-native';
import strings from '../i18n/strings';

let iPhoneX = screenHeight === 812 ? true : false;

// StatusBar Height
export const STATUSBAR_HEIGHT =
  Platform.OS === 'ios' ? (iPhoneX ? 44 : 22) : StatusBar.currentHeight;
export const screenHeight = Dimensions.get('window').height - STATUSBAR_HEIGHT;
export const screenWidth = Dimensions.get('window').width;
export const screenFullHeight = Dimensions.get('window').height;
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

export const THEME = 'THEME';
export const APP_OPEN_FIRST_TIME = 'APP_OPEN_FIRST_TIME';
export const ACCESS_TOKEN = 'ACCESS_TOKEN';
export const REGISTRATION_COMPLETED = 'REGISTRATION_COMPLETED';

export const GenderData = [
  {label: strings.male, value: 'male'},
  {label: strings.female, value: 'female'},
  {label: strings.other, value: 'other'},
];

export function getVideoExtension(url) {
  var extension = url.substring(url.lastIndexOf('.') + 1);
  // Return the video extension
  return extension;
}
