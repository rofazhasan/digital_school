/**
 * Professional Mathematics Statistics Components
 * Distributions, box plots, scatter plots, histograms
 */

export interface StatisticsOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create normal distribution curve
 */
export function createNormalDistribution(
    mean: number = 0,
    stdDev: number = 1,
    options: StatisticsOptions = {}
): string {
    const { width = 220, height = 160, showLabel = true, color = '#3498DB' } = options;

    const xScale = width / 8;
    const yScale = (height - 60) / 0.4;
    const originX = width / 2;
    const originY = height - 30;

    // Generate normal distribution curve
    const points = Array.from({ length: 100 }, (_, i) => {
        const x = -4 + (i / 100) * 8;
        const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        return { x: originX + x * xScale, y: originY - y * yScale };
    });

    const pathData = points.map((p, i) =>
        i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ');

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="normal-distribution" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(10, 10)">
        <!-- Axes -->
        <line x1="0" y1="${originY}" x2="${width}" y2="${originY}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="${originX}" y1="0" x2="${originX}" y2="${height}" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Normal curve -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none"/>
        
        <!-- Fill under curve (68-95-99.7 rule) -->
        <!-- 1 std dev (68%) -->
        ${(() => {
            const filtered = points.filter(p =>
                Math.abs((p.x - originX) / xScale) <= stdDev
            );
            const fillPath = filtered.map((p, i) =>
                i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
            ).join(' ') + ` L ${filtered[filtered.length - 1].x},${originY} L ${filtered[0].x},${originY} Z`;
            return `<path d="${fillPath}" fill="${color}" opacity="0.2"/>`;
        })()}
        
        <!-- Mean line -->
        <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${originY - 0.4 * yScale}" 
              stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
        
        <!-- Standard deviation markers -->
        ${[-2, -1, 1, 2].map(sd => {
            const x = originX + sd * stdDev * xScale;
            return `
            <line x1="${x}" y1="${originY - 3}" x2="${x}" y2="${originY + 3}" 
                  stroke="#7F8C8D" stroke-width="1.5"/>
            <text x="${x}" y="${originY + 15}" font-size="9" fill="#7F8C8D" text-anchor="middle">
              ${sd > 0 ? '+' : ''}${sd}σ
            </text>
          `;
        }).join('')}
        
        ${showLabel ? `
          <text x="${originX}" y="${originY + 30}" font-size="10" fill="#E74C3C" text-anchor="middle">
            μ = ${mean}
          </text>
          <text x="${width / 2}" y="${height + 25}" font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            Normal Distribution (σ = ${stdDev})
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create box plot
 */
export function createBoxPlot(
    data: { min: number, q1: number, median: number, q3: number, max: number },
    options: StatisticsOptions = {}
): string {
    const { width = 180, height = 120, showLabel = true, color = '#27AE60' } = options;

    const { min, q1, median, q3, max } = data;
    const range = max - min;
    const scale = (width - 60) / range;

    const xMin = 30 + (min - min) * scale;
    const xQ1 = 30 + (q1 - min) * scale;
    const xMedian = 30 + (median - min) * scale;
    const xQ3 = 30 + (q3 - min) * scale;
    const xMax = 30 + (max - min) * scale;

    const boxY = height / 2 - 20;
    const boxHeight = 40;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="box-plot" xmlns="http://www.w3.org/2000/svg">
      <!-- Whiskers -->
      <line x1="${xMin}" y1="${height / 2}" x2="${xQ1}" y2="${height / 2}" 
            stroke="${color}" stroke-width="2"/>
      <line x1="${xQ3}" y1="${height / 2}" x2="${xMax}" y2="${height / 2}" 
            stroke="${color}" stroke-width="2"/>
      
      <!-- Min and Max lines -->
      <line x1="${xMin}" y1="${boxY + 10}" x2="${xMin}" y2="${boxY + boxHeight - 10}" 
            stroke="${color}" stroke-width="2"/>
      <line x1="${xMax}" y1="${boxY + 10}" x2="${xMax}" y2="${boxY + boxHeight - 10}" 
            stroke="${color}" stroke-width="2"/>
      
      <!-- Box (IQR) -->
      <rect x="${xQ1}" y="${boxY}" width="${xQ3 - xQ1}" height="${boxHeight}" 
            fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2.5"/>
      
      <!-- Median line -->
      <line x1="${xMedian}" y1="${boxY}" x2="${xMedian}" y2="${boxY + boxHeight}" 
            stroke="#E74C3C" stroke-width="3"/>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="${xMin}" y="${height - 10}" font-size="8" fill="#7F8C8D" text-anchor="middle">
          ${min}
        </text>
        <text x="${xQ1}" y="${height - 10}" font-size="8" fill="#7F8C8D" text-anchor="middle">
          Q1: ${q1}
        </text>
        <text x="${xMedian}" y="${boxY - 5}" font-size="9" fill="#E74C3C" text-anchor="middle">
          M: ${median}
        </text>
        <text x="${xQ3}" y="${height - 10}" font-size="8" fill="#7F8C8D" text-anchor="middle">
          Q3: ${q3}
        </text>
        <text x="${xMax}" y="${height - 10}" font-size="8" fill="#7F8C8D" text-anchor="middle">
          ${max}
        </text>
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Box Plot
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create scatter plot
 */
export function createScatterPlot(
    points: Array<{ x: number, y: number }>,
    options: StatisticsOptions = {}
): string {
    const { width = 200, height = 180, showLabel = true, color = '#9B59B6' } = options;

    const xMax = Math.max(...points.map(p => p.x));
    const yMax = Math.max(...points.map(p => p.y));
    const xScale = (width - 60) / xMax;
    const yScale = (height - 60) / yMax;

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="scatter-plot" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(10, 10)">
        <!-- Axes -->
        <line x1="40" y1="20" x2="40" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="40" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Grid -->
        ${Array.from({ length: 5 }, (_, i) => {
        const y = 20 + (i * (height - 40) / 4);
        return `<line x1="40" y1="${y}" x2="${width}" y2="${y}" 
                        stroke="#ECF0F1" stroke-width="0.5"/>`;
    }).join('')}
        
        <!-- Data points -->
        ${points.map(p => {
        const x = 40 + p.x * xScale;
        const y = height - 20 - p.y * yScale;
        return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" opacity="0.7"/>`;
    }).join('')}
        
        <!-- Best fit line (simple linear regression) -->
        ${(() => {
            const n = points.length;
            const sumX = points.reduce((sum, p) => sum + p.x, 0);
            const sumY = points.reduce((sum, p) => sum + p.y, 0);
            const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
            const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            const x1 = 0;
            const y1 = slope * x1 + intercept;
            const x2 = xMax;
            const y2 = slope * x2 + intercept;

            return `<line x1="${40 + x1 * xScale}" y1="${height - 20 - y1 * yScale}" 
                        x2="${40 + x2 * xScale}" y2="${height - 20 - y2 * yScale}" 
                        stroke="#E74C3C" stroke-width="2" stroke-dasharray="5,5"/>`;
        })()}
        
        ${showLabel ? `
          <text x="${width - 5}" y="${height - 5}" font-size="12" font-style="italic" fill="#2C3E50">x</text>
          <text x="25" y="25" font-size="12" font-style="italic" fill="#2C3E50">y</text>
          <text x="${width / 2}" y="${height + 25}" font-size="11" font-family="Inter, sans-serif" 
                fill="#2C3E50" text-anchor="middle">
            Scatter Plot with Trend Line
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create histogram
 */
export function createHistogram(
    bins: Array<{ start: number, end: number, count: number }>,
    options: StatisticsOptions = {}
): string {
    const { width = 220, height = 180, showLabel = true, color = '#F39C12' } = options;

    const maxCount = Math.max(...bins.map(b => b.count));
    const binWidth = (width - 60) / bins.length;
    const heightScale = (height - 60) / maxCount;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="histogram" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="40" y1="20" x2="40" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2"/>
      <line x1="40" y1="${height - 20}" x2="${width - 10}" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Bins -->
      ${bins.map((bin, i) => {
        const x = 40 + i * binWidth;
        const barHeight = bin.count * heightScale;
        const y = height - 20 - barHeight;

        return `
          <g>
            <rect x="${x + 1}" y="${y}" width="${binWidth - 2}" height="${barHeight}" 
                  fill="${color}" stroke="${adjustBrightness(color, -20)}" stroke-width="1.5"/>
            <text x="${x + binWidth / 2}" y="${y - 3}" font-size="9" 
                  font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
              ${bin.count}
            </text>
            <text x="${x + binWidth / 2}" y="${height - 5}" font-size="8" 
                  font-family="Inter, sans-serif" fill="#7F8C8D" text-anchor="middle">
              ${bin.start}-${bin.end}
            </text>
          </g>
        `;
    }).join('')}
      
      ${showLabel ? `
        <text x="25" y="25" font-size="12" font-style="italic" fill="#2C3E50">f</text>
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Histogram
        </text>
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
