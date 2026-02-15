/**
 * Advanced Calculus Components
 * Limits, chain rule, integration by parts, Taylor series, partial derivatives
 */

export interface CalculusAdvancedOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create limit concept diagram
 */
export function createLimitConcept(options: CalculusAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="limit-concept" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Function curve approaching limit -->
      <path d="M 40,100 Q 80,70 110,65" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <path d="M 120,65 Q 150,60 180,55" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      
      <!-- Point of discontinuity -->
      <circle cx="115" cy="65" r="3" fill="white" stroke="#E74C3C" stroke-width="2"/>
      
      <!-- Limit point -->
      <circle cx="115" cy="65" r="2" fill="#27AE60"/>
      <text x="115" y="55" font-size="9" fill="#27AE60" text-anchor="middle">L</text>
      
      <!-- x approaching a -->
      <line x1="115" y1="125" x2="115" y2="135" stroke="#3498DB" stroke-width="2"/>
      <text x="115" y="145" font-size="10" fill="#3498DB" text-anchor="middle">a</text>
      
      <!-- Limit notation -->
      <text x="110" y="25" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        lim<tspan font-size="8" baseline-shift="sub">x→a</tspan> f(x) = L
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Limit Concept
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create chain rule diagram
 */
export function createChainRule(options: CalculusAdvancedOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="chain-rule" xmlns="http://www.w3.org/2000/svg">
      <!-- Composite function -->
      <rect x="40" y="50" width="50" height="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="65" y="70" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">g(x)</text>
      
      <!-- Arrow -->
      <line x1="95" y1="65" x2="115" y2="65" stroke="#F39C12" stroke-width="2"/>
      <polygon points="115,62 120,65 115,68" fill="#F39C12"/>
      
      <!-- Outer function -->
      <rect x="125" y="50" width="50" height="30" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="150" y="70" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">f(g)</text>
      
      <!-- Chain rule formula -->
      <text x="110" y="110" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        d/dx[f(g(x))] = f'(g(x)) · g'(x)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Chain Rule
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create integration by parts diagram
 */
export function createIntegrationByParts(options: CalculusAdvancedOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="integration-by-parts" xmlns="http://www.w3.org/2000/svg">
      <!-- Formula box -->
      <rect x="30" y="40" width="160" height="70" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="5"/>
      
      <!-- Integration by parts formula -->
      <text x="110" y="65" font-size="13" fill="#E74C3C" text-anchor="middle" font-weight="600" font-family="Inter, sans-serif">
        ∫ u dv = uv - ∫ v du
      </text>
      
      <!-- Components -->
      <text x="110" y="85" font-size="10" fill="#27AE60" text-anchor="middle">
        u = first function
      </text>
      <text x="110" y="100" font-size="10" fill="#9B59B6" text-anchor="middle">
        dv = second function dx
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Integration by Parts
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Taylor series diagram
 */
export function createTaylorSeries(options: CalculusAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="taylor-series" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Original function -->
      <path d="M 40,100 Q 80,60 120,50 Q 160,45 190,50" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="190" y="45" font-size="9" fill="#E74C3C">f(x)</text>
      
      <!-- Taylor approximations -->
      <path d="M 60,90 L 160,70" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="160" y="65" font-size="8" fill="#3498DB">n=1</text>
      
      <path d="M 50,95 Q 110,60 170,55" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="170" y="50" font-size="8" fill="#27AE60">n=2</text>
      
      <!-- Center point -->
      <circle cx="110" cy="55" r="3" fill="#F39C12"/>
      <text x="110" y="145" font-size="9" fill="#F39C12" text-anchor="middle">x = a</text>
      
      <!-- Formula -->
      <text x="110" y="25" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        f(x) ≈ Σ f<tspan font-size="7" baseline-shift="super">(n)</tspan>(a)(x-a)<tspan font-size="7" baseline-shift="super">n</tspan>/n!
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Taylor Series Approximation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create partial derivatives diagram
 */
export function createPartialDerivatives(options: CalculusAdvancedOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="partial-derivatives" xmlns="http://www.w3.org/2000/svg">
      <!-- 3D surface representation -->
      <ellipse cx="100" cy="80" rx="60" ry="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="100" y="70" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">z = f(x,y)</text>
      
      <!-- Partial with respect to x -->
      <line x1="70" y1="90" x2="130" y2="90" stroke="#E74C3C" stroke-width="2.5"/>
      <text x="145" y="94" font-size="10" fill="#E74C3C">∂f/∂x</text>
      <text x="100" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">y constant</text>
      
      <!-- Partial with respect to y -->
      <line x1="100" y1="60" x2="100" y2="100" stroke="#27AE60" stroke-width="2.5"/>
      <text x="85" y="75" font-size="10" fill="#27AE60" text-anchor="end">∂f/∂y</text>
      <text x="100" y="115" font-size="8" fill="#7F8C8D" text-anchor="middle">x constant</text>
      
      <!-- Gradient vector -->
      <line x1="100" y1="80" x2="120" y2="65" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="120,65 125,63 122,68" fill="#F39C12"/>
      <text x="130" y="65" font-size="10" fill="#F39C12">∇f</text>
      
      <!-- Formula -->
      <text x="100" y="145" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        ∇f = (∂f/∂x, ∂f/∂y)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Partial Derivatives & Gradient
        </text>
      ` : ''}
    </svg>
  `;
}
