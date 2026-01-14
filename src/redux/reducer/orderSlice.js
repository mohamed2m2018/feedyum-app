import request from '../../api/request';

// Action Types
export const SET_ORDER_LOADING = 'SET_ORDER_LOADING';
export const SET_ORDER_PLACING = 'SET_ORDER_PLACING';
export const SET_ORDER_ERROR = 'SET_ORDER_ERROR';
export const CLEAR_ORDER_ERROR = 'CLEAR_ORDER_ERROR';
export const SET_CURRENT_ORDER = 'SET_CURRENT_ORDER';
export const UPDATE_ORDER_STATUS = 'UPDATE_ORDER_STATUS';
export const SET_ORDER_HISTORY = 'SET_ORDER_HISTORY';
export const ADD_ORDER_TO_HISTORY = 'ADD_ORDER_TO_HISTORY';
export const CLEAR_CURRENT_ORDER = 'CLEAR_CURRENT_ORDER';

const initialState = {
  currentOrder: null,
  orderHistory: [],
  isPlacing: false,
  isLoading: false,
  error: null,
};

export default function orderReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ORDER_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case SET_ORDER_PLACING:
      return {
        ...state,
        isPlacing: action.payload,
      };

    case SET_ORDER_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case CLEAR_ORDER_ERROR:
      return {
        ...state,
        error: null,
      };

    case SET_CURRENT_ORDER:
      return {
        ...state,
        currentOrder: action.payload,
      };

    case UPDATE_ORDER_STATUS: {
      const { orderId, status, deliveryFee, totalAmount } = action.payload;
      let updatedCurrentOrder = state.currentOrder;
      let updatedOrderHistory = state.orderHistory;

      // Update current order if it matches
      if (state.currentOrder && state.currentOrder._id === orderId) {
        updatedCurrentOrder = {
          ...state.currentOrder,
          status,
          ...(deliveryFee !== undefined && { deliveryFee }),
          ...(totalAmount !== undefined && { totalAmount }),
        };
      }

      // Update in order history as well
      const orderIndex = state.orderHistory.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        updatedOrderHistory = state.orderHistory.map((order, index) =>
          index === orderIndex
            ? {
              ...order,
              status,
              ...(deliveryFee !== undefined && { deliveryFee }),
              ...(totalAmount !== undefined && { totalAmount }),
            }
            : order
        );
      }

      return {
        ...state,
        currentOrder: updatedCurrentOrder,
        orderHistory: updatedOrderHistory,
      };
    }

    case SET_ORDER_HISTORY:
      return {
        ...state,
        orderHistory: action.payload,
      };

    case ADD_ORDER_TO_HISTORY:
      return {
        ...state,
        orderHistory: [action.payload, ...state.orderHistory],
      };

    case CLEAR_CURRENT_ORDER:
      return {
        ...state,
        currentOrder: null,
      };

    default:
      return state;
  }
}

// Action Creators
export const setLoading = (payload) => ({
  type: SET_ORDER_LOADING,
  payload,
});

export const setPlacing = (payload) => ({
  type: SET_ORDER_PLACING,
  payload,
});

export const setError = (payload) => ({
  type: SET_ORDER_ERROR,
  payload,
});

export const clearError = () => ({
  type: CLEAR_ORDER_ERROR,
});

export const setCurrentOrder = (payload) => ({
  type: SET_CURRENT_ORDER,
  payload,
});

export const updateOrderStatus = (payload) => ({
  type: UPDATE_ORDER_STATUS,
  payload,
});

export const setOrderHistory = (payload) => ({
  type: SET_ORDER_HISTORY,
  payload,
});

export const addOrderToHistory = (payload) => ({
  type: ADD_ORDER_TO_HISTORY,
  payload,
});

export const clearCurrentOrder = () => ({
  type: CLEAR_CURRENT_ORDER,
});

// Async thunks for order operations
export const placeOrder = (orderData) => async (dispatch) => {
  try {
    dispatch(setPlacing(true));
    dispatch(clearError());

    const response = await request.post('/orders', orderData);
    const newOrder = response.data.order || response.data; // Handle different response formats
    if (newOrder) {
      dispatch(setCurrentOrder(newOrder));
      dispatch(addOrderToHistory(newOrder));
    }

    return newOrder;
  } catch (error) {
    const errorMessage = error?.message || error?.response?.data?.message || 'Failed to place order';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setPlacing(false));
  }
};

export const fetchOrderHistory = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());

    const response = await request.get('/orders/user');
    dispatch(setOrderHistory(response.data));
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch order history';
    dispatch(setError(errorMessage));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchOrderById = (orderId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());

    const response = await request.get(`/orders/${orderId}`);
    dispatch(setCurrentOrder(response.data));

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch order details';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateOrderStatusAsync = (orderId, status, deliveryFee) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(clearError());

    const updateData = { status };
    if (deliveryFee !== undefined) {
      updateData.deliveryFee = deliveryFee;
    }

    const response = await request.put(`/orders/${orderId}/status`, updateData);
    const updatedOrder = response.data;

    dispatch(updateOrderStatus({
      orderId,
      status: updatedOrder.status,
      deliveryFee: updatedOrder.deliveryFee,
      totalAmount: updatedOrder.totalAmount,
    }));

    return updatedOrder;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update order status';
    dispatch(setError(errorMessage));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const cancelOrderByUser = (orderId, reason) => async (dispatch) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    dispatch(setLoading(true));
    dispatch(clearError());

    const response = await request.put(`/orders/${orderId}/cancel`, { reason });
    const cancelledOrder = response.data.order;

    dispatch(updateOrderStatus({
      orderId,
      status: 'cancelled',
    }));

    // Re-fetch the order to get full updated data
    await dispatch(fetchOrderById(orderId));

    return cancelledOrder;
  } catch (error) {
    const errorMessage = error?.message || error || 'Failed to cancel order';
    dispatch(setError(errorMessage));
    throw new Error(errorMessage);
  } finally {
    dispatch(setLoading(false));
  }
};

// Selectors
export const selectCurrentOrder = (state) => state.order.currentOrder;
export const selectOrderHistory = (state) => state.order.orderHistory;
export const selectOrderLoading = (state) => state.order.isLoading;
export const selectOrderPlacing = (state) => state.order.isPlacing;
export const selectOrderError = (state) => state.order.error;