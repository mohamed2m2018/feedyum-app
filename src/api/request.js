import axios from 'axios';
import {ACCESS_TOKEN} from '../common/constants';
import {getAsyncStorageData} from '../utils/helpers';

const client = axios.create();

const BASE_URL = 'http://192.168.1.5:4800/api';

client.defaults.baseURL = BASE_URL;

getAsyncStorageData(ACCESS_TOKEN).then(res => {
  client.defaults.headers.common.Authorization = res;
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
