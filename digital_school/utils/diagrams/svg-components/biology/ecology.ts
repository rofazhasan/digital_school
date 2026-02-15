/**
 * Professional Biology Ecology Components
 * Food webs, energy pyramids, biogeochemical cycles
 */

export interface EcologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create simple food web
 */
export function createFoodWeb(options: EcologyOptions = {}): string {
    const { width = 240, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="food-web" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="foodArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      <!-- Producers (bottom) -->
      <g id="producers">
        <rect x="30" y="160" width="60" height="30" fill="#27AE60" 
              stroke="#229954" stroke-width="2" rx="5"/>
        <text x="60" y="180" font-size="11" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle" font-weight="600">Plants</text>
        
        <rect x="150" y="160" width="60" height="30" fill="#27AE60" 
              stroke="#229954" stroke-width="2" rx="5"/>
        <text x="180" y="180" font-size="11" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle" font-weight="600">Algae</text>
      </g>
      
      <!-- Primary consumers (middle) -->
      <g id="primary">
        <rect x="30" y="100" width="60" height="30" fill="#F39C12" 
              stroke="#E67E22" stroke-width="2" rx="5"/>
        <text x="60" y="120" font-size="10" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle" font-weight="600">Rabbit</text>
        
        <rect x="150" y="100" width="60" height="30" fill="#F39C12" 
              stroke="#E67E22" stroke-width="2" rx="5"/>
        <text x="180" y="120" font-size="10" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle" font-weight="600">Fish</text>
      </g>
      
      <!-- Secondary consumers (top) -->
      <g id="secondary">
        <rect x="90" y="40" width="60" height="30" fill="#E74C3C" 
              stroke="#C0392B" stroke-width="2" rx="5"/>
        <text x="120" y="60" font-size="10" font-family="Inter, sans-serif" 
              fill="white" text-anchor="middle" font-weight="600">Fox</text>
      </g>
      
      <!-- Energy flow arrows -->
      <line x1="60" y1="155" x2="60" y2="135" stroke="#27AE60" 
            stroke-width="2.5" marker-end="url(#foodArrow)"/>
      <line x1="180" y1="155" x2="180" y2="135" stroke="#27AE60" 
            stroke-width="2.5" marker-end="url(#foodArrow)"/>
      <line x1="60" y1="95" x2="100" y2="75" stroke="#27AE60" 
            stroke-width="2.5" marker-end="url(#foodArrow)"/>
      <line x1="180" y1="95" x2="140" y2="75" stroke="#27AE60" 
            stroke-width="2.5" marker-end="url(#foodArrow)"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" 
              font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
          Food Web
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create energy pyramid
 */
export function createEnergyPyramid(options: EcologyOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="energy-pyramid" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="producerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#27AE60;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#229954;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#F39C12;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="secondaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="tertiaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#9B59B6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8E44AD;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Producers (bottom, largest) -->
      <path d="M 20,${height - 20} L 180,${height - 20} L 160,${height - 60} L 40,${height - 60} Z" 
            fill="url(#producerGrad)" stroke="#229954" stroke-width="2"/>
      <text x="100" y="${height - 35}" font-size="11" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Producers (10,000 kcal)
      </text>
      
      <!-- Primary consumers -->
      <path d="M 40,${height - 60} L 160,${height - 60} L 145,${height - 100} L 55,${height - 100} Z" 
            fill="url(#primaryGrad)" stroke="#E67E22" stroke-width="2"/>
      <text x="100" y="${height - 75}" font-size="10" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Primary (1,000 kcal)
      </text>
      
      <!-- Secondary consumers -->
      <path d="M 55,${height - 100} L 145,${height - 100} L 130,${height - 140} L 70,${height - 140} Z" 
            fill="url(#secondaryGrad)" stroke="#C0392B" stroke-width="2"/>
      <text x="100" y="${height - 115}" font-size="10" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Secondary (100 kcal)
      </text>
      
      <!-- Tertiary consumers (top, smallest) -->
      <path d="M 70,${height - 140} L 130,${height - 140} L 115,${height - 170} L 85,${height - 170} Z" 
            fill="url(#tertiaryGrad)" stroke="#8E44AD" stroke-width="2"/>
      <text x="100" y="${height - 150}" font-size="9" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Tertiary (10 kcal)
      </text>
      
      <!-- 10% rule indicator -->
      <text x="190" y="${height - 80}" font-size="9" font-family="Inter, sans-serif" 
            fill="#7F8C8D">10%</text>
      <line x1="185" y1="${height - 60}" x2="185" y2="${height - 100}" 
            stroke="#7F8C8D" stroke-width="1.5"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" 
              font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
          Energy Pyramid (10% Rule)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create carbon cycle
 */
export function createCarbonCycle(options: EcologyOptions = {}): string {
    const { width = 220, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="carbon-cycle" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="cycleArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3498DB"/>
        </marker>
      </defs>
      
      <!-- Atmosphere (center) -->
      <ellipse cx="110" cy="60" rx="50" ry="30" fill="#E8F4F8" 
               stroke="#3498DB" stroke-width="2"/>
      <text x="110" y="58" font-size="11" font-family="Inter, sans-serif" 
            fill="#2C3E50" text-anchor="middle" font-weight="600">
        Atmosphere
      </text>
      <text x="110" y="72" font-size="9" font-family="Inter, sans-serif" 
            fill="#3498DB" text-anchor="middle">
        CO₂
      </text>
      
      <!-- Plants (left) -->
      <rect x="20" y="120" width="50" height="40" fill="#27AE60" 
            stroke="#229954" stroke-width="2" rx="5"/>
      <text x="45" y="145" font-size="10" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Plants
      </text>
      
      <!-- Animals (right) -->
      <rect x="150" y="120" width="50" height="40" fill="#E67E22" 
            stroke="#D35400" stroke-width="2" rx="5"/>
      <text x="175" y="145" font-size="10" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
            Animals
      </text>
      
      <!-- Decomposers (bottom) -->
      <rect x="85" y="170" width="50" height="25" fill="#8B4513" 
            stroke="#6E3A0F" stroke-width="2" rx="5"/>
      <text x="110" y="186" font-size="9" font-family="Inter, sans-serif" 
            fill="white" text-anchor="middle" font-weight="600">
        Decomposers
      </text>
      
      <!-- Photosynthesis arrow -->
      <path d="M 75,85 Q 60,100 55,120" stroke="#27AE60" stroke-width="2.5" 
            fill="none" marker-end="url(#cycleArrow)"/>
      <text x="55" y="100" font-size="8" fill="#27AE60">Photosynthesis</text>
      
      <!-- Respiration arrow (plants) -->
      <path d="M 60,120 Q 75,105 85,85" stroke="#E74C3C" stroke-width="2.5" 
            fill="none" marker-end="url(#cycleArrow)"/>
      <text x="70" y="115" font-size="8" fill="#E74C3C">Respiration</text>
      
      <!-- Consumption arrow -->
      <line x1="70" y1="140" x2="150" y2="140" stroke="#F39C12" 
            stroke-width="2.5" marker-end="url(#cycleArrow)"/>
      <text x="110" y="135" font-size="8" fill="#F39C12">Consumption</text>
      
      <!-- Respiration arrow (animals) -->
      <path d="M 160,120 Q 145,105 135,85" stroke="#E74C3C" stroke-width="2.5" 
            fill="none" marker-end="url(#cycleArrow)"/>
      
      <!-- Decomposition arrows -->
      <line x1="45" y1="160" x2="95" y2="170" stroke="#8B4513" 
            stroke-width="2" marker-end="url(#cycleArrow)"/>
      <line x1="175" y1="160" x2="125" y2="170" stroke="#8B4513" 
            stroke-width="2" marker-end="url(#cycleArrow)"/>
      <line x1="110" y1="165" x2="110" y2="90" stroke="#E74C3C" 
            stroke-width="2.5" marker-end="url(#cycleArrow)"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" 
              font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
          Carbon Cycle
        </text>
      ` : ''}
    </svg>
  `;
}
