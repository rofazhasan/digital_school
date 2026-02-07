/**
 * Relativity Components
 * Time dilation, length contraction, mass-energy equivalence
 */

export interface RelativityOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create time dilation diagram
 */
export function createTimeDilation(options: RelativityOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="time-dilation" xmlns="http://www.w3.org/2000/svg">
      <!-- Stationary observer -->
      <g id="stationary">
        <circle cx="60" cy="70" r="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
        <text x="60" y="65" font-size="20" text-anchor="middle">🕐</text>
        <text x="60" y="105" font-size="9" fill="#3498DB" text-anchor="middle">Stationary</text>
        <text x="60" y="118" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Δt₀</text>
      </g>
      
      <!-- Moving observer -->
      <g id="moving">
        <circle cx="160" cy="70" r="25" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
        <text x="160" y="65" font-size="20" text-anchor="middle">🕐</text>
        <line x1="185" y1="70" x2="205" y2="70" stroke="#27AE60" stroke-width="2.5"/>
        <polygon points="205,67 210,70 205,73" fill="#27AE60"/>
        <text x="195" y="65" font-size="9" fill="#27AE60">v</text>
        
        <text x="160" y="105" font-size="9" fill="#E74C3C" text-anchor="middle">Moving</text>
        <text x="160" y="118" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">Δt</text>
      </g>
      
      <!-- Formula -->
      <text x="110" y="145" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        Δt = Δt₀ / √(1 - v²/c²)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Time Dilation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create length contraction diagram
 */
export function createLengthContraction(options: RelativityOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="length-contraction" xmlns="http://www.w3.org/2000/svg">
      <!-- Rest length -->
      <rect x="40" y="45" width="80" height="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="80" y="62" font-size="11" fill="#3498DB" text-anchor="middle" font-weight="600">L₀</text>
      <text x="80" y="35" font-size="9" fill="#7F8C8D" text-anchor="middle">At rest</text>
      
      <!-- Contracted length -->
      <rect x="60" y="90" width="50" height="25" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="85" y="107" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">L</text>
      <line x1="115" y1="102" x2="145" y2="102" stroke="#27AE60" stroke-width="2.5"/>
      <polygon points="145,99 150,102 145,105" fill="#27AE60"/>
      <text x="130" y="97" font-size="9" fill="#27AE60">v</text>
      <text x="85" y="80" font-size="9" fill="#7F8C8D" text-anchor="middle">Moving</text>
      
      <!-- Formula -->
      <text x="110" y="135" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        L = L₀ √(1 - v²/c²)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Length Contraction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create mass-energy equivalence diagram
 */
export function createMassEnergyEquivalence(options: RelativityOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="mass-energy-equivalence" xmlns="http://www.w3.org/2000/svg">
      <!-- Mass -->
      <circle cx="60" cy="70" r="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2.5"/>
      <text x="60" y="75" font-size="14" fill="#3498DB" text-anchor="middle" font-weight="600">m</text>
      <text x="60" y="105" font-size="9" fill="#7F8C8D" text-anchor="middle">Mass</text>
      
      <!-- Equals sign -->
      <text x="100" y="75" font-size="16" fill="#2C3E50" font-weight="600">=</text>
      
      <!-- Energy -->
      <circle cx="140" cy="70" r="25" fill="#F39C12" opacity="0.3" stroke="#F39C12" stroke-width="2.5"/>
      <text x="140" y="75" font-size="14" fill="#F39C12" text-anchor="middle" font-weight="600">E</text>
      <text x="140" y="105" font-size="9" fill="#7F8C8D" text-anchor="middle">Energy</text>
      
      <!-- Famous equation -->
      <rect x="50" y="115" width="100" height="25" fill="#E74C3C" opacity="0.2" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="100" y="132" font-size="14" fill="#E74C3C" text-anchor="middle" font-weight="600" font-family="Inter, sans-serif">
        E = mc²
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Mass-Energy Equivalence
        </text>
      ` : ''}
    </svg>
  `;
}
