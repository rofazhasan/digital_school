// Performance optimization utilities for mobile devices

// Debounce function to limit function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function to limit function execution rate
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  if (typeof window === 'undefined') {
    return {} as IntersectionObserver;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Virtual scrolling helper for large question lists
export function getVisibleRange(
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
): { start: number; end: number } {
  const start = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(start + visibleCount + 1, totalItems);

  return { start, end };
}

// Memory management for images
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates: (() => void)[]): void {
  if (typeof window === 'undefined') return;

  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Optimized event listener with passive option
export function addOptimizedEventListener(
  element: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
): () => void {
  const defaultOptions: AddEventListenerOptions = {
    passive: true,
    ...options
  };

  element.addEventListener(type, listener, defaultOptions);

  return () => {
    element.removeEventListener(type, listener, defaultOptions);
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      this.marks.set(name, performance.now());
    }
  }

  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof performance !== 'undefined') {
      const start = this.marks.get(startMark);
      const end = this.marks.get(endMark);

      if (start && end) {
        const duration = end - start;
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    }
    return null;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Mobile-specific optimizations
export const mobileOptimizations = {
  // Reduce animation complexity on mobile
  shouldReduceAnimations: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 ||
      navigator.userAgent.includes('Android') ||
      navigator.userAgent.includes('iPhone');
  },

  // Optimize touch events
  getTouchEventOptions: (): AddEventListenerOptions => ({
    passive: true,
    capture: false
  }),

  // Detect low performance devices (low RAM or slow CPU)
  isLowPerformanceDevice: (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    // Check RAM (available in Chrome/Blink based browsers)
    const ram = (navigator as any).deviceMemory;
    if (ram && ram <= 2) return true;

    // Check CPU cores
    const cores = navigator.hardwareConcurrency;
    if (cores && cores <= 4) return true;

    // Check for older mobile devices based on user agent
    const ua = navigator.userAgent;
    if (/Android [1-7]/.test(ua) || /iPhone OS [1-9]_/.test(ua)) return true;

    return false;
  },

  isMobileDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Reduce reflows on mobile
  batchStyleUpdates: (element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void => {
    if (typeof window === 'undefined') return;

    // Use requestAnimationFrame to batch style updates
    requestAnimationFrame(() => {
      Object.assign(element.style, styles);
    });
  }
};

// Network-aware optimizations
export const networkOptimizations = {
  // Check if connection is slow
  isSlowConnection: (): boolean => {
    if (typeof navigator === 'undefined') return false;

    const connection = (navigator as any).connection;
    if (connection) {
      return connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.downlink < 1;
    }

    return false;
  },

  // Adjust quality based on connection
  getQualityLevel: (): 'high' | 'medium' | 'low' => {
    if (networkOptimizations.isSlowConnection()) {
      return 'low';
    }

    if (typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType === '4g') {
        return 'high';
      }
    }

    return 'medium';
  }
};

// Export default instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor; 