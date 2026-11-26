/**
 * Off-Main-Thread Web Worker Client for High-Volume OMR Batch Ingestion
 *
 * Offloads multi-angle QR code decoding onto `/workers/omr-qr-worker.js` using
 * zero-copy Transferable ArrayBuffers (keeping UI smooth at 60 FPS), with seamless
 * fallback to main-thread `scanQRCodeFromCanvas` if Workers are unavailable.
 */

import type { QRCodeScanResult } from './types';
import { scanQRCodeFromCanvas } from './omrEngine';

let workerInstance: Worker | null = null;
let workerDisabled = false;
let nextMsgId = 1;
const pending = new Map<number, { resolve: (r: QRCodeScanResult) => void; timer: ReturnType<typeof setTimeout> }>();

function getQrWorker(): Worker | null {
  if (workerDisabled || typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (workerInstance) return workerInstance;

  try {
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
      workerInstance = null;
      pending.forEach((entry) => {
        clearTimeout(entry.timer);
        entry.resolve({ found: false, rawText: null });
      });
      pending.clear();
    };
    workerInstance = w;
    return w;
  } catch {
    workerDisabled = true;
    return null;
  }
}

export async function scanQRCodeOffThread(canvas: HTMLCanvasElement): Promise<QRCodeScanResult> {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return { found: false, rawText: null };
  }

  const worker = getQrWorker();
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
