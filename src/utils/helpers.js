import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

// Check App Platform
const checkPlatform = () => {
  if (Platform.OS === 'android') {
    return 'android';
  } else {
    return 'ios';
  }
};

// Device Type
const getDeviceType = () => {
  if (checkPlatform() === 'ios') {
    return 2;
  } else {
    return 1;
  }
};

// Set Async Storage Data
const setAsyncStorageData = async (key, value) => {
  const stringData = JSON.stringify(value);
  await AsyncStorage.setItem(key, stringData);
};

// Get Async Storage Data
const getAsyncStorageData = async key => {
  const data = await AsyncStorage.getItem(key);
  return JSON.parse(data);
};

// Debounce
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

// Get locale based on language (for date formatting)
const getLocale = (language) => {
  if (language === 'ar' || language === 'Arabic' || (typeof language === 'string' && language.toLowerCase().includes('arabic'))) {
    return 'ar-EG'; // Arabic - Egypt
  }
  return 'en-US'; // Default English
};

// Format time with locale support
const formatTime = (date, language, options = { hour: '2-digit', minute: '2-digit' }) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = getLocale(language);
  return dateObj.toLocaleTimeString(locale, options);
};

// Format date with locale support
const formatDate = (date, language, options = {}) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = getLocale(language);
  return dateObj.toLocaleDateString(locale, options);
};

// Format date and time with locale support
const formatDateTime = (date, language) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = getLocale(language);
  return dateObj.toLocaleString(locale);
};

export {
  getAsyncStorageData,
  setAsyncStorageData,
  getDeviceType,
  checkPlatform,
  debounce,
  getLocale,
  formatTime,
  formatDate,
  formatDateTime,
};
