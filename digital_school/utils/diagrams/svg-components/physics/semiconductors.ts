/**
 * Professional Semiconductor and Logic Gate Components
 * Detailed semiconductor devices and digital logic gates
 */

export interface SemiconductorOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create PN junction diagram
 */
export function createPNJunction(options: SemiconductorOptions = {}): string {
    const { width = 160, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="pn-junction" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- P-type gradient (holes - positive) -->
        <linearGradient id="pTypeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#FF8E8E;stop-opacity:0.4" />
        </linearGradient>
        
        <!-- N-type gradient (electrons - negative) -->
        <linearGradient id="nTypeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4ECDC4;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#45B7AF;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      
      <!-- P-type region -->
      <rect x="10" y="20" width="65" height="60" fill="url(#pTypeGrad)" 
            stroke="#E74C3C" stroke-width="2"/>
      
      <!-- N-type region -->
      <rect x="85" y="20" width="65" height="60" fill="url(#nTypeGrad)" 
            stroke="#3498DB" stroke-width="2"/>
      
      <!-- Depletion region -->
      <rect x="75" y="20" width="10" height="60" fill="#ECF0F1" opacity="0.8"/>
      
      <!-- Holes (positive charges) in P-type -->
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 20 + (i % 4) * 15;
        const y = 30 + Math.floor(i / 4) * 25;
        return `
          <circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#E74C3C" stroke-width="2"/>
          <text x="${x}" y="${y + 4}" font-size="10" fill="#E74C3C" text-anchor="middle">+</text>
        `;
    }).join('')}
      
      <!-- Electrons (negative charges) in N-type -->
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 95 + (i % 4) * 15;
        const y = 30 + Math.floor(i / 4) * 25;
        return `
          <circle cx="${x}" cy="${y}" r="4" fill="#3498DB"/>
          <text x="${x}" y="${y + 4}" font-size="10" fill="white" text-anchor="middle">−</text>
        `;
    }).join('')}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="42" y="15" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#E74C3C" text-anchor="middle">
          P-type
        </text>
        <text x="117" y="15" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#3498DB" text-anchor="middle">
          N-type
        </text>
        <text x="80" y="95" font-size="9" font-family="Inter, sans-serif" 
              fill="#7F8C8D" text-anchor="middle">
          Depletion
        </text>
        <text x="80" y="120" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          PN Junction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create AND logic gate
 */
