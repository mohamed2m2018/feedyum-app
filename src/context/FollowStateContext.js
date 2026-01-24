import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Global Follow State Context
 * 
 * This context provides a global store for follow relationships that persists
 * across all components. When a user follows/unfollows someone, all FollowButton
 * instances for that user will immediately reflect the change.
 * 
 * Usage:
 * - Wrap your app with <FollowStateProvider>
 * - In FollowButton: use useFollowState() to get/set follow status
 */

const FollowStateContext = createContext(null);

export function FollowStateProvider({ children }) {
    // Map of userId -> isFollowed (true/false)
    // Only stores overrides - if not in map, use the prop value
    const [followOverrides, setFollowOverrides] = useState({});

    // Get follow status for a user (returns undefined if no override)
    const getFollowStatus = useCallback((userId) => {
        return followOverrides[userId];
    }, [followOverrides]);

    // Set follow status for a user
    const setFollowStatus = useCallback((userId, isFollowed) => {
        console.log('[FollowStateContext] Setting', userId, 'to', isFollowed);
        setFollowOverrides(prev => ({
            ...prev,
            [userId]: isFollowed
        }));
    }, []);

    // Clear a specific override (useful when data is refetched)
    const clearFollowOverride = useCallback((userId) => {
        setFollowOverrides(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    }, []);

    // Clear all overrides
    const clearAllOverrides = useCallback(() => {
        setFollowOverrides({});
    }, []);

    const value = {
        getFollowStatus,
        setFollowStatus,
        clearFollowOverride,
        clearAllOverrides,
    };

    return (
        <FollowStateContext.Provider value={value}>
            {children}
        </FollowStateContext.Provider>
    );
}

export function useFollowState() {
    const context = useContext(FollowStateContext);
    if (!context) {
        throw new Error('useFollowState must be used within a FollowStateProvider');
    }
    return context;
}
