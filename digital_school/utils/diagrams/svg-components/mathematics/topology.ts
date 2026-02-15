/**
 * Topology Components
 * Homeomorphism, Euler characteristic
 */

export interface TopologyOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create homeomorphism diagram (coffee cup to donut)
 */
export function createHomeomorphism(options: TopologyOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="homeomorphism" xmlns="http://www.w3.org/2000/svg">
      <!-- Coffee cup -->
      <g id="coffee-cup">
        <path d="M 40,70 L 40,100 Q 40,110 50,110 L 70,110 Q 80,110 80,100 L 80,70" 
              fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
        <ellipse cx="60" cy="70" rx="20" ry="5" fill="none" stroke="#3498DB" stroke-width="2"/>
        <!-- Handle -->
        <path d="M 80,80 Q 95,80 95,90 Q 95,100 80,100" 
              fill="none" stroke="#3498DB" stroke-width="2"/>
        <text x="60" y="50" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Coffee Cup</text>
        <text x="60" y="130" font-size="8" fill="#7F8C8D" text-anchor="middle">1 hole</text>
      </g>
      
      <!-- Continuous deformation arrows -->
      <line x1="105" y1="80" x2="125" y2="80" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-topo)"/>
      <text x="115" y="75" font-size="8" fill="#F39C12" text-anchor="middle">continuous</text>
      <text x="115" y="95" font-size="8" fill="#F39C12" text-anchor="middle">deformation</text>
      
      <!-- Torus (donut) -->
      <g id="torus">
        <ellipse cx="170" cy="85" rx="25" ry="15" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2"/>
        <ellipse cx="170" cy="85" rx="12" ry="8" fill="white" stroke="#9B59B6" stroke-width="2"/>
        <text x="170" y="50" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Torus</text>
        <text x="170" y="130" font-size="8" fill="#7F8C8D" text-anchor="middle">1 hole</text>
      </g>
      
      <!-- Homeomorphic symbol -->
      <text x="120" y="145" font-size="11" fill="#27AE60" text-anchor="middle" font-weight="600">
        ≅ Homeomorphic
      </text>
      
      <defs>
        <marker id="arrow-topo" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Homeomorphism (Topological Equivalence)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Euler characteristic diagram
 */
export function createEulerCharacteristic(options: TopologyOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="euler-characteristic" xmlns="http://www.w3.org/2000/svg">
      <!-- Tetrahedron (3D) -->
      <g id="tetrahedron">
        <!-- Vertices -->
        ${[
            { x: 60, y: 40, label: 'V₁' },
            { x: 40, y: 80, label: 'V₂' },
            { x: 80, y: 80, label: 'V₃' },
            { x: 60, y: 70, label: 'V₄' }
        ].map(v => `
          <circle cx="${v.x}" cy="${v.y}" r="3" fill="#E74C3C"/>
          <text x="${v.x + 8}" y="${v.y + 3}" font-size="8" fill="#E74C3C">${v.label}</text>
        `).join('')}
        
        <!-- Edges -->
        <line x1="60" y1="40" x2="40" y2="80" stroke="#3498DB" stroke-width="2"/>
        <line x1="60" y1="40" x2="80" y2="80" stroke="#3498DB" stroke-width="2"/>
        <line x1="60" y1="40" x2="60" y2="70" stroke="#3498DB" stroke-width="2"/>
        <line x1="40" y1="80" x2="80" y2="80" stroke="#3498DB" stroke-width="2"/>
        <line x1="40" y1="80" x2="60" y2="70" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="80" y1="80" x2="60" y2="70" stroke="#3498DB" stroke-width="2" stroke-dasharray="3,3"/>
        
        <text x="60" y="25" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Tetrahedron</text>
      </g>
      
      <!-- Counts -->
      <g id="counts">
        <text x="130" y="50" font-size="11" fill="#E74C3C">V = 4 vertices</text>
        <text x="130" y="70" font-size="11" fill="#3498DB">E = 6 edges</text>
        <text x="130" y="90" font-size="11" fill="#27AE60">F = 4 faces</text>
      </g>
      
      <!-- Euler's formula -->
      <rect x="40" y="110" width="140" height="40" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
      <text x="110" y="130" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">
        χ = V − E + F
      </text>
      <text x="110" y="145" font-size="11" fill="#9B59B6" text-anchor="middle">
        χ = 4 − 6 + 4 = 2
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Euler Characteristic
        </text>
      ` : ''}
    </svg>
  `;
}
