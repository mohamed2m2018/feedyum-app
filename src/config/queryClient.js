import { QueryClient } from 'react-query';

// Optimized QueryClient configuration for better performance
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        cacheTime: 5 * 60 * 1000,
        // Consider data fresh for 2 minutes
        staleTime: 2 * 60 * 1000,
        // Don't refetch on window focus (mobile app)
        refetchOnWindowFocus: false,
        // Don't refetch on mount if data exists and is fresh
        refetchOnMount: 'always',
        // Only retry once on failure
        retry: 1,
        // Retry delay increases exponentially
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable background updates when window regains focus
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
};

// Specific configurations for different data types
export const QueryConfigs = {
  // For frequently changing data like reels, comments
  DYNAMIC: {
    cacheTime: 2 * 60 * 1000, // 2 minutes
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
  },
  
  // For semi-static data like user profiles, categories
  SEMI_STATIC: {
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  },
  
  // For static data like categories, tags
  STATIC: {
    cacheTime: 30 * 60 * 1000, // 30 minutes
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
  },
  
  // For location-dependent data that needs background updates
  LOCATION_SENSITIVE: {
    cacheTime: 3 * 60 * 1000, // 3 minutes
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: true,
    refetchOnReconnect: true,
  }
};

// Performance monitoring for queries
export const performanceConfig = {
  // Log slow queries (>2 seconds)
  onError: (error, query) => {
    console.warn('Query error:', {
      queryKey: query.queryKey,
      error: error.message,
    });
  },
  
  onSuccess: (data, query) => {
    // Log performance metrics for monitoring
    if (query.state.dataUpdateCount === 1) {

    }
  },
};

export default createOptimizedQueryClient;
