import {useStorage} from '../../utils/useStorage';

// Action Types
export const ADD_TO_CART = 'ADD_TO_CART';
export const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const CLEAR_CART = 'CLEAR_CART';
export const CALCULATE_TOTALS = 'CALCULATE_TOTALS';
export const SET_CART_LOADING = 'SET_CART_LOADING';
export const SET_CART_ERROR = 'SET_CART_ERROR';
export const CLEAR_CART_ERROR = 'CLEAR_CART_ERROR';
export const LOAD_CART_FROM_STORAGE = 'LOAD_CART_FROM_STORAGE';
export const APPLY_PROMOCODE = 'APPLY_PROMOCODE';
export const REMOVE_PROMOCODE = 'REMOVE_PROMOCODE';

const initialState = {
  items: [],
  chefId: null,
  chefName: null,
  subtotal: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
  promocode: null, // { code, discountAmount, discountType }
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((total, item) => {
    return total + (item.dish.price * item.quantity);
  }, 0);
  
  const itemCount = items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
  
  return { subtotal, itemCount };
};

export default function cartReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      const {dish, quantity = 1, chefId, chefName} = action.payload;
      
      // If cart is empty or same chef, proceed
      if (!state.chefId || state.chefId === chefId) {
        const existingItem = state.items.find(item => item.dishId === dish._id);
        let newItems;
        
        if (existingItem) {
          newItems = state.items.map(item =>
            item.dishId === dish._id
              ? {...item, quantity: item.quantity + quantity}
              : item
          );
        } else {
          newItems = [
            ...state.items,
            {
              dishId: dish._id,
              dish: dish,
              quantity: quantity,
              addedAt: new Date().toISOString(),
            }
          ];
        }
        
        const totals = calculateTotals(newItems);
        
        return {
          ...state,
          items: newItems,
          chefId: chefId,
          chefName: chefName,
          subtotal: totals.subtotal,
          itemCount: totals.itemCount,
          error: null,
        };
      } else {
        // Different chef - show error
        return {
          ...state,
          error: 'You can only order from one chef at a time. Clear your cart to order from a different chef.',
        };
      }
    }

    case UPDATE_QUANTITY: {
      const {dishId, quantity} = action.payload;
      let newItems;
      
      if (quantity <= 0) {
        newItems = state.items.filter(item => item.dishId !== dishId);
      } else {
        newItems = state.items.map(item =>
          item.dishId === dishId
            ? {...item, quantity: quantity}
            : item
        );
      }
      
      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        chefId: newItems.length === 0 ? null : state.chefId,
        chefName: newItems.length === 0 ? null : state.chefName,
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
      };
    }

    case REMOVE_FROM_CART: {
      const {dishId} = action.payload;
      const newItems = state.items.filter(item => item.dishId !== dishId);
      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        chefId: newItems.length === 0 ? null : state.chefId,
        chefName: newItems.length === 0 ? null : state.chefName,
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
      };
    }

    case CLEAR_CART:
      return {
        ...state,
        items: [],
        chefId: null,
        chefName: null,
        subtotal: 0,
        itemCount: 0,
        error: null,
        promocode: null,
      };

    case APPLY_PROMOCODE:
      return {
        ...state,
        promocode: action.payload,
        error: null,
      };

    case REMOVE_PROMOCODE:
      return {
        ...state,
        promocode: null,
      };

    case SET_CART_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case SET_CART_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case CLEAR_CART_ERROR:
      return {
        ...state,
        error: null,
      };

    case LOAD_CART_FROM_STORAGE: {
      const savedCart = action.payload;
      if (savedCart) {
        const totals = calculateTotals(savedCart.items || []);
        return {
          ...state,
          items: savedCart.items || [],
          chefId: savedCart.chefId || null,
          chefName: savedCart.chefName || null,
          subtotal: totals.subtotal,
          itemCount: totals.itemCount,
        };
      }
      return state;
    }

    default:
      return state;
  }
}

// Action Creators
export const addToCart = (payload) => ({
  type: ADD_TO_CART,
  payload,
});

export const updateQuantity = (payload) => ({
  type: UPDATE_QUANTITY,
  payload,
});

export const removeFromCart = (payload) => ({
  type: REMOVE_FROM_CART,
  payload,
});

export const clearCart = () => ({
  type: CLEAR_CART,
});

export const setLoading = (payload) => ({
  type: SET_CART_LOADING,
  payload,
});

export const setError = (payload) => ({
  type: SET_CART_ERROR,
  payload,
});

export const clearError = () => ({
  type: CLEAR_CART_ERROR,
});

export const loadCartFromStorage = (payload) => ({
  type: LOAD_CART_FROM_STORAGE,
  payload,
});

export const applyPromocode = (payload) => ({
  type: APPLY_PROMOCODE,
  payload,
});

export const removePromocode = () => ({
  type: REMOVE_PROMOCODE,
});

// Async thunks for cart persistence
export const saveCartToStorage = () => async (dispatch, getState) => {
  try {
    const {cart} = getState();
    const cartData = {
      items: cart.items,
      chefId: cart.chefId,
      chefName: cart.chefName,
    };
    useStorage.setItem('cart', JSON.stringify(cartData));
  } catch (error) {
    console.error('Failed to save cart to storage:', error);
  }
};

export const loadCartFromStorageAsync = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const savedCart = useStorage.getItem('cart');
    if (savedCart) {
      dispatch(loadCartFromStorage(JSON.parse(savedCart)));
    }
  } catch (error) {
    console.error('Failed to load cart from storage:', error);
    dispatch(setError('Failed to load saved cart'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const clearCartFromStorage = () => async (dispatch) => {
  try {
    useStorage.removeItem('cart');
    dispatch(clearCart());
  } catch (error) {
    console.error('Failed to clear cart from storage:', error);
  }
};

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartChef = (state) => ({
  id: state.cart.chefId,
  name: state.cart.chefName,
});
export const selectCartError = (state) => state.cart.error;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartPromocode = (state) => state.cart.promocode;