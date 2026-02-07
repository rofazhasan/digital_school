/**
 * Professional Circuit Components - IEEE Standard Symbols
 * World-class SVG implementations of electronic components
 */

import { createMetalGradient, createShadowFilter, createArrowMarker } from '../common/gradients';

export interface CircuitComponentOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    labelPosition?: 'top' | 'bottom' | 'left' | 'right';
    color?: string;
}

/**
 * Create professional resistor (IEEE standard zigzag)
 */
export function createResistor(
    resistance: number,
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    options: CircuitComponentOptions = {}
): string {
    const { showLabel = true, labelPosition = 'bottom', color = '#2C3E50' } = options;
    const width = orientation === 'horizontal' ? 70 : 40;
    const height = orientation === 'horizontal' ? 40 : 70;

    const resistorBody = orientation === 'horizontal' ? `
    <!-- Terminals -->
    <line x1="0" y1="20" x2="12" y2="20" stroke="#CD7F32" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="58" y1="20" x2="70" y2="20" stroke="#CD7F32" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Zigzag resistor body (IEEE standard) -->
    <path d="M 12,20 L 16,10 L 22,30 L 28,10 L 34,30 L 40,10 L 46,30 L 52,10 L 58,20" 
          stroke="${color}" stroke-width="2.5" fill="none" 
          stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Connection dots -->
    <circle cx="0" cy="20" r="2" fill="#CD7F32"/>
    <circle cx="70" cy="20" r="2" fill="#CD7F32"/>
  ` : `
    <!-- Terminals -->
    <line x1="20" y1="0" x2="20" y2="12" stroke="#CD7F32" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="20" y1="58" x2="20" y2="70" stroke="#CD7F32" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Zigzag resistor body (IEEE standard) -->
    <path d="M 20,12 L 10,16 L 30,22 L 10,28 L 30,34 L 10,40 L 30,46 L 10,52 L 20,58" 
          stroke="${color}" stroke-width="2.5" fill="none" 
          stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Connection dots -->
    <circle cx="20" cy="0" r="2" fill="#CD7F32"/>
    <circle cx="20" cy="70" r="2" fill="#CD7F32"/>
  `;

    const label = showLabel ? `
    <text x="${orientation === 'horizontal' ? 35 : (labelPosition === 'right' ? 45 : -5)}" 
          y="${orientation === 'horizontal' ? (labelPosition === 'bottom' ? 38 : 8) : 38}" 
          font-size="12" font-family="Inter, sans-serif" font-weight="600"
          fill="${color}" text-anchor="middle">
      ${resistance}Ω
    </text>
  ` : '';

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="circuit-resistor" xmlns="http://www.w3.org/2000/svg">
      ${resistorBody}
      ${label}
    </svg>
  `;
}

/**
 * Create professional capacitor
 */
export function createCapacitor(
    capacitance: number,
    unit: 'pF' | 'nF' | 'μF' | 'mF' | 'F' = 'μF',
    type: 'standard' | 'electrolytic' | 'variable' = 'standard',
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    options: CircuitComponentOptions = {}
): string {
    const { showLabel = true, color = '#2C3E50' } = options;
    const width = orientation === 'horizontal' ? 50 : 40;
    const height = orientation === 'horizontal' ? 40 : 50;

    const capacitorBody = orientation === 'horizontal' ? `
    <!-- Terminals -->
    <line x1="0" y1="20" x2="20" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="30" y1="20" x2="50" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Parallel plates -->
    <line x1="20" y1="8" x2="20" y2="32" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="8" x2="30" y2="32" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    
    ${type === 'electrolytic' ? `
      <!-- Polarity markers -->
      <text x="15" y="6" font-size="12" font-weight="bold" fill="#E74C3C">+</text>
      <text x="32" y="6" font-size="12" font-weight="bold" fill="#3498DB">−</text>
    ` : ''}
    
    ${type === 'variable' ? `
      <!-- Variable indicator (arrow) -->
      <path d="M 35,5 L 40,10 M 40,10 L 35,15" stroke="${color}" stroke-width="1.5" fill="none"/>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="0" cy="20" r="2" fill="#CD7F32"/>
    <circle cx="50" cy="20" r="2" fill="#CD7F32"/>
  ` : `
    <!-- Terminals -->
    <line x1="20" y1="0" x2="20" y2="17" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="20" y1="33" x2="20" y2="50" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Parallel plates -->
    <line x1="8" y1="17" x2="32" y2="17" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <line x1="8" y1="33" x2="32" y2="33" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    
    ${type === 'electrolytic' ? `
      <!-- Polarity markers -->
      <text x="35" y="15" font-size="12" font-weight="bold" fill="#E74C3C">+</text>
      <text x="35" y="35" font-size="12" font-weight="bold" fill="#3498DB">−</text>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="20" cy="0" r="2" fill="#CD7F32"/>
    <circle cx="20" cy="50" r="2" fill="#CD7F32"/>
  `;

    const label = showLabel ? `
    <text x="${orientation === 'horizontal' ? 25 : 42}" 
          y="${orientation === 'horizontal' ? 42 : 28}" 
          font-size="11" font-family="Inter, sans-serif" font-weight="600"
          fill="${color}" text-anchor="middle">
      ${capacitance}${unit}
    </text>
  ` : '';

    return `
    <svg width="${width}" height="${height + (showLabel ? 10 : 0)}" 
         viewBox="0 0 ${width} ${height + (showLabel ? 10 : 0)}" 
         class="circuit-capacitor" xmlns="http://www.w3.org/2000/svg">
      ${capacitorBody}
      ${label}
    </svg>
  `;
}

/**
 * Create professional inductor (coil)
 */
export function createInductor(
    inductance: number,
    unit: 'μH' | 'mH' | 'H' = 'mH',
    hasCore: boolean = false,
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    options: CircuitComponentOptions = {}
): string {
    const { showLabel = true, color = '#CD7F32' } = options;
    const width = orientation === 'horizontal' ? 70 : 40;
    const height = orientation === 'horizontal' ? 40 : 70;

    const inductorBody = orientation === 'horizontal' ? `
    <!-- Terminals -->
    <line x1="0" y1="20" x2="8" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="62" y1="20" x2="70" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Coil loops -->
    <path d="M 8,20 Q 11,10 14,20 Q 17,30 20,20 Q 23,10 26,20 Q 29,30 32,20 
             Q 35,10 38,20 Q 41,30 44,20 Q 47,10 50,20 Q 53,30 56,20 Q 59,10 62,20" 
          stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    
    ${hasCore ? `
      <!-- Iron core lines -->
      <line x1="14" y1="5" x2="14" y2="35" stroke="#8B4513" stroke-width="2"/>
      <line x1="56" y1="5" x2="56" y2="35" stroke="#8B4513" stroke-width="2"/>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="0" cy="20" r="2" fill="#CD7F32"/>
    <circle cx="70" cy="20" r="2" fill="#CD7F32"/>
  ` : `
    <!-- Terminals -->
    <line x1="20" y1="0" x2="20" y2="8" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="20" y1="62" x2="20" y2="70" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Coil loops -->
    <path d="M 20,8 Q 10,11 20,14 Q 30,17 20,20 Q 10,23 20,26 Q 30,29 20,32 
             Q 10,35 20,38 Q 30,41 20,44 Q 10,47 20,50 Q 30,53 20,56 Q 10,59 20,62" 
          stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    
    ${hasCore ? `
      <!-- Iron core lines -->
      <line x1="5" y1="14" x2="35" y2="14" stroke="#8B4513" stroke-width="2"/>
      <line x1="5" y1="56" x2="35" y2="56" stroke="#8B4513" stroke-width="2"/>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="20" cy="0" r="2" fill="#CD7F32"/>
    <circle cx="20" cy="70" r="2" fill="#CD7F32"/>
  `;

    const label = showLabel ? `
    <text x="${orientation === 'horizontal' ? 35 : 42}" 
          y="${orientation === 'horizontal' ? 38 : 38}" 
          font-size="11" font-family="Inter, sans-serif" font-weight="600"
          fill="#2C3E50" text-anchor="middle">
      ${inductance}${unit}
    </text>
  ` : '';

    return `
    <svg width="${width}" height="${height + (showLabel ? 8 : 0)}" 
         viewBox="0 0 ${width} ${height + (showLabel ? 8 : 0)}" 
         class="circuit-inductor" xmlns="http://www.w3.org/2000/svg">
      ${inductorBody}
      ${label}
    </svg>
  `;
}

/**
 * Create professional diode
 */
export function createDiode(
    type: 'standard' | 'led' | 'zener' | 'schottky' = 'standard',
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    options: CircuitComponentOptions = {}
): string {
    const { showLabel = true, color = '#2C3E50' } = options;
    const width = orientation === 'horizontal' ? 60 : 40;
    const height = orientation === 'horizontal' ? 40 : 60;

    const diodeBody = orientation === 'horizontal' ? `
    <!-- Terminals -->
    <line x1="0" y1="20" x2="18" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="42" y1="20" x2="60" y2="20" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Triangle (anode) -->
    <path d="M 18,20 L 35,8 L 35,32 Z" fill="${color}" stroke="${color}" stroke-width="2"/>
    
    <!-- Bar (cathode) -->
    <line x1="35" y1="8" x2="35" y2="32" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    
    ${type === 'led' ? `
      <!-- LED arrows (light emission) -->
      <path d="M 38,10 L 43,5 M 43,5 L 41,7 M 43,5 L 45,7" 
            stroke="#FFA500" stroke-width="1.5" fill="none"/>
      <path d="M 38,15 L 43,10 M 43,10 L 41,12 M 43,10 L 45,12" 
            stroke="#FFA500" stroke-width="1.5" fill="none"/>
    ` : ''}
    
    ${type === 'zener' ? `
      <!-- Zener bend -->
      <path d="M 35,8 L 32,8 M 35,32 L 38,32" stroke="${color}" stroke-width="2"/>
    ` : ''}
    
    ${type === 'schottky' ? `
      <!-- Schottky bend -->
      <path d="M 35,8 L 32,8 L 32,12 M 35,32 L 38,32 L 38,28" stroke="${color}" stroke-width="2"/>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="0" cy="20" r="2" fill="#CD7F32"/>
    <circle cx="60" cy="20" r="2" fill="#CD7F32"/>
  ` : `
    <!-- Terminals -->
    <line x1="20" y1="0" x2="20" y2="18" stroke="#CD7F32" stroke-width="2.5"/>
    <line x1="20" y1="42" x2="20" y2="60" stroke="#CD7F32" stroke-width="2.5"/>
    
    <!-- Triangle (anode) -->
    <path d="M 20,18 L 8,35 L 32,35 Z" fill="${color}" stroke="${color}" stroke-width="2"/>
    
    <!-- Bar (cathode) -->
    <line x1="8" y1="35" x2="32" y2="35" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    
    ${type === 'led' ? `
      <!-- LED arrows (light emission) -->
      <path d="M 10,38 L 5,43 M 5,43 L 7,41 M 5,43 L 7,45" 
            stroke="#FFA500" stroke-width="1.5" fill="none"/>
      <path d="M 15,38 L 10,43 M 10,43 L 12,41 M 10,43 L 12,45" 
            stroke="#FFA500" stroke-width="1.5" fill="none"/>
    ` : ''}
    
    <!-- Connection dots -->
    <circle cx="20" cy="0" r="2" fill="#CD7F32"/>
    <circle cx="20" cy="60" r="2" fill="#CD7F32"/>
  `;

    const label = showLabel && type === 'led' ? `
    <text x="${orientation === 'horizontal' ? 30 : 42}" 
          y="${orientation === 'horizontal' ? 38 : 32}" 
          font-size="10" font-family="Inter, sans-serif" font-weight="600"
          fill="#FFA500" text-anchor="middle">
      LED
    </text>
  ` : '';

    return `
    <svg width="${width}" height="${height + (showLabel ? 8 : 0)}" 
         viewBox="0 0 ${width} ${height + (showLabel ? 8 : 0)}" 
         class="circuit-diode" xmlns="http://www.w3.org/2000/svg">
      ${diodeBody}
      ${label}
    </svg>
  `;
}

/**
 * Create professional transistor (BJT)
 */
export function createTransistor(
    type: 'npn' | 'pnp' = 'npn',
    configuration: 'common-emitter' | 'common-base' | 'common-collector' = 'common-emitter',
    options: CircuitComponentOptions = {}
): string {
    const { showLabel = true, color = '#2C3E50' } = options;
    const width = 70;
    const height = 80;

    const arrowDirection = type === 'npn' ? 'out' : 'in';

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="circuit-transistor" xmlns="http://www.w3.org/2000/svg">
      <!-- Base line (vertical) -->
      <line x1="25" y1="20" x2="25" y2="60" stroke="${color}" stroke-width="3.5"/>
      
      <!-- Collector -->
      <line x1="25" y1="30" x2="50" y2="10" stroke="${color}" stroke-width="2.5"/>
      <line x1="50" y1="10" x2="50" y2="0" stroke="#CD7F32" stroke-width="2.5"/>
      <circle cx="50" cy="0" r="2" fill="#CD7F32"/>
      
      <!-- Emitter with arrow -->
      <line x1="25" y1="50" x2="50" y2="70" stroke="${color}" stroke-width="2.5"/>
      ${arrowDirection === 'out' ? `
        <!-- Arrow pointing out (NPN) -->
        <polygon points="50,70 45,65 48,70 43,68" fill="${color}"/>
      ` : `
        <!-- Arrow pointing in (PNP) -->
        <polygon points="25,50 30,55 27,50 32,52" fill="${color}"/>
      `}
      <line x1="50" y1="70" x2="50" y2="80" stroke="#CD7F32" stroke-width="2.5"/>
      <circle cx="50" cy="80" r="2" fill="#CD7F32"/>
      
      <!-- Base terminal -->
      <line x1="0" y1="40" x2="25" y2="40" stroke="#CD7F32" stroke-width="2.5"/>
      <circle cx="0" cy="40" r="2" fill="#CD7F32"/>
      
      ${showLabel ? `
        <!-- Terminal labels -->
        <text x="55" y="8" font-size="11" font-family="Inter, sans-serif" 
              font-weight="600" fill="${color}">C</text>
        <text x="55" y="78" font-size="11" font-family="Inter, sans-serif" 
              font-weight="600" fill="${color}">E</text>
        <text x="5" y="38" font-size="11" font-family="Inter, sans-serif" 
              font-weight="600" fill="${color}">B</text>
        
        <!-- Type label -->
        <text x="35" y="45" font-size="10" font-family="Inter, sans-serif" 
              font-weight="600" fill="${color}" text-anchor="middle">${type.toUpperCase()}</text>
      ` : ''}
    </svg>
  `;
}
