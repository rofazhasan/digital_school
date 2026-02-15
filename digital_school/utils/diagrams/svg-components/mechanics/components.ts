/**
 * Professional Mechanical Components
 * Realistic 3D mechanical elements for physics diagrams
 */

import { createRadialGradient, createShadowFilter } from '../common/gradients';

export interface MechanicalComponentOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
    show3D?: boolean;
}

/**
 * Create professional 3D block with shading
 */
export function create3DBlock(
    mass: number,
    unit: 'kg' | 'g' = 'kg',
    options: MechanicalComponentOptions = {}
): string {
    const { width = 80, height = 80, showLabel = true, color = '#4A90E2', show3D = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="mechanical-block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Block gradient for 3D effect -->
        <linearGradient id="blockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${adjustBrightness(color, 30)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
        </linearGradient>
        
        ${createShadowFilter('blockShadow', 4, 3, 3)}
      </defs>
      
      ${show3D ? `
        <!-- Ground shadow -->
        <ellipse cx="${width / 2 + 2}" cy="${height - 8}" rx="25" ry="5" fill="#000" opacity="0.2"/>
        
        <!-- Front face -->
        <rect x="${width / 2 - 25}" y="${height / 2 - 10}" width="50" height="50" 
              fill="url(#blockGradient)" stroke="#2C3E50" stroke-width="2" 
              filter="url(#blockShadow)" rx="2"/>
        
        <!-- Top face (3D effect) -->
        <path d="M ${width / 2 - 25},${height / 2 - 10} L ${width / 2 - 10},${height / 2 - 25} 
                 L ${width / 2 + 40},${height / 2 - 25} L ${width / 2 + 25},${height / 2 - 10} Z" 
              fill="${adjustBrightness(color, 40)}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Right face (3D effect) -->
        <path d="M ${width / 2 + 25},${height / 2 - 10} L ${width / 2 + 40},${height / 2 - 25} 
                 L ${width / 2 + 40},${height / 2 + 25} L ${width / 2 + 25},${height / 2 + 40} Z" 
              fill="${adjustBrightness(color, -10)}" stroke="#2C3E50" stroke-width="2"/>
      ` : `
        <!-- Simple 2D block -->
        <rect x="${width / 2 - 25}" y="${height / 2 - 25}" width="50" height="50" 
              fill="${color}" stroke="#2C3E50" stroke-width="2" rx="2"/>
      `}
      
      ${showLabel ? `
        <!-- Mass label -->
        <text x="${width / 2}" y="${height / 2 + 5}" 
              font-size="16" font-family="Inter, sans-serif" font-weight="bold"
              fill="white" text-anchor="middle" stroke="#2C3E50" stroke-width="0.5">
          ${mass}${unit}
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create professional spring with realistic coils
 */
export function createSpring(
    springConstant: number,
    orientation: 'vertical' | 'horizontal' = 'vertical',
    compression: number = 0,
    options: MechanicalComponentOptions = {}
): string {
    const { showLabel = true, color = '#8B8B8B' } = options;
    const width = orientation === 'horizontal' ? 120 : 50;
    const height = orientation === 'horizontal' ? 50 : 120;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="mechanical-spring" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Spring gradient for 3D metallic effect -->
        <linearGradient id="springGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6B6B6B;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#C0C0C0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6B6B6B;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      ${orientation === 'vertical' ? `
        <!-- Top attachment point -->
        <rect x="20" y="0" width="10" height="8" fill="#2C3E50" rx="1"/>
        <line x1="25" y1="8" x2="25" y2="12" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Spring coils (vertical) -->
        <path d="M 25,12 Q 15,17 25,22 Q 35,27 25,32 Q 15,37 25,42 
                 Q 35,47 25,52 Q 15,57 25,62 Q 35,67 25,72 
                 Q 15,77 25,82 Q 35,87 25,92 Q 15,97 25,102" 
              stroke="url(#springGrad)" stroke-width="3.5" fill="none" 
              stroke-linecap="round"/>
        
        <!-- Bottom attachment point -->
        <line x1="25" y1="102" x2="25" y2="108" stroke="#2C3E50" stroke-width="2"/>
        <rect x="20" y="108" width="10" height="8" fill="#2C3E50" rx="1"/>
        
        ${showLabel ? `
          <!-- Spring constant label -->
          <text x="42" y="62" font-size="12" font-family="Inter, sans-serif" 
                font-weight="600" fill="#2C3E50">
            k=${springConstant}
          </text>
          <text x="42" y="74" font-size="10" font-family="Inter, sans-serif" 
                fill="#2C3E50">
            N/m
          </text>
        ` : ''}
      ` : `
        <!-- Left attachment point -->
        <rect x="0" y="20" width="8" height="10" fill="#2C3E50" rx="1"/>
        <line x1="8" y1="25" x2="12" y2="25" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Spring coils (horizontal) -->
        <path d="M 12,25 Q 17,15 22,25 Q 27,35 32,25 Q 37,15 42,25 
                 Q 47,35 52,25 Q 57,15 62,25 Q 67,35 72,25 
                 Q 77,15 82,25 Q 87,35 92,25 Q 97,15 102,25" 
              stroke="url(#springGrad)" stroke-width="3.5" fill="none" 
              stroke-linecap="round"/>
        
        <!-- Right attachment point -->
        <line x1="102" y1="25" x2="108" y2="25" stroke="#2C3E50" stroke-width="2"/>
        <rect x="108" y="20" width="8" height="10" fill="#2C3E50" rx="1"/>
        
        ${showLabel ? `
          <!-- Spring constant label -->
          <text x="60" y="45" font-size="11" font-family="Inter, sans-serif" 
                font-weight="600" fill="#2C3E50" text-anchor="middle">
            k=${springConstant} N/m
          </text>
        ` : ''}
      `}
    </svg>
  `;
}

/**
 * Create professional pulley system
 */
export function createPulley(
    mass1: number,
    mass2: number,
    options: MechanicalComponentOptions = {}
): string {
    const { showLabel = true } = options;
    const width = 120;
    const height = 180;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="mechanical-pulley" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Pulley wheel gradient (metallic gold) -->
        <radialGradient id="pulleyGrad">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#D4AF37;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B8960F;stop-opacity:1" />
        </radialGradient>
        
        <!-- Rope gradient (brown) -->
        <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6B4423;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8B5A3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6B4423;stop-opacity:1" />
        </linearGradient>
        
        ${createShadowFilter('pulleyShadow', 3, 2, 2)}
      </defs>
      
      <!-- Ceiling mount -->
      <rect x="0" y="0" width="${width}" height="6" fill="#2C3E50"/>
      <line x1="${width / 2}" y1="6" x2="${width / 2}" y2="25" stroke="#2C3E50" stroke-width="3"/>
      
      <!-- Pulley wheel -->
      <circle cx="${width / 2}" cy="45" r="22" fill="url(#pulleyGrad)" 
              stroke="#8B7500" stroke-width="2.5" filter="url(#pulleyShadow)"/>
      
      <!-- Pulley groove -->
      <circle cx="${width / 2}" cy="45" r="18" fill="none" stroke="#8B7500" stroke-width="1.5"/>
      
      <!-- Center axle -->
      <circle cx="${width / 2}" cy="45" r="4" fill="#2C3E50"/>
      
      <!-- Rope (left side) -->
      <path d="M ${width / 2 - 18},45 Q ${width / 2 - 18},65 ${width / 2 - 18},90" 
            stroke="url(#ropeGrad)" stroke-width="3" fill="none"/>
      <line x1="${width / 2 - 18}" y1="90" x2="${width / 2 - 18}" y2="120" 
            stroke="url(#ropeGrad)" stroke-width="3"/>
      
      <!-- Rope (right side) -->
      <path d="M ${width / 2 + 18},45 Q ${width / 2 + 18},65 ${width / 2 + 18},110" 
            stroke="url(#ropeGrad)" stroke-width="3" fill="none"/>
      <line x1="${width / 2 + 18}" y1="110" x2="${width / 2 + 18}" y2="150" 
            stroke="url(#ropeGrad)" stroke-width="3"/>
      
      <!-- Mass 1 (left) - using 3D block -->
      <g transform="translate(${width / 2 - 33}, 120)">
        <!-- Front face -->
        <rect x="0" y="0" width="30" height="30" fill="#4A90E2" 
              stroke="#2C3E50" stroke-width="2" filter="url(#pulleyShadow)" rx="2"/>
        <!-- Top face -->
        <path d="M 0,0 L 7,-7 L 37,-7 L 30,0 Z" fill="#6BA3E8" stroke="#2C3E50" stroke-width="1.5"/>
        <!-- Right face -->
        <path d="M 30,0 L 37,-7 L 37,23 L 30,30 Z" fill="#3A7BC8" stroke="#2C3E50" stroke-width="1.5"/>
        ${showLabel ? `
          <text x="15" y="18" font-size="12" font-family="Inter, sans-serif" 
                font-weight="bold" fill="white" text-anchor="middle">
            ${mass1}kg
          </text>
        ` : ''}
      </g>
      
      <!-- Mass 2 (right) - using 3D block -->
      <g transform="translate(${width / 2 + 3}, 150)">
        <!-- Front face -->
        <rect x="0" y="0" width="30" height="30" fill="#E74C3C" 
              stroke="#2C3E50" stroke-width="2" filter="url(#pulleyShadow)" rx="2"/>
        <!-- Top face -->
        <path d="M 0,0 L 7,-7 L 37,-7 L 30,0 Z" fill="#F1948A" stroke="#2C3E50" stroke-width="1.5"/>
        <!-- Right face -->
        <path d="M 30,0 L 37,-7 L 37,23 L 30,30 Z" fill="#C0392B" stroke="#2C3E50" stroke-width="1.5"/>
        ${showLabel ? `
          <text x="15" y="18" font-size="12" font-family="Inter, sans-serif" 
                font-weight="bold" fill="white" text-anchor="middle">
            ${mass2}kg
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create professional inclined plane
 */
export function createIncline(
    angle: number,
    mass: number,
    showForces: boolean = false,
    options: MechanicalComponentOptions = {}
): string {
    const { showLabel = true } = options;
    const width = 200;
    const height = 150;

    // Calculate incline dimensions
    const inclineLength = 140;
    const inclineHeight = inclineLength * Math.sin(angle * Math.PI / 180);
    const inclineBase = inclineLength * Math.cos(angle * Math.PI / 180);

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="mechanical-incline" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${createShadowFilter('inclineShadow', 3, 2, 2)}
        
        <!-- Wood texture gradient for incline -->
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D2691E;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Ground -->
      <rect x="0" y="${height - 10}" width="${width}" height="10" fill="#7F8C8D"/>
      <line x1="0" y1="${height - 10}" x2="${width}" y2="${height - 10}" 
            stroke="#5D6D7E" stroke-width="2"/>
      
      <!-- Inclined plane -->
      <path d="M 20,${height - 10} L ${20 + inclineBase},${height - 10} 
               L ${20 + inclineBase},${height - 10 - inclineHeight} Z" 
            fill="url(#woodGrad)" stroke="#654321" stroke-width="3" 
            filter="url(#inclineShadow)"/>
      
      <!-- Angle arc -->
      <path d="M ${20 + 30},${height - 10} 
               A 30 30 0 0 1 ${20 + 30 * Math.cos(angle * Math.PI / 180)},${height - 10 - 30 * Math.sin(angle * Math.PI / 180)}" 
            stroke="#2C3E50" stroke-width="1.5" fill="none"/>
      
      <!-- Angle label -->
      <text x="${20 + 40}" y="${height - 15}" font-size="14" font-family="Inter, sans-serif" 
            font-weight="600" fill="#2C3E50">
        ${angle}°
      </text>
      
      <!-- Block on incline (positioned midway) -->
      <g transform="translate(${20 + inclineBase / 2 - 15}, ${height - 10 - inclineHeight / 2 - 20}) 
                     rotate(${-angle}, 15, 20)">
        <!-- 3D Block -->
        <rect x="0" y="0" width="30" height="30" fill="#4A90E2" 
              stroke="#2C3E50" stroke-width="2" rx="2"/>
        <path d="M 0,0 L 7,-7 L 37,-7 L 30,0 Z" fill="#6BA3E8" stroke="#2C3E50" stroke-width="1.5"/>
        <path d="M 30,0 L 37,-7 L 37,23 L 30,30 Z" fill="#3A7BC8" stroke="#2C3E50" stroke-width="1.5"/>
        
        ${showLabel ? `
          <text x="15" y="18" font-size="11" font-family="Inter, sans-serif" 
                font-weight="bold" fill="white" text-anchor="middle">
            ${mass}kg
          </text>
        ` : ''}
      </g>
      
      ${showForces ? `
        <!-- Force vectors -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#E74C3C"/>
          </marker>
        </defs>
        
        <!-- Weight (mg) - downward -->
        <line x1="${20 + inclineBase / 2}" y1="${height - 10 - inclineHeight / 2 - 5}" 
              x2="${20 + inclineBase / 2}" y2="${height - 10 - inclineHeight / 2 + 35}" 
              stroke="#E74C3C" stroke-width="2.5" marker-end="url(#arrowhead)"/>
        <text x="${20 + inclineBase / 2 + 8}" y="${height - 10 - inclineHeight / 2 + 25}" 
              font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="#E74C3C">
          mg
        </text>
        
        <!-- Normal force - perpendicular to surface -->
        <line x1="${20 + inclineBase / 2}" y1="${height - 10 - inclineHeight / 2}" 
              x2="${20 + inclineBase / 2 + 30 * Math.sin(angle * Math.PI / 180)}" 
              y2="${height - 10 - inclineHeight / 2 - 30 * Math.cos(angle * Math.PI / 180)}" 
              stroke="#27AE60" stroke-width="2.5" marker-end="url(#arrowhead)"/>
        <text x="${20 + inclineBase / 2 + 35 * Math.sin(angle * Math.PI / 180)}" 
              y="${height - 10 - inclineHeight / 2 - 30 * Math.cos(angle * Math.PI / 180)}" 
              font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="#27AE60">
          N
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
