/**
 * Advanced Mathematical & Statistical Models for Production OMR Recognition (v3)
 *
 * 1. Block-Level Rigid Grid Translation Refinement
 * 2. Constrained Subpixel Centroid Refinement (regularized energy minimization)
 * 3. Concentric Circular Core + Local Outer-Annulus Paper Normalization (Optical Density)
 * 4. Tri-Modal Gaussian Mixture Model (GMM) via Expectation-Maximization (EM)
 * 5. Spatial Patch Texture & Edge Homogeneity Discriminator
 */

import type { BubblePoint } from './types';

export interface GMMParameters {
  means: [number, number, number];
  variances: [number, number, number];
  weights: [number, number, number];
  converged: boolean;
  iterations: number;
  logLikelihood: number;
}

export interface GMMPosterior {
  pFilled: number;
  pErased: number;
  pClean: number;
}

export interface PatchTextureMetrics {
  mean: number;
  stdDev: number;
  fillRatio: number;
  homogeneity: number;
}

export interface ConcentricBubbleMetrics extends PatchTextureMetrics {
  darkestQ25: number;
  localBg: number;
  opticalDensity: number;
}

export function alignFieldBlockGrid(
  grayData: Uint8ClampedArray | Uint8Array,
  imageWidth: number,
  imageHeight: number,
  blockBubbles: BubblePoint[],
  bubbleW: number,
  bubbleH: number,
  maxShift: number = 6
): { dx: number; dy: number; improvement: number } {
  if (blockBubbles.length < 4 || maxShift <= 0) {
    return { dx: 0, dy: 0, improvement: 0 };
  }

  const step = Math.max(1, Math.floor(blockBubbles.length / 60));
  const sampleBubbles: BubblePoint[] = [];
  for (let i = 0; i < blockBubbles.length; i += step) {
    sampleBubbles.push(blockBubbles[i]);
  }

  const rRing = Math.max(3, Math.round(Math.min(bubbleW, bubbleH) * 0.44));
  const halfW = bubbleW / 2;
  const halfH = bubbleH / 2;

  const ringOffsets: Array<[number, number]> = [];
  const outerOffsets: Array<[number, number]> = [];
  for (let a = 0; a < 8; a++) {
    const theta = (a * Math.PI) / 4;
    ringOffsets.push([Math.round(Math.cos(theta) * rRing), Math.round(Math.sin(theta) * rRing)]);
  }
  const rOuter = Math.round(Math.min(bubbleW, bubbleH) * 0.64);
  for (let a = 0; a < 4; a++) {
    const theta = (a * Math.PI) / 2 + Math.PI / 4;
    outerOffsets.push([Math.round(Math.cos(theta) * rOuter), Math.round(Math.sin(theta) * rOuter)]);
  }

  const scoreShift = (dx: number, dy: number): number => {
    let totalScore = 0;
    let validCount = 0;
    const coreVals: number[] = [];

    for (let i = 0; i < sampleBubbles.length; i++) {
      const b = sampleBubbles[i];
      const cx = Math.round(b.x + halfW + dx);
      const cy = Math.round(b.y + halfH + dy);
      if (cx - rOuter < 1 || cy - rOuter < 1 || cx + rOuter >= imageWidth - 1 || cy + rOuter >= imageHeight - 1) {
        continue;
      }

      let ringSum = 0;
      for (let k = 0; k < 8; k++) {
        ringSum += grayData[(cy + ringOffsets[k][1]) * imageWidth + (cx + ringOffsets[k][0])];
      }
      const ringMean = ringSum / 8;

      let outerSum = 0;
      for (let k = 0; k < 4; k++) {
        outerSum += grayData[(cy + outerOffsets[k][1]) * imageWidth + (cx + outerOffsets[k][0])];
      }
      const outerMean = outerSum / 4;

      const cVal =
        (grayData[cy * imageWidth + cx] +
          grayData[(cy - 1) * imageWidth + cx] +
          grayData[(cy + 1) * imageWidth + cx] +
          grayData[cy * imageWidth + (cx - 1)] +
          grayData[cy * imageWidth + (cx + 1)]) / 5;
      coreVals.push(cVal);

      totalScore += Math.max(0, outerMean - ringMean);
      validCount++;
    }

    if (validCount === 0) return -Infinity;
    const ringContrast = totalScore / validCount;

    coreVals.sort((a, b) => a - b);
    const q10 = coreVals[Math.floor(coreVals.length * 0.10)] ?? 200;
    const q75 = coreVals[Math.floor(coreVals.length * 0.75)] ?? 240;
    const fillContrast = Math.max(0, q75 - q10) * 0.35;

    return ringContrast + fillContrast - 0.25 * (dx * dx + dy * dy);
  };

  const zeroScore = scoreShift(0, 0);
  let bestDx = 0;
  let bestDy = 0;
  let bestScore = zeroScore;

  const coarseStep = maxShift >= 4 ? 2 : 1;
  for (let dy = -maxShift; dy <= maxShift; dy += coarseStep) {
    for (let dx = -maxShift; dx <= maxShift; dx += coarseStep) {
      if (dx === 0 && dy === 0) continue;
      const s = scoreShift(dx, dy);
      if (s > bestScore) {
        bestScore = s;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  if (coarseStep > 1) {
    const cx0 = bestDx;
    const cy0 = bestDy;
    for (let dy = cy0 - 1; dy <= cy0 + 1; dy++) {
      for (let dx = cx0 - 1; dx <= cx0 + 1; dx++) {
        if (Math.abs(dx) > maxShift || Math.abs(dy) > maxShift) continue;
        const s = scoreShift(dx, dy);
        if (s > bestScore) {
          bestScore = s;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }
  }

  const improvement = bestScore - zeroScore;
  if (improvement < 2.5) return { dx: 0, dy: 0, improvement: 0 };
  return { dx: bestDx, dy: bestDy, improvement };
}

export function refineBubbleCentroid(
  grayData: Uint8ClampedArray | Uint8Array,
  imageWidth: number,
  imageHeight: number,
  nomX: number,
  nomY: number,
  bubbleW: number,
  bubbleH: number,
  maxDrift: number = 2,
  lambda: number = 2.0
): { cx: number; cy: number; dx: number; dy: number } {
  let bestDx = 0;
  let bestDy = 0;
  let minEnergy = Infinity;

  const coreW = Math.max(3, Math.round(bubbleW * 0.48));
  const coreH = Math.max(3, Math.round(bubbleH * 0.48));

  for (let dy = -maxDrift; dy <= maxDrift; dy++) {
    for (let dx = -maxDrift; dx <= maxDrift; dx++) {
      const rx = Math.round(nomX + (bubbleW - coreW) / 2 + dx);
      const ry = Math.round(nomY + (bubbleH - coreH) / 2 + dy);
      if (rx < 0 || ry < 0 || rx + coreW >= imageWidth || ry + coreH >= imageHeight) continue;

      let sum = 0;
      let count = 0;
      for (let y = ry; y < ry + coreH; y++) {
        const rowOffset = y * imageWidth;
        for (let x = rx; x < rx + coreW; x++) {
          sum += grayData[rowOffset + x];
          count++;
        }
      }
      if (count === 0) continue;
      const energy = sum / count + lambda * (dx * dx + dy * dy);
      if (energy < minEnergy) {
        minEnergy = energy;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  return { cx: nomX + bestDx, cy: nomY + bestDy, dx: bestDx, dy: bestDy };
}

export function sampleBubbleConcentric(
  grayData: Uint8ClampedArray | Uint8Array,
  imageWidth: number,
  imageHeight: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): ConcentricBubbleMetrics {
  const centerX = bx + bw / 2;
  const centerY = by + bh / 2;
  const minDim = Math.min(bw, bh);
  const coreR = Math.max(2.5, minDim * 0.34);
  const bgInnerR = minDim * 0.58;
  const bgOuterR = minDim * 0.84;

  const yMin = Math.max(0, Math.floor(centerY - bgOuterR));
  const yMax = Math.min(imageHeight - 1, Math.ceil(centerY + bgOuterR));
  const xMin = Math.max(0, Math.floor(centerX - bgOuterR));
  const xMax = Math.min(imageWidth - 1, Math.ceil(centerX + bgOuterR));

  const corePixels: number[] = [];
  const bgPixels: number[] = [];
  const coreR2 = coreR * coreR;
  const bgIn2 = bgInnerR * bgInnerR;
  const bgOut2 = bgOuterR * bgOuterR;

  let sum = 0;
  let sumSq = 0;

  for (let y = yMin; y <= yMax; y++) {
    const dy = y - centerY;
    const dy2 = dy * dy;
    const rowOffset = y * imageWidth;
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - centerX;
      const d2 = dx * dx + dy2;
      if (d2 <= coreR2) {
        const v = grayData[rowOffset + x];
        corePixels.push(v);
        sum += v;
        sumSq += v * v;
      } else if (d2 >= bgIn2 && d2 <= bgOut2) {
        bgPixels.push(grayData[rowOffset + x]);
      }
    }
  }

  if (corePixels.length === 0) {
    return { mean: 255, darkestQ25: 255, stdDev: 0, fillRatio: 0, homogeneity: 1.0, localBg: 245, opticalDensity: 0 };
  }

  let localBg = 245;
  if (bgPixels.length >= 4) {
    bgPixels.sort((a, b) => a - b);
    localBg = bgPixels[Math.floor(bgPixels.length * 0.75)];
  }
  localBg = Math.max(110, localBg);

  const n = corePixels.length;
  const mean = sum / n;
  const stdDev = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  corePixels.sort((a, b) => a - b);
  const darkestQ25 = corePixels[Math.floor(n * 0.25)];

  const adaptiveCutoff = Math.min(localBg - 28, localBg * 0.80);
  let darkCount = 0;
  for (let i = 0; i < n; i++) {
    if (corePixels[i] < adaptiveCutoff) darkCount++;
  }
  const fillRatio = darkCount / n;
  const homogeneity = 1.0 / (1.0 + stdDev / 20.0);
  const opticalDensity = Math.max(0, Math.min(1, (localBg - mean) / Math.max(localBg, 60)));

  return { mean, darkestQ25, stdDev, fillRatio, homogeneity, localBg, opticalDensity };
}

export function extractPatchTexture(
  grayData: Uint8ClampedArray | Uint8Array,
  imageWidth: number,
  imageHeight: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  thresholdCutoff: number = 168
): PatchTextureMetrics {
  const rx = Math.max(0, Math.round(cx));
  const ry = Math.max(0, Math.round(cy));
  const maxW = Math.min(w, imageWidth - rx);
  const maxH = Math.min(h, imageHeight - ry);
  if (maxW <= 0 || maxH <= 0) return { mean: 255, stdDev: 0, fillRatio: 0, homogeneity: 1.0 };

  let sum = 0;
  let sumSq = 0;
  let darkCount = 0;
  let total = 0;
  const midX = rx + maxW / 2;
  const midY = ry + maxH / 2;
  const radius = Math.min(maxW, maxH) / 2;

  for (let y = ry; y < ry + maxH; y++) {
    const rowOffset = y * imageWidth;
    for (let x = rx; x < rx + maxW; x++) {
      if (Math.hypot(x - midX, y - midY) <= radius) {
        const val = grayData[rowOffset + x];
        sum += val;
        sumSq += val * val;
        if (val < thresholdCutoff) darkCount++;
        total++;
      }
    }
  }
  if (total === 0) return { mean: 255, stdDev: 0, fillRatio: 0, homogeneity: 1.0 };
  const mean = sum / total;
  const stdDev = Math.sqrt(Math.max(0, sumSq / total - mean * mean));
  return { mean, stdDev, fillRatio: darkCount / total, homogeneity: 1.0 / (1.0 + stdDev / 20.0) };
}

function gaussianPdf(x: number, mean: number, variance: number): number {
  const v = Math.max(12, variance);
  const diff = x - mean;
  return (1.0 / Math.sqrt(2 * Math.PI * v)) * Math.exp(-(diff * diff) / (2 * v));
}

export function fitTriModalGMM(samples: number[], maxIter: number = 15, tol: number = 1e-3): GMMParameters {
  const n = samples.length;
  if (n < 6) {
    return { means: [90, 165, 220], variances: [350, 250, 150], weights: [0.20, 0.10, 0.70], converged: true, iterations: 0, logLikelihood: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const q05 = sorted[Math.floor(n * 0.05)];
  const q30 = sorted[Math.floor(n * 0.30)];
  const q80 = sorted[Math.floor(n * 0.80)];

  let means: [number, number, number] = [Math.min(q05, 120), Math.max(q05 + 15, Math.min(q30, 185)), Math.max(q30 + 15, q80)];
  let variances: [number, number, number] = [400, 300, 200];
  let weights: [number, number, number] = [0.20, 0.15, 0.65];

  const gamma = new Float64Array(n * 3);
  let prevLogL = -Infinity;
  let converged = false;
  let finalIter = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    finalIter = iter + 1;
    let logLikelihood = 0;
    for (let i = 0; i < n; i++) {
      const x = samples[i];
      let sumP = 0;
      const p = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        p[k] = weights[k] * gaussianPdf(x, means[k], variances[k]);
        sumP += p[k];
      }
      if (sumP <= 1e-12) { p[0] = p[1] = p[2] = 1 / 3; sumP = 1.0; }
      for (let k = 0; k < 3; k++) gamma[i * 3 + k] = p[k] / sumP;
      logLikelihood += Math.log(Math.max(1e-12, sumP));
    }

    const dirichletPrior = 2.0;
    for (let k = 0; k < 3; k++) {
      let Nk = 0, weightedSum = 0;
      for (let i = 0; i < n; i++) {
        const g = gamma[i * 3 + k];
        Nk += g;
        weightedSum += g * samples[i];
      }
      weights[k] = (Nk + dirichletPrior) / (n + 3 * dirichletPrior);
      if (Nk > 1e-6) means[k] = weightedSum / Nk;
      let varSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = samples[i] - means[k];
        varSum += gamma[i * 3 + k] * diff * diff;
      }
      if (Nk > 1e-6) variances[k] = Math.max(16, varSum / Nk);
    }

    if (means[0] > means[1] || means[1] > means[2]) {
      const indexed = [0, 1, 2].sort((a, b) => means[a] - means[b]);
      means = [means[indexed[0]], means[indexed[1]], means[indexed[2]]];
      variances = [variances[indexed[0]], variances[indexed[1]], variances[indexed[2]]];
      weights = [weights[indexed[0]], weights[indexed[1]], weights[indexed[2]]];
    }

    if (Math.abs(logLikelihood - prevLogL) < tol) {
      converged = true;
      prevLogL = logLikelihood;
      break;
    }
    prevLogL = logLikelihood;
  }

  return { means, variances, weights, converged, iterations: finalIter, logLikelihood: prevLogL };
}

export function computeGMMPosterior(val: number, gmm: GMMParameters): GMMPosterior {
  const p = [0, 0, 0];
  let sumP = 0;
  for (let k = 0; k < 3; k++) {
    p[k] = gmm.weights[k] * gaussianPdf(val, gmm.means[k], gmm.variances[k]);
    sumP += p[k];
  }
  if (sumP <= 1e-12) return { pFilled: 0, pErased: 0, pClean: 1.0 };
  return { pFilled: p[0] / sumP, pErased: p[1] / sumP, pClean: p[2] / sumP };
}
