/**
 * Interdisciplinary Biochemistry Components
 * Glycolysis, Krebs Cycle, ETC, Photosynthesis, Signal Transduction, etc.
 */

export interface InterdisciplinaryBiochemistryOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create glycolysis pathway visualization
 */
export function createGlycolysisPathway(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 300, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#2C3E50" />
            </marker>
        </defs>
        
        <!-- Glucose start -->
        <rect x="150" y="20" width="100" height="40" rx="5" fill="#3498DB" opacity="0.2" stroke="#3498DB" stroke-width="2" />
        <text x="200" y="45" font-size="14" fill="#2C3E50" text-anchor="middle" font-weight="600">Glucose (C6)</text>
        
        <!-- Investment Phase -->
        <line x1="200" y1="60" x2="200" y2="100" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
        <text x="210" y="85" font-size="10" fill="#E74C3C">2 ATP → 2 ADP</text>
        
        <!-- Intermediate -->
        <rect x="130" y="110" width="140" height="40" rx="5" fill="#9B59B6" opacity="0.2" stroke="#9B59B6" stroke-width="2" />
        <text x="200" y="135" font-size="12" fill="#2C3E50" text-anchor="middle">Fructose-1,6-bisphosphate</text>
        
        <!-- Payoff Phase -->
        <path d="M 200,150 L 200,180 L 100,220" fill="none" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
        <path d="M 200,150 L 200,180 L 300,220" fill="none" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
        
        <!-- Pyruvate end -->
        <rect x="50" y="230" width="100" height="40" rx="5" fill="#27AE60" opacity="0.2" stroke="#27AE60" stroke-width="2" />
        <text x="100" y="255" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">Pyruvate (C3)</text>
        
        <rect x="250" y="230" width="100" height="40" rx="5" fill="#27AE60" opacity="0.2" stroke="#27AE60" stroke-width="2" />
        <text x="300" y="255" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">Pyruvate (C3)</text>
        
        <text x="100" y="210" font-size="10" fill="#27AE60">2 ATP + NADH</text>
        <text x="300" y="210" font-size="10" fill="#27AE60">2 ATP + NADH</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Glycolysis Pathway</text>` : ''}
    </svg>`;
}

/**
 * Create Krebs Cycle visualization
 */
export function createKrebsCycle(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 300, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="150" r="80" fill="none" stroke="#3498DB" stroke-width="2" stroke-dasharray="5,5" />
        
        <!-- Inputs -->
        <rect x="160" y="20" width="80" height="30" rx="3" fill="#E67E22" opacity="0.2" stroke="#E67E22" />
        <text x="200" y="40" font-size="11" fill="#2C3E50" text-anchor="middle">Acetyl-CoA</text>
        <line x1="200" y1="50" x2="200" y2="70" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
        
        <!-- Steps around the circle -->
        <circle cx="200" cy="70" r="15" fill="#F1C40F" opacity="0.6" stroke="#C0392B" />
        <text x="200" y="74" font-size="10" fill="#2C3E50" text-anchor="middle">Citrate</text>
        
        <circle cx="280" cy="150" r="15" fill="#F1C40F" opacity="0.6" stroke="#C0392B" />
        <text x="280" y="154" font-size="9" fill="#2C3E50" text-anchor="middle">α-Ketoglutarate</text>
        
        <circle cx="200" cy="230" r="15" fill="#F1C40F" opacity="0.6" stroke="#C0392B" />
        <text x="200" y="234" font-size="10" fill="#2C3E50" text-anchor="middle">Succinate</text>
        
        <circle cx="120" cy="150" r="15" fill="#F1C40F" opacity="0.6" stroke="#C0392B" />
        <text x="120" y="154" font-size="9" fill="#2C3E50" text-anchor="middle">Oxaloacetate</text>
        
        <!-- Outputs -->
        <text x="320" y="100" font-size="10" fill="#27AE60">NADH + CO₂</text>
        <text x="320" y="200" font-size="10" fill="#27AE60">NADH + CO₂</text>
        <text x="150" y="260" font-size="10" fill="#27AE60">ATP / GTP</text>
        <text x="60" y="200" font-size="10" fill="#27AE60">FADH₂</text>
        <text x="60" y="100" font-size="10" fill="#27AE60">NADH</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Krebs Cycle (Citric Acid Cycle)</text>` : ''}
    </svg>`;
}

/**
 * Create Electron Transport Chain visualization
 */
