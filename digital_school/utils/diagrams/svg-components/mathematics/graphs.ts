/**
 * Professional Mathematics Graph Components
 * Function graphs, transformations, statistics
 */

export interface GraphOptions {
  width?: number;
  height?: number;
  showLabel?: boolean;
  showGrid?: boolean;
  color?: string;
}

/**
 * Create linear function graph
 */
export function createLinearGraph(
  slope: number = 1,
  intercept: number = 0,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 240, showLabel = true, showGrid = true, color = '#e74c3c' } = options;

  const xRange = 5;
  const yRange = 5;
  const xScale = width / (2 * xRange);
  const yScale = height / (2 * yRange);
  const originX = width / 2;
  const originY = height / 2;

  // Calculate line endpoints
  const x1 = -xRange;
  const y1 = slope * x1 + intercept;
  const x2 = xRange;
  const y2 = slope * x2 + intercept;

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width + 40} ${height + 60}" 
         style="max-width: ${width + 40}px;" class="linear-graph-v2" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(25, 20)">
        ${showGrid ? `
          <!-- Professional Technical Grid -->
          <rect width="${width}" height="${height}" fill="url(#minorGrid)" />
          <rect width="${width}" height="${height}" fill="url(#majorGrid)" />
        ` : ''}
        
        <!-- Subtle Background Glow for Graph Area -->
        <rect width="${width}" height="${height}" fill="white" opacity="0.4" />

        <!-- Axes -->
        <g stroke="#2c3e50" stroke-width="2" stroke-linecap="round">
          <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" />
          <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" />
          <!-- Arrowheads -->
          <polygon points="${width},${originY - 4} ${width + 6},${originY} ${width},${originY + 4}" fill="#2c3e50" />
          <polygon points="${originX - 4},6 ${originX},0 ${originX + 4},6" fill="#2c3e50" />
        </g>
        
        <!-- Coordinate Ticks -->
        ${[-4, -2, 2, 4].map(v => `
          <line x1="${originX + v * xScale}" y1="${originY - 3}" x2="${originX + v * xScale}" y2="${originY + 3}" stroke="#2c3e50" stroke-width="1.5" />
          <text x="${originX + v * xScale}" y="${originY + 18}" font-size="10" font-family="Inter" text-anchor="middle" fill="#64748b">${v}</text>
          
          <line x1="${originX - 3}" y1="${originY - v * yScale}" x2="${originX + 3}" y2="${originY - v * yScale}" stroke="#2c3e50" stroke-width="1.5" />
          <text x="${originX - 12}" y="${originY - v * yScale + 4}" font-size="10" font-family="Inter" text-anchor="end" fill="#64748b">${v}</text>
        `).join('')}

        <!-- Linear Function Path with Soft Shadow -->
        <g filter="url(#soft-shadow)">
          <line x1="${originX + x1 * xScale}" y1="${originY - y1 * yScale}" 
                x2="${originX + x2 * xScale}" y2="${originY - y2 * yScale}" 
                stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
        </g>
        
        ${showLabel ? `
          <!-- Axis Meta -->
          <text x="${width + 12}" y="${originY + 15}" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">x</text>
          <text x="${originX - 15}" y="-5" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">y</text>
          
          <!-- Equation Box (Glassmorphism look) -->
          <rect x="${width - 100}" y="5" width="90" height="25" rx="4" fill="white" opacity="0.8" stroke="#e2e8f0" />
          <text x="${width - 55}" y="22" font-size="12" font-family="Inter, sans-serif" 
                fill="${color}" text-anchor="middle" font-weight="700">
            y = ${slope}x ${intercept >= 0 ? '+' : ''}${intercept}
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create exponential function graph
 */
export function createExponentialGraph(
  base: number = 2,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 240, showLabel = true, color = '#27ae60' } = options;

  const xRange = 3;
  const yRange = 8;
  const xScale = width / (2 * xRange);
  const yScale = height / yRange;
  const originX = width / 2;
  const originY = height - 25;

  // Generate high-resolution exponential curve points
  const points = Array.from({ length: 120 }, (_, i) => {
    const x = -xRange + (i / 120) * (2 * xRange);
    const y = Math.pow(base, x);
    if (y <= yRange) {
      return { x: originX + x * xScale, y: originY - y * yScale };
    }
    return null;
  }).filter(p => p !== null);

  const pathData = points.map((p, i) =>
    i === 0 ? `M ${p.x},${p.y}` : `C ${p.x},${p.y} ${p.x},${p.y} ${p.x},${p.y}` // Simple curve approximation
  ).join(' ');

  // Real path should just be L for large number of points or Q for smoothness. 
  // Let's use L with high density for precision.
  const smoothPath = points.map((p, i) => i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`).join(' ');

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width + 40} ${height + 60}" 
         style="max-width: ${width + 40}px;" class="exponential-graph-v2" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(25, 20)">
        <!-- Professional Technical Grid -->
        <rect width="${width}" height="${height}" fill="url(#minorGrid)" />
        <rect width="${width}" height="${height}" fill="url(#majorGrid)" />

        <!-- Axes -->
        <g stroke="#2c3e50" stroke-width="2" stroke-linecap="round">
          <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" />
          <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" />
          <polygon points="${width},${originY - 4} ${width + 6},${originY} ${width},${originY + 4}" fill="#2c3e50" />
          <polygon points="${originX - 4},6 ${originX},0 ${originX + 4},6" fill="#2c3e50" />
        </g>
        
        <!-- Exponential Curve with Soft Shadow -->
        <g filter="url(#soft-shadow)">
          <path d="${smoothPath}" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        </g>
        
        <!-- Horizontal Asymptote Label -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
        
        ${showLabel ? `
          <text x="${width + 12}" y="${originY + 15}" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">x</text>
          <text x="${originX - 15}" y="-5" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">y</text>
          
          <rect x="${width - 80}" y="5" width="70" height="25" rx="4" fill="white" opacity="0.8" stroke="#e2e8f0" />
          <text x="${width - 45}" y="22" font-size="12" font-family="Inter, sans-serif" 
                fill="${color}" text-anchor="middle" font-weight="700">
            y = ${base}ˣ
          </text>
          <text x="5" y="${originY - 8}" font-size="10" font-weight="600" fill="#64748b">y = 0 (Asymptote)</text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create sine/cosine function graph
 */
export function createTrigGraph(
  func: 'sin' | 'cos' = 'sin',
  amplitude: number = 1,
  options: GraphOptions = {}
): string {
  const { width = 280, height = 200, showLabel = true, color = '#8e44ad' } = options;

  const xScale = width / (4 * Math.PI);
  const yScale = (height - 60) / (2 * amplitude);
  const originX = 0;
  const originY = height / 2;

  // Generate high-resolution trig curve points
  const points = Array.from({ length: 150 }, (_, i) => {
    const x = (i / 150) * 4 * Math.PI;
    const y = func === 'sin' ? amplitude * Math.sin(x) : amplitude * Math.cos(x);
    return { x: x * xScale, y: originY - y * yScale };
  });

  const smoothPath = points.map((p, i) => i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`).join(' ');

  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width + 40} ${height + 60}" 
         style="max-width: ${width + 40}px;" class="trig-graph-v2" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(25, 20)">
        <!-- Professional Technical Grid -->
        <rect width="${width}" height="${height}" fill="url(#minorGrid)" />
        <rect width="${width}" height="${height}" fill="url(#majorGrid)" />

        <!-- Axes -->
        <g stroke="#2c3e50" stroke-width="2" stroke-linecap="round">
          <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" />
          <line x1="0" y1="0" x2="0" y2="${height}" />
          <polygon points="${width},${originY - 4} ${width + 6},${originY} ${width},${originY + 4}" fill="#2c3e50" />
          <polygon points="-4,6 0,0 4,6" fill="#2c3e50" />
        </g>
        
        <!-- Period markers & π labels -->
        ${[1, 2, 3, 4].map(n => {
    const x = (n * Math.PI / 2) * xScale;
    const label = n === 1 ? 'π/2' : n === 2 ? 'π' : n === 3 ? '3π/2' : '2π';
    return `
            <line x1="${x}" y1="${originY - 4}" x2="${x}" y2="${originY + 4}" stroke="#2c3e50" stroke-width="1.5"/>
            <text x="${x}" y="${originY + 18}" font-size="11" font-family="serif" font-style="italic" fill="#64748b" text-anchor="middle">
              ${label}
            </text>
          `;
  }).join('')}
        
        <!-- Trig path with Soft Shadow -->
        <g filter="url(#soft-shadow)">
          <path d="${smoothPath}" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        </g>
        
        ${showLabel ? `
          <text x="${width + 12}" y="${originY + 15}" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">x</text>
          <text x="12" y="-5" font-size="14" font-family="serif" font-style="italic" fill="#2c3e50">y</text>
          
          <rect x="${width - 90}" y="5" width="80" height="25" rx="4" fill="white" opacity="0.8" stroke="#e2e8f0" />
          <text x="${width - 50}" y="22" font-size="12" font-family="Inter, sans-serif" 
                fill="${color}" text-anchor="middle" font-weight="700">
            y = ${amplitude !== 1 ? amplitude : ''}${func}(x)
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create bar chart
 */
export function createBarChart(
  data: Array<{ label: string, value: number }>,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 180, showLabel = true, color = '#3498DB' } = options;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 60) / data.length;
  const chartHeight = height - 60;

  return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="bar-chart" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="40" y1="20" x2="40" y2="${height - 40}" 
            stroke="#2C3E50" stroke-width="2"/>
      <line x1="40" y1="${height - 40}" x2="${width - 20}" y2="${height - 40}" 
            stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Bars -->
      ${data.map((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = 50 + i * barWidth;
    const y = height - 40 - barHeight;

    return `
          <g>
            <rect x="${x}" y="${y}" width="${barWidth - 10}" height="${barHeight}" 
                  fill="${color}" stroke="${adjustBrightness(color, -20)}" stroke-width="2" rx="2"/>
            <text x="${x + barWidth / 2 - 5}" y="${y - 5}" font-size="10" 
                  font-family="Inter, sans-serif" fill="#2C3E50">${d.value}</text>
            <text x="${x + barWidth / 2 - 5}" y="${height - 25}" font-size="9" 
                  font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">${d.label}</text>
          </g>
        `;
  }).join('')}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Bar Chart</text>
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
/**
 * Create Parabola graph (y = ax^2 + bx + c)
 */
export function createParabola(
  a: number = 0.1,
  b: number = 0,
  c: number = 0,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 240, showLabel = true, color = '#E67E22' } = options;

  const xRange = 10;
  const yRange = 10;
  const xScale = width / (2 * xRange);
  const yScale = height / (2 * yRange);
  const originX = width / 2;
  const originY = height / 2;

  // Generate parabola points
  const points = Array.from({ length: 100 }, (_, i) => {
    const x = -xRange + (i / 100) * (2 * xRange);
    const y = a * x * x + b * x + c;
    // Clamp for rendering sanity
    if (Math.abs(y) <= yRange) {
      return { x: originX + x * xScale, y: originY - y * yScale };
    }
    return null;
  }).filter(p => p !== null);

  // Split paths if there are gaps (though parabola shouldn't have gaps in range unless clamped out)
  const pathData = points.map((p, i) =>
    i === 0 || (points[i - 1] === null) ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
  ).join(' ');

  return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="parabola-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Curve -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create Hyperbola graph (x^2/a^2 - y^2/b^2 = 1)
 */
export function createHyperbola(
  a: number = 2,
  b: number = 2,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 240, showLabel = true, color = '#8E44AD' } = options;

  const xRange = 10;
  const yRange = 10;
  const xScale = width / (2 * xRange);
  const yScale = height / (2 * yRange);
  const originX = width / 2;
  const originY = height / 2;

  // Hyperbola has two branches: x = ± a * cosh(t) or similar, but simplified: y = ± b/a * sqrt(x^2 - a^2)
  // Valid for |x| >= a

  const generateBranch = (sign: number) => {
    const points = [];
    for (let i = 0; i < 50; i++) {
      // x goes from a to xRange (or -xRange to -a)
      const xVal = a + i * (xRange - a) / 50;
      const x = sign * xVal;
      const yTerm = Math.sqrt((x * x) / (a * a) - 1);
      const y1 = b * yTerm;
      const y2 = -b * yTerm;

      if (Math.abs(y1) <= yRange) {
        points.push({ x: originX + x * xScale, y: originY - y1 * yScale });
        points.push({ x: originX + x * xScale, y: originY - y2 * yScale });
      }
    }
    return points; // This logic needs to build coherent paths, simpler to just iterate x over range
  };

  // Better approach: Iterate x from -Range to Range. Calculate y if possible.
  // Connect points only if close to each other to avoid jumping asymptotes
  const points: any[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = -xRange + (i / 100) * (2 * xRange);
    if (x * x / (a * a) - 1 >= 0) {
      const y = Math.sqrt((x * x / (a * a) - 1) * b * b);
      // Positive branch
      if (y <= yRange) points.push({ x: originX + x * xScale, y: originY - y * yScale, flow: x < 0 ? 'left' : 'right' });
      // Negative branch
      if (-y >= -yRange) points.push({ x: originX + x * xScale, y: originY + y * yScale, flow: x < 0 ? 'left' : 'right' });
    } else {
      points.push(null); // Gap
    }
  }

  // Actually drawing hyperbola is simpler with parametric: x = a sec(t), y = b tan(t)
  // t from -pi/2 to pi/2 (right branch), pi/2 to 3pi/2 (left branch)

  const plotParametric = (tOffset: number) => {
    return Array.from({ length: 40 }, (_, i) => {
      const t = -1.3 + (i / 40) * 2.6 + tOffset; // Avoid pi/2 asymptote
      const x = a / Math.cos(t);
      const y = b * Math.tan(t);
      if (Math.abs(x) <= xRange && Math.abs(y) <= yRange) {
        return { x: originX + x * xScale, y: originY - y * yScale };
      }
      return null;
    }).filter(p => p !== null).map((p, i) => i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`).join(' ');
  };

  const rightBranch = plotParametric(0);
  const leftBranch = plotParametric(Math.PI);

  return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="hyperbola-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Asymptotes -->
        <line x1="0" y1="${originY + (originX * b / a * yScale / xScale)}" 
              x2="${width}" y2="${originY - ((width - originX) * b / a * yScale / xScale)}" 
              stroke="#BDC3C7" stroke-dasharray="4,4"/>
        <line x1="0" y1="${originY - (originX * b / a * yScale / xScale)}" 
              x2="${width}" y2="${originY + ((width - originX) * b / a * yScale / xScale)}" 
              stroke="#BDC3C7" stroke-dasharray="4,4"/>

        <!-- Curves -->
        <path d="${rightBranch}" stroke="${color}" stroke-width="3" fill="none"/>
        <path d="${leftBranch}" stroke="${color}" stroke-width="3" fill="none"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            x²/(${a}²) - y²/(${b}²) = 1
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create Ellipse Graph
 */
