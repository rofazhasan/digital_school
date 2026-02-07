/**
 * Discrete Mathematics Components
 * Graph theory, combinatorics, logic gates
 */

export interface DiscreteMathOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create graph theory diagram
 */
export function createGraphTheory(options: DiscreteMathOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="graph-theory" xmlns="http://www.w3.org/2000/svg">
      <!-- Vertices -->
      ${[
            { x: 100, y: 50, label: 'A' },
            { x: 60, y: 100, label: 'B' },
            { x: 140, y: 100, label: 'C' },
            { x: 80, y: 140, label: 'D' },
            { x: 120, y: 140, label: 'E' }
        ].map(v => `
        <circle cx="${v.x}" cy="${v.y}" r="12" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="2"/>
        <text x="${v.x}" y="${v.y + 4}" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">${v.label}</text>
      `).join('')}
      
      <!-- Edges -->
      <line x1="100" y1="50" x2="60" y2="100" stroke="#E74C3C" stroke-width="2"/>
      <line x1="100" y1="50" x2="140" y2="100" stroke="#E74C3C" stroke-width="2"/>
      <line x1="60" y1="100" x2="80" y2="140" stroke="#E74C3C" stroke-width="2"/>
      <line x1="140" y1="100" x2="120" y2="140" stroke="#E74C3C" stroke-width="2"/>
      <line x1="80" y1="140" x2="120" y2="140" stroke="#E74C3C" stroke-width="2"/>
      <line x1="60" y1="100" x2="140" y2="100" stroke="#E74C3C" stroke-width="2"/>
      
      <!-- Labels -->
      <text x="100" y="25" font-size="10" fill="#7F8C8D" text-anchor="middle">V = {A, B, C, D, E}</text>
      <text x="100" y="170" font-size="10" fill="#7F8C8D" text-anchor="middle">E = edges</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Graph Theory (Vertices & Edges)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create combinatorics diagram
 */
export function createCombinatorics(options: DiscreteMathOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="combinatorics" xmlns="http://www.w3.org/2000/svg">
      <!-- Permutations -->
      <g id="permutations">
        <rect x="30" y="40" width="80" height="50" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="70" y="30" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Permutations</text>
        <text x="70" y="60" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">P(n,r)</text>
        <text x="70" y="75" font-size="10" fill="#2C3E50" text-anchor="middle">= n!/(n-r)!</text>
        <text x="70" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">Order matters</text>
      </g>
      
      <!-- Combinations -->
      <g id="combinations">
        <rect x="120" y="40" width="80" height="50" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="160" y="30" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Combinations</text>
        <text x="160" y="60" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">C(n,r)</text>
        <text x="160" y="75" font-size="10" fill="#2C3E50" text-anchor="middle">= n!/[r!(n-r)!]</text>
        <text x="160" y="105" font-size="8" fill="#7F8C8D" text-anchor="middle">Order doesn't matter</text>
      </g>
      
      <!-- Example -->
      <text x="110" y="130" font-size="9" fill="#27AE60" text-anchor="middle">
        Example: Choose 2 from {A,B,C}
      </text>
      <text x="70" y="145" font-size="8" fill="#3498DB" text-anchor="middle">P(3,2) = 6</text>
      <text x="160" y="145" font-size="8" fill="#9B59B6" text-anchor="middle">C(3,2) = 3</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Combinatorics (Counting)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create logic gates truth table diagram
 */
export function createLogicGatesTruthTable(options: DiscreteMathOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="logic-gates-truth-table" xmlns="http://www.w3.org/2000/svg">
      <!-- AND gate -->
      <g id="and-gate">
        <path d="M 40,50 L 40,80 L 50,80 A 15,15 0 0,0 50,50 Z" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
        <text x="45" y="40" font-size="9" fill="#3498DB" text-anchor="middle" font-weight="600">AND</text>
      </g>
      
      <!-- OR gate -->
      <g id="or-gate">
        <path d="M 90,50 Q 95,65 90,80 L 100,80 A 15,15 0 0,0 100,50 Z" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2"/>
        <text x="95" y="40" font-size="9" fill="#9B59B6" text-anchor="middle" font-weight="600">OR</text>
      </g>
      
      <!-- NOT gate -->
      <g id="not-gate">
        <path d="M 140,50 L 140,80 L 160,65 Z" fill="#E8F8F0" stroke="#27AE60" stroke-width="2"/>
        <circle cx="162" cy="65" r="3" fill="none" stroke="#27AE60" stroke-width="2"/>
        <text x="150" y="40" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">NOT</text>
      </g>
      
      <!-- Truth table -->
      <g id="truth-table">
        <rect x="30" y="100" width="160" height="70" fill="white" stroke="#2C3E50" stroke-width="2" rx="3"/>
        
        <!-- Header -->
        <text x="50" y="115" font-size="9" fill="#2C3E50" font-weight="600">A</text>
        <text x="80" y="115" font-size="9" fill="#2C3E50" font-weight="600">B</text>
        <text x="110" y="115" font-size="9" fill="#3498DB" font-weight="600">AND</text>
        <text x="140" y="115" font-size="9" fill="#9B59B6" font-weight="600">OR</text>
        <text x="170" y="115" font-size="9" fill="#27AE60" font-weight="600">NOT A</text>
        
        <!-- Rows -->
        ${[
            { a: 0, b: 0, and: 0, or: 0, not: 1, y: 130 },
            { a: 0, b: 1, and: 0, or: 1, not: 1, y: 145 },
            { a: 1, b: 0, and: 0, or: 1, not: 0, y: 160 },
            { a: 1, b: 1, and: 1, or: 1, not: 0, y: 175 }
        ].map(row => `
          <text x="50" y="${row.y}" font-size="9" fill="#2C3E50" text-anchor="middle">${row.a}</text>
          <text x="80" y="${row.y}" font-size="9" fill="#2C3E50" text-anchor="middle">${row.b}</text>
          <text x="110" y="${row.y}" font-size="9" fill="#3498DB" text-anchor="middle">${row.and}</text>
          <text x="140" y="${row.y}" font-size="9" fill="#9B59B6" text-anchor="middle">${row.or}</text>
          <text x="170" y="${row.y}" font-size="9" fill="#27AE60" text-anchor="middle">${row.not}</text>
        `).join('')}
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Logic Gates & Truth Tables
        </text>
      ` : ''}
    </svg>
  `;
}
