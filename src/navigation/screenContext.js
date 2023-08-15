import React, {createContext, useContext, useState} from 'react';

// Create a context
const ScreenContext = createContext();

// Create a provider component
export function ScreenProvider({children}) {
  const [currentScreen, setCurrentScreen] = useState(null);

  const updateCurrentScreen = screenName => {
    setCurrentScreen(screenName);
  };

  return (
    <ScreenContext.Provider value={{currentScreen, updateCurrentScreen}}>
      {children}
    </ScreenContext.Provider>
  );
}

// Custom hook to use the context
export function useScreen() {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within a ScreenProvider');
  }
  return context;
}
