/**
 * Professional Chemistry Apparatus Components
 * Distillation, chromatography, electrolysis setups
 */

export interface ApparatusOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create distillation apparatus
 */
export function createDistillation(options: ApparatusOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="distillation" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.6" />
          <stop offset="50%" style="stop-color:#D6EAF8;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#E8F4F8;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      
      <!-- Round bottom flask (left) -->
      <circle cx="50" cy="120" r="35" fill="url(#glassGrad)" stroke="#85C1E9" stroke-width="2"/>
      <!-- Liquid in flask -->
      <path d="M 25,120 Q 50,135 75,120" fill="#3498DB" opacity="0.4"/>
      
      <!-- Flask neck -->
      <rect x="48" y="85" width="4" height="35" fill="url(#glassGrad)" stroke="#85C1E9" stroke-width="1.5"/>
      
      <!-- Condenser (angled tube) -->
      <path d="M 52,90 L 120,60 L 180,80" stroke="#85C1E9" stroke-width="3" fill="none"/>
      <path d="M 52,93 L 120,63 L 180,83" stroke="#85C1E9" stroke-width="3" fill="none"/>
      
      <!-- Cooling water jacket (blue lines) -->
      <line x1="100" y1="55" x2="100" y2="45" stroke="#3498DB" stroke-width="2"/>
      <text x="105" y="50" font-size="8" fill="#3498DB">Water in</text>
      <line x1="160" y1="75" x2="160" y2="85" stroke="#3498DB" stroke-width="2"/>
      <text x="165" y="80" font-size="8" fill="#3498DB">Water out</text>
      
      <!-- Receiving flask (right) -->
      <ellipse cx="200" cy="130" rx="25" ry="30" fill="url(#glassGrad)" stroke="#85C1E9" stroke-width="2"/>
      <!-- Collected distillate -->
      <ellipse cx="200" cy="145" rx="20" ry="10" fill="#27AE60" opacity="0.4"/>
      
      <!-- Heat source (burner) -->
      <rect x="35" y="160" width="30" height="15" fill="#E67E22" stroke="#D35400" stroke-width="2" rx="2"/>
      <text x="50" y="172" font-size="8" fill="white" text-anchor="middle">Heat</text>
      
      <!-- Vapor (wavy lines) -->
      ${[0, 1, 2].map(i => `
        <path d="M ${70 + i * 30},${95 - i * 10} Q ${80 + i * 30},${90 - i * 10} ${90 + i * 30},${95 - i * 10}" 
              stroke="#F39C12" stroke-width="1.5" fill="none" opacity="0.6"/>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Distillation Apparatus
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create paper chromatography
 */
export function createChromatography(options: ApparatusOptions = {}): string {
    const { width = 160, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="chromatography" xmlns="http://www.w3.org/2000/svg">
      <!-- Beaker -->
      <path d="M 40,150 L 40,180 Q 80,185 120,180 L 120,150" 
            stroke="#85C1E9" stroke-width="2" fill="url(#glassGrad)"/>
      
      <!-- Solvent -->
      <rect x="42" y="165" width="76" height="15" fill="#3498DB" opacity="0.3"/>
      <text x="80" y="177" font-size="8" fill="#3498DB" text-anchor="middle">Solvent</text>
      
      <!-- Paper strip -->
      <rect x="70" y="40" width="20" height="140" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      
      <!-- Baseline -->
      <line x1="70" y1="160" x2="90" y2="160" stroke="#2C3E50" stroke-width="1" stroke-dasharray="2,2"/>
      
      <!-- Sample spots (separated) -->
      <circle cx="75" cy="130" r="4" fill="#E74C3C"/>
      <circle cx="85" cy="130" r="4" fill="#9B59B6"/>
      
      <!-- Separated components (moved up) -->
      <circle cx="75" cy="80" r="5" fill="#E74C3C" opacity="0.7"/>
      <circle cx="85" cy="100" r="5" fill="#9B59B6" opacity="0.7"/>
      <circle cx="80" cy="60" r="4" fill="#F39C12" opacity="0.7"/>
      
      <!-- Solvent front -->
      <line x1="70" y1="50" x2="90" y2="50" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="95" y="52" font-size="8" fill="#3498DB">Solvent front</text>
      
      <!-- Labels -->
      <text x="95" y="135" font-size="8" fill="#2C3E50">Baseline</text>
      <text x="95" y="165" font-size="8" fill="#2C3E50">Start</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Paper Chromatography
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create electrolysis setup
 */
export function createElectrolysis(options: ApparatusOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="electrolysis" xmlns="http://www.w3.org/2000/svg">
      <!-- Container -->
      <rect x="40" y="80" width="120" height="60" fill="url(#glassGrad)" 
            stroke="#85C1E9" stroke-width="2" rx="3"/>
      
      <!-- Electrolyte solution -->
      <rect x="42" y="90" width="116" height="48" fill="#3498DB" opacity="0.3"/>
      <text x="100" y="115" font-size="9" fill="#3498DB" text-anchor="middle">Electrolyte</text>
      
      <!-- Anode (positive, left) -->
      <rect x="60" y="60" width="8" height="60" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="1"/>
      <text x="64" y="55" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">+</text>
      <text x="64" y="150" font-size="9" fill="#E74C3C" text-anchor="middle">Anode</text>
      
      <!-- Cathode (negative, right) -->
      <rect x="132" y="60" width="8" height="60" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="1"/>
      <text x="136" y="55" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">−</text>
      <text x="136" y="150" font-size="9" fill="#3498DB" text-anchor="middle">Cathode</text>
      
      <!-- Battery/Power source -->
      <rect x="80" y="20" width="40" height="20" fill="#F39C12" stroke="#E67E22" stroke-width="2" rx="2"/>
      <text x="100" y="33" font-size="9" fill="white" text-anchor="middle" font-weight="600">DC</text>
      
      <!-- Wires -->
      <line x1="64" y1="40" x2="64" y2="60" stroke="#2C3E50" stroke-width="2"/>
      <line x1="64" y1="40" x2="80" y2="40" stroke="#2C3E50" stroke-width="2"/>
      <line x1="64" y1="30" x2="80" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <line x1="136" y1="40" x2="136" y2="60" stroke="#2C3E50" stroke-width="2"/>
      <line x1="136" y1="40" x2="120" y2="40" stroke="#2C3E50" stroke-width="2"/>
      <line x1="136" y1="30" x2="120" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Ion movement (arrows) -->
      <text x="85" y="105" font-size="10" fill="#E74C3C">+</text>
      <polygon points="120,105 125,107 120,109" fill="#E74C3C"/>
      
      <text x="115" y="125" font-size="10" fill="#3498DB">−</text>
      <polygon points="80,125 75,123 80,121" fill="#3498DB"/>
      
      <!-- Bubbles (gas evolution) -->
      ${[0, 1, 2].map(i => `
        <circle cx="${64 + i * 3}" cy="${85 - i * 8}" r="2" fill="white" opacity="0.7"/>
        <circle cx="${136 - i * 3}" cy="${85 - i * 8}" r="2" fill="white" opacity="0.7"/>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Electrolysis Setup
        </text>
      ` : ''}
    </svg>
  `;
}
