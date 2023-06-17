import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import {QueryClient, QueryClientProvider} from 'react-query';
import App from './src';
import {name as appName} from './app.json';
import store from './src/redux/store';

const queryClient = new QueryClient();

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
