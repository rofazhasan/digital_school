/**
 * Extended Biology Plant Components
 * Plant cells, chloroplasts, and botanical structures
 */

import { type BiologyComponentOptions } from './components';

/**
 * Create plant cell with chloroplasts
 */
export function createPlantCell(options: BiologyComponentOptions = {}): string {
    const { width = 220, height = 220, showLabel = true, showDetails = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="biology-plant-cell" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Cell wall gradient -->
        <linearGradient id="cellWallGrad">
          <stop offset="0%" style="stop-color:#8B4513;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#A0522D;stop-opacity:0.9" />
        </linearGradient>
        
        <!-- Chloroplast gradient -->
        <radialGradient id="chloroplastGrad">
          <stop offset="0%" style="stop-color:#7FFF00;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:# 27AE60;stop-opacity:1" />
        </radialGradient>
        
        <!-- Vacuole gradient -->
        <radialGradient id="vacuoleGrad">
          <stop offset="0%" style="stop-color:#E8F4F8;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#BDC3C7;stop-opacity:0.3" />
        </radialGradient>
      </defs>
      
      <!-- Cell wall (rectangular) -->
      <rect x="10" y="10" width="200" height="200" rx="5" 
            fill="none" stroke="#8B4513" stroke-width="6"/>
      
      <!-- Cell membrane -->
      <rect x="20" y="20" width="180" height="180" rx="3" 
            fill="#F5F5DC" opacity="0.3" stroke="#D2691E" stroke-width="3"/>
      
      <!-- Large central vacuole -->
      <ellipse cx="110" cy="110" rx="70" ry="65" 
               fill="url(#vacuoleGrad)" stroke="#95A5A6" stroke-width="2"/>
      
      <!-- Nucleus -->
      <circle cx="60" cy="60" r="25" fill="url(#nucleusGrad)" 
              stroke="#8E44AD" stroke-width="2"/>
      <circle cx="65" cy="55" r="8" fill="#6C3483" opacity="0.9"/>
      
      ${showDetails ? `
        <!-- Chloroplasts (multiple) -->
        <g id="chloroplast1">
          <ellipse cx="45" cy="120" rx="18" ry="12" fill="url(#chloroplastGrad)" 
                   stroke="#229954" stroke-width="2"/>
          <!-- Grana (stacks) -->
          ${[0, 1, 2].map(i => `
            <line x1="${35 + i * 6}" y1="118" x2="${35 + i * 6}" y2="122" 
                  stroke="#1E8449" stroke-width="1.5"/>
          `).join('')}
        </g>
        
        <g id="chloroplast2">
          <ellipse cx="160" cy="70" rx="18" ry="12" fill="url(#chloroplastGrad)" 
                   stroke="#229954" stroke-width="2"/>
          ${[0, 1, 2].map(i => `
            <line x1="${150 + i * 6}" y1="68" x2="${150 + i * 6}" y2="72" 
                  stroke="#1E8449" stroke-width="1.5"/>
          `).join('')}
        </g>
        
        <g id="chloroplast3">
          <ellipse cx="150" cy="150" rx="18" ry="12" fill="url(#chloroplastGrad)" 
                   stroke="#229954" stroke-width="2"/>
          ${[0, 1, 2].map(i => `
            <line x1="${140 + i * 6}" y1="148" x2="${140 + i * 6}" y2="152" 
                  stroke="#1E8449" stroke-width="1.5"/>
          `).join('')}
        </g>
        
        <g id="chloroplast4">
          <ellipse cx="50" cy="180" rx="18" ry="12" fill="url(#chloroplastGrad)" 
                   stroke="#229954" stroke-width="2"/>
          ${[0, 1, 2].map(i => `
            <line x1="${40 + i * 6}" y1="178" x2="${40 + i * 6}" y2="182" 
                  stroke="#1E8449" stroke-width="1.5"/>
          `).join('')}
        </g>
        
        <!-- Mitochondria -->
        <ellipse cx="180" cy="120" rx="16" ry="10" fill="url(#mitoGrad)" 
                 stroke="#D35400" stroke-width="1.5" opacity="0.8"/>
        
        <!-- Endoplasmic Reticulum -->
        <path d="M 30,90 Q 40,85 50,90" stroke="#3498DB" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M 30,100 Q 40,95 50,100" stroke="#3498DB" stroke-width="2" fill="none" opacity="0.6"/>
        
        <!-- Golgi apparatus -->
        ${[0, 1, 2, 3].map(i => `
          <path d="M ${165 + i * 2},${35 + i * 2} Q ${175 + i * 2},${33 + i * 2} ${185 + i * 2},${35 + i * 2}" 
                stroke="#F39C12" stroke-width="1.5" fill="none" opacity="${0.7 - i * 0.1}"/>
        `).join('')}
      ` : ''}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="110" y="8" font-size="13" font-family="Inter, sans-serif" 
              font-weight="bold" fill="#2C3E50" text-anchor="middle">
          Plant Cell
        </text>
        
        ${showDetails ? `
          <text x="25" y="15" font-size="8" font-family="Inter, sans-serif" fill="#8B4513">Cell Wall</text>
          <text x="110" y="115" font-size="9" font-family="Inter, sans-serif" fill="#7F8C8D">Vacuole</text>
          <text x="35" y="55" font-size="8" font-family="Inter, sans-serif" fill="#8E44AD">Nucleus</text>
          <text x="25" y="125" font-size="7" font-family="Inter, sans-serif" fill="#27AE60">Chloroplast</text>
        ` : ''}
      ` : ''}
      
      <defs>
        <radialGradient id="nucleusGrad">
          <stop offset="0%" style="stop-color:#C39BD3;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#9B59B6;stop-opacity:0.9" />
        </radialGradient>
        <radialGradient id="mitoGrad">
          <stop offset="0%" style="stop-color:#F1948A;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </radialGradient>
      </defs>
    </svg>
  `;
}

/**
 * Create chloroplast with detailed structure
 */
export function createChloroplast(options: BiologyComponentOptions = {}): string {
    const { width = 120, height = 80, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="biology-chloroplast" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="chloroGrad">
          <stop offset="0%" style="stop-color:#7FFF00;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#27AE60;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Outer membrane -->
      <ellipse cx="60" cy="40" rx="55" ry="35" fill="url(#chloroGrad)" 
               stroke="#229954" stroke-width="2.5"/>
      
      <!-- Inner membrane -->
      <ellipse cx="60" cy="40" rx="50" ry="30" fill="none" 
               stroke="#1E8449" stroke-width="2"/>
      
      <!-- Grana (stacked thylakoids) -->
      ${[0, 1, 2, 3, 4].map(i => {
        const x = 20 + i * 20;
        return `
          <g>
            <!-- Stack of discs -->
            ${[0, 1, 2, 3].map(j => `
              <ellipse cx="${x}" cy="${30 + j * 3}" rx="8" ry="2" 
                       fill="#1E8449" opacity="${0.8 - j * 0.1}"/>
            `).join('')}
          </g>
        `;
    }).join('')}
      
      <!-- Stroma (background) -->
      <ellipse cx="60" cy="40" rx="45" ry="25" fill="#52BE80" opacity="0.2"/>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="60" y="75" font-size="10" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          Chloroplast
        </text>
        <text x="20" y="20" font-size="7" font-family="Inter, sans-serif" fill="#1E8449">Grana</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create leaf cross-section
 */
export function createLeafCrossSection(options: BiologyComponentOptions = {}): string {
    const { width = 180, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="biology-leaf" xmlns="http://www.w3.org/2000/svg">
      <!-- Upper epidermis -->
      <rect x="20" y="20" width="140" height="8" fill="#8B4513" opacity="0.6"/>
      
      <!-- Palisade mesophyll (columnar cells) -->
      ${Array.from({ length: 14 }, (_, i) => `
        <rect x="${20 + i * 10}" y="28" width="9" height="25" 
              fill="#27AE60" opacity="0.7" stroke="#1E8449" stroke-width="0.5"/>
        <!-- Chloroplasts in cells -->
        <circle cx="${24 + i * 10}" cy="35" r="2" fill="#229954"/>
        <circle cx="${24 + i * 10}" cy="42" r="2" fill="#229954"/>
        <circle cx="${24 + i * 10}" cy="48" r="2" fill="#229954"/>
      `).join('')}
      
      <!-- Spongy mesophyll (irregular cells) -->
      ${[
            [30, 60], [50, 58], [70, 62], [90, 60], [110, 58], [130, 62],
            [40, 75], [60, 73], [80, 77], [100, 75], [120, 73]
        ].map(([x, y]) => `
        <circle cx="${x}" cy="${y}" r="8" fill="#52BE80" opacity="0.5" 
                stroke="#27AE60" stroke-width="0.5"/>
      `).join('')}
      
      <!-- Air spaces -->
      <circle cx="45" cy="68" r="5" fill="white" opacity="0.8"/>
      <circle cx="75" cy="70" r="5" fill="white" opacity="0.8"/>
      <circle cx="105" cy="68" r="5" fill="white" opacity="0.8"/>
      
      <!-- Lower epidermis -->
      <rect x="20" y="88" width="140" height="8" fill="#8B4513" opacity="0.6"/>
      
      <!-- Stomata (pore) -->
      <ellipse cx="90" cy="92" rx="8" ry="3" fill="white"/>
      <path d="M 82,92 Q 90,88 98,92" stroke="#8B4513" stroke-width="1.5" fill="none"/>
      <path d="M 82,92 Q 90,96 98,92" stroke="#8B4513" stroke-width="1.5" fill="none"/>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="90" y="15" font-size="11" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          Leaf Cross-Section
        </text>
        <text x="165" y="24" font-size="7" font-family="Inter, sans-serif" fill="#8B4513">Upper Epidermis</text>
        <text x="165" y="40" font-size="7" font-family="Inter, sans-serif" fill="#27AE60">Palisade</text>
        <text x="165" y="70" font-size="7" font-family="Inter, sans-serif" fill="#52BE80">Spongy</text>
        <text x="165" y="92" font-size="7" font-family="Inter, sans-serif" fill="#8B4513">Lower Epidermis</text>
        <text x="90" y="110" font-size="7" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">Stoma</text>
      ` : ''}
    </svg>
  `;
}
