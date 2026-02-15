/**
 * Advanced Analytical Chemistry Components
 * Chromatography types, electrochemical methods, thermal analysis
 */

export interface AnalyticalAdvancedOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create chromatography types comparison diagram
 */
export function createChromatographyTypes(options: AnalyticalAdvancedOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="chromatography-types" xmlns="http://www.w3.org/2000/svg">
      <!-- TLC (Thin Layer Chromatography) -->
      <g id="tlc">
        <rect x="30" y="50" width="50" height="80" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="2"/>
        <line x1="30" y1="120" x2="80" y2="120" stroke="#E74C3C" stroke-width="2"/>
        ${[0, 1, 2].map(i => `
          <circle cx="${45 + i * 10}" cy="${110 - i * 15}" r="3" fill="#F39C12"/>
        `).join('')}
        <text x="55" y="40" font-size="9" fill="#3498DB" text-anchor="middle" font-weight="600">TLC</text>
      </g>
      
      <!-- Column Chromatography -->
      <g id="column">
        <rect x="100" y="40" width="30" height="90" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="2"/>
        <rect x="105" y="50" width="20" height="70" fill="#E8F4F8" opacity="0.5"/>
        ${[0, 1, 2].map(i => `
          <rect x="105" y="${60 + i * 20}" width="20" height="8" fill="#F39C12" opacity="${0.7 - i * 0.2}"/>
        `).join('')}
        <text x="115" y="30" font-size="9" fill="#9B59B6" text-anchor="middle" font-weight="600">Column</text>
      </g>
      
      <!-- HPLC (High Performance Liquid Chromatography) -->
      <g id="hplc">
        <rect x="160" y="50" width="60" height="40" fill="#E8F8F0" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="190" y="70" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Pump</text>
        <line x1="220" y1="70" x2="230" y2="70" stroke="#2C3E50" stroke-width="2"/>
        <circle cx="235" cy="70" r="8" fill="#3498DB" opacity="0.5"/>
        <text x="190" y="40" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">HPLC</text>
        <text x="190" y="110" font-size="8" fill="#7F8C8D" text-anchor="middle">High pressure</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Chromatography Types
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create electrochemical methods diagram
 */
export function createElectrochemicalMethods(options: AnalyticalAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="electrochemical-methods" xmlns="http://www.w3.org/2000/svg">
      <!-- Potentiometry -->
      <g id="potentiometry">
        <rect x="30" y="50" width="80" height="50" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="70" y="40" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Potentiometry</text>
        <text x="70" y="70" font-size="10" fill="#E74C3C" text-anchor="middle">Measure E</text>
        <text x="70" y="85" font-size="9" fill="#2C3E50" text-anchor="middle">I ≈ 0</text>
        <text x="70" y="115" font-size="8" fill="#7F8C8D" text-anchor="middle">pH meter, ISE</text>
      </g>
      
      <!-- Voltammetry -->
      <g id="voltammetry">
        <rect x="130" y="50" width="80" height="50" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="170" y="40" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Voltammetry</text>
        <text x="170" y="70" font-size="10" fill="#E74C3C" text-anchor="middle">Vary E</text>
        <text x="170" y="85" font-size="9" fill="#2C3E50" text-anchor="middle">Measure I</text>
        <text x="170" y="115" font-size="8" fill="#7F8C8D" text-anchor="middle">Cyclic voltammetry</text>
      </g>
      
      <!-- Current-voltage curve -->
      <line x1="40" y1="140" x2="200" y2="140" stroke="#2C3E50" stroke-width="1.5"/>
      <line x1="40" y1="120" x2="40" y2="140" stroke="#2C3E50" stroke-width="1.5"/>
      <path d="M 40,140 Q 80,135 120,125 Q 160,120 200,120" stroke="#27AE60" stroke-width="2" fill="none"/>
      <text x="120" y="155" font-size="8" fill="#7F8C8D" text-anchor="middle">E (V)</text>
      <text x="30" y="130" font-size="8" fill="#7F8C8D">I</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Electrochemical Methods
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create thermal analysis diagram
 */
export function createThermalAnalysis(options: AnalyticalAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="thermal-analysis" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Temperature (°C)</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Mass / Heat Flow</text>
      
      <!-- TGA curve (mass loss) -->
      <path d="M 30,50 L 80,50 L 90,70 L 140,70 L 150,100 L 200,100" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="180" y="95" font-size="9" fill="#E74C3C">TGA</text>
      <text x="180" y="105" font-size="8" fill="#7F8C8D">(mass loss)</text>
      
      <!-- DSC curve (heat flow) -->
      <path d="M 30,120 Q 60,115 80,110 L 90,105 Q 110,108 130,110 L 150,105 Q 175,108 200,110" 
            stroke="#3498DB" stroke-width="2.5" fill="none"/>
      <text x="180" y="115" font-size="9" fill="#3498DB">DSC</text>
      <text x="180" y="125" font-size="8" fill="#7F8C8D">(heat flow)</text>
      
      <!-- Transition markers -->
      <line x1="90" y1="70" x2="90" y2="130" stroke="#F39C12" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="90" y="145" font-size="8" fill="#F39C12" text-anchor="middle">Decomp.</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Thermal Analysis (TGA/DSC)
        </text>
      ` : ''}
    </svg>
  `;
}
