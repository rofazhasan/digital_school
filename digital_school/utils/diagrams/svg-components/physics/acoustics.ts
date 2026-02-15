/**
 * Acoustics Components
 * Sound intensity, beat frequency, harmonics, acoustic resonance
 */

export interface AcousticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create sound intensity (decibel scale) diagram
 */
export function createSoundIntensity(options: AcousticsOptions = {}): string {
    const { width = 180, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="sound-intensity" xmlns="http://www.w3.org/2000/svg">
      <!-- Decibel scale -->
      <rect x="60" y="30" width="60" height="150" fill="url(#intensity-gradient)" stroke="#2C3E50" stroke-width="2" rx="3"/>
      
      <defs>
        <linearGradient id="intensity-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#F39C12;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#27AE60;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Scale markers -->
      ${[
            { db: 140, label: 'Jet engine', y: 35 },
            { db: 120, label: 'Rock concert', y: 55 },
            { db: 90, label: 'Lawnmower', y: 85 },
            { db: 60, label: 'Conversation', y: 115 },
            { db: 30, label: 'Whisper', y: 145 },
            { db: 0, label: 'Threshold', y: 175 }
        ].map(item => `
        <line x1="55" y1="${item.y}" x2="125" y2="${item.y}" stroke="#2C3E50" stroke-width="1"/>
        <text x="50" y="${item.y + 4}" font-size="9" fill="#2C3E50" text-anchor="end">${item.db} dB</text>
        <text x="130" y="${item.y + 4}" font-size="8" fill="#7F8C8D">${item.label}</text>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Sound Intensity (Decibel Scale)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create beat frequency diagram
 */
export function createBeatFrequency(options: AcousticsOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="beat-frequency" xmlns="http://www.w3.org/2000/svg">
      <!-- Wave 1 (f1) -->
      <path d="M 20,50 Q 35,40 50,50 Q 65,60 80,50 Q 95,40 110,50 Q 125,60 140,50 Q 155,40 170,50 Q 185,60 200,50" 
            stroke="#E74C3C" stroke-width="2" fill="none"/>
      <text x="210" y="52" font-size="10" fill="#E74C3C">f₁</text>
      
      <!-- Wave 2 (f2, slightly different frequency) -->
      <path d="M 20,90 Q 37,80 54,90 Q 71,100 88,90 Q 105,80 122,90 Q 139,100 156,90 Q 173,80 190,90" 
            stroke="#3498DB" stroke-width="2" fill="none"/>
      <text x="210" y="92" font-size="10" fill="#3498DB">f₂</text>
      
      <!-- Resultant wave (beats) -->
      <path d="M 20,130 Q 30,115 40,130 Q 50,145 60,130 Q 70,115 80,130 Q 90,145 100,130 Q 110,120 120,130 Q 130,140 140,130 Q 150,125 160,130 Q 170,135 180,130 Q 190,127 200,130" 
            stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="210" y="132" font-size="10" fill="#27AE60">Beat</text>
      
      <!-- Beat envelope -->
      <path d="M 20,115 Q 60,105 100,115 Q 140,125 180,115" 
            stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/>
      <path d="M 20,145 Q 60,155 100,145 Q 140,135 180,145" 
            stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/>
      
      <!-- Beat frequency formula -->
      <text x="110" y="20" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        f<tspan font-size="7" baseline-shift="sub">beat</tspan> = |f₁ - f₂|
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Beat Frequency
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create harmonics diagram
 */
export function createHarmonics(options: AcousticsOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="harmonics" xmlns="http://www.w3.org/2000/svg">
      <!-- String boundaries -->
      <line x1="30" y1="40" x2="30" y2="160" stroke="#2C3E50" stroke-width="3"/>
      <line x1="170" y1="40" x2="170" y2="160" stroke="#2C3E50" stroke-width="3"/>
      
      <!-- Fundamental (1st harmonic) -->
      <path d="M 30,60 Q 100,40 170,60" stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="180" y="62" font-size="10" fill="#E74C3C">n=1 (f₀)</text>
      
      <!-- 2nd harmonic -->
      <path d="M 30,90 Q 70,70 100,90 Q 130,110 170,90" stroke="#3498DB" stroke-width="2.5" fill="none"/>
      <text x="180" y="92" font-size="10" fill="#3498DB">n=2 (2f₀)</text>
      <circle cx="100" cy="90" r="2" fill="#2C3E50"/>
      
      <!-- 3rd harmonic -->
      <path d="M 30,130 Q 55,110 77,130 Q 100,150 123,130 Q 145,110 170,130" stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="180" y="132" font-size="10" fill="#27AE60">n=3 (3f₀)</text>
      <circle cx="77" cy="130" r="2" fill="#2C3E50"/>
      <circle cx="123" cy="130" r="2" fill="#2C3E50"/>
      
      <!-- Node markers -->
      <text x="100" y="25" font-size="9" fill="#7F8C8D" text-anchor="middle">Nodes</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Harmonics (Overtones)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create acoustic resonance diagram
 */
export function createAcousticResonance(options: AcousticsOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="acoustic-resonance" xmlns="http://www.w3.org/2000/svg">
      <!-- Tube (closed at one end) -->
      <rect x="70" y="40" width="60" height="120" fill="#E8F4F8" stroke="#3498DB" stroke-width="2.5" rx="3"/>
      <rect x="70" y="155" width="60" height="5" fill="#2C3E50"/>
      <text x="100" y="35" font-size="9" fill="#7F8C8D" text-anchor="middle">Closed end</text>
      
      <!-- Standing wave pattern -->
      <path d="M 100,50 Q 85,70 100,90 Q 115,110 100,130 Q 85,150 100,160" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      
      <!-- Pressure nodes and antinodes -->
      <circle cx="100" cy="50" r="3" fill="#27AE60"/>
      <text x="115" y="52" font-size="8" fill="#27AE60">Antinode</text>
      
      <circle cx="100" cy="90" r="3" fill="#9B59B6"/>
      <text x="115" y="92" font-size="8" fill="#9B59B6">Node</text>
      
      <circle cx="100" cy="130" r="3" fill="#27AE60"/>
      <text x="115" y="132" font-size="8" fill="#27AE60">Antinode</text>
      
      <circle cx="100" cy="160" r="3" fill="#9B59B6"/>
      <text x="115" y="162" font-size="8" fill="#9B59B6">Node</text>
      
      <!-- Length marker -->
      <line x1="65" y1="50" x2="65" y2="160" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="55" y="105" font-size="10" fill="#F39C12" transform="rotate(-90 55 105)">L</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Acoustic Resonance (Tube)
        </text>
      ` : ''}
    </svg>
  `;
}
