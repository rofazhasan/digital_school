/**
 * Spectroscopy Components
 * IR, NMR, Mass spec, UV-Vis spectroscopy
 */

export interface SpectroscopyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create IR spectroscopy diagram
 */
export function createIRSpectroscopy(options: SpectroscopyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ir-spectroscopy" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Wavenumber (cm⁻¹)</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Transmittance %</text>
      
      <!-- Spectrum with characteristic peaks -->
      <path d="M 30,40 L 60,40 L 65,80 L 70,40 L 100,40 L 105,90 L 110,40 L 140,40 L 145,70 L 150,40 L 200,40" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      
      <!-- Peak labels -->
      <text x="67" y="95" font-size="8" fill="#3498DB" text-anchor="middle">O-H</text>
      <text x="107" y="105" font-size="8" fill="#3498DB" text-anchor="middle">C=O</text>
      <text x="147" y="85" font-size="8" fill="#3498DB" text-anchor="middle">C-H</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          IR Spectroscopy
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create NMR spectroscopy diagram
 */
export function createNMRSpectroscopy(options: SpectroscopyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nmr-spectroscopy" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Chemical Shift (ppm)</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Intensity</text>
      
      <!-- NMR peaks -->
      ${[
            { x: 60, height: 60, label: 'CH₃' },
            { x: 100, height: 40, label: 'CH₂' },
            { x: 160, height: 80, label: 'OH' }
        ].map(peak => `
        <rect x="${peak.x - 3}" y="${130 - peak.height}" width="6" height="${peak.height}" fill="#3498DB"/>
        <text x="${peak.x}" y="${125 - peak.height}" font-size="8" fill="#E74C3C" text-anchor="middle">${peak.label}</text>
      `).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          NMR Spectroscopy
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create mass spectrometry diagram
 */
export function createMassSpectrometry(options: SpectroscopyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="mass-spectrometry" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">m/z</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Relative Abundance</text>
      
      <!-- Mass spectrum peaks -->
      ${[
            { x: 50, height: 30, mz: '15' },
            { x: 80, height: 50, mz: '29' },
            { x: 120, height: 40, mz: '43' },
            { x: 170, height: 90, mz: '58' }
        ].map(peak => `
        <rect x="${peak.x - 2}" y="${130 - peak.height}" width="4" height="${peak.height}" fill="#27AE60"/>
        <text x="${peak.x}" y="${145}" font-size="8" fill="#7F8C8D" text-anchor="middle">${peak.mz}</text>
      `).join('')}
      
      <!-- Molecular ion peak marker -->
      <text x="170" y="30" font-size="9" fill="#E74C3C" text-anchor="middle">M⁺</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Mass Spectrometry
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create UV-Vis spectroscopy diagram
 */
export function createUVVisSpectroscopy(options: SpectroscopyOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="uv-vis-spectroscopy" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Wavelength (nm)</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Absorbance</text>
      
      <!-- UV-Vis absorption curve -->
      <path d="M 30,130 Q 60,120 80,80 Q 100,40 120,60 Q 140,80 160,100 Q 180,120 200,130" 
            stroke="#9B59B6" stroke-width="2.5" fill="none"/>
      
      <!-- Peak marker -->
      <circle cx="100" cy="40" r="3" fill="#E74C3C"/>
      <text x="100" y="30" font-size="9" fill="#E74C3C" text-anchor="middle">λmax</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          UV-Vis Spectroscopy
        </text>
      ` : ''}
    </svg>
  `;
}
