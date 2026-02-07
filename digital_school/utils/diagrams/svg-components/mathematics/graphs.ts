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
    const { width = 200, height = 200, showLabel = true, showGrid = true, color = '#E74C3C' } = options;

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
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="linear-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        ${showGrid ? `
          <!-- Grid -->
          ${Array.from({ length: 11 }, (_, i) => {
        const x = i * xScale * 2;
        return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" 
                          stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
          ${Array.from({ length: 11 }, (_, i) => {
        const y = i * yScale * 2;
        return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" 
                          stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
        ` : ''}
        
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Linear function -->
        <line x1="${originX + x1 * xScale}" y1="${originY - y1 * yScale}" 
              x2="${originX + x2 * xScale}" y2="${originY - y2 * yScale}" 
              stroke="${color}" stroke-width="3"/>
        
        ${showLabel ? `
          <!-- Axis labels -->
          <text x="${width - 5}" y="${originY + 15}" font-size="12" font-style="italic" fill="#2C3E50">x</text>
          <text x="${originX - 15}" y="10" font-size="12" font-style="italic" fill="#2C3E50">y</text>
          
          <!-- Function equation -->
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${slope}x${intercept >= 0 ? '+' + intercept : intercept}
          </text>
          
          <!-- Slope indicator -->
          <text x="${width / 2 + 30}" y="${height / 2 - 20}" font-size="10" fill="${color}">
            m = ${slope}
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
    const { width = 200, height = 200, showLabel = true, color = '#27AE60' } = options;

    const xRange = 3;
    const yRange = 8;
    const xScale = width / (2 * xRange);
    const yScale = height / yRange;
    const originX = width / 2;
    const originY = height - 20;

    // Generate exponential curve points
    const points = Array.from({ length: 60 }, (_, i) => {
        const x = -xRange + (i / 60) * (2 * xRange);
        const y = Math.pow(base, x);
        if (y <= yRange) {
            return { x: originX + x * xScale, y: originY - y * yScale };
        }
        return null;
    }).filter(p => p !== null);

    const pathData = points.map((p, i) =>
        i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ');

    return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="exponential-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Exponential curve -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none"/>
        
        <!-- Horizontal asymptote -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#95A5A6" stroke-width="1" stroke-dasharray="3,3"/>
        
        ${showLabel ? `
          <text x="${width - 5}" y="${originY + 15}" font-size="12" font-style="italic" fill="#2C3E50">x</text>
          <text x="${originX - 15}" y="10" font-size="12" font-style="italic" fill="#2C3E50">y</text>
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            y = ${base}ˣ
          </text>
          <text x="10" y="${originY - 5}" font-size="9" fill="#95A5A6">y = 0 (asymptote)</text>
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
    const { width = 240, height = 160, showLabel = true, color = '#9B59B6' } = options;

    const xScale = width / (4 * Math.PI);
    const yScale = (height - 40) / (2 * amplitude);
    const originY = height / 2;

    // Generate trig curve points
    const points = Array.from({ length: 100 }, (_, i) => {
        const x = (i / 100) * 4 * Math.PI;
        const y = func === 'sin' ? amplitude * Math.sin(x) : amplitude * Math.cos(x);
        return { x: x * xScale, y: originY - y * yScale };
    });

    const pathData = points.map((p, i) =>
        i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ');

    return `
    <svg width="${width + 40}" height="${height + 60}" viewBox="0 0 ${width + 40} ${height + 60}" 
         class="trig-graph" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="${height}" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Trig curve -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none"/>
        
        <!-- Period markers -->
        ${[1, 2, 3, 4].map(n => {
        const x = (n * Math.PI / 2) * xScale;
        return `
            <line x1="${x}" y1="${originY - 3}" x2="${x}" y2="${originY + 3}" 
                  stroke="#2C3E50" stroke-width="1.5"/>
            <text x="${x}" y="${originY + 15}" font-size="9" fill="#7F8C8D" text-anchor="middle">
              ${n === 1 ? 'π/2' : n === 2 ? 'π' : n === 3 ? '3π/2' : '2π'}
            </text>
          `;
    }).join('')}
        
        ${showLabel ? `
          <text x="${width - 5}" y="${originY + 15}" font-size="12" font-style="italic" fill="#2C3E50">x</text>
          <text x="5" y="10" font-size="12" font-style="italic" fill="#2C3E50">y</text>
          <text x="${width / 2}" y="${height + 35}" font-size="13" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
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
