/**
 * Interdisciplinary Mathematical Modeling Components
 * Exponential Growth, SIR Model, Lotka-Volterra, Diffusion, Wave Equation, etc.
 */

export interface MathModelingOptions {
    width?: number;
    height?: number;
    showLabel?: boolean;
}

/**
 * Create exponential growth model visualization
 */
export function createExponentialGrowthModel(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="40" y1="170" x2="280" y2="170" stroke="#2C3E50" stroke-width="2" />
        <line x1="40" y1="20" x2="40" y2="170" stroke="#2C3E50" stroke-width="2" />
        
        <path d="M 40,165 Q 160,160 260,30" fill="none" stroke="#E74C3C" stroke-width="3" />
        
        <text x="160" y="190" font-size="10" fill="#2C3E50" text-anchor="middle">Time (t)</text>
        <text x="20" y="95" font-size="10" fill="#2C3E50" text-anchor="middle" transform="rotate(-90 20 95)">Population (N)</text>
        <text x="200" y="60" font-size="12" fill="#E74C3C" font-weight="600">N(t) = N₀eʳᵗ</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Exponential Growth Model</text>` : ''}
    </svg>`;
}

/**
 * Create logistic growth model visualization
 */
export function createLogisticGrowthModel(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="40" y1="170" x2="280" y2="170" stroke="#2C3E50" stroke-width="2" />
        <line x1="40" y1="20" x2="40" y2="170" stroke="#2C3E50" stroke-width="2" />
        
        <!-- Carrying Capacity line -->
        <line x1="40" y1="40" x2="280" y2="40" stroke="#7F8C8D" stroke-width="1" stroke-dasharray="5,3" />
        <text x="240" y="35" font-size="10" fill="#7F8C8D">Carrying Capacity (K)</text>
        
        <!-- Logistic Curve (S-shaped) -->
        <path d="M 40,165 C 100,160 140,45 280,42" fill="none" stroke="#27AE60" stroke-width="3" />
        
        <text x="160" y="190" font-size="10" fill="#2C3E50" text-anchor="middle">Time (t)</text>
        <text x="150" y="80" font-size="11" fill="#27AE60" font-weight="600">dN/dt = rN(1 - N/K)</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Logistic Growth Model</text>` : ''}
    </svg>`;
}

/**
 * Create SIR epidemic model visualization
 */
