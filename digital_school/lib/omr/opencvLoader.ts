/**
 * Production-Grade OpenCV.js Dynamic Loader
 * Ensures OpenCV.js WebAssembly / JS runtime is loaded efficiently
 * Priority:
 *  1. Pre-cached local static file: '/workers/opencv.js'
 *  2. Fast CDN fallback: jsdelivr
 *  3. Secondary CDN fallback: unpkg
 * 
 * Crucial Fix for Emscripten Modular Builds:
 * In @techstark/opencv-js and modern Emscripten builds, window.cv is initially assigned
 * a Promise returned by the factory function `cv(Module)`.
 * Direct access to window.cv.Mat without unwrapping leaves cv.Mat undefined,
 * causing endless polling and main-thread browser freezes.
 * This loader properly awaits and unwraps the Promise, assigning the resolved
 * OpenCV instance back to window.cv.
 */

let cvLoadPromise: Promise<any> | null = null;

export function isOpenCVLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  const cv = (window as any).cv;
  // Validated when cv exists, is NOT a pending Promise, and has Mat constructor function
  return Boolean(cv && typeof cv.then !== 'function' && typeof cv.Mat === 'function');
}

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV is only supported in browser runtime'));
  }

  // 1. If already loaded and initialized, return immediately
  if (isOpenCVLoaded()) {
    return Promise.resolve((window as any).cv);
  }

  // 2. If already in flight, return active promise
  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  // 3. If window.cv is already in DOM as a Promise, await and unwrap
  const existingCv = (window as any).cv;
  if (existingCv && typeof existingCv.then === 'function') {
    cvLoadPromise = Promise.resolve(existingCv)
      .then(async (resolved: any) => {
        let instance = resolved;
        while (instance && typeof instance.then === 'function') {
          instance = await instance;
        }
        if (instance && typeof instance.Mat === 'function') {
          (window as any).cv = instance;
          return instance;
        }
        throw new Error('OpenCV resolved instance missing Mat constructor');
      })
      .catch((err: any) => {
        cvLoadPromise = null;
        throw err;
      });
    return cvLoadPromise;
  }

  const CANDIDATE_SOURCES = [
    '/workers/opencv.js',
    'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js',
    'https://unpkg.com/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js'
  ];

  cvLoadPromise = (async () => {
    let lastError: Error | null = null;

    for (const src of CANDIDATE_SOURCES) {
      try {
        const cvInstance = await loadScriptCandidate(src);
        (window as any).cv = cvInstance;
        return cvInstance;
      } catch (err: any) {
        console.warn(`[OpenCVLoader] Source failed (${src}):`, err?.message || err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    cvLoadPromise = null;
    throw (lastError || new Error('Failed to load OpenCV.js from all available sources'));
  })();

  return cvLoadPromise;
}

function loadScriptCandidate(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // If a previous failed script exists, clean it up
    const existing = document.getElementById('opencv-js-script') as HTMLScriptElement | null;
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = 'opencv-js-script';
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';

    let isDone = false;
    let pollInterval: any = null;

    const cleanup = () => {
      isDone = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const tryResolveInstance = async (candidate: any): Promise<boolean> => {
      if (isDone || !candidate) return false;
      try {
        let instance = candidate;
        if (typeof instance.then === 'function') {
          instance = await instance;
        }
        if (instance && typeof instance.Mat === 'function') {
          cleanup();
          resolve(instance);
          return true;
        }
      } catch (e) {
        // Not ready yet
      }
      return false;
    };

    // Pre-hook Module.onRuntimeInitialized if runtime supports it
    const prevModule = (window as any).Module || {};
    const prevInit = prevModule.onRuntimeInitialized;
    (window as any).Module = {
      ...prevModule,
      onRuntimeInitialized: async () => {
        if (typeof prevInit === 'function') {
          try { prevInit(); } catch {}
        }
        await tryResolveInstance((window as any).cv);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isDone) {
        cleanup();
        script.remove();
        reject(new Error(`Timed out loading OpenCV.js from ${src} after 12s`));
      }
    }, 12000);

    script.onload = async () => {
      // Yield to event loop to allow asm/wasm initialization
      await new Promise(r => setTimeout(r, 10));

      if (await tryResolveInstance((window as any).cv)) {
        clearTimeout(timeoutId);
        return;
      }

      let elapsed = 0;
      pollInterval = setInterval(async () => {
        elapsed += 50;
        if (await tryResolveInstance((window as any).cv)) {
          clearTimeout(timeoutId);
          return;
        }
        if (elapsed >= 8000) {
          cleanup();
          clearTimeout(timeoutId);
          script.remove();
          reject(new Error(`Timed out waiting for OpenCV initialization from ${src}`));
        }
      }, 50);
    };

    script.onerror = (err) => {
      cleanup();
      clearTimeout(timeoutId);
      script.remove();
      reject(new Error(`Network error loading script ${src}`));
    };

    document.head.appendChild(script);
  });
}
