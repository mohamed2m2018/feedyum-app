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
  return dateObj.toLocaleString(locale, {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Re-format a slot label like "11:00 AM – 1:00 PM" to the current locale
const formatSlotLabel = (label, language) => {
  if (!label) return '';
  const locale = getLocale(language);
  // Match "HH:MM AM/PM – HH:MM AM/PM" pattern
  const match = label.match(/(\d{1,2}:\d{2}\s*[APap][Mm])\s*[–\-]\s*(\d{1,2}:\d{2}\s*[APap][Mm])/);
  if (!match) return label; // fallback to original if can't parse
  try {
    const today = new Date();
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.trim().split(/\s+/);
      const [hours, minutes] = time.split(':').map(Number);
      let h = hours;
      if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, minutes);
    };
    const start = parseTime(match[1]);
    const end = parseTime(match[2]);
    const opts = { hour: 'numeric', minute: '2-digit' };
    return `${start.toLocaleTimeString(locale, opts)} – ${end.toLocaleTimeString(locale, opts)}`;
  } catch (e) {
    return label;
  }
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
  formatSlotLabel,
};
