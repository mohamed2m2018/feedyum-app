import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import io from 'socket.io-client';
import request from '../api/request';

/**
 * Hook to get real-time notification badge counts.
 * - Uses socket for real-time updates within screens
 * - Refetches on screen focus for reliability
 * - Falls back to HTTP if socket fails
 */
export const useNotificationCounts = () => {
    const [counts, setCounts] = useState({
        unseenOrdersCount: 0,
        unreadChatsCount: 0,
    });
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const isFocused = useIsFocused();
    const queryClient = useQueryClient();

    // Get current user for socket room joining
    const { data: userData } = useQuery('user', () => request.get('/user'), {
        staleTime: 60000,
    });
    const currentUserId = userData?.data?.user?._id;

    // Fetch counts via HTTP
    const fetchCounts = useCallback(async () => {
        try {
            console.log('[useNotificationCounts] Fetching counts via HTTP...');
            const [ordersRes, chatsRes] = await Promise.all([
                request.get('/orders/unseen/count'),
                request.get('/chat/unread-counts'),
            ]);

            const newCounts = {
                unseenOrdersCount: ordersRes.data?.unseenCount || 0,
                unreadChatsCount: chatsRes.data?.data?.orderUnreadCount || 0,
            };
            console.log('[useNotificationCounts] HTTP counts:', newCounts);
            setCounts(newCounts);
        } catch (error) {
            console.warn('[useNotificationCounts] Failed to fetch counts:', error.message);
        }
    }, []);

    // Refetch when screen becomes focused (handles navigation back)
    useEffect(() => {
        if (isFocused) {
            console.log('[useNotificationCounts] Screen focused, refetching counts...');
            fetchCounts();
        }
    }, [isFocused, fetchCounts]);

    // Socket connection for real-time updates
    useEffect(() => {
        if (!currentUserId) return;

        // Derive socket URL from API base
        const apiBaseUrl = request.defaults.baseURL || 'http://localhost:4800/api';
        const socketUrl = apiBaseUrl.replace(/\/api\/?$/, '');

        console.log('[useNotificationCounts] Connecting socket to:', socketUrl);

        // Create socket connection
        socketRef.current = io(socketUrl, {
            transports: ['websocket'],
            forceNew: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current.on('connect', () => {
            console.log('[useNotificationCounts] Socket connected, joining room:', currentUserId);
            setIsConnected(true);

            // Join user's room to receive badge updates
            socketRef.current.emit('join', {
                userId: currentUserId,
                chatUserId: null,
                orderId: null,
            });
        });

        socketRef.current.on('disconnect', () => {
            console.log('[useNotificationCounts] Socket disconnected');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.warn('[useNotificationCounts] Socket connection error:', error.message);
        });

        // Listen for real-time badge count updates
        socketRef.current.on('badgeCountsUpdate', (data) => {
            console.log('[useNotificationCounts] Socket badge update received:', data);
            setCounts({
                unseenOrdersCount: data.unseenOrdersCount || 0,
                unreadChatsCount: data.orderUnreadCount || 0,
            });
        });

        // App state handling
        const subscription = AppState.addEventListener('change', nextAppState => {
            const wasBackground = appStateRef.current.match(/inactive|background/);
            const isActive = nextAppState === 'active';

            if (wasBackground && isActive) {
                console.log('[useNotificationCounts] App returned to foreground, refetching...');
                fetchCounts();
                if (socketRef.current && !socketRef.current.connected) {
                    socketRef.current.connect();
                }
            }

            appStateRef.current = nextAppState;
        });

        return () => {
            subscription?.remove();
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [currentUserId, fetchCounts]);

    return {
        unseenOrdersCount: counts.unseenOrdersCount,
        unreadChatsCount: counts.unreadChatsCount,
        isConnected,
        refetch: fetchCounts,
    };
};

export default useNotificationCounts;
