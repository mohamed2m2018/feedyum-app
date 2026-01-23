import { legacy_createStore as createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import { MMKVLoader } from 'react-native-mmkv-storage';
import rootReducer from '../reducer';

// Create MMKV instance for redux-persist
const MMKV = new MMKVLoader().withInstanceID('redux').initialize();

// Custom MMKV storage adapter for redux-persist
const mmkvStorage = {
    setItem: (key, value) => {
        MMKV.setString(key, value);
        return Promise.resolve(true);
    },
    getItem: key => {
        const value = MMKV.getString(key);
        return Promise.resolve(value);
    },
    removeItem: key => {
        MMKV.removeItem(key);
        return Promise.resolve();
    },
};

// Configure persistence
const persistConfig = {
    key: 'root',
    storage: mmkvStorage,
    whitelist: ['cart', 'address'], // Persist cart and address reducers
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer, applyMiddleware(thunk));
const persistor = persistStore(store);

export { store, persistor };
export default store;
