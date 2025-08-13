import { InteractionManager } from 'react-native';

// Request batching utility for multiple API calls
class RequestBatcher {
  constructor() {
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchDelay = 50; // ms
  }

  // Add request to batch
  addToBatch(requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        requestFn,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.scheduleBatch();
    });
  }

  // Schedule batch execution
  scheduleBatch() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.batchDelay);
  }

  // Execute batched requests
  async executeBatch() {
    if (this.batchQueue.length === 0) return;

    // Sort by priority (high -> normal -> low)
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const sortedQueue = [...this.batchQueue].sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    const currentBatch = sortedQueue.splice(0, 5); // Process max 5 at a time
    this.batchQueue = sortedQueue;

    // Execute requests with controlled concurrency
    const results = await Promise.allSettled(
      currentBatch.map(({ requestFn }) => requestFn())
    );

    // Resolve/reject promises
    results.forEach((result, index) => {
      const { resolve, reject } = currentBatch[index];
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });

    this.batchTimeout = null;

    // Process remaining queue
    if (this.batchQueue.length > 0) {
      this.scheduleBatch();
    }
  }
}

export const requestBatcher = new RequestBatcher();

// Background task utilities
export const runInBackground = (task, priority = 'normal') => {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      try {
        const result = task();
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Debounced request utility
export const createDebouncedRequest = (requestFn, delay = 300) => {
  let timeout;
  let lastCall = 0;
  
  return (...args) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        lastCall = now;
        requestFn(...args).then(resolve).catch(reject);
      }, delay);
    });
  };
};

// Smart retry with exponential backoff
export const retryWithBackoff = async (
  requestFn,
  maxRetries = 3,
  baseDelay = 1000
) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Connection-aware request handling
export const adaptiveRequest = async (requestFn, options = {}) => {
  const { 
    lowQualityFallback,
    timeout = 10000,
    useCache = true 
  } = options;
  
  // Check connection quality (if available)
  const isSlowConnection = navigator?.connection?.effectiveType === '2g' || 
                          navigator?.connection?.effectiveType === 'slow-2g';
  
  if (isSlowConnection && lowQualityFallback) {
    return lowQualityFallback();
  }
  
  // Add timeout to request
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
  
  return Promise.race([requestFn(), timeoutPromise]);
};

// Request deduplication
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async request(key, requestFn) {
    // If request is already pending, return the same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Remove from pending when complete
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Preload utility for critical resources
export const preloadCriticalData = async (requests) => {
  const criticalRequests = requests.filter(r => r.critical);
  const nonCriticalRequests = requests.filter(r => !r.critical);
  
  // Load critical data first
  const criticalResults = await Promise.allSettled(
    criticalRequests.map(r => r.requestFn())
  );
  
  // Load non-critical data in background
  InteractionManager.runAfterInteractions(() => {
    Promise.allSettled(nonCriticalRequests.map(r => r.requestFn()));
  });
  
  return criticalResults;
};

export default {
  requestBatcher,
  runInBackground,
  createDebouncedRequest,
  retryWithBackoff,
  adaptiveRequest,
  requestDeduplicator,
  preloadCriticalData,
};