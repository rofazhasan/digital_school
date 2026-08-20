/**
 * Homography & Perspective Warping Engine
 * 
 * Computes 3x3 Homography matrix mapping source quadrilateral to canonical rectangle,
 * and performs bilinear inverse image warping.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CornerQuad {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
}

export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

/**
 * Solves 3x3 Homography Matrix mapping src points to dst points using Gaussian Elimination.
 */
export function solveHomography(src: CornerQuad, dst: CornerQuad): Matrix3x3 {
  const ptsSrc = [src.tl, src.tr, src.br, src.bl];
  const ptsDst = [dst.tl, dst.tr, dst.br, dst.bl];

  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const x = ptsSrc[i].x;
    const y = ptsSrc[i].y;
    const X = ptsDst[i].x;
    const Y = ptsDst[i].y;

    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    B.push(X);

    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    B.push(Y);
  }

  // Gaussian elimination with partial pivoting for 8x8 system
  const N = 8;
  for (let i = 0; i < N; i++) {
    // Pivot selection
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < N; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-10) {
      throw new Error('Homography matrix computation failed: Singular matrix');
    }

    // Swap rows
    const tempA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempA;

    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    // Eliminate
    for (let k = i + 1; k < N; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < N; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  // Back substitution
  const h: number[] = new Array(8).fill(0);
  for (let i = N - 1; i >= 0; i--) {
    let sum = B[i];
    for (let j = i + 1; j < N; j++) {
      sum -= A[i][j] * h[j];
    }
    h[i] = sum / A[i][i];
  }

  return [
    h[0], h[1], h[2],
    h[3], h[4], h[5],
    h[6], h[7], 1.0
  ];
}

/**
 * Inverts a 3x3 Homography Matrix.
 */
export function invert3x3(m: Matrix3x3): Matrix3x3 {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = m;

  const det =
    m00 * (m11 * m22 - m12 * m21) -
    m01 * (m10 * m22 - m12 * m20) +
    m02 * (m10 * m21 - m11 * m20);

  if (Math.abs(det) < 1e-12) {
    throw new Error('Homography matrix inversion failed: Determinant is zero');
  }

  const invDet = 1.0 / det;

  return [
    (m11 * m22 - m12 * m21) * invDet,
    (m02 * m21 - m01 * m22) * invDet,
    (m01 * m12 - m02 * m11) * invDet,
    (m12 * m20 - m10 * m22) * invDet,
    (m00 * m22 - m02 * m20) * invDet,
    (m02 * m10 - m00 * m12) * invDet,
    (m10 * m21 - m11 * m20) * invDet,
    (m01 * m20 - m00 * m21) * invDet,
    (m00 * m11 - m01 * m10) * invDet
  ];
}

/**
 * Transforms point (x, y) using Homography matrix H.
 */
export function transformPoint(p: Point, H: Matrix3x3): Point {
  const x = p.x;
  const y = p.y;
  const z = H[6] * x + H[7] * y + H[8];
  return {
    x: (H[0] * x + H[1] * y + H[2]) / z,
    y: (H[3] * x + H[4] * y + H[5]) / z
  };
}

/**
 * Warps source Uint8ClampedArray image data (RGBA) into canonical destination buffer.
 */
export function warpPerspectiveImage(
  srcData: Uint8Array | Uint8ClampedArray,
  srcW: number,
  srcH: number,
  srcQuad: CornerQuad,
  dstW: number,
  dstH: number,
  dstQuad?: CornerQuad
): { data: Uint8ClampedArray; width: number; height: number } {
  const actualDstQuad: CornerQuad = dstQuad || {
    tl: { x: 0, y: 0 },
    tr: { x: dstW, y: 0 },
    br: { x: dstW, y: dstH },
    bl: { x: 0, y: dstH }
  };
  // Homography mapping from destination (canonical) coordinates back to source coordinates
  const H_dstToSrc = solveHomography(actualDstQuad, srcQuad);
  const dstData = new Uint8ClampedArray(dstW * dstH * 4);

  for (let yDst = 0; yDst < dstH; yDst++) {
    for (let xDst = 0; xDst < dstW; xDst++) {
      // Projected source coordinates
      const denom = H_dstToSrc[6] * xDst + H_dstToSrc[7] * yDst + H_dstToSrc[8];
      const xSrc = (H_dstToSrc[0] * xDst + H_dstToSrc[1] * yDst + H_dstToSrc[2]) / denom;
      const ySrc = (H_dstToSrc[3] * xDst + H_dstToSrc[4] * yDst + H_dstToSrc[5]) / denom;

      const dstIdx = (yDst * dstW + xDst) * 4;

      if (xSrc >= 0 && xSrc < srcW - 1 && ySrc >= 0 && ySrc < srcH - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(xSrc);
        const y0 = Math.floor(ySrc);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const dx = xSrc - x0;
        const dy = ySrc - y0;

        const idx00 = (y0 * srcW + x0) * 4;
        const idx10 = (y0 * srcW + x1) * 4;
        const idx01 = (y1 * srcW + x0) * 4;
        const idx11 = (y1 * srcW + x1) * 4;

        for (let c = 0; c < 4; c++) {
          const val =
            (1 - dx) * (1 - dy) * srcData[idx00 + c] +
            dx * (1 - dy) * srcData[idx10 + c] +
            (1 - dx) * dy * srcData[idx01 + c] +
            dx * dy * srcData[idx11 + c];
          dstData[dstIdx + c] = Math.round(val);
        }
      } else {
        // Out of bounds: fill with white background
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }
    }
  }

  return { data: dstData, width: dstW, height: dstH };
}
