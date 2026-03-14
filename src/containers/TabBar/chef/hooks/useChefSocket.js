// Library imports
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';

// Local imports
import request from '../../../../api/request';
import OrderAlarmService from '../../../../services/OrderAlarmService';
import BackgroundAlarmService from '../../../../services/BackgroundAlarmService';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook to manage real-time socket updates for the chef dashboard
 * Automatically refetches data when orders or dishes change
 * ONLY activates for chef-type users
 * @param {string} userId - The chef's user ID
 */
export const useChefSocket = (userId) => {
  const socketRef = useRef(null);
  const queryClient = useQueryClient();

  // Get user type from Redux to guard against non-chef users
  const userType = useSelector(state => state.user?.user?.type);

  const handleDashboardUpdate = useCallback((data) => {
    console.log('[ChefSocket] Received dashboard update:', data);

    switch (data.type) {
      case 'newOrder':
        // Invalidate order-related queries
        queryClient.invalidateQueries('dashboardStats');
        queryClient.invalidateQueries('recentActivity');
        queryClient.invalidateQueries(['chefOrders', userId]);
        console.log('[ChefSocket] Invalidated queries for new order');

        // Start persistent alarm (looping sound + vibration)
        OrderAlarmService.startAlarm();

        // Show persistent notification via notifee (works even if app goes to background)
        BackgroundAlarmService.showAlarmNotification(data.type, { orderId: data?.orderId });
        break;

      case 'orderStatusUpdate':
        // Invalidate order-related queries
        queryClient.invalidateQueries('dashboardStats');
        queryClient.invalidateQueries('recentActivity');
        queryClient.invalidateQueries(['chefOrders', userId]);
        console.log('[ChefSocket] Invalidated queries for order status update');
        break;

      case 'dishCreated':
      case 'dishUpdated':
      case 'dishDeleted':
        // Invalidate dish-related queries
        queryClient.invalidateQueries('dashboardStats');
        queryClient.invalidateQueries(['menuDishes', userId]);
        queryClient.invalidateQueries(['menuSections', userId]);
        queryClient.invalidateQueries('popularDishes');
        console.log('[ChefSocket] Invalidated queries for dish change');
        break;

      default:
        console.log('[ChefSocket] Unknown update type:', data.type);
    }
  }, [queryClient, userId]);

  useEffect(() => {
    // Guard: only connect for chef users with a valid userId
    if (!userId) {
      console.log('[ChefSocket] No userId provided, skipping socket connection');
      return;
    }

    if (userType && userType !== 'chef') {
      console.log('[ChefSocket] User is not a chef, skipping socket connection');
      return;
    }

    // Derive socket URL from the API request base URL
    const apiBaseUrl = request.defaults.baseURL || 'http://localhost:4800/api';
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    console.log('[ChefSocket] Connecting to socket at:', socketUrl);

    // Create socket connection
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current.on('connect', () => {
      console.log('[ChefSocket] Connected');
      // Join the chef's room to receive updates
      socketRef.current.emit('join', {
        userId: userId,
        chatUserId: userId, // Join own room
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('[ChefSocket] Disconnected');
    });

    socketRef.current.on('error', (error) => {
      console.error('[ChefSocket] Error:', error);
    });

    // Listen for chef dashboard updates
    socketRef.current.on('chefDashboardUpdate', handleDashboardUpdate);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('[ChefSocket] Cleaning up socket connection');
        socketRef.current.off('chefDashboardUpdate', handleDashboardUpdate);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Stop alarm if playing when hook unmounts
      OrderAlarmService.stopAlarm();
      BackgroundAlarmService.stopForegroundAlarm();
    };
  }, [userId, userType, handleDashboardUpdate]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    stopAlarm: () => {
      OrderAlarmService.stopAlarm();
      BackgroundAlarmService.stopForegroundAlarm();
    },
  };
};

export default useChefSocket;