export function createANDGate(options: SemiconductorOptions = {}): string {
    const { width = 80, height = 60, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-and-gate" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- AND gate shape -->
      <path d="M 10,10 L 35,10 Q 60,10 60,30 Q 60,50 35,50 L 10,50 Z" 
            fill="url(#gateGrad)" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input lines -->
      <line x1="0" y1="20" x2="10" y2="20" stroke="#2C3E50" stroke-width="2"/>
      <line x1="0" y1="40" x2="10" y2="40" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Output line -->
      <line x1="60" y1="30" x2="80" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input dots -->
      <circle cx="0" cy="20" r="2" fill="#E74C3C"/>
      <circle cx="0" cy="40" r="2" fill="#E74C3C"/>
      
      <!-- Output dot -->
      <circle cx="80" cy="30" r="2" fill="#27AE60"/>
      
      ${showLabel ? `
        <!-- Gate label -->
        <text x="35" y="35" font-size="12" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">
          AND
        </text>
        
        <!-- Input labels -->
        <text x="5" y="17" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">A</text>
        <text x="5" y="37" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">B</text>
        
        <!-- Output label -->
        <text x="70" y="27" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">Y</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create OR logic gate
 */
export function createORGate(options: SemiconductorOptions = {}): string {
    const { width = 80, height = 60, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-or-gate" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orGateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#27AE60;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#229954;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- OR gate shape -->
      <path d="M 10,10 Q 20,10 30,10 Q 60,30 30,50 Q 20,50 10,50 Q 20,30 10,10 Z" 
            fill="url(#orGateGrad)" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input lines -->
      <line x1="0" y1="20" x2="12" y2="20" stroke="#2C3E50" stroke-width="2"/>
      <line x1="0" y1="40" x2="12" y2="40" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Output line -->
      <line x1="60" y1="30" x2="80" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input dots -->
      <circle cx="0" cy="20" r="2" fill="#E74C3C"/>
      <circle cx="0" cy="40" r="2" fill="#E74C3C"/>
      
      <!-- Output dot -->
      <circle cx="80" cy="30" r="2" fill="#27AE60"/>
      
      ${showLabel ? `
        <!-- Gate label -->
        <text x="35" y="35" font-size="12" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">
          OR
        </text>
        
        <!-- Input labels -->
        <text x="5" y="17" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">A</text>
        <text x="5" y="37" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">B</text>
        
        <!-- Output label -->
        <text x="70" y="27" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">Y</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create NOT logic gate (Inverter)
 */
export function createNOTGate(options: SemiconductorOptions = {}): string {
    const { width = 70, height = 50, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-not-gate" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="notGateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- NOT gate triangle -->
      <path d="M 10,10 L 50,30 L 10,50 Z" 
            fill="url(#notGateGrad)" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Inversion bubble -->
      <circle cx="55" cy="30" r="5" fill="white" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input line -->
      <line x1="0" y1="30" x2="10" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Output line -->
      <line x1="60" y1="30" x2="70" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input dot -->
      <circle cx="0" cy="30" r="2" fill="#E74C3C"/>
      
      <!-- Output dot -->
      <circle cx="70" cy="30" r="2" fill="#27AE60"/>
      
      ${showLabel ? `
        <!-- Gate label -->
        <text x="25" y="33" font-size="11" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">
          NOT
        </text>
        
        <!-- Input label -->
        <text x="5" y="27" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">A</text>
        
        <!-- Output label -->
        <text x="62" y="27" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">Ā</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create NAND logic gate
 */
export function createNANDGate(options: SemiconductorOptions = {}): string {
    const { width = 85, height = 60, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-nand-gate" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nandGateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#9B59B6;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#8E44AD;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- NAND gate shape (AND + bubble) -->
      <path d="M 10,10 L 35,10 Q 60,10 60,30 Q 60,50 35,50 L 10,50 Z" 
            fill="url(#nandGateGrad)" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Inversion bubble -->
      <circle cx="65" cy="30" r="5" fill="white" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input lines -->
      <line x1="0" y1="20" x2="10" y2="20" stroke="#2C3E50" stroke-width="2"/>
      <line x1="0" y1="40" x2="10" y2="40" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Output line -->
      <line x1="70" y1="30" x2="85" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input dots -->
      <circle cx="0" cy="20" r="2" fill="#E74C3C"/>
      <circle cx="0" cy="40" r="2" fill="#E74C3C"/>
      
      <!-- Output dot -->
      <circle cx="85" cy="30" r="2" fill="#27AE60"/>
      
      ${showLabel ? `
        <!-- Gate label -->
        <text x="35" y="35" font-size="11" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">
          NAND
        </text>
        
        <!-- Input labels -->
        <text x="5" y="17" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">A</text>
        <text x="5" y="37" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">B</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create NOR logic gate
 */
export function createNORGate(options: SemiconductorOptions = {}): string {
    const { width = 85, height = 60, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-nor-gate" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="norGateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F39C12;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- NOR gate shape (OR + bubble) -->
      <path d="M 10,10 Q 20,10 30,10 Q 60,30 30,50 Q 20,50 10,50 Q 20,30 10,10 Z" 
            fill="url(#norGateGrad)" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Inversion bubble -->
      <circle cx="65" cy="30" r="5" fill="white" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input lines -->
      <line x1="0" y1="20" x2="12" y2="20" stroke="#2C3E50" stroke-width="2"/>
      <line x1="0" y1="40" x2="12" y2="40" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Output line -->
      <line x1="70" y1="30" x2="85" y2="30" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Input dots -->
      <circle cx="0" cy="20" r="2" fill="#E74C3C"/>
      <circle cx="0" cy="40" r="2" fill="#E74C3C"/>
      
      <!-- Output dot -->
      <circle cx="85" cy="30" r="2" fill="#27AE60"/>
      
      ${showLabel ? `
        <!-- Gate label -->
        <text x="35" y="35" font-size="11" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">
          NOR
        </text>
        
        <!-- Input labels -->
        <text x="5" y="17" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">A</text>
        <text x="5" y="37" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">B</text>
      ` : ''}
    </svg>
  `;
}