export function createElectronTransportChain(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Mitochondrial Membrane -->
        <rect x="0" y="80" width="400" height="40" fill="#BDC3C7" opacity="0.3" />
        <line x1="0" y1="80" x2="400" y2="80" stroke="#7F8C8D" stroke-width="2" />
        <line x1="0" y1="120" x2="400" y2="120" stroke="#7F8C8D" stroke-width="2" />
        
        <!-- Protein Complexes -->
        <rect x="40" y="70" width="40" height="60" rx="5" fill="#3498DB" stroke="#2980B9" />
        <text x="60" y="105" font-size="12" fill="white" text-anchor="middle">I</text>
        
        <rect x="120" y="70" width="40" height="60" rx="5" fill="#3498DB" stroke="#2980B9" />
        <text x="140" y="105" font-size="12" fill="white" text-anchor="middle">III</text>
        
        <rect x="200" y="70" width="40" height="60" rx="5" fill="#3498DB" stroke="#2980B9" />
        <text x="220" y="105" font-size="12" fill="white" text-anchor="middle">IV</text>
        
        <!-- ATP Synthase -->
        <rect x="300" y="60" width="50" height="80" rx="10" fill="#F1C40F" stroke="#F39C12" />
        <text x="325" y="105" font-size="10" fill="#2C3E50" text-anchor="middle">ATP Synthase</text>
        
        <!-- H+ Gradient -->
        <text x="100" y="40" font-size="12" fill="#3498DB" font-weight="600">H+ H+ H+ H+</text>
        <path d="M 60,70 L 60,30" fill="none" stroke="#2C3E50" stroke-width="1.5" marker-end="url(#arrowhead)" />
        <path d="M 140,70 L 140,30" fill="none" stroke="#2C3E50" stroke-width="1.5" marker-end="url(#arrowhead)" />
        <path d="M 220,70 L 220,30" fill="none" stroke="#2C3E50" stroke-width="1.5" marker-end="url(#arrowhead)" />
        
        <!-- H+ drive through ATP synthase -->
        <path d="M 325,30 L 325,60" fill="none" stroke="#E67E22" stroke-width="2" marker-end="url(#arrowhead)" />
        <text x="325" y="160" font-size="12" fill="#27AE60" font-weight="600">ATP</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Electron Transport Chain</text>` : ''}
    </svg>`;
}

/**
 * Create photosynthesis light reactions visualization
 */
export function createPhotosynthesisLightReactions(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="80" width="400" height="40" fill="#27AE60" opacity="0.2" />
        
        <!-- PSII -->
        <rect x="50" y="70" width="60" height="60" rx="5" fill="#27AE60" stroke="#1E8449" />
        <text x="80" y="105" font-size="12" fill="white" text-anchor="middle">PS II</text>
        
        <!-- Sunlight -->
        <line x1="20" y1="20" x2="60" y2="70" stroke="#F1C40F" stroke-width="3" opacity="0.8" />
        <circle cx="20" cy="20" r="15" fill="#F1C40F" opacity="0.5" />
        
        <!-- PSI -->
        <rect x="200" y="70" width="60" height="60" rx="5" fill="#27AE60" stroke="#1E8449" />
        <text x="230" y="105" font-size="12" fill="white" text-anchor="middle">PS I</text>
        
        <!-- Electron path -->
        <path d="M 110,100 L 200,100" fill="none" stroke="#2C3E50" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#arrowhead)" />
        <text x="155" y="90" font-size="10" fill="#2C3E50">e- transport</text>
        
        <!-- Products -->
        <text x="300" y="110" font-size="12" fill="#3498DB" font-weight="600">NADPH</text>
        <text x="300" y="140" font-size="12" fill="#E67E22" font-weight="600">ATP</text>
        
        <!-- Water splitting -->
        <text x="40" y="160" font-size="10" fill="#3498DB">H₂O → ½O₂ + 2H⁺</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Photosynthesis: Light Reactions</text>` : ''}
    </svg>`;
}

/**
 * Create photosynthesis dark reactions (Calvin cycle) visualization
 */
export function createCalvinCycle(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 300, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="150" r="80" fill="none" stroke="#1E8449" stroke-width="2" />
        
        <!-- CO2 Input -->
        <text x="200" y="30" font-size="14" fill="#E74C3C" text-anchor="middle" font-weight="600">Carbon Fixation (CO₂)</text>
        <path d="M 200,40 L 200,70" fill="none" stroke="#C0392B" stroke-width="2" marker-end="url(#arrowhead)" />
        
        <!-- Enzyme -->
        <circle cx="200" cy="90" r="20" fill="#BDC3C7" stroke="#7F8C8D" />
        <text x="200" y="94" font-size="10" fill="#2C3E50" text-anchor="middle">Rubisco</text>
        
        <!-- Phases -->
        <text x="330" y="150" font-size="12" fill="#1E8449" font-weight="600">Reduction</text>
        <path d="M 300,150 L 330,170" fill="none" stroke="#1E8449" stroke-width="1.5" />
        <text x="340" y="180" font-size="10" fill="#2C3E50">ATP & NADPH used</text>
        
        <text x="120" y="270" font-size="12" fill="#E67E22" font-weight="600">Regeneration</text>
        <text x="120" y="285" font-size="10" fill="#2C3E50">RuBP restored</text>
        
        <!-- Sugars exit -->
        <path d="M 280,200 L 340,240" fill="none" stroke="#3498DB" stroke-width="2" marker-end="url(#arrowhead)" />
        <text x="350" y="260" font-size="14" fill="#27AE60" font-weight="600">Sugars (G3P)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Calvin Cycle (Light-Independent Reactions)</text>` : ''}
    </svg>`;
}

