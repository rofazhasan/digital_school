/**
 * Professional Thermodynamics Components
 * PV diagrams, heat engines, phase diagrams
 */

export interface ThermodynamicsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create PV (Pressure-Volume) diagram
 */
export function createPVDiagram(
    process: 'isothermal' | 'adiabatic' | 'isobaric' | 'isochoric',
    options: ThermodynamicsOptions = {}
): string {
    const { width = 200, height = 200, showLabel = true, color = '#E74C3C' } = options;

    // Generate curve based on process type
    const getCurve = () => {
        switch (process) {
            case 'isothermal': // PV = constant (hyperbola)
                return Array.from({ length: 50 }, (_, i) => {
                    const v = 1 + (i / 50) * 4;
                    const p = 4 / v;
                    return { v, p };
                });
            case 'adiabatic': // PV^γ = constant (steeper hyperbola)
                return Array.from({ length: 50 }, (_, i) => {
                    const v = 1 + (i / 50) * 4;
                    const p = 6 / Math.pow(v, 1.4);
                    return { v, p };
                });
            case 'isobaric': // P = constant (horizontal line)
                return Array.from({ length: 50 }, (_, i) => {
                    const v = 1 + (i / 50) * 4;
                    const p = 3;
                    return { v, p };
                });
            case 'isochoric': // V = constant (vertical line)
                return Array.from({ length: 50 }, (_, i) => {
                    const v = 2.5;
                    const p = 1 + (i / 50) * 4;
                    return { v, p };
                });
        }
    };

    const points = getCurve();
    const xScale = (width - 60) / 5;
    const yScale = (height - 60) / 5;

    const pathData = points.map(({ v, p }, i) => {
        const x = 40 + v * xScale;
        const y = height - 20 - p * yScale;
        return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="pv-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="pvArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <!-- Axes -->
      <line x1="40" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#pvArrow)"/>
      <line x1="40" y1="${height - 20}" x2="40" y2="20" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#pvArrow)"/>
      
      <!-- Process curve -->
      <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
      
      <!-- Work area (for non-isochoric) -->
      ${process !== 'isochoric' ? `
        <path d="${pathData} L ${40 + points[points.length - 1].v * xScale},${height - 20} L 40,${height - 20} Z" 
              fill="${color}" opacity="0.2"/>
      ` : ''}
      
      ${showLabel ? `
        <!-- Axis labels -->
        <text x="${width - 10}" y="${height - 5}" font-size="14" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50" text-anchor="end">V</text>
        <text x="25" y="25" font-size="14" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50">P</text>
        
        <!-- Process label -->
        <text x="${width / 2 + 20}" y="${height + 30}" font-size="12" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          ${process.charAt(0).toUpperCase() + process.slice(1)} Process
        </text>
        
        <!-- Work label -->
        ${process !== 'isochoric' ? `
          <text x="${width / 2}" y="${height - 40}" font-size="10" font-family="Inter, sans-serif" 
                fill="${color}" text-anchor="middle">W (Work)</text>
        ` : ''}
      ` : ''}
    </svg>
  `;
}

/**
 * Create Carnot cycle diagram
 */
export function createCarnotCycle(options: ThermodynamicsOptions = {}): string {
    const { width = 220, height = 220, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="carnot-cycle" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="carnotArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <!-- Axes -->
      <line x1="40" y1="${height - 20}" x2="${width - 20}" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#carnotArrow)"/>
      <line x1="40" y1="${height - 20}" x2="40" y2="20" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#carnotArrow)"/>
      
      <!-- Carnot cycle (4 processes) -->
      <!-- 1. Isothermal expansion (hot) -->
      <path d="M 60,60 Q 90,55 120,60" stroke="#E74C3C" stroke-width="3" fill="none"/>
      <text x="90" y="50" font-size="9" fill="#E74C3C">1→2</text>
      
      <!-- 2. Adiabatic expansion -->
      <path d="M 120,60 Q 130,90 140,120" stroke="#F39C12" stroke-width="3" fill="none"/>
      <text x="135" y="90" font-size="9" fill="#F39C12">2→3</text>
      
      <!-- 3. Isothermal compression (cold) -->
      <path d="M 140,120 Q 110,125 80,120" stroke="#3498DB" stroke-width="3" fill="none"/>
      <text x="110" y="135" font-size="9" fill="#3498DB">3→4</text>
      
      <!-- 4. Adiabatic compression -->
      <path d="M 80,120 Q 70,90 60,60" stroke="#9B59B6" stroke-width="3" fill="none"/>
      <text x="55" y="90" font-size="9" fill="#9B59B6">4→1</text>
      
      <!-- State points -->
      <circle cx="60" cy="60" r="4" fill="#E74C3C"/>
      <circle cx="120" cy="60" r="4" fill="#F39C12"/>
      <circle cx="140" cy="120" r="4" fill="#3498DB"/>
      <circle cx="80" cy="120" r="4" fill="#9B59B6"/>
      
      <!-- Work area -->
      <path d="M 60,60 Q 90,55 120,60 Q 130,90 140,120 Q 110,125 80,120 Q 70,90 60,60 Z" 
            fill="#27AE60" opacity="0.15"/>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="${width - 30}" y="${height - 5}" font-size="14" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50">V</text>
        <text x="25" y="25" font-size="14" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50">P</text>
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Carnot Cycle</text>
        <text x="100" y="95" font-size="9" font-family="Inter, sans-serif" 
              fill="#27AE60" text-anchor="middle">W</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create phase diagram (solid-liquid-gas)
 */
export function createPhaseDiagram(options: ThermodynamicsOptions = {}): string {
    const { width = 200, height = 200, showLabel = true } = options;

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="phase-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="phaseArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <!-- Axes -->
      <line x1="40" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#phaseArrow)"/>
      <line x1="40" y1="${height - 20}" x2="40" y2="20" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#phaseArrow)"/>
      
      <!-- Phase boundaries -->
      <!-- Solid-Liquid (melting curve) -->
      <path d="M 70,${height - 20} L 75,40" stroke="#3498DB" stroke-width="2.5"/>
      
      <!-- Liquid-Gas (vaporization curve) -->
      <path d="M 75,40 Q 120,60 160,${height - 20}" stroke="#E74C3C" stroke-width="2.5"/>
      
      <!-- Solid-Gas (sublimation curve) -->
      <path d="M 70,${height - 20} Q 90,120 160,${height - 20}" stroke="#9B59B6" stroke-width="2.5"/>
      
      <!-- Triple point -->
      <circle cx="75" cy="140" r="4" fill="#2C3E50"/>
      
      <!-- Critical point -->
      <circle cx="160" cy="60" r="4" fill="#E74C3C"/>
      
      <!-- Phase regions -->
      <text x="55" y="100" font-size="13" font-family="Inter, sans-serif" 
            font-weight="600" fill="#5DADE2">SOLID</text>
      <text x="100" y="60" font-size="13" font-family="Inter, sans-serif" 
            font-weight="600" fill="#F39C12">LIQUID</text>
      <text x="130" y="140" font-size="13" font-family="Inter, sans-serif" 
            font-weight="600" fill="#E74C3C">GAS</text>
      
      ${showLabel ? `
        <!-- Axis labels -->
        <text x="${width - 10}" y="${height - 5}" font-size="13" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50" text-anchor="end">T</text>
        <text x="25" y="25" font-size="13" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50">P</text>
        
        <!-- Point labels -->
        <text x="80" y="145" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50">Triple Point</text>
        <text x="165" y="58" font-size="9" font-family="Inter, sans-serif" fill="#E74C3C">Critical Point</text>
        
        <text x="${width / 2 + 20}" y="${height + 30}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Phase Diagram</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create heat engine diagram
 */
export function createHeatEngine(options: ThermodynamicsOptions = {}): string {
    const { width = 160, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="heat-engine" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hotGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="coldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Hot reservoir -->
      <rect x="30" y="20" width="100" height="30" fill="url(#hotGrad)" 
            stroke="#C0392B" stroke-width="2" rx="3"/>
      <text x="80" y="40" font-size="12" font-family="Inter, sans-serif" 
            font-weight="600" fill="white" text-anchor="middle">Hot (T_H)</text>
      
      <!-- Engine -->
      <circle cx="80" cy="100" r="35" fill="#ECF0F1" stroke="#2C3E50" stroke-width="3"/>
      <text x="80" y="105" font-size="13" font-family="Inter, sans-serif" 
            font-weight="600" fill="#2C3E50" text-anchor="middle">Engine</text>
      
      <!-- Cold reservoir -->
      <rect x="30" y="150" width="100" height="30" fill="url(#coldGrad)" 
            stroke="#2980B9" stroke-width="2" rx="3"/>
      <text x="80" y="170" font-size="12" font-family="Inter, sans-serif" 
            font-weight="600" fill="white" text-anchor="middle">Cold (T_C)</text>
      
      <!-- Heat flow arrows -->
      <defs>
        <marker id="heatArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#E74C3C"/>
        </marker>
        <marker id="coldArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#3498DB"/>
        </marker>
        <marker id="workArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#27AE60"/>
        </marker>
      </defs>
      
      <!-- Q_H (heat in) -->
      <line x1="80" y1="55" x2="80" y2="65" stroke="#E74C3C" stroke-width="3" marker-end="url(#heatArrow)"/>
      <text x="95" y="60" font-size="11" font-family="Inter, sans-serif" fill="#E74C3C">Q_H</text>
      
      <!-- Q_C (heat out) -->
      <line x1="80" y1="135" x2="80" y2="145" stroke="#3498DB" stroke-width="3" marker-end="url(#coldArrow)"/>
      <text x="95" y="140" font-size="11" font-family="Inter, sans-serif" fill="#3498DB">Q_C</text>
      
      <!-- W (work out) -->
      <line x1="115" y1="100" x2="145" y2="100" stroke="#27AE60" stroke-width="3" marker-end="url(#workArrow)"/>
      <text x="130" y="95" font-size="11" font-family="Inter, sans-serif" fill="#27AE60">W</text>
      
      ${showLabel ? `
        <text x="80" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Heat Engine</text>
      ` : ''}
    </svg>
  `;
}
