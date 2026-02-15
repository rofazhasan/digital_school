/**
 * Professional Rotational Mechanics Components
 * Angular momentum, torque, moment of inertia
 */

export interface RotationalOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create angular momentum diagram
 */
export function createAngularMomentum(options: RotationalOptions = {}): string {
    const { width = 200, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="angular-momentum" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowRotational" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Rotating disk -->
      <ellipse cx="100" cy="90" rx="60" ry="15" fill="#95A5A6" opacity="0.3"/>
      <ellipse cx="100" cy="90" rx="60" ry="15" fill="none" stroke="#7F8C8D" stroke-width="3"/>
      
      <!-- Disk face (circle) -->
      <circle cx="100" cy="90" r="60" fill="#BDC3C7" opacity="0.5" stroke="#7F8C8D" stroke-width="3"/>
      
      <!-- Rotation axis (vertical) -->
      <line x1="100" y1="30" x2="100" y2="150" stroke="#2C3E50" stroke-width="3"/>
      <text x="110" y="40" font-size="10" fill="#2C3E50">Axis</text>
      
      <!-- Angular velocity vector (ω) -->
      <line x1="100" y1="90" x2="100" y2="30" stroke="#3498DB" stroke-width="3" marker-end="url(#arrowRotational)"/>
      <text x="105" y="55" font-size="14" fill="#3498DB" font-weight="600">ω</text>
      
      <!-- Angular momentum vector (L) -->
      <line x1="100" y1="90" x2="100" y2="20" stroke="#E74C3C" stroke-width="4" marker-end="url(#arrowRotational)"/>
      <text x="105" y="25" font-size="14" fill="#E74C3C" font-weight="600">L</text>
      
      <!-- Rotation direction (curved arrow) -->
      <path d="M 140,90 A 40,40 0 0,1 100,130" stroke="#F39C12" stroke-width="2.5" fill="none" marker-end="url(#arrowRotational)"/>
      <text x="145" y="115" font-size="10" fill="#F39C12">rotation</text>
      
      <!-- Mass point on disk -->
      <circle cx="140" cy="90" r="5" fill="#E74C3C"/>
      <text x="148" y="95" font-size="9" fill="#E74C3C">m</text>
      
      <!-- Radius vector -->
      <line x1="100" y1="90" x2="140" y2="90" stroke="#27AE60" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="115" y="85" font-size="10" fill="#27AE60">r</text>
      
      <!-- Formula -->
      <text x="100" y="165" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        L = Iω
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Angular Momentum
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create torque diagram
 */
export function createTorque(options: RotationalOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="torque" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowTorque" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Pivot point -->
      <circle cx="50" cy="80" r="6" fill="#2C3E50"/>
      <text x="50" y="100" font-size="10" fill="#2C3E50" text-anchor="middle">Pivot</text>
      
      <!-- Lever arm (rod) -->
      <rect x="50" y="75" width="120" height="10" fill="#7F8C8D" stroke="#2C3E50" stroke-width="2" rx="2"/>
      
      <!-- Radius vector (r) -->
      <line x1="50" y1="80" x2="150" y2="80" stroke="#27AE60" stroke-width="2.5" marker-end="url(#arrowTorque)"/>
      <text x="95" y="70" font-size="12" fill="#27AE60" font-weight="600">r</text>
      
      <!-- Force vector (F) -->
      <line x1="150" y1="80" x2="150" y2="20" stroke="#E74C3C" stroke-width="3" marker-end="url(#arrowTorque)"/>
      <text x="155" y="45" font-size="12" fill="#E74C3C" font-weight="600">F</text>
      
      <!-- Angle theta -->
      <path d="M 130,80 Q 140,70 150,60" stroke="#9B59B6" stroke-width="1.5" fill="none"/>
      <text x="135" y="65" font-size="11" fill="#9B59B6" font-style="italic">θ</text>
      
      <!-- Torque direction (curved arrow) -->
      <path d="M 60,50 A 30,30 0 0,1 80,30" stroke="#3498DB" stroke-width="2.5" fill="none" marker-end="url(#arrowTorque)"/>
      <text x="55" y="35" font-size="12" fill="#3498DB" font-weight="600">τ</text>
      
      <!-- Formula -->
      <text x="100" y="130" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        τ = r × F = rF sin θ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Torque
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create moment of inertia diagram
 */
export function createMomentOfInertia(
    shape: 'disk' | 'rod' | 'sphere' = 'disk',
    options: RotationalOptions = {}
): string {
    const { width = 180, height = 160, showLabel = true } = options;

    const shapes = {
        disk: {
            svg: `
        <circle cx="90" cy="80" r="50" fill="#95A5A6" opacity="0.5" stroke="#7F8C8D" stroke-width="3"/>
        <line x1="90" y1="30" x2="90" y2="130" stroke="#2C3E50" stroke-width="3"/>
        <line x1="90" y1="80" x2="140" y2="80" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="110" y="75" font-size="11" fill="#E74C3C">R</text>
      `,
            formula: 'I = ½MR²',
            name: 'Disk'
        },
        rod: {
            svg: `
        <rect x="40" y="75" width="100" height="10" fill="#7F8C8D" stroke="#2C3E50" stroke-width="2" rx="2"/>
        <line x1="90" y1="50" x2="90" y2="110" stroke="#2C3E50" stroke-width="3"/>
        <line x1="90" y1="80" x2="140" y2="80" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="110" y="75" font-size="11" fill="#E74C3C">L/2</text>
      `,
            formula: 'I = ¹⁄₁₂ML²',
            name: 'Rod (center)'
        },
        sphere: {
            svg: `
        <circle cx="90" cy="80" r="45" fill="#95A5A6" opacity="0.3" stroke="#7F8C8D" stroke-width="3"/>
        <ellipse cx="90" cy="80" rx="45" ry="12" fill="none" stroke="#7F8C8D" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="90" y1="35" x2="90" y2="125" stroke="#2C3E50" stroke-width="3"/>
        <line x1="90" y1="80" x2="135" y2="80" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="108" y="75" font-size="11" fill="#E74C3C">R</text>
      `,
            formula: 'I = ⅖MR²',
            name: 'Sphere'
        }
    };

    const selected = shapes[shape];

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="moment-of-inertia" xmlns="http://www.w3.org/2000/svg">
      ${selected.svg}
      
      <!-- Axis label -->
      <text x="95" y="45" font-size="9" fill="#2C3E50">Axis</text>
      
      <!-- Formula -->
      <text x="90" y="145" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600">
        ${selected.formula}
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Moment of Inertia (${selected.name})
        </text>
      ` : ''}
    </svg>
  `;
}
