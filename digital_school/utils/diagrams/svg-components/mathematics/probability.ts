/**
 * Professional Probability Components
 * Probability trees and Venn diagrams
 */

export interface ProbabilityOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create probability tree diagram
 */
export function createProbabilityTree(options: ProbabilityOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="probability-tree" xmlns="http://www.w3.org/2000/svg">
      <!-- Start point -->
      <circle cx="40" cy="90" r="5" fill="#2C3E50"/>
      <text x="30" y="95" font-size="9" fill="#2C3E50" text-anchor="end">Start</text>
      
      <!-- First level branches -->
      <line x1="45" y1="90" x2="90" y2="50" stroke="#E74C3C" stroke-width="2"/>
      <text x="70" y="65" font-size="9" fill="#E74C3C">0.6</text>
      <circle cx="90" cy="50" r="4" fill="#E74C3C"/>
      <text x="95" y="45" font-size="9" fill="#E74C3C">A</text>
      
      <line x1="45" y1="90" x2="90" y2="130" stroke="#3498DB" stroke-width="2"/>
      <text x="70" y="115" font-size="9" fill="#3498DB">0.4</text>
      <circle cx="90" cy="130" r="4" fill="#3498DB"/>
      <text x="95" y="135" font-size="9" fill="#3498DB">A'</text>
      
      <!-- Second level branches (from A) -->
      <line x1="94" y1="50" x2="140" y2="35" stroke="#27AE60" stroke-width="2"/>
      <text x="120" y="40" font-size="8" fill="#27AE60">0.7</text>
      <circle cx="140" cy="35" r="4" fill="#27AE60"/>
      <text x="145" y="35" font-size="9" fill="#27AE60">B</text>
      <text x="175" y="35" font-size="8" fill="#7F8C8D">P=0.42</text>
      
      <line x1="94" y1="50" x2="140" y2="65" stroke="#F39C12" stroke-width="2"/>
      <text x="120" y="62" font-size="8" fill="#F39C12">0.3</text>
      <circle cx="140" cy="65" r="4" fill="#F39C12"/>
      <text x="145" y="65" font-size="9" fill="#F39C12">B'</text>
      <text x="175" y="65" font-size="8" fill="#7F8C8D">P=0.18</text>
      
      <!-- Second level branches (from A') -->
      <line x1="94" y1="130" x2="140" y2="115" stroke="#27AE60" stroke-width="2"/>
      <text x="120" y="120" font-size="8" fill="#27AE60">0.5</text>
      <circle cx="140" cy="115" r="4" fill="#27AE60"/>
      <text x="145" y="115" font-size="9" fill="#27AE60">B</text>
      <text x="175" y="115" font-size="8" fill="#7F8C8D">P=0.20</text>
      
      <line x1="94" y1="130" x2="140" y2="145" stroke="#F39C12" stroke-width="2"/>
      <text x="120" y="142" font-size="8" fill="#F39C12">0.5</text>
      <circle cx="140" cy="145" r="4" fill="#F39C12"/>
      <text x="145" y="145" font-size="9" fill="#F39C12">B'</text>
      <text x="175" y="145" font-size="8" fill="#7F8C8D">P=0.20</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Probability Tree Diagram
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Venn diagram
 */
export function createVennDiagram(options: ProbabilityOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="venn-diagram" xmlns="http://www.w3.org/2000/svg">
      <!-- Universal set -->
      <rect x="20" y="20" width="160" height="120" fill="#F8F9FA" stroke="#2C3E50" stroke-width="2" rx="5"/>
      <text x="25" y="35" font-size="10" fill="#2C3E50" font-style="italic">U</text>
      
      <!-- Set A -->
      <circle cx="80" cy="80" r="40" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2.5"/>
      <text x="55" y="85" font-size="12" fill="#E74C3C" font-weight="600">A</text>
      
      <!-- Set B -->
      <circle cx="120" cy="80" r="40" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2.5"/>
      <text x="145" y="85" font-size="12" fill="#3498DB" font-weight="600">B</text>
      
      <!-- Intersection label -->
      <text x="100" y="85" font-size="10" fill="#27AE60" font-weight="600">A∩B</text>
      
      <!-- Set operations -->
      <text x="100" y="155" font-size="9" fill="#7F8C8D" text-anchor="middle">
        Union: A∪B | Intersection: A∩B
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Venn Diagram (Set Operations)
        </text>
      ` : ''}
    </svg>
  `;
}
