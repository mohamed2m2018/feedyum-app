import { useInfiniteQuery, useQuery } from 'react-query';
import request from '../api/request';
import { useLocation } from '../navigation/locationContext';
import { useStorage } from '../utils/useStorage';

// Quick query configs for this file
const QueryConfigs = {
  DYNAMIC: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },
  LOCATION_SENSITIVE: {
    staleTime: 1 * 60 * 1000, // 1 minute for location-sensitive data
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  },
  STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minutes for static data
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  }
};

// Optimized hook for stories/reels with smaller initial page size
export const useOptimizedReels = (categoryIds = []) => {
  const location = useLocation();
  const [user] = useStorage('user');

  return useInfiniteQuery(
    ['stories', user?._id, categoryIds?.join(',') || 'all', location?.stableLatitude, location?.stableLongitude],
    async ({ pageParam = 1 }) => {
      // Smaller initial page size for faster loading
      const limit = pageParam === 1 ? 8 : 15;
      const categoryIdsParam = categoryIds?.length > 0 ? categoryIds.join(',') : undefined;

      console.log('[useOptimizedReels] Fetching stories with categoryIds:', categoryIdsParam, 'page:', pageParam);

      const response = await request.get('/story/stories', {
        params: {
          limit,
          page: pageParam,
          userId: user?._id,
          lat: location?.latitude,
          long: location?.longitude,
          categoryIds: categoryIdsParam
        }
      });

      console.log('[useOptimizedReels] Got', response.data?.stories?.length, 'stories');
      return response.data;
    },
    {
      ...QueryConfigs.DYNAMIC,
      getNextPageParam: (lastPage) => {
        return lastPage?.currentPage < lastPage?.totalPages
          ? lastPage.currentPage + 1
          : undefined;
      },
      enabled: !!user?._id,
      getPreviousPageParam: (firstPage) => firstPage?.currentPage > 1 ? firstPage.currentPage - 1 : undefined,
    }
  );
};

// Optimized hook for discover content with coordinated loading
export const useOptimizedDiscoverData = (selectedTag) => {
  const location = useLocation();
  const [user] = useStorage('user');

  // First, load users with stories/reels for the tag
  const usersQuery = useInfiniteQuery(
    ['discover-users', selectedTag, location?.stableLatitude, location?.stableLongitude],
    async ({ pageParam = 1 }) => {
      // Try to get stories/reels by tag which includes user data
      const response = await request.get(`/story/stories`, {
        params: {
          hashtag: selectedTag,
          page: pageParam,
          limit: 10,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      ...QueryConfigs.LOCATION_SENSITIVE,
      getNextPageParam: (lastPage) =>
        lastPage?.currentPage < lastPage?.totalPages
          ? lastPage.currentPage + 1
          : undefined,
      enabled: !!selectedTag,
    }
  );

  // Then load dishes, but only after users query has some data
  const dishesQuery = useQuery(
    ['discover-dishes', selectedTag, location?.stableLatitude, location?.stableLongitude],
    async () => {
      const response = await request.get(`/dishes/category/${selectedTag}`, {
        params: {
          page: 1,
          limit: 20,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      ...QueryConfigs.LOCATION_SENSITIVE,
      enabled: !!selectedTag && !usersQuery.isInitialLoading,
      // Wait for users to load first to avoid overwhelming the API
    }
  );

  return {
    users: {
      ...usersQuery,
      data: usersQuery.data?.users ? usersQuery.data : { pages: [{ users: [] }] } // Handle empty users
    },
    dishes: {
      ...dishesQuery,
      data: dishesQuery.data || [] // Dishes come as direct array
    },
    isInitialLoading: dishesQuery.isInitialLoading, // Focus on dishes since that's where the data is
  };
};

// Optimized hook for following content
export const useOptimizedFollowingReels = () => {
  const location = useLocation();
  const [user] = useStorage('user');

  return useInfiniteQuery(
    ['stories-following', user?._id, location?.stableLatitude, location?.stableLongitude],
    async ({ pageParam = 1 }) => {
      const limit = pageParam === 1 ? 6 : 12; // Even smaller initial load for following
      const response = await request.get('/story/following', {
        params: {
          limit,
          page: pageParam,
          userId: user?._id,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      ...QueryConfigs.DYNAMIC,
      getNextPageParam: (lastPage) => {
        return lastPage?.currentPage < lastPage?.totalPages
          ? lastPage.currentPage + 1
          : undefined;
      },
      enabled: !!user?._id,
    }
  );
};

// Optimized single story fetch
export const useOptimizedStory = (storyId) => {
  const location = useLocation();
  const [user] = useStorage('user');

  return useQuery(
    ['story', storyId],
    async () => {
      const response = await request.get(`/story/${storyId}`, {
        params: {
          userId: user?._id,
          lat: location?.latitude,
          long: location?.longitude,
        }
      });
      return response.data;
    },
    {
      ...QueryConfigs.DYNAMIC,
      enabled: !!storyId && !!user?._id,
    }
  );
};

// Hook for categories (static data)
export const useCategories = () => {
  return useQuery(
    ['categories'],
    async () => {
      const response = await request.get('/categories');
      return response.data;
    },
    QueryConfigs.STATIC
  );
};