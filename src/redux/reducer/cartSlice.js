
// Utility function to properly convert ObjectId to string
const objectIdToString = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') return obj;

  // Since we've fixed the backend to return strings, this should be simple now
  if (typeof obj === 'object') {
    // Handle MongoDB ObjectId objects that might still come through
    if (obj.toString && typeof obj.toString === 'function') {
      const stringified = obj.toString();
      if (stringified !== '[object Object]') {
        return stringified;
      }
    }

    // Handle serialized ObjectId formats
    if (obj.$oid) return obj.$oid;
    if (obj._id) return objectIdToString(obj._id);
    if (obj.id && typeof obj.id === 'string') return obj.id;
  }

  return String(obj);
};

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
export const SET_PENDING_CONFLICT_ITEM = 'SET_PENDING_CONFLICT_ITEM';
export const CLEAR_PENDING_CONFLICT_ITEM = 'CLEAR_PENDING_CONFLICT_ITEM';
export const UPDATE_CART_ITEM = 'UPDATE_CART_ITEM';

const initialState = {
  items: [],
  chefId: null,
  chefName: null,
  subtotal: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
  promocode: null, // { code, discountAmount, discountType }
  pendingConflictItem: null, // { dish, quantity, chefId, chefName } - set when user tries to add from different chef
};

