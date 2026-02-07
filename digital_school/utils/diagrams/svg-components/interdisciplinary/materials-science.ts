/**
 * Interdisciplinary Materials Science Components
 * Crystal Structures, Phase Diagrams, Stress-Strain, Polymers, Composites, etc.
 */

export interface MaterialsScienceOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create crystal structures visualization (BCC, FCC)
 */
export function createCrystalStructures(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- BCC -->
        <g transform="translate(50, 50)">
            <rect x="0" y="0" width="80" height="80" fill="none" stroke="#2C3E50" stroke-width="1.5" />
            <circle cx="0" cy="0" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="80" cy="0" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="0" cy="80" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="80" cy="80" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="40" cy="40" r="12" fill="#E74C3C" stroke="#C0392B" /> <!-- Body Center -->
            <text x="40" y="110" font-size="12" fill="#2C3E50" text-anchor="middle">BCC</text>
        </g>
        
        <!-- FCC -->
        <g transform="translate(250, 50)">
            <rect x="0" y="0" width="80" height="80" fill="none" stroke="#2C3E50" stroke-width="1.5" />
            <circle cx="0" cy="0" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="80" cy="0" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="0" cy="80" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="80" cy="80" r="10" fill="#3498DB" stroke="#2980B9" />
            <circle cx="40" cy="0" r="8" fill="#27AE60" stroke="#1E8449" /> <!-- Face centers -->
            <circle cx="40" cy="80" r="8" fill="#27AE60" stroke="#1E8449" />
            <circle cx="0" cy="40" r="8" fill="#27AE60" stroke="#1E8449" />
            <circle cx="80" cy="40" r="8" fill="#27AE60" stroke="#1E8449" />
            <text x="40" y="110" font-size="12" fill="#2C3E50" text-anchor="middle">FCC</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Common Crystal Lattice Structures</text>` : ''}
    </svg>`;
}

/**
 * Create phase diagram visualization
 */
export function createPhaseDiagram(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="50" y1="200" x2="350" y2="200" stroke="#2C3E50" stroke-width="2" />
        <line x1="50" y1="20" x2="50" y2="200" stroke="#2C3E50" stroke-width="2" />
        
        <!-- Phase boundaries -->
        <path d="M 50,50 Q 200,80 350,150" fill="none" stroke="#3498DB" stroke-width="2" />
        <path d="M 50,200 L 200,80" fill="none" stroke="#3498DB" stroke-width="2" />
        
        <text x="120" y="60" font-size="14" fill="#E67E22" font-weight="600">Liquid</text>
        <text x="70" y="150" font-size="14" fill="#27AE60" font-weight="600">Solid α</text>
        <text x="250" y="180" font-size="14" fill="#9B59B6" font-weight="600">Solid β</text>
        
        <text x="200" y="225" font-size="10" fill="#2C3E50" text-anchor="middle">Composition (wt %)</text>
        <text x="20" y="110" font-size="10" fill="#2C3E50" text-anchor="middle" transform="rotate(-90 20 110)">Temperature (T)</text>
        
        <circle cx="200" cy="80" r="3" fill="#E74C3C" />
        <text x="210" y="100" font-size="9" fill="#E74C3C">Eutectic Point</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Iron-Carbon Phase Diagram (Simplified)</text>` : ''}
    </svg>`;
}

/**
 * Create stress-strain curve visualization
 */
