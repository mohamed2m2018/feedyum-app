// Library imports
import {useQuery} from 'react-query';

// Local imports
import request from '../../../../api/request';

// Dashboard analytics hook
export const useDashboardStats = () => {
  return useQuery(
    'dashboardStats',
    async () => {
      // For now, return mock data since the backend endpoints don't exist yet
      // TODO: Replace with real API calls when backend is ready
      return {
        todayRevenue: 245.50,
        pendingOrders: 3,
        totalOrders: 28,
        completedOrders: 25,
        totalDishes: 12,
        todayOrdersCount: 5,
      };
    },
    {
      refetchInterval: false, // Disable auto-refresh - use manual refresh instead
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );
};

// Recent activity hook
export const useRecentActivity = () => {
  return useQuery(
    'recentActivity',
    async () => {
      // Return mock activity data for now
      return [
        {
          id: '1',
          type: 'order',
          message: 'New order from Sarah Wilson',
          time: '5 min ago',
          icon: 'receipt-outline',
          color: '#FF9800',
        },
        {
          id: '2',
          type: 'order',
          message: 'Order #1234 is being prepared',
          time: '15 min ago',
          icon: 'restaurant-outline',
          color: '#2196F3',
        },
        {
          id: '3',
          type: 'order',
          message: 'Order #1233 completed',
          time: '1 hour ago',
          icon: 'checkmark-done-outline',
          color: '#FF4D67',
        },
      ];
    },
    {
      refetchInterval: false, // Polling disabled
      staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    }
  );
};

// Popular dishes hook
export const usePopularDishes = () => {
  return useQuery(
    'popularDishes',
    async () => {
      // First get current user info
      const userResponse = await request.get('/user');
      const userId = userResponse.data?.user?._id;
      
      if (!userId) {
        throw new Error('User not found');
      }

      // Get all orders to calculate dish popularity
      const ordersResponse = await request.get(`/orders/chef/${userId}`);
      const orders = ordersResponse.data?.orders || [];

      // Count dish occurrences
      const dishCounts = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          const dishId = item.dish?._id || item.dish;
          if (dishId) {
            dishCounts[dishId] = (dishCounts[dishId] || 0) + item.quantity;
          }
        });
      });

      // Get dish details
      const menuResponse = await request.get(`/menus/chef/${userId}`);
      const menu = menuResponse.data?.menu;
      const dishes = menu?.dishes || [];

      // Create popular dishes array
      const popularDishes = dishes
        .map(dish => ({
          ...dish,
          orderCount: dishCounts[dish._id] || 0,
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 5);

      return popularDishes;
    },
    {
      refetchInterval: false, // Polling disabled
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );
};

// Helper function to calculate time ago
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};