import React, {createContext, useContext} from 'react';
import {useQuery} from 'react-query';
import request from '../api/request';

const UserContext = createContext();

export const UserProvider = ({children}) => {
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    'user',
    () => request.get('/user'),
    {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const user = userData?.data?.user;

  const value = {
    user,
    userData,
    isLoading,
    error,
    refetch,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;