import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import {QueryClient, QueryClientProvider} from 'react-query';
import App from './src';
import {name as appName} from './app.json';
import store from './src/redux/store';
import OneSignal from 'react-native-onesignal';

const queryClient = new QueryClient();

// Initialize OneSignal
OneSignal.setAppId('8f642b9d-8d10-4b66-b43a-c1d0345ef13f');

// Optional: Configure OneSignal
OneSignal.setLogLevel(6, 0); // Enable verbose OneSignal logs for debugging

const RNRoot = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  );
};

AppRegistry.registerComponent(appName, () => RNRoot);
