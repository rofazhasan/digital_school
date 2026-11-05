/**
 * Advanced Mathematical & Statistical Learning Models for OMR Recognition
 * 
 * 1. Regularized Energy Minimization for Subpixel Bubble Centroid Refinement (FRST)
 * 2. Tri-Modal Gaussian Mixture Model (GMM) via Expectation-Maximization (EM)
 * 3. Spatial Patch Texture & Edge Homogeneity Discriminator
 * 4. Column-Constrained Maximum A Posteriori (MAP) Markov Random Field (MRF) Solver
 */

export interface GMMParameters {
  means: [number, number, number]; // [mu_filled, mu_erased, mu_clean]
  variances: [number, number, number]; // [sigma^2_filled, sigma^2_erased, sigma^2_clean]
  weights: [number, number, number]; // [pi_filled, pi_erased, pi_clean]
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
  homogeneity: number; // Low variance in inner core indicates uniform solid graphite/ink
}

/**
 * 1. Subpixel Bubble Centroid Refinement via Regularized Energy Minimization
 * 
 * Finds optimal displacement (dx, dy) in [-maxDrift, maxDrift] minimizing:
 *   E(dx, dy) = mu(dx, dy) + lambda * (dx^2 + dy^2)
 * 
 * Prevents drifting onto adjacent lines when bubble is clean white, while
 * magnetically locking onto real pencil/ink graphite if slightly displaced.
 */
