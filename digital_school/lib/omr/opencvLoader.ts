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
 * a Promise-like object with a custom `.then(callback)` method that returns Module itself.
 * When JavaScript Promises resolve with an object containing a `.then` function (a Thenable),
 * the Promise unwrapping algorithm repeatedly calls `.then` synchronously, entering an
 * infinite microtask loop that locks up the browser main thread and causes "Pages Unresponsive".
 * 
 * Solution:
 * Once `cv.Mat` is verified (meaning OpenCV is fully initialized), we immediately delete `cv.then`.
 * This prevents the infinite thenable recursion, allows seamless `await` and `Promise.resolve`,
 * and lets `isOpenCVLoaded()` reliably check `typeof cv.Mat === 'function'`.
 */

let cvLoadPromise: Promise<any> | null = null;

export function isOpenCVLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  const cv = (window as any).cv;
  // Validated when cv exists and has Mat constructor function
  return Boolean(cv && typeof cv.Mat === 'function');
}

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV is only supported in browser runtime'));
  }

  // 1. If already loaded and initialized, sanitize and return immediately
  if (isOpenCVLoaded()) {
    try {
      delete (window as any).cv.then;
    } catch {}
    return Promise.resolve((window as any).cv);
  }

  // 2. If already in flight, return active promise
  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  // 3. If window.cv is already in DOM, check or wait for onRuntimeInitialized
  const existingCv = (window as any).cv;
  if (existingCv) {
    if (typeof existingCv.Mat === 'function') {
      try {
        delete existingCv.then;
      } catch {}
      (window as any).cv = existingCv;
      return Promise.resolve(existingCv);
    }
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
        try {
          delete cvInstance.then;
        } catch {}
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

    let isDone = false;
    let pollInterval: any = null;

    const cleanup = () => {
      isDone = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const tryResolveInstance = (candidate: any): boolean => {
      if (isDone || !candidate) return false;
      if (typeof candidate.Mat === 'function') {
        try {
          delete candidate.then;
        } catch {}
        cleanup();
        resolve(candidate);
        return true;
      }
      return false;
    };

    // Pre-hook Module.onRuntimeInitialized if runtime supports it
    const prevModule = (window as any).Module || {};
    const prevInit = prevModule.onRuntimeInitialized;
    (window as any).Module = {
      ...prevModule,
      onRuntimeInitialized: () => {
        if (typeof prevInit === 'function') {
          try { prevInit(); } catch {}
        }
        const live = (window as any).cv || (window as any).Module;
        tryResolveInstance(live);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isDone) {
        cleanup();
        script.remove();
        reject(new Error(`Timed out loading OpenCV.js from ${src} after 15s`));
      }
    }, 15000);

    const script = document.createElement('script');
    script.id = 'opencv-js-script';
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      // Check if already ready
      const initialCandidate = (window as any).cv || (window as any).Module;
      if (tryResolveInstance(initialCandidate)) {
        clearTimeout(timeoutId);
        return;
      }

      let elapsed = 0;
      pollInterval = setInterval(() => {
        elapsed += 50;
        const liveCandidate = (window as any).cv || (window as any).Module;
        if (tryResolveInstance(liveCandidate)) {
          clearTimeout(timeoutId);
          return;
        }
        if (elapsed >= 10000) {
          cleanup();
          clearTimeout(timeoutId);
          script.remove();
          reject(new Error(`Timed out waiting for OpenCV initialization from ${src}`));
        }
      }, 50);
    };

    script.onerror = () => {
      cleanup();
      clearTimeout(timeoutId);
      script.remove();
      reject(new Error(`Network error loading script ${src}`));
    };

    document.head.appendChild(script);
  });
}