export function createSIRModel(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="40" y1="170" x2="280" y2="170" stroke="#2C3E50" stroke-width="2" />
        <line x1="40" y1="20" x2="40" y2="170" stroke="#2C3E50" stroke-width="2" />
        
        <!-- Susceptible (S) - Blue -->
        <path d="M 40,30 C 80,30 120,60 280,165" fill="none" stroke="#3498DB" stroke-width="2" />
        <!-- Infected (I) - Red -->
        <path d="M 40,165 C 80,160 120,40 280,160" fill="none" stroke="#E74C3C" stroke-width="3" />
        <!-- Recovered (R) - Green -->
        <path d="M 40,170 C 140,170 180,35 280,32" fill="none" stroke="#27AE60" stroke-width="2" />
        
        <text x="60" y="50" font-size="10" fill="#3498DB">S</text>
        <text x="130" y="60" font-size="10" fill="#E74C3C">I</text>
        <text x="250" y="50" font-size="10" fill="#27AE60">R</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">SIR Epidemic Model</text>` : ''}
    </svg>`;
}

/**
 * Create Lotka-Volterra predator-prey model visualization
 */
export function createLotkaVolterraModel(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="30" y1="170" x2="280" y2="170" stroke="#2C3E50" stroke-width="1.5" />
        <line x1="30" y1="20" x2="30" y2="170" stroke="#2C3E50" stroke-width="1.5" />
        
        <!-- Prey (leads) - Green -->
        <path d="M 30,120 Q 55,40 80,120 Q 105,200 130,120 Q 155,40 180,120 Q 205,200 230,120 Q 255,40 280,120" 
              fill="none" stroke="#27AE60" stroke-width="2" />
        <!-- Predator (lags) - Red -->
        <path d="M 30,150 Q 75,40 120,150 Q 165,260 210,150 Q 255,40 300,150" 
              fill="none" stroke="#E74C3C" stroke-width="2" stroke-dasharray="4,2" />
        
        <text x="250" y="60" font-size="10" fill="#27AE60">Prey</text>
        <text x="250" y="80" font-size="10" fill="#E74C3C">Predator</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Lotka-Volterra Predator-Prey Model</text>` : ''}
    </svg>`;
}

/**
 * Create diffusion equation visualization
 */
export function createDiffusionEquation(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="170" x2="280" y2="170" stroke="#2C3E50" />
        
        <!-- Concentration at t=0 -->
        <path d="M 120,170 L 150,40 L 180,170" fill="#E74C3C" opacity="0.3" stroke="#E74C3C" />
        
        <!-- Concentration at t=1 -->
        <path d="M 80,170 Q 150,80 220,170" fill="none" stroke="#3498DB" stroke-width="2" />
        
        <!-- Concentration at t=2 -->
        <path d="M 40,170 Q 150,130 260,170" fill="none" stroke="#27AE60" stroke-width="2" />
        
        <text x="200" y="60" font-size="10" fill="#E74C3C">t=0</text>
        <text x="240" y="100" font-size="10" fill="#3498DB">t=1</text>
        <text x="270" y="140" font-size="10" fill="#27AE60">t=2</text>
        
        <text x="150" y="30" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">∂u/∂t = α∇²u</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Diffusion Equation Visualization</text>` : ''}
    </svg>`;
}

/**
 * Create wave equation visualization
 */
export function createWaveEquation(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="100" x2="280" y2="100" stroke="#BDC3C7" stroke-dasharray="4,2" />
        
        <!-- Fundamental -->
        <path d="M 40,100 Q 150,20 260,100" fill="none" stroke="#E74C3C" stroke-width="2" />
        <!-- 2nd Harmonic -->
        <path d="M 40,100 Q 95,40 150,100 Q 205,160 260,100" fill="none" stroke="#3498DB" stroke-width="1.5" />
        
        <text x="150" y="180" font-size="11" fill="#2C3E50" text-anchor="middle" font-weight="600">∂²u/∂t² = c²∇²u</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Wave Equation (Vibrating String)</text>` : ''}
    </svg>`;
}

/**
 * Create optimization problem feasible region visualization
 */
export function createOptimizationProblem(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <line x1="40" y1="160" x2="260" y2="160" stroke="#2C3E50" stroke-width="1.5" />
        <line x1="40" y1="20" x2="40" y2="160" stroke="#2C3E50" stroke-width="1.5" />
        
        <!-- Constraints -->
        <line x1="40" y1="40" x2="200" y2="160" stroke="#E74C3C" stroke-width="2" />
        <line x1="40" y1="100" x2="200" y2="40" stroke="#3498DB" stroke-width="2" />
        
        <!-- Feasible Region -->
        <polygon points="40,100 135,62 163,160 40,160" fill="#27AE60" opacity="0.3" stroke="#27AE60" />
        <text x="80" y="130" font-size="10" fill="#2C3E50" font-weight="600">Feasible Region</text>
        
        <text x="220" y="40" font-size="10" fill="#2C3E50">Maximize: Ax + By</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Optimization: Linear Programming</text>` : ''}
    </svg>`;
}

/**
 * Create game theory payoff matrix visualization
 */
export function createGameTheoryMatrix(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="40" width="160" height="120" fill="none" stroke="#2C3E50" stroke-width="1" />
        <line x1="160" y1="40" x2="160" y2="160" stroke="#2C3E50" />
        <line x1="80" y1="100" x2="240" y2="100" stroke="#2C3E50" />
        
        <text x="120" y="75" font-size="12" fill="#2C3E50" text-anchor="middle">(-1, -1)</text>
        <text x="200" y="75" font-size="12" fill="#2C3E50" text-anchor="middle">(-10, 0)</text>
        <text x="120" y="135" font-size="12" fill="#2C3E50" text-anchor="middle">(0, -10)</text>
        <text x="200" y="135" font-size="12" fill="#2C3E50" text-anchor="middle">(-5, -5)</text>
        
        <text x="40" y="75" font-size="10" fill="#2C3E50" text-anchor="middle">Strategy A</text>
        <text x="40" y="135" font-size="10" fill="#2C3E50" text-anchor="middle">Strategy B</text>
        <text x="120" y="30" font-size="10" fill="#2C3E50" text-anchor="middle">Strategy 1</text>
        <text x="200" y="30" font-size="10" fill="#2C3E50" text-anchor="middle">Strategy 2</text>
        
        <text x="160" y="180" font-size="11" fill="#E67E22" font-weight="600">Prisoner's Dilemma Matrix</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Game Theory: Payoff Matrix</text>` : ''}
    </svg>`;
}

/**
 * Create Markov Chain transition diagram
 */
export function createMarkovChain(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="30" fill="#3498DB" opacity="0.2" stroke="#3498DB" stroke-width="2" />
        <text x="100" y="105" font-size="14" fill="#2C3E50" text-anchor="middle">S₁</text>
        
        <circle cx="200" cy="100" r="30" fill="#27AE60" opacity="0.2" stroke="#27AE60" stroke-width="2" />
        <text x="200" y="105" font-size="14" fill="#2C3E50" text-anchor="middle">S₂</text>
        
        <!-- Transitions -->
        <path d="M 130,90 Q 150,70 170,90" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        <text x="150" y="75" font-size="10">0.4</text>
        
        <path d="M 170,110 Q 150,130 130,110" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        <text x="150" y="135" font-size="10">0.3</text>
        
        <!-- Self loops -->
        <path d="M 80,80 Q 50,50 80,120" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        <text x="45" y="80" font-size="10">0.6</text>
        
        <path d="M 220,80 Q 250,50 220,120" fill="none" stroke="#2C3E50" marker-end="url(#arrowhead)" />
        <text x="255" y="80" font-size="10">0.7</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Markov Chain Transition Diagram</text>` : ''}
    </svg>`;
}

/**
 * Create Monte Carlo simulation visualization
 */
export function createMonteCarloSimulation(options: MathModelingOptions = {}): string {
    const { width = 300, height = 200, showLabel = true } = options;
    return `
    <svg width="${width}" height="${height + 20}" viewBox="0 0 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="20" width="140" height="140" fill="none" stroke="#2C3E50" stroke-width="2" />
        <circle cx="120" cy="90" r="70" fill="none" stroke="#E74C3C" stroke-width="2" />
        
        <!-- Random points -->
        ${Array.from({ length: 40 }).map(() => {
        const x = 50 + Math.random() * 140;
        const y = 20 + Math.random() * 140;
        const dist = Math.sqrt(Math.pow(x - 120, 2) + Math.pow(y - 90, 2));
        const inside = dist <= 70;
        return `<circle cx="${x}" cy="${y}" r="2" fill="${inside ? '#27AE60' : '#E74C3C'}" />`;
    }).join('')}
        
        <text x="210" y="50" font-size="10" fill="#2C3E50">Total Points: 40</text>
        <text x="210" y="70" font-size="10" fill="#27AE60">Inside Circle: N</text>
        <text x="210" y="100" font-size="10" fill="#2C3E50" font-weight="600">π ≈ 4 × (N / Total)</text>
        
        <text x="160" y="180" font-size="11" fill="#9B59B6" text-anchor="middle">Monte Carlo Pi Estimation</text>
        
        ${showLabel ? `<text x="${width / 2}" y="${height + 15}" font-size="12" font-family="Arial" fill="#2C3E50" text-anchor="middle">Monte Carlo Simulation</text>` : ''}
    </svg>`;
}
