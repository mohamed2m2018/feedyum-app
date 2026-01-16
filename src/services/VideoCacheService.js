/**
 * VideoCacheService
 * 
 * Persistent local video cache for instant replay.
 * Uses react-native-fs to store videos in the app's cache directory.
 * Implements LRU (Least Recently Used) eviction with 500MB limit.
 * 
 * Android-safe: No hardware decoders used, just disk storage.
 */

import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration
const MAX_CACHE_SIZE_MB = 500;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;
const CACHE_METADATA_KEY = '@video_cache_metadata';
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/video_cache`;

// In-memory cache metadata for fast lookups
let cacheMetadata = {};
let isInitialized = false;
let initPromise = null;

/**
 * Generate a unique hash from URL for filename
 */
const getUrlHash = (url) => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
};

/**
 * Get file extension from URL
 */
const getFileExtension = (url) => {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? `.${match[1]}` : '.mp4';
};

/**
 * Initialize the cache system
 */
export const initCache = async () => {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            // Create cache directory if it doesn't exist
            const exists = await RNFS.exists(CACHE_DIR);
            if (!exists) {
                await RNFS.mkdir(CACHE_DIR);
            }

            // Load metadata from AsyncStorage
            const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
            if (stored) {
                cacheMetadata = JSON.parse(stored);

                // Validate cached files still exist
                const urls = Object.keys(cacheMetadata);
                for (const url of urls) {
                    const entry = cacheMetadata[url];
                    const fileExists = await RNFS.exists(entry.path);
                    if (!fileExists) {
                        delete cacheMetadata[url];
                    }
                }
                await saveMetadata();
            }

            isInitialized = true;
            console.log('[VideoCache] Initialized with', Object.keys(cacheMetadata).length, 'cached videos');
        } catch (error) {
            console.error('[VideoCache] Init error:', error);
            cacheMetadata = {};
            isInitialized = true;
        }
    })();

    return initPromise;
};

/**
 * Save metadata to AsyncStorage
 */
const saveMetadata = async () => {
    try {
        await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(cacheMetadata));
    } catch (error) {
        console.error('[VideoCache] Failed to save metadata:', error);
    }
};

/**
 * Get total cache size in bytes
 */
const getCacheSize = () => {
    return Object.values(cacheMetadata).reduce((total, entry) => total + (entry.size || 0), 0);
};

/**
 * Enforce maximum cache size using LRU eviction
 */
const enforceMaxCacheSize = async () => {
    let currentSize = getCacheSize();

    if (currentSize <= MAX_CACHE_SIZE_BYTES) return;

    // Sort by lastAccess (oldest first)
    const entries = Object.entries(cacheMetadata)
        .map(([url, data]) => ({ url, ...data }))
        .sort((a, b) => a.lastAccess - b.lastAccess);

    // Delete oldest until under limit
    for (const entry of entries) {
        if (currentSize <= MAX_CACHE_SIZE_BYTES * 0.8) break; // Keep 20% buffer

        try {
            await RNFS.unlink(entry.path);
            currentSize -= entry.size || 0;
            delete cacheMetadata[entry.url];
            console.log('[VideoCache] Evicted:', entry.url.substring(0, 50));
        } catch (error) {
            // File might already be deleted
            delete cacheMetadata[entry.url];
        }
    }

    await saveMetadata();
};

/**
 * Check if a video is cached and return local path
 * @param {string} url - Remote video URL
 * @returns {string|null} - Local file path or null if not cached
 */
export const getCachedVideoPath = async (url) => {
    if (!url) return null;

    await initCache();

    const entry = cacheMetadata[url];
    if (!entry) return null;

    // Verify file exists
    const exists = await RNFS.exists(entry.path);
    if (!exists) {
        delete cacheMetadata[url];
        await saveMetadata();
        return null;
    }

    // Update last access time
    cacheMetadata[url].lastAccess = Date.now();
    // Don't await save for performance
    saveMetadata();

    console.log('[VideoCache] ✓ Using cached:', url.substring(0, 50));
    return Platform.OS === 'android' ? `file://${entry.path}` : entry.path;
};

/**
 * Check if video is cached (synchronous after init)
 */
export const isVideoCached = (url) => {
    if (!url || !isInitialized) return false;
    return !!cacheMetadata[url];
};

/**
 * Download and cache a video
 * @param {string} url - Remote video URL
 * @returns {Promise<string|null>} - Local file path or null if failed
 */
export const downloadAndCacheVideo = async (url) => {
    if (!url) return null;

    await initCache();

    // Already cached?
    if (cacheMetadata[url]) {
        return getCachedVideoPath(url);
    }

    const hash = getUrlHash(url);
    const ext = getFileExtension(url);
    const filename = `${hash}${ext}`;
    const localPath = `${CACHE_DIR}/${filename}`;

    try {
        console.log('[VideoCache] Downloading:', url.substring(0, 50));

        // Download the file
        const result = await RNFS.downloadFile({
            fromUrl: url,
            toFile: localPath,
            background: true,
            discretionary: true,
            cacheable: false,
        }).promise;

        if (result.statusCode === 200) {
            // Get file size
            const stat = await RNFS.stat(localPath);

            // Add to metadata
            cacheMetadata[url] = {
                path: localPath,
                size: stat.size,
                lastAccess: Date.now(),
                downloadedAt: Date.now(),
            };

            await saveMetadata();

            // Enforce cache size limit
            await enforceMaxCacheSize();

            console.log('[VideoCache] ✓ Cached:', url.substring(0, 50), `(${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
            return Platform.OS === 'android' ? `file://${localPath}` : localPath;
        }
    } catch (error) {
        console.log('[VideoCache] ✗ Download failed:', url.substring(0, 50));
        // Clean up partial download
        try {
            await RNFS.unlink(localPath);
        } catch { }
    }

    return null;
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
    await initCache();
    const sizeBytes = getCacheSize();
    return {
        videoCount: Object.keys(cacheMetadata).length,
        sizeBytes,
        sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
        maxSizeMB: MAX_CACHE_SIZE_MB,
        usagePercent: ((sizeBytes / MAX_CACHE_SIZE_BYTES) * 100).toFixed(1),
    };
};

/**
 * Clear entire cache
 */
export const clearCache = async () => {
    try {
        await RNFS.unlink(CACHE_DIR);
        await RNFS.mkdir(CACHE_DIR);
        cacheMetadata = {};
        await saveMetadata();
        console.log('[VideoCache] Cache cleared');
    } catch (error) {
        console.error('[VideoCache] Clear error:', error);
    }
};

export default {
    initCache,
    getCachedVideoPath,
    isVideoCached,
    downloadAndCacheVideo,
    getCacheStats,
    clearCache,
};
