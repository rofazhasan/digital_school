/**
 * Solutions Chemistry Components
 * Colligative properties, solubility, osmosis
 */

export interface SolutionsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create colligative properties diagram
 */
export function createColligativeProperties(options: SolutionsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="colligative-properties" xmlns="http://www.w3.org/2000/svg">
      <!-- Pure solvent -->
      <g id="pure-solvent">
        <rect x="30" y="50" width="70" height="80" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="65" y="40" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Pure Solvent</text>
        
        <!-- Boiling point -->
        <line x1="25" y1="60" x2="105" y2="60" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="20" y="64" font-size="8" fill="#E74C3C" text-anchor="end">BP</text>
        
        <!-- Freezing point -->
        <line x1="25" y1="120" x2="105" y2="120" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="20" y="124" font-size="8" fill="#3498DB" text-anchor="end">FP</text>
      </g>
      
      <!-- Solution -->
      <g id="solution">
        <rect x="120" y="50" width="70" height="80" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="155" y="40" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Solution</text>
        
        <!-- Solute particles -->
        ${[0, 1, 2, 3, 4].map(i => `
          <circle cx="${130 + (i % 3) * 20}" cy="${70 + Math.floor(i / 3) * 25}" r="3" fill="#F39C12"/>
        `).join('')}
        
        <!-- Elevated boiling point -->
        <line x1="115" y1="55" x2="195" y2="55" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="200" y="59" font-size="8" fill="#E74C3C">BP↑</text>
        
        <!-- Depressed freezing point -->
        <line x1="115" y1="125" x2="195" y2="125" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="200" y="129" font-size="8" fill="#3498DB">FP↓</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Colligative Properties
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create solubility curve diagram
 */
export function createSolubilityCurve(options: SolutionsOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="solubility-curve" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="180" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,127 185,130 180,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="105" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Temperature (°C)</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Solubility (g/100g)</text>
      
      <!-- Solubility curve -->
      <path d="M 30,120 Q 60,100 90,70 Q 120,45 150,35 Q 165,30 180,28" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Regions -->
      <text x="80" y="100" font-size="9" fill="#27AE60">Unsaturated</text>
      <text x="120" y="60" font-size="9" fill="#F39C12">Saturated</text>
      <text x="140" y="50" font-size="9" fill="#9B59B6">Supersaturated</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Solubility Curve
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create osmosis diagram
 */
export function createOsmosis(options: SolutionsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="osmosis" xmlns="http://www.w3.org/2000/svg">
      <!-- Container -->
      <rect x="40" y="60" width="140" height="80" fill="none" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Semipermeable membrane -->
      <line x1="110" y1="60" x2="110" y2="140" stroke="#9B59B6" stroke-width="3" stroke-dasharray="5,3"/>
      <text x="110" y="55" font-size="9" fill="#9B59B6" text-anchor="middle">Membrane</text>
      
      <!-- Left side (pure water) -->
      <rect x="40" y="60" width="70" height="80" fill="#E8F4F8" opacity="0.3"/>
      <text x="75" y="50" font-size="10" fill="#3498DB" text-anchor="middle">Water</text>
      ${[0, 1, 2, 3, 4, 5].map(i => `
        <circle cx="${50 + (i % 3) * 20}" cy="${75 + Math.floor(i / 3) * 25}" r="2" fill="#3498DB" opacity="0.5"/>
      `).join('')}
      
      <!-- Right side (solution) -->
      <rect x="110" y="60" width="70" height="80" fill="#F0E8F8" opacity="0.3"/>
      <text x="145" y="50" font-size="10" fill="#9B59B6" text-anchor="middle">Solution</text>
      ${[0, 1, 2, 3, 4, 5].map(i => `
        <circle cx="${120 + (i % 3) * 20}" cy="${75 + Math.floor(i / 3) * 25}" r="2" fill="#3498DB" opacity="0.5"/>
        ${i % 2 === 0 ? `<circle cx="${120 + (i % 3) * 20}" cy="${75 + Math.floor(i / 3) * 25}" r="4" fill="none" stroke="#F39C12" stroke-width="1"/>` : ''}
      `).join('')}
      
      <!-- Water flow arrows -->
      <line x1="95" y1="90" x2="115" y2="90" stroke="#27AE60" stroke-width="2"/>
      <polygon points="115,87 120,90 115,93" fill="#27AE60"/>
      <text x="107" y="85" font-size="8" fill="#27AE60">H₂O</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Osmosis
        </text>
      ` : ''}
    </svg>
  `;
}
