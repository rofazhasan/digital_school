/**
 * Extended Chemistry Molecular Structures
 * Organic and inorganic molecules with proper bond angles
 */

import { type ChemistryComponentOptions } from './components';

/**
 * Create methane molecule (CH4) - tetrahedral
 */
export function createMethane(options: ChemistryComponentOptions = {}): string {
    const { width = 100, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="molecule-methane" xmlns="http://www.w3.org/2000/svg">
      <!-- Central carbon -->
      <circle cx="50" cy="50" r="8" fill="#2C3E50" stroke="#34495E" stroke-width="2"/>
      
      <!-- Hydrogen atoms (tetrahedral arrangement) -->
      <circle cx="50" cy="20" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="75" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="25" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="50" cy="75" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      
      <!-- Bonds -->
      <line x1="50" y1="42" x2="50" y2="26" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="56" y1="54" x2="69" y2="58" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="44" y1="54" x2="31" y2="58" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="50" y1="58" x2="50" y2="69" stroke="#2C3E50" stroke-width="2.5"/>
      
      ${showLabel ? `
        <!-- Atom labels -->
        <text x="50" y="53" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">C</text>
        <text x="50" y="23" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="75" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="25" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="50" y="78" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        
        <!-- Formula -->
        <text x="50" y="95" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">CH₄</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create water molecule (H2O) - bent shape
 */
export function createWater(options: ChemistryComponentOptions = {}): string {
    const { width = 90, height = 80, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="molecule-water" xmlns="http://www.w3.org/2000/svg">
      <!-- Oxygen atom -->
      <circle cx="45" cy="40" r="10" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      
      <!-- Hydrogen atoms -->
      <circle cx="20" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="70" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      
      <!-- Bonds (104.5° angle) -->
      <line x1="40" y1="48" x2="24" y2="56" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="50" y1="48" x2="66" y2="56" stroke="#2C3E50" stroke-width="2.5"/>
      
      ${showLabel ? `
        <!-- Atom labels -->
        <text x="45" y="44" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">O</text>
        <text x="20" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="70" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        
        <!-- Angle -->
        <path d="M 30,50 A 15 15 0 0 1 60,50" stroke="#95A5A6" stroke-width="1" fill="none"/>
        <text x="45" y="35" font-size="8" font-family="Inter, sans-serif" fill="#95A5A6" text-anchor="middle">104.5°</text>
        
        <!-- Formula -->
        <text x="45" y="75" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">H₂O</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create ammonia molecule (NH3) - pyramidal
 */
export function createAmmonia(options: ChemistryComponentOptions = {}): string {
    const { width = 90, height = 90, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="molecule-ammonia" xmlns="http://www.w3.org/2000/svg">
      <!-- Nitrogen atom -->
      <circle cx="45" cy="45" r="9" fill="#3498DB" stroke="#2980B9" stroke-width="2"/>
      
      <!-- Hydrogen atoms (pyramidal) -->
      <circle cx="45" cy="20" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="20" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      <circle cx="70" cy="60" r="6" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
      
      <!-- Bonds -->
      <line x1="45" y1="36" x2="45" y2="26" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="40" y1="51" x2="26" y2="58" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="50" y1="51" x2="64" y2="58" stroke="#2C3E50" stroke-width="2.5"/>
      
      ${showLabel ? `
        <!-- Atom labels -->
        <text x="45" y="49" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">N</text>
        <text x="45" y="23" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="20" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        <text x="70" y="63" font-size="9" font-family="Inter, sans-serif" fill="#2C3E50" text-anchor="middle">H</text>
        
        <!-- Formula -->
        <text x="45" y="85" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">NH₃</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create carbon dioxide (CO2) - linear
 */
export function createCO2(options: ChemistryComponentOptions = {}): string {
    const { width = 120, height = 60, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="molecule-co2" xmlns="http://www.w3.org/2000/svg">
      <!-- Carbon atom -->
      <circle cx="60" cy="30" r="8" fill="#2C3E50" stroke="#34495E" stroke-width="2"/>
      
      <!-- Oxygen atoms -->
      <circle cx="25" cy="30" r="9" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      <circle cx="95" cy="30" r="9" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      
      <!-- Double bonds -->
      <line x1="34" y1="27" x2="52" y2="27" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="34" y1="33" x2="52" y2="33" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="68" y1="27" x2="86" y2="27" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="68" y1="33" x2="86" y2="33" stroke="#2C3E50" stroke-width="2.5"/>
      
      ${showLabel ? `
        <!-- Atom labels -->
        <text x="25" y="34" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">O</text>
        <text x="60" y="33" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">C</text>
        <text x="95" y="34" font-size="10" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">O</text>
        
        <!-- Formula -->
        <text x="60" y="55" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">CO₂</text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create ethanol molecule (C2H5OH)
 */
export function createEthanol(options: ChemistryComponentOptions = {}): string {
    const { width = 140, height = 100, showLabel = true } = options;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         class="molecule-ethanol" xmlns="http://www.w3.org/2000/svg">
      <!-- Carbon atoms -->
      <circle cx="40" cy="50" r="8" fill="#2C3E50" stroke="#34495E" stroke-width="2"/>
      <circle cx="70" cy="50" r="8" fill="#2C3E50" stroke="#34495E" stroke-width="2"/>
      
      <!-- Oxygen atom -->
      <circle cx="100" cy="50" r="9" fill="#E74C3C" stroke="#C0392B" stroke-width="2"/>
      
      <!-- Hydrogen atoms -->
      <circle cx="40" cy="25" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      <circle cx="20" cy="50" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      <circle cx="40" cy="75" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      <circle cx="70" cy="25" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      <circle cx="70" cy="75" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      <circle cx="120" cy="50" r="5" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="1.5"/>
      
      <!-- Bonds -->
      <line x1="48" y1="50" x2="62" y2="50" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="78" y1="50" x2="91" y2="50" stroke="#2C3E50" stroke-width="2.5"/>
      <line x1="40" y1="42" x2="40" y2="30" stroke="#2C3E50" stroke-width="2"/>
      <line x1="32" y1="50" x2="25" y2="50" stroke="#2C3E50" stroke-width="2"/>
      <line x1="40" y1="58" x2="40" y2="70" stroke="#2C3E50" stroke-width="2"/>
      <line x1="70" y1="42" x2="70" y2="30" stroke="#2C3E50" stroke-width="2"/>
      <line x1="70" y1="58" x2="70" y2="70" stroke="#2C3E50" stroke-width="2"/>
      <line x1="109" y1="50" x2="115" y2="50" stroke="#2C3E50" stroke-width="2"/>
      
      ${showLabel ? `
        <!-- Atom labels -->
        <text x="40" y="53" font-size="9" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">C</text>
        <text x="70" y="53" font-size="9" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">C</text>
        <text x="100" y="53" font-size="9" font-family="Inter, sans-serif" 
              font-weight="bold" fill="white" text-anchor="middle">O</text>
        
        <!-- Formula -->
        <text x="70" y="95" font-size="11" font-family="Inter, sans-serif" 
              fill="#2C3E50" text-anchor="middle">C₂H₅OH (Ethanol)</text>
      ` : ''}
    </svg>
  `;
}
