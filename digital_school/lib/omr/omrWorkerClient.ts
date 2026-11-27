/**
 * Multi-Worker Pool Client for High-Volume OMR Batch Ingestion
 *
 * Maintains a pool of up to 4 Web Workers (`/workers/omr-qr-worker.js`) using
 * zero-copy Transferable ArrayBuffers so QR decoding across large batches runs
 * in parallel off the main thread, with automatic fallback to `scanQRCodeFromCanvas`.
 */

import type { QRCodeScanResult } from './types';
import { scanQRCodeFromCanvas } from './omrEngine';

let workerPool: Worker[] = [];
let poolInitialized = false;
let workerDisabled = false;
let roundRobinIdx = 0;
let nextMsgId = 1;
const pending = new Map<number, { resolve: (r: QRCodeScanResult) => void; timer: ReturnType<typeof setTimeout> }>();

function getWorkerFromPool(): Worker | null {
  if (workerDisabled || typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!poolInitialized) {
    poolInitialized = true;
    const hw = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
    const poolSize = Math.max(2, Math.min(4, hw));
    try {
      for (let i = 0; i < poolSize; i++) {
        const w = new Worker('/workers/omr-qr-worker.js');
        w.onmessage = (e: MessageEvent) => {
          const { id, result } = e.data || {};
          const entry = pending.get(id);
          if (entry) {
            clearTimeout(entry.timer);
            pending.delete(id);
            entry.resolve(result || { found: false, rawText: null });
          }
        };
        w.onerror = () => {
          workerDisabled = true;
          workerPool.forEach((wk) => {
            try {
              wk.terminate();
            } catch {
              // ignore
            }
          });
          workerPool = [];
          pending.forEach((entry) => {
            clearTimeout(entry.timer);
            entry.resolve({ found: false, rawText: null });
          });
          pending.clear();
        };
        workerPool.push(w);
      }
    } catch {
      workerDisabled = true;
      workerPool = [];
      return null;
    }
  }

  if (workerPool.length === 0) return null;
  const w = workerPool[roundRobinIdx % workerPool.length];
  roundRobinIdx = (roundRobinIdx + 1) % workerPool.length;
  return w;
}

export function getOmrWorkerPoolSize(): number {
  return workerPool.length;
}

export async function scanQRCodeOffThread(canvas: HTMLCanvasElement): Promise<QRCodeScanResult> {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return { found: false, rawText: null };
  }

  const worker = getWorkerFromPool();
  if (!worker || typeof document === 'undefined') {
    return scanQRCodeFromCanvas(canvas);
  }

  try {
    const maxDim = Math.max(canvas.width, canvas.height);
    const scale = maxDim > 900 ? 900 / maxDim : 1;
    const w = Math.max(64, Math.round(canvas.width * scale));
    const h = Math.max(64, Math.round(canvas.height * scale));

    const ds = document.createElement('canvas');
    ds.width = w;
    ds.height = h;
    const ctx = ds.getContext('2d', { willReadFrequently: true });
    if (!ctx) return scanQRCodeFromCanvas(canvas);

    ctx.drawImage(canvas, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const copyBuffer = imgData.data.buffer.slice(0);
    // Free scratch canvas immediately
    ds.width = 0;
    ds.height = 0;

    const id = nextMsgId++;
    const workerRes = await new Promise<QRCodeScanResult>((resolve) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve({ found: false, rawText: null });
      }, 2500);
      pending.set(id, { resolve, timer });
      worker.postMessage({ id, type: 'SCAN_QR', buffer: copyBuffer, width: w, height: h }, [copyBuffer]);
    });

    if (workerRes.found) return workerRes;
    return { found: false, rawText: null };
  } catch {
    return scanQRCodeFromCanvas(canvas);
  }
}

/**
 * Generates a lightweight compressed JPEG thumbnail for HITL QC preview
 * so scanning 200+ sheets never exhausts browser memory.
 */
export function createCompressedPreviewUrl(
  canvas: HTMLCanvasElement,
  maxWidth = 960,
  quality = 0.68
): string {
  try {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return '';
    if (canvas.width <= maxWidth) {
      return canvas.toDataURL('image/jpeg', quality);
    }
    const scale = maxWidth / canvas.width;
    const thumb = document.createElement('canvas');
    thumb.width = Math.round(canvas.width * scale);
    thumb.height = Math.round(canvas.height * scale);
    const ctx = thumb.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/jpeg', quality);
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const dataUrl = thumb.toDataURL('image/jpeg', quality);
    thumb.width = 0;
    thumb.height = 0;
    return dataUrl;
  } catch {
    return '';
  }
}
