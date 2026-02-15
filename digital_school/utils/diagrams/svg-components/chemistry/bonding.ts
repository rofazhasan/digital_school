/**
 * Professional Chemical Bonding Components
 * Ionic, covalent, hydrogen bonding
 */

export interface BondingOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create ionic bonding diagram
 */
export function createIonicBonding(options: BondingOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="ionic-bonding" xmlns="http://www.w3.org/2000/svg">
      <!-- Sodium atom (loses electron) -->
      <circle cx="50" cy="70" r="20" fill="#FFA500" stroke="#FF8C00" stroke-width="2"/>
      <text x="50" y="75" font-size="12" fill="white" text-anchor="middle" font-weight="600">Na</text>
      <text x="50" y="100" font-size="8" fill="#2C3E50" text-anchor="middle">11 e⁻</text>
      
      <!-- Electron transfer -->
      <circle cx="90" cy="70" r="4" fill="#3498DB"/>
      <text x="90" y="74" font-size="7" fill="white" text-anchor="middle">e⁻</text>
      <line x1="70" y1="70" x2="110" y2="70" stroke="#3498DB" stroke-width="2"/>
      <polygon points="110,67 115,70 110,73" fill="#3498DB"/>
      
      <!-- Chlorine atom (gains electron) -->
      <circle cx="130" cy="70" r="20" fill="#27AE60" stroke="#229954" stroke-width="2"/>
      <text x="130" y="75" font-size="12" fill="white" text-anchor="middle" font-weight="600">Cl</text>
      <text x="130" y="100" font-size="8" fill="#2C3E50" text-anchor="middle">17 e⁻</text>
      
      <!-- Ions formed -->
      <circle cx="50" cy="120" r="18" fill="#FFA500" opacity="0.7" stroke="#FF8C00" stroke-width="2"/>
      <text x="50" y="125" font-size="10" fill="white" text-anchor="middle" font-weight="600">Na⁺</text>
      
      <circle cx="130" cy="120" r="22" fill="#27AE60" opacity="0.7" stroke="#229954" stroke-width="2"/>
      <text x="130" y="125" font-size="10" fill="white" text-anchor="middle" font-weight="600">Cl⁻</text>
      
      <!-- Electrostatic attraction -->
      <line x1="68" y1="120" x2="108" y2="120" stroke="#E74C3C" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="88" y="115" font-size="8" fill="#E74C3C" text-anchor="middle">Attraction</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Ionic Bonding (NaCl)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create covalent bonding diagram
 */
export function createCovalentBonding(options: BondingOptions = {}): string {
    const { width = 200, height = 140, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="covalent-bonding" xmlns="http://www.w3.org/2000/svg">
      <!-- Hydrogen atoms -->
      <circle cx="60" cy="70" r="18" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="60" y="75" font-size="12" fill="#3498DB" text-anchor="middle" font-weight="600">H</text>
      <circle cx="55" cy="65" r="3" fill="#3498DB"/>
      
      <circle cx="120" cy="70" r="18" fill="#E8F4F8" stroke="#3498DB" stroke-width="2"/>
      <text x="120" y="75" font-size="12" fill="#3498DB" text-anchor="middle" font-weight="600">H</text>
      <circle cx="125" cy="65" r="3" fill="#3498DB"/>
      
      <!-- Shared electrons (bond) -->
      <ellipse cx="90" cy="70" rx="15" ry="8" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2"/>
      <circle cx="85" cy="70" r="3" fill="#27AE60"/>
      <circle cx="95" cy="70" r="3" fill="#27AE60"/>
      <text x="90" y="90" font-size="9" fill="#27AE60" text-anchor="middle">Shared pair</text>
      
      <!-- H2 molecule -->
      <text x="90" y="115" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        H—H or H₂
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Covalent Bonding (H₂)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create hydrogen bonding diagram
 */
export function createHydrogenBonding(options: BondingOptions = {}): string {
    const { width = 200, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="hydrogen-bonding" xmlns="http://www.w3.org/2000/svg">
      <!-- Water molecule 1 -->
      <circle cx="60" cy="50" r="12" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="60" y="54" font-size="10" fill="white" text-anchor="middle" font-weight="600">O</text>
      <text x="55" y="42" font-size="7" fill="#E74C3C">δ⁻</text>
      
      <circle cx="45" cy="70" r="6" fill="#E8F4F8" stroke="#3498DB" stroke-width="1.5"/>
      <text x="45" y="73" font-size="7" fill="#3498DB" text-anchor="middle">H</text>
      <text x="40" y="68" font-size="6" fill="#3498DB">δ⁺</text>
      
      <circle cx="75" cy="70" r="6" fill="#E8F4F8" stroke="#3498DB" stroke-width="1.5"/>
      <text x="75" y="73" font-size="7" fill="#3498DB" text-anchor="middle">H</text>
      <text x="80" y="68" font-size="6" fill="#3498DB">δ⁺</text>
      
      <line x1="60" y1="62" x2="48" y2="68" stroke="#2C3E50" stroke-width="2"/>
      <line x1="60" y1="62" x2="72" y2="68" stroke="#2C3E50" stroke-width="2"/>
      
      <!-- Hydrogen bond -->
      <line x1="75" y1="75" x2="120" y2="95" stroke="#9B59B6" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="98" y="82" font-size="8" fill="#9B59B6">H-bond</text>
      
      <!-- Water molecule 2 -->
      <circle cx="135" cy="110" r="12" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <text x="135" y="114" font-size="10" fill="white" text-anchor="middle" font-weight="600">O</text>
      <text x="130" y="102" font-size="7" fill="#E74C3C">δ⁻</text>
      
      <circle cx="120" cy="95" r="6" fill="#E8F4F8" stroke="#3498DB" stroke-width="1.5"/>
      <text x="120" y="98" font-size="7" fill="#3498DB" text-anchor="middle">H</text>
      
      <circle cx="150" cy="95" r="6" fill="#E8F4F8" stroke="#3498DB" stroke-width="1.5"/>
      <text x="150" y="98" font-size="7" fill="#3498DB" text-anchor="middle">H</text>
      
      <line x1="135" y1="98" x2="123" y2="95" stroke="#2C3E50" stroke-width="2"/>
      <line x1="135" y1="98" x2="147" y2="95" stroke="#2C3E50" stroke-width="2"/>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Hydrogen Bonding (Water)
        </text>
      ` : ''}
    </svg>
  `;
}
