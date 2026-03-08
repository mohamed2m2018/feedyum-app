// Library imports
import { useQuery } from 'react-query';

// Local imports
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';

// Dashboard analytics hook
export const useDashboardStats = () => {
  return useQuery(
    'dashboardStats',
    async () => {
      try {
        console.log('Fetching chef stats...');
        const response = await request.get('/orders/chef/stats');
        console.log('Chef Stats Response:', response.data);
        return response.data?.stats;
      } catch (err) {
        console.error('Error fetching chef stats:', err);
        throw err;
      }
    },
    {
      refetchInterval: false, // Disable auto-refresh - use manual refresh instead
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );
};

// Helper function to get translated time ago
const getTranslatedTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return strings.justNow;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return strings.minAgo.replace('{0}', minutes);
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return hours === 1
      ? strings.hourAgo.replace('{0}', hours)
      : strings.hoursAgo.replace('{0}', hours);
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1
      ? strings.dayAgo.replace('{0}', days)
      : strings.daysAgo.replace('{0}', days);
  }
};

// Recent activity hook - fetches real recent orders from backend
export const useRecentActivity = () => {
  return useQuery(
    'recentActivity',
    async () => {
      try {
        const response = await request.get('/orders/chef/analytics?period=7days');
        const recentOrders = response.data?.analytics?.recentOrders || [];

        // Transform orders into activity format
        return recentOrders.map(order => {
          // Determine icon and color based on status
          let icon, color, message;
          const orderNum = order.id.slice(-4);

          switch (order.status) {
            case 'pending':
              icon = 'receipt-outline';
              color = '#FF9800';
              message = strings.activityNewOrderFrom.replace('{0}', order.customer);
              break;
            case 'accepted':
              icon = 'checkmark-circle-outline';
              color = '#4CAF50';
              message = strings.activityOrderAccepted.replace('{0}', orderNum);
              break;
            case 'preparing':
              icon = 'restaurant-outline';
              color = '#2196F3';
              message = strings.activityOrderPreparing.replace('{0}', orderNum);
              break;
            case 'ready_for_pickup':
              icon = 'bag-check-outline';
              color = '#9C27B0';
              message = strings.activityOrderReady.replace('{0}', orderNum);
              break;
            case 'completed':
              icon = 'checkmark-done-outline';
              color = '#4CAF50';
              message = strings.activityOrderCompleted.replace('{0}', orderNum);
              break;
            case 'cancelled':
              icon = 'close-circle-outline';
              color = '#F44336';
              message = strings.activityOrderCancelled.replace('{0}', orderNum);
              break;
            case 'expired':
              icon = 'timer-outline';
              color = '#F44336';
              message = (strings.activityOrderExpired || strings.activityOrderCancelled).replace('{0}', orderNum);
              break;
            default:
              icon = 'receipt-outline';
              color = '#757575';
              message = strings.activityOrderFrom.replace('{0}', order.customer);
          }

          return {
            id: order.id,
            type: 'order',
            message,
            time: getTranslatedTimeAgo(order.date),
            icon,
            color,
            total: order.total,
            status: order.status,
            itemCount: order.itemCount
          };
        });
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        return [];
      }
    },
    {
      refetchInterval: false,
      staleTime: 5 * 60 * 1000,
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