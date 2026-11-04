/**
 * Helper to ensure OpenCV.js is loaded into window.cv in browser runtime.
 */
let cvLoadPromise: Promise<any> | null = null;

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV is only supported in browser runtime'));
  }

  if ((window as any).cv && (window as any).cv.Mat) {
    return Promise.resolve((window as any).cv);
  }

  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  cvLoadPromise = new Promise((resolve, reject) => {
    // Check if script is already injected
    const existing = document.getElementById('opencv-js-script');
    if (existing) {
      const checkInterval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(checkInterval);
          resolve((window as any).cv);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        if ((window as any).cv && (window as any).cv.Mat) {
          resolve((window as any).cv);
        } else {
          reject(new Error('OpenCV.js loading timed out'));
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-js-script';
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;

    // OpenCV.js has an onRuntimeInitialized callback
    (window as any).Module = {
      onRuntimeInitialized: () => {
        resolve((window as any).cv);
      }
    };

    script.onload = () => {
      // In case onRuntimeInitialized doesn't fire immediately
      const interval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(interval);
          resolve((window as any).cv);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        if ((window as any).cv && (window as any).cv.Mat) {
          resolve((window as any).cv);
        }
      }, 5000);
    };

    script.onerror = (err) => {
      cvLoadPromise = null;
      reject(new Error('Failed to load OpenCV.js script: ' + err));
    };

    document.head.appendChild(script);
  });

  return cvLoadPromise;
}
