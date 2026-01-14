import { useQuery } from 'react-query';
import request from '../api/request';

// Single optimized hook for ALL Discover screen data
export const useDiscoverBatch = (coordinates, userId, options = {}) => {
  return useQuery(
    ['discover-batch', coordinates?.latitude || coordinates?.lat, coordinates?.longitude || coordinates?.long, userId],
    async () => {
      const params = new URLSearchParams();

      if (coordinates?.latitude && coordinates?.longitude) {
        params.append('lat', coordinates.latitude);
        params.append('long', coordinates.longitude);
      } else if (coordinates?.lat && coordinates?.long) {
        params.append('lat', coordinates.lat);
        params.append('long', coordinates.long);
      }

      if (userId && typeof userId === 'string') {
        params.append('userId', userId);
      }

      const url = `/discover/batch?${params.toString()}`;
      const response = await request.get(url);

      const data = response.data;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to fetch discover data');
      }
      return data.data; // Return just the category data
    },
    {
      enabled: true, // Default to true
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 2,
      retryDelay: 1000,
      ...options, // Override defaults with passed options
    }
  );
};

// Helper hook to extract specific category data
export const useDiscoverCategory = (categoryName, coordinates, userId, options = {}) => {
  const { data, isLoading, error, refetch } = useDiscoverBatch(coordinates, userId, options);
  return {
    users: data?.[categoryName]?.users || [],
    dishes: data?.[categoryName]?.dishes || [],
    isLoading,
    error,
    refetch,
    hasData: !!data?.[categoryName]
  };
};