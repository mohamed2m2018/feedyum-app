/**
 * Media Utilities
 * Centralized utilities for media type detection and deep link generation
 */

import DeepLinkingService from '../services/DeepLinkingService';

/**
 * Image hosting patterns that should NEVER be treated as video
 */
const IMAGE_HOST_PATTERNS = [
    'loremflickr.com',
    'unsplash.com',
    'images.unsplash',
    'placeholder.com',
    'picsum.photos',
];

/**
 * Image file extensions
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

/**
 * Check if a URI is a video URL
 * S3 uploads from our app are videos, so we trust them unless they're obviously images
 * 
 * @param {string} uri - The URI to check
 * @returns {boolean} - True if the URI is a video, false otherwise
 */
export const isVideoUri = (uri) => {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
        return false;
    }

    const lowerUri = uri.toLowerCase();

    // Check for image hosting patterns that should NEVER be treated as video
    if (IMAGE_HOST_PATTERNS.some(pattern => lowerUri.includes(pattern))) {
        return false;
    }

    // Check for image file extensions
    if (IMAGE_EXTENSIONS.some(ext => lowerUri.includes(ext))) {
        return false;
    }

    // If we get here and the URI is non-empty, treat it as video
    // This covers: S3 uploads, mixkit, cloudfront, and any video extensions
    return true;
};

/**
 * Generate a shareable deep link for a reel/post
 * 
 * @param {Object} item - The reel/post item
 * @returns {Promise<string>} - The universal link URL
 */
export const generateShareableLink = async (item) => {
    if (!item?._id) {
        return null;
    }

    const shareableLinks = DeepLinkingService.generateShareableLink('reel', item._id, {
        title: item?.title,
        caption: item?.caption,
        author: item?.author?.fullName,
        utm_source: 'app_share',
        utm_medium: 'reel_share',
    });

    return shareableLinks.universalLink;
};

/**
 * Check if an index is near the active video index (for preloading)
 * 
 * @param {number} activeIndex - The currently active video index
 * @param {number} itemIndex - The index to check
 * @param {number} range - The range around active index (default: 1)
 * @returns {boolean} - True if within range
 */
export const isNearActiveIndex = (activeIndex, itemIndex, range = 1) => {
    return Math.abs(activeIndex - itemIndex) <= range;
};

/**
 * Format duration for display
 * 
 * @param {string} duration - Duration string like "30 minutes"
 * @returns {Object|null} - { value, unit } or null
 */
export const parseDuration = (duration) => {
    if (!duration) return null;

    const parts = duration.split(' ');
    if (parts.length < 2 || parts[0] === 'undefined') {
        return null;
    }

    return {
        value: parts[0],
        unit: parts[1]?.toLowerCase(),
    };
};
