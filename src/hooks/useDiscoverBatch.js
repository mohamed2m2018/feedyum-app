import { useQuery, useInfiniteQuery, useQueryClient } from 'react-query';
import { useMemo } from 'react';
import request from '../api/request';

// ─── Initial Batch Hook (unchanged) ───────────────────────────────────────────
// Single optimized hook for ALL Discover screen data (page 1 across all categories)
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
      enabled: true,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 2,
      retryDelay: 1000,
      ...options,
    }
  );
};

// ─── Helper: extract specific category from batch (unchanged) ─────────────────
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

// ─── Paginated Hook (NEW) ─────────────────────────────────────────────────────
// Fetches page 2+ for a single category via GET /discover/category/:category
// Uses batch data as page 1, then paginates from the new endpoint.
const ITEMS_PER_PAGE = 10;

export const useDiscoverCategoryPaginated = (categoryName, coordinates, userId) => {
  const queryClient = useQueryClient();

  // Get batch data (page 1) from the existing batch cache
  const {
    users: batchUsers,
    dishes: batchDishes,
    isLoading: isBatchLoading,
    error: batchError,
    hasData: hasBatchData,
  } = useDiscoverCategory(categoryName, coordinates, userId);

  // Build coordinate params for the paginated API
  const lat = coordinates?.latitude || coordinates?.lat;
  const long = coordinates?.longitude || coordinates?.long;

  // Infinite query for page 2+
  const {
    data: paginatedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPaginatedLoading,
    error: paginatedError,
  } = useInfiniteQuery(
    ['discover-category-pages', categoryName, lat, long, userId],
    async ({ pageParam = 2 }) => {
      const params = new URLSearchParams();
      params.append('page', pageParam.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (lat && long) {
        params.append('lat', lat.toString());
        params.append('long', long.toString());
      }
      if (userId && typeof userId === 'string') {
        params.append('userId', userId);
      }

      const url = `/discover/category/${encodeURIComponent(categoryName)}?${params.toString()}`;
      const response = await request.get(url);
      const data = response.data;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to fetch discover page');
      }

      return data;
    },
    {
      // Start from page 2 (batch is page 1)
      getNextPageParam: (lastPage) => {
        if (!lastPage?.pagination?.hasNextPage) return undefined;
        return lastPage.pagination.currentPage + 1;
      },
      enabled: hasBatchData && !batchError, // Only start paginating after batch succeeds
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch pages on re-mount
    }
  );

  // Merge batch (page 1) + paginated (page 2+) into unified lists
  const allUsers = useMemo(() => {
    const paginated = paginatedData?.pages?.flatMap(p => p?.data?.users || []) || [];
    return [...batchUsers, ...paginated];
  }, [batchUsers, paginatedData]);

  const allDishes = useMemo(() => {
    const paginated = paginatedData?.pages?.flatMap(p => p?.data?.dishes || []) || [];
    return [...batchDishes, ...paginated];
  }, [batchDishes, paginatedData]);

  // Determine if there are more pages to load
  // On initial load (no paginated requests yet), assume there's more if batch returned items
  const hasMore = useMemo(() => {
    if (paginatedData?.pages?.length > 0) {
      // We've made at least one paginated request — use the server's answer
      const lastPage = paginatedData.pages[paginatedData.pages.length - 1];
      return lastPage?.pagination?.hasNextPage ?? false;
    }
    // No paginated requests yet — assume more if batch returned a full page
    return batchUsers.length >= ITEMS_PER_PAGE || batchDishes.length >= ITEMS_PER_PAGE;
  }, [paginatedData, batchUsers.length, batchDishes.length]);

  return {
    users: allUsers,
    dishes: allDishes,
    isLoading: isBatchLoading,
    isFetchingNextPage,
    hasNextPage: hasMore,
    fetchNextPage,
    error: batchError || paginatedError,
    hasData: hasBatchData,
  };
};