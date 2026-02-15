/**
 * Professional Vector Components
 * Vector addition, components, dot product, cross product
 */

export interface VectorOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create vector addition diagram
 */
export function createVectorAddition(options: VectorOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="vector-addition" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowVec" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Origin -->
      <circle cx="40" cy="120" r="3" fill="#2C3E50"/>
      <text x="35" y="135" font-size="9" fill="#2C3E50">O</text>
      
      <!-- Vector A -->
      <line x1="40" y1="120" x2="120" y2="120" stroke="#E74C3C" stroke-width="3" marker-end="url(#arrowVec)"/>
      <text x="80" y="115" font-size="11" fill="#E74C3C" font-weight="600">A</text>
      
      <!-- Vector B (from tip of A) -->
      <line x1="120" y1="120" x2="160" y2="60" stroke="#3498DB" stroke-width="3"/>
      <polygon points="160,60 157,65 163,63" fill="#3498DB"/>
      <text x="145" y="85" font-size="11" fill="#3498DB" font-weight="600">B</text>
      
      <!-- Resultant vector (A + B) -->
      <line x1="40" y1="120" x2="160" y2="60" stroke="#27AE60" stroke-width="3" stroke-dasharray="5,3"/>
      <polygon points="160,60 155,63 158,57" fill="#27AE60"/>
      <text x="95" y="80" font-size="11" fill="#27AE60" font-weight="600">A + B</text>
      
      <!-- Parallelogram method (dashed) -->
      <line x1="40" y1="120" x2="80" y2="60" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3" opacity="0.5"/>
      <line x1="120" y1="120" x2="160" y2="60" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3" opacity="0.5"/>
      <line x1="80" y1="60" x2="160" y2="60" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3" opacity="0.5"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Vector Addition (Parallelogram Method)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create vector components diagram
 */
export function createVectorComponents(options: VectorOptions = {}): string {
    const { width = 180, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="vector-components" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="160" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="130" x2="30" y2="30" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="160,127 165,130 160,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      <text x="170" y="133" font-size="10" fill="#2C3E50">x</text>
      <text x="25" y="20" font-size="10" fill="#2C3E50">y</text>
      
      <!-- Vector -->
      <line x1="30" y1="130" x2="130" y2="50" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="130,50 125,53 128,47" fill="#E74C3C"/>
      <text x="75" y="80" font-size="12" fill="#E74C3C" font-weight="600">v</text>
      
      <!-- X component -->
      <line x1="30" y1="130" x2="130" y2="130" stroke="#3498DB" stroke-width="2.5" stroke-dasharray="5,3"/>
      <polygon points="130,127 135,130 130,133" fill="#3498DB"/>
      <text x="80" y="145" font-size="10" fill="#3498DB">v<tspan font-size="7" baseline-shift="sub">x</tspan></text>
      
      <!-- Y component -->
      <line x1="130" y1="130" x2="130" y2="50" stroke="#27AE60" stroke-width="2.5" stroke-dasharray="5,3"/>
      <polygon points="127,50 130,45 133,50" fill="#27AE60"/>
      <text x="140" y="90" font-size="10" fill="#27AE60">v<tspan font-size="7" baseline-shift="sub">y</tspan></text>
      
      <!-- Angle -->
      <path d="M 50,130 A 20,20 0 0,1 60,115" stroke="#F39C12" stroke-width="1.5" fill="none"/>
      <text x="65" y="125" font-size="10" fill="#F39C12">θ</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Vector Components
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create dot product diagram
 */
export function createDotProduct(options: VectorOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="dot-product" xmlns="http://www.w3.org/2000/svg">
      <!-- Origin -->
      <circle cx="50" cy="100" r="3" fill="#2C3E50"/>
      
      <!-- Vector A -->
      <line x1="50" y1="100" x2="140" y2="100" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="140,97 145,100 140,103" fill="#E74C3C"/>
      <text x="95" y="95" font-size="12" fill="#E74C3C" font-weight="600">A</text>
      
      <!-- Vector B -->
      <line x1="50" y1="100" x2="120" y2="50" stroke="#3498DB" stroke-width="3"/>
      <polygon points="120,50 115,53 118,47" fill="#3498DB"/>
      <text x="80" y="65" font-size="12" fill="#3498DB" font-weight="600">B</text>
      
      <!-- Angle -->
      <path d="M 70,100 A 20,20 0 0,1 80,85" stroke="#F39C12" stroke-width="2" fill="none"/>
      <text x="85" y="95" font-size="11" fill="#F39C12">θ</text>
      
      <!-- Formula -->
      <rect x="30" y="115" width="140" height="20" fill="#E6F7E6" stroke="#27AE60" stroke-width="2" rx="3"/>
      <text x="100" y="129" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        A · B = |A||B|cos θ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Dot Product (Scalar Result)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create cross product diagram
 */
export function createCrossProduct(options: VectorOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="cross-product" xmlns="http://www.w3.org/2000/svg">
      <!-- 3D perspective axes -->
      <line x1="100" y1="100" x2="160" y2="100" stroke="#7F8C8D" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="100" y1="100" x2="70" y2="130" stroke="#7F8C8D" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="100" y1="100" x2="100" y2="40" stroke="#7F8C8D" stroke-width="1.5" stroke-dasharray="3,3"/>
      
      <!-- Vector A -->
      <line x1="100" y1="100" x2="150" y2="100" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="150,97 155,100 150,103" fill="#E74C3C"/>
      <text x="130" y="95" font-size="12" fill="#E74C3C" font-weight="600">A</text>
      
      <!-- Vector B -->
      <line x1="100" y1="100" x2="75" y2="120" stroke="#3498DB" stroke-width="3"/>
      <polygon points="75,120 73,115 79,117" fill="#3498DB"/>
      <text x="82" y="115" font-size="12" fill="#3498DB" font-weight="600">B</text>
      
      <!-- Cross product result (perpendicular) -->
      <line x1="100" y1="100" x2="100" y2="50" stroke="#27AE60" stroke-width="3"/>
      <polygon points="97,50 100,45 103,50" fill="#27AE60"/>
      <text x="105" y="70" font-size="12" fill="#27AE60" font-weight="600">A × B</text>
      
      <!-- Right-hand rule indicator -->
      <text x="100" y="145" font-size="9" fill="#9B59B6" text-anchor="middle">Right-hand rule</text>
      
      <!-- Formula -->
      <text x="100" y="160" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        |A × B| = |A||B|sin θ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Cross Product (Vector Result)
        </text>
      ` : ''}
    </svg>
  `;
}
