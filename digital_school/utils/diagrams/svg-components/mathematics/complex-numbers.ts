/**
 * Complex Numbers Components
 * Complex plane (Argand diagram), Euler's formula
 */

export interface ComplexNumbersOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create complex plane (Argand diagram)
 */
export function createComplexPlane(options: ComplexNumbersOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="complex-plane" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="100" y1="30" x2="100" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,127 185,130 180,133" fill="#2C3E50"/>
      <polygon points="97,30 100,25 103,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="185" y="135" font-size="10" fill="#2C3E50">Re</text>
      <text x="105" y="25" font-size="10" fill="#2C3E50">Im</text>
      
      <!-- Complex number z = a + bi -->
      <circle cx="140" cy="80" r="3" fill="#E74C3C"/>
      <text x="145" y="75" font-size="10" fill="#E74C3C">z = a + bi</text>
      
      <!-- Real part (a) -->
      <line x1="100" y1="130" x2="140" y2="130" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="120" y="145" font-size="9" fill="#3498DB">a (real)</text>
      
      <!-- Imaginary part (bi) -->
      <line x1="140" y1="130" x2="140" y2="80" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="150" y="105" font-size="9" fill="#27AE60">bi (imaginary)</text>
      
      <!-- Modulus (|z|) -->
      <line x1="100" y1="130" x2="140" y2="80" stroke="#F39C12" stroke-width="2.5"/>
      <text x="115" y="100" font-size="9" fill="#F39C12">|z|</text>
      
      <!-- Argument (θ) -->
      <path d="M 115,130 A 15,15 0 0,1 120,120" stroke="#9B59B6" stroke-width="2" fill="none"/>
      <text x="125" y="128" font-size="9" fill="#9B59B6">θ</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Complex Plane (Argand Diagram)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Euler's formula diagram
 */
export function createEulerFormula(options: ComplexNumbersOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="euler-formula" xmlns="http://www.w3.org/2000/svg">
      <!-- Unit circle -->
      <circle cx="110" cy="90" r="50" fill="none" stroke="#3498DB" stroke-width="2"/>
      <text x="110" y="35" font-size="9" fill="#3498DB" text-anchor="middle">Unit Circle</text>
      
      <!-- Axes -->
      <line x1="50" y1="90" x2="170" y2="90" stroke="#2C3E50" stroke-width="1.5"/>
      <line x1="110" y1="40" x2="110" y2="140" stroke="#2C3E50" stroke-width="1.5"/>
      
      <!-- Point on circle -->
      <circle cx="145" cy="65" r="3" fill="#E74C3C"/>
      <line x1="110" y1="90" x2="145" y2="65" stroke="#E74C3C" stroke-width="2"/>
      
      <!-- Angle θ -->
      <path d="M 125,90 A 15,15 0 0,1 130,80" stroke="#F39C12" stroke-width="2" fill="none"/>
      <text x="135" y="88" font-size="9" fill="#F39C12">θ</text>
      
      <!-- Cosine (real part) -->
      <line x1="110" y1="90" x2="145" y2="90" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="127" y="105" font-size="9" fill="#27AE60">cos θ</text>
      
      <!-- Sine (imaginary part) -->
      <line x1="145" y1="90" x2="145" y2="65" stroke="#9B59B6" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="150" y="77" font-size="9" fill="#9B59B6">sin θ</text>
      
      <!-- Euler's formula -->
      <rect x="40" y="150" width="140" height="25" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="110" y="167" font-size="12" fill="#E74C3C" text-anchor="middle" font-weight="600" font-family="Inter, sans-serif">
        e<tspan font-size="9" baseline-shift="super">iθ</tspan> = cos θ + i sin θ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Euler's Formula
        </text>
      ` : ''}
    </svg>
  `;
}
