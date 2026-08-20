/**
 * Quality Assessment Engine
 * 
 * Computes image quality metrics (blur, brightness, contrast, glare, marker confidence, perspective angle)
 * and generates user guidance instructions.
 */

export interface QualityMetrics {
  blurScore: number;            // Variance of Laplacian / gradient variance (higher = sharper)
  brightnessScore: number;      // Average grayscale intensity 0..255
  contrastScore: number;        // Standard deviation of grayscale intensities
  glareRatio: number;           // Percentage of overexposed pixels (>250)
  markerConfidence: number;     // 4-Corner marker detection confidence 0..1
  perspectiveSkew: number;      // Angular skew distortion degree
  isQualityPassed: boolean;     // True if all quality gates pass
  userInstructions: string[];   // Guidance messages for camera user
}

export function evaluateImageQuality(
  imageData: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  markerConfidence: number = 1.0,
  perspectiveSkew: number = 0.0
): QualityMetrics {
  const totalPixels = width * height;

  let sumGray = 0;
  let sumGraySq = 0;
  let glarePixels = 0;
  let laplacianVarSum = 0;
  let sampleCount = 0;

  const step = 2; // Sample every 2nd pixel for real-time speed

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const gray = (imageData[idx] * 299 + imageData[idx + 1] * 587 + imageData[idx + 2] * 114) / 1000;

      sumGray += gray;
      sumGraySq += gray * gray;

      if (gray > 250) {
        glarePixels++;
      }

      // Laplacian kernel [0, 1, 0; 1, -4, 1; 0, 1, 0] for blur estimation
      const idxUp = ((y - 1) * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const idxLeft = (y * width + (x - 1)) * 4;
      const idxRight = (y * width + (x + 1)) * 4;

      const grayUp = (imageData[idxUp] * 299 + imageData[idxUp + 1] * 587 + imageData[idxUp + 2] * 114) / 1000;
      const grayDown = (imageData[idxDown] * 299 + imageData[idxDown + 1] * 587 + imageData[idxDown + 2] * 114) / 1000;
      const grayLeft = (imageData[idxLeft] * 299 + imageData[idxLeft + 1] * 587 + imageData[idxLeft + 2] * 114) / 1000;
      const grayRight = (imageData[idxRight] * 299 + imageData[idxRight + 1] * 587 + imageData[idxRight + 2] * 114) / 1000;

      const laplacian = Math.abs(grayUp + grayDown + grayLeft + grayRight - 4 * gray);
      laplacianVarSum += laplacian * laplacian;
      sampleCount++;
    }
  }

  const brightnessScore = sampleCount > 0 ? sumGray / sampleCount : 128;
  const variance = sampleCount > 0 ? (sumGraySq / sampleCount) - (brightnessScore * brightnessScore) : 0;
  const contrastScore = Math.sqrt(Math.max(0, variance));
  const glareRatio = sampleCount > 0 ? glarePixels / sampleCount : 0;
  const blurScore = sampleCount > 0 ? laplacianVarSum / sampleCount : 0;

  const userInstructions: string[] = [];

  if (markerConfidence < 0.70) {
    userInstructions.push('Keep all four corner markers visible');
  }

  if (blurScore < 60) {
    userInstructions.push('Hold camera steady');
  }

  if (brightnessScore < 50) {
    userInstructions.push('Improve lighting');
  } else if (brightnessScore > 248 && contrastScore < 20) {
    userInstructions.push('Reduce lighting');
  }

  // Only flag glare if high brightness has caused low contrast (washed out)
  const isActualGlare = glareRatio > 0.40 && contrastScore < 25;
  if (isActualGlare) {
    userInstructions.push('Reduce glare / tilt camera slightly');
  }

  if (contrastScore < 18) {
    userInstructions.push('Improve contrast / adjust distance');
  }

  if (perspectiveSkew > 0.20) {
    userInstructions.push('Hold camera perpendicular to paper');
  }

  const isQualityPassed =
    markerConfidence >= 0.70 &&
    blurScore >= 60 &&
    brightnessScore >= 50 &&
    brightnessScore <= 250 &&
    (!isActualGlare) &&
    contrastScore >= 18;

  return {
    blurScore,
    brightnessScore,
    contrastScore,
    glareRatio,
    markerConfidence,
    perspectiveSkew,
    isQualityPassed,
    userInstructions: userInstructions.length > 0 ? userInstructions : ['Position paper clearly in view']
  };
}
