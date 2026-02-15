/**
 * Professional Biology Components
 * Detailed cell structures and organelles with realistic colors
 */

import { createRadialGradient, createShadowFilter } from '../common/gradients';

export interface BiologyComponentOptions {
  width?: number;
  height?: number;
  showLabel?: boolean;
  showDetails?: boolean;
}

/**
 * Create professional animal cell with organelles
 */
export function createAnimalCell(options: BiologyComponentOptions = {}): string {
  const { width = 220, height = 220, showLabel = true, showDetails = true } = options;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="biology-cell" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Cell membrane gradient -->
        <radialGradient id="membraneGrad">
          <stop offset="0%" style="stop-color:#F39C12;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:0.8" />
        </radialGradient>
        
        <!-- Cytoplasm gradient -->
        <radialGradient id="cytoplasmGrad">
          <stop offset="0%" style="stop-color:#ECF0F1;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#BDC3C7;stop-opacity:0.4" />
        </radialGradient>
        
        <!-- Nucleus gradient -->
        <radialGradient id="nucleusGrad">
          <stop offset="0%" style="stop-color:#C39BD3;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#9B59B6;stop-opacity:0.9" />
        </radialGradient>
        
        <!-- Mitochondria gradient -->
        <radialGradient id="mitoGrad">
          <stop offset="0%" style="stop-color:#F1948A;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Cell membrane (double layer) -->
      <circle cx="110" cy="110" r="100" fill="url(#cytoplasmGrad)" 
              stroke="#E67E22" stroke-width="5"/>
      <circle cx="110" cy="110" r="97" fill="none" stroke="#F39C12" stroke-width="2"/>
      
      <!-- Nucleus -->
      <circle cx="110" cy="110" r="40" fill="url(#nucleusGrad)" 
              stroke="#8E44AD" stroke-width="2.5"/>
      
      <!-- Nuclear membrane (double layer) -->
      <circle cx="110" cy="110" r="40" fill="none" stroke="#8E44AD" stroke-width="2"/>
      <circle cx="110" cy="110" r="37" fill="none" stroke="#9B59B6" stroke-width="1.5"/>
      
      <!-- Nucleolus -->
      <circle cx="115" cy="105" r="12" fill="#6C3483" opacity="0.9"/>
      
      ${showDetails ? `
        <!-- Mitochondria (multiple) -->
        <g id="mitochondria1">
          <ellipse cx="65" cy="65" rx="22" ry="14" fill="url(#mitoGrad)" 
                   stroke="#D35400" stroke-width="2" opacity="0.85"/>
          <!-- Cristae (inner folds) -->
          <path d="M 48,65 Q 52,60 56,65 Q 60,70 64,65 Q 68,60 72,65 Q 76,70 80,65" 
                stroke="#D35400" stroke-width="1.5" fill="none"/>
        </g>
        
        <g id="mitochondria2">
          <ellipse cx="155" cy="155" rx="22" ry="14" fill="url(#mitoGrad)" 
                   stroke="#D35400" stroke-width="2" opacity="0.85"/>
          <path d="M 138,155 Q 142,150 146,155 Q 150,160 154,155 Q 158,150 162,155 Q 166,160 170,155" 
                stroke="#D35400" stroke-width="1.5" fill="none"/>
        </g>
        
        <g id="mitochondria3">
          <ellipse cx="60" cy="150" rx="20" ry="12" fill="url(#mitoGrad)" 
                   stroke="#D35400" stroke-width="2" opacity="0.85"/>
          <path d="M 45,150 Q 49,146 53,150 Q 57,154 61,150 Q 65,146 69,150 Q 73,154 77,150" 
                stroke="#D35400" stroke-width="1.5" fill="none"/>
        </g>
        
        <!-- Endoplasmic Reticulum (ER) -->
        <path d="M 55,120 Q 65,115 75,120 Q 85,125 95,120" 
              stroke="#3498DB" stroke-width="2.5" fill="none" opacity="0.7"/>
        <path d="M 55,130 Q 65,125 75,130 Q 85,135 95,130" 
              stroke="#3498DB" stroke-width="2.5" fill="none" opacity="0.7"/>
        <path d="M 125,120 Q 135,115 145,120 Q 155,125 165,120" 
              stroke="#3498DB" stroke-width="2.5" fill="none" opacity="0.7"/>
        
        <!-- Ribosomes (small dots on ER) -->
        ${[
        [60, 120], [70, 118], [80, 122], [90, 120],
        [60, 130], [70, 128], [80, 132],
        [130, 120], [140, 118], [150, 122], [160, 120]
      ].map(([x, y]) => `
          <circle cx="${x}" cy="${y}" r="2" fill="#2C3E50"/>
        `).join('')}
        
        <!-- Golgi Apparatus -->
        <g id="golgi">
          ${[0, 1, 2, 3, 4].map(i => `
            <path d="M ${145 + i * 2},${75 + i * 3} Q ${155 + i * 2},${73 + i * 3} ${165 + i * 2},${75 + i * 3}" 
                  stroke="#F39C12" stroke-width="2" fill="none" opacity="${0.8 - i * 0.1}"/>
          `).join('')}
        </g>
        
        <!-- Lysosomes -->
        <circle cx="150" cy="70" r="6" fill="#E74C3C" opacity="0.8" stroke="#C0392B" stroke-width="1.5"/>
        <circle cx="70" cy="160" r="6" fill="#E74C3C" opacity="0.8" stroke="#C0392B" stroke-width="1.5"/>
        <circle cx="160" cy="130" r="6" fill="#E74C3C" opacity="0.8" stroke="#C0392B" stroke-width="1.5"/>
        
        <!-- Centrioles -->
        <g id="centrioles" transform="translate(160, 50)">
          <rect x="0" y="0" width="8" height="12" fill="#34495E" rx="1"/>
          <rect x="10" y="0" width="8" height="12" fill="#34495E" rx="1"/>
          <line x1="4" y1="2" x2="4" y2="10" stroke="#7F8C8D" stroke-width="1"/>
          <line x1="14" y1="2" x2="14" y2="10" stroke="#7F8C8D" stroke-width="1"/>
        </g>
      ` : ''}
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="110" y="15" font-size="14" font-family="Inter, sans-serif" 
              font-weight="bold" fill="#2C3E50" text-anchor="middle">
          Animal Cell
        </text>
        
        ${showDetails ? `
          <!-- Organelle labels -->
          <text x="110" y="95" font-size="9" font-family="Inter, sans-serif" 
                fill="#6C3483">Nucleus</text>
          <text x="40" y="60" font-size="8" font-family="Inter, sans-serif" 
                fill="#D35400">Mitochondria</text>
          <text x="175" y="75" font-size="8" font-family="Inter, sans-serif" 
                fill="#F39C12">Golgi</text>
          <text x="30" y="125" font-size="8" font-family="Inter, sans-serif" 
                fill="#3498DB">ER</text>
        ` : ''}
      ` : ''}
    </svg>
  `;
}

