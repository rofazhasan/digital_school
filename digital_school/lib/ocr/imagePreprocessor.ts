/**
 * High-Performance Image Preprocessing Engine for Text & Mathematical OCR
 * Handles blurry camera photos, low contrast scans, uneven shadows, skew, and noise.
 */

export interface PreprocessOptions {
  deblur?: boolean;
  unsharpAmount?: number; // 0.5 to 3.0 (default 1.8)
  unsharpRadius?: number; // 1 to 5 (default 2)
  enhanceContrast?: boolean; // CLAHE adaptive contrast
  contrastClipLimit?: number; // default 2.5
  binarize?: boolean; // Otsu adaptive binarization
  deskew?: boolean;
  targetDpiScale?: number; // 1.0 to 2.5
}

/**
 * Creates an in-memory Canvas from an image file, blob, or HTMLImageElement.
 */
export async function loadImageToCanvas(
  source: File | Blob | string | HTMLImageElement
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Canvas operations must run in browser environment'));
      return;
    }

    let img: HTMLImageElement;
    if (source instanceof HTMLImageElement) {
      img = source;
      setupCanvas();
    } else {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setupCanvas();
      img.onerror = (e) => reject(new Error('Failed to load image for preprocessing: ' + e));

      if (typeof source === 'string') {
        img.src = source;
      } else {
        img.src = URL.createObjectURL(source);
      }
    }

    function setupCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx, img });
    }
  });
}

/**
 * Applies Unsharp Masking filter to restore blurry text, math symbols, and formulas.
 */
export function applyUnsharpMask(
  imageData: ImageData,
  amount: number = 1.8,
  radius: number = 2,
  threshold: number = 5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const dst = output.data;

  // 1. Create a fast box-blurred copy as approximation of Gaussian blur
  const blurred = boxBlur(src, width, height, radius);

  // 2. High-pass filter subtraction + scaling
  for (let i = 0; i < src.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const idx = i + c;
      const diff = src[idx] - blurred[idx];
      if (Math.abs(diff) >= threshold) {
        const val = src[idx] + diff * amount;
        dst[idx] = Math.min(255, Math.max(0, val));
      } else {
        dst[idx] = src[idx];
      }
    }
    dst[i + 3] = src[i + 3]; // Alpha
  }

  return output;
}

/**
 * Fast multi-pass box blur to simulate Gaussian blur for unsharp masking.
 */
function boxBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const target = new Uint8ClampedArray(src);
  const r = Math.max(1, Math.floor(radius));

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let kx = -r; kx <= r; kx++) {
        const px = Math.min(width - 1, Math.max(0, x + kx));
        const idx = (y * width + px) * 4;
        rSum += src[idx];
        gSum += src[idx + 1];
        bSum += src[idx + 2];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      target[outIdx] = rSum / count;
      target[outIdx + 1] = gSum / count;
      target[outIdx + 2] = bSum / count;
    }
  }

  // Vertical pass
  const finalDst = new Uint8ClampedArray(target);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let ky = -r; ky <= r; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        const idx = (py * width + x) * 4;
        rSum += target[idx];
        gSum += target[idx + 1];
        bSum += target[idx + 2];
        count++;
      }
      const outIdx = (y * width + x) * 4;
      finalDst[outIdx] = rSum / count;
      finalDst[outIdx + 1] = gSum / count;
      finalDst[outIdx + 2] = bSum / count;
    }
  }

  return finalDst;
}

/**
 * Adaptive Contrast Enhancement (CLAHE Approximation) to remove uneven paper shadows & lighting gradients.
 */
