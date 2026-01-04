import axios from 'axios';
import { ACCESS_TOKEN, API_BASE_URL } from '../common/constants';
import { MMKVLoader } from 'react-native-mmkv-storage';

const client = axios.create();

const MMKV = new MMKVLoader().initialize();

const BASE_URL = API_BASE_URL;

client.defaults.baseURL = BASE_URL;

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

// Generate a random runtime ID to identify the specific simulator/session instance in logs
const RUNTIME_ID = Math.floor(Math.random() * 10000);

// Read token from MMKV on EVERY request to ensure each device uses its own token
// This fixes the issue where multiple simulators share the same in-memory token
client.interceptors.request.use(
  async config => {
    const token = MMKV.getString(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = token;

    } else {

    }
    return config;
  },
  error => Promise.reject(error),
);

const request = client;

export default request;
