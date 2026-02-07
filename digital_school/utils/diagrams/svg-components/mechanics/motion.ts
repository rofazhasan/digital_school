/**
 * Extended Mechanics Components
 * Pendulums, projectiles, circular motion, collisions
 */

import { type MechanicalComponentOptions } from './components';

/**
 * Create simple pendulum
 */
export function createPendulum(
    angle: number = 30,
    options: MechanicsComponentOptions = {}
): string {
    const { width = 140, height = 160, showLabel = true } = options;

    const length = 100;
    const pivotX = width / 2;
    const pivotY = 20;
    const angleRad = (angle * Math.PI) / 180;
    const bobX = pivotX + length * Math.sin(angleRad);
    const bobY = pivotY + length * Math.cos(angleRad);

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="pendulum" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bobGrad">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </radialGradient>
        <filter id="bobShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Support -->
      <rect x="${pivotX - 30}" y="10" width="60" height="10" fill="#7F8C8D" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Pivot point -->
      <circle cx="${pivotX}" cy="${pivotY}" r="4" fill="#2C3E50"/>
      
      <!-- String -->
      <line x1="${pivotX}" y1="${pivotY}" x2="${bobX}" y2="${bobY}" 
            stroke="#34495E" stroke-width="2"/>
      
      <!-- Pendulum bob -->
      <circle cx="${bobX}" cy="${bobY}" r="15" fill="url(#bobGrad)" 
              stroke="#C0392B" stroke-width="2" filter="url(#bobShadow)"/>
      
      <!-- Vertical reference (dashed) -->
      <line x1="${pivotX}" y1="${pivotY}" x2="${pivotX}" y2="${pivotY + length}" 
            stroke="#95A5A6" stroke-width="1" stroke-dasharray="3,3"/>
      
      <!-- Angle arc -->
      <path d="M ${pivotX},${pivotY + 30} A 30 30 0 0 ${angle > 0 ? 1 : 0} ${pivotX + 30 * Math.sin(angleRad)},${pivotY + 30 * Math.cos(angleRad)}" 
            stroke="#3498DB" stroke-width="1.5" fill="none"/>
      
      ${showLabel ? `
        <!-- Labels -->
        <text x="${pivotX + 15}" y="${pivotY + 20}" font-size="10" font-family="Inter, sans-serif" 
              fill="#3498DB">θ = ${angle}°</text>
        <text x="${pivotX - 20}" y="${pivotY + length / 2}" font-size="10" font-family="Inter, sans-serif" 
              fill="#34495E">L</text>
        <text x="${bobX + 20}" y="${bobY}" font-size="10" font-family="Inter, sans-serif" 
              fill="#E74C3C">m</text>
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Simple Pendulum</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create projectile motion trajectory
 */
export function createProjectile(options: MechanicsComponentOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    // Parabolic trajectory
    const points = Array.from({ length: 50 }, (_, i) => {
        const t = i / 50;
        const x = 20 + t * 180;
        const y = height - 20 - (100 * t - 80 * t * t);
        return { x, y };
    });

    const pathData = points.map(({ x, y }, i) =>
        i === 0 ? `M ${x},${y}` : `L ${x},${y}`
    ).join(' ');

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="projectile" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="velArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Ground -->
      <line x1="0" y1="${height - 20}" x2="${width}" y2="${height - 20}" 
            stroke="#8B4513" stroke-width="3"/>
      <rect x="0" y="${height - 20}" width="${width}" height="5" fill="#D2691E" opacity="0.5"/>
      
      <!-- Trajectory -->
      <path d="${pathData}" stroke="#3498DB" stroke-width="2.5" fill="none" stroke-dasharray="5,5"/>
      
      <!-- Projectile at different positions -->
      ${[0, 0.25, 0.5, 0.75].map(t => {
        const idx = Math.floor(t * (points.length - 1));
        const { x, y } = points[idx];
        return `<circle cx="${x}" cy="${y}" r="4" fill="#E74C3C" opacity="${1 - t * 0.5}"/>`;
    }).join('')}
      
      <!-- Initial velocity vector -->
      <line x1="20" y1="${height - 20}" x2="60" y2="${height - 60}" 
            stroke="#E74C3C" stroke-width="2.5" marker-end="url(#velArrow)"/>
      <text x="45" y="${height - 65}" font-size="10" font-family="Inter, sans-serif" fill="#E74C3C">v₀</text>
      
      <!-- Velocity components at peak -->
      <line x1="${points[25].x}" y1="${points[25].y}" x2="${points[25].x + 40}" y2="${points[25].y}" 
            stroke="#27AE60" stroke-width="2" marker-end="url(#velArrow)"/>
      <text x="${points[25].x + 20}" y="${points[25].y - 5}" font-size="9" fill="#27AE60">vₓ</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Projectile Motion</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create circular motion diagram
 */
export function createCircularMotion(options: MechanicsComponentOptions = {}): string {
    const { width = 160, height = 160, showLabel = true } = options;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 50;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="circular-motion" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="circArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3498DB"/>
        </marker>
        <marker id="forceArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
      </defs>
      
      <!-- Circular path -->
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" 
              stroke="#95A5A6" stroke-width="2" stroke-dasharray="5,5"/>
      
      <!-- Center -->
      <circle cx="${cx}" cy="${cy}" r="3" fill="#2C3E50"/>
      
      <!-- Object at top -->
      <circle cx="${cx}" cy="${cy - radius}" r="8" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
      
      <!-- Radius -->
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - radius}" 
            stroke="#7F8C8D" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="${cx + 5}" y="${cy - radius / 2}" font-size="10" fill="#7F8C8D">r</text>
      
      <!-- Velocity vector (tangent) -->
      <line x1="${cx}" y1="${cy - radius}" x2="${cx + 40}" y2="${cy - radius}" 
            stroke="#27AE60" stroke-width="2.5" marker-end="url(#circArrow)"/>
      <text x="${cx + 45}" y="${cy - radius + 5}" font-size="10" fill="#27AE60">v</text>
      
      <!-- Centripetal force (toward center) -->
      <line x1="${cx}" y1="${cy - radius + 8}" x2="${cx}" y2="${cy - 10}" 
            stroke="#E74C3C" stroke-width="2.5" marker-end="url(#forceArrow)"/>
      <text x="${cx - 20}" y="${cy - radius / 2}" font-size="10" fill="#E74C3C">Fᴄ</text>
      
      <!-- Angular velocity -->
      <path d="M ${cx + 15},${cy} A 15 15 0 0 1 ${cx},${cy - 15}" 
            stroke="#9B59B6" stroke-width="1.5" fill="none" marker-end="url(#circArrow)"/>
      <text x="${cx + 20}" y="${cy - 5}" font-size="10" fill="#9B59B6">ω</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">Circular Motion</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create collision diagram
 */
export function createCollision(
    type: 'elastic' | 'inelastic' = 'elastic',
    options: MechanicsComponentOptions = {}
): string {
    const { width = 200, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 30}" viewBox="0 0 ${width} ${height + 30}" 
         class="collision" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="collArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#E74C3C"/>
        </marker>
        <radialGradient id="ball1Grad">
          <stop offset="0%" style="stop-color:#E74C3C;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C0392B;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="ball2Grad">
          <stop offset="0%" style="stop-color:#3498DB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980B9;stop-opacity:1" />
        </radialGradient>
      </defs>
      
      <!-- Before collision -->
      <text x="10" y="20" font-size="11" font-weight="600" fill="#2C3E50">Before:</text>
      
      <!-- Ball 1 moving right -->
      <circle cx="40" cy="40" r="12" fill="url(#ball1Grad)"/>
      <line x1="52" y1="40" x2="75" y2="40" stroke="#E74C3C" stroke-width="2.5" marker-end="url(#collArrow)"/>
      <text x="60" y="35" font-size="9" fill="#E74C3C">v₁</text>
      
      <!-- Ball 2 stationary (or moving) -->
      <circle cx="100" cy="40" r="12" fill="url(#ball2Grad)"/>
      ${type === 'elastic' ? `
        <text x="115" y="40" font-size="9" fill="#3498DB">v₂=0</text>
      ` : ''}
      
      <!-- After collision -->
      <text x="10" y="75" font-size="11" font-weight="600" fill="#2C3E50">After:</text>
      
      ${type === 'elastic' ? `
        <!-- Elastic: both balls moving -->
        <circle cx="40" cy="95" r="12" fill="url(#ball1Grad)"/>
        <line x1="28" y1="95" x2="10" y2="95" stroke="#E74C3C" stroke-width="2" marker-end="url(#collArrow)"/>
        <text x="15" y="90" font-size="9" fill="#E74C3C">v₁'</text>
        
        <circle cx="100" cy="95" r="12" fill="url(#ball2Grad)"/>
        <line x1="112" y1="95" x2="135" y2="95" stroke="#3498DB" stroke-width="2.5" marker-end="url(#collArrow)"/>
        <text x="120" y="90" font-size="9" fill="#3498DB">v₂'</text>
      ` : `
        <!-- Inelastic: balls stick together -->
        <g>
          <circle cx="65" cy="95" r="12" fill="url(#ball1Grad)"/>
          <circle cx="75" cy="95" r="12" fill="url(#ball2Grad)"/>
          <line x1="87" y1="95" x2="110" y2="95" stroke="#27AE60" stroke-width="2.5" marker-end="url(#collArrow)"/>
          <text x="95" y="90" font-size="9" fill="#27AE60">v'</text>
        </g>
      `}
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 20}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          ${type === 'elastic' ? 'Elastic' : 'Inelastic'} Collision
        </text>
      ` : ''}
    </svg>
  `;
}
