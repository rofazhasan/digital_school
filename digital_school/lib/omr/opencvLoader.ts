/**
 * Bulletproof Production-Grade OpenCV.js Dynamic Loader (v3)
 *
 * Priority:
 *  1. Pre-cached local static file: '/workers/opencv.js'
 *  2. Fast CDN fallback: jsDelivr (@techstark/opencv-js 4.12)
 *  3. Secondary CDN fallback: unpkg (@techstark/opencv-js 4.9)
 *
 * Safely unwraps Emscripten modular Promise/Thenable builds ONCE and removes `.then`
 * on the resolved instance to prevent infinite Promise unwrapping loops.
 */

let cvLoadPromise: Promise<any> | null = null;

function sanitizeCvInstance(instance: any): any {
  if (instance && typeof instance === 'object') {
    try {
      if ('then' in instance) {
        delete instance.then;
      }
    } catch {
      // ignore non-configurable
    }
  }
  return instance;
}

export function isOpenCVLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  const cv = (window as any).cv;
  return Boolean(cv && typeof cv.Mat === 'function');
}

async function unwrapIfThenable(candidate: any): Promise<any | null> {
  if (!candidate) return null;
  if (typeof candidate.Mat === 'function') {
    return sanitizeCvInstance(candidate);
  }
  if (typeof candidate.then === 'function') {
    const resolved = await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('OpenCV Promise resolution timed out')), 12000);
      try {
        candidate.then((mod: any) => {
          clearTimeout(timer);
          resolve(mod);
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
    if (resolved && typeof resolved.Mat === 'function') {
      return sanitizeCvInstance(resolved);
    }
  }
  return null;
}

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV is only supported in browser runtime'));
  }

  if (isOpenCVLoaded()) {
    return Promise.resolve(sanitizeCvInstance((window as any).cv));
  }

  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  const CANDIDATE_SOURCES = [
    '/workers/opencv.js',
    'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.12.0-release.1/dist/opencv.js',
    'https://unpkg.com/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js',
  ];

  cvLoadPromise = (async () => {
    if ((window as any).cv) {
      try {
        const unwrapped = await unwrapIfThenable((window as any).cv);
        if (unwrapped) {
          (window as any).cv = unwrapped;
          return unwrapped;
        }
      } catch (err) {
        console.warn('[OpenCVLoader] Existing window.cv unwrap failed:', err);
      }
    }

    let lastError: Error | null = null;
    for (const src of CANDIDATE_SOURCES) {
      try {
        const cvInstance = await loadScriptCandidate(src);
        (window as any).cv = sanitizeCvInstance(cvInstance);
        return (window as any).cv;
      } catch (err: any) {
        console.warn(`[OpenCVLoader] Source failed (${src}):`, err?.message || err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    cvLoadPromise = null;
    throw lastError || new Error('Failed to load OpenCV.js from all available sources');
  })();

  return cvLoadPromise;
}

function loadScriptCandidate(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('opencv-js-script') as HTMLScriptElement | null;
    if (existing) existing.remove();

    let isDone = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const finishOk = (inst: any) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      clearTimeout(timeoutId);
      resolve(sanitizeCvInstance(inst));
    };

    const finishErr = (err: Error) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      clearTimeout(timeoutId);
      script.remove();
      reject(err);
    };

    const tryCandidate = async (cand: any) => {
      if (isDone || !cand) return;
      try {
        const inst = await unwrapIfThenable(cand);
        if (inst) finishOk(inst);
      } catch {
        // continue polling
      }
    };

    const prevModule = (window as any).Module || {};
    const prevInit = prevModule.onRuntimeInitialized;
    (window as any).Module = {
      ...prevModule,
      onRuntimeInitialized: () => {
        if (typeof prevInit === 'function') {
          try { prevInit(); } catch { }
        }
        tryCandidate((window as any).cv || (window as any).Module);
      },
    };

    const timeoutId = setTimeout(() => {
      finishErr(new Error(`Timed out loading OpenCV.js from ${src} after 18s`));
    }, 18000);

    const script = document.createElement('script');
    script.id = 'opencv-js-script';
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      tryCandidate((window as any).cv || (window as any).Module);
      pollInterval = setInterval(() => {
        tryCandidate((window as any).cv || (window as any).Module);
      }, 60);
    };

    script.onerror = () => {
      finishErr(new Error(`Network error loading script ${src}`));
    };

    document.head.appendChild(script);
  });
}
