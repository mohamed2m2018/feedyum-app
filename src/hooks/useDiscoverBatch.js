import { useQuery, useInfiniteQuery } from 'react-query';
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
// Fetches a single category via GET /discover/category/:category and merges it
// with the batch response. The batch endpoint returns 8 users per category,
// while this endpoint uses pages of 10, so it cannot safely stand in for page 1.
const ITEMS_PER_PAGE = 10;

const mergeUniqueById = (initialItems, paginatedItems) => {
  const itemsById = new Map();

  [...initialItems, ...paginatedItems].forEach(item => {
    if (item?._id != null) {
      itemsById.set(item._id.toString(), item);
    }
  });

  return Array.from(itemsById.values());
};

export const useDiscoverCategoryPaginated = (categoryName, coordinates, userId) => {
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

  // Fetch page 1 as well. Starting at page 2 would skip items 9 and 10,
  // because the batch endpoint only includes the first 8 users.
  const {
    data: paginatedData,
    fetchNextPage,
    isFetchingNextPage,
    error: paginatedError,
  } = useInfiniteQuery(
    ['discover-category-pages-v2', categoryName, lat, long, userId],
    async ({ pageParam = 1 }) => {
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
      getNextPageParam: (lastPage) => {
        const pagination = lastPage?.pagination;
        const hasMoreRestaurants = categoryName === 'All'
          ? pagination?.chefsHasMore
          : pagination?.hasNextPage;

        if (!hasMoreRestaurants) return undefined;
        return lastPage.pagination.currentPage + 1;
      },
      enabled: hasBatchData && !batchError, // Only start paginating after batch succeeds
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch pages on re-mount
    }
  );

  // Merge the fast batch response with the complete paginated response.
  const allUsers = useMemo(() => {
    const paginated = paginatedData?.pages?.flatMap(p => p?.data?.users || []) || [];
    return mergeUniqueById(batchUsers, paginated);
  }, [batchUsers, paginatedData]);

  const allDishes = useMemo(() => {
    const paginated = paginatedData?.pages?.flatMap(p => p?.data?.dishes || []) || [];
    return mergeUniqueById(batchDishes, paginated);
  }, [batchDishes, paginatedData]);

  // Determine if there are more pages to load
  // On initial load (no paginated requests yet), assume there's more if batch returned items
  const hasMore = useMemo(() => {
    if (paginatedData?.pages?.length > 0) {
      // We've made at least one paginated request — use the server's answer
      const lastPage = paginatedData.pages[paginatedData.pages.length - 1];
      return categoryName === 'All'
        ? lastPage?.pagination?.chefsHasMore ?? false
        : lastPage?.pagination?.hasNextPage ?? false;
    }
    // No paginated requests yet — assume more if batch returned a full page
    return batchUsers.length >= ITEMS_PER_PAGE || batchDishes.length >= ITEMS_PER_PAGE;
  }, [categoryName, paginatedData, batchUsers.length, batchDishes.length]);

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
