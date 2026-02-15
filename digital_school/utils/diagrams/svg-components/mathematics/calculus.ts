/**
 * Professional Calculus Components
 * Derivatives, integrals, limits
 */

export interface CalculusOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create derivative visualization
 */
export function createDerivative(options: CalculusOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="derivative" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="160" x2="190" y2="160" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Function curve (parabola) -->
      <path d="M 40,150 Q 90,40 140,150" stroke="#3498DB" stroke-width="3" fill="none"/>
      <text x="145" y="145" font-size="10" fill="#3498DB">f(x)</text>
      
      <!-- Point on curve -->
      <circle cx="90" cy="40" r="4" fill="#E74C3C"/>
      <text x="95" y="35" font-size="9" fill="#E74C3C">(x, f(x))</text>
      
      <!-- Tangent line -->
      <line x1="50" y1="60" x2="130" y2="20" stroke="#E74C3C" stroke-width="2.5" stroke-dasharray="5,3"/>
      <text x="135" y="20" font-size="10" fill="#E74C3C">Tangent</text>
      
      <!-- Slope indicator -->
      <line x1="90" y1="40" x2="110" y2="40" stroke="#27AE60" stroke-width="2"/>
      <line x1="110" y1="40" x2="110" y2="30" stroke="#27AE60" stroke-width="2"/>
      <text x="115" y="38" font-size="9" fill="#27AE60">Δy</text>
      <text x="95" y="52" font-size="9" fill="#27AE60">Δx</text>
      
      <!-- Formula -->
      <text x="100" y="175" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        f'(x) = lim<tspan font-size="8" baseline-shift="sub">h→0</tspan> [f(x+h) - f(x)]/h
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Derivative (Slope of Tangent)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create integral visualization (area under curve)
 */
export function createIntegral(options: CalculusOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="integral" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#3498DB;stop-opacity:0.2" />
        </linearGradient>
      </defs>
      
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="160" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="160" x2="190" y2="160" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Function curve -->
      <path d="M 40,120 Q 80,60 120,80 Q 160,100 180,70" 
            stroke="#3498DB" stroke-width="3" fill="none"/>
      <text x="185" y="70" font-size="10" fill="#3498DB">f(x)</text>
      
      <!-- Area under curve (filled) -->
      <path d="M 60,160 L 60,100 Q 80,60 100,70 Q 120,80 140,90 L 140,160 Z" 
            fill="url(#areaGrad)"/>
      
      <!-- Bounds -->
      <line x1="60" y1="100" x2="60" y2="165" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
      <line x1="140" y1="90" x2="140" y2="165" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="60" y="175" font-size="10" fill="#E74C3C" text-anchor="middle">a</text>
      <text x="140" y="175" font-size="10" fill="#E74C3C" text-anchor="middle">b</text>
      
      <!-- Riemann rectangles (示意) -->
      ${[0, 1, 2, 3].map(i => {
        const x = 60 + i * 20;
        const h = 100 - i * 5 - (i % 2) * 10;
        return `<rect x="${x}" y="${h}" width="20" height="${160 - h}" 
                      fill="none" stroke="#F39C12" stroke-width="1" opacity="0.5"/>`;
    }).join('')}
      
      <!-- Formula -->
      <text x="20" y="90" font-size="18" fill="#2C3E50" font-family="serif">∫</text>
      <text x="25" y="80" font-size="8" fill="#E74C3C">b</text>
      <text x="25" y="100" font-size="8" fill="#E74C3C">a</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Integral (Area Under Curve)
        </text>
      ` : ''}
    </svg>
  `;
}
