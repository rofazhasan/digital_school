/**
 * Advanced Organic Chemistry Components
 * Alkanes/alkenes/alkynes, aromatic compounds, polymers, stereoisomers, reaction mechanisms
 */

export interface AdvancedOrganicOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create hydrocarbon series diagram
 */
export function createHydrocarbonSeries(options: AdvancedOrganicOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="hydrocarbon-series" xmlns="http://www.w3.org/2000/svg">
      <!-- Alkane (single bonds) -->
      <g id="alkane">
        <text x="40" y="25" font-size="10" fill="#E74C3C" font-weight="600">Alkane</text>
        <text x="40" y="40" font-size="11" fill="#2C3E50" font-family="monospace">CH₃-CH₂-CH₃</text>
        <text x="40" y="55" font-size="9" fill="#7F8C8D">Single bonds (C-C)</text>
      </g>
      
      <!-- Alkene (double bond) -->
      <g id="alkene">
        <text x="40" y="85" font-size="10" fill="#3498DB" font-weight="600">Alkene</text>
        <text x="40" y="100" font-size="11" fill="#2C3E50" font-family="monospace">CH₂=CH-CH₃</text>
        <text x="40" y="115" font-size="9" fill="#7F8C8D">Double bond (C=C)</text>
      </g>
      
      <!-- Alkyne (triple bond) -->
      <g id="alkyne">
        <text x="40" y="145" font-size="10" fill="#27AE60" font-weight="600">Alkyne</text>
        <text x="40" y="160" font-size="11" fill="#2C3E50" font-family="monospace">CH≡C-CH₃</text>
        <text x="40" y="175" font-size="9" fill="#7F8C8D">Triple bond (C≡C)</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Hydrocarbon Series
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create aromatic compounds (benzene resonance) diagram
 */
export function createAromaticCompounds(options: AdvancedOrganicOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="aromatic-compounds" xmlns="http://www.w3.org/2000/svg">
      <!-- Benzene structure 1 -->
      <g id="benzene-1">
        <path d="M 60,80 L 80,60 L 110,60 L 130,80 L 110,100 L 80,100 Z" 
              fill="none" stroke="#E74C3C" stroke-width="2.5"/>
        <!-- Double bonds -->
        <line x1="70" y1="70" x2="85" y2="60" stroke="#E74C3C" stroke-width="2"/>
        <line x1="115" y1="60" x2="130" y2="70" stroke="#E74C3C" stroke-width="2"/>
        <line x1="120" y1="90" x2="105" y2="100" stroke="#E74C3C" stroke-width="2"/>
        <text x="95" y="50" font-size="9" fill="#E74C3C" text-anchor="middle">C₆H₆</text>
      </g>
      
      <!-- Resonance arrow -->
      <text x="100" y="120" font-size="14" fill="#9B59B6" text-anchor="middle">⟷</text>
      
      <!-- Benzene structure 2 (alternate) -->
      <g id="benzene-2" opacity="0.6">
        <path d="M 60,80 L 80,60 L 110,60 L 130,80 L 110,100 L 80,100 Z" 
              fill="none" stroke="#3498DB" stroke-width="2.5"/>
        <!-- Alternate double bonds -->
        <line x1="80" y1="60" x2="95" y2="60" stroke="#3498DB" stroke-width="2"/>
        <line x1="130" y1="80" x2="120" y2="100" stroke="#3498DB" stroke-width="2"/>
        <line x1="80" y1="100" x2="70" y2="80" stroke="#3498DB" stroke-width="2"/>
      </g>
      
      <!-- Delocalized electrons -->
      <circle cx="95" cy="80" r="20" fill="none" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="95" y="140" font-size="9" fill="#F39C12" text-anchor="middle">Delocalized π electrons</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Aromatic Compounds (Resonance)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create polymer formation diagram
 */
export function createPolymerFormation(options: AdvancedOrganicOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="polymer-formation" xmlns="http://www.w3.org/2000/svg">
      <!-- Monomers -->
      <g id="monomers">
        ${[0, 1, 2].map(i => `
          <rect x="${40 + i * 40}" y="50" width="30" height="30" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="2" rx="3"/>
          <text x="${55 + i * 40}" y="70" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">M</text>
        `).join('')}
        <text x="70" y="40" font-size="9" fill="#7F8C8D" text-anchor="middle">Monomers</text>
      </g>
      
      <!-- Polymerization arrow -->
      <line x1="140" y1="65" x2="165" y2="65" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="165,62 170,65 165,68" fill="#F39C12"/>
      <text x="152" y="60" font-size="9" fill="#F39C12">Heat/Catalyst</text>
      
      <!-- Polymer chain -->
      <g id="polymer">
        <rect x="180" y="50" width="50" height="30" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="205" y="70" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">-M-M-M-</text>
        <text x="205" y="95" font-size="9" fill="#7F8C8D" text-anchor="middle">Polymer</text>
      </g>
      
      <!-- Repeat unit notation -->
      <text x="120" y="115" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        n(M) → -(M)ₙ-
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Polymer Formation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create stereoisomers diagram
 */
export function createStereoisomers(options: AdvancedOrganicOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="stereoisomers" xmlns="http://www.w3.org/2000/svg">
      <!-- Enantiomer 1 (R) -->
      <g id="enantiomer-r">
        <circle cx="70" cy="80" r="8" fill="#E74C3C"/>
        <text x="70" y="84" font-size="8" fill="white" text-anchor="middle" font-weight="600">C</text>
        
        <!-- Substituents -->
        <line x1="70" y1="72" x2="70" y2="55" stroke="#2C3E50" stroke-width="2"/>
        <text x="70" y="50" font-size="9" fill="#2C3E50" text-anchor="middle">H</text>
        
        <line x1="78" y1="80" x2="95" y2="80" stroke="#2C3E50" stroke-width="2"/>
        <text x="100" y="84" font-size="9" fill="#2C3E50">OH</text>
        
        <line x1="70" y1="88" x2="70" y2="105" stroke="#2C3E50" stroke-width="2"/>
        <text x="70" y="120" font-size="9" fill="#2C3E50" text-anchor="middle">CH₃</text>
        
        <line x1="62" y1="80" x2="45" y2="80" stroke="#2C3E50" stroke-width="2"/>
        <text x="35" y="84" font-size="9" fill="#2C3E50" text-anchor="end">COOH</text>
        
        <text x="70" y="140" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">(R)-form</text>
      </g>
      
      <!-- Mirror plane -->
      <line x1="110" y1="40" x2="110" y2="130" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="110" y="35" font-size="9" fill="#9B59B6" text-anchor="middle">Mirror</text>
      
      <!-- Enantiomer 2 (S) - mirror image -->
      <g id="enantiomer-s">
        <circle cx="150" cy="80" r="8" fill="#3498DB"/>
        <text x="150" y="84" font-size="8" fill="white" text-anchor="middle" font-weight="600">C</text>
        
        <!-- Substituents (mirrored) -->
        <line x1="150" y1="72" x2="150" y2="55" stroke="#2C3E50" stroke-width="2"/>
        <text x="150" y="50" font-size="9" fill="#2C3E50" text-anchor="middle">H</text>
        
        <line x1="142" y1="80" x2="125" y2="80" stroke="#2C3E50" stroke-width="2"/>
        <text x="115" y="84" font-size="9" fill="#2C3E50" text-anchor="end">OH</text>
        
        <line x1="150" y1="88" x2="150" y2="105" stroke="#2C3E50" stroke-width="2"/>
        <text x="150" y="120" font-size="9" fill="#2C3E50" text-anchor="middle">CH₃</text>
        
        <line x1="158" y1="80" x2="175" y2="80" stroke="#2C3E50" stroke-width="2"/>
        <text x="185" y="84" font-size="9" fill="#2C3E50">COOH</text>
        
        <text x="150" y="140" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">(S)-form</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Stereoisomers (Enantiomers)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create reaction mechanism (curved arrow notation) diagram
 */
export function createReactionMechanism(options: AdvancedOrganicOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="reaction-mechanism" xmlns="http://www.w3.org/2000/svg">
      <!-- Nucleophile -->
      <text x="40" y="70" font-size="12" fill="#27AE60" font-weight="600">:Nu⁻</text>
      <text x="40" y="85" font-size="8" fill="#7F8C8D">Nucleophile</text>
      
      <!-- Curved arrow (electron movement) -->
      <path d="M 65,65 Q 85,55 105,60" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <polygon points="105,60 110,58 107,63" fill="#E74C3C"/>
      
      <!-- Electrophile -->
      <g id="electrophile">
        <text x="115" y="65" font-size="12" fill="#3498DB" font-weight="600">C</text>
        <line x1="125" y1="60" x2="140" y2="60" stroke="#2C3E50" stroke-width="2"/>
        <text x="145" y="64" font-size="11" fill="#2C3E50">X</text>
        <text x="115" y="80" font-size="8" fill="#7F8C8D">Electrophile</text>
      </g>
      
      <!-- Reaction arrow -->
      <line x1="160" y1="65" x2="180" y2="65" stroke="#F39C12" stroke-width="2"/>
      <polygon points="180,62 185,65 180,68" fill="#F39C12"/>
      
      <!-- Product -->
      <text x="195" y="70" font-size="12" fill="#9B59B6" font-weight="600">Nu-C + X⁻</text>
      <text x="210" y="85" font-size="8" fill="#7F8C8D" text-anchor="middle">Product</text>
      
      <!-- Mechanism label -->
      <text x="110" y="115" font-size="9" fill="#E74C3C" text-anchor="middle">
        Curved arrow = electron pair movement
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Reaction Mechanism (SN2)
        </text>
      ` : ''}
    </svg>
  `;
}