/**
 * Create DNA Transcription visualization
 */
export function createDNATranscription(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- DNA Bubble -->
        <path d="M 50,80 L 120,80 Q 200,40 280,80 L 350,80" fill="none" stroke="#3498DB" stroke-width="2" />
        <path d="M 50,110 L 120,110 Q 200,150 280,110 L 350,110" fill="none" stroke="#3498DB" stroke-width="2" />
        
        <!-- RNA Polymerase -->
        <ellipse cx="200" cy="95" rx="60" ry="40" fill="#E67E22" opacity="0.3" stroke="#D35400" stroke-width="2" />
        <text x="200" y="99" font-size="10" fill="#2C3E50" text-anchor="middle">RNA Polymerase</text>
        
        <!-- mRNA Transcript -->
        <path d="M 120,110 L 180,110 Q 240,110 280,180" fill="none" stroke="#E74C3C" stroke-width="3" />
        <text x="260" y="190" font-size="12" fill="#E74C3C" font-weight="600">mRNA</text>
        
        <!-- Nucleotides -->
        <text x="300" y="50" font-size="10" fill="#3498DB">G A T C (DNA)</text>
        <text x="200" y="140" font-size="10" fill="#E74C3C">U A G C (RNA)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">DNA Transcription</text>` : ''}
    </svg>`;
}

/**
 * Create Translation Process visualization
 */
export function createTranslationProcess(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Ribosome -->
        <path d="M 100,150 Q 200,100 300,150 L 320,200 Q 200,230 80,200 Z" fill="#9B59B6" opacity="0.2" stroke="#8E44AD" />
        <text x="200" y="215" font-size="12" fill="#2C3E50" text-anchor="middle">Ribosome (Large & Small subunits)</text>
        
        <!-- mRNA -->
        <rect x="50" y="155" width="300" height="10" fill="#E74C3C" opacity="0.5" />
        <text x="360" y="165" font-size="10" fill="#E74C3C">mRNA</text>
        
        <!-- tRNA -->
        <rect x="150" y="80" width="30" height="50" rx="2" fill="#F1C40F" stroke="#F39C12" />
        <text x="165" y="110" font-size="8" fill="#2C3E50" text-anchor="middle">tRNA</text>
        <circle cx="165" cy="70" r="10" fill="#E67E22" />
        <text x="165" y="74" font-size="8" fill="white" text-anchor="middle">AA</text>
        
        <!-- Nascent protein chain -->
        <circle cx="210" cy="50" r="8" fill="#E67E22" />
        <circle cx="230" cy="40" r="8" fill="#E67E22" />
        <circle cx="250" cy="45" r="8" fill="#E67E22" />
        <text x="280" y="45" font-size="10" fill="#E67E22" font-weight="600">Polypeptide chain</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Translation (Protein Synthesis)</text>` : ''}
    </svg>`;
}

/**
 * Create Enzyme Regulation visualization
 */
export function createEnzymeRegulation(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Competitive Inhibition -->
        <g transform="translate(0, 50)">
            <path d="M 50,50 Q 75,25 100,50 L 100,80 L 50,80 Z" fill="#3498DB" opacity="0.4" stroke="#2980B9" />
            <text x="75" y="95" font-size="10" fill="#2C3E50" text-anchor="middle">Enzyme</text>
            
            <!-- Substrate -->
            <path d="M 60,30 Q 75,10 90,30" fill="none" stroke="#27AE60" stroke-width="2" marker-end="url(#arrowhead)" />
            <text x="75" y="5" font-size="9" fill="#27AE60" text-anchor="middle">Substrate</text>
            
            <!-- Inhibitor -->
            <rect x="65" y="15" width="20" height="20" fill="#E74C3C" stroke="#C0392B" />
            <text x="75" y="45" font-size="9" fill="#E74C3C" text-anchor="middle" font-weight="600">Block</text>
            <text x="75" y="120" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">Competitive</text>
        </g>
        
        <!-- Allosteric Inhibition -->
        <g transform="translate(200, 50)">
            <path d="M 50,50 Q 75,25 100,50 L 100,80 Q 75,100 50,80 Z" fill="#3498DB" opacity="0.4" stroke="#2980B9" />
            
            <!-- Allosteric site -->
            <rect x="40" y="70" width="15" height="15" fill="#9B59B6" stroke="#8E44AD" />
            <text x="30" y="100" font-size="8" fill="#9B59B6">Effector</text>
            
            <text x="75" y="120" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">Allosteric</text>
            <text x="75" y="135" font-size="9" fill="#7F8C8D" text-anchor="middle">(Changes shape)</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Enzyme Regulation Mechanisms</text>` : ''}
    </svg>`;
}

/**
 * Create Metabolic Pathways visualization (Anabolic vs Catabolic)
 */
export function createMetabolicPathways(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Catabolic -->
        <g transform="translate(50, 50)">
            <rect x="0" y="0" width="80" height="40" rx="5" fill="#3498DB" opacity="0.2" stroke="#3498DB" />
            <text x="40" y="25" font-size="10" fill="#2C3E50" text-anchor="middle">Complex Molecules</text>
            
            <path d="M 40,40 L 40,100" fill="none" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
            <text x="60" y="70" font-size="10" fill="#E67E22" font-weight="600">Energy (ATP) OUT</text>
            
            <circle cx="20" cy="120" r="10" fill="#BDC3C7" />
            <circle cx="60" cy="120" r="10" fill="#BDC3C7" />
            <text x="40" y="145" font-size="10" fill="#2C3E50" text-anchor="middle">Simple Units</text>
            <text x="40" y="-10" font-size="12" fill="#C0392B" text-anchor="middle" font-weight="600">CATABOLISM</text>
        </g>
        
        <!-- Anabolic -->
        <g transform="translate(250, 50)">
            <circle cx="20" cy="120" r="10" fill="#BDC3C7" />
            <circle cx="60" cy="120" r="10" fill="#BDC3C7" />
            
            <path d="M 40,100 L 40,40" fill="none" stroke="#2C3E50" stroke-width="2" marker-end="url(#arrowhead)" />
            <text x="-30" y="70" font-size="10" fill="#3498DB" font-weight="600">Energy (ATP) IN</text>
            
            <rect x="0" y="0" width="80" height="40" rx="5" fill="#27AE60" opacity="0.2" stroke="#27AE60" />
            <text x="40" y="25" font-size="10" fill="#2C3E50" text-anchor="middle">Complex Molecules</text>
            <text x="40" y="-10" font-size="12" fill="#27AE60" text-anchor="middle" font-weight="600">ANABOLISM</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Metabolic Pathways: Energy Exchange</text>` : ''}
    </svg>`;
}

/**
 * Create Signal Transduction visualization
 */
export function createSignalTransduction(options: InterdisciplinaryBiochemistryOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Membrane -->
        <rect x="0" y="60" width="400" height="30" fill="#95A5A6" opacity="0.3" />
        
        <!-- GPCR Receptor -->
        <path d="M 50,40 L 50,110 M 60,40 L 60,110 M 70,40 L 70,110" fill="none" stroke="#3498DB" stroke-width="4" stroke-linecap="round" />
        <text x="60" y="30" font-size="10" fill="#3498DB" text-anchor="middle">Receptor</text>
        
        <!-- Ligand -->
        <circle cx="60" cy="15" r="8" fill="#E74C3C" />
        <text x="35" y="18" font-size="9" fill="#E74C3C">Ligand</text>
        
        <!-- G-Protein -->
        <ellipse cx="120" cy="100" rx="30" ry="20" fill="#F1C40F" opacity="0.6" stroke="#F39C12" />
        <text x="120" y="104" font-size="9" fill="#2C3E50" text-anchor="middle">G-Protein</text>
        
        <!-- Second Messenger -->
        <path d="M 150,100 L 220,120" fill="none" stroke="#2C3E50" stroke-width="1.5" marker-end="url(#arrowhead)" />
        <circle cx="240" cy="130" r="10" fill="#9B59B6" opacity="0.4" />
        <text x="240" y="150" font-size="9" fill="#9B59B6" text-anchor="middle">cAMP</text>
        
        <!-- Cellular Response -->
        <rect x="280" y="160" width="100" height="50" rx="5" fill="#27AE60" opacity="0.2" stroke="#27AE60" />
        <text x="330" y="190" font-size="10" fill="#2C3E50" text-anchor="middle">Cellular Response</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Signal Transduction (GPCR Pathway)</text>` : ''}
    </svg>`;
}
