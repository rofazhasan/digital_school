/**
 * Immunology Components
 * Antibody structure, immune response, vaccination
 */

export interface ImmunologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create antibody structure diagram
 */
export function createAntibodyStructure(options: ImmunologyOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="antibody-structure" xmlns="http://www.w3.org/2000/svg">
      <!-- Heavy chains -->
      <path d="M 70,40 L 70,100 L 60,120 L 70,140" stroke="#E74C3C" stroke-width="3" fill="none"/>
      <path d="M 130,40 L 130,100 L 140,120 L 130,140" stroke="#E74C3C" stroke-width="3" fill="none"/>
      <text x="55" y="90" font-size="9" fill="#E74C3C">Heavy</text>
      
      <!-- Light chains -->
      <path d="M 50,40 L 50,80" stroke="#3498DB" stroke-width="3" fill="none"/>
      <path d="M 150,40 L 150,80" stroke="#3498DB" stroke-width="3" fill="none"/>
      <text x="40" y="60" font-size="9" fill="#3498DB">Light</text>
      
      <!-- Antigen binding sites -->
      <circle cx="60" cy="35" r="8" fill="#F39C12" opacity="0.5" stroke="#F39C12" stroke-width="2"/>
      <circle cx="140" cy="35" r="8" fill="#F39C12" opacity="0.5" stroke="#F39C12" stroke-width="2"/>
      <text x="100" y="25" font-size="9" fill="#F39C12" text-anchor="middle">Antigen Binding</text>
      
      <!-- Fc region -->
      <ellipse cx="100" cy="130" rx="30" ry="15" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
      <text x="100" y="135" font-size="9" fill="#27AE60" text-anchor="middle">Fc Region</text>
      
      <!-- Disulfide bonds -->
      ${[0, 1, 2].map(i => `
        <line x1="70" y1="${60 + i * 30}" x2="130" y2="${60 + i * 30}" stroke="#9B59B6" stroke-width="1.5" stroke-dasharray="2,2"/>
      `).join('')}
      <text x="100" y="75" font-size="8" fill="#9B59B6" text-anchor="middle">S-S</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Antibody (IgG) Structure
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create immune response diagram
 */
export function createImmuneResponse(options: ImmunologyOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="immune-response" xmlns="http://www.w3.org/2000/svg">
      <!-- Pathogen -->
      <circle cx="40" cy="80" r="12" fill="#E74C3C" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
      <text x="40" y="65" font-size="9" fill="#E74C3C" text-anchor="middle">Pathogen</text>
      
      <!-- Macrophage -->
      <circle cx="90" cy="80" r="15" fill="#F39C12" opacity="0.3" stroke="#F39C12" stroke-width="2"/>
      <text x="90" y="105" font-size="9" fill="#F39C12" text-anchor="middle">Macrophage</text>
      
      <!-- T cell -->
      <circle cx="140" cy="60" r="12" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="140" y="50" font-size="9" fill="#3498DB" text-anchor="middle">T Cell</text>
      
      <!-- B cell -->
      <circle cx="140" cy="100" r="12" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
      <text x="140" y="120" font-size="9" fill="#27AE60" text-anchor="middle">B Cell</text>
      
      <!-- Antibodies -->
      ${[0, 1, 2].map(i => `
        <path d="M ${180 + i * 15},${90 + i * 5} L ${180 + i * 15},${95 + i * 5} M ${175 + i * 15},${92 + i * 5} L ${185 + i * 15},${92 + i * 5}" 
              stroke="#9B59B6" stroke-width="2"/>
      `).join('')}
      <text x="195" y="105" font-size="9" fill="#9B59B6">Antibodies</text>
      
      <!-- Arrows showing process -->
      <line x1="55" y1="80" x2="75" y2="80" stroke="#2C3E50" stroke-width="1.5"/>
      <polygon points="75,77 80,80 75,83" fill="#2C3E50"/>
      
      <line x1="105" y1="75" x2="125" y2="65" stroke="#2C3E50" stroke-width="1.5"/>
      <polygon points="125,65 130,63 127,68" fill="#2C3E50"/>
      
      <line x1="105" y1="85" x2="125" y2="95" stroke="#2C3E50" stroke-width="1.5"/>
      <polygon points="125,95 130,97 127,92" fill="#2C3E50"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Immune Response Pathway
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create vaccination mechanism diagram
 */
export function createVaccination(options: ImmunologyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="vaccination" xmlns="http://www.w3.org/2000/svg">
      <!-- Vaccine injection -->
      <g id="vaccine">
        <rect x="40" y="70" width="30" height="20" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="55" y="84" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Vaccine</text>
        <text x="55" y="60" font-size="8" fill="#7F8C8D" text-anchor="middle">Weakened/Inactive</text>
      </g>
      
      <!-- Arrow -->
      <line x1="75" y1="80" x2="95" y2="80" stroke="#F39C12" stroke-width="2"/>
      <polygon points="95,77 100,80 95,83" fill="#F39C12"/>
      
      <!-- Immune system activation -->
      <g id="immune-activation">
        <circle cx="130" cy="80" r="20" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
        <text x="130" y="85" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">Immune</text>
        <text x="130" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">Response</text>
      </g>
      
      <!-- Memory cells -->
      <g id="memory">
        <circle cx="180" cy="70" r="10" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2"/>
        <circle cx="180" cy="90" r="10" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2"/>
        <text x="200" y="82" font-size="9" fill="#9B59B6">Memory Cells</text>
      </g>
      
      <!-- Protection label -->
      <text x="110" y="130" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">
        Long-term Protection
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Vaccination Mechanism
        </text>
      ` : ''}
    </svg>
  `;
}
