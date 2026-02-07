/**
 * Professional Organic Chemistry Components
 * Functional groups, isomers, benzene derivatives
 */

export interface OrganicOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create functional groups diagram
 */
export function createFunctionalGroups(options: OrganicOptions = {}): string {
    const { width = 240, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="functional-groups" xmlns="http://www.w3.org/2000/svg">
      <!-- Hydroxyl (OH) -->
      <g id="hydroxyl">
        <text x="30" y="30" font-size="10" fill="#2C3E50" font-weight="600">Hydroxyl</text>
        <text x="30" y="45" font-size="12" fill="#E74C3C">R—OH</text>
        <text x="30" y="58" font-size="8" fill="#7F8C8D">(Alcohol)</text>
      </g>
      
      <!-- Carbonyl (C=O) -->
      <g id="carbonyl">
        <text x="120" y="30" font-size="10" fill="#2C3E50" font-weight="600">Carbonyl</text>
        <text x="120" y="45" font-size="12" fill="#E74C3C">R—C=O</text>
        <text x="120" y="58" font-size="8" fill="#7F8C8D">(Ketone)</text>
      </g>
      
      <!-- Carboxyl (COOH) -->
      <g id="carboxyl">
        <text x="30" y="85" font-size="10" fill="#2C3E50" font-weight="600">Carboxyl</text>
        <text x="30" y="100" font-size="12" fill="#E74C3C">R—COOH</text>
        <text x="30" y="113" font-size="8" fill="#7F8C8D">(Acid)</text>
      </g>
      
      <!-- Amino (NH₂) -->
      <g id="amino">
        <text x="120" y="85" font-size="10" fill="#2C3E50" font-weight="600">Amino</text>
        <text x="120" y="100" font-size="12" fill="#3498DB">R—NH₂</text>
        <text x="120" y="113" font-size="8" fill="#7F8C8D">(Amine)</text>
      </g>
      
      <!-- Ester (COOR) -->
      <g id="ester">
        <text x="30" y="140" font-size="10" fill="#2C3E50" font-weight="600">Ester</text>
        <text x="30" y="155" font-size="12" fill="#9B59B6">R—COO—R'</text>
        <text x="30" y="168" font-size="8" fill="#7F8C8D">(Ester)</text>
      </g>
      
      <!-- Aldehyde (CHO) -->
      <g id="aldehyde">
        <text x="120" y="140" font-size="10" fill="#2C3E50" font-weight="600">Aldehyde</text>
        <text x="120" y="155" font-size="12" fill="#F39C12">R—CHO</text>
        <text x="120" y="168" font-size="8" fill="#7F8C8D">(Aldehyde)</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Common Functional Groups
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create isomers diagram (structural isomers)
 */
export function createIsomers(options: OrganicOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="isomers" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="110" y="20" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">
        C₄H₁₀ Isomers
      </text>
      
      <!-- n-Butane (straight chain) -->
      <g id="n-butane">
        <text x="110" y="45" font-size="10" fill="#2C3E50" text-anchor="middle">n-Butane</text>
        
        <!-- Carbon chain -->
        <circle cx="50" cy="70" r="8" fill="#2C3E50"/>
        <circle cx="80" cy="70" r="8" fill="#2C3E50"/>
        <circle cx="110" cy="70" r="8" fill="#2C3E50"/>
        <circle cx="140" cy="70" r="8" fill="#2C3E50"/>
        
        <!-- Bonds -->
        <line x1="58" y1="70" x2="72" y2="70" stroke="#7F8C8D" stroke-width="2"/>
        <line x1="88" y1="70" x2="102" y2="70" stroke="#7F8C8D" stroke-width="2"/>
        <line x1="118" y1="70" x2="132" y2="70" stroke="#7F8C8D" stroke-width="2"/>
        
        <!-- Labels -->
        <text x="50" y="75" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="80" y="75" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="110" y="75" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="140" y="75" font-size="8" fill="white" text-anchor="middle">C</text>
      </g>
      
      <!-- Isobutane (branched) -->
      <g id="isobutane">
        <text x="110" y="115" font-size="10" fill="#2C3E50" text-anchor="middle">Isobutane</text>
        
        <!-- Carbon chain -->
        <circle cx="80" cy="140" r="8" fill="#2C3E50"/>
        <circle cx="110" cy="140" r="8" fill="#2C3E50"/>
        <circle cx="140" cy="140" r="8" fill="#2C3E50"/>
        <circle cx="110" cy="110" r="8" fill="#2C3E50"/>
        
        <!-- Bonds -->
        <line x1="88" y1="140" x2="102" y2="140" stroke="#7F8C8D" stroke-width="2"/>
        <line x1="118" y1="140" x2="132" y2="140" stroke="#7F8C8D" stroke-width="2"/>
        <line x1="110" y1="132" x2="110" y2="118" stroke="#7F8C8D" stroke-width="2"/>
        
        <!-- Labels -->
        <text x="80" y="145" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="110" y="145" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="140" y="145" font-size="8" fill="white" text-anchor="middle">C</text>
        <text x="110" y="115" font-size="8" fill="white" text-anchor="middle">C</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Structural Isomers
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create benzene derivatives
 */
export function createBenzeneDerivatives(options: OrganicOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="benzene-derivatives" xmlns="http://www.w3.org/2000/svg">
      <!-- Toluene -->
      <g id="toluene">
        <text x="60" y="20" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Toluene</text>
        
        <!-- Benzene ring -->
        ${createBenzeneRing(60, 70, 25)}
        
        <!-- Methyl group -->
        <line x1="60" y1="45" x2="60" y2="30" stroke="#7F8C8D" stroke-width="2"/>
        <text x="60" y="28" font-size="10" fill="#E74C3C" text-anchor="middle">CH₃</text>
      </g>
      
      <!-- Phenol -->
      <g id="phenol">
        <text x="140" y="20" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Phenol</text>
        
        <!-- Benzene ring -->
        ${createBenzeneRing(140, 70, 25)}
        
        <!-- Hydroxyl group -->
        <line x1="140" y1="45" x2="140" y2="30" stroke="#7F8C8D" stroke-width="2"/>
        <text x="140" y="28" font-size="10" fill="#3498DB" text-anchor="middle">OH</text>
      </g>
      
      <!-- Aniline -->
      <g id="aniline">
        <text x="60" y="110" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Aniline</text>
        
        <!-- Benzene ring -->
        ${createBenzeneRing(60, 145, 25)}
        
        <!-- Amino group -->
        <line x1="60" y1="120" x2="60" y2="105" stroke="#7F8C8D" stroke-width="2"/>
        <text x="60" y="103" font-size="10" fill="#9B59B6" text-anchor="middle">NH₂</text>
      </g>
      
      <!-- Benzoic Acid -->
      <g id="benzoic">
        <text x="140" y="110" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Benzoic Acid</text>
        
        <!-- Benzene ring -->
        ${createBenzeneRing(140, 145, 25)}
        
        <!-- Carboxyl group -->
        <line x1="140" y1="120" x2="140" y2="105" stroke="#7F8C8D" stroke-width="2"/>
        <text x="140" y="103" font-size="9" fill="#F39C12" text-anchor="middle">COOH</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Benzene Derivatives
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Helper function to create benzene ring
 */
function createBenzeneRing(cx: number, cy: number, r: number): string {
    const points = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 - 90) * Math.PI / 180;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        };
    });

    const hexagon = points.map((p, i) =>
        i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ') + ' Z';

    const innerCircle = `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#2C3E50" stroke-width="1.5"/>`;

    return `
    <path d="${hexagon}" fill="none" stroke="#2C3E50" stroke-width="2"/>
    ${innerCircle}
  `;
}
