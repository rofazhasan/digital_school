/**
 * Advanced Physiology Components
 * Nephron function, hormone regulation, muscle contraction
 */

export interface PhysiologyAdvancedOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create nephron function diagram
 */
export function createNephronFunction(options: PhysiologyAdvancedOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="nephron-function" xmlns="http://www.w3.org/2000/svg">
      <!-- Glomerulus -->
      <g id="glomerulus">
        <circle cx="60" cy="50" r="15" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2"/>
        <text x="60" y="35" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Glomerulus</text>
        <text x="60" y="75" font-size="8" fill="#7F8C8D" text-anchor="middle">Filtration</text>
      </g>
      
      <!-- Bowman's capsule -->
      <circle cx="60" cy="50" r="22" fill="none" stroke="#3498DB" stroke-width="2"/>
      
      <!-- Proximal tubule -->
      <path d="M 82,50 L 100,50 Q 110,50 110,60 L 110,90" 
            stroke="#27AE60" stroke-width="3" fill="none"/>
      <text x="120" y="70" font-size="8" fill="#27AE60">Proximal tubule</text>
      <text x="120" y="80" font-size="7" fill="#7F8C8D">Reabsorption</text>
      
      <!-- Loop of Henle -->
      <path d="M 110,90 L 110,120 L 90,120 L 90,100" 
            stroke="#9B59B6" stroke-width="3" fill="none"/>
      <text x="100" y="135" font-size="8" fill="#9B59B6" text-anchor="middle">Loop of Henle</text>
      <text x="100" y="145" font-size="7" fill="#7F8C8D" text-anchor="middle">Concentration</text>
      
      <!-- Distal tubule -->
      <path d="M 90,100 L 90,80 L 70,80" 
            stroke="#F39C12" stroke-width="3" fill="none"/>
      <text x="80" y="95" font-size="8" fill="#F39C12">Distal</text>
      
      <!-- Collecting duct -->
      <line x1="70" y1="80" x2="70" y2="120" stroke="#E74C3C" stroke-width="3"/>
      <text x="55" y="100" font-size="8" fill="#E74C3C">Collecting</text>
      <text x="55" y="110" font-size="8" fill="#E74C3C">duct</text>
      
      <!-- Urine output -->
      <line x1="70" y1="120" x2="70" y2="140" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrow-nephron)"/>
      <text x="70" y="155" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Urine</text>
      
      <defs>
        <marker id="arrow-nephron" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#2C3E50"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Nephron Function
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create hormone regulation diagram
 */
export function createHormoneRegulation(options: PhysiologyAdvancedOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="hormone-regulation" xmlns="http://www.w3.org/2000/svg">
      <!-- Negative feedback loop -->
      <g id="feedback-loop">
        <!-- Hypothalamus -->
        <rect x="100" y="30" width="40" height="20" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="120" y="43" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Hypothalamus</text>
        
        <!-- Arrow down -->
        <line x1="120" y1="50" x2="120" y2="65" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-hormone)"/>
        
        <!-- Pituitary -->
        <rect x="100" y="70" width="40" height="20" fill="#9B59B6" opacity="0.3" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="120" y="83" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Pituitary</text>
        
        <!-- Arrow down -->
        <line x1="120" y1="90" x2="120" y2="105" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-hormone)"/>
        
        <!-- Target gland -->
        <rect x="100" y="110" width="40" height="20" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="120" y="123" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">Target Gland</text>
        
        <!-- Negative feedback arrow -->
        <path d="M 100,120 Q 60,80 60,40 L 100,40" 
              stroke="#E74C3C" stroke-width="2" fill="none" marker-end="url(#arrow-hormone)" stroke-dasharray="5,3"/>
        <text x="50" y="80" font-size="9" fill="#E74C3C" font-weight="600">−</text>
        <text x="40" y="95" font-size="8" fill="#E74C3C">Negative</text>
        <text x="40" y="105" font-size="8" fill="#E74C3C">feedback</text>
      </g>
      
      <!-- Example: Insulin -->
      <g id="example">
        <text x="180" y="60" font-size="9" fill="#7F8C8D">Example:</text>
        <text x="180" y="75" font-size="9" fill="#E74C3C">High glucose</text>
        <text x="180" y="90" font-size="9" fill="#27AE60">→ Insulin ↑</text>
        <text x="180" y="105" font-size="9" fill="#3498DB">→ Glucose ↓</text>
      </g>
      
      <defs>
        <marker id="arrow-hormone" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Hormone Regulation (Negative Feedback)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create muscle contraction diagram
 */
export function createMuscleContraction(options: PhysiologyAdvancedOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="muscle-contraction" xmlns="http://www.w3.org/2000/svg">
      <!-- Relaxed state -->
      <g id="relaxed">
        <text x="60" y="30" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Relaxed</text>
        
        <!-- Actin (thin filament) -->
        <line x1="20" y1="50" x2="100" y2="50" stroke="#E74C3C" stroke-width="3"/>
        <text x="60" y="45" font-size="8" fill="#E74C3C" text-anchor="middle">Actin</text>
        
        <!-- Myosin (thick filament) -->
        <line x1="40" y1="65" x2="80" y2="65" stroke="#27AE60" stroke-width="4"/>
        ${[0, 1, 2].map(i => `
          <line x1="${50 + i * 10}" y1="65" x2="${48 + i * 10}" y2="58" stroke="#27AE60" stroke-width="2"/>
        `).join('')}
        <text x="60" y="80" font-size="8" fill="#27AE60" text-anchor="middle">Myosin</text>
      </g>
      
      <!-- Contracted state -->
      <g id="contracted">
        <text x="180" y="30" font-size="10" fill="#9B59B6" text-anchor="middle" font-weight="600">Contracted</text>
        
        <!-- Actin (overlapping) -->
        <line x1="140" y1="50" x2="180" y2="50" stroke="#E74C3C" stroke-width="3"/>
        <line x1="180" y1="50" x2="220" y2="50" stroke="#E74C3C" stroke-width="3"/>
        
        <!-- Myosin (thick filament) -->
        <line x1="160" y1="65" x2="200" y2="65" stroke="#27AE60" stroke-width="4"/>
        ${[0, 1, 2].map(i => `
          <line x1="${170 + i * 10}" y1="65" x2="${165 + i * 10}" y2="55" stroke="#27AE60" stroke-width="2"/>
        `).join('')}
      </g>
      
      <!-- Arrow showing contraction -->
      <line x1="110" y1="60" x2="130" y2="60" stroke="#F39C12" stroke-width="2" marker-end="url(#arrow-muscle)"/>
      <text x="120" y="75" font-size="8" fill="#F39C12" text-anchor="middle">ATP</text>
      
      <!-- Sliding filament -->
      <text x="120" y="110" font-size="9" fill="#2C3E50" text-anchor="middle" font-weight="600">
        Sliding Filament Theory
      </text>
      <text x="120" y="125" font-size="8" fill="#7F8C8D" text-anchor="middle">
        Actin slides over myosin
      </text>
      
      <defs>
        <marker id="arrow-muscle" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#F39C12"/>
        </marker>
      </defs>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Muscle Contraction (Sliding Filament)
        </text>
      ` : ''}
    </svg>
  `;
}
