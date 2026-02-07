/**
 * Industrial Chemistry Components
 * Haber process, Contact process
 */

export interface IndustrialChemistryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create Haber process diagram
 */
export function createHaberProcess(options: IndustrialChemistryOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="haber-process" xmlns="http://www.w3.org/2000/svg">
      <!-- Reactants -->
      <g id="reactants">
        <text x="40" y="75" font-size="12" fill="#3498DB" font-weight="600">N₂</text>
        <text x="40" y="90" font-size="9" fill="#7F8C8D">(from air)</text>
        
        <text x="40" y="110" font-size="12" fill="#27AE60" font-weight="600">3H₂</text>
        <text x="40" y="125" font-size="9" fill="#7F8C8D">(from CH₄)</text>
      </g>
      
      <!-- Reaction conditions -->
      <rect x="90" y="70" width="80" height="50" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
      <text x="130" y="90" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">450°C</text>
      <text x="130" y="105" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">200 atm</text>
      <text x="130" y="60" font-size="9" fill="#9B59B6" text-anchor="middle">Fe catalyst</text>
      
      <!-- Arrow -->
      <line x1="175" y1="95" x2="195" y2="95" stroke="#F39C12" stroke-width="2.5"/>
      <polygon points="195,92 200,95 195,98" fill="#F39C12"/>
      
      <!-- Product -->
      <text x="210" y="100" font-size="13" fill="#E74C3C" font-weight="600">2NH₃</text>
      <text x="210" y="115" font-size="9" fill="#7F8C8D">Ammonia</text>
      
      <!-- Equation -->
      <text x="120" y="145" font-size="11" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        N₂ + 3H₂ ⇌ 2NH₃ + heat
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Haber Process (Ammonia Synthesis)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create Contact process diagram
 */
export function createContactProcess(options: IndustrialChemistryOptions = {}): string {
    const { width = 240, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="contact-process" xmlns="http://www.w3.org/2000/svg">
      <!-- Step 1: Sulfur combustion -->
      <g id="step1">
        <rect x="30" y="40" width="60" height="30" fill="#E8F4F8" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="60" y="60" font-size="10" fill="#2C3E50" text-anchor="middle">S + O₂ → SO₂</text>
        <text x="60" y="30" font-size="9" fill="#3498DB" text-anchor="middle" font-weight="600">Step 1</text>
      </g>
      
      <!-- Arrow -->
      <line x1="95" y1="55" x2="115" y2="55" stroke="#F39C12" stroke-width="2"/>
      <polygon points="115,52 120,55 115,58" fill="#F39C12"/>
      
      <!-- Step 2: Oxidation -->
      <g id="step2">
        <rect x="125" y="30" width="80" height="50" fill="#F0E8F8" stroke="#9B59B6" stroke-width="2" rx="3"/>
        <text x="165" y="50" font-size="10" fill="#2C3E50" text-anchor="middle">2SO₂ + O₂ → 2SO₃</text>
        <text x="165" y="65" font-size="9" fill="#E74C3C" text-anchor="middle">450°C, V₂O₅</text>
        <text x="165" y="20" font-size="9" fill="#9B59B6" text-anchor="middle" font-weight="600">Step 2</text>
      </g>
      
      <!-- Arrow down -->
      <line x1="165" y1="85" x2="165" y2="105" stroke="#F39C12" stroke-width="2"/>
      <polygon points="162,105 165,110 168,105" fill="#F39C12"/>
      
      <!-- Step 3: Absorption -->
      <g id="step3">
        <rect x="125" y="115" width="80" height="40" fill="#E8F8F0" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="165" y="130" font-size="9" fill="#2C3E50" text-anchor="middle">SO₃ + H₂SO₄</text>
        <text x="165" y="145" font-size="9" fill="#2C3E50" text-anchor="middle">→ H₂S₂O₇</text>
        <text x="165" y="105" font-size="9" fill="#27AE60" text-anchor="middle" font-weight="600">Step 3</text>
      </g>
      
      <!-- Arrow -->
      <line x1="125" y1="135" x2="105" y2="135" stroke="#F39C12" stroke-width="2"/>
      <polygon points="105,132 100,135 105,138" fill="#F39C12"/>
      
      <!-- Final product -->
      <g id="product">
        <rect x="30" y="115" width="65" height="40" fill="#F8E8E8" stroke="#E74C3C" stroke-width="2" rx="3"/>
        <text x="62" y="135" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">H₂SO₄</text>
        <text x="62" y="150" font-size="8" fill="#7F8C8D" text-anchor="middle">Sulfuric acid</text>
        <text x="62" y="105" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Product</text>
      </g>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Contact Process (H₂SO₄ Production)
        </text>
      ` : ''}
    </svg>
  `;
}
