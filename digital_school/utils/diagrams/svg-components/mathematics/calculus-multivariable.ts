/**
 * Multivariable Calculus Components
 * 3D surfaces, line integrals, Green's theorem
 */

export interface MultivariableCalculusOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create multivariable calculus 3D surface diagram
 */
export function createMultivariableSurface(options: MultivariableCalculusOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="multivariable-surface" xmlns="http://www.w3.org/2000/svg">
      <!-- 3D axes -->
      <line x1="50" y1="140" x2="180" y2="140" stroke="#2C3E50" stroke-width="2"/>
      <line x1="50" y1="140" x2="30" y2="100" stroke="#2C3E50" stroke-width="2"/>
      <line x1="50" y1="140" x2="50" y2="40" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Axis labels -->
      <text x="190" y="145" font-size="10" fill="#2C3E50">x</text>
      <text x="20" y="95" font-size="10" fill="#2C3E50">y</text>
      <text x="55" y="30" font-size="10" fill="#2C3E50">z</text>
      
      <!-- 3D surface (paraboloid) -->
      <ellipse cx="110" cy="80" rx="60" ry="20" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <ellipse cx="110" cy="100" rx="45" ry="15" fill="#3498DB" opacity="0.4" stroke="#3498DB" stroke-width="1.5"/>
      <ellipse cx="110" cy="115" rx="30" ry="10" fill="#3498DB" opacity="0.5" stroke="#3498DB" stroke-width="1.5"/>
      
      <!-- Gradient vector -->
      <line x1="110" y1="100" x2="130" y2="70" stroke="#E74C3C" stroke-width="2.5" marker-end="url(#arrow-grad)"/>
      <text x="140" y="65" font-size="9" fill="#E74C3C">∇f</text>
      
      <!-- Function label -->
      <text x="110" y="155" font-size="11" fill="#2C3E50" text-anchor="middle">
        z = f(x, y)
      </text>
      
      <defs>
        <marker id="arrow-grad" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Multivariable Function Surface
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create line integral diagram
 */
export function createLineIntegral(options: MultivariableCalculusOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="line-integral" xmlns="http://www.w3.org/2000/svg">
      <!-- Vector field -->
      ${Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => {
            const x = 40 + i * 25;
            const y = 40 + j * 20;
            const dx = Math.cos((i + j) * 0.5) * 10;
            const dy = Math.sin((i + j) * 0.5) * 10;
            return `
            <line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" 
                  stroke="#3498DB" stroke-width="1.5" marker-end="url(#arrow-field)" opacity="0.6"/>
          `;
        }).join('')
    ).join('')}
      
      <!-- Curve C -->
      <path d="M 50,80 Q 80,60 110,70 Q 140,80 170,90" 
            stroke="#E74C3C" stroke-width="3" fill="none"/>
      <text x="180" y="95" font-size="10" fill="#E74C3C" font-weight="600">C</text>
      
      <!-- Points -->
      <circle cx="50" cy="80" r="3" fill="#27AE60"/>
      <text x="45" y="95" font-size="9" fill="#27AE60">A</text>
      <circle cx="170" cy="90" r="3" fill="#27AE60"/>
      <text x="175" y="95" font-size="9" fill="#27AE60">B</text>
      
      <!-- Integral notation -->
      <text x="110" y="135" font-size="12" fill="#2C3E50" text-anchor="middle">
        ∫<tspan font-size="8" baseline-shift="sub">C</tspan> F · dr
      </text>
      
      <defs>
        <marker id="arrow-field" markerWidth="8" markerHeight="8" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 8 2, 0 4" fill="#3498DB"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Line Integral in Vector Field
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Green's theorem diagram
 */
export function createGreensTheorem(options: MultivariableCalculusOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="greens-theorem" xmlns="http://www.w3.org/2000/svg">
      <!-- Region D -->
      <ellipse cx="80" cy="80" rx="40" ry="30" fill="#27AE60" opacity="0.2" stroke="#27AE60" stroke-width="2"/>
      <text x="80" y="85" font-size="12" fill="#27AE60" text-anchor="middle" font-weight="600">D</text>
      
      <!-- Boundary curve C -->
      <ellipse cx="80" cy="80" rx="40" ry="30" fill="none" stroke="#E74C3C" stroke-width="3"/>
      <text x="125" y="75" font-size="10" fill="#E74C3C" font-weight="600">C</text>
      
      <!-- Circulation arrow -->
      <path d="M 115,70 A 40,30 0 0,1 115,90" 
            stroke="#F39C12" stroke-width="2" fill="none" marker-end="url(#arrow-circ)"/>
      
      <!-- Equals sign -->
      <text x="140" y="85" font-size="16" fill="#2C3E50" font-weight="600">=</text>
      
      <!-- Theorem -->
      <g id="theorem">
        <text x="165" y="70" font-size="11" fill="#3498DB" text-anchor="start">
          ∫<tspan font-size="8" baseline-shift="sub">C</tspan> F · dr
        </text>
        <text x="165" y="90" font-size="11" fill="#9B59B6" text-anchor="start">
          ∬<tspan font-size="8" baseline-shift="sub">D</tspan> (∂Q/∂x − ∂P/∂y) dA
        </text>
      </g>
      
      <!-- Labels -->
      <text x="120" y="125" font-size="9" fill="#E74C3C" text-anchor="middle">Circulation</text>
      <text x="120" y="140" font-size="9" fill="#27AE60" text-anchor="middle">= Flux through D</text>
      
      <defs>
        <marker id="arrow-circ" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Green's Theorem
        </text>
      ` : ''}
    </svg>
  `;
}
