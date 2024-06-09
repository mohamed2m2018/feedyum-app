import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import {QueryClient, QueryClientProvider} from 'react-query';
import App from './src';
import {name as appName} from './app.json';
import store from './src/redux/store';
import OneSignal from 'react-native-onesignal';
import codePush from 'react-native-code-push';
import {createClient, AnalyticsProvider} from '@segment/analytics-react-native';
const queryClient = new QueryClient();

if (__DEV__) {
  require('./ReactotronConfig');
}

// Initialize OneSignal
OneSignal.setAppId('8f642b9d-8d10-4b66-b43a-c1d0345ef13f');

// Optional: Configure OneSignal
OneSignal.setLogLevel(6, 0); // Enable verbose OneSignal logs for debugging

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

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
};

const CodePushedApp = codePush(codePushOptions)(RNRoot);

AppRegistry.registerComponent(appName, () => CodePushedApp);
