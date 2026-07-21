import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from 'react-query';
import configureStore from 'redux-mock-store';
import ShoppingCart from '../ShoppingCart';

const mockStore = configureStore([]);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

jest.mock('../../../../utils/useHandleAuth', () => ({
  useHandleAuth: () => ({
    isGuest: false,
    handleAuthToast: jest.fn(),
  }),
}));

jest.mock('../../../../redux/actions/addressActions', () => ({
  getAddresses: () => ({ type: 'TEST_GET_ADDRESSES' }),
  setSelectedAddress: address => ({ type: 'TEST_SELECT_ADDRESS', payload: address }),
}));

describe('ShoppingCart', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      theme: {
        theme: {
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          primary: '#FF4D67',
          white: '#FFFFFF',
          inputBg: '#F5F5F5',
          grayScale7: '#666666',
          error: '#FF0000',
        },
      },
      cart: {
        items: [
          {
            dishId: '1',
            dish: {
              _id: '1',
              name: 'Test Dish',
              price: 25,
              image: 'https://example.com/image.jpg',
            },
            quantity: 2,
          },
        ],
        subtotal: 50,
        chefId: 'chef1',
        chefName: 'Test Chef',
      },
      address: {
        addresses: [],
        selectedAddress: null,
        loading: false,
      },
      order: {
        isPlacing: false,
        error: null,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <ShoppingCart />
          </NavigationContainer>
        </QueryClientProvider>
      </Provider>
    );
  };

  it('renders cart items correctly', async () => {
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(getByText('Test Dish')).toBeTruthy();
      expect(getByText('25 EGP')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
    });
  });

  it('handles empty cart state', async () => {
    store = mockStore({
      ...store.getState(),
      cart: {
        items: [],
        subtotal: 0,
        chefId: null,
        chefName: null,
      },
    });

    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(getByText('Your cart is empty')).toBeTruthy();
    });
  });

  it('does not freeze on render', async () => {
    const startTime = Date.now();
    renderComponent();
    const renderTime = Date.now() - startTime;
    
    // Should render within reasonable time (less than 1 second)
    expect(renderTime).toBeLessThan(1000);
  });
});
