import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Provider } from 'react-redux';
import { QueryClientProvider } from 'react-query';
import App from './src';
import store from './src/redux/store';
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
        <AnalyticsProvider client={segmentClient}>
          <App />
        </AnalyticsProvider>
      </Provider>
    </QueryClientProvider>
  );
};

registerRootComponent(RNRoot);
