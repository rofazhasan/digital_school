/**
 * Native Android/iOS Document Scanner Bridge (Capacitor)
 *
 * Uses `capacitor-document-scanner` when running inside the Capacitor mobile APK
 * for hardware-accelerated paper edge detection, glare-free flash, and multi-page
 * capture, with graceful fallback to `@capacitor/camera` and safe no-op on web.
 */

export interface NativeScanCapture {
  canvas: HTMLCanvasElement;
  name: string;
}

export function isNativeCapacitorRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function loadImageToCanvas(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('Could not acquire 2D canvas context'));
      ctx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => reject(new Error('Failed to load captured native image'));
    img.src = src;
  });
}

/**
 * Launches the native Document Scanner (auto-edge crop + multi-page capture)
 * and returns ready-to-scan HTMLCanvasElement[] for the OMR v3 engine.
 */
export async function captureWithNativeDocumentScanner(
  maxNumDocuments = 25
): Promise<NativeScanCapture[]> {
  if (!isNativeCapacitorRuntime()) {
    throw new Error('Native Document Scanner is only available inside the Android/iOS Capacitor app.');
  }

  const cap = (window as any).Capacitor;
  const convertFileSrc =
    cap && typeof cap.convertFileSrc === 'function'
      ? (p: string) => cap.convertFileSrc(p)
      : (p: string) => p;

  // Primary: capacitor-document-scanner (hardware auto-edge crop)
  try {
    const mod = await import('capacitor-document-scanner');
    const DocumentScanner = (mod as any).DocumentScanner || (mod as any).default;
    if (DocumentScanner && typeof DocumentScanner.scanDocument === 'function') {
      const res = await DocumentScanner.scanDocument({
        maxNumDocuments,
        croppedImageQuality: 95,
        letUserAdjustCrop: true,
      });

      const scannedImages: string[] = res?.scannedImages || [];
      if (scannedImages.length > 0) {
        const captures: NativeScanCapture[] = [];
        for (let i = 0; i < scannedImages.length; i++) {
          const raw = scannedImages[i];
          const src =
            raw.startsWith('data:') || raw.startsWith('http')
              ? raw
              : raw.startsWith('/') || raw.startsWith('file://')
              ? convertFileSrc(raw)
              : `data:image/jpeg;base64,${raw}`;
          const canvas = await loadImageToCanvas(src);
          captures.push({
            canvas,
            name: `NativeScan_${Date.now()}_${i + 1}.jpg`,
          });
        }
        return captures;
      }
      return [];
    }
  } catch (err) {
    console.warn('[NativeScanner] DocumentScanner unavailable, falling back to Capacitor Camera:', err);
  }

  // Fallback: @capacitor/camera
  const camMod = await import('@capacitor/camera');
  const { Camera, CameraResultType, CameraSource } = camMod as any;
  const photo = await Camera.getPhoto({
    quality: 95,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  if (!photo?.dataUrl) return [];
  const canvas = await loadImageToCanvas(photo.dataUrl);
  return [{ canvas, name: `NativeCam_${Date.now()}.jpg` }];
}
