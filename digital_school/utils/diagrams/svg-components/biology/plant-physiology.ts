/**
 * Plant Physiology Components
 * Transpiration, phototropism, root system
 */

export interface PlantPhysiologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create transpiration diagram
 */
export function createTranspiration(options: PlantPhysiologyOptions = {}): string {
    const { width = 200, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="transpiration" xmlns="http://www.w3.org/2000/svg">
      <!-- Leaf -->
      <ellipse cx="100" cy="60" rx="40" ry="25" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
      
      <!-- Stomata -->
      ${[0, 1, 2].map(i => `
        <ellipse cx="${85 + i * 15}" cy="60" rx="3" ry="5" fill="white" stroke="#2C3E50" stroke-width="1"/>
      `).join('')}
      <text x="100" y="95" font-size="9" fill="#7F8C8D" text-anchor="middle">Stomata</text>
      
      <!-- Water vapor -->
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${80 + i * 10}" cy="${30 - i * 3}" r="2" fill="#3498DB" opacity="0.5"/>
        <text x="${80 + i * 10}" y="${25 - i * 3}" font-size="8" fill="#3498DB">H₂O</text>
      `).join('')}
      
      <!-- Stem (xylem) -->
      <rect x="95" y="85" width="10" height="60" fill="#8B4513" opacity="0.3" stroke="#8B4513" stroke-width="2"/>
      <text x="110" y="120" font-size="9" fill="#8B4513">Xylem</text>
      
      <!-- Water uptake arrows -->
      ${[0, 1, 2].map(i => `
        <line x1="100" y1="${95 + i * 15}" x2="100" y2="${85 + i * 15}" stroke="#3498DB" stroke-width="2"/>
        <polygon points="97,${85 + i * 15} 100,${80 + i * 15} 103,${85 + i * 15}" fill="#3498DB"/>
      `).join('')}
      
      <!-- Roots -->
      <path d="M 100,145 L 90,165 M 100,145 L 100,170 M 100,145 L 110,165" 
            stroke="#8B4513" stroke-width="2"/>
      <circle cx="90" cy="165" r="3" fill="#3498DB"/>
      <circle cx="100" cy="170" r="3" fill="#3498DB"/>
      <circle cx="110" cy="165" r="3" fill="#3498DB"/>
      <text x="100" y="190" font-size="9" fill="#7F8C8D" text-anchor="middle">Water Uptake</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Transpiration
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create phototropism diagram
 */
export function createPhototropism(options: PlantPhysiologyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="phototropism" xmlns="http://www.w3.org/2000/svg">
      <!-- Light source -->
      <circle cx="40" cy="50" r="15" fill="#FFD700" opacity="0.5" stroke="#F39C12" stroke-width="2"/>
      ${[0, 1, 2, 3, 4].map(i => `
        <line x1="${40 + Math.cos(i * 1.26) * 15}" y1="${50 + Math.sin(i * 1.26) * 15}" 
              x2="${40 + Math.cos(i * 1.26) * 25}" y2="${50 + Math.sin(i * 1.26) * 25}" 
              stroke="#F39C12" stroke-width="2"/>
      `).join('')}
      <text x="40" y="30" font-size="9" fill="#F39C12" text-anchor="middle">Light</text>
      
      <!-- Plant bending toward light -->
      <g id="plant">
        <!-- Stem curved toward light -->
        <path d="M 140,130 Q 120,100 100,70" stroke="#27AE60" stroke-width="4" fill="none"/>
        
        <!-- Leaves -->
        <ellipse cx="95" cy="65" rx="15" ry="8" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
        <ellipse cx="105" cy="75" rx="15" ry="8" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
        
        <!-- Auxin distribution (shaded side) -->
        <path d="M 135,115 Q 125,95 115,80" stroke="#9B59B6" stroke-width="3" stroke-dasharray="3,3"/>
        <text x="150" y="100" font-size="8" fill="#9B59B6">Auxin</text>
        <text x="150" y="110" font-size="8" fill="#9B59B6">(growth hormone)</text>
        
        <!-- Soil -->
        <rect x="120" y="130" width="40" height="10" fill="#8B4513" opacity="0.3"/>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Phototropism (Light Response)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create root system diagram
 */
export function createRootSystem(options: PlantPhysiologyOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="root-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Soil line -->
      <line x1="20" y1="60" x2="180" y2="60" stroke="#8B4513" stroke-width="2"/>
      <text x="100" y="55" font-size="9" fill="#7F8C8D" text-anchor="middle">Soil Surface</text>
      
      <!-- Main root (taproot) -->
      <line x1="100" y1="60" x2="100" y2="150" stroke="#8B4513" stroke-width="4"/>
      <text x="110" y="105" font-size="9" fill="#8B4513">Taproot</text>
      
      <!-- Lateral roots -->
      ${[0, 1, 2, 3, 4].map(i => {
        const y = 75 + i * 15;
        const angle = (i % 2 === 0 ? 30 : -30);
        const x2 = 100 + (i % 2 === 0 ? 30 : -30);
        return `
          <line x1="100" y1="${y}" x2="${x2}" y2="${y + 20}" stroke="#8B4513" stroke-width="2"/>
        `;
    }).join('')}
      <text x="140" y="100" font-size="8" fill="#7F8C8D">Lateral roots</text>
      
      <!-- Root hairs -->
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `
        <line x1="${95 + (i % 2) * 10}" y1="${140 + i * 2}" x2="${90 + (i % 2) * 20}" y2="${142 + i * 2}" 
              stroke="#A0522D" stroke-width="1"/>
      `).join('')}
      <text x="120" y="155" font-size="8" fill="#7F8C8D">Root hairs</text>
      
      <!-- Water and mineral uptake -->
      ${[0, 1, 2].map(i => `
        <circle cx="${85 + i * 10}" cy="${165 + i * 2}" r="2" fill="#3498DB"/>
      `).join('')}
      <text x="100" y="175" font-size="8" fill="#3498DB" text-anchor="middle">H₂O + Minerals</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Root System
        </text>
      ` : ''}
    </svg>
  `;
}
