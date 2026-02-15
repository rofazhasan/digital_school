/**
 * Professional Chemistry Glassware Components
 * Realistic laboratory apparatus with transparency and liquid effects
 */

import { createGlassGradient, createShadowFilter } from '../common/gradients';

export interface ChemistryComponentOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    liquidColor?: string;
    liquidLevel?: number; // 0-100 percentage
}

/**
 * Create professional beaker with liquid
 */
export function createBeaker(
    capacity: number,
    fillLevel: number,
    options: ChemistryComponentOptions = {}
): string {
    const { width = 120, height = 140, showLabel = true, liquidColor = '#4A90E2' } = options;
    const fillPercent = (fillLevel / capacity) * 100;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="chemistry-beaker" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${createGlassGradient('glassGrad')}
        ${createShadowFilter('glassShadow', 2, 1, 1)}
        
        <!-- Liquid gradient -->
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${adjustBrightness(liquidColor, 20)};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${adjustBrightness(liquidColor, -10)};stop-opacity:0.9" />
        </linearGradient>
      </defs>
      
      <!-- Beaker outline -->
      <path d="M 25,25 L 25,105 Q 25,115 35,115 L 85,115 Q 95,115 95,105 L 95,25" 
            stroke="#2C3E50" stroke-width="2.5" fill="url(#glassGrad)" 
            filter="url(#glassShadow)"/>
      
      <!-- Spout -->
      <path d="M 95,35 Q 100,35 100,40" stroke="#2C3E50" stroke-width="2.5" fill="none"/>
      
      <!-- Liquid -->
      ${fillLevel > 0 ? `
        <path d="M 26,${25 + (80 * (100 - fillPercent) / 100)} 
                 L 26,105 Q 26,114 35,114 L 85,114 Q 94,114 94,105 
                 L 94,${25 + (80 * (100 - fillPercent) / 100)} Z" 
              fill="url(#liquidGrad)"/>
        
        <!-- Meniscus (curved liquid surface) -->
        <path d="M 26,${25 + (80 * (100 - fillPercent) / 100)} 
                 Q 60,${25 + (80 * (100 - fillPercent) / 100) + 2} 
                 94,${25 + (80 * (100 - fillPercent) / 100)}" 
              stroke="${adjustBrightness(liquidColor, -20)}" stroke-width="1.5" fill="none"/>
      ` : ''}
      
      <!-- Graduation marks -->
      ${[0.25, 0.5, 0.75, 1.0].map((fraction, i) => {
        const y = 25 + (80 * (1 - fraction));
        const volume = capacity * fraction;
        return `
          <line x1="25" y1="${y}" x2="30" y2="${y}" stroke="#2C3E50" stroke-width="1.5"/>
          ${showLabel ? `
            <text x="33" y="${y + 4}" font-size="9" font-family="Inter, sans-serif" 
                  fill="#2C3E50">${volume}mL</text>
          ` : ''}
        `;
    }).join('')}
      
      <!-- Glass highlight for realism -->
      <path d="M 30,30 L 30,110" stroke="white" stroke-width="2.5" opacity="0.5"/>
      
      ${showLabel ? `
        <!-- Capacity label -->
        <text x="60" y="135" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          ${capacity}mL Beaker
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create professional Erlenmeyer flask
 */
export function createFlask(
    capacity: number,
    fillLevel: number,
    options: ChemistryComponentOptions = {}
): string {
    const { width = 100, height = 140, showLabel = true, liquidColor = '#E74C3C' } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="chemistry-flask" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${createGlassGradient('glassGrad')}
        ${createShadowFilter('glassShadow', 2, 1, 1)}
        
        <!-- Liquid gradient -->
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${adjustBrightness(liquidColor, 20)};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${adjustBrightness(liquidColor, -10)};stop-opacity:0.9" />
        </linearGradient>
      </defs>
      
      <!-- Flask outline -->
      <path d="M 40,10 L 40,40 L 20,90 Q 15,110 25,115 L 75,115 Q 85,110 80,90 L 60,40 L 60,10 Z" 
            stroke="#2C3E50" stroke-width="2.5" fill="url(#glassGrad)" 
            filter="url(#glassShadow)"/>
      
      <!-- Neck opening -->
      <ellipse cx="50" cy="10" rx="10" ry="3" fill="none" stroke="#2C3E50" stroke-width="2.5"/>
      
      <!-- Liquid -->
      ${fillLevel > 0 ? `
        <path d="M 21,${90 - (fillLevel / capacity) * 50} 
                 L 21,90 Q 16,110 25,114 L 75,114 Q 84,110 79,90 
                 L 79,${90 - (fillLevel / capacity) * 50} Z" 
              fill="url(#liquidGrad)"/>
      ` : ''}
      
      <!-- Glass highlight -->
      <path d="M 42,15 L 42,45 L 25,90" stroke="white" stroke-width="2" opacity="0.5"/>
      
      ${showLabel ? `
        <!-- Capacity label -->
        <text x="50" y="135" font-size="11" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          ${capacity}mL Flask
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create professional test tube
 */
export function createTestTube(
    fillLevel: number = 50,
    options: ChemistryComponentOptions = {}
): string {
    const { width = 50, height = 120, showLabel = false, liquidColor = '#9B59B6' } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="chemistry-test-tube" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${createGlassGradient('glassGrad')}
        
        <!-- Liquid gradient -->
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${adjustBrightness(liquidColor, 20)};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${adjustBrightness(liquidColor, -10)};stop-opacity:0.9" />
        </linearGradient>
      </defs>
      
      <!-- Test tube outline -->
      <path d="M 15,10 L 15,95 Q 15,105 25,105 Q 35,105 35,95 L 35,10" 
            stroke="#2C3E50" stroke-width="2" fill="url(#glassGrad)"/>
      
      <!-- Opening -->
      <ellipse cx="25" cy="10" rx="10" ry="3" fill="none" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Liquid -->
      ${fillLevel > 0 ? `
        <path d="M 16,${10 + (85 * (100 - fillLevel) / 100)} 
                 L 16,95 Q 16,104 25,104 Q 34,104 34,95 
                 L 34,${10 + (85 * (100 - fillLevel) / 100)} Z" 
              fill="url(#liquidGrad)"/>
      ` : ''}
      
      <!-- Glass highlight -->
      <path d="M 18,15 L 18,95" stroke="white" stroke-width="1.5" opacity="0.5"/>
    </svg>
  `;
}

/**
 * Create professional benzene ring
 */
export function createBenzene(options: ChemistryComponentOptions = {}): string {
    const { width = 100, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="chemistry-benzene" xmlns="http://www.w3.org/2000/svg">
      <!-- Hexagon (benzene ring) -->
      <path d="M 50,15 L 75,30 L 75,60 L 50,75 L 25,60 L 25,30 Z" 
            stroke="#2C3E50" stroke-width="2.5" fill="none"/>
      
      <!-- Inner circle (aromatic) -->
      <circle cx="50" cy="45" r="18" stroke="#2C3E50" stroke-width="2" fill="none"/>
      
      <!-- Carbon atoms at vertices -->
      ${[
            [50, 15], [75, 30], [75, 60], [50, 75], [25, 60], [25, 30]
        ].map(([x, y], i) => `
        <circle cx="${x}" cy="${y}" r="3" fill="#2C3E50"/>
        ${showLabel ? `
          <text x="${x}" y="${y < 45 ? y - 8 : y + 15}" 
                font-size="11" font-family="Inter, sans-serif" 
                font-weight="600" fill="#2C3E50" text-anchor="middle">
            C
          </text>
        ` : ''}
      `).join('')}
      
      ${showLabel ? `
        <!-- Benzene label -->
        <text x="50" y="95" font-size="12" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          C₆H₆
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Helper function to adjust color brightness
 */
function adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}