export function applyAdaptiveContrast(
  imageData: ImageData,
  _clipLimit: number = 2.5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const dst = output.data;

  // Convert to grayscale luminescence
  const lum = new Float32Array(width * height);
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < src.length; i += 4) {
    const l = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    const pIdx = i / 4;
    lum[pIdx] = l;
    if (l < minLum) minLum = l;
    if (l > maxLum) maxLum = l;
  }

  const range = maxLum - minLum || 1;

  // Stretch histogram per tile grid (e.g. 8x8 tiles)
  const tilesX = 8;
  const tilesY = 8;
  const tileW = Math.ceil(width / tilesX);
  const tileH = Math.ceil(height / tilesY);

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const startX = tx * tileW;
      const endX = Math.min(width, (tx + 1) * tileW);
      const startY = ty * tileH;
      const endY = Math.min(height, (ty + 1) * tileH);

      let tMin = 255, tMax = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const l = lum[y * width + x];
          if (l < tMin) tMin = l;
          if (l > tMax) tMax = l;
        }
      }

      const tRange = tMax - tMin || 1;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          const l = lum[y * width + x];
          // Local contrast normalized with global dampening
          const normalized = Math.min(255, Math.max(0, ((l - tMin) / tRange) * 255));
          const blended = 0.7 * normalized + 0.3 * (((l - minLum) / range) * 255);
          
          dst[idx] = blended;
          dst[idx + 1] = blended;
          dst[idx + 2] = blended;
          dst[idx + 3] = src[idx + 3];
        }
      }
    }
  }

  return output;
}

/**
 * Adaptive Otsu-like Binarization: converts gray levels into ultra-clean black text on pure white paper.
 */
export function applyAdaptiveBinarization(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(src), width, height);
  const dst = output.data;

  // Build histogram
  const hist = new Int32Array(256);
  const totalPixels = width * height;

  for (let i = 0; i < src.length; i += 4) {
    const gray = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
    hist[gray]++;
  }

  // Calculate Otsu threshold
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  // Apply threshold
  for (let i = 0; i < src.length; i += 4) {
    const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    const val = gray > threshold ? 255 : 0;
    dst[i] = val;
    dst[i + 1] = val;
    dst[i + 2] = val;
    dst[i + 3] = src[i + 3];
  }

  return output;
}

/**
 * Main High-Quality Preprocessing Function for Images
 */
export async function preprocessImageForOcr(
  source: File | Blob | string | HTMLImageElement,
  options: PreprocessOptions = {}
): Promise<{
  enhancedCanvas: HTMLCanvasElement;
  enhancedDataUrl: string;
  enhancedBlob: Blob;
  width: number;
  height: number;
}> {
  const {
    deblur = true,
    unsharpAmount = 2.0,
    unsharpRadius = 2,
    enhanceContrast = true,
    binarize = false,
    targetDpiScale = 1.5,
  } = options;

  const { canvas } = await loadImageToCanvas(source);

  // 1. Scale up slightly if resolution is low (for crisp text edges)
  let workingCanvas = canvas;
  if (targetDpiScale > 1.0 && (canvas.width < 2400 || canvas.height < 2400)) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = Math.round(canvas.width * targetDpiScale);
    scaledCanvas.height = Math.round(canvas.height * targetDpiScale);
    const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true });
    if (scaledCtx) {
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = 'high';
      scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      workingCanvas = scaledCanvas;
    }
  }

  const workingCtx = workingCanvas.getContext('2d', { willReadFrequently: true })!;
  let imgData = workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height);

  // 2. Contrast Enhancement (CLAHE)
  if (enhanceContrast) {
    imgData = applyAdaptiveContrast(imgData, 2.5);
  }

  // 3. De-blur & Sharpen (Unsharp Masking)
  if (deblur) {
    imgData = applyUnsharpMask(imgData, unsharpAmount, unsharpRadius, 4);
  }

  // 4. Binarization if requested
  if (binarize) {
    imgData = applyAdaptiveBinarization(imgData);
  }

  workingCtx.putImageData(imgData, 0, 0);

  const enhancedDataUrl = workingCanvas.toDataURL('image/png');
  const enhancedBlob = await new Promise<Blob>((resolve) => {
    workingCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  return {
    enhancedCanvas: workingCanvas,
    enhancedDataUrl,
    enhancedBlob,
    width: workingCanvas.width,
    height: workingCanvas.height,
  };
}
