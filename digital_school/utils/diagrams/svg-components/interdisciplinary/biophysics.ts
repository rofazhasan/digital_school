/**
 * Biophysics Components
 * Membrane potential, ion channels, muscle mechanics, nerve conduction, vision, hearing, biomechanics, fluid dynamics, diffusion, protein folding
 */

export interface BiophysicsOptions {
  width?: number;
  height?: number;
  showLabel?: boolean;
}

/**
 * Create membrane potential diagram
 */
export function createMembranePotential(options: BiophysicsOptions = {}): string {
  const { width = 240, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="membrane-potential" xmlns="http://www.w3.org/2000/svg">
      <!-- Membrane -->
      <rect x="40" y="60" width="160" height="40" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Resting potential -->
      <g id="resting">
        <line x1="50" y1="80" x2="110" y2="80" stroke="#27AE60" stroke-width="2.5"/>
        <text x="80" y="75" font-size="9" fill="#27AE60" text-anchor="middle">-70 mV</text>
        <text x="80" y="50" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Resting</text>
      </g>
      
      <!-- Action potential -->
      <g id="action">
        <path d="M 110,80 L 120,80 L 130,40 L 140,90 L 150,75 L 160,80" 
              stroke="#E74C3C" stroke-width="2.5" fill="none"/>
        <text x="130" y="30" font-size="9" fill="#E74C3C" text-anchor="middle">+40 mV</text>
        <text x="145" y="50" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Action Potential</text>
      </g>
      
      <!-- Ion channels -->
      <text x="60" y="115" font-size="8" fill="#3498DB">Na⁺ in</text>
      <text x="130" y="115" font-size="8" fill="#9B59B6">K⁺ out</text>
      
      <!-- Time axis -->
      <line x1="40" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="1.5"/>
      <text x="120" y="145" font-size="9" fill="#2C3E50" text-anchor="middle">Time (ms)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Membrane Potential (Action Potential)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create ion channels diagram
 */
export function createIonChannels(options: BiophysicsOptions = {}): string {
  const { width = 240, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ion-channels" xmlns="http://www.w3.org/2000/svg">
      <!-- Voltage-gated channel -->
      <g id="voltage-gated">
        <rect x="40" y="50" width="80" height="60" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <rect x="65" y="60" width="30" height="40" fill="white" stroke="#3498DB" stroke-width="2"/>
        <text x="80" y="35" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Voltage-Gated</text>
        <text x="80" y="125" font-size="8" fill="#7F8C8D" text-anchor="middle">Opens at threshold</text>
        
        <!-- Voltage sensor -->
        <circle cx="55" cy="70" r="3" fill="#E74C3C"/>
        <text x="45" y="73" font-size="7" fill="#E74C3C">+</text>
      </g>
      
      <!-- Ligand-gated channel -->
      <g id="ligand-gated">
        <rect x="140" y="50" width="80" height="60" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <rect x="165" y="60" width="30" height="40" fill="white" stroke="#9B59B6" stroke-width="2"/>
        <text x="180" y="35" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Ligand-Gated</text>
        <text x="180" y="125" font-size="8" fill="#7F8C8D" text-anchor="middle">Opens with ligand</text>
        
        <!-- Ligand -->
        <circle cx="155" cy="70" r="4" fill="#27AE60"/>
        <text x="145" y="73" font-size="7" fill="#27AE60">L</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Ion Channel Types
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create muscle mechanics (force-length) diagram
 */
export function createMuscleMechanics(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="muscle-mechanics" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="190" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Labels -->
      <text x="110" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Muscle Length</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Force</text>
      
      <!-- Force-length curve -->
      <path d="M 40,120 Q 70,100 110,50 Q 150,100 180,120" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Optimal length marker -->
      <line x1="110" y1="50" x2="110" y2="130" stroke="#27AE60" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="110" y="45" font-size="9" fill="#27AE60" text-anchor="middle">Optimal</text>
      
      <!-- Annotations -->
      <text x="50" y="110" font-size="8" fill="#7F8C8D">Too short</text>
      <text x="160" y="110" font-size="8" fill="#7F8C8D">Too long</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Muscle Force-Length Relationship
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create nerve conduction (saltatory) diagram
 */
export function createNerveConduction(options: BiophysicsOptions = {}): string {
  const { width = 240, height = 140, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nerve-conduction" xmlns="http://www.w3.org/2000/svg">
      <!-- Axon -->
      <line x1="30" y1="70" x2="210" y2="70" stroke="#3498DB" stroke-width="8"/>
      
      <!-- Myelin sheaths -->
      ${[0, 1, 2, 3].map(i => `
        <rect x="${50 + i * 50}" y="60" width="35" height="20" fill="#F39C12" opacity="0.5" stroke="#F39C12" stroke-width="2" rx="2"/>
      `).join('')}
      
      <!-- Nodes of Ranvier -->
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${40 + i * 50}" cy="70" r="4" fill="#E74C3C"/>
      `).join('')}
      
      <!-- Action potential jumps -->
      ${[0, 1, 2].map(i => `
        <path d="M ${40 + i * 50},60 Q ${65 + i * 50},40 ${90 + i * 50},60" 
              stroke="#E74C3C" stroke-width="2" fill="none" marker-end="url(#arrow-nerve)"/>
      `).join('')}
      
      <!-- Labels -->
      <text x="67" y="95" font-size="8" fill="#F39C12">Myelin</text>
      <text x="40" y="105" font-size="8" fill="#E74C3C">Node</text>
      <text x="120" y="30" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">
        Saltatory Conduction
      </text>
      
      <defs>
        <marker id="arrow-nerve" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#E74C3C"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Saltatory Nerve Conduction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create vision biophysics (photoreceptor) diagram
 */
export function createVisionBiophysics(options: BiophysicsOptions = {}): string {
  const { width = 200, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="vision-biophysics" xmlns="http://www.w3.org/2000/svg">
      <!-- Photoreceptor cell -->
      <g id="photoreceptor">
        <!-- Outer segment -->
        <rect x="80" y="40" width="40" height="40" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="100" y="30" font-size="9" fill="#9B59B6" text-anchor="middle">Outer segment</text>
        
        <!-- Inner segment -->
        <rect x="85" y="80" width="30" height="25" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="2"/>
        
        <!-- Cell body -->
        <circle cx="100" cy="115" r="10" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
        
        <!-- Synapse -->
        <ellipse cx="100" cy="135" rx="8" ry="5" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      </g>
      
      <!-- Light -->
      ${[0, 1, 2].map(i => `
        <line x1="${85 + i * 10}" y1="20" x2="${90 + i * 10}" y2="35" 
              stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-light)"/>
      `).join('')}
      <text x="100" y="15" font-size="9" fill="#F39C12" text-anchor="middle">Light</text>
      
      <!-- Signal cascade -->
      <text x="130" y="60" font-size="8" fill="#2C3E50">Rhodopsin</text>
      <text x="130" y="90" font-size="8" fill="#2C3E50">Transducin</text>
      <text x="130" y="120" font-size="8" fill="#2C3E50">Signal</text>
      
      <defs>
        <marker id="arrow-light" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Photoreceptor Activation
        </text>
      ` : ''}
    </svg>
  `;
}


/**
 * Create hearing mechanism (cochlear) diagram
 */
export function createHearingMechanism(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="hearing-mechanism" xmlns="http://www.w3.org/2000/svg">
      <!-- Cochlea spiral -->
      <path d="M 110,80 Q 130,60 150,80 Q 160,100 140,110 Q 120,115 110,100 Q 105,90 110,80" 
            fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Hair cells -->
      ${[0, 1, 2, 3, 4].map(i => `
        <line x1="${120 + i * 8}" y1="${85 + i * 3}" x2="${120 + i * 8}" y2="${75 + i * 3}" 
              stroke="#E74C3C" stroke-width="2"/>
      `).join('')}
      
      <!-- Sound waves -->
      ${[0, 1, 2].map(i => `
        <path d="M ${40 + i * 15},80 Q ${50 + i * 15},70 ${60 + i * 15},80 Q ${70 + i * 15},90 ${80 + i * 15},80" 
              stroke="#F39C12" stroke-width="1.5" fill="none"/>
      `).join('')}
      <text x="50" y="70" font-size="9" fill="#F39C12">Sound</text>
      
      <!-- Labels -->
      <text x="130" y="50" font-size="9" fill="#E74C3C" text-anchor="middle">Hair cells</text>
      <text x="110" y="135" font-size="8" fill="#7F8C8D" text-anchor="middle">Mechanical → Electrical</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Cochlear Hearing Mechanism
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create biomechanics (lever systems) diagram
 */
export function createBiomechanics(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="biomechanics" xmlns="http://www.w3.org/2000/svg">
      <!-- Lever arm -->
      <line x1="40" y1="80" x2="180" y2="80" stroke="#3498DB" stroke-width="3"/>
      
      <!-- Fulcrum -->
      <polygon points="110,80 100,95 120,95" fill="#E74C3C"/>
      <text x="110" y="110" font-size="9" fill="#E74C3C" text-anchor="middle">Fulcrum</text>
      
      <!-- Effort -->
      <line x1="60" y1="60" x2="60" y2="80" stroke="#27AE60" stroke-width="2.5" marker-end="url(#arrow-bio)"/>
      <text x="60" y="50" font-size="9" fill="#27AE60" text-anchor="middle">Effort</text>
      
      <!-- Load -->
      <line x1="160" y1="60" x2="160" y2="80" stroke="#9B59B6" stroke-width="2.5" marker-end="url(#arrow-bio)"/>
      <text x="160" y="50" font-size="9" fill="#9B59B6" text-anchor="middle">Load</text>
      
      <!-- Example -->
      <text x="110" y="130" font-size="8" fill="#7F8C8D" text-anchor="middle">Example: Elbow joint</text>
      
      <defs>
        <marker id="arrow-bio" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#27AE60"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Biomechanics (Lever System)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create fluid dynamics in body (blood flow) diagram
 */
export function createFluidDynamics(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="fluid-dynamics" xmlns="http://www.w3.org/2000/svg">
      <!-- Blood vessel -->
      <ellipse cx="110" cy="70" rx="80" ry="25" fill="#E8F4F8" stroke="#E74C3C" stroke-width="2"/>
      
      <!-- Flow lines (laminar) -->
      ${[0, 1, 2, 3, 4].map(i => {
    const y = 55 + i * 7.5;
    const length = 60 - Math.abs(i - 2) * 10;
    return `
          <line x1="${110 - length / 2}" y1="${y}" x2="${110 + length / 2}" y2="${y}" 
                stroke="#3498DB" stroke-width="2" marker-end="url(#arrow-flow)"/>
        `;
  }).join('')}
      
      <!-- Velocity profile -->
      <text x="110" y="40" font-size="9" fill="#3498DB" text-anchor="middle">Parabolic velocity profile</text>
      
      <!-- Poiseuille's law -->
      <rect x="40" y="110" width="140" height="35" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
      <text x="110" y="125" font-size="10" fill="#2C3E50" text-anchor="middle">Q = πΔPr⁴/8ηL</text>
      <text x="110" y="140" font-size="8" fill="#7F8C8D" text-anchor="middle">Poiseuille's Law</text>
      
      <defs>
        <marker id="arrow-flow" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#3498DB"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Blood Flow (Poiseuille's Law)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create diffusion in cells (Fick's laws) diagram
 */
export function createDiffusionInCells(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="diffusion-cells" xmlns="http://www.w3.org/2000/svg">
      <!-- Membrane -->
      <line x1="110" y1="40" x2="110" y2="120" stroke="#3498DB" stroke-width="3"/>
      
      <!-- High concentration side -->
      ${Array.from({ length: 20 }, (_, i) => {
    const x = 40 + Math.random() * 50;
    const y = 50 + Math.random() * 60;
    return `<circle cx="${x}" cy="${y}" r="2.5" fill="#E74C3C" opacity="0.7"/>`;
  }).join('')}
      <text x="65" y="35" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">High [C]</text>
      
      <!-- Low concentration side -->
      ${Array.from({ length: 5 }, (_, i) => {
    const x = 120 + Math.random() * 50;
    const y = 50 + Math.random() * 60;
    return `<circle cx="${x}" cy="${y}" r="2.5" fill="#27AE60" opacity="0.7"/>`;
  }).join('')}
      <text x="145" y="35" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Low [C]</text>
      
      <!-- Diffusion arrows -->
      ${[0, 1, 2].map(i => `
        <line x1="${95 + i * 5}" y1="${60 + i * 15}" x2="${115 + i * 5}" y2="${60 + i * 15}" 
              stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-diff)"/>
      `).join('')}
      
      <!-- Fick's First Law -->
      <text x="110" y="140" font-size="10" fill="#2C3E50" text-anchor="middle">J = -D(dC/dx)</text>
      <text x="110" y="155" font-size="8" fill="#7F8C8D" text-anchor="middle">Fick's First Law</text>
      
      <defs>
        <marker id="arrow-diff" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Cellular Diffusion (Fick's Law)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create protein folding (energy landscape) diagram
 */
export function createProteinFolding(options: BiophysicsOptions = {}): string {
  const { width = 220, height = 160, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="protein-folding" xmlns="http://www.w3.org/2000/svg">
      <!-- Energy landscape -->
      <path d="M 30,60 Q 50,40 70,65 Q 90,90 110,50 Q 130,10 150,70 Q 170,130 190,90" 
            stroke="#3498DB" stroke-width="2.5" fill="none"/>
      
      <!-- Axes -->
      <line x1="30" y1="130" x2="190" y2="130" stroke="#2C3E50" stroke-width="1.5"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="1.5"/>
      
      <!-- Labels -->
      <text x="110" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Conformation</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Energy</text>
      
      <!-- Unfolded state -->
      <circle cx="50" cy="50" r="4" fill="#E74C3C"/>
      <text x="50" y="40" font-size="8" fill="#E74C3C" text-anchor="middle">Unfolded</text>
      
      <!-- Native state -->
      <circle cx="130" cy="20" r="4" fill="#27AE60"/>
      <text x="130" y="10" font-size="8" fill="#27AE60" text-anchor="middle">Native</text>
      
      <!-- Misfolded -->
      <circle cx="170" cy="120" r="4" fill="#9B59B6"/>
      <text x="170" y="145" font-size="8" fill="#9B59B6" text-anchor="middle">Misfolded</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Protein Folding Energy Landscape
        </text>
      ` : ''}
    </svg>
  `;
}
