import { ADDRESS_ACTIONS } from '../actions/addressActions';

const initialState = {
  addresses: [],
  selectedAddress: null,
  loading: false,
  error: null,
  addingAddress: false,
  editingAddress: false,
  deletingAddress: false,
  settingCurrentLocation: false
};

const addressReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADDRESS_ACTIONS.GET_ADDRESSES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case ADDRESS_ACTIONS.GET_ADDRESSES_SUCCESS:
      return {
        ...state,
        loading: false,
        addresses: action.payload,
        error: null
      };
    
    case ADDRESS_ACTIONS.GET_ADDRESSES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case ADDRESS_ACTIONS.ADD_ADDRESS_REQUEST:
      return {
        ...state,
        addingAddress: true,
        error: null
      };
    
    case ADDRESS_ACTIONS.ADD_ADDRESS_SUCCESS:
      return {
        ...state,
        addingAddress: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.ADD_ADDRESS_FAILURE:
      return {
        ...state,
        addingAddress: false,
        error: action.payload
      };
    
    case ADDRESS_ACTIONS.EDIT_ADDRESS_REQUEST:
      return {
        ...state,
        editingAddress: true,
        error: null
      };
    
    case ADDRESS_ACTIONS.EDIT_ADDRESS_SUCCESS:
      return {
        ...state,
        editingAddress: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.EDIT_ADDRESS_FAILURE:
      return {
        ...state,
        editingAddress: false,
        error: action.payload
      };
    
    case ADDRESS_ACTIONS.DELETE_ADDRESS_REQUEST:
      return {
        ...state,
        deletingAddress: true,
        error: null
      };
    
    case ADDRESS_ACTIONS.DELETE_ADDRESS_SUCCESS:
      return {
        ...state,
        deletingAddress: false,
        addresses: state.addresses.filter(addr => addr._id !== action.payload),
        error: null
      };
    
    case ADDRESS_ACTIONS.DELETE_ADDRESS_FAILURE:
      return {
        ...state,
        deletingAddress: false,
        error: action.payload
      };
    
    case ADDRESS_ACTIONS.SET_CURRENT_LOCATION_REQUEST:
      return {
        ...state,
        settingCurrentLocation: true,
        error: null
      };
    
    case ADDRESS_ACTIONS.SET_CURRENT_LOCATION_SUCCESS:
      return {
        ...state,
        settingCurrentLocation: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.SET_CURRENT_LOCATION_FAILURE:
      return {
        ...state,
        settingCurrentLocation: false,
        error: action.payload
      };
    
    case ADDRESS_ACTIONS.SET_SELECTED_ADDRESS:
      return {
        ...state,
        selectedAddress: action.payload
      };
    
    case ADDRESS_ACTIONS.CLEAR_ADDRESS_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

export default addressReducer;