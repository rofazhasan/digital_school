/**
 * Professional Biogeochemical Cycles Components
 * Nitrogen, water, phosphorus cycles
 */

export interface CycleOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create nitrogen cycle
 */
export function createNitrogenCycle(options: CycleOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nitrogen-cycle" xmlns="http://www.w3.org/2000/svg">
      <!-- Atmospheric N2 -->
      <ellipse cx="110" cy="40" rx="40" ry="20" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="110" y="45" font-size="11" fill="#3498DB" text-anchor="middle" font-weight="600">N₂ (gas)</text>
      
      <!-- Nitrogen fixation -->
      <line x1="90" y1="60" x2="70" y2="90" stroke="#27AE60" stroke-width="2"/>
      <polygon points="70,90 67,85 73,87" fill="#27AE60"/>
      <text x="75" y="75" font-size="8" fill="#27AE60">Fixation</text>
      
      <!-- Soil nitrogen -->
      <ellipse cx="60" cy="110" rx="35" ry="18" fill="#E6F7E6" stroke="#27AE60" stroke-width="2"/>
      <text x="60" y="115" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">NH₃/NH₄⁺</text>
      
      <!-- Nitrification -->
      <line x1="95" y1="110" x2="125" y2="110" stroke="#F39C12" stroke-width="2"/>
      <polygon points="125,107 130,110 125,113" fill="#F39C12"/>
      <text x="110" y="105" font-size="8" fill="#F39C12">Nitrification</text>
      
      <!-- Nitrates -->
      <ellipse cx="155" cy="110" rx="30" ry="18" fill="#FFF4E6" stroke="#F39C12" stroke-width="2"/>
      <text x="155" y="115" font-size="10" fill="#F39C12" text-anchor="middle" font-weight="600">NO₃⁻</text>
      
      <!-- Plant uptake -->
      <line x1="155" y1="128" x2="155" y2="150" stroke="#2ECC71" stroke-width="2"/>
      <polygon points="152,150 155,155 158,150" fill="#2ECC71"/>
      <text x="165" y="140" font-size="8" fill="#2ECC71">Uptake</text>
      
      <!-- Plants -->
      <rect x="140" y="155" width="30" height="15" fill="#2ECC71" opacity="0.3" stroke="#2ECC71" stroke-width="2" rx="2"/>
      <text x="155" y="165" font-size="9" fill="#2ECC71" text-anchor="middle">Plants</text>
      
      <!-- Denitrification -->
      <line x1="130" y1="60" x2="145" y2="90" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="130,60 133,65 127,63" fill="#E74C3C"/>
      <text x="140" y="75" font-size="8" fill="#E74C3C">Denitrification</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Nitrogen Cycle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create water cycle
 */
export function createWaterCycle(options: CycleOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="water-cycle" xmlns="http://www.w3.org/2000/svg">
      <!-- Sun -->
      <circle cx="30" cy="30" r="15" fill="#F39C12" opacity="0.7"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = i * 45 * Math.PI / 180;
        return `<line x1="${30 + 18 * Math.cos(angle)}" y1="${30 + 18 * Math.sin(angle)}" 
                      x2="${30 + 23 * Math.cos(angle)}" y2="${30 + 23 * Math.sin(angle)}" 
                      stroke="#F39C12" stroke-width="2"/>`;
    }).join('')}
      
      <!-- Clouds -->
      ${[0, 1, 2].map(i => `
        <ellipse cx="${100 + i * 25}" cy="35" rx="15" ry="10" fill="#95A5A6" opacity="0.6"/>
      `).join('')}
      <text x="125" y="55" font-size="9" fill="#7F8C8D" text-anchor="middle">Clouds</text>
      
      <!-- Precipitation -->
      ${[0, 1, 2, 3, 4].map(i => `
        <line x1="${110 + i * 15}" y1="60" x2="${108 + i * 15}" y2="75" stroke="#3498DB" stroke-width="2"/>
      `).join('')}
      <text x="135" y="90" font-size="8" fill="#3498DB">Precipitation</text>
      
      <!-- Ocean/Water body -->
      <rect x="20" y="120" width="180" height="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="110" y="138" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Ocean/Lake</text>
      
      <!-- Evaporation -->
      ${[0, 1, 2].map(i => `
        <line x1="${50 + i * 30}" y1="120" x2="${55 + i * 30}" y2="70" stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="3,3"/>
        <polygon points="${53 + i * 30},70 ${55 + i * 30},65 ${57 + i * 30},70" fill="#E74C3C"/>
      `).join('')}
      <text x="65" y="95" font-size="8" fill="#E74C3C">Evaporation</text>
      
      <!-- Condensation -->
      <text x="170" y="65" font-size="8" fill="#9B59B6">Condensation</text>
      <line x1="165" y1="70" x2="155" y2="45" stroke="#9B59B6" stroke-width="1.5"/>
      <polygon points="155,45 153,50 157,48" fill="#9B59B6"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Water Cycle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create phosphorus cycle
 */
export function createPhosphorusCycle(options: CycleOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="phosphorus-cycle" xmlns="http://www.w3.org/2000/svg">
      <!-- Rock/Minerals -->
      <rect x="30" y="120" width="50" height="30" fill="#7F8C8D" opacity="0.5" stroke="#7F8C8D" stroke-width="2" rx="3"/>
      <text x="55" y="138" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Rocks</text>
      
      <!-- Weathering -->
      <line x1="80" y1="130" x2="110" y2="110" stroke="#3498DB" stroke-width="2"/>
      <polygon points="110,110 105,112 107,106" fill="#3498DB"/>
      <text x="95" y="125" font-size="8" fill="#3498DB">Weathering</text>
      
      <!-- Soil phosphate -->
      <ellipse cx="130" cy="100" rx="35" ry="18" fill="#E6F7E6" stroke="#27AE60" stroke-width="2"/>
      <text x="130" y="105" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">PO₄³⁻</text>
      <text x="130" y="125" font-size="8" fill="#7F8C8D" text-anchor="middle">(Soil)</text>
      
      <!-- Plant uptake -->
      <line x1="130" y1="82" x2="130" y2="60" stroke="#2ECC71" stroke-width="2"/>
      <polygon points="127,60 130,55 133,60" fill="#2ECC71"/>
      <text x="140" y="70" font-size="8" fill="#2ECC71">Uptake</text>
      
      <!-- Plants -->
      <rect x="110" y="35" width="40" height="20" fill="#2ECC71" opacity="0.3" stroke="#2ECC71" stroke-width="2" rx="2"/>
      <text x="130" y="48" font-size="10" fill="#2ECC71" text-anchor="middle" font-weight="600">Plants</text>
      
      <!-- Decomposition -->
      <line x1="110" y1="50" x2="90" y2="90" stroke="#E74C3C" stroke-width="2"/>
      <polygon points="90,90 87,85 93,87" fill="#E74C3C"/>
      <text x="95" y="70" font-size="8" fill="#E74C3C">Decomposition</text>
      
      <!-- Runoff to ocean -->
      <line x1="165" y1="100" x2="185" y2="120" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="175" y="110" font-size="7" fill="#3498DB">Runoff</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Phosphorus Cycle
        </text>
      ` : ''}
    </svg>
  `;
}
