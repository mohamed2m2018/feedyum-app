import axios from 'axios';
import { ACCESS_TOKEN, API_BASE_URL, API_STAGING_URL, ENVIRONMENT_KEY } from '../common/constants';
import { MMKVLoader } from 'react-native-mmkv-storage';

const client = axios.create();

const MMKV = new MMKVLoader().initialize();

// Determine initial base URL from persisted environment choice
const getInitialBaseURL = () => {
  const env = MMKV.getString(ENVIRONMENT_KEY);
  if (env === 'staging') {
    return API_STAGING_URL;
  }
  return API_BASE_URL;
};

client.defaults.baseURL = getInitialBaseURL();

const onSuccess = function (response) {
  return response;
};

const onError = function (error) {
  if (axios.isCancel(error)) {
    return Promise.reject(error);
  }
  if (error?.response) {
    return Promise.reject(error?.response?.data);
  } else {
    return Promise.reject(error);
  }
};

client.interceptors.response.use(onSuccess, onError);

// Read token from MMKV on EVERY request to ensure each device uses its own token
// This fixes the issue where multiple simulators share the same in-memory token
client.interceptors.request.use(
  async config => {
    const token = MMKV.getString(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  error => Promise.reject(error),
);

/**
 * Switch between production and staging environments.
 * Persists the choice in MMKV and updates the axios base URL immediately.
 * @param {'production' | 'staging'} env - The environment to switch to
 */
export const switchEnvironment = (env) => {
  MMKV.setString(ENVIRONMENT_KEY, env);
  const newURL = env === 'staging' ? API_STAGING_URL : API_BASE_URL;
  client.defaults.baseURL = newURL;
  console.log(`🔄 Environment switched to: ${env} | URL: ${newURL}`);
  return { env, url: newURL };
};

/**
 * Get the current active environment.
 * @returns {'production' | 'staging'}
 */
export const getCurrentEnvironment = () => {
  return MMKV.getString(ENVIRONMENT_KEY) || 'production';
};

const request = client;

export default request;