// Generate a deterministic key from selected options
const generateCartItemKey = (dishId, selectedOptions) => {
  if (!selectedOptions || selectedOptions.length === 0) return dishId;
  const sorted = [...selectedOptions]
    .sort((a, b) => (a.groupName || '').localeCompare(b.groupName || ''))
    .map(so => `${so.groupName}:${(so.optionNames || []).sort().join(',')}`)
    .join('|');
  // Simple hash for readability (no crypto in RN — use string-based key)
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `${dishId}_${Math.abs(hash).toString(36)}`;
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((total, item) => {
    // Use unitPrice if available (has options), otherwise fall back to dish.price
    const price = item.unitPrice || item.dish.price;
    return total + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  return { subtotal, itemCount };
};

export default function cartReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      const { dish, quantity = 1, chefId, chefName, selectedOptions } = action.payload;

      // Ensure chefId is a string (handle ObjectId objects)
      const normalizedChefId = objectIdToString(chefId);

      // If chefId is not provided, try to extract it from dish data
      let finalChefId = normalizedChefId;
      if (!finalChefId && dish.chef?._id) {
        finalChefId = objectIdToString(dish.chef._id);
      } else if (!finalChefId && dish.user?._id) {
        finalChefId = objectIdToString(dish.user._id);
      } else if (!finalChefId && dish.userId) {
        finalChefId = objectIdToString(dish.userId);
      } else if (!finalChefId && dish.chefId) {
        finalChefId = objectIdToString(dish.chefId);
      }

      // Ensure dishId is a string (handle ObjectId objects)
      const dishId = objectIdToString(dish._id);

      // Calculate unitPrice: base price + option adjustments
      let totalAdjustment = 0;
      if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
        totalAdjustment = selectedOptions.reduce((sum, so) => sum + (so.totalAdjustment || 0), 0);
      }
      const unitPrice = dish.price + totalAdjustment;

      // Generate composite cart item key (same dish + different options = different key)
      const cartItemKey = generateCartItemKey(dishId, selectedOptions);

      // If cart is empty or same chef, proceed
      if (!state.chefId || state.chefId === finalChefId) {

        const existingItem = state.items.find(item => {
          const existingKey = item.cartItemKey || item.dishId;
          return existingKey === cartItemKey;
        });
        let newItems;

        if (existingItem) {
          newItems = state.items.map(item => {
            const existingKey = item.cartItemKey || item.dishId;
            return existingKey === cartItemKey
              ? { ...item, quantity: item.quantity + quantity }
              : item;
          });
        } else {
          newItems = [
            ...state.items,
            {
              dishId: dishId,
              dish: dish,
              quantity: quantity,
              selectedOptions: selectedOptions || [],
              unitPrice,
              cartItemKey,
              addedAt: new Date().toISOString(),
            }
          ];
        }

        const totals = calculateTotals(newItems);

        return {
          ...state,
          items: newItems,
          chefId: finalChefId,
          chefName: chefName || (dish.chef && dish.chef.fullName) || 'Unknown Chef',
          subtotal: totals.subtotal,
          itemCount: totals.itemCount,
          error: null,
        };
      } else {
        // Different chef - store pending item for conflict resolution modal
        return {
          ...state,
          pendingConflictItem: {
            dish,
            quantity,
            chefId: finalChefId,
            chefName: chefName || (dish.chef && dish.chef.fullName) || 'Unknown Chef',
            selectedOptions: selectedOptions || [],
          },
        };
      }
    }

    case UPDATE_QUANTITY: {
      const { dishId, quantity, cartItemKey } = action.payload;
      // Use cartItemKey (preferred) or fall back to dishId
      const itemKey = cartItemKey || objectIdToString(dishId);
      let newItems;

      if (quantity <= 0) {
        newItems = state.items.filter(item => {
          const existingKey = item.cartItemKey || item.dishId;
          return existingKey !== itemKey;
        });
      } else {
        newItems = state.items.map(item => {
          const existingKey = item.cartItemKey || item.dishId;
          return existingKey === itemKey
            ? { ...item, quantity: quantity }
            : item;
        });
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
      const { dishId, cartItemKey } = action.payload;
      // Use cartItemKey (preferred) or fall back to dishId
      const itemKey = cartItemKey || objectIdToString(dishId);
      const newItems = state.items.filter(item => {
        const existingKey = item.cartItemKey || item.dishId;
        return existingKey !== itemKey;
      });
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

    case SET_PENDING_CONFLICT_ITEM:
      return {
        ...state,
        pendingConflictItem: action.payload,
      };

    case CLEAR_PENDING_CONFLICT_ITEM:
      return {
        ...state,
        pendingConflictItem: null,
      };

    case UPDATE_CART_ITEM: {
      const { oldCartItemKey, dish, selectedOptions: updatedOptions, quantity: updatedQty } = action.payload;

      // Calculate new unitPrice
      let totalAdjustment = 0;
      if (Array.isArray(updatedOptions) && updatedOptions.length > 0) {
        totalAdjustment = updatedOptions.reduce((sum, so) => sum + (so.totalAdjustment || 0), 0);
      }
      const newUnitPrice = dish.price + totalAdjustment;
      const newCartItemKey = generateCartItemKey(objectIdToString(dish._id), updatedOptions);

      const newItems = state.items.map(item => {
        const existingKey = item.cartItemKey || item.dishId;
        if (existingKey === oldCartItemKey) {
          return {
            ...item,
            dish,
            selectedOptions: updatedOptions || [],
            unitPrice: newUnitPrice,
            cartItemKey: newCartItemKey,
            quantity: updatedQty || item.quantity,
          };
        }
        return item;
      });

      const totals = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
      };
    }

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

export const setPendingConflictItem = (payload) => ({
  type: SET_PENDING_CONFLICT_ITEM,
  payload,
});

export const clearPendingConflictItem = () => ({
  type: CLEAR_PENDING_CONFLICT_ITEM,
});

export const updateCartItem = (payload) => ({
  type: UPDATE_CART_ITEM,
  payload,
});

// Thunk: Clear cart, add pending item, then clear pending state
export const clearCartAndAddPending = () => (dispatch, getState) => {
  const { cart } = getState();
  const pendingItem = cart.pendingConflictItem;

  if (!pendingItem) return;

  // Clear the current cart
  dispatch(clearCart());

  // Add the pending item (with options if any)
  dispatch(addToCart({
    dish: pendingItem.dish,
    quantity: pendingItem.quantity,
    chefId: pendingItem.chefId,
    chefName: pendingItem.chefName,
    selectedOptions: pendingItem.selectedOptions || [],
  }));

  // Clear pending state
  dispatch(clearPendingConflictItem());
  // Note: Cart is automatically persisted via redux-persist
};

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCartItemCount = (state) => state.cart.itemCount;
// Memoized to prevent unnecessary rerenders (returns stable reference)
let _cachedChef = { id: null, name: null };
export const selectCartChef = (state) => {
  const id = state.cart.chefId;
  const name = state.cart.chefName;
  if (_cachedChef.id === id && _cachedChef.name === name) return _cachedChef;
  _cachedChef = { id, name };
  return _cachedChef;
};
export const selectCartError = (state) => state.cart.error;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartPromocode = (state) => state.cart.promocode;
export const selectPendingConflictItem = (state) => state.cart.pendingConflictItem;