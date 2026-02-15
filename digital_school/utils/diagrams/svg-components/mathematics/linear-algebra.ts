/**
 * Linear Algebra Components
 * Eigenvalues/eigenvectors, vector spaces, linear transformation, determinant
 */

export interface LinearAlgebraOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create eigenvalues and eigenvectors diagram
 */
export function createEigenvaluesEigenvectors(options: LinearAlgebraOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="eigenvalues-eigenvectors" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="100" y1="30" x2="100" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,127 185,130 180,133" fill="#2C3E50"/>
      <polygon points="97,30 100,25 103,30" fill="#2C3E50"/>
      
      <!-- Original eigenvector -->
      <line x1="100" y1="130" x2="140" y2="90" stroke="#3498DB" stroke-width="3"/>
      <polygon points="140,90 145,88 142,93" fill="#3498DB"/>
      <text x="145" y="85" font-size="9" fill="#3498DB">v</text>
      
      <!-- Transformed eigenvector (scaled) -->
      <line x1="100" y1="130" x2="160" y2="70" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="160,70 165,68 162,73" fill="#E74C3C"/>
      <text x="165" y="65" font-size="9" fill="#E74C3C">Av = λv</text>
      
      <!-- Eigenvalue label -->
      <text x="130" y="105" font-size="9" fill="#F39C12">λ = eigenvalue</text>
      
      <!-- Equation -->
      <text x="100" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        Av = λv
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Eigenvalues & Eigenvectors
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create vector space diagram
 */
export function createVectorSpace(options: LinearAlgebraOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="vector-space" xmlns="http://www.w3.org/2000/svg">
      <!-- Plane representing vector space -->
      <ellipse cx="100" cy="90" rx="70" ry="40" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="100" y="75" font-size="11" fill="#3498DB" text-anchor="middle" font-weight="600">Vector Space V</text>
      
      <!-- Basis vectors -->
      <line x1="70" y1="100" x2="90" y2="85" stroke="#E74C3C" stroke-width="2.5"/>
      <polygon points="90,85 95,83 92,88" fill="#E74C3C"/>
      <text x="95" y="80" font-size="9" fill="#E74C3C">v₁</text>
      
      <line x1="70" y1="100" x2="85" y2="115" stroke="#27AE60" stroke-width="2.5"/>
      <polygon points="85,115 90,117 87,112" fill="#27AE60"/>
      <text x="90" y="120" font-size="9" fill="#27AE60">v₂</text>
      
      <!-- Linear combination -->
      <line x1="70" y1="100" x2="110" y2="95" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="110,95 115,93 112,98" fill="#F39C12"/>
      <text x="115" y="90" font-size="9" fill="#F39C12">av₁ + bv₂</text>
      
      <!-- Properties -->
      <text x="100" y="140" font-size="9" fill="#7F8C8D" text-anchor="middle">Closed under + and ·</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Vector Space & Basis
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create linear transformation diagram
 */
export function createLinearTransformation(options: LinearAlgebraOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="linear-transformation" xmlns="http://www.w3.org/2000/svg">
      <!-- Input space -->
      <g id="input">
        <rect x="30" y="50" width="60" height="60" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="60" y="40" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Domain</text>
        
        <!-- Input vector -->
        <line x1="45" y1="95" x2="65" y2="75" stroke="#E74C3C" stroke-width="2.5"/>
        <polygon points="65,75 70,73 67,78" fill="#E74C3C"/>
        <text x="70" y="70" font-size="9" fill="#E74C3C">v</text>
      </g>
      
      <!-- Transformation arrow -->
      <line x1="95" y1="80" x2="135" y2="80" stroke="#F39C12" stroke-width="3"/>
      <polygon points="135,77 140,80 135,83" fill="#F39C12"/>
      <text x="117" y="75" font-size="10" fill="#F39C12" font-weight="600">T</text>
      
      <!-- Output space -->
      <g id="output">
        <rect x="145" y="50" width="60" height="60" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="175" y="40" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Codomain</text>
        
        <!-- Output vector -->
        <line x1="160" y1="95" x2="185" y2="70" stroke="#27AE60" stroke-width="2.5"/>
        <polygon points="185,70 190,68 187,73" fill="#27AE60"/>
        <text x="190" y="65" font-size="9" fill="#27AE60">T(v)</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Linear Transformation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create determinant geometric interpretation diagram
 */
export function createDeterminantGeometric(options: LinearAlgebraOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="determinant-geometric" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="50" y1="30" x2="50" y2="150" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Original parallelogram (unit square) -->
      <path d="M 50,130 L 90,130 L 90,90 L 50,90 Z" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="70" y="115" font-size="9" fill="#3498DB" text-anchor="middle">Area = 1</text>
      
      <!-- Transformed parallelogram -->
      <path d="M 110,130 L 160,130 L 150,70 L 100,70 Z" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="130" y="105" font-size="9" fill="#E74C3C" text-anchor="middle">Area = |det(A)|</text>
      
      <!-- Transformation arrow -->
      <line x1="95" y1="110" x2="105" y2="110" stroke="#F39C12" stroke-width="2"/>
      <polygon points="105,107 110,110 105,113" fill="#F39C12"/>
      <text x="100" y="105" font-size="9" fill="#F39C12">A</text>
      
      <!-- Determinant formula -->
      <text x="100" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        det(A) = scaling factor
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Determinant (Area Scaling)
        </text>
      ` : ''}
    </svg>
  `;
}
