/**
 * World-Class SVG Gradients and Filters
 * Provides shared definitions for a 3D, professional scientific look.
 */

export const SVG_DEFS = `
  <defs>
    <!-- 3D Sphere/Cell Gradient -->
    <radialGradient id="grad-cell-3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#3498db" stop-opacity="0.9" />
    </radialGradient>

    <!-- Generic Sphere (White/Gray) - Hydrogen -->
    <radialGradient id="grad-sphere-white" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#94a3b8" />
    </radialGradient>

    <!-- Carbon (Black/Gray) -->
    <radialGradient id="grad-sphere-black" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>

    <!-- Oxygen (Red) -->
    <radialGradient id="grad-sphere-red" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#fca5a5" />
      <stop offset="100%" stop-color="#b91c1c" />
    </radialGradient>

    <!-- Nitrogen (Blue) -->
    <radialGradient id="grad-sphere-blue" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </radialGradient>

    <!-- Sulfur (Yellow) -->
    <radialGradient id="grad-sphere-yellow" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#ca8a04" />
    </radialGradient>

    <!-- Chlorine (Green) -->
    <radialGradient id="grad-sphere-green" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="100%" stop-color="#15803d" />
    </radialGradient>

    <!-- Generic Metal (Silver/Metallic) -->
    <linearGradient id="grad-metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>

    <!-- Charge Positive (Red Glow) -->
    <radialGradient id="grad-charge-pos" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fca5a5" />
      <stop offset="100%" stop-color="#ef4444" />
    </radialGradient>

    <!-- Charge Negative (Blue Glow) -->
    <radialGradient id="grad-charge-neg" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="100%" stop-color="#3b82f6" />
    </radialGradient>

    <!-- Generic 3D Sphere (Gray) -->
    <radialGradient id="grad-sphere" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#475569" />
    </radialGradient>

    <!-- Bio Organic Gradient -->
    <radialGradient id="grad-bio-soft" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a8e063" />
      <stop offset="100%" stop-color="#56ab2f" />
    </radialGradient>

    <!-- DNA Helix Glow -->
    <filter id="dna-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Paper/Technical Grid Filter -->
    <pattern id="minorGrid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
    </pattern>
    <pattern id="majorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" stroke-width="1"/>
    </pattern>

    <!-- Professional Shadow -->
    <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="1" dy="1" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Glassmorphism Effect -->
    <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
    </linearGradient>

    <!-- Professional Arrow Markers (High Visibility) -->
    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
    </marker>
    
    <marker id="arrowhead-heavy" markerWidth="6" markerHeight="6" 
            refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
    </marker>

    <!-- Vector Glow for visibility -->
    <filter id="vector-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feFlood flood-color="white" flood-opacity="0.5" result="glowColor" />
      <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
      <feMerge>
        <feMergeNode in="softGlow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
`;

/**
 * Wraps content with the standard world-class defs
 */
export function wrapWithDefs(content: string): string {
  return SVG_DEFS + content;
}
