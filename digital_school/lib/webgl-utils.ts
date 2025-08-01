// WebGL utility functions to prevent context loss and improve performance

export const webglUtils = {
  // Check if WebGL is supported
  isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },

  // Get optimal pixel ratio for device
  getOptimalPixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  },

  // Check if device is low-end (mobile, etc.)
  isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
    
    return isMobile || isLowMemory;
  },

  // Get optimal settings based on device capabilities
  getOptimalSettings() {
    const isLowEnd = this.isLowEndDevice();
    
    return {
      pixelRatio: this.getOptimalPixelRatio(),
      antialias: !isLowEnd,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: "high-performance" as const,
      maxParticles: isLowEnd ? 1000 : 2000,
      animationSpeed: isLowEnd ? 0.5 : 1.0,
    };
  },

  // Prevent multiple WebGL contexts from conflicting
  createContextId(componentName: string): string {
    return `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Log WebGL context events
  logContextEvent(event: string, contextId: string, details?: any) {
    console.log(`[WebGL ${contextId}] ${event}`, details || '');
  }
};

// WebGL context loss prevention
export const contextLossPrevention = {
  contexts: new Set<string>(),

  registerContext(id: string): boolean {
    if (this.contexts.has(id)) {
      console.warn(`WebGL context ${id} already registered`);
      return false;
    }
    this.contexts.add(id);
    return true;
  },

  unregisterContext(id: string): void {
    this.contexts.delete(id);
  },

  getContextCount(): number {
    return this.contexts.size;
  },

  // Check if we have too many contexts
  shouldLimitContexts(): boolean {
    return this.contexts.size > 2; // Limit to 2 active WebGL contexts
  }
}; 