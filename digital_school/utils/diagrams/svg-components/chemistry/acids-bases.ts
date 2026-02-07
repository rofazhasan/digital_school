/**
 * Professional Acids and Bases Components
 * pH scale, buffers, indicators, strong vs weak acids
 */

export interface AcidBaseOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create pH scale
 */
export function createPHScale(options: AcidBaseOptions = {}): string {
    const { width = 240, height = 100, showLabel = true } = options;

    const colors = [
        '#8B0000', '#B22222', '#DC143C', '#FF4500', '#FF6347', '#FFA500', '#FFD700',
        '#FFFF00', '#ADFF2F', '#7FFF00', '#00FF00', '#00FA9A', '#00CED1', '#1E90FF', '#0000CD'
    ];

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ph-scale" xmlns="http://www.w3.org/2000/svg">
      <!-- pH scale gradient -->
      ${colors.map((color, i) => `
        <rect x="${20 + i * 14}" y="30" width="14" height="30" fill="${color}"/>
        <text x="${27 + i * 14}" y="70" font-size="9" fill="#2C3E50" text-anchor="middle">${i}</text>
      `).join('')}
      
      <!-- Labels -->
      <text x="60" y="20" font-size="10" fill="#E74C3C" font-weight="600">Acidic</text>
      <text x="125" y="20" font-size="10" fill="#27AE60" font-weight="600">Neutral</text>
      <text x="190" y="20" font-size="10" fill="#3498DB" font-weight="600">Basic</text>
      
      <!-- Example substances -->
      <text x="27" y="85" font-size="7" fill="#7F8C8D" text-anchor="middle">HCl</text>
      <text x="69" y="85" font-size="7" fill="#7F8C8D" text-anchor="middle">Vinegar</text>
      <text x="125" y="85" font-size="7" fill="#7F8C8D" text-anchor="middle">Water</text>
      <text x="181" y="85" font-size="7" fill="#7F8C8D" text-anchor="middle">Ammonia</text>
      <text x="223" y="85" font-size="7" fill="#7F8C8D" text-anchor="middle">NaOH</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          pH Scale
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create buffer solution diagram
 */
export function createBufferSolution(options: AcidBaseOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="buffer-solution" xmlns="http://www.w3.org/2000/svg">
      <!-- Equilibrium equation -->
      <text x="100" y="30" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        HA ⇌ H<tspan font-size="8" baseline-shift="super">+</tspan> + A<tspan font-size="8" baseline-shift="super">−</tspan>
      </text>
      
      <!-- Weak acid molecules -->
      <g id="weak-acid">
        ${[0, 1, 2, 3, 4].map(i => `
          <circle cx="${40 + i * 25}" cy="70" r="8" fill="#E74C3C" opacity="0.6"/>
          <text x="${40 + i * 25}" y="74" font-size="8" fill="white" text-anchor="middle">HA</text>
        `).join('')}
        <text x="80" y="90" font-size="9" fill="#E74C3C" text-anchor="middle">Weak Acid</text>
      </g>
      
      <!-- Conjugate base -->
      <g id="conjugate-base">
        ${[0, 1, 2, 3, 4].map(i => `
          <circle cx="${40 + i * 25}" cy="115" r="8" fill="#3498DB" opacity="0.6"/>
          <text x="${40 + i * 25}" y="119" font-size="8" fill="white" text-anchor="middle">A⁻</text>
        `).join('')}
        <text x="80" y="135" font-size="9" fill="#3498DB" text-anchor="middle">Conjugate Base</text>
      </g>
      
      <!-- Buffer action -->
      <text x="100" y="155" font-size="9" fill="#27AE60" text-anchor="middle">Resists pH change</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Buffer Solution
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create acid-base indicator
 */
export function createAcidBaseIndicator(options: AcidBaseOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="acid-base-indicator" xmlns="http://www.w3.org/2000/svg">
      <!-- Litmus paper in acid -->
      <rect x="30" y="40" width="60" height="50" fill="#FF6B6B" stroke="#E74C3C" stroke-width="2" rx="3"/>
      <text x="60" y="70" font-size="11" fill="white" text-anchor="middle" font-weight="600">Red</text>
      <text x="60" y="100" font-size="9" fill="#2C3E50" text-anchor="middle">pH < 7</text>
      <text x="60" y="110" font-size="9" fill="#E74C3C" text-anchor="middle">Acidic</text>
      
      <!-- Litmus paper in base -->
      <rect x="130" y="40" width="60" height="50" fill="#4ECDC4" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="160" y="70" font-size="11" fill="white" text-anchor="middle" font-weight="600">Blue</text>
      <text x="160" y="100" font-size="9" fill="#2C3E50" text-anchor="middle">pH > 7</text>
      <text x="160" y="110" font-size="9" fill="#3498DB" text-anchor="middle">Basic</text>
      
      <!-- Title -->
      <text x="110" y="25" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Litmus Indicator</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Acid-Base Indicator
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create strong vs weak acid comparison
 */
export function createStrongWeakAcid(options: AcidBaseOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="strong-weak-acid" xmlns="http://www.w3.org/2000/svg">
      <!-- Strong acid (complete dissociation) -->
      <g id="strong-acid">
        <text x="55" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">Strong Acid</text>
        <text x="55" y="40" font-size="9" fill="#E74C3C" text-anchor="middle">HCl → H⁺ + Cl⁻</text>
        
        <!-- All dissociated -->
        ${[0, 1, 2, 3, 4, 5].map(i => `
          <circle cx="${25 + (i % 3) * 20}" cy="${60 + Math.floor(i / 3) * 25}" r="6" fill="#3498DB" opacity="0.7"/>
          <text x="${25 + (i % 3) * 20}" y="${64 + Math.floor(i / 3) * 25}" font-size="6" fill="white" text-anchor="middle">H⁺</text>
        `).join('')}
        
        <text x="55" y="120" font-size="8" fill="#27AE60" text-anchor="middle">100% dissociated</text>
      </g>
      
      <!-- Weak acid (partial dissociation) -->
      <g id="weak-acid">
        <text x="165" y="25" font-size="10" fill="#2C3E50" font-weight="600" text-anchor="middle">Weak Acid</text>
        <text x="165" y="40" font-size="9" fill="#E74C3C" text-anchor="middle">CH₃COOH ⇌ H⁺ + CH₃COO⁻</text>
        
        <!-- Some dissociated, some not -->
        ${[0, 1].map(i => `
          <circle cx="${145 + i * 20}" cy="60" r="6" fill="#3498DB" opacity="0.7"/>
          <text x="${145 + i * 20}" y="64" font-size="6" fill="white" text-anchor="middle">H⁺</text>
        `).join('')}
        ${[0, 1, 2, 3].map(i => `
          <circle cx="${135 + (i % 2) * 20}" cy="${85 + Math.floor(i / 2) * 20}" r="6" fill="#E74C3C" opacity="0.7"/>
          <text x="${135 + (i % 2) * 20}" y="${89 + Math.floor(i / 2) * 20}" font-size="5" fill="white" text-anchor="middle">HA</text>
        `).join('')}
        
        <text x="165" y="120" font-size="8" fill="#9B59B6" text-anchor="middle">~5% dissociated</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Strong vs Weak Acid
        </text>
      ` : ''}
    </svg>
  `;
}
