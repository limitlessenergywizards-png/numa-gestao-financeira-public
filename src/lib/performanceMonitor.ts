/**
 * Performance Monitor - Web Vitals Tracking
 * 
 * Tracks Core Web Vitals and alerts on performance issues.
 * Uses dynamic import to avoid blocking initial load.
 */

type MetricName = 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';

interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Thresholds based on Google's Core Web Vitals guidelines
const thresholds: Record<MetricName, [number, number]> = {
  FCP: [1800, 3000],   // First Contentful Paint
  LCP: [2500, 4000],   // Largest Contentful Paint
  CLS: [0.1, 0.25],    // Cumulative Layout Shift
  TTFB: [800, 1800],   // Time to First Byte
  INP: [200, 500],     // Interaction to Next Paint
};

const getRating = (name: MetricName, value: number): PerformanceMetric['rating'] => {
  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

const formatValue = (name: MetricName, value: number): string => {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${value.toFixed(0)}ms`;
};

const logMetric = (metric: PerformanceMetric) => {
  const icon = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '🔴';
  const formattedValue = formatValue(metric.name, metric.value);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `${icon} [Web Vital] ${metric.name}: ${formattedValue} (${metric.rating})`
    );
  }

  // Alert on poor performance in development
  if (metric.rating === 'poor' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️ Performance Issue: ${metric.name} is ${metric.rating}. ` +
      `Value: ${formattedValue}, Threshold: ${formatValue(metric.name, thresholds[metric.name][0])}`
    );
  }
};

/**
 * Initialize performance monitoring
 * Uses dynamic import to avoid blocking initial load
 */
export const initPerformanceMonitoring = async (): Promise<void> => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import of web-vitals to avoid blocking initial load
    const webVitals = await import('web-vitals');

    const reportMetric = (metric: { name: string; value: number }) => {
      const perf: PerformanceMetric = {
        name: metric.name as MetricName,
        value: metric.value,
        rating: getRating(metric.name as MetricName, metric.value),
      };

      logMetric(perf);
    };

    // Register all web vital handlers
    webVitals.onCLS(reportMetric);
    webVitals.onLCP(reportMetric);
    webVitals.onFCP(reportMetric);
    webVitals.onTTFB(reportMetric);
    webVitals.onINP(reportMetric);

    // Track long tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(
                  `⏱️ [Long Task] ${entry.duration.toFixed(0)}ms - This blocks the main thread`,
                  entry
                );
              }
            }
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task observer not supported in all browsers
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Performance monitoring initialized');
    }
  } catch (error) {
    // web-vitals not available - fail silently
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Performance monitoring unavailable:', error);
    }
  }
};

/**
 * Mark a custom performance metric
 */
export const markPerformance = (name: string): void => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

/**
 * Measure time between two marks
 */
export const measurePerformance = (name: string, startMark: string, endMark?: string): void => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`📏 [Measure] ${name}: ${entries[0].duration.toFixed(0)}ms`);
      }
    } catch {
      // Measurement failed - fail silently
    }
  }
};
