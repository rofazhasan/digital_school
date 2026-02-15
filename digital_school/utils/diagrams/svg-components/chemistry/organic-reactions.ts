/**
 * Professional Organic Reactions Components
 * Addition and substitution reactions
 */

export interface OrganicReactionOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create addition reaction diagram
 */
export function createAdditionReaction(options: OrganicReactionOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="addition-reaction" xmlns="http://www.w3.org/2000/svg">
      <!-- Ethene (alkene) -->
      <text x="40" y="60" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        H₂C=CH₂
      </text>
      <text x="40" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(Ethene)</text>
      
      <!-- Plus sign -->
      <text x="75" y="60" font-size="14" fill="#2C3E50" text-anchor="middle">+</text>
      
      <!-- Br2 -->
      <text x="105" y="60" font-size="12" fill="#E74C3C" text-anchor="middle" font-family="Inter, sans-serif">
        Br₂
      </text>
      <text x="105" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(Bromine)</text>
      
      <!-- Arrow -->
      <line x1="125" y1="60" x2="155" y2="60" stroke="#27AE60" stroke-width="2"/>
      <polygon points="155,57 160,60 155,63" fill="#27AE60"/>
      
      <!-- Product (dibromoethane) -->
      <text x="190" y="60" font-size="11" fill="#3498DB" text-anchor="middle" font-family="Inter, sans-serif">
        H₂BrC-CBrH₂
      </text>
      <text x="190" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(1,2-dibromoethane)</text>
      
      <!-- Mechanism note -->
      <text x="110" y="100" font-size="9" fill="#9B59B6" text-anchor="middle">
        Double bond opens, Br atoms add
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Addition Reaction (Alkene + Br₂)
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create substitution reaction diagram
 */
export function createSubstitutionReaction(options: OrganicReactionOptions = {}): string {
    const { width = 220, height = 120, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" 
         class="substitution-reaction" xmlns="http://www.w3.org/2000/svg">
      <!-- Methane -->
      <text x="35" y="60" font-size="12" fill="#2C3E50" text-anchor="middle" font-family="Inter, sans-serif">
        CH₄
      </text>
      <text x="35" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(Methane)</text>
      
      <!-- Plus sign -->
      <text x="65" y="60" font-size="14" fill="#2C3E50" text-anchor="middle">+</text>
      
      <!-- Cl2 -->
      <text x="95" y="60" font-size="12" fill="#27AE60" text-anchor="middle" font-family="Inter, sans-serif">
        Cl₂
      </text>
      <text x="95" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(Chlorine)</text>
      
      <!-- Arrow with conditions -->
      <line x1="115" y1="60" x2="145" y2="60" stroke="#F39C12" stroke-width="2"/>
      <polygon points="145,57 150,60 145,63" fill="#F39C12"/>
      <text x="130" y="50" font-size="8" fill="#F39C12" text-anchor="middle">UV light</text>
      
      <!-- Product (chloromethane) -->
      <text x="175" y="60" font-size="11" fill="#3498DB" text-anchor="middle" font-family="Inter, sans-serif">
        CH₃Cl
      </text>
      <text x="175" y="75" font-size="9" fill="#7F8C8D" text-anchor="middle">(Chloromethane)</text>
      
      <!-- Plus HCl -->
      <text x="205" y="60" font-size="10" fill="#2C3E50" text-anchor="middle">+</text>
      <text x="215" y="60" font-size="10" fill="#E74C3C" text-anchor="middle">HCl</text>
      
      <!-- Mechanism note -->
      <text x="110" y="100" font-size="9" fill="#9B59B6" text-anchor="middle">
        H replaced by Cl (free radical mechanism)
      </text>
      
      ${showLabel ? `
        <text x="${width / 2}" y="${height + 15}" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">
          Substitution Reaction (Halogenation)
        </text>
      ` : ''}
    </svg>
  `;
}
