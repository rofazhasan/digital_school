/**
 * Advanced Optics Components
 * Thin film interference, optical fiber, laser, holography
 */

export interface AdvancedOpticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create thin film interference diagram
 */
export function createThinFilmInterference(options: AdvancedOpticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="thin-film-interference" xmlns="http://www.w3.org/2000/svg">
      <!-- Thin film (soap bubble) -->
      <ellipse cx="110" cy="80" rx="60" ry="50" fill="url(#rainbow-gradient)" opacity="0.6" stroke="#9B59B6" stroke-width="2"/>
      
      <!-- Rainbow gradient -->
      <defs>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:0.6" />
          <stop offset="20%" style="stop-color:#F39C12;stop-opacity:0.6" />
          <stop offset="40%" style="stop-color:#F1C40F;stop-opacity:0.6" />
          <stop offset="60%" style="stop-color:#2ECC71;stop-opacity:0.6" />
          <stop offset="80%" style="stop-color:#3498DB;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#9B59B6;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      
      <!-- Incident light -->
      <line x1="30" y1="50" x2="70" y2="70" stroke="#FFD700" stroke-width="2.5"/>
      <polygon points="70,70 65,68 68,64" fill="#FFD700"/>
      <text x="45" y="55" font-size="9" fill="#F39C12">Light</text>
      
      <!-- Reflected rays -->
      <line x1="90" y1="60" x2="70" y2="30" stroke="#E74C3C" stroke-width="2"/>
      <line x1="110" y1="65" x2="90" y2="35" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Film thickness -->
      <line x1="180" y1="70" x2="180" y2="90" stroke="#2C3E50" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="190" y="82" font-size="9" fill="#2C3E50">d</text>
      
      <!-- Interference condition -->
      <text x="110" y="145" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        2nd = mλ (constructive)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Thin Film Interference
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create optical fiber diagram
 */
export function createOpticalFiber(options: AdvancedOpticsOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="optical-fiber" xmlns="http://www.w3.org/2000/svg">
      <!-- Fiber core -->
      <rect x="40" y="60" width="160" height="20" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="2"/>
      <text x="120" y="55" font-size="9" fill="#3498DB" text-anchor="middle">Core (n₁)</text>
      
      <!-- Cladding -->
      <rect x="40" y="50" width="160" height="10" fill="#F0F0F0" stroke="#7F8C8D" stroke-width="1.5" rx="1"/>
      <rect x="40" y="80" width="160" height="10" fill="#F0F0F0" stroke="#7F8C8D" stroke-width="1.5" rx="1"/>
      <text x="120" y="100" font-size="8" fill="#7F8C8D" text-anchor="middle">Cladding (n₂ < n₁)</text>
      
      <!-- Light ray with total internal reflection -->
      <path d="M 50,70 L 80,60 L 110,70 L 140,60 L 170,70 L 190,65" 
            stroke="#FFD700" stroke-width="2.5" fill="none"/>
      
      <!-- Critical angle indicators -->
      <circle cx="80" cy="60" r="2" fill="#E74C3C"/>
      <circle cx="110" cy="70" r="2" fill="#E74C3C"/>
      <circle cx="140" cy="60" r="2" fill="#E74C3C"/>
      
      <!-- TIR label -->
      <text x="120" y="115" font-size="9" fill="#27AE60" text-anchor="middle">
        Total Internal Reflection
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Optical Fiber (TIR)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create laser principle diagram
 */
export function createLaserPrinciple(options: AdvancedOpticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="laser-principle" xmlns="http://www.w3.org/2000/svg">
      <!-- Energy levels -->
      <line x1="50" y1="100" x2="120" y2="100" stroke="#E74C3C" stroke-width="2.5"/>
      <text x="40" y="104" font-size="9" fill="#E74C3C" text-anchor="end">E₂</text>
      
      <line x1="50" y1="130" x2="120" y2="130" stroke="#3498DB" stroke-width="2.5"/>
      <text x="40" y="134" font-size="9" fill="#3498DB" text-anchor="end">E₁</text>
      
      <!-- Excited atom -->
      <circle cx="70" cy="100" r="5" fill="#F39C12"/>
      <text x="70" y="90" font-size="8" fill="#7F8C8D" text-anchor="middle">Excited</text>
      
      <!-- Stimulating photon -->
      <line x1="50" y1="115" x2="65" y2="115" stroke="#FFD700" stroke-width="2"/>
      <circle cx="65" cy="115" r="2" fill="#FFD700"/>
      <text x="55" y="112" font-size="8" fill="#F39C12">hν</text>
      
      <!-- Stimulated emission -->
      <line x1="75" y1="115" x2="100" y2="115" stroke="#FFD700" stroke-width="2"/>
      <circle cx="100" cy="115" r="2" fill="#FFD700"/>
      <line x1="75" y1="120" x2="100" y2="120" stroke="#FFD700" stroke-width="2"/>
      <circle cx="100" cy="120" r="2" fill="#FFD700"/>
      <text x="110" y="118" font-size="8" fill="#27AE60">2 photons</text>
      
      <!-- Mirrors -->
      <rect x="140" y="90" width="5" height="50" fill="#7F8C8D"/>
      <rect x="200" y="90" width="5" height="50" fill="#7F8C8D" opacity="0.5"/>
      <text x="172" y="85" font-size="8" fill="#7F8C8D" text-anchor="middle">Mirrors</text>
      
      <!-- Laser beam output -->
      <line x1="205" y1="115" x2="220" y2="115" stroke="#E74C3C" stroke-width="3"/>
      <polygon points="220,112 225,115 220,118" fill="#E74C3C"/>
      <text x="212" y="110" font-size="9" fill="#E74C3C">Laser</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Laser (Stimulated Emission)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create holography diagram
 */
export function createHolography(options: AdvancedOpticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="holography" xmlns="http://www.w3.org/2000/svg">
      <!-- Laser source -->
      <circle cx="30" cy="80" r="8" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="30" y="70" font-size="8" fill="#E74C3C" text-anchor="middle">Laser</text>
      
      <!-- Beam splitter -->
      <rect x="70" y="70" width="20" height="20" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" transform="rotate(45 80 80)"/>
      <text x="80" y="65" font-size="8" fill="#3498DB" text-anchor="middle">Splitter</text>
      
      <!-- Reference beam -->
      <line x1="40" y1="80" x2="70" y2="80" stroke="#FFD700" stroke-width="2"/>
      <line x1="90" y1="80" x2="120" y2="80" stroke="#FFD700" stroke-width="2"/>
      <text x="105" y="75" font-size="8" fill="#F39C12">Reference</text>
      
      <!-- Object beam -->
      <line x1="80" y1="90" x2="80" y2="120" stroke="#FFD700" stroke-width="2"/>
      
      <!-- Object -->
      <circle cx="80" cy="135" r="10" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
      <text x="95" y="138" font-size="8" fill="#27AE60">Object</text>
      
      <!-- Holographic plate -->
      <rect x="115" y="60" width="5" height="40" fill="#9B59B6" stroke="#8E44AD" stroke-width="2"/>
      <text x="130" y="85" font-size="8" fill="#9B59B6">Plate</text>
      
      <!-- Interference pattern -->
      ${[0, 1, 2, 3, 4].map(i =>
        `<line x1="117" y1="${65 + i * 8}" x2="117" y2="${67 + i * 8}" stroke="#2C3E50" stroke-width="1.5"/>`
    ).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Holography Setup
        </text>
      ` : ''}
    </svg>
  `;
}
