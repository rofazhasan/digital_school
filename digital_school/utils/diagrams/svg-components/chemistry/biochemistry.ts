/**
 * Biochemistry Components
 * Amino acids, carbohydrates, lipids
 */

export interface BiochemistryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create amino acid structure diagram
 */
export function createAminoAcidStructure(options: BiochemistryOptions = {}): string {
    const { width = 220, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="amino-acid-structure" xmlns="http://www.w3.org/2000/svg">
      <!-- General structure -->
      <g id="amino-acid">
        <!-- Amino group (NH2) -->
        <text x="50" y="80" font-size="12" fill="#3498DB" font-weight="600">H₂N</text>
        <line x1="70" y1="75" x2="90" y2="75" stroke="#2C3E50" stroke-width="2"/>
        
        <!-- Central carbon (alpha carbon) -->
        <circle cx="100" cy="75" r="8" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
        <text x="100" y="79" font-size="10" fill="white" text-anchor="middle" font-weight="600">C</text>
        <text x="100" y="95" font-size="8" fill="#7F8C8D" text-anchor="middle">α-carbon</text>
        
        <!-- R group (variable) -->
        <line x1="100" y1="67" x2="100" y2="50" stroke="#2C3E50" stroke-width="2"/>
        <circle cx="100" cy="40" r="10" fill="#F39C12" opacity="0.5" stroke="#F39C12" stroke-width="2"/>
        <text x="100" y="44" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">R</text>
        <text x="100" y="30" font-size="8" fill="#F39C12" text-anchor="middle">Side chain</text>
        
        <!-- Hydrogen -->
        <line x1="100" y1="83" x2="100" y2="100" stroke="#2C3E50" stroke-width="2"/>
        <text x="100" y="115" font-size="11" fill="#7F8C8D" text-anchor="middle">H</text>
        
        <!-- Carboxyl group (COOH) -->
        <line x1="108" y1="75" x2="130" y2="75" stroke="#2C3E50" stroke-width="2"/>
        <text x="150" y="80" font-size="12" fill="#27AE60" font-weight="600">COOH</text>
      </g>
      
      <!-- Peptide bond formation -->
      <text x="110" y="135" font-size="9" fill="#9B59B6" text-anchor="middle">
        Peptide bond: -CO-NH-
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Amino Acid Structure
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create carbohydrate types diagram
 */
export function createCarbohydrateTypes(options: BiochemistryOptions = {}): string {
    const { width = 240, height = 160, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="carbohydrate-types" xmlns="http://www.w3.org/2000/svg">
      <!-- Monosaccharide -->
      <g id="monosaccharide">
        <polygon points="50,70 60,60 70,70 60,80" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
        <text x="60" y="75" font-size="9" fill="#2C3E50" text-anchor="middle">C₆H₁₂O₆</text>
        <text x="60" y="50" font-size="10" fill="#3498DB" text-anchor="middle" font-weight="600">Monosaccharide</text>
        <text x="60" y="95" font-size="8" fill="#7F8C8D" text-anchor="middle">Glucose</text>
      </g>
      
      <!-- Plus sign -->
      <text x="90" y="75" font-size="14" fill="#F39C12" font-weight="600">+</text>
      
      <!-- Another monosaccharide -->
      <polygon points="110,70 120,60 130,70 120,80" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2"/>
      <text x="120" y="75" font-size="9" fill="#2C3E50" text-anchor="middle">C₆H₁₂O₆</text>
      
      <!-- Arrow -->
      <line x1="140" y1="70" x2="160" y2="70" stroke="#F39C12" stroke-width="2"/>
      <polygon points="160,67 165,70 160,73" fill="#F39C12"/>
      <text x="150" y="65" font-size="8" fill="#F39C12">-H₂O</text>
      
      <!-- Disaccharide -->
      <g id="disaccharide">
        <rect x="170" y="55" width="50" height="30" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="3"/>
        <text x="195" y="73" font-size="9" fill="#2C3E50" text-anchor="middle">C₁₂H₂₂O₁₁</text>
        <text x="195" y="45" font-size="10" fill="#27AE60" text-anchor="middle" font-weight="600">Disaccharide</text>
        <text x="195" y="100" font-size="8" fill="#7F8C8D" text-anchor="middle">Sucrose</text>
      </g>
      
      <!-- Polysaccharide -->
      <g id="polysaccharide">
        <rect x="60" y="115" width="120" height="25" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" stroke-width="2" rx="3"/>
        <text x="120" y="132" font-size="9" fill="#2C3E50" text-anchor="middle">(C₆H₁₀O₅)ₙ</text>
        <text x="120" y="155" font-size="8" fill="#7F8C8D" text-anchor="middle">Starch, Cellulose, Glycogen</text>
      </g>
      <text x="20" y="128" font-size="10" fill="#E74C3C" font-weight="600">Polysaccharide</text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Carbohydrate Types
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create lipid structure diagram
 */
export function createLipidStructure(options: BiochemistryOptions = {}): string {
    const { width = 220, height = 180, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="lipid-structure" xmlns="http://www.w3.org/2000/svg">
      <!-- Glycerol backbone -->
      <g id="glycerol">
        <rect x="80" y="50" width="60" height="30" fill="#3498DB" opacity="0.3" stroke="#3498DB" stroke-width="2" rx="3"/>
        <text x="110" y="70" font-size="10" fill="#2C3E50" text-anchor="middle" font-weight="600">Glycerol</text>
        <text x="110" y="40" font-size="9" fill="#3498DB" text-anchor="middle">C₃H₈O₃</text>
      </g>
      
      <!-- Fatty acid chains -->
      ${[0, 1, 2].map(i => `
        <g id="fatty-acid-${i}">
          <line x1="110" y1="${85 + i * 25}" x2="110" y2="${95 + i * 25}" stroke="#2C3E50" stroke-width="2"/>
          <rect x="70" y="${95 + i * 25}" width="80" height="15" fill="#27AE60" opacity="0.3" stroke="#27AE60" stroke-width="2" rx="2"/>
          <text x="110" y="${106 + i * 25}" font-size="8" fill="#2C3E50" text-anchor="middle">Fatty Acid ${i + 1}</text>
        </g>
      `).join('')}
      
      <!-- Labels -->
      <text x="30" y="105" font-size="8" fill="#27AE60">CH₃(CH₂)ₙCOOH</text>
      
      <!-- Triglyceride label -->
      <text x="110" y="25" font-size="11" fill="#E74C3C" text-anchor="middle" font-weight="600">
        Triglyceride (Fat)
      </text>
      
      <!-- Phospholipid note -->
      <text x="110" y="175" font-size="9" fill="#9B59B6" text-anchor="middle">
        Phospholipid: Replace 1 fatty acid with phosphate group
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Lipid Structure
        </text>
      ` : ''}
    </svg>
  `;
}
