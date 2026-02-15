/**
 * Professional Biology Body Systems Components
 * Digestive, respiratory, circulatory systems
 */

export interface BodySystemOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create digestive system diagram
 */
export function createDigestiveSystem(options: BodySystemOptions = {}): string {
    const { width = 180, height = 240, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="digestive-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Mouth -->
      <ellipse cx="90" cy="30" rx="15" ry="8" fill="#F8B4B4" stroke="#E74C3C" stroke-width="2"/>
      <text x="110" y="33" font-size="8" fill="#2C3E50">Mouth</text>
      
      <!-- Esophagus -->
      <rect x="85" y="38" width="10" height="30" fill="#E8A5A5" stroke="#E74C3C" stroke-width="1.5"/>
      <text x="100" y="55" font-size="8" fill="#2C3E50">Esophagus</text>
      
      <!-- Stomach -->
      <path d="M 70,68 Q 65,90 75,110 Q 85,120 95,110 Q 105,90 100,68 Z" 
            fill="#F5A9A9" stroke="#E74C3C" stroke-width="2"/>
      <text x="110" y="90" font-size="8" fill="#2C3E50">Stomach</text>
      
      <!-- Small intestine (coiled) -->
      <path d="M 90,120 Q 60,130 60,150 Q 60,170 90,180 Q 120,170 120,150 Q 120,130 90,120" 
            fill="#F9D5A7" stroke="#F39C12" stroke-width="2.5" fill="none"/>
      <path d="M 70,140 Q 90,145 110,140" fill="none" stroke="#F39C12" stroke-width="2.5"/>
      <path d="M 70,160 Q 90,155 110,160" fill="none" stroke="#F39C12" stroke-width="2.5"/>
      <text x="125" y="150" font-size="8" fill="#2C3E50">Small</text>
      <text x="125" y="160" font-size="8" fill="#2C3E50">Intestine</text>
      
      <!-- Large intestine -->
      <path d="M 50,185 L 50,210 L 130,210 L 130,185" 
            fill="none" stroke="#E67E22" stroke-width="3.5"/>
      <text x="135" y="200" font-size="8" fill="#2C3E50">Large</text>
      <text x="135" y="210" font-size="8" fill="#2C3E50">Intestine</text>
      
      <!-- Liver (side) -->
      <ellipse cx="35" cy="85" rx="18" ry="25" fill="#8B4513" opacity="0.4" stroke="#8B4513" stroke-width="2"/>
      <text x="15" y="90" font-size="8" fill="#8B4513">Liver</text>
      
      <!-- Pancreas (side) -->
      <ellipse cx="145" cy="100" rx="15" ry="10" fill="#D2691E" opacity="0.4" stroke="#D2691E" stroke-width="1.5"/>
      <text x="145" y="120" font-size="7" fill="#D2691E" text-anchor="middle">Pancreas</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Digestive System
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create respiratory system diagram
 */
export function createRespiratorySystem(options: BodySystemOptions = {}): string {
    const { width = 180, height = 220, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="respiratory-system" xmlns="http://www.w3.org/2000/svg">
      <!-- Nasal cavity -->
      <ellipse cx="90" cy="25" rx="12" ry="8" fill="#F8E0E0" stroke="#E74C3C" stroke-width="1.5"/>
      <text x="105" y="28" font-size="8" fill="#2C3E50">Nose</text>
      
      <!-- Pharynx -->
      <rect x="85" y="33" width="10" height="15" fill="#F5C6C6" stroke="#E74C3C" stroke-width="1.5"/>
      
      <!-- Larynx -->
      <rect x="83" y="48" width="14" height="12" fill="#F0B3B3" stroke="#E74C3C" stroke-width="2" rx="2"/>
      <text x="105" y="55" font-size="7" fill="#2C3E50">Larynx</text>
      
      <!-- Trachea -->
      <rect x="85" y="60" width="10" height="40" fill="#E8A5A5" stroke="#E74C3C" stroke-width="2"/>
      <!-- Tracheal rings -->
      ${[0, 1, 2, 3].map(i => `
        <line x1="85" y1="${65 + i * 10}" x2="95" y2="${65 + i * 10}" stroke="#C0392B" stroke-width="1"/>
      `).join('')}
      <text x="100" y="82" font-size="8" fill="#2C3E50">Trachea</text>
      
      <!-- Bronchi -->
      <path d="M 90,100 L 60,120" stroke="#E74C3C" stroke-width="6" fill="none"/>
      <path d="M 90,100 L 120,120" stroke="#E74C3C" stroke-width="6" fill="none"/>
      
      <!-- Left lung -->
      <ellipse cx="55" cy="150" rx="30" ry="45" fill="#F8B4B4" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
      <text x="55" y="155" font-size="9" fill="#2C3E50" text-anchor="middle">Left</text>
      <text x="55" y="165" font-size="9" fill="#2C3E50" text-anchor="middle">Lung</text>
      
      <!-- Right lung -->
      <ellipse cx="125" cy="150" rx="30" ry="45" fill="#F8B4B4" opacity="0.5" stroke="#E74C3C" stroke-width="2"/>
      <text x="125" y="155" font-size="9" fill="#2C3E50" text-anchor="middle">Right</text>
      <text x="125" y="165" font-size="9" fill="#2C3E50" text-anchor="middle">Lung</text>
      
      <!-- Alveoli (small circles in lungs) -->
      ${[0, 1, 2, 3, 4].map(i => `
        <circle cx="${45 + Math.random() * 20}" cy="${135 + i * 10}" r="2" fill="#E74C3C" opacity="0.4"/>
        <circle cx="${115 + Math.random() * 20}" cy="${135 + i * 10}" r="2" fill="#E74C3C" opacity="0.4"/>
      `).join('')}
      
      <!-- Diaphragm -->
      <path d="M 25,195 Q 90,210 155,195" stroke="#7F8C8D" stroke-width="3" fill="none"/>
      <text x="90" y="215" font-size="8" fill="#7F8C8D" text-anchor="middle">Diaphragm</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Respiratory System
        </text>
      ` : ''}
    </svg>
  `;
}
