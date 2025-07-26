import axios from 'axios';
import {ACCESS_TOKEN} from '../common/constants';
import {MMKVLoader} from 'react-native-mmkv-storage';

const client = axios.create();

const MMKV = new MMKVLoader().initialize();

const BASE_URL = 'http://localhost:4800/api';

client.defaults.baseURL = BASE_URL;

MMKV.getString(ACCESS_TOKEN, (error, result) => {
  client.defaults.headers.common.Authorization = result;
});

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
    return error.message;
  }
};

client.interceptors.response.use(onSuccess, onError);
client.interceptors.request.use(
  config => {
    return config;
  },
  error => Promise.reject(error),
);

const request = client;

export default request;
