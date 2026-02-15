/**
 * Chemical Kinetics Components
 * Rate laws, reaction order, catalysis
 */

export interface KineticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create rate law diagram
 */
export function createRateLaw(options: KineticsOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="rate-law" xmlns="http://www.w3.org/2000/svg">
      <!-- Rate law equation -->
      <rect x="40" y="50" width="120" height="60" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="5"/>
      
      <text x="100" y="75" font-size="14" fill="#E74C3C" text-anchor="middle" font-weight="600">
        Rate = k[A]<tspan font-size="10" baseline-shift="super">m</tspan>[B]<tspan font-size="10" baseline-shift="super">n</tspan>
      </text>
      
      <!-- Components -->
      <text x="100" y="95" font-size="10" fill="#2C3E50" text-anchor="middle">
        k = rate constant
      </text>
      
      <!-- Order indicators -->
      <text x="50" y="125" font-size="9" fill="#27AE60">m = order in A</text>
      <text x="120" y="125" font-size="9" fill="#9B59B6">n = order in B</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Rate Law
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create reaction order diagram
 */
export function createReactionOrder(options: KineticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="reaction-order" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">[Concentration]</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Rate</text>
      
      <!-- Zero order (horizontal line) -->
      <line x1="30" y1="100" x2="180" y2="100" stroke="#3498DB" stroke-width="2.5"/>
      <text x="180" y="95" font-size="9" fill="#3498DB">Zero order</text>
      
      <!-- First order (linear) -->
      <line x1="30" y1="120" x2="180" y2="50" stroke="#27AE60" stroke-width="2.5"/>
      <text x="180" y="45" font-size="9" fill="#27AE60">First order</text>
      
      <!-- Second order (curve) -->
      <path d="M 30,130 Q 80,100 130,60 Q 155,40 180,30" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="180" y="25" font-size="9" fill="#E74C3C">Second order</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Reaction Order
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create catalysis diagram
 */
export function createCatalysis(options: KineticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="catalysis" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Reaction Progress</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Energy</text>
      
      <!-- Uncatalyzed pathway (high activation energy) -->
      <path d="M 40,90 Q 80,35 115,45 Q 150,55 180,70" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="115" y="30" font-size="9" fill="#E74C3C" text-anchor="middle">Uncatalyzed</text>
      
      <!-- Catalyzed pathway (lower activation energy) -->
      <path d="M 40,90 Q 80,60 115,65 Q 150,70 180,70" stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="115" y="80" font-size="9" fill="#27AE60" text-anchor="middle">Catalyzed</text>
      
      <!-- Activation energies -->
      <line x1="60" y1="90" x2="60" y2="40" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="55" y="65" font-size="8" fill="#F39C12" text-anchor="end">Ea</text>
      
      <line x1="90" y1="90" x2="90" y2="62" stroke="#9B59B6" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="95" y="75" font-size="8" fill="#9B59B6">Ea(cat)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Catalysis (Lower Ea)
        </text>
      ` : ''}
    </svg>
  `;
}
