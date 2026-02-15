/**
 * Professional Wave Components
 * Sound waves, Doppler effect, standing waves, resonance
 */

export interface WaveOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create sound wave propagation
 */
export function createSoundWave(options: WaveOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="sound-wave" xmlns="http://www.w3.org/2000/svg">
      <!-- Compressions and rarefactions -->
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 20 + i * 25;
        const isCompression = i % 2 === 0;
        const density = isCompression ? 8 : 3;
        return Array.from({ length: density }, (_, j) => {
            const offset = (Math.random() - 0.5) * 8;
            return `<circle cx="${x + offset}" cy="${60 + (Math.random() - 0.5) * 40}" r="2" fill="${isCompression ? '#E74C3C' : '#3498DB'}" opacity="0.6"/>`;
        }).join('');
    }).join('')}
      
      <!-- Wave representation -->
      <path d="M 20,60 Q 45,30 70,60 Q 95,90 120,60 Q 145,30 170,60 Q 195,90 220,60" 
            stroke="#2C3E50" stroke-width="2" fill="none" opacity="0.5"/>
      
      <!-- Wavelength marker -->
      <line x1="20" y1="100" x2="120" y2="100" stroke="#27AE60" stroke-width="1.5"/>
      <line x1="20" y1="95" x2="20" y2="105" stroke="#27AE60" stroke-width="1.5"/>
      <line x1="120" y1="95" x2="120" y2="105" stroke="#27AE60" stroke-width="1.5"/>
      <text x="70" y="115" font-size="10" fill="#27AE60" text-anchor="middle">λ</text>
      
      <!-- Labels -->
      <text x="45" y="25" font-size="9" fill="#E74C3C">Compression</text>
      <text x="145" y="105" font-size="9" fill="#3498DB">Rarefaction</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Sound Wave Propagation
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Doppler effect diagram
 */
export function createDopplerEffect(options: WaveOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="doppler-effect" xmlns="http://www.w3.org/2000/svg">
      <!-- Moving source -->
      <circle cx="80" cy="70" r="12" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="80" y="75" font-size="10" fill="white" text-anchor="middle" font-weight="600">S</text>
      
      <!-- Velocity arrow -->
      <line x1="92" y1="70" x2="115" y2="70" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="115,67 120,70 115,73" fill="#F39C12"/>
      <text x="106" y="65" font-size="9" fill="#F39C12">v</text>
      
      <!-- Wave circles (compressed ahead, expanded behind) -->
      ${[0, 1, 2, 3].map(i => {
        const rAhead = 15 + i * 12;
        const rBehind = 15 + i * 15;
        return `
          <circle cx="80" cy="70" r="${rAhead}" fill="none" stroke="#3498DB" stroke-width="1.5" opacity="${0.8 - i * 0.15}"/>
          <circle cx="80" cy="70" r="${rBehind}" fill="none" stroke="#3498DB" stroke-width="1.5" opacity="${0.8 - i * 0.15}" stroke-dasharray="0,${Math.PI * 2 * rBehind / 2},${Math.PI * 2 * rBehind}"/>
        `;
    }).join('')}
      
      <!-- Observer ahead -->
      <circle cx="160" cy="70" r="8" fill="#27AE60" stroke="#229954" stroke-width="2"/>
      <text x="160" y="74" font-size="8" fill="white" text-anchor="middle" font-weight="600">O</text>
      <text x="160" y="90" font-size="8" fill="#27AE60" text-anchor="middle">Higher f</text>
      
      <!-- Observer behind -->
      <circle cx="20" cy="70" r="8" fill="#9B59B6" stroke="#7D3C98" stroke-width="2"/>
      <text x="20" y="74" font-size="8" fill="white" text-anchor="middle" font-weight="600">O</text>
      <text x="20" y="90" font-size="8" fill="#9B59B6" text-anchor="middle">Lower f</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Doppler Effect
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create standing wave
 */
export function createStandingWave(options: WaveOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="standing-wave" xmlns="http://www.w3.org/2000/svg">
      <!-- Fixed ends -->
      <line x1="20" y1="40" x2="20" y2="80" stroke="#2C3E50" stroke-width="3"/>
      <line x1="200" y1="40" x2="200" y2="80" stroke="#2C3E50" stroke-width="3"/>
      
      <!-- Standing wave (fundamental) -->
      <path d="M 20,60 Q 60,30 110,60 Q 160,90 200,60" stroke="#3498DB" stroke-width="3" fill="none"/>
      <path d="M 20,60 Q 60,90 110,60 Q 160,30 200,60" stroke="#3498DB" stroke-width="3" fill="none" opacity="0.3"/>
      
      <!-- Nodes -->
      <circle cx="20" cy="60" r="4" fill="#E74C3C"/>
      <circle cx="110" cy="60" r="4" fill="#E74C3C"/>
      <circle cx="200" cy="60" r="4" fill="#E74C3C"/>
      <text x="110" y="50" font-size="9" fill="#E74C3C" text-anchor="middle">Node</text>
      
      <!-- Antinodes -->
      <circle cx="65" cy="30" r="4" fill="#27AE60"/>
      <circle cx="155" cy="90" r="4" fill="#27AE60"/>
      <text x="65" y="20" font-size="9" fill="#27AE60" text-anchor="middle">Antinode</text>
      
      <!-- Wavelength -->
      <line x1="20" y1="100" x2="200" y2="100" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="110" y="115" font-size="10" fill="#F39C12" text-anchor="middle">λ = 2L (n=1)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Standing Wave (Fundamental)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create resonance curve
 */
export function createResonance(options: WaveOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="resonance" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="140" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="140" x2="190" y2="140" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Resonance curve (Lorentzian) -->
      <path d="M 30,135 Q 50,130 70,110 Q 90,50 110,30 Q 130,50 150,110 Q 170,130 190,135" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      
      <!-- Peak marker -->
      <line x1="110" y1="30" x2="110" y2="145" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="110" y="20" font-size="10" fill="#27AE60" text-anchor="middle">f₀</text>
      <text x="110" y="155" font-size="9" fill="#27AE60" text-anchor="middle">Resonant</text>
      <text x="110" y="165" font-size="9" fill="#27AE60" text-anchor="middle">Frequency</text>
      
      <!-- Amplitude marker -->
      <line x1="25" y1="30" x2="35" y2="30" stroke="#E74C3C" stroke-width="1.5"/>
      <text x="20" y="33" font-size="10" fill="#E74C3C" text-anchor="end">A<tspan font-size="7" baseline-shift="sub">max</tspan></text>
      
      <!-- Labels -->
      <text x="195" y="143" font-size="11" fill="#2C3E50" font-style="italic">f</text>
      <text x="25" y="15" font-size="11" fill="#2C3E50" font-style="italic">A</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Resonance Curve
        </text>
      ` : ''}
    </svg>
  `;
}
