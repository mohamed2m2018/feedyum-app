/**
 * VideoPrefetchService
 * 
 * Prefetches videos to persistent disk cache for instant replay.
 * Now downloads full videos to device storage for faster loading on repeat views.
 * 
 * Android-safe: No hardware video decoders used, just disk storage.
 */

import { Platform } from 'react-native';
import { downloadAndCacheVideo, isVideoCached, getCachedVideoPath } from './VideoCacheService';

// Track which URLs we've already prefetched to avoid duplicate requests
const prefetchedUrls = new Set();
// Track in-progress fetches
const inProgressFetches = new Map();
// Maximum concurrent prefetches
const MAX_CONCURRENT_PREFETCHES = 2;
// Current active prefetch count
let activePrefetchCount = 0;
// Prefetch queue
const prefetchQueue = [];

/**
 * Check if a URI is a video URL (not an image)
 */
const isVideoUri = (uri) => {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') return false;

    const lowerUri = uri.toLowerCase();

    // Check for image hosting patterns that should NEVER be treated as video
    const imageHostPatterns = [
        'loremflickr.com',
        'unsplash.com',
        'images.unsplash',
        'placeholder.com',
        'picsum.photos',
    ];
    if (imageHostPatterns.some(pattern => lowerUri.includes(pattern))) return false;

    // Check for image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    if (imageExtensions.some(ext => lowerUri.includes(ext))) return false;

    return true;
};

/**
 * Process the prefetch queue
 */
const processQueue = () => {
    while (activePrefetchCount < MAX_CONCURRENT_PREFETCHES && prefetchQueue.length > 0) {
        const url = prefetchQueue.shift();
        if (url && !prefetchedUrls.has(url)) {
            executePrefetch(url);
        }
    }
};

/**
 * Execute a single prefetch - downloads to disk cache
 */
const executePrefetch = async (url) => {
    if (prefetchedUrls.has(url) || inProgressFetches.has(url)) {
        return;
    }

    // Check if already cached on disk
    if (isVideoCached(url)) {
        prefetchedUrls.add(url);
        return;
    }

    activePrefetchCount++;
    inProgressFetches.set(url, true);

    try {
        // Download to persistent disk cache
        const cachedPath = await downloadAndCacheVideo(url);

        if (cachedPath) {
            prefetchedUrls.add(url);
        }
    } catch (error) {
        console.log(`[VideoPrefetch] ✗ Cache failed: ${url.substring(0, 50)}...`);
    } finally {
        activePrefetchCount--;
        inProgressFetches.delete(url);
        // Process next in queue
        processQueue();
    }
};

/**
 * Prefetch a single video URL
 * @param {string} url - Video URL to prefetch
 */
export const prefetchVideo = (url) => {
    if (!url || !isVideoUri(url) || prefetchedUrls.has(url)) {
        return;
    }

    // Add to queue
    if (!prefetchQueue.includes(url)) {
        prefetchQueue.push(url);
        processQueue();
    }
};

/**
 * Prefetch multiple video URLs
 * @param {string[]} urls - Array of video URLs to prefetch
 */
export const prefetchVideos = (urls) => {
    if (!Array.isArray(urls)) return;

    urls.forEach(url => {
        if (url && isVideoUri(url) && !prefetchedUrls.has(url) && !prefetchQueue.includes(url)) {
            prefetchQueue.push(url);
        }
    });

    processQueue();
};

/**
 * Prefetch videos around the current index
 * This is the main function to call when active video changes
 * 
 * @param {Array} reels - Array of reel items
 * @param {number} currentIndex - Current active video index
 * @param {number} prefetchAhead - How many videos ahead to prefetch (default: 3)
 */
export const prefetchVideosAroundIndex = (reels, currentIndex, prefetchAhead = 3) => {
    if (!Array.isArray(reels) || reels.length === 0) return;

    const urlsToPrefetch = [];

    // Prefetch videos ahead (priority)
    for (let i = 1; i <= prefetchAhead; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < reels.length) {
            const item = reels[nextIndex];
            if (item?.uri && isVideoUri(item.uri)) {
                urlsToPrefetch.push(item.uri);
            }
        }
    }

    // Prefetch 1 video behind (in case user scrolls back)
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
        const item = reels[prevIndex];
        if (item?.uri && isVideoUri(item.uri) && !prefetchedUrls.has(item.uri)) {
            urlsToPrefetch.push(item.uri);
        }
    }

    prefetchVideos(urlsToPrefetch);
};

/**
 * Clear the prefetch cache (call when leaving the screen)
 */
export const clearPrefetchCache = () => {
    prefetchedUrls.clear();
    prefetchQueue.length = 0;
};

/**
 * Check if a URL has been prefetched
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isUrlPrefetched = (url) => {
    return prefetchedUrls.has(url);
};

export default {
    prefetchVideo,
    prefetchVideos,
    prefetchVideosAroundIndex,
    clearPrefetchCache,
    isUrlPrefetched,
};
