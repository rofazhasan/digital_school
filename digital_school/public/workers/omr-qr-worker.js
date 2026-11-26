/* eslint-disable no-restricted-globals */
/**
 * Background Web Worker for Off-Main-Thread QR Decoding & Image Sharpness Analysis
 * Uses /workers/jsqr.js with zero-copy Transferable ArrayBuffers so 200-sheet PDF
 * batches never freeze React UI animations (60 FPS guaranteed).
 */

let jsqrLoaded = false;

function ensureJsQR() {
  if (jsqrLoaded) return true;
  try {
    importScripts('/workers/jsqr.js');
    jsqrLoaded = typeof self.jsQR === 'function';
    return jsqrLoaded;
  } catch (e) {
    return false;
  }
}

function parsePayload(data) {
  let parsed = {};
  try {
    if (data.startsWith('{')) {
      parsed = JSON.parse(data);
    } else if (data.startsWith('ROFAZ_OMR:')) {
      const parts = data.replace('ROFAZ_OMR:', '').split('|');
      parsed = {
        examId: parts[0],
        setId: parts[1],
        setName: parts[2] || parts[1],
        template: parts[3],
        v: 1,
      };
    }
  } catch (e) {}
  return parsed;
}

function rotateRgba90(src, w, h, clockwise) {
  const dst = new Uint8ClampedArray(w * h * 4);
  const newW = h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sIdx = (y * w + x) * 4;
      const nx = clockwise ? h - 1 - y : y;
      const ny = clockwise ? x : w - 1 - x;
      const dIdx = (ny * newW + nx) * 4;
      dst[dIdx] = src[sIdx];
      dst[dIdx + 1] = src[sIdx + 1];
      dst[dIdx + 2] = src[sIdx + 2];
      dst[dIdx + 3] = src[sIdx + 3];
    }
  }
  return { data: dst, width: h, height: w };
}

function rotateRgba180(src, w, h) {
  const dst = new Uint8ClampedArray(w * h * 4);
  const total = w * h;
  for (let i = 0; i < total; i++) {
    const sIdx = i * 4;
    const dIdx = (total - 1 - i) * 4;
    dst[dIdx] = src[sIdx];
    dst[dIdx + 1] = src[sIdx + 1];
    dst[dIdx + 2] = src[sIdx + 2];
    dst[dIdx + 3] = src[sIdx + 3];
  }
  return { data: dst, width: w, height: h };
}

self.onmessage = function (e) {
  const msg = e.data || {};
  const { id, type, buffer, width, height } = msg;

  if (type === 'SCAN_QR') {
    if (!ensureJsQR() || !buffer || !width || !height) {
      self.postMessage({ id, result: { found: false, rawText: null } });
      return;
    }

    const rgba = new Uint8ClampedArray(buffer);
    const tryDecode = (arr, w, h, orientation) => {
      try {
        const code = self.jsQR(arr, w, h, { inversionAttempts: 'attemptBoth' });
        if (code && code.data && code.data.trim()) {
          const rawText = code.data.trim();
          return {
            found: true,
            rawText,
            detectedOrientation: orientation,
            metadata: parsePayload(rawText),
          };
        }
      } catch (err) {}
      return null;
    };

    let hit = tryDecode(rgba, width, height, 0);
    if (!hit) {
      const r90 = rotateRgba90(rgba, width, height, true);
      hit = tryDecode(r90.data, r90.width, r90.height, 90);
    }
    if (!hit) {
      const r180 = rotateRgba180(rgba, width, height);
      hit = tryDecode(r180.data, r180.width, r180.height, 180);
    }
    if (!hit) {
      const r270 = rotateRgba90(rgba, width, height, false);
      hit = tryDecode(r270.data, r270.width, r270.height, 270);
    }

    self.postMessage({ id, result: hit || { found: false, rawText: null } });
  }
};
