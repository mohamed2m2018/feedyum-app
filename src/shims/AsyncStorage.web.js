/**
 * Web shim for @react-native-async-storage/async-storage
 * Uses browser localStorage — same as the official web implementation.
 */

const AsyncStorage = {
  getItem: async (key) => {
    try { return localStorage.getItem(key); }
    catch { return null; }
  },

  setItem: async (key, value) => {
    try { localStorage.setItem(key, value); }
    catch (e) { throw e; }
  },

  removeItem: async (key) => {
    try { localStorage.removeItem(key); }
    catch (e) { throw e; }
  },

  mergeItem: async (key, value) => {
    try {
      const existing = localStorage.getItem(key);
      if (existing) {
        const merged = { ...JSON.parse(existing), ...JSON.parse(value) };
        localStorage.setItem(key, JSON.stringify(merged));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) { throw e; }
  },

  clear: async () => {
    try { localStorage.clear(); }
    catch (e) { throw e; }
  },

  getAllKeys: async () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } catch { return []; }
  },

  multiGet: async (keys) => {
    try { return keys.map(k => [k, localStorage.getItem(k)]); }
    catch { return keys.map(k => [k, null]); }
  },

  multiSet: async (keyValuePairs) => {
    try { keyValuePairs.forEach(([k, v]) => localStorage.setItem(k, v)); }
    catch (e) { throw e; }
  },

  multiRemove: async (keys) => {
    try { keys.forEach(k => localStorage.removeItem(k)); }
    catch (e) { throw e; }
  },

  multiMerge: async (keyValuePairs) => {
    for (const [key, value] of keyValuePairs) {
      await AsyncStorage.mergeItem(key, value);
    }
  },

  flushGetRequests: () => {},

  useAsyncStorage: (key) => ({
    getItem: () => AsyncStorage.getItem(key),
    setItem: (value) => AsyncStorage.setItem(key, value),
    removeItem: () => AsyncStorage.removeItem(key),
    mergeItem: (value) => AsyncStorage.mergeItem(key, value),
  }),
};

export default AsyncStorage;
