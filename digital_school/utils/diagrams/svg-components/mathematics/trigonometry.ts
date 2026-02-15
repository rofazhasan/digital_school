/**
 * Professional Trigonometry Components
 * Unit circle, identities, sine/cosine waves, inverse functions
 */

export interface TrigonometryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create unit circle
 */
export function createUnitCircle(options: TrigonometryOptions = {}): string {
    const { width = 200, height = 200, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="unit-circle" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="20" y1="100" x2="180" y2="100" stroke="#2C3E50" stroke-width="2"/>
      <line x1="100" y1="20" x2="100" y2="180" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="180,97 185,100 180,103" fill="#2C3E50"/>
      <polygon points="97,20 100,15 103,20" fill="#2C3E50"/>
      
      <!-- Unit circle -->
      <circle cx="100" cy="100" r="70" fill="none" stroke="#3498DB" stroke-width="2.5"/>
      
      <!-- Key angles -->
      ${[
            { angle: 0, label: '0°', x: 170, y: 100 },
            { angle: 45, label: '45°', x: 149, y: 51 },
            { angle: 90, label: '90°', x: 100, y: 30 },
            { angle: 135, label: '135°', x: 51, y: 51 },
            { angle: 180, label: '180°', x: 30, y: 100 },
            { angle: 270, label: '270°', x: 100, y: 170 }
        ].map(item => {
            const rad = item.angle * Math.PI / 180;
            const x = 100 + 70 * Math.cos(rad);
            const y = 100 - 70 * Math.sin(rad);
            return `
          <circle cx="${x}" cy="${y}" r="3" fill="#E74C3C"/>
          <text x="${item.x}" y="${item.y}" font-size="9" fill="#E74C3C" text-anchor="middle">${item.label}</text>
        `;
        }).join('')}
      
      <!-- Example angle (30°) -->
      <line x1="100" y1="100" x2="160" y2="65" stroke="#27AE60" stroke-width="2"/>
      <path d="M 120,100 A 20,20 0 0,1 130,90" stroke="#F39C12" stroke-width="1.5" fill="none"/>
      <text x="135" y="95" font-size="8" fill="#F39C12">θ</text>
      
      <!-- Coordinates -->
      <text x="165" y="70" font-size="8" fill="#27AE60">(cos θ, sin θ)</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Unit Circle
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create trig identities
 */
export function createTrigIdentities(options: TrigonometryOptions = {}): string {
    const { width = 220, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="trig-identities" xmlns="http://www.w3.org/2000/svg">
      <!-- Pythagorean Identity -->
      <rect x="20" y="20" width="180" height="25" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
      <text x="110" y="37" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        sin²θ + cos²θ = 1
      </text>
      
      <!-- Sum formulas -->
      <rect x="20" y="55" width="180" height="25" fill="#E6F7E6" stroke="#27AE60" stroke-width="2" rx="3"/>
      <text x="110" y="72" font-size="10" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        sin(A + B) = sinA cosB + cosA sinB
      </text>
      
      <!-- Double angle -->
      <rect x="20" y="90" width="180" height="25" fill="#FFF4E6" stroke="#F39C12" stroke-width="2" rx="3"/>
      <text x="110" y="107" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        sin2θ = 2sinθ cosθ
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Trigonometric Identities
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create sine/cosine waves
 */
export function createSineCosineWaves(options: TrigonometryOptions = {}): string {
    const { width = 240, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="sine-cosine-waves" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="20" y1="70" x2="220" y2="70" stroke="#2C3E50" stroke-width="1.5"/>
      <line x1="20" y1="20" x2="20" y2="120" stroke="#2C3E50" stroke-width="1.5"/>
      
      <!-- Sine wave -->
      <path d="M 20,70 Q 45,30 70,70 Q 95,110 120,70 Q 145,30 170,70 Q 195,110 220,70" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="225" y="70" font-size="10" fill="#E74C3C">sin x</text>
      
      <!-- Cosine wave (shifted) -->
      <path d="M 20,30 Q 45,70 70,110 Q 95,70 120,30 Q 145,70 170,110 Q 195,70 220,30" 
            stroke="#3498DB" stroke-width="2.5" fill="none" opacity="0.7"/>
      <text x="225" y="30" font-size="10" fill="#3498DB">cos x</text>
      
      <!-- Period markers -->
      <line x1="120" y1="65" x2="120" y2="75" stroke="#27AE60" stroke-width="1.5"/>
      <text x="120" y="85" font-size="9" fill="#27AE60" text-anchor="middle">2π</text>
      
      <!-- Amplitude -->
      <line x1="15" y1="30" x2="15" y2="70" stroke="#F39C12" stroke-width="1.5"/>
      <text x="10" y="50" font-size="9" fill="#F39C12" text-anchor="end">A</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Sine and Cosine Waves
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create inverse trig functions
 */
export function createInverseTrigFunctions(options: TrigonometryOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="inverse-trig" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="30" y1="20" x2="30" y2="140" stroke="#2C3E50" stroke-width="2"/>
      <line x1="30" y1="80" x2="170" y2="80" stroke="#2C3E50" stroke-width="2"/>
      <polygon points="170,77 175,80 170,83" fill="#2C3E50"/>
      <polygon points="27,20 30,15 33,20" fill="#2C3E50"/>
      
      <!-- arcsin curve -->
      <path d="M 30,140 Q 60,110 100,50 Q 130,20 170,20" 
            stroke="#E74C3C" stroke-width="2.5" fill="none"/>
      <text x="175" y="25" font-size="10" fill="#E74C3C">arcsin x</text>
      
      <!-- Domain/Range markers -->
      <line x1="30" y1="145" x2="170" y2="145" stroke="#3498DB" stroke-width="1.5"/>
      <text x="100" y="157" font-size="9" fill="#3498DB" text-anchor="middle">Domain: [−1, 1]</text>
      
      <line x1="25" y1="20" x2="25" y2="140" stroke="#27AE60" stroke-width="1.5"/>
      <text x="20" y="80" font-size="9" fill="#27AE60" text-anchor="end" transform="rotate(-90 20 80)">Range: [−π/2, π/2]</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Inverse Trig Functions (arcsin)
        </text>
      ` : ''}
    </svg>
  `;
}
