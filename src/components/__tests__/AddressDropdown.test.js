import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AddressDropdown from '../AddressDropdown';

const mockStore = configureStore([]);

// Mock the location context
jest.mock('../../navigation/locationContext', () => ({
  useLocation: () => ({
    updateDeliveryLocation: jest.fn(),
  }),
}));

describe('AddressDropdown', () => {
  let store;
  let mockOnAddressSelect;

  beforeEach(() => {
    mockOnAddressSelect = jest.fn();
    
    store = mockStore({
      theme: {
        theme: {
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          primary: '#FF4D67',
          white: '#FFFFFF',
          inputBg: '#F5F5F5',
          grayScale5: '#666666',
          dark: false,
        },
      },
      address: {
        addresses: [
          {
            _id: '1',
            label: 'Home',
            formattedAddress: '123 Main St, City',
            isPrimary: true,
            addressType: 'home',
          },
        ],
        selectedAddress: null,
        loading: false,
      },
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <AddressDropdown
          onAddressSelect={mockOnAddressSelect}
          {...props}
        />
      </Provider>
    );
  };

  it('renders without infinite loops', async () => {
    const startTime = Date.now();
    const { getByText } = renderComponent();
    
    // Wait for initial render and effects
    await waitFor(() => {
      expect(getByText('123 Main St, City')).toBeTruthy();
    }, { timeout: 1000 });
    
    const renderTime = Date.now() - startTime;
    
    // Should render within reasonable time (less than 500ms)
    expect(renderTime).toBeLessThan(500);
  });

  it('does not cause excessive re-renders', async () => {
    let renderCount = 0;
    
    const TestComponent = () => {
      renderCount++;
      return <AddressDropdown onAddressSelect={mockOnAddressSelect} />;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    // Wait for initial effects to settle
    await waitFor(() => {
      expect(renderCount).toBeLessThan(10); // Should not render more than 10 times
    }, { timeout: 1000 });
  });

  it('handles address selection without infinite loops', async () => {
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(mockOnAddressSelect).toHaveBeenCalledTimes(1);
    });
    
    // Should only be called once for initial address selection
    expect(mockOnAddressSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: '1',
        label: 'Home',
        isPrimary: true,
      })
    );
  });
});