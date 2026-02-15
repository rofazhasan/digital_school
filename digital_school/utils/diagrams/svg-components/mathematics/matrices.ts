/**
 * Professional Matrix Components
 * Matrix multiplication and transformations
 */

export interface MatrixOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create matrix multiplication diagram
 */
export function createMatrixMultiplication(options: MatrixOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="matrix-multiplication" xmlns="http://www.w3.org/2000/svg">
      <!-- Matrix A (2x3) -->
      <g id="matrix-a">
        <text x="40" y="30" font-size="10" fill="#E74C3C" font-weight="600">A =</text>
        <rect x="55" y="35" width="60" height="50" fill="none" stroke="#E74C3C" stroke-width="2"/>
        ${[
            [1, 2, 3],
            [4, 5, 6]
        ].map((row, i) =>
            row.map((val, j) =>
                `<text x="${70 + j * 20}" y="${55 + i * 20}" font-size="10" fill="#2C3E50" text-anchor="middle">${val}</text>`
            ).join('')
        ).join('')}
        <text x="85" y="100" font-size="8" fill="#7F8C8D" text-anchor="middle">2×3</text>
      </g>
      
      <!-- Multiplication sign -->
      <text x="125" y="65" font-size="14" fill="#2C3E50">×</text>
      
      <!-- Matrix B (3x2) -->
      <g id="matrix-b">
        <text x="145" y="30" font-size="10" fill="#3498DB" font-weight="600">B =</text>
        <rect x="160" y="35" width="45" height="65" fill="none" stroke="#3498DB" stroke-width="2"/>
        ${[
            [1, 2],
            [3, 4],
            [5, 6]
        ].map((row, i) =>
            row.map((val, j) =>
                `<text x="${172 + j * 20}" y="${50 + i * 20}" font-size="10" fill="#2C3E50" text-anchor="middle">${val}</text>`
            ).join('')
        ).join('')}
        <text x="182" y="115" font-size="8" fill="#7F8C8D" text-anchor="middle">3×2</text>
      </g>
      
      <!-- Equals sign -->
      <text x="215" y="65" font-size="14" fill="#2C3E50">=</text>
      
      <!-- Result note -->
      <text x="120" y="130" font-size="9" fill="#27AE60" text-anchor="middle">
        Result: 2×2 matrix
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Matrix Multiplication
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create matrix transformation diagram
 */
export function createMatrixTransformation(options: MatrixOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="matrix-transformation" xmlns="http://www.w3.org/2000/svg">
      <!-- Original vector -->
      <g id="original">
        <line x1="40" y1="100" x2="40" y2="140" stroke="#7F8C8D" stroke-width="1.5"/>
        <line x1="40" y1="100" x2="100" y2="100" stroke="#7F8C8D" stroke-width="1.5"/>
        
        <line x1="40" y1="100" x2="70" y2="70" stroke="#E74C3C" stroke-width="3"/>
        <polygon points="70,70 65,73 68,67" fill="#E74C3C"/>
        <text x="55" y="80" font-size="10" fill="#E74C3C" font-weight="600">v</text>
      </g>
      
      <!-- Transformation matrix -->
      <g id="transform-matrix">
        <rect x="105" y="70" width="40" height="40" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
        <text x="125" y="85" font-size="9" fill="#2C3E50" text-anchor="middle">cos θ  -sin θ</text>
        <text x="125" y="100" font-size="9" fill="#2C3E50" text-anchor="middle">sin θ   cos θ</text>
        <text x="125" y="60" font-size="9" fill="#3498DB" text-anchor="middle">Rotation</text>
      </g>
      
      <!-- Arrow -->
      <line x1="150" y1="90" x2="165" y2="90" stroke="#F39C12" stroke-width="2"/>
      <polygon points="165,87 170,90 165,93" fill="#F39C12"/>
      
      <!-- Transformed vector -->
      <g id="transformed">
        <line x1="180" y1="100" x2="180" y2="140" stroke="#7F8C8D" stroke-width="1.5"/>
        <line x1="180" y1="100" x2="220" y2="100" stroke="#7F8C8D" stroke-width="1.5"/>
        
        <line x1="180" y1="100" x2="190" y2="120" stroke="#27AE60" stroke-width="3"/>
        <polygon points="190,120 185,118 188,114" fill="#27AE60"/>
        <text x="195" y="115" font-size="10" fill="#27AE60" font-weight="600">v'</text>
      </g>
      
      <!-- Label -->
      <text x="110" y="145" font-size="9" fill="#9B59B6" text-anchor="middle">
        Rotation transformation
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Matrix Transformation (Rotation)
        </text>
      ` : ''}
    </svg>
  `;
}
