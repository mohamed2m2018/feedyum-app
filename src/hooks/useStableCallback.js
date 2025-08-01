import {useCallback, useRef} from 'react';

// Hook to create stable callbacks that don't change on every render
export const useStableCallback = (callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
};

// Hook to prevent unnecessary re-renders when dependencies haven't actually changed
export const useDeepMemo = (factory, deps) => {
  const ref = useRef();
  
  if (!ref.current || !areEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }
  
  return ref.current.value;
};

// Deep equality check for dependencies
const areEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
};

export default useStableCallback;