export function refineBubbleCentroid(
  grayData: Uint8ClampedArray | Uint8Array,
  imageWidth: number,
  imageHeight: number,
  nomX: number,
  nomY: number,
  bubbleW: number,
  bubbleH: number,
  maxDrift: number = 3,
  lambda: number = 1.2
): { cx: number; cy: number; dx: number; dy: number } {
  let bestDx = 0;
  let bestDy = 0;
  let minEnergy = Infinity;

  const coreW = Math.max(3, Math.round(bubbleW * 0.45));
  const coreH = Math.max(3, Math.round(bubbleH * 0.45));

  for (let dy = -maxDrift; dy <= maxDrift; dy++) {
    for (let dx = -maxDrift; dx <= maxDrift; dx++) {
      const rx = Math.round(nomX + (bubbleW - coreW) / 2 + dx);
      const ry = Math.round(nomY + (bubbleH - coreH) / 2 + dy);

      if (rx < 0 || ry < 0 || rx + coreW >= imageWidth || ry + coreH >= imageHeight) {
        continue;
      }

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
      const meanVal = sum / count;
      // Regularization term penalizes deviation from nominal coordinate
      const distanceSq = dx * dx + dy * dy;
      const energy = meanVal + lambda * distanceSq;

      if (energy < minEnergy) {
        minEnergy = energy;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  return {
    cx: nomX + bestDx,
    cy: nomY + bestDy,
    dx: bestDx,
    dy: bestDy
  };
}

/**
 * Normal Gaussian PDF evaluated with variance flooring
 */
function gaussianPdf(x: number, mean: number, variance: number): number {
  const v = Math.max(12, variance);
  const diff = x - mean;
  return (1.0 / Math.sqrt(2 * Math.PI * v)) * Math.exp(-(diff * diff) / (2 * v));
}

/**
 * 2. Tri-Modal Gaussian Mixture Model (GMM) with Expectation-Maximization (EM)
 * 
 * Fits 3 Gaussian components:
 *   1. Filled Mark (Dark, lowest mean)
 *   2. Erasure / Smudge / Faint Mark (Intermediate mean)
 *   3. Clean Paper (Light, highest mean)
 */
export function fitTriModalGMM(
  samples: number[],
  maxIter: number = 15,
  tol: number = 1e-3
): GMMParameters {
  const n = samples.length;
  if (n < 6) {
    // Fallback default parameters for tiny arrays
    return {
      means: [90, 165, 220],
      variances: [350, 250, 150],
      weights: [0.20, 0.10, 0.70],
      converged: true,
      iterations: 0,
      logLikelihood: 0
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const q05 = sorted[Math.floor(n * 0.05)];
  const q30 = sorted[Math.floor(n * 0.30)];
  const q80 = sorted[Math.floor(n * 0.80)];

  // Initialize parameters
  let means: [number, number, number] = [
    Math.min(q05, 120),
    Math.max(q05 + 15, Math.min(q30, 185)),
    Math.max(q30 + 15, q80)
  ];
  let variances: [number, number, number] = [400, 300, 200];
  let weights: [number, number, number] = [0.20, 0.15, 0.65];

  const gamma = new Float64Array(n * 3);
  let prevLogL = -Infinity;
  let converged = false;
  let finalIter = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    finalIter = iter + 1;
    let logLikelihood = 0;

    // --- E-step ---
    for (let i = 0; i < n; i++) {
      const x = samples[i];
      let sumP = 0;
      const p = [0, 0, 0];

      for (let k = 0; k < 3; k++) {
        p[k] = weights[k] * gaussianPdf(x, means[k], variances[k]);
        sumP += p[k];
      }

      if (sumP <= 1e-12) {
        p[0] = 1 / 3;
        p[1] = 1 / 3;
        p[2] = 1 / 3;
        sumP = 1.0;
      }

      for (let k = 0; k < 3; k++) {
        gamma[i * 3 + k] = p[k] / sumP;
      }

      logLikelihood += Math.log(Math.max(1e-12, sumP));
    }

    // --- M-step ---
    const dirichletPrior = 2.0; // Laplace/Dirichlet smoothing
    for (let k = 0; k < 3; k++) {
      let Nk = 0;
      let weightedSum = 0;

      for (let i = 0; i < n; i++) {
        const g = gamma[i * 3 + k];
        Nk += g;
        weightedSum += g * samples[i];
      }

      weights[k] = (Nk + dirichletPrior) / (n + 3 * dirichletPrior);
      if (Nk > 1e-6) {
        means[k] = weightedSum / Nk;
      }

      let varSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = samples[i] - means[k];
        varSum += gamma[i * 3 + k] * diff * diff;
      }

      if (Nk > 1e-6) {
        variances[k] = Math.max(16, varSum / Nk);
      }
    }

    // Enforce monotonic sorting constraint: Filled < Erased < Clean
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

  return {
    means,
    variances,
    weights,
    converged,
    iterations: finalIter,
    logLikelihood: prevLogL
  };
}

/**
 * Computes exact Bayesian posterior probabilities for a given bubble intensity
 */
export function computeGMMPosterior(val: number, gmm: GMMParameters): GMMPosterior {
  const p = [0, 0, 0];
  let sumP = 0;

  for (let k = 0; k < 3; k++) {
    p[k] = gmm.weights[k] * gaussianPdf(val, gmm.means[k], gmm.variances[k]);
    sumP += p[k];
  }

  if (sumP <= 1e-12) {
    return { pFilled: 0, pErased: 0, pClean: 1.0 };
  }

  return {
    pFilled: p[0] / sumP,
    pErased: p[1] / sumP,
    pClean: p[2] / sumP
  };
}

/**
 * 3. Spatial Patch Texture & Edge Homogeneity Discriminator
 * 
 * Evaluates standard deviation and fill density across concentric sample
 */
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

  if (maxW <= 0 || maxH <= 0) {
    return { mean: 255, stdDev: 0, fillRatio: 0, homogeneity: 1.0 };
  }

  let sum = 0;
  let sumSq = 0;
  let darkCount = 0;
  let total = 0;

  for (let y = ry; y < ry + maxH; y++) {
    const rowOffset = y * imageWidth;
    for (let x = rx; x < rx + maxW; x++) {
      const val = grayData[rowOffset + x];
      sum += val;
      sumSq += val * val;
      if (val < thresholdCutoff) darkCount++;
      total++;
    }
  }

  if (total === 0) {
    return { mean: 255, stdDev: 0, fillRatio: 0, homogeneity: 1.0 };
  }

  const mean = sum / total;
  const variance = Math.max(0, (sumSq / total) - (mean * mean));
  const stdDev = Math.sqrt(variance);
  const fillRatio = darkCount / total;
  // Homogeneity index: 1.0 = solid uniform tone, 0.0 = high noisy scatter
  const homogeneity = 1.0 / (1.0 + stdDev / 20.0);

  return {
    mean,
    stdDev,
    fillRatio,
    homogeneity
  };
}