export function createStressStrainCurve(options: MaterialsScienceOptions = {}): string {
    const { width = 300, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="50" y1="200" x2="280" y2="200" stroke="#2C3E50" stroke-width="2" />
        <line x1="50" y1="20" x2="50" y2="200" stroke="#2C3E50" stroke-width="2" />
        
        <!-- Curve -->
        <path d="M 50,200 L 100,100 L 150,60 L 220,70 L 250,110" fill="none" stroke="#E74C3C" stroke-width="3" />
        
        <!-- Regions -->
        <text x="70" y="170" font-size="9" fill="#2C3E50" transform="rotate(-64 70 170)">Elastic</text>
        <text x="140" y="85" font-size="9" fill="#2C3E50">Plastic</text>
        <text x="260" y="110" font-size="10" fill="#E74C3C" font-weight="600">Fracture</text>
        
        <text x="165" y="220" font-size="10" fill="#2C3E50" text-anchor="middle">Strain (ε)</text>
        <text x="25" y="110" font-size="10" fill="#2C3E50" text-anchor="middle" transform="rotate(-90 25 110)">Stress (σ)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Engineering Stress-Strain Curve</text>` : ''}
    </svg>`;
}

/**
 * Create polymer structure visualization
 */
export function createPolymerStructure(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Amorphous region -->
        <path d="M 20,100 Q 50,20 80,100 Q 110,180 140,100 Q 170,20 200,100" fill="none" stroke="#3498DB" stroke-width="2" />
        <path d="M 30,120 Q 70,60 110,120 Q 150,180 190,120" fill="none" stroke="#3498DB" stroke-width="2" opacity="0.6" />
        <text x="100" y="40" font-size="10" fill="#3498DB">Amorphous (Random)</text>
        
        <!-- Crystalline region -->
        <g transform="translate(250, 50)">
            <path d="M 0,0 L 100,0 M 0,20 L 100,20 M 0,40 L 100,40 M 0,60 L 100,60" fill="none" stroke="#27AE60" stroke-width="3" />
            <text x="50" y="-10" font-size="10" fill="#27AE60" text-anchor="middle">Crystalline (Ordered)</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Polymer Morphology: Amorphous vs Crystalline</text>` : ''}
    </svg>`;
}

/**
 * Create composite material visualization
 */
export function createCompositeMaterial(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="40" width="300" height="120" fill="#BDC3C7" opacity="0.4" stroke="#95A5A6" stroke-width="2" />
        <text x="200" y="30" font-size="12" fill="#7F8C8D" text-anchor="middle">Matrix Phase</text>
        
        <!-- Reinforcing fibers -->
        <line x1="60" y1="60" x2="340" y2="60" stroke="#2C3E50" stroke-width="5" stroke-linecap="round" />
        <line x1="60" y1="90" x2="340" y2="90" stroke="#2C3E50" stroke-width="5" stroke-linecap="round" />
        <line x1="60" y1="120" x2="340" y2="120" stroke="#2C3E50" stroke-width="5" stroke-linecap="round" />
        
        <text x="200" y="100" font-size="12" fill="white" text-anchor="middle" font-weight="600">Reinforcement (Fibers)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Composite Material Structure</text>` : ''}
    </svg>`;
}

/**
 * Create semiconductor doping visualization
 */
export function createSemiconductorDoping(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- N-type -->
        <g transform="translate(50, 40)">
            <rect x="0" y="0" width="120" height="120" fill="#3498DB" opacity="0.1" stroke="#2980B9" />
            <text x="60" y="-10" font-size="12" fill="#2980B9" text-anchor="middle" font-weight="600">N-Type</text>
            <!-- Atoms and extra electrons -->
            ${Array.from({ length: 4 }).map((_, i) => `<circle cx="${30 + (i % 2) * 60}" cy="${30 + Math.floor(i / 2) * 60}" r="15" fill="#BDC3C7" />`)}
            <circle cx="60" cy="60" r="15" fill="#F1C40F" opacity="0.8" />
            <text x="60" y="64" font-size="10" fill="#2C3E50" text-anchor="middle">P</text>
            <circle cx="85" cy="50" r="4" fill="#E74C3C" />
            <text x="95" y="55" font-size="8" fill="#E74C3C">Free e-</text>
        </g>
        
        <!-- P-type -->
        <g transform="translate(230, 40)">
            <rect x="0" y="0" width="120" height="120" fill="#9B59B6" opacity="0.1" stroke="#8E44AD" />
            <text x="60" y="-10" font-size="12" fill="#8E44AD" text-anchor="middle" font-weight="600">P-Type</text>
            ${Array.from({ length: 4 }).map((_, i) => `<circle cx="${30 + (i % 2) * 60}" cy="${30 + Math.floor(i / 2) * 60}" r="15" fill="#BDC3C7" />`)}
            <circle cx="60" cy="60" r="15" fill="#F39C12" opacity="0.8" />
            <text x="60" y="64" font-size="10" fill="#2C3E50" text-anchor="middle">B</text>
            <circle cx="85" cy="50" r="5" fill="none" stroke="#2C3E50" stroke-width="1.5" />
            <text x="95" y="55" font-size="8" fill="#2C3E50">Hole</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Semiconductor Doping (N-type vs P-type)</text>` : ''}
    </svg>`;
}

/**
 * Create superconductivity Meissner effect visualization
 */
export function createSuperconductivityEffect(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Superconductor -->
        <rect x="150" y="80" width="100" height="40" rx="5" fill="#34495E" stroke="#2C3E50" stroke-width="2" />
        <text x="200" y="105" font-size="10" fill="white" text-anchor="middle">Superconductor</text>
        <text x="200" y="140" font-size="12" fill="#E74C3C" text-anchor="middle" font-weight="600">T &lt; Tc</text>
        
        <!-- B-field lines being expelled -->
        <path d="M 50,60 Q 150,40 200,40 Q 250,40 350,60" fill="none" stroke="#3498DB" stroke-width="2" marker-end="url(#arrowhead)" />
        <path d="M 50,140 Q 150,160 200,160 Q 250,160 350,140" fill="none" stroke="#3498DB" stroke-width="2" marker-end="url(#arrowhead)" />
        <text x="60" y="40" font-size="10" fill="#3498DB">Magnetic Field B</text>
        <text x="200" y="30" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">Meissner Effect</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Superconductivity: Meissner Effect</text>` : ''}
    </svg>`;
}

/**
 * Create nanomaterials (Carbon Nanotube) visualization
 */
export function createNanomaterialsDiagram(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Carbon Nanotube -->
        <g transform="translate(100, 50)">
            <ellipse cx="100" cy="50" rx="80" ry="40" fill="none" stroke="#2C3E50" stroke-width="1.5" />
            <ellipse cx="100" cy="50" rx="70" ry="35" fill="none" stroke="#7F8C8D" stroke-width="1" />
            <!-- Hexagonal mesh hints -->
            <path d="M 30,50 L 170,50 M 100,10 L 100,90" stroke="#BDC3C7" opacity="0.5" />
            <text x="100" y="55" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">Carbon Nanotube</text>
        </g>
        
        <text x="100" y="160" font-size="10" fill="#2C3E50">Diameter: ~1-100 nm</text>
        <rect x="250" y="120" width="80" height="40" rx="3" fill="#E67E22" opacity="0.2" stroke="#E67E22" />
        <text x="290" y="145" font-size="10" fill="#2C3E50" text-anchor="middle">Buckyball (C₆₀)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Nanomaterials: CNT and Fullerenes</text>` : ''}
    </svg>`;
}

/**
 * Create corrosion mechanism visualization
 */
export function createCorrosionMechanism(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Metal surface -->
        <rect x="0" y="150" width="400" height="50" fill="#BDC3C7" />
        <line x1="0" y1="150" x2="400" y2="150" stroke="#7F8C8D" stroke-width="2" />
        
        <!-- Water droplet -->
        <path d="M 100,150 Q 200,50 300,150" fill="#3498DB" opacity="0.3" stroke="#2980B9" />
        
        <!-- Reactions -->
        <text x="200" y="180" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">Anode: Fe → Fe²⁺ + 2e⁻</text>
        <text x="200" y="100" font-size="11" fill="#C0392B" text-anchor="middle">Cathode: O₂ + 2H₂O + 4e⁻ → 4OH⁻</text>
        
        <!-- Rust -->
        <circle cx="100" cy="150" r="10" fill="#D35400" opacity="0.8" />
        <circle cx="300" cy="150" r="10" fill="#D35400" opacity="0.8" />
        <text x="350" y="170" font-size="12" fill="#D35400" font-weight="600">Rust (Fe₂O₃)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Electrochemical Mechanism of Corrosion</text>` : ''}
    </svg>`;
}

/**
 * Create material failure (ductile vs brittle) visualization
 */
export function createMaterialFailure(options: MaterialsScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Ductile -->
        <g transform="translate(50, 50)">
            <path d="M 0,20 L 40,20 Q 50,40 60,20 L 100,20" fill="none" stroke="#2C3E50" stroke-width="4" />
            <path d="M 0,60 L 40,60 Q 50,40 60,60 L 100,60" fill="none" stroke="#2C3E50" stroke-width="4" />
            <text x="50" y="90" font-size="12" fill="#27AE60" text-anchor="middle" font-weight="600">Ductile (Necking)</text>
        </g>
        
        <!-- Brittle -->
        <g transform="translate(250, 50)">
            <line x1="0" y1="20" x2="45" y2="20" stroke="#2C3E50" stroke-width="4" />
            <line x1="55" y1="20" x2="100" y2="20" stroke="#2C3E50" stroke-width="4" />
            <line x1="0" y1="60" x2="45" y2="60" stroke="#2C3E50" stroke-width="4" />
            <line x1="55" y1="60" x2="100" y2="60" stroke="#2C3E50" stroke-width="4" />
            <text x="50" y="90" font-size="12" fill="#E74C3C" text-anchor="middle" font-weight="600">Brittle (Clean Snap)</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Material Failure Modes: Ductile vs Brittle</text>` : ''}
    </svg>`;
}
