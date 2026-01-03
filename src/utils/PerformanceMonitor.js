import React from 'react';
import { InteractionManager } from 'react-native';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.timers = {};
  }

  // Start timing an operation
  startTimer(key) {
    this.timers[key] = {
      start: Date.now(),
      interactions: InteractionManager.runAfterInteractions(() => {

      })
    };
  }

  // End timing and log results
  endTimer(key, additionalData = {}) {
    if (!this.timers[key]) return;
    
    const duration = Date.now() - this.timers[key].start;
    this.timers[key].interactions.cancel();
    
    this.metrics[key] = {
      duration,
      timestamp: Date.now(),
      ...additionalData
    };
    

    
    // Log slow operations (>2 seconds)
    if (duration > 2000) {
      console.warn(`SLOW OPERATION: ${key} took ${duration}ms`, additionalData);
    }
    
    delete this.timers[key];
    return duration;
  }

  // Get performance metrics
  getMetrics() {
    return this.metrics;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {};
  }

  // Monitor React Query performance
  monitorQuery(queryKey, isLoading, error) {
    const key = Array.isArray(queryKey) ? queryKey.join('-') : queryKey;
    
    if (isLoading && !this.timers[key]) {
      this.startTimer(key);
    } else if (!isLoading && this.timers[key]) {
      this.endTimer(key, { 
        error: !!error,
        queryKey: queryKey 
      });
    }
  }

  // Memory usage monitoring
  logMemoryUsage(context = '') {
    if (__DEV__ && global.performance && global.performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = global.performance.memory;

    }
  }

  // Bundle size monitoring
  logBundleSize() {
    if (__DEV__) {

    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance monitoring
export const usePerformanceMonitoring = (key, isLoading, error) => {
  React.useEffect(() => {
    performanceMonitor.monitorQuery(key, isLoading, error);
  }, [key, isLoading, error]);
};

// HOC for component performance monitoring
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function MonitoredComponent(props) {
    React.useEffect(() => {
      performanceMonitor.startTimer(`render-${componentName}`);
      return () => {
        performanceMonitor.endTimer(`render-${componentName}`);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

export default performanceMonitor;