export function createEllipse(
  a: number = 3, b: number = 2,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 160, showLabel = true, color = '#27AE60' } = options;

  const xScale = width / 10;
  const yScale = height / 10;
  const originX = width / 2;
  const originY = height / 2;

  return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="ellipse-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Curve -->
        <ellipse cx="${originX}" cy="${originY}" rx="${a * xScale}" ry="${b * yScale}" 
                 stroke="${color}" stroke-width="3" fill="none"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            x²/(${a}²) + y²/(${b}²) = 1
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create Cubic Function Graph
 */
export function createCubic(
  a: number = 0.5, b: number = 0, c: number = 0, d: number = 0,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 160, showLabel = true, color = '#E67E22' } = options;

  const xRange = 5;
  const yRange = 5;
  const xScale = width / (2 * xRange);
  const yScale = height / (2 * yRange);
  const originX = width / 2;
  const originY = height / 2;

  const points = Array.from({ length: 100 }, (_, i) => {
    const x = -xRange + (i / 100) * (2 * xRange);
    const y = a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
    if (Math.abs(y) <= yRange) {
      return { x: originX + x * xScale, y: originY - y * yScale };
    }
    return null;
  }).filter(p => p !== null);

  const pathData = points.map((p, i) =>
    i === 0 || (points[i - 1] === null) ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
  ).join(' ');

  return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="cubic-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Curve -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${a}x³ + ...
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create Reciprocal Function Graph
 */
export function createReciprocal(
  a: number = 1,
  options: GraphOptions = {}
): string {
  const { width = 240, height = 160, showLabel = true, color = '#8E44AD' } = options;

  const xRange = 5;
  const yRange = 5;
  const xScale = width / (2 * xRange);
  const yScale = height / (2 * yRange);
  const originX = width / 2;
  const originY = height / 2;

  const plotSide = (sign: number) => {
    return Array.from({ length: 50 }, (_, i) => {
      const x = sign * (0.1 + (i / 50) * xRange);
      const y = a / x;
      if (Math.abs(y) <= yRange) {
        return { x: originX + x * xScale, y: originY - y * yScale };
      }
      return null;
    }).filter(p => p !== null).map((p, i) => i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`).join(' ');
  };

  const rightBranch = plotSide(1);
  const leftBranch = plotSide(-1);

  return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="reciprocal-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Curves -->
        <path d="${rightBranch}" stroke="${color}" stroke-width="3" fill="none"/>
        <path d="${leftBranch}" stroke="${color}" stroke-width="3" fill="none"/>
        
        ${showLabel ? `
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${a}/x
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}
