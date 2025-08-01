import {InteractionManager} from 'react-native';

// Debounce function to prevent excessive API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit function execution frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Run after interactions to prevent blocking UI
export const runAfterInteractions = (callback) => {
  return InteractionManager.runAfterInteractions(callback);
};

// Batch state updates to prevent multiple re-renders
export const batchUpdates = (updates) => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
};

// Memory-efficient array operations
export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Prevent memory leaks by cleaning up timers
export const createSafeTimer = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return {
    timer,
    clear: () => clearTimeout(timer),
  };
};

// Optimize image loading
export const optimizeImageUri = (uri, width = 200, height = 200) => {
  if (!uri) return null;
  
  // If it's already a CDN URL, return as is
  if (uri.includes('cloudfront.net')) {
    return uri;
  }
  
  // Replace S3 URLs with CloudFront for better performance
  if (uri.includes('foodtokforever.s3.amazonaws.com')) {
    return uri.replace(
      'https://foodtokforever.s3.amazonaws.com',
      'https://d1wfcrbbkg3bzd.cloudfront.net'
    );
  }
  
  return uri;
};

// React Query optimization helpers
export const getOptimizedQueryConfig = (type = 'default') => {
  const configs = {
    default: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    frequent: {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    static: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  };
  
  return configs[type] || configs.default;
};

export default {
  debounce,
  throttle,
  runAfterInteractions,
  batchUpdates,
  chunkArray,
  createSafeTimer,
  optimizeImageUri,
  getOptimizedQueryConfig,
};