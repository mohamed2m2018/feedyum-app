/** Web shim for sovran-react-native (used by @segment/analytics-react-native) */
import { useState, useCallback } from 'react';

// Simple in-memory store
const createStore = (initialState) => {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
      listeners.forEach(fn => fn(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const createSovranStore = createStore;

export const useStore = (store, selector) => {
  const [state, setInternalState] = useState(() => selector ? selector(store.getState()) : store.getState());

  const dispatch = useCallback((updater) => {
    store.setState(updater);
    setInternalState(selector ? selector(store.getState()) : store.getState());
  }, [store, selector]);

  return [state, dispatch];
};

export default { createSovranStore, useStore };
