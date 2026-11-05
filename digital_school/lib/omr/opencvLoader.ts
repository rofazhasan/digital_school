/**
 * Production-Grade OpenCV.js Dynamic Loader
 * Ensures OpenCV.js WebAssembly / JS runtime is loaded on-demand via fast edge CDN
 * with zero bloat on initial page mount.
 */

let cvLoadPromise: Promise<any> | null = null;

export function isOpenCVLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).cv && (window as any).cv.Mat);
}

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV is only supported in browser runtime'));
  }

  if (isOpenCVLoaded()) {
    return Promise.resolve((window as any).cv);
  }

  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  const PRIMARY_CDN = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js';
  const FALLBACK_CDN = 'https://unpkg.com/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js';

  cvLoadPromise = new Promise((resolve, reject) => {
    // If script is already in DOM, await runtime init
    const existing = document.getElementById('opencv-js-script') as HTMLScriptElement | null;
    if (existing) {
      let elapsed = 0;
      const poll = setInterval(() => {
        elapsed += 50;
        if (isOpenCVLoaded()) {
          clearInterval(poll);
          resolve((window as any).cv);
        } else if (elapsed > 15000) {
          clearInterval(poll);
          if (isOpenCVLoaded()) {
            resolve((window as any).cv);
          } else {
            cvLoadPromise = null;
            reject(new Error('OpenCV.js loading timed out after 15s'));
          }
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-js-script';
    script.src = PRIMARY_CDN;
    script.async = true;
    script.crossOrigin = 'anonymous';

    // Hook Module.onRuntimeInitialized
    (window as any).Module = {
      onRuntimeInitialized: () => {
        resolve((window as any).cv);
      }
    };

    const timeout = setTimeout(() => {
      if (isOpenCVLoaded()) {
        resolve((window as any).cv);
      } else {
        cvLoadPromise = null;
        reject(new Error('OpenCV.js initialization timed out'));
      }
    }, 18000);

    script.onload = () => {
      // In case onRuntimeInitialized doesn't fire immediately
      let pollCount = 0;
      const poll = setInterval(() => {
        pollCount++;
        if (isOpenCVLoaded()) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve((window as any).cv);
        } else if (pollCount > 100) { // 5s after script load
          clearInterval(poll);
        }
      }, 50);
    };

    script.onerror = () => {
      console.warn(`Primary OpenCV CDN failed, attempting fallback to unpkg...`);
      script.remove();
      const fallbackScript = document.createElement('script');
      fallbackScript.id = 'opencv-js-script';
      fallbackScript.src = FALLBACK_CDN;
      fallbackScript.async = true;
      fallbackScript.crossOrigin = 'anonymous';

      fallbackScript.onload = () => {
        let pollCount = 0;
        const poll = setInterval(() => {
          pollCount++;
          if (isOpenCVLoaded()) {
            clearInterval(poll);
            clearTimeout(timeout);
            resolve((window as any).cv);
          } else if (pollCount > 100) {
            clearInterval(poll);
          }
        }, 50);
      };

      fallbackScript.onerror = (err) => {
        clearTimeout(timeout);
        cvLoadPromise = null;
        reject(new Error('Failed to load OpenCV.js from both primary and fallback CDNs'));
      };

      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  });

  return cvLoadPromise;
}
