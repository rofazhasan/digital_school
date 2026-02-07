/**
 * Professional Mathematics Geometry Components
 * Precise geometric shapes, graphs, and mathematical diagrams
 */

export interface MathGeometryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
    showGrid?: boolean;
}

/**
 * Create coordinate system with grid
 */
export function createCoordinateSystem(
    xRange: [number, number] = [-5, 5],
    yRange: [number, number] = [-5, 5],
    options: MathGeometryOptions = {}
): string {
    const { width = 200, height = 200, showLabel = true, showGrid = true } = options;

    const xMin = xRange[0], xMax = xRange[1];
    const yMin = yRange[0], yMax = yRange[1];
    const xScale = width / (xMax - xMin);
    const yScale = height / (yMax - yMin);
    const originX = -xMin * xScale;
    const originY = height + yMin * yScale;

    return `
    <svg width="${width + 40}" height="${height + 40}" viewBox="0 0 ${width + 40} ${height + 40}" 
         class="coordinate-system" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="mathArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <g transform="translate(20, 20)">
        ${showGrid ? `
          <!-- Grid lines -->
          ${Array.from({ length: xMax - xMin + 1 }, (_, i) => {
        const x = i * xScale;
        return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" 
                          stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
          ${Array.from({ length: yMax - yMin + 1 }, (_, i) => {
        const y = i * yScale;
        return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" 
                          stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
        ` : ''}
        
        <!-- X-axis -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#2C3E50" stroke-width="2" marker-end="url(#mathArrow)"/>
        
        <!-- Y-axis -->
        <line x1="${originX}" y1="${height}" x2="${originX}" y2="0" 
              stroke="#2C3E50" stroke-width="2" marker-end="url(#mathArrow)"/>
        
        ${showLabel ? `
          <!-- Axis labels -->
          <text x="${width - 5}" y="${originY + 15}" 
                font-size="12" font-family="Inter, sans-serif" 
                font-style="italic" fill="#2C3E50">
            x
          </text>
          <text x="${originX - 15}" y="10" 
                font-size="12" font-family="Inter, sans-serif" 
                font-style="italic" fill="#2C3E50">
            y
          </text>
          
          <!-- Origin -->
          <text x="${originX - 15}" y="${originY + 15}" 
                font-size="10" font-family="Inter, sans-serif" fill="#7F8C8D">
            O
          </text>
          
          <!-- X-axis numbers -->
          ${Array.from({ length: xMax - xMin + 1 }, (_, i) => {
        const val = xMin + i;
        if (val === 0) return '';
        const x = i * xScale;
        return `
              <text x="${x}" y="${originY + 15}" 
                    font-size="9" font-family="Inter, sans-serif" 
                    fill="#7F8C8D" text-anchor="middle">
                ${val}
              </text>
              <line x1="${x}" y1="${originY - 3}" x2="${x}" y2="${originY + 3}" 
                    stroke="#2C3E50" stroke-width="1.5"/>
            `;
    }).join('')}
          
          <!-- Y-axis numbers -->
          ${Array.from({ length: yMax - yMin + 1 }, (_, i) => {
        const val = yMax - i;
        if (val === 0) return '';
        const y = i * yScale;
        return `
              <text x="${originX - 8}" y="${y + 4}" 
                    font-size="9" font-family="Inter, sans-serif" 
                    fill="#7F8C8D" text-anchor="end">
                ${val}
              </text>
              <line x1="${originX - 3}" y1="${y}" x2="${originX + 3}" y2="${y}" 
                    stroke="#2C3E50" stroke-width="1.5"/>
            `;
    }).join('')}
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create circle with center and radius
 */
export function createCircle(
    radius: number,
    options: MathGeometryOptions = {}
): string {
    const { width = 150, height = 150, showLabel = true, color = '#3498DB' } = options;
    const centerX = width / 2;
    const centerY = height / 2;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="geometry-circle" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <!-- Circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
              fill="url(#circleGrad)" stroke="${color}" stroke-width="2.5"/>
      
      <!-- Center point -->
      <circle cx="${centerX}" cy="${centerY}" r="3" fill="#2C3E50"/>
      
      ${showLabel ? `
        <!-- Radius line -->
        <line x1="${centerX}" y1="${centerY}" 
              x2="${centerX + radius}" y2="${centerY}" 
              stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
        
        <!-- Radius label -->
        <text x="${centerX + radius / 2}" y="${centerY - 8}" 
              font-size="12" font-family="Inter, sans-serif" 
              font-style="italic" fill="#E74C3C" text-anchor="middle">
          r = ${radius}
        </text>
        
        <!-- Center label -->
        <text x="${centerX}" y="${centerY - 10}" 
              font-size="11" font-family="Inter, sans-serif" fill="#2C3E50">
          O
        </text>
        
        <!-- Formula -->
        <text x="${centerX}" y="${height + 25}" 
              font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Area = πr² = ${(Math.PI * radius * radius).toFixed(2)}
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create triangle with angles
 */
export function createTriangle(
    sideA: number,
    sideB: number,
    sideC: number,
    options: MathGeometryOptions = {}
): string {
    const { width = 180, height = 150, showLabel = true, color = '#27AE60' } = options;

    // Use Heron's formula to calculate area and then height
    const s = (sideA + sideB + sideC) / 2;
    const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
    const heightVal = (2 * area) / sideA;

    // Scale to fit
    const scale = Math.min((width - 40) / sideA, (height - 40) / heightVal);
    const scaledA = sideA * scale;
    const scaledH = heightVal * scale;

    // Calculate third vertex using law of cosines
    const angleC = Math.acos((sideA * sideA + sideB * sideB - sideC * sideC) / (2 * sideA * sideB));
    const scaledB = sideB * scale;
    const vertexCx = scaledB * Math.cos(angleC);
    const vertexCy = scaledB * Math.sin(angleC);

    const baseY = height - 20;
    const baseX = 20;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="geometry-triangle" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="triangleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <!-- Triangle -->
      <path d="M ${baseX},${baseY} 
               L ${baseX + scaledA},${baseY} 
               L ${baseX + vertexCx},${baseY - vertexCy} Z" 
            fill="url(#triangleGrad)" stroke="${color}" stroke-width="2.5"/>
      
      <!-- Vertices -->
      <circle cx="${baseX}" cy="${baseY}" r="3" fill="#2C3E50"/>
      <circle cx="${baseX + scaledA}" cy="${baseY}" r="3" fill="#2C3E50"/>
      <circle cx="${baseX + vertexCx}" cy="${baseY - vertexCy}" r="3" fill="#2C3E50"/>
      
      ${showLabel ? `
        <!-- Side labels -->
        <text x="${baseX + scaledA / 2}" y="${baseY + 15}" 
              font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          a = ${sideA}
        </text>
        <text x="${baseX + vertexCx / 2 - 15}" y="${baseY - vertexCy / 2}" 
              font-size="11" font-family="Inter, sans-serif" fill="#2C3E50">
          b = ${sideB}
        </text>
        <text x="${baseX + scaledA - (scaledA - vertexCx) / 2 + 15}" y="${baseY - vertexCy / 2}" 
              font-size="11" font-family="Inter, sans-serif" fill="#2C3E50">
          c = ${sideC}
        </text>
        
        <!-- Vertex labels -->
        <text x="${baseX - 10}" y="${baseY + 5}" 
              font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="#2C3E50">
          A
        </text>
        <text x="${baseX + scaledA + 10}" y="${baseY + 5}" 
              font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="#2C3E50">
          B
        </text>
        <text x="${baseX + vertexCx}" y="${baseY - vertexCy - 10}" 
              font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="#2C3E50">
          C
        </text>
        
        <!-- Area formula -->
        <text x="${width / 2}" y="${height + 25}" 
              font-size="10" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Area = ${area.toFixed(2)}
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create parabola graph
 */
export function createParabola(
    a: number = 1,
    h: number = 0,
    k: number = 0,
    options: MathGeometryOptions = {}
): string {
    const { width = 200, height = 200, showLabel = true, color = '#9B59B6' } = options;

    const xRange = 4;
    const yRange = 8;
    const xScale = width / (2 * xRange);
    const yScale = height / yRange;

    // Generate parabola points: y = a(x-h)² + k
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
        const x = -xRange + (i / 100) * (2 * xRange);
        const y = a * Math.pow(x - h, 2) + k;
        if (y >= -1 && y <= yRange) {
            const svgX = (x + xRange) * xScale;
            const svgY = height - (y * yScale);
            points.push(i === 0 || points.length === 0 ? `M ${svgX},${svgY}` : `L ${svgX},${svgY}`);
        }
    }

    return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="parabola-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Grid -->
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" 
              stroke="#ECF0F1" stroke-width="1"/>
        <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" 
              stroke="#ECF0F1" stroke-width="1"/>
        
        <!-- Axes -->
        <line x1="0" y1="${height}" x2="${width}" y2="${height}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="${width / 2}" y1="${height}" x2="${width / 2}" y2="0" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Parabola -->
        <path d="${points.join(' ')}" stroke="${color}" stroke-width="3" 
              fill="none" stroke-linecap="round"/>
        
        <!-- Vertex point -->
        <circle cx="${(h + xRange) * xScale}" cy="${height - (k * yScale)}" 
                r="4" fill="#E74C3C"/>
        
        ${showLabel ? `
          <!-- Equation -->
          <text x="${width / 2}" y="${height + 35}" 
                font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${a}(x${h !== 0 ? (h > 0 ? '-' + h : '+' + Math.abs(h)) : ''})²${k !== 0 ? (k > 0 ? '+' + k : k) : ''}
          </text>
          
          <!-- Vertex label -->
          <text x="${(h + xRange) * xScale + 10}" y="${height - (k * yScale) - 10}" 
                font-size="10" font-family="Inter, sans-serif" fill="#E74C3C">
            Vertex (${h}, ${k})
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create cube (3D geometry)
 */
export function createCube(
    sideLength: number = 50,
    options: MathGeometryOptions = {}
): string {
    const { width = 140, height = 140, showLabel = true, color = '#3498DB' } = options;

    const s = sideLength;
    const offset = s * 0.4; // Isometric offset

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="geometry-cube" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Face gradients for 3D effect -->
        <linearGradient id="cubeFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${adjustBrightness(color, 30)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, 10)};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${adjustBrightness(color, 10)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustBrightness(color, -30)};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <g transform="translate(30, 30)">
        <!-- Front face -->
        <path d="M 0,${offset} L ${s},${offset} L ${s},${s + offset} L 0,${s} Z" 
              fill="url(#cubeFront)" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Top face -->
        <path d="M 0,${offset} L ${offset},0 L ${s + offset},0 L ${s},${offset} Z" 
              fill="url(#cubeTop)" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Right face -->
        <path d="M ${s},${offset} L ${s + offset},0 L ${s + offset},${s} L ${s},${s + offset} Z" 
              fill="url(#cubeRight)" stroke="#2C3E50" stroke-width="2"/>
        
        ${showLabel ? `
          <!-- Edge labels -->
          <text x="${s / 2}" y="${s + offset + 20}" 
                font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            ${sideLength}
          </text>
          
          <!-- Volume formula -->
          <text x="${s / 2}" y="${s + offset + 50}" 
                font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            Volume = ${sideLength}³ = ${Math.pow(sideLength, 3)}
          </text>
        ` : ''}
      </g>
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
