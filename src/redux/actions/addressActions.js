import addressService from '../../services/addressService';

// Action Types
export const ADDRESS_ACTIONS = {
  GET_ADDRESSES_REQUEST: 'GET_ADDRESSES_REQUEST',
  GET_ADDRESSES_SUCCESS: 'GET_ADDRESSES_SUCCESS',
  GET_ADDRESSES_FAILURE: 'GET_ADDRESSES_FAILURE',
  
  ADD_ADDRESS_REQUEST: 'ADD_ADDRESS_REQUEST',
  ADD_ADDRESS_SUCCESS: 'ADD_ADDRESS_SUCCESS',
  ADD_ADDRESS_FAILURE: 'ADD_ADDRESS_FAILURE',
  
  EDIT_ADDRESS_REQUEST: 'EDIT_ADDRESS_REQUEST',
  EDIT_ADDRESS_SUCCESS: 'EDIT_ADDRESS_SUCCESS',
  EDIT_ADDRESS_FAILURE: 'EDIT_ADDRESS_FAILURE',
  
  DELETE_ADDRESS_REQUEST: 'DELETE_ADDRESS_REQUEST',
  DELETE_ADDRESS_SUCCESS: 'DELETE_ADDRESS_SUCCESS',
  DELETE_ADDRESS_FAILURE: 'DELETE_ADDRESS_FAILURE',
  
  SET_CURRENT_LOCATION_REQUEST: 'SET_CURRENT_LOCATION_REQUEST',
  SET_CURRENT_LOCATION_SUCCESS: 'SET_CURRENT_LOCATION_SUCCESS',
  SET_CURRENT_LOCATION_FAILURE: 'SET_CURRENT_LOCATION_FAILURE',
  
  SET_SELECTED_ADDRESS: 'SET_SELECTED_ADDRESS',
  CLEAR_ADDRESS_ERROR: 'CLEAR_ADDRESS_ERROR'
};

// Action Creators
export const getAddresses = () => async (dispatch) => {
  dispatch({ type: ADDRESS_ACTIONS.GET_ADDRESSES_REQUEST });
  
  try {
    const response = await addressService.getAddresses();
    dispatch({
      type: ADDRESS_ACTIONS.GET_ADDRESSES_SUCCESS,
      payload: response.addresses || []
    });
  } catch (error) {
    dispatch({
      type: ADDRESS_ACTIONS.GET_ADDRESSES_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch addresses'
    });
  }
};

export const addAddress = (addressData) => async (dispatch) => {
  dispatch({ type: ADDRESS_ACTIONS.ADD_ADDRESS_REQUEST });
  
  try {
const response = await addressService.addAddress(addressData);
dispatch({
      type: ADDRESS_ACTIONS.ADD_ADDRESS_SUCCESS,
      payload: response.address
    });
    
    // Refresh addresses list
    dispatch(getAddresses());
    
    // Return the response so components can access it
    return { success: true, payload: response.address };
  } catch (error) {
dispatch({
      type: ADDRESS_ACTIONS.ADD_ADDRESS_FAILURE,
      payload: error.response?.data?.message || 'Failed to add address'
    });
    throw error; // Re-throw so components can handle it
  }
};

export const editAddress = (addressId, addressData) => async (dispatch) => {
  dispatch({ type: ADDRESS_ACTIONS.EDIT_ADDRESS_REQUEST });
  
  try {
    const response = await addressService.editAddress(addressId, addressData);
    dispatch({
      type: ADDRESS_ACTIONS.EDIT_ADDRESS_SUCCESS,
      payload: response.address
    });
    // Refresh addresses list
    dispatch(getAddresses());
  } catch (error) {
    dispatch({
      type: ADDRESS_ACTIONS.EDIT_ADDRESS_FAILURE,
      payload: error.response?.data?.message || 'Failed to edit address'
    });
  }
};

export const deleteAddress = (addressId) => async (dispatch) => {
  dispatch({ type: ADDRESS_ACTIONS.DELETE_ADDRESS_REQUEST });
  
  try {
    const response = await addressService.deleteAddress(addressId);
    dispatch({
      type: ADDRESS_ACTIONS.DELETE_ADDRESS_SUCCESS,
      payload: addressId
    });
    // Refresh addresses list
    dispatch(getAddresses());
    return { success: true, data: response };
  } catch (error) {
dispatch({
      type: ADDRESS_ACTIONS.DELETE_ADDRESS_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete address'
    });
    throw error; // Re-throw so the component can handle it
  }
};

export const setCurrentLocation = (locationData) => async (dispatch) => {
  dispatch({ type: ADDRESS_ACTIONS.SET_CURRENT_LOCATION_REQUEST });
  
  try {
    const response = await addressService.setCurrentLocation(locationData);
    dispatch({
      type: ADDRESS_ACTIONS.SET_CURRENT_LOCATION_SUCCESS,
      payload: response.address
    });
    // Refresh addresses list
    dispatch(getAddresses());
  } catch (error) {
    dispatch({
      type: ADDRESS_ACTIONS.SET_CURRENT_LOCATION_FAILURE,
      payload: error.response?.data?.message || 'Failed to set current location'
    });
  }
};

export const setSelectedAddress = (address) => ({
  type: ADDRESS_ACTIONS.SET_SELECTED_ADDRESS,
  payload: address
});

export const clearAddressError = () => ({
  type: ADDRESS_ACTIONS.CLEAR_ADDRESS_ERROR
});