/**
 * Create professional DNA double helix
 */
export function createDNA(options: BiologyComponentOptions = {}): string {
  const { width = 120, height = 200, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="biology-dna" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Strand gradients -->
        <linearGradient id="strand1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="strand2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Left strand (helix) -->
      <path d="M 30,10 Q 20,30 30,50 Q 40,70 30,90 Q 20,110 30,130 Q 40,150 30,170 Q 20,190 30,200" 
            stroke="url(#strand1Grad)" stroke-width="4" fill="none" stroke-linecap="round"/>
      
      <!-- Right strand (helix) -->
      <path d="M 90,10 Q 100,30 90,50 Q 80,70 90,90 Q 100,110 90,130 Q 80,150 90,170 Q 100,190 90,200" 
            stroke="url(#strand2Grad)" stroke-width="4" fill="none" stroke-linecap="round"/>
      
      <!-- Base pairs (rungs) -->
      ${Array.from({ length: 10 }, (_, i) => {
    const y = 20 + i * 18;
    const leftX = 30 + 10 * Math.sin((i * Math.PI) / 2.5);
    const rightX = 90 - 10 * Math.sin((i * Math.PI) / 2.5);
    const bases = ['A-T', 'T-A', 'G-C', 'C-G'];
    const basePair = bases[i % 4];
    const colors: Record<string, string> = {
      'A': '#27AE60', 'T': '#E74C3C',
      'G': '#F39C12', 'C': '#3498DB'
    };

    return `
          <!-- Base pair line -->
          <line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" 
                stroke="#95A5A6" stroke-width="2.5" opacity="0.8"/>
          
          <!-- Base circles -->
          <circle cx="${leftX}" cy="${y}" r="5" fill="${colors[basePair[0]]}" 
                  stroke="#2C3E50" stroke-width="1"/>
          <circle cx="${rightX}" cy="${y}" r="5" fill="${colors[basePair[2]]}" 
                  stroke="#2C3E50" stroke-width="1"/>
          
          ${showLabel && i === 5 ? `
            <text x="${(leftX + rightX) / 2}" y="${y - 8}" 
                  font-size="8" font-family="Inter, sans-serif" 
                  fill="#2C3E50" text-anchor="middle">${basePair}</text>
          ` : ''}
        `;
  }).join('')}
      
      ${showLabel ? `
        <!-- DNA label -->
        <text x="60" y="215" font-size="12" font-family="Inter, sans-serif" 
              font-weight="bold" fill="#2C3E50" text-anchor="middle">
          DNA Double Helix
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create professional mitochondria
 */
export function createMitochondria(options: BiologyComponentOptions = {}): string {
  const { width = 100, height = 60, showLabel = true } = options;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="biology-mitochondria" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Mitochondria gradient -->
        <radialGradient id="mitoGrad">
          <stop offset="0%" style="stop-color:#F1948A;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#E67E22;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Outer membrane -->
      <ellipse cx="50" cy="30" rx="45" ry="25" fill="url(#mitoGrad)" 
               stroke="#D35400" stroke-width="2.5"/>
      
      <!-- Inner membrane -->
      <ellipse cx="50" cy="30" rx="40" ry="20" fill="none" 
               stroke="#D35400" stroke-width="2"/>
      
      <!-- Cristae (inner folds) -->
      ${[0, 1, 2, 3, 4, 5, 6].map(i => {
    const x = 15 + i * 12;
    return `
          <path d="M ${x},30 Q ${x + 3},20 ${x + 6},30 Q ${x + 9},40 ${x + 12},30" 
                stroke="#D35400" stroke-width="1.8" fill="none"/>
        `;
  }).join('')}
      
      <!-- Matrix (inner space) -->
      <ellipse cx="50" cy="30" rx="35" ry="15" fill="#F39C12" opacity="0.3"/>
      
      ${showLabel ? `
        <!-- Label -->
        <text x="50" y="55" font-size="10" font-family="Inter, sans-serif" 
              font-weight="600" fill="#2C3E50" text-anchor="middle">
          Mitochondrion
        </text>
      ` : ''}
    </svg>
  `;
}
