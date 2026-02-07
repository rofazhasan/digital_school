/**
 * Number Theory Components
 * Prime factorization, modular arithmetic
 */

export interface NumberTheoryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create prime factorization tree diagram
 */
export function createPrimeFactorization(options: NumberTheoryOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="prime-factorization" xmlns="http://www.w3.org/2000/svg">
      <!-- Root: 60 -->
      <circle cx="100" cy="30" r="15" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
      <text x="100" y="35" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">60</text>
      
      <!-- First level: 6 × 10 -->
      <line x1="90" y1="42" x2="60" y2="68" stroke="#3498DB" stroke-width="2"/>
      <line x1="110" y1="42" x2="140" y2="68" stroke="#3498DB" stroke-width="2"/>
      
      <circle cx="60" cy="75" r="12" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="60" y="79" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">6</text>
      
      <circle cx="140" cy="75" r="12" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="140" y="79" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">10</text>
      
      <!-- Second level: 2×3 and 2×5 -->
      <line x1="54" y1="85" x2="40" y2="108" stroke="#27AE60" stroke-width="2"/>
      <line x1="66" y1="85" x2="80" y2="108" stroke="#27AE60" stroke-width="2"/>
      <line x1="134" y1="85" x2="120" y2="108" stroke="#27AE60" stroke-width="2"/>
      <line x1="146" y1="85" x2="160" y2="108" stroke="#27AE60" stroke-width="2"/>
      
      <!-- Primes -->
      ${[
            { x: 40, y: 115, n: 2 },
            { x: 80, y: 115, n: 3 },
            { x: 120, y: 115, n: 2 },
            { x: 160, y: 115, n: 5 }
        ].map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="10" fill="#27AE60" opacity="0.5" stroke="#27AE60" stroke-width="2"/>
        <text x="${p.x}" y="${p.y + 4}" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">${p.n}</text>
      `).join('')}
      
      <!-- Result -->
      <text x="100" y="145" font-size="11" fill="#E74C3C" text-anchor="middle">
        60 = 2² × 3 × 5
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Prime Factorization Tree
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create modular arithmetic diagram
 */
export function createModularArithmetic(options: NumberTheoryOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="modular-arithmetic" xmlns="http://www.w3.org/2000/svg">
      <!-- Clock circle -->
      <circle cx="100" cy="90" r="50" fill="none" stroke="#3498DB" stroke-width="3"/>
      
      <!-- Clock numbers (mod 12) -->
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
        const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
        const x = 100 + Math.cos(angle) * 40;
        const y = 90 + Math.sin(angle) * 40;
        const color = i === 0 ? '#E74C3C' : '#2C3E50';
        return `
          <circle cx="${x}" cy="${y}" r="8" fill="${i === 0 ? '#E74C3C' : '#3498DB'}" opacity="0.3" stroke="${color}" stroke-width="2"/>
          <text x="${x}" y="${y + 4}" font-size="10" fill="${color}" text-anchor="middle" font-weight="600">${i}</text>
        `;
    }).join('')}
      
      <!-- Example: 15 mod 12 = 3 -->
      <line x1="100" y1="90" x2="130" y2="65" stroke="#27AE60" stroke-width="2.5" marker-end="url(#arrow-mod)"/>
      <text x="135" y="60" font-size="9" fill="#27AE60" font-weight="600">15 mod 12 = 3</text>
      
      <!-- Center label -->
      <text x="100" y="95" font-size="11" fill="#9B59B6" text-anchor="middle" font-weight="600">mod 12</text>
      
      <!-- Congruence notation -->
      <text x="100" y="160" font-size="11" fill="#2C3E50" text-anchor="middle">
        a ≡ b (mod n)
      </text>
      
      <defs>
        <marker id="arrow-mod" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Modular Arithmetic (Clock Arithmetic)
        </text>
      ` : ''}
    </svg>
  `;
}
