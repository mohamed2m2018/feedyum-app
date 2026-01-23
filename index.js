import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

// Disable console logging in production
if (!__DEV__) {
  console.log = () => { };
  console.info = () => { };
  console.debug = () => { };
  console.warn = () => { };
  // Keep console.error for critical error reporting
}
LogBox.ignoreAllLogs(true);
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from 'react-query';
import App from './src';
import { store, persistor } from './src/redux/store';
import { createClient, AnalyticsProvider } from '@segment/analytics-react-native';
import { createOptimizedQueryClient } from './src/config/queryClient';

const queryClient = createOptimizedQueryClient();

if (__DEV__) {
  require('./ReactotronConfig');
}

const segmentClient = createClient({
  writeKey: '***REMOVED***',
  trackAppLifecycleEvents: true,
});

const RNRoot = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AnalyticsProvider client={segmentClient}>
            <App />
          </AnalyticsProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
};

registerRootComponent(RNRoot);
