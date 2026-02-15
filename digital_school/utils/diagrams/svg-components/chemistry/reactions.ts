/**
 * Professional Chemistry Reaction Diagrams
 * Energy diagrams, equilibrium, titration curves
 */

export interface ReactionOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
    color?: string;
}

/**
 * Create energy diagram for reactions
 */
export function createEnergyDiagram(
    type: 'exothermic' | 'endothermic' = 'exothermic',
    options: ReactionOptions = {}
): string {
    const { width = 220, height = 180, showLabel = true } = options;

    const isExo = type === 'exothermic';
    const reactantY = isExo ? 60 : 100;
    const productY = isExo ? 120 : 50;
    const peakY = 40;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="energy-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="energyArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <!-- Axes -->
      <line x1="40" y1="20" x2="40" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#energyArrow)"/>
      <line x1="40" y1="${height - 20}" x2="${width - 20}" y2="${height - 20}" 
            stroke="#2C3E50" stroke-width="2" marker-end="url(#energyArrow)"/>
      
      <!-- Reactants level -->
      <line x1="50" y1="${reactantY}" x2="80" y2="${reactantY}" 
            stroke="#3498DB" stroke-width="3"/>
      <text x="65" y="${reactantY - 5}" font-size="11" font-family="Inter, sans-serif" 
            fill="#3498DB" text-anchor="middle">Reactants</text>
      
      <!-- Products level -->
      <line x1="140" y1="${productY}" x2="170" y2="${productY}" 
            stroke="#27AE60" stroke-width="3"/>
      <text x="155" y="${productY - 5}" font-size="11" font-family="Inter, sans-serif" 
            fill="#27AE60" text-anchor="middle">Products</text>
      
      <!-- Reaction pathway (curve) -->
      <path d="M 80,${reactantY} Q 110,${peakY} 140,${productY}" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      
      <!-- Activation energy arrow -->
      <line x1="90" y1="${reactantY}" x2="90" y2="${peakY + 5}" 
            stroke="#F39C12" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="95" y="${(reactantY + peakY) / 2}" font-size="10" 
            font-family="Inter, sans-serif" fill="#F39C12">Eₐ</text>
      
      <!-- Energy change arrow -->
      <line x1="${width - 35}" y1="${reactantY}" x2="${width - 35}" y2="${productY}" 
            stroke="${isExo ? '#E74C3C' : '#3498DB'}" stroke-width="2.5" 
            marker-end="url(#energyArrow)"/>
      <text x="${width - 30}" y="${(reactantY + productY) / 2}" font-size="10" 
            font-family="Inter, sans-serif" fill="${isExo ? '#E74C3C' : '#3498DB'}">
        ΔH ${isExo ? '<' : '>'} 0
      </text>
      
      ${showLabel ? `
        <!-- Axis labels -->
        <text x="25" y="25" font-size="12" font-family="Inter, sans-serif" 
              font-style="italic" fill="#2C3E50">E</text>
        <text x="${width - 15}" y="${height - 5}" font-size="12" 
              font-family="Inter, sans-serif" font-style="italic" fill="#2C3E50">
          Reaction Progress
        </text>
        <text x="${width / 2}" y="${height + 20}" font-size="11" 
              font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
          ${type === 'exothermic' ? 'Exothermic' : 'Endothermic'} Reaction
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create equilibrium graph
 */
export function createEquilibrium(options: ReactionOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="equilibrium-graph" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="eqArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <g transform="translate(10, 10)">
        <!-- Axes -->
        <line x1="40" y1="20" x2="40" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2"/>
        <line x1="40" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2" marker-end="url(#eqArrow)"/>
        
        <!-- Reactants curve (decreasing) -->
        <path d="M 45,40 Q 80,50 120,70 Q 160,85 ${width - 10},90" 
              stroke="#3498DB" stroke-width="3" fill="none"/>
        <text x="60" y="35" font-size="10" fill="#3498DB">[Reactants]</text>
        
        <!-- Products curve (increasing) -->
        <path d="M 45,${height - 30} Q 80,${height - 40} 120,${height - 55} Q 160,${height - 65} ${width - 10},${height - 70}" 
              stroke="#27AE60" stroke-width="3" fill="none"/>
        <text x="60" y="${height - 25}" font-size="10" fill="#27AE60">[Products]</text>
        
        <!-- Equilibrium line (vertical dashed) -->
        <line x1="120" y1="20" x2="120" y2="${height - 20}" 
              stroke="#E74C3C" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="125" y="30" font-size="10" fill="#E74C3C">Equilibrium</text>
        
        ${showLabel ? `
          <text x="25" y="25" font-size="12" font-style="italic" fill="#2C3E50">[ ]</text>
          <text x="${width - 10}" y="${height - 5}" font-size="12" 
                font-style="italic" fill="#2C3E50">Time</text>
          <text x="${width / 2}" y="${height + 25}" font-size="11" 
                font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
            Chemical Equilibrium
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create titration curve
 */
export function createTitrationCurve(options: ReactionOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    // S-shaped titration curve
    const points = Array.from({ length: 50 }, (_, i) => {
        const x = i / 50;
        // Sigmoid function for pH curve
        const y = 1 / (1 + Math.exp(-12 * (x - 0.5)));
        return { x: 40 + x * (width - 60), y: height - 30 - y * (height - 60) };
    });

    const pathData = points.map((p, i) =>
        i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ');

    return `
    <svg width="${width + 20}" height="${height + 40}" viewBox="0 0 ${width + 20} ${height + 40}" 
         class="titration-curve" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="titArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      <g transform="translate(10, 10)">
        <!-- Axes -->
        <line x1="40" y1="20" x2="40" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2" marker-end="url(#titArrow)"/>
        <line x1="40" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
              stroke="#2C3E50" stroke-width="2" marker-end="url(#titArrow)"/>
        
        <!-- Titration curve -->
        <path d="${pathData}" stroke="#9B59B6" stroke-width="3" fill="none"/>
        
        <!-- Equivalence point -->
        <circle cx="${40 + (width - 60) / 2}" cy="${height / 2}" r="4" fill="#E74C3C"/>
        <line x1="${40 + (width - 60) / 2}" y1="${height / 2}" 
              x2="${40 + (width - 60) / 2}" y2="${height - 20}" 
              stroke="#E74C3C" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="${40 + (width - 60) / 2 + 5}" y="${height / 2 - 5}" 
              font-size="9" fill="#E74C3C">Equivalence Point</text>
        
        <!-- pH levels -->
        ${[0, 7, 14].map(pH => {
        const y = height - 30 - (pH / 14) * (height - 60);
        return `
            <line x1="35" y1="${y}" x2="40" y2="${y}" stroke="#7F8C8D" stroke-width="1.5"/>
            <text x="30" y="${y + 4}" font-size="9" fill="#7F8C8D" text-anchor="end">${pH}</text>
          `;
    }).join('')}
        
        ${showLabel ? `
          <text x="25" y="15" font-size="12" font-style="italic" fill="#2C3E50">pH</text>
          <text x="${width - 5}" y="${height - 5}" font-size="11" 
                font-family="Inter, sans-serif" fill="#2C3E50">
            Volume Added
          </text>
          <text x="${width / 2}" y="${height + 25}" font-size="11" 
                font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
            Acid-Base Titration
          </text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Create Le Chatelier's principle diagram
 */
export function createLeChatelier(
    stress: 'concentration' | 'temperature' | 'pressure' = 'concentration',
    options: ReactionOptions = {}
): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="le-chatelier" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="shiftArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Equilibrium equation -->
      <text x="${width / 2}" y="30" font-size="13" font-family="Inter, sans-serif" 
            fill="#2C3E50" text-anchor="middle" font-weight="600">
        A + B ⇌ C + D
      </text>
      
      <!-- Initial state -->
      <rect x="30" y="50" width="60" height="40" fill="#ECF0F1" 
            stroke="#2C3E50" stroke-width="2" rx="3"/>
      <text x="60" y="75" font-size="11" font-family="Inter, sans-serif" 
            fill="#2C3E50" text-anchor="middle">Initial</text>
      
      <!-- Stress applied -->
      <rect x="110" y="50" width="60" height="40" fill="#F39C12" opacity="0.3" 
            stroke="#F39C12" stroke-width="2" rx="3"/>
      <text x="140" y="68" font-size="10" font-family="Inter, sans-serif" 
            fill="#2C3E50" text-anchor="middle">Stress:</text>
      <text x="140" y="82" font-size="9" font-family="Inter, sans-serif" 
            fill="#2C3E50" text-anchor="middle">
        ${stress === 'concentration' ? '↑[A]' : stress === 'temperature' ? '↑T' : '↑P'}
      </text>
      
      <!-- Shift arrow -->
      <line x1="90" y1="105" x2="110" y2="105" 
            stroke="#E74C3C" stroke-width="3" marker-end="url(#shiftArrow)"/>
      <text x="100" y="125" font-size="10" font-family="Inter, sans-serif" 
            fill="#E74C3C" text-anchor="middle">
        Shift →
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" 
              font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">
          Le Chatelier's Principle
        </text>
      ` : ''}
    </svg>
  `;
}
