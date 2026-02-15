/**
 * Advanced Ecology Components
 * Population growth, predator-prey, ecological succession
 */

export interface EcologyAdvancedOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create population growth curve diagram
 */
export function createPopulationGrowth(options: EcologyAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="population-growth" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Time</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Population Size</text>
      
      <!-- Exponential growth (J-curve) -->
      <path d="M 30,125 Q 60,110 90,80 Q 120,40 150,25 Q 175,15 200,10" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="180" y="20" font-size="9" fill="#E74C3C">Exponential</text>
      
      <!-- Logistic growth (S-curve) -->
      <path d="M 30,125 Q 60,110 90,70 Q 120,45 150,40 Q 175,38 200,37" 
            stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="180" y="50" font-size="9" fill="#27AE60">Logistic</text>
      
      <!-- Carrying capacity -->
      <line x1="30" y1="37" x2="200" y2="37" stroke="#3498DB" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="205" y="41" font-size="9" fill="#3498DB">K (carrying capacity)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Population Growth Curves
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create predator-prey cycle diagram
 */
export function createPredatorPreyCycle(options: EcologyAdvancedOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="predator-prey-cycle" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="130" x2="200" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="30" x2="30" y2="130" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="200,127 205,130 200,133" fill="#2C3E50"/>
      <polygon points="27,30 30,25 33,30" fill="#2C3E50"/>
      
      <!-- Labels -->
      <text x="115" y="150" font-size="10" fill="#2C3E50" text-anchor="middle">Time</text>
      <text x="15" y="80" font-size="10" fill="#2C3E50" transform="rotate(-90 15 80)">Population</text>
      
      <!-- Prey population (oscillating, leads) -->
      <path d="M 30,80 Q 50,50 70,80 Q 90,110 110,80 Q 130,50 150,80 Q 170,110 190,80" 
            stroke="#27AE60" stroke-width="2.5" fill="none"/>
      <text x="200" y="75" font-size="9" fill="#27AE60">Prey</text>
      
      <!-- Predator population (oscillating, lags) -->
      <path d="M 40,90 Q 60,60 80,90 Q 100,120 120,90 Q 140,60 160,90 Q 180,120 200,90" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="200" y="95" font-size="9" fill="#E74C3C">Predator</text>
      
      <!-- Phase indicators -->
      <text x="70" y="45" font-size="8" fill="#7F8C8D">Prey ↑</text>
      <text x="110" y="115" font-size="8" fill="#7F8C8D">Prey ↓</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Predator-Prey Cycle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create ecological succession diagram
 */
export function createEcologicalSuccession(options: EcologyAdvancedOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ecological-succession" xmlns="http://www.w3.org/2000/svg">
      <!-- Pioneer stage -->
      <g id="pioneer">
        <rect x="20" y="80" width="40" height="40" fill="#F0E68C" opacity="0.3" stroke="#F39C12" stroke-width="2" rx="3"/>
        <text x="40" y="105" font-size="9" fill="#2C3E50" text-anchor="middle">Lichens</text>
        <text x="40" y="115" font-size="9" fill="#2C3E50" text-anchor="middle">Mosses</text>
        <text x="40" y="70" font-size="9" fill="#F39C12" text-anchor="middle" font-weight="600">Pioneer</text>
      </g>
      
      <!-- Early stage -->
      <g id="early">
        <rect x="70" y="70" width="40" height="50" fill="#90EE90" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="90" y="100" font-size="9" fill="#2C3E50" text-anchor="middle">Grasses</text>
        <text x="90" y="110" font-size="9" fill="#2C3E50" text-anchor="middle">Shrubs</text>
        <text x="90" y="60" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Early</text>
      </g>
      
      <!-- Intermediate stage -->
      <g id="intermediate">
        <rect x="120" y="50" width="40" height="70" fill="#228B22" opacity="0.3" stroke="#2ECC71" stroke-width="2" rx="3"/>
        <text x="140" y="90" font-size="9" fill="#2C3E50" text-anchor="middle">Young</text>
        <text x="140" y="100" font-size="9" fill="#2C3E50" text-anchor="middle">Trees</text>
        <text x="140" y="40" font-size="9" fill="#2ECC71" text-anchor="middle" font-weight="600">Intermediate</text>
      </g>
      
      <!-- Climax stage -->
      <g id="climax">
        <rect x="170" y="30" width="50" height="90" fill="#006400" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="195" y="80" font-size="9" fill="#2C3E50" text-anchor="middle">Mature</text>
        <text x="195" y="90" font-size="9" fill="#2C3E50" text-anchor="middle">Forest</text>
        <text x="195" y="20" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Climax</text>
      </g>
      
      <!-- Time arrow -->
      <line x1="20" y1="135" x2="220" y2="135" stroke="#3498DB" stroke-width="2"/>
      <polygon points="220,132 225,135 220,138" fill="#3498DB"/>
      <text x="120" y="150" font-size="10" fill="#3498DB" text-anchor="middle">Time →</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Ecological Succession
        </text>
      ` : ''}
    </svg>
  `;
}
