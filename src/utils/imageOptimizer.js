// Image optimization utilities for better performance

// CDN URL replacements for faster loading
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return url;

  const {
    width = null,
    height = null,
    quality = 80,
    // Default to JPG to ensure compatibility with iOS Image component
    // (some environments do not support WebP out of the box)
    format = 'jpg',
    blur = false
  } = options;

  // URLs are already served via Cloudflare R2 CDN (cdn.feedyum.com)
  let optimizedUrl = url;

  // Add optimization parameters for CloudFront if supported
  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality !== 80) params.append('q', quality.toString());
  if (format !== 'jpg') params.append('f', format);
  if (blur) params.append('blur', '10');

  if (params.toString()) {
    const separator = optimizedUrl.includes('?') ? '&' : '?';
    optimizedUrl = `${optimizedUrl}${separator}${params.toString()}`;
  }

  return optimizedUrl;
};

// Presets for common image sizes
export const ImagePresets = {
  THUMBNAIL: { width: 150, height: 150, quality: 70 },
  SMALL: { width: 300, height: 300, quality: 75 },
  MEDIUM: { width: 600, height: 600, quality: 80 },
  LARGE: { width: 1200, height: 1200, quality: 85 },
  AVATAR: { width: 100, height: 100, quality: 70 },
  COVER: { width: 800, height: 400, quality: 80 },
  REEL_POSTER: { width: 400, height: 600, quality: 75 },
};

// Smart image loader that adapts to connection speed
export const getAdaptiveImageUrl = (url, preset = 'MEDIUM') => {
  if (!url) return url;

  // Default to medium quality
  let selectedPreset = ImagePresets[preset] || ImagePresets.MEDIUM;

  // Detect connection speed (if available)
  if (navigator?.connection) {
    const { effectiveType, downlink } = navigator.connection;

    // Adjust quality based on connection
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
      selectedPreset = { ...selectedPreset, quality: 60, width: selectedPreset.width * 0.7 };
    } else if (effectiveType === '3g' || downlink < 5) {
      selectedPreset = { ...selectedPreset, quality: 70 };
    }
  }

  return optimizeImageUrl(url, selectedPreset);
};

// Progressive loading with blur placeholder
export const getProgressiveImageUrls = (url) => {
  if (!url) return { blur: null, full: null };

  return {
    blur: optimizeImageUrl(url, { width: 50, height: 50, quality: 30, blur: true }),
    full: optimizeImageUrl(url, ImagePresets.MEDIUM),
  };
};

// Video poster optimization
export const optimizeVideoPoster = (url) => {
  return optimizeImageUrl(url, ImagePresets.REEL_POSTER);
};

// Image prefetching utility
export const prefetchImage = (url) => {
  if (!url) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = optimizeImageUrl(url, ImagePresets.SMALL);
  });
};

// Batch image prefetching
export const prefetchImages = async (urls, options = {}) => {
  const { concurrent = 3, timeout = 5000 } = options;

  const chunks = [];
  for (let i = 0; i < urls.length; i += concurrent) {
    chunks.push(urls.slice(i, i + concurrent));
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(url =>
        Promise.race([
          prefetchImage(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ])
      )
    );
  }
};

export default {
  optimizeImageUrl,
  getAdaptiveImageUrl,
  getProgressiveImageUrls,
  optimizeVideoPoster,
  prefetchImage,
  prefetchImages,
  ImagePresets,
};