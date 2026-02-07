/**
 * Interdisciplinary Environmental Science Components
 * Greenhouse Effect, Ozone Layer, Acid Rain, Eutrophication, Bioaccumulation, etc.
 */

export interface EnvironmentalScienceOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create greenhouse effect visualization
 */
export function createGreenhouseEffect(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="180" width="400" height="50" fill="#2ECC71" opacity="0.6" /> <!-- Earth -->
        <rect x="0" y="60" width="400" height="40" fill="#3498DB" opacity="0.1" /> <!-- Atmosphere -->
        
        <!-- Sun rays -->
        <path d="M 50,0 L 100,180" stroke="#F1C40F" stroke-width="4" opacity="0.8" marker-end="url(#arrowhead)" />
        <text x="30" y="30" font-size="10" fill="#F39C12">Incoming Solar Radiation</text>
        
        <!-- Reflected heat -->
        <path d="M 120,180 Q 200,100 220,100 Q 240,100 200,180" fill="none" stroke="#E67E22" stroke-width="3" marker-end="url(#arrowhead)" />
        <text x="210" y="130" font-size="10" fill="#E67E22">Heat Trapped by GHGs</text>
        
        <!-- Escaped heat -->
        <path d="M 300,180 L 350,20" stroke="#E74C3C" stroke-width="2" marker-end="url(#arrowhead)" />
        <text x="330" y="50" font-size="10" fill="#E74C3C">Escaped Heat</text>
        
        <!-- Molecules -->
        <text x="100" y="85" font-size="12" fill="#2C3E50" font-weight="600">CO₂ CH₄ N₂O</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">The Greenhouse Effect</text>` : ''}
    </svg>`;
}

/**
 * Create ozone layer visualization
 */
export function createOzoneLayerDiagram(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="200" width="400" height="30" fill="#2C3E50" /> <!-- Earth -->
        <rect x="0" y="80" width="400" height="30" fill="#3498DB" opacity="0.4" /> <!-- Ozone Layer -->
        <text x="200" y="100" font-size="12" fill="white" text-anchor="middle" font-weight="600">OZONE LAYER (O₃)</text>
        
        <!-- UV Rays -->
        <path d="M 50,0 L 50,195" stroke="#9B59B6" stroke-width="3" marker-end="url(#arrowhead)" />
        <text x="60" y="40" font-size="10" fill="#8E44AD">UV-C (Blocked)</text>
        
        <path d="M 200,0 L 200,80" stroke="#9B59B6" stroke-width="2" />
        <path d="M 200,110 L 200,195" stroke="#9B59B6" stroke-width="1" opacity="0.4" marker-end="url(#arrowhead)" />
        <text x="210" y="40" font-size="10" fill="#8E44AD">UV-B (Partially Blocked)</text>
        
        <!-- CFCs -->
        <text x="300" y="140" font-size="10" fill="#E74C3C">CFCs Breaking O₃</text>
        <circle cx="280" cy="95" r="5" fill="#E74C3C" />
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Ozone Protection and Depletion</text>` : ''}
    </svg>`;
}

/**
 * Create acid rain formation visualization
 */
export function createAcidRainFormation(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Factory -->
        <rect x="20" y="160" width="60" height="40" fill="#7F8C8D" />
        <path d="M 30,160 L 30,140 M 50,160 L 50,140 M 70,160 L 70,140" stroke="#34495E" stroke-width="8" />
        
        <!-- Emissions -->
        <text x="90" y="130" font-size="10" fill="#2C3E50" font-weight="600">SO₂ & NOₓ</text>
        <path d="M 50,130 Q 100,100 150,80" fill="none" stroke="#7F8C8D" stroke-dasharray="5,3" marker-end="url(#arrowhead)" />
        
        <!-- Cloud and Reaction -->
        <path d="M 180,60 Q 200,30 230,50 Q 260,30 280,60 Q 300,80 260,90 Q 230,110 200,90 Q 160,80 180,60 Z" fill="#BDC3C7" />
        <text x="230" y="75" font-size="10" fill="#2C3E50">Reactions: H₂SO₄, HNO₃</text>
        
        <!-- Acid Rain -->
        <line x1="220" y1="100" x2="220" y2="150" stroke="#3498DB" stroke-dasharray="5,2" opacity="0.6" />
        <line x1="240" y1="100" x2="240" y2="150" stroke="#3498DB" stroke-dasharray="5,2" opacity="0.6" />
        <line x1="260" y1="100" x2="260" y2="150" stroke="#3498DB" stroke-dasharray="5,2" opacity="0.6" />
        
        <!-- Impact -->
        <text x="230" y="180" font-size="10" fill="#C0392B">Soil/Water Acidification</text>
        <path d="M 200,200 Q 250,190 300,200" fill="none" stroke="#27AE60" />
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Acid Rain Formation Process</text>` : ''}
    </svg>`;
}

/**
 * Create eutrophication cycle visualization
 */
export function createEutrophicationCycle(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Water body -->
        <rect x="0" y="100" width="400" height="100" fill="#3498DB" opacity="0.2" />
        
        <!-- 1. Nutrients -->
        <text x="50" y="50" font-size="10" fill="#2C3E50">1. Nutrient Runoff (P, N)</text>
        <path d="M 50,60 L 80,105" fill="none" stroke="#F1C40F" marker-end="url(#arrowhead)" />
        
        <!-- 2. Algal Bloom -->
        <rect x="100" y="100" width="200" height="10" fill="#27AE60" opacity="0.8" />
        <text x="200" y="90" font-size="10" fill="#27AE60" text-anchor="middle">2. Algal Bloom</text>
        
        <!-- 3. Decomposition -->
        <text x="200" y="140" font-size="10" fill="#7F8C8D" text-anchor="middle">3. Bacteria Decompose Algae</text>
        
        <!-- 4. Hypoxia -->
        <rect x="150" y="160" width="100" height="30" fill="#C0392B" opacity="0.4" />
        <text x="200" y="180" font-size="10" fill="white" text-anchor="middle">4. LOW OXYGEN (Dead Zone)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Eutrophication Process in Water Bodies</text>` : ''}
    </svg>`;
}

/**
 * Create bioaccumulation/biomagnification visualization
 */
export function createBiomagnificationDiagram(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 300, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Trophic Levels -->
        <g transform="translate(100, 20)">
            <!-- Producer -->
            <rect x="40" y="200" width="120" height="40" fill="#27AE60" opacity="0.2" />
            <text x="100" y="225" font-size="12" fill="#2C3E50" text-anchor="middle">Producers</text>
            <circle cx="60" cy="220" r="2" fill="#E74C3C" />
            
            <!-- Primary Consumer -->
            <rect x="50" y="150" width="100" height="40" fill="#27AE60" opacity="0.4" />
            <text x="100" y="175" font-size="12" fill="#2C3E50" text-anchor="middle">Herbivores</text>
            <circle cx="60" cy="170" r="2" fill="#E74C3C" />
            <circle cx="70" cy="170" r="2" fill="#E74C3C" />
            
            <!-- Secondary Consumer -->
            <rect x="60" y="100" width="80" height="40" fill="#27AE60" opacity="0.6" />
            <text x="100" y="125" font-size="12" fill="#2C3E50" text-anchor="middle">Carnivores</text>
            <circle cx="65" cy="120" r="2" fill="#E74C3C" />
            <circle cx="75" cy="120" r="2" fill="#E74C3C" />
            <circle cx="85" cy="120" r="2" fill="#E74C3C" />
            
            <!-- Apex Predator -->
            <rect x="70" y="50" width="60" height="40" fill="#27AE60" opacity="0.8" />
            <text x="100" y="75" font-size="12" fill="#2C3E50" text-anchor="middle">Apex</text>
            <circle cx="75" cy="65" r="3" fill="#E74C3C" />
            <circle cx="85" cy="65" r="3" fill="#E74C3C" />
            <circle cx="95" cy="65" r="3" fill="#E74C3C" />
            <circle cx="105" cy="65" r="3" fill="#E74C3C" />
        </g>
        
        <text x="320" y="150" font-size="12" fill="#E74C3C" font-weight="600">Toxic Concentration ↑</text>
        <path d="M 300,240 L 300,50" fill="none" stroke="#E74C3C" stroke-width="2" marker-end="url(#arrowhead)" />
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Biomagnification of Toxins</text>` : ''}
    </svg>`;
}

/**
 * Create renewable energy comparison visualization
 */
export function createRenewableEnergyComparison(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Solar -->
        <g transform="translate(30, 40)">
            <rect x="0" y="60" width="60" height="40" fill="#3498DB" />
            <line x1="0" y1="70" x2="60" y2="70" stroke="white" opacity="0.3" />
            <line x1="30" y1="60" x2="30" y2="100" stroke="white" opacity="0.3" />
            <text x="30" y="115" font-size="10" fill="#2C3E50" text-anchor="middle">Solar</text>
            <circle cx="30" cy="20" r="10" fill="#F1C40F" />
        </g>
        
        <!-- Wind -->
        <g transform="translate(150, 40)">
            <line x1="30" y1="40" x2="30" y2="100" stroke="#7F8C8D" stroke-width="2" />
            <path d="M 30,40 L 10,20 M 30,40 L 50,20 M 30,40 L 30,10" stroke="#7F8C8D" stroke-width="2" />
            <text x="30" y="115" font-size="10" fill="#2C3E50" text-anchor="middle">Wind</text>
        </g>
        
        <!-- Hydro -->
        <g transform="translate(270, 40)">
            <path d="M 0,100 Q 30,80 60,100" fill="none" stroke="#3498DB" stroke-width="4" />
            <rect x="25" y="60" width="10" height="40" fill="#7F8C8D" />
            <text x="30" y="115" font-size="10" fill="#2C3E50" text-anchor="middle">Hydro</text>
        </g>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Renewable Energy Sources</text>` : ''}
    </svg>`;
}

/**
 * Create carbon footprint sources visualization
 */
export function createCarbonFootprintSources(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <path d="M 200,40 C 250,40 280,100 200,180 C 120,100 150,40 200,40" fill="#34495E" opacity="0.2" stroke="#2C3E50" />
        <text x="200" y="100" font-size="12" fill="#2C3E50" text-anchor="middle" font-weight="600">CARBON FOOTPRINT</text>
        
        <!-- Sources -->
        <g font-size="10" fill="#2C3E50">
            <text x="50" y="50">🚗 Transport</text>
            <text x="50" y="80">💡 Housing</text>
            <text x="50" y="110">🍔 Food</text>
            <text x="280" y="50">🏭 Industry</text>
            <text x="280" y="80">✈️ Aviation</text>
            <text x="280" y="110">🗑 Waste</text>
        </g>
        
        <path d="M 200,180 L 200,220" stroke="#34495E" stroke-width="2" />
        <text x="200" y="235" font-size="10" fill="#C0392B" text-anchor="middle">Total CO₂e Emissions</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Major Sources of Carbon Footprint</text>` : ''}
    </svg>`;
}

/**
 * Create water treatment stages visualization
 */
export function createWaterTreatmentStages(options: EnvironmentalScienceOptions = {}): string {
    const { width = 450, height = 150, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Stages -->
        <rect x="20" y="40" width="70" height="40" rx="2" fill="#BDC3C7" stroke="#95A5A6" />
        <text x="55" y="65" font-size="9" fill="#2C3E50" text-anchor="middle">Coagulation</text>
        
        <path d="M 90,60 L 110,60" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        
        <rect x="110" y="40" width="70" height="40" rx="2" fill="#BDC3C7" stroke="#95A5A6" />
        <text x="145" y="65" font-size="9" fill="#2C3E50" text-anchor="middle">Sedimentation</text>
        
        <path d="M 180,60 L 200,60" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        
        <rect x="200" y="40" width="70" height="40" rx="2" fill="#BDC3C7" stroke="#95A5A6" />
        <text x="235" y="65" font-size="9" fill="#2C3E50" text-anchor="middle">Filtration</text>
        
        <path d="M 270,60 L 290,60" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        
        <rect x="290" y="40" width="70" height="40" rx="2" fill="#F1C40F" opacity="0.3" stroke="#F39C12" />
        <text x="325" y="65" font-size="9" fill="#2C3E50" text-anchor="middle">Disinfection</text>
        
        <path d="M 360,60 L 380,60" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        
        <text x="410" y="65" font-size="12" fill="#3498DB" font-weight="600">Clean Water</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Stages of Municipal Water Treatment</text>` : ''}
    </svg>`;
}

/**
 * Create waste management hierarchy visualization
 */
export function createWasteHierarchy(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 300, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,250 350,250 200,30" fill="none" stroke="#2C3E50" stroke-width="2" />
        
        <!-- REDUCE -->
        <path d="M 125,130 L 275,130" stroke="#2C3E50" />
        <text x="200" y="100" font-size="14" fill="#27AE60" text-anchor="middle" font-weight="600">REDUCE</text>
        
        <!-- REUSE -->
        <path d="M 100,170 L 300,170" stroke="#2C3E50" />
        <text x="200" y="155" font-size="12" fill="#F39C12" text-anchor="middle" font-weight="600">REUSE</text>
        
        <!-- RECYCLE -->
        <path d="M 75,210 L 325,210" stroke="#2C3E50" />
        <text x="200" y="195" font-size="11" fill="#3498DB" text-anchor="middle" font-weight="600">RECYCLE</text>
        
        <!-- DISPOSAL -->
        <text x="200" y="240" font-size="10" fill="#E74C3C" text-anchor="middle" font-weight="600">DISPOSAL (Landfill)</text>
        
        <text x="50" y="80" font-size="11" fill="#27AE60" font-weight="600">Best Option</text>
        <path d="M 40,100 L 40,240" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        <text x="35" y="170" font-size="10" transform="rotate(-90 35 170)" text-anchor="middle">Environmental Preference</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Waste Management Hierarchy</text>` : ''}
    </svg>`;
}

/**
 * Create climate change indicators visualization
 */
export function createClimateChangeIndicators(options: EnvironmentalScienceOptions = {}): string {
    const { width = 400, height = 250, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <!-- Axes for temp trend -->
        <line x1="40" y1="200" x2="360" y2="200" stroke="#2C3E50" />
        <line x1="40" y1="50" x2="40" y2="200" stroke="#2C3E50" />
        
        <!-- Temp Line -->
        <path d="M 40,180 L 120,175 L 200,150 L 280,100 L 360,40" fill="none" stroke="#E74C3C" stroke-width="3" />
        <text x="300" y="45" font-size="11" fill="#E74C3C" font-weight="600">Global Temperature ↑</text>
        
        <!-- CO2 Line -->
        <path d="M 40,195 L 360,60" fill="none" stroke="#34495E" stroke-width="2" stroke-dasharray="5,2" />
        <text x="300" y="90" font-size="10" fill="#34495E">Atmospheric CO₂ ↑</text>
        
        <!-- Sea Level -->
        <path d="M 40,200 Q 200,180 360,160" fill="none" stroke="#3498DB" stroke-width="2" />
        <text x="300" y="170" font-size="10" fill="#3498DB">Sea Level Rise ↑</text>
        
        <text x="200" y="220" font-size="10" fill="#2C3E50" text-anchor="middle">1880 - Present Day</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Key Indicators of Climate Change</text>` : ''}
    </svg>`;
}
