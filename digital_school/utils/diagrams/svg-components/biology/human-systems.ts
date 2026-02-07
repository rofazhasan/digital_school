/**
 * Professional Human Body Systems Components
 * Circulatory and nervous systems
 */

export interface HumanSystemOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create circulatory system diagram
 */
export function createCirculatorySystem(options: HumanSystemOptions = {}): string {
    const { width = 200, height = 220, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="circulatory-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Heart -->
      <path d="M 90,80 Q 85,65 75,65 Q 65,65 65,75 Q 65,85 90,105 Q 115,85 115,75 Q 115,65 105,65 Q 95,65 90,80 Z" 
            fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="90" y="90" font-size="10" fill="white" text-anchor="middle" font-weight="600">Heart</text>
      
      <!-- Arteries (red - oxygenated) -->
      <path d="M 90,105 L 90,140 L 60,160 L 60,190" stroke="#E74C3C" stroke-width="4" fill="none"/>
      <text x="50" y="175" font-size="8" fill="#E74C3C">Arteries</text>
      <text x="50" y="185" font-size="7" fill="#E74C3C">(O₂ rich)</text>
      
      <!-- Capillaries -->
      <ellipse cx="60" cy="200" rx="25" ry="10" fill="none" stroke="#9B59B6" stroke-width="2" stroke-dasharray="2,2"/>
      <text x="60" y="218" font-size="8" fill="#9B59B6" text-anchor="middle">Capillaries</text>
      
      <!-- Veins (blue - deoxygenated) -->
      <path d="M 60,210 L 120,190 L 120,160 L 90,140" stroke="#3498DB" stroke-width="4" fill="none"/>
      <text x="130" y="175" font-size="8" fill="#3498DB">Veins</text>
      <text x="130" y="185" font-size="7" fill="#3498DB">(O₂ poor)</text>
      
      <!-- Lungs -->
      <ellipse cx="50" cy="50" rx="18" ry="25" fill="#F8B4B4" opacity="0.4" stroke="#E74C3C" stroke-width="2"/>
      <ellipse cx="130" cy="50" rx="18" ry="25" fill="#F8B4B4" opacity="0.4" stroke="#E74C3C" stroke-width="2"/>
      <text x="90" y="30" font-size="9" fill="#2C3E50" text-anchor="middle">Lungs</text>
      
      <!-- Blood flow arrows -->
      <polygon points="90,135 87,140 93,140" fill="#E74C3C"/>
      <polygon points="90,145 93,140 87,140" fill="#3498DB"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Circulatory System
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create nervous system diagram
 */
export function createNervousSystem(options: HumanSystemOptions = {}): string {
    const { width = 180, height = 220, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nervous-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Brain -->
      <ellipse cx="90" cy="40" rx="35" ry="30" fill="#F8B4B4" stroke="#E74C3C" stroke-width="2"/>
      <path d="M 70,35 Q 80,25 90,35 Q 100,25 110,35" stroke="#C0392B" stroke-width="1.5" fill="none"/>
      <text x="90" y="45" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Brain</text>
      
      <!-- Spinal cord -->
      <rect x="85" y="70" width="10" height="120" fill="#F5A9A9" stroke="#E74C3C" stroke-width="2" rx="2"/>
      <text x="100" y="135" font-size="9" fill="#2C3E50">Spinal</text>
      <text x="100" y="145" font-size="9" fill="#2C3E50">Cord</text>
      
      <!-- Nerves branching out -->
      ${[0, 1, 2, 3, 4].map(i => {
        const y = 90 + i * 25;
        return `
          <line x1="85" y1="${y}" x2="50" y2="${y + 10}" stroke="#3498DB" stroke-width="2"/>
          <line x1="95" y1="${y}" x2="130" y2="${y + 10}" stroke="#3498DB" stroke-width="2"/>
        `;
    }).join('')}
      <text x="40" y="130" font-size="8" fill="#3498DB">Peripheral</text>
      <text x="40" y="140" font-size="8" fill="#3498DB">Nerves</text>
      
      <!-- Neurons (示意) -->
      ${[0, 1].map(i => `
        <circle cx="${55 + i * 70}" cy="200" r="4" fill="#27AE60"/>
        <line x1="${55 + i * 70}" y1="200" x2="${55 + i * 70}" y2="210" stroke="#27AE60" stroke-width="1.5"/>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Nervous System
        </text>
      ` : ''}
    </svg>
  `;
}
