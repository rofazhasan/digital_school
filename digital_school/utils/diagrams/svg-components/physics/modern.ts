/**
 * Professional Modern Physics Components
 * Atomic models, energy levels, nuclear physics
 */

export interface ModernPhysicsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create Bohr atomic model
 */
export function createBohrAtom(
    element: 'hydrogen' | 'helium' | 'lithium' = 'hydrogen',
    options: ModernPhysicsOptions = {}
): string {
    const { width = 160, height = 160, showLabel = true } = options;
    const cx = width / 2;
    const cy = height / 2;

    const config = {
        hydrogen: { protons: 1, neutrons: 0, electrons: [[1]] },
        helium: { protons: 2, neutrons: 2, electrons: [[2]] },
        lithium: { protons: 3, neutrons: 4, electrons: [[2], [1]] }
    };

    const { protons, neutrons, electrons } = config[element];

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="bohr-atom" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nucleusGrad">
          <stop offset="0%" style="stop-color:#F39C12;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Nucleus -->
      <circle cx="${cx}" cy="${cy}" r="15" fill="url(#nucleusGrad)" 
              stroke="#D35400" stroke-width="2"/>
      
      <!-- Protons and neutrons in nucleus -->
      ${Array.from({ length: protons }, (_, i) => {
        const angle = (i / (protons + neutrons)) * 2 * Math.PI;
        const r = 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `<circle cx="${x}" cy="${y}" r="3" fill="#E74C3C"/>`;
    }).join('')}
      ${Array.from({ length: neutrons }, (_, i) => {
        const angle = ((i + protons) / (protons + neutrons)) * 2 * Math.PI;
        const r = 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `<circle cx="${x}" cy="${y}" r="3" fill="#95A5A6"/>`;
    }).join('')}
      
      <!-- Electron shells -->
      ${electrons.map((shellElectrons, shellIndex) => {
        const radius = 30 + shellIndex * 25;
        const electronCount = shellElectrons[0];

        return `
          <!-- Shell ${shellIndex + 1} -->
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" 
                  stroke="#3498DB" stroke-width="1.5" stroke-dasharray="3,3"/>
          
          <!-- Electrons -->
          ${Array.from({ length: electronCount }, (_, i) => {
            const angle = (i / electronCount) * 2 * Math.PI;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return `
              <circle cx="${x}" cy="${y}" r="4" fill="#3498DB" stroke="#2980B9" stroke-width="1.5"/>
              <text x="${x}" y="${y + 1.5}" font-size="7" font-family="Inter, sans-serif" 
                    fill="white" text-anchor="middle">e⁻</text>
            `;
        }).join('')}
        `;
    }).join('')}
      
      ${showLabel ? `
        <text x="${cx}" y="${height + 20}" font-size="12" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          ${element.charAt(0).toUpperCase() + element.slice(1)} Atom (Bohr Model)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create energy level diagram
 */
export function createEnergyLevels(
    levels: number = 4,
    options: ModernPhysicsOptions = {}
): string {
    const { width = 180, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="energy-levels" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="transitionArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Energy axis -->
      <line x1="40" y1="20" x2="40" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2"/>
      <text x="25" y="25" font-size="13" font-family="Inter, sans-serif" 
            font-style="italic" fill="#2C3E50">E</text>
      
      <!-- Energy levels -->
      ${Array.from({ length: levels }, (_, i) => {
        const n = levels - i;
        const y = 30 + (i * (height - 60) / levels);
        const energy = -13.6 / (n * n); // Hydrogen-like

        return `
          <!-- Level n=${n} -->
          <line x1="50" y1="${y}" x2="${width - 30}" y2="${y}" 
                stroke="#3498DB" stroke-width="2.5"/>
          <text x="${width - 25}" y="${y + 5}" font-size="10" font-family="Inter, sans-serif" 
                fill="#3498DB">n=${n}</text>
          <text x="45" y="${y - 5}" font-size="9" font-family="Inter, sans-serif" 
                fill="#7F8C8D">${energy.toFixed(2)} eV</text>
        `;
    }).join('')}
      
      <!-- Ground state label -->
      <text x="${width - 25}" y="${30 + ((levels - 1) * (height - 60) / levels) + 15}" 
            font-size="9" font-family="Inter, sans-serif" fill="#E74C3C">
        (ground state)
      </text>
      
      <!-- Example transition -->
      <line x1="100" y1="${30 + ((levels - 1) * (height - 60) / levels)}" 
            x2="100" y2="${30 + ((levels - 3) * (height - 60) / levels)}" 
            stroke="#E74C3C" stroke-width="2" stroke-dasharray="5,5" 
            marker-end="url(#transitionArrow)"/>
      <text x="110" y="${30 + ((levels - 2) * (height - 60) / levels)}" 
            font-size="9" font-family="Inter, sans-serif" fill="#E74C3C">
        photon
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Energy Level Diagram
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create photoelectric effect diagram
 */
export function createPhotoelectricEffect(options: ModernPhysicsOptions = {}): string {
    const { width = 180, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="photoelectric-effect" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#95A5A6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7F8C8D;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Metal surface -->
      <rect x="80" y="60" width="80" height="60" fill="url(#metalGrad)" 
            stroke="#2C3E50" stroke-width="2"/>
      <text x="120" y="95" font-size="10" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle">Metal</text>
      
      <!-- Incoming photons -->
      ${[0, 1, 2].map(i => `
        <g>
          <!-- Photon wave -->
          <path d="M ${20 + i * 15},${40 + i * 10} Q ${35 + i * 15},${35 + i * 10} ${50 + i * 15},${40 + i * 10} Q ${65 + i * 15},${45 + i * 10} ${80},${40 + i * 10}" 
                stroke="#F39C12" stroke-width="2" fill="none"/>
          <!-- Arrow -->
          <polygon points="${75},${38 + i * 10} ${80},${40 + i * 10} ${75},${42 + i * 10}" fill="#F39C12"/>
        </g>
      `).join('')}
      
      <text x="40" y="30" font-size="9" font-family="Inter, sans-serif" fill="#F39C12">
        Photons (hν)
      </text>
      
      <!-- Ejected electrons -->
      ${[0, 1].map(i => `
        <g>
          <!-- Electron -->
          <circle cx="${165 + i * 5}" cy="${50 + i * 15}" r="4" fill="#3498DB"/>
          <text x="${165 + i * 5}" y="${52 + i * 15}" font-size="6" fill="white" text-anchor="middle">e⁻</text>
          <!-- Trajectory -->
          <path d="M ${160},${55 + i * 15} Q ${170 + i * 5},${45 + i * 15} ${180 + i * 10},${35 + i * 15}" 
                stroke="#3498DB" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
        </g>
      `).join('')}
      
      <text x="170" y="30" font-size="9" font-family="Inter, sans-serif" fill="#3498DB">
        Ejected e⁻
      </text>
      
      <!-- Work function -->
      <line x1="85" y1="55" x2="85" y2="65" stroke="#E74C3C" stroke-width="2"/>
      <text x="65" y="62" font-size="8" font-family="Inter, sans-serif" fill="#E74C3C">
        Φ (work function)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Photoelectric Effect
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create nuclear reaction diagram
 */
export function createNuclearReaction(
    reaction: 'fission' | 'fusion' = 'fission',
    options: ModernPhysicsOptions = {}
): string {
    const { width = 200, height = 120, showLabel = true } = options;

    if (reaction === 'fission') {
        return `
      <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
           class="nuclear-fission" xmlns="http://www.w3.org/2000/svg">
        <!-- Large nucleus (before) -->
        <circle cx="50" cy="60" r="25" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
        <text x="50" y="65" font-size="11" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle">U-235</text>
        
        <!-- Neutron incoming -->
        <circle cx="15" cy="60" r="5" fill="#95A5A6"/>
        <line x1="20" y1="60" x2="25" y2="60" stroke="#95A5A6" stroke-width="2"/>
        <text x="10" y="50" font-size="8" fill="#95A5A6">n</text>
        
        <!-- Arrow -->
        <text x="90" y="65" font-size="20" fill="#2C3E50">→</text>
        
        <!-- Fission products -->
        <circle cx="140" cy="45" r="15" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
        <text x="140" y="49" font-size="9" fill="white" text-anchor="middle">Ba-141</text>
        
        <circle cx="140" cy="85" r="15" fill="#9B59B6" stroke="#8E44AD" stroke-width="2"/>
        <text x="140" y="89" font-size="9" fill="white" text-anchor="middle">Kr-92</text>
        
        <!-- Released neutrons -->
        ${[0, 1, 2].map(i => `
          <circle cx="${170 + i * 10}" cy="${50 + i * 10}" r="4" fill="#95A5A6"/>
          <line x1="${174 + i * 10}" y1="${50 + i * 10}" x2="${180 + i * 10}" y2="${50 + i * 10}" 
                stroke="#95A5A6" stroke-width="1.5"/>
        `).join('')}
        
        <!-- Energy release -->
        <text x="165" y="30" font-size="10" fill="#F39C12" font-weight="600">+ Energy</text>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            Nuclear Fission
          </text>
        ` : ''}
      </svg>
    `;
    } else {
        return `
      <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
           class="nuclear-fusion" xmlns="http://www.w3.org/2000/svg">
        <!-- Two light nuclei -->
        <circle cx="40" cy="50" r="12" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
        <text x="40" y="54" font-size="9" fill="white" text-anchor="middle">H-2</text>
        
        <circle cx="40" cy="80" r="12" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
        <text x="40" y="84" font-size="9" fill="white" text-anchor="middle">H-3</text>
        
        <!-- Arrows converging -->
        <line x1="52" y1="55" x2="75" y2="65" stroke="#2C3E50" stroke-width="2"/>
        <line x1="52" y1="75" x2="75" y2="65" stroke="#2C3E50" stroke-width="2"/>
        <polygon points="75,63 80,65 75,67" fill="#2C3E50"/>
        
        <!-- Arrow -->
        <text x="95" y="70" font-size="20" fill="#2C3E50">→</text>
        
        <!-- Fusion product -->
        <circle cx="140" cy="65" r="15" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
        <text x="140" y="69" font-size="9" fill="white" text-anchor="middle">He-4</text>
        
        <!-- Released neutron -->
        <circle cx="175" cy="65" r="5" fill="#95A5A6"/>
        <line x1="180" y1="65" x2="190" y2="65" stroke="#95A5A6" stroke-width="2"/>
        <text x="185" y="55" font-size="8" fill="#95A5A6">n</text>
        
        <!-- Energy release -->
        <text x="130" y="40" font-size="10" fill="#F39C12" font-weight="600">+ Energy</text>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            Nuclear Fusion
          </text>
        ` : ''}
      </svg>
    `;
    }
}
