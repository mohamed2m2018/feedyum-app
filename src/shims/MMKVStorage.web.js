/**
 * Web shim for react-native-mmkv-storage
 * Uses browser localStorage as the key-value store.
 */

class MMKVLoader {
  constructor() {
    this._id = 'default';
  }

  withInstanceID(id) {
    this._id = id;
    return this;
  }

  withEncryption() { return this; }
  encryptWithCustomKey() { return this; }
  setProcessingMode() { return this; }
  withServiceName() { return this; }

  initialize() {
    return new MMKVInstance(this._id);
  }
}

class MMKVInstance {
  constructor(id = 'default') {
    this._prefix = `mmkv_${id}_`;
  }

  _key(key) { return this._prefix + key; }

  setString(key, value) {
    try { localStorage.setItem(this._key(key), value); return true; }
    catch { return false; }
  }

  getString(key, callback) {
    try {
      const val = localStorage.getItem(this._key(key));
      if (callback) callback(null, val);
      return val;
    } catch (e) {
      if (callback) callback(e, null);
      return null;
    }
  }

  setInt(key, value) {
    return this.setString(key, String(value));
  }

  getInt(key, callback) {
    const val = this.getString(key);
    const num = val !== null ? parseInt(val, 10) : null;
    if (callback) callback(null, num);
    return num;
  }

  setBool(key, value) {
    return this.setString(key, value ? '1' : '0');
  }

  getBool(key, callback) {
    const val = this.getString(key);
    const bool = val !== null ? val === '1' : null;
    if (callback) callback(null, bool);
    return bool;
  }

  setMap(key, value) {
    try { return this.setString(key, JSON.stringify(value)); }
    catch { return false; }
  }

  getMap(key, callback) {
    try {
      const val = this.getString(key);
      const obj = val ? JSON.parse(val) : null;
      if (callback) callback(null, obj);
      return obj;
    } catch (e) {
      if (callback) callback(e, null);
      return null;
    }
  }

  setArray(key, value) { return this.setMap(key, value); }
  getArray(key, callback) { return this.getMap(key, callback); }

  removeItem(key) {
    try { localStorage.removeItem(this._key(key)); return true; }
    catch { return false; }
  }

  clearStore() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this._prefix)) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      return true;
    } catch { return false; }
  }

  getAllKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this._prefix)) {
        keys.push(k.slice(this._prefix.length));
      }
    }
    return keys;
  }

  // Indexer stubs
  indexer = {
    getAll: () => Promise.resolve([]),
    hasKey: () => Promise.resolve(false),
  };

  // useMMKVStorage hook
  static useMMKVStorage = (key, instance) => {
    const val = instance ? instance.getString(key) : null;
    const setter = (newVal) => instance?.setString(key, newVal);
    return [val, setter];
  };
}

export const useMMKVStorage = MMKVInstance.useMMKVStorage;

/**
 * create() — factory used by useStorage.js
 * Returns a React hook bound to the given MMKV instance.
 */
export const create = (instance) => {
  return (key, defaultValue) => {
    // Simple sync getter — on web this is localStorage-backed
    const stored = instance.getString(key);
    let value = defaultValue;
    if (stored !== null && stored !== undefined) {
      try { value = JSON.parse(stored); } catch { value = stored; }
    }

    const setValue = (newVal) => {
      const serialized = typeof newVal === 'string' ? newVal : JSON.stringify(newVal);
      instance.setString(key, serialized);
    };

    return [value, setValue];
  };
};

export { MMKVLoader, MMKVInstance };
export default { MMKVLoader, MMKVInstance, useMMKVStorage, create };
