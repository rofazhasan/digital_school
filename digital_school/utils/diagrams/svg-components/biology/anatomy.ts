/**
 * Professional Biology Anatomy Components
 * Human anatomy diagrams - heart, lungs, digestive system
 */

export interface AnatomyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    showDetails?: boolean;
}

/**
 * Create heart cross-section
 */
export function createHeart(options: AnatomyOptions = {}): string {
    const { width = 180, height = 200, showLabel = true, showDetails = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="anatomy-heart" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="atriumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:0.8" />
        </linearGradient>
        <linearGradient id="ventricleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#C0392B;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#A93226;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Right Atrium -->
      <path d="M 100,40 Q 120,35 130,50 L 130,80 Q 120,75 100,80 Z" 
            fill="url(#atriumGrad)" stroke="#922B21" stroke-width="2"/>
      
      <!-- Left Atrium -->
      <path d="M 80,40 Q 60,35 50,50 L 50,80 Q 60,75 80,80 Z" 
            fill="url(#atriumGrad)" stroke="#922B21" stroke-width="2"/>
      
      <!-- Right Ventricle -->
      <path d="M 100,85 L 130,85 Q 135,120 120,150 Q 105,165 100,170 L 100,85 Z" 
            fill="url(#ventricleGrad)" stroke="#922B21" stroke-width="2"/>
      
      <!-- Left Ventricle -->
      <path d="M 80,85 L 50,85 Q 45,120 60,150 Q 75,165 80,170 L 80,85 Z" 
            fill="url(#ventricleGrad)" stroke="#922B21" stroke-width="2"/>
      
      <!-- Septum (wall between chambers) -->
      <line x1="90" y1="40" x2="90" y2="170" stroke="#7B241C" stroke-width="3"/>
      
      ${showDetails ? `
        <!-- Valves -->
        <!-- Tricuspid valve -->
        <path d="M 100,82 L 105,85 L 100,88" stroke="#F39C12" stroke-width="2" fill="none"/>
        <path d="M 110,82 L 115,85 L 110,88" stroke="#F39C12" stroke-width="2" fill="none"/>
        
        <!-- Mitral valve -->
        <path d="M 80,82 L 75,85 L 80,88" stroke="#F39C12" stroke-width="2" fill="none"/>
        <path d="M 70,82 L 65,85 L 70,88" stroke="#F39C12" stroke-width="2" fill="none"/>
        
        <!-- Blood vessels -->
        <!-- Superior vena cava (blue - deoxygenated) -->
        <rect x="120" y="15" width="15" height="25" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="3"/>
        
        <!-- Aorta (red - oxygenated) -->
        <rect x="45" y="15" width="15" height="25" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="3"/>
        
        <!-- Pulmonary artery (blue) -->
        <rect x="85" y="15" width="12" height="25" fill="#3498DB" stroke="#2980B9" stroke-width="2" rx="3"/>
        
        <!-- Pulmonary vein (red) -->
        <rect x="63" y="15" width="12" height="25" fill="#E74C3C" stroke="#C0392B" stroke-width="2" rx="3"/>
      ` : ''}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="90" y="10" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">Heart</text>
        
        ${showDetails ? `
          <text x="115" y="60" font-size="8" fill="#2C3E50">RA</text>
          <text x="65" y="60" font-size="8" fill="#2C3E50">LA</text>
          <text x="115" y="120" font-size="8" fill="#2C3E50">RV</text>
          <text x="65" y="120" font-size="8" fill="#2C3E50">LV</text>
          <text x="135" y="25" font-size="7" fill="#3498DB">SVC</text>
          <text x="48" y="25" font-size="7" fill="#E74C3C">Aorta</text>
        ` : ''}
        
        <text x="90" y="${height + 15}" font-size="10" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Cross-Section</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create neuron diagram
 */
export function createNeuron(options: AnatomyOptions = {}): string {
    const { width = 240, height = 100, showLabel = true, showDetails = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="anatomy-neuron" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="somaGrad">
          <stop offset="0%" style="stop-color:#F39C12;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </radialGradient>
        <linearGradient id="axonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ECF0F1;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#BDC3C7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ECF0F1;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Dendrites (left side) -->
      ${[0, 1, 2, 3].map(i => `
        <path d="M 20,${30 + i * 15} Q 35,${25 + i * 15} 45,${40 + i * 10}" 
              stroke="#9B59B6" stroke-width="2" fill="none"/>
      `).join('')}
      
      <!-- Cell body (soma) -->
      <circle cx="70" cy="50" r="20" fill="url(#somaGrad)" stroke="#D35400" stroke-width="2"/>
      
      <!-- Nucleus -->
      <circle cx="70" cy="50" r="10" fill="#C0392B" opacity="0.6"/>
      
      <!-- Axon hillock -->
      <path d="M 90,50 L 100,50" stroke="#95A5A6" stroke-width="4"/>
      
      <!-- Axon with myelin sheath -->
      ${[0, 1, 2].map(i => `
        <g>
          <!-- Myelin segment -->
          <rect x="${100 + i * 40}" y="45" width="30" height="10" 
                fill="url(#axonGrad)" stroke="#7F8C8D" stroke-width="2" rx="2"/>
          <!-- Node of Ranvier -->
          ${i < 2 ? `
            <line x1="${130 + i * 40}" y1="48" x2="${140 + i * 40}" y2="48" 
                  stroke="#95A5A6" stroke-width="3"/>
          ` : ''}
        </g>
      `).join('')}
      
      <!-- Axon terminals -->
      ${[0, 1, 2].map(i => `
        <g>
          <path d="M 220,50 Q ${225 + i * 5},${45 + i * 10} ${230 + i * 5},${50 + i * 10}" 
                stroke="#27AE60" stroke-width="2" fill="none"/>
          <circle cx="${230 + i * 5}" cy="${50 + i * 10}" r="4" fill="#27AE60"/>
        </g>
      `).join('')}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="120" y="10" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">Neuron</text>
        
        ${showDetails ? `
          <text x="20" y="20" font-size="8" fill="#9B59B6">Dendrites</text>
          <text x="70" y="35" font-size="8" fill="white" text-anchor="middle">Soma</text>
          <text x="150" y="40" font-size="8" fill="#7F8C8D">Myelin Sheath</text>
          <text x="155" y="60" font-size="7" fill="#95A5A6">Node of Ranvier</text>
          <text x="225" y="75" font-size="8" fill="#27AE60">Terminals</text>
        ` : ''}
        
        <text x="120" y="${height + 20}" font-size="10" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Nerve Cell</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create eye cross-section
 */
export function createEye(options: AnatomyOptions = {}): string {
    const { width = 160, height = 140, showLabel = true, showDetails = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="anatomy-eye" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="eyeballGrad">
          <stop offset="0%" style="stop-color:#ECF0F1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#BDC3C7;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="lensGrad">
          <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#D6EAF8;stop-opacity:0.9" />
        </radialGradient>
      </defs>
      
      <!-- Eyeball (sclera) -->
      <circle cx="80" cy="70" r="55" fill="url(#eyeballGrad)" stroke="#7F8C8D" stroke-width="2"/>
      
      <!-- Cornea (front bulge) -->
      <ellipse cx="45" cy="70" rx="20" ry="30" fill="#D6EAF8" opacity="0.6" 
               stroke="#85C1E9" stroke-width="2"/>
      
      <!-- Iris -->
      <circle cx="55" cy="70" r="18" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
      
      <!-- Pupil -->
      <circle cx="55" cy="70" r="8" fill="#2C3E50"/>
      
      <!-- Lens -->
      <ellipse cx="75" cy="70" rx="12" ry="18" fill="url(#lensGrad)" 
               stroke="#85C1E9" stroke-width="2"/>
      
      <!-- Retina (back of eye) -->
      <path d="M 100,30 A 55 55 0 0 1 100,110" stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Optic nerve -->
      <ellipse cx="135" cy="70" rx="15" ry="10" fill="#F39C12" stroke="#E67E22" stroke-width="2"/>
      <rect x="135" y="65" width="20" height="10" fill="#F39C12" stroke="#E67E22" stroke-width="2"/>
      
      ${showDetails ? `
        <!-- Light rays -->
        ${[-10, 0, 10].map(offset => `
          <line x1="10" y1="${70 + offset}" x2="45" y2="${70 + offset / 2}" 
                stroke="#F39C12" stroke-width="1.5" opacity="0.7"/>
        `).join('')}
        
        <!-- Focal point on retina -->
        <circle cx="105" cy="70" r="3" fill="#E74C3C"/>
      ` : ''}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="80" y="15" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">Eye</text>
        
        ${showDetails ? `
          <text x="30" y="70" font-size="7" fill="#85C1E9">Cornea</text>
          <text x="55" y="95" font-size="7" fill="#3498DB" text-anchor="middle">Iris</text>
          <text x="75" y="95" font-size="7" fill="#85C1E9" text-anchor="middle">Lens</text>
          <text x="115" y="70" font-size="7" fill="#E74C3C">Retina</text>
          <text x="145" y="85" font-size="7" fill="#F39C12">Optic Nerve</text>
        ` : ''}
        
        <text x="80" y="${height + 15}" font-size="10" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Cross-Section</text>
      ` : ''}
    </svg>
  `;
}
