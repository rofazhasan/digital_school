/**
 * Physics Electricity & Circuits Diagram Presets
 * Circuit diagrams and electrical components
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG circuit elements
 */
function createCircuitDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
    return {
        id,
        width,
        height,
        points: [],
        forces: [],
        moments: [],
        showAxes: false,
        showGrid: false,
        customSVG: elements.join('\n'),
    };
}

/**
 * Series circuit
 * @param id Diagram ID
 * @param components Array of component types
 */
export function createSeriesCircuit(id: string, ...components: string[]): FBDDiagram {
    if (components.length === 0) {
        components = ['battery', 'resistor', 'resistor', 'bulb'];
    }
    const width = 600;
    const height = 400;
    const elements: string[] = [];

    // Circuit wire with soft glow
    elements.push(`<path d="M 100 200 L 500 200 L 500 300 L 100 300 Z" fill="none" stroke="#2c3e50" stroke-width="2" stroke-linejoin="round"/>`);

    // Current direction marker
    elements.push(`<path d="M 300 195 L 320 195" stroke="#e74c3c" stroke-width="2" marker-end="url(#arrowhead)" filter="url(#vector-glow)"/>`);
    elements.push(`<text x="310" y="185" font-size="12" fill="#e74c3c" text-anchor="middle" font-style="italic">I</text>`);

    // Add components
    let x = 150;
    const y = 200;

    components.forEach((comp, idx) => {
        switch (comp) {
            case 'battery':
                elements.push(`
          <line x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" stroke="#333" stroke-width="4"/>
          <line x1="${x + 10}" y1="${y - 30}" x2="${x + 10}" y2="${y + 30}" stroke="#333" stroke-width="2"/>
          <text x="${x}" y="${y - 35}" font-size="12" text-anchor="middle">+</text>
          <text x="${x + 10}" y="${y - 35}" font-size="12" text-anchor="middle">-</text>
        `);
                break;
            case 'resistor':
                elements.push(`
          <path d="M ${x - 20} ${y} L ${x - 15} ${y} L ${x - 12} ${y - 12} L ${x - 6} ${y + 12} L ${x} ${y - 12} L ${x + 6} ${y + 12} L ${x + 12} ${y - 12} L ${x + 15} ${y} L ${x + 20} ${y}" 
                fill="none" stroke="#2c3e50" stroke-width="2"/>
          <text x="${x}" y="${y + 30}" font-size="11" fill="#34495e" text-anchor="middle" font-weight="600">R${idx}</text>
        `);
                break;
            case 'bulb':
                elements.push(`
          <circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#333" stroke-width="2"/>
          <line x1="${x - 10}" y1="${y - 10}" x2="${x + 10}" y2="${y + 10}" stroke="#333" stroke-width="1"/>
          <line x1="${x - 10}" y1="${y + 10}" x2="${x + 10}" y2="${y - 10}" stroke="#333" stroke-width="1"/>
          <text x="${x}" y="${y + 30}" font-size="10" text-anchor="middle">Bulb</text>
        `);
                break;
            case 'switch':
                elements.push(`
          <line x1="${x - 15}" y1="${y}" x2="${x + 15}" y2="${y - 10}" stroke="#333" stroke-width="2"/>
          <circle cx="${x - 15}" cy="${y}" r="2" fill="#333"/>
          <circle cx="${x + 15}" cy="${y}" r="2" fill="#333"/>
          <text x="${x}" y="${y + 25}" font-size="10" text-anchor="middle">S</text>
        `);
                break;
        }
        x += 100;
    });

    return createCircuitDiagram(id, width, height, elements);
}

/**
 * Parallel circuit
 * @param id Diagram ID
 */
export function createParallelCircuit(id: string): FBDDiagram {
    const width = 600;
    const height = 500;
    const elements: string[] = [];

    // Main circuit paths
    elements.push(`
    <path d="M 100 250 L 200 250" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M 200 250 L 200 150 L 400 150" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M 200 250 L 200 350 L 400 350" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M 400 150 L 500 150 L 500 250" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M 400 350 L 500 350 L 500 250" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M 500 250 L 600 250" stroke="#333" stroke-width="3" fill="none"/>
  `);

    // Battery
    elements.push(`
    <line x1="100" y1="230" x2="100" y2="270" stroke="#333" stroke-width="4"/>
    <line x1="110" y1="220" x2="110" y2="280" stroke="#333" stroke-width="2"/>
    <text x="100" y="210" font-size="12" text-anchor="middle">V</text>
  `);

    // Resistors in parallel
    elements.push(`
    <path d="M 285 150 L 290 140 L 300 160 L 310 140 L 315 150" fill="none" stroke="#333" stroke-width="2"/>
    <text x="300" y="135" font-size="10" text-anchor="middle">R₁</text>
    
    <path d="M 285 350 L 290 340 L 300 360 L 310 340 L 315 350" fill="none" stroke="#333" stroke-width="2"/>
    <text x="300" y="375" font-size="10" text-anchor="middle">R₂</text>
  `);

    return createCircuitDiagram(id, width, height, elements);
}

/**
 * Individual circuit components
 */
export function createResistor(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 100, [
        `<path d="M 20 50 L 40 50 L 50 30 L 70 70 L 90 30 L 110 70 L 130 30 L 150 50 L 180 50" 
           fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="90" font-size="14" text-anchor="middle">Resistor (R)</text>`
    ]);
}

export function createCapacitor(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 100, [
        `<line x1="20" y1="50" x2="180" y2="50" stroke="#2c3e50" stroke-width="2" stroke-dasharray="0 85 30 85 0"/>`,
        `<line x1="85" y1="20" x2="85" y2="80" stroke="#2c3e50" stroke-width="3" stroke-linecap="round"/>`,
        `<line x1="115" y1="20" x2="115" y2="80" stroke="#2c3e50" stroke-width="3" stroke-linecap="round"/>`,
        `<text x="100" y="100" font-size="14" fill="#34495e" text-anchor="middle" font-weight="600">Capacitor (C)</text>`
    ]);
}

export function createInductor(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 100, [
        `<line x1="20" y1="50" x2="50" y2="50" stroke="#333" stroke-width="3"/>`,
        `<path d="M 50 50 Q 60 30 70 50 T 90 50 T 110 50 T 130 50 T 150 50" fill="none" stroke="#333" stroke-width="3"/>`,
        `<line x1="150" y1="50" x2="180" y2="50" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="90" font-size="14" text-anchor="middle">Inductor (L)</text>`
    ]);
}

export function createBattery(id: string, voltage: number = 12): FBDDiagram {
    return createCircuitDiagram(id, 200, 150, [
        `<line x1="20" y1="75" x2="70" y2="75" stroke="#333" stroke-width="3"/>`,
        `<line x1="70" y1="50" x2="70" y2="100" stroke="#333" stroke-width="5"/>`,
        `<line x1="90" y1="40" x2="90" y2="110" stroke="#333" stroke-width="3"/>`,
        `<line x1="90" y1="75" x2="180" y2="75" stroke="#333" stroke-width="3"/>`,
        `<text x="70" y="30" font-size="16" text-anchor="middle">+</text>`,
        `<text x="90" y="30" font-size="16" text-anchor="middle">−</text>`,
        `<text x="100" y="130" font-size="14" text-anchor="middle">${voltage}V</text>`
    ]);
}

export function createAmmeter(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 150, [
        `<line x1="20" y1="75" x2="60" y2="75" stroke="#333" stroke-width="3"/>`,
        `<circle cx="100" cy="75" r="35" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="85" font-size="24" font-weight="bold" text-anchor="middle">A</text>`,
        `<line x1="140" y1="75" x2="180" y2="75" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="130" font-size="12" text-anchor="middle">Ammeter</text>`
    ]);
}

export function createVoltmeter(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 150, [
        `<line x1="20" y1="75" x2="60" y2="75" stroke="#333" stroke-width="3"/>`,
        `<circle cx="100" cy="75" r="35" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="85" font-size="24" font-weight="bold" text-anchor="middle">V</text>`,
        `<line x1="140" y1="75" x2="180" y2="75" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="130" font-size="12" text-anchor="middle">Voltmeter</text>`
    ]);
}

export function createDiode(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 100, [
        `<line x1="20" y1="50" x2="80" y2="50" stroke="#333" stroke-width="3"/>`,
        `<polygon points="80,30 80,70 110,50" fill="#333"/>`,
        `<line x1="110" y1="30" x2="110" y2="70" stroke="#333" stroke-width="3"/>`,
        `<line x1="110" y1="50" x2="180" y2="50" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="95" font-size="14" text-anchor="middle">Diode</text>`
    ]);
}

export function createLED(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 120, [
        `<line x1="20" y1="60" x2="70" y2="60" stroke="#333" stroke-width="3"/>`,
        `<polygon points="70,40 70,80 100,60" fill="#FF6B6B"/>`,
        `<line x1="100" y1="40" x2="100" y2="80" stroke="#333" stroke-width="3"/>`,
        `<line x1="100" y1="60" x2="180" y2="60" stroke="#333" stroke-width="3"/>`,
        `<path d="M 90 25 L 100 15 M 95 25 L 100 15 L 100 20" stroke="#FFD93D" stroke-width="2" fill="none"/>`,
        `<path d="M 105 25 L 115 15 M 110 25 L 115 15 L 115 20" stroke="#FFD93D" stroke-width="2" fill="none"/>`,
        `<text x="100" y="105" font-size="14" text-anchor="middle">LED</text>`
    ]);
}

/**
 * AC Source (Alternating Current)
 * @param id Diagram ID
 * @param voltage Peak voltage (default 12V)
 * @param frequency Frequency in Hz (default 50Hz)
 */
export function createACSource(id: string, voltage: number = 12, frequency: number = 50): FBDDiagram {
    return createCircuitDiagram(id, 250, 180, [
        `<line x1="20" y1="90" x2="60" y2="90" stroke="#333" stroke-width="3"/>`,
        `<circle cx="125" cy="90" r="55" fill="none" stroke="#333" stroke-width="3"/>`,
        // Sine wave symbol inside circle
        `<path d="M 85 90 Q 95 70, 105 90 T 125 90 T 145 90 T 165 90" fill="none" stroke="#333" stroke-width="2"/>`,
        `<line x1="190" y1="90" x2="230" y2="90" stroke="#333" stroke-width="3"/>`,
        `<text x="125" y="160" font-size="14" font-weight="bold" text-anchor="middle">AC Source</text>`,
        `<text x="125" y="175" font-size="12" text-anchor="middle">${voltage}V, ${frequency}Hz</text>`
    ]);
}

/**
 * DC Source (Direct Current)
 * @param id Diagram ID
 * @param voltage Voltage (default 12V)
 */
export function createDCSource(id: string, voltage: number = 12): FBDDiagram {
    return createCircuitDiagram(id, 250, 180, [
        `<line x1="20" y1="90" x2="60" y2="90" stroke="#333" stroke-width="3"/>`,
        `<circle cx="125" cy="90" r="55" fill="none" stroke="#333" stroke-width="3"/>`,
        // DC symbol (straight lines)
        `<line x1="105" y1="75" x2="105" y2="105" stroke="#333" stroke-width="4"/>`,
        `<line x1="145" y1="80" x2="145" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="105" y="65" font-size="16" font-weight="bold" text-anchor="middle">+</text>`,
        `<text x="145" y="65" font-size="16" font-weight="bold" text-anchor="middle">−</text>`,
        `<line x1="190" y1="90" x2="230" y2="90" stroke="#333" stroke-width="3"/>`,
        `<text x="125" y="160" font-size="14" font-weight="bold" text-anchor="middle">DC Source</text>`,
        `<text x="125" y="175" font-size="12" text-anchor="middle">${voltage}V</text>`
    ]);
}

/**
 * Galvanometer
 */
export function createGalvanometer(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 150, [
        `<line x1="20" y1="75" x2="60" y2="75" stroke="#333" stroke-width="3"/>`,
        `<circle cx="100" cy="75" r="35" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="85" font-size="24" font-weight="bold" text-anchor="middle">G</text>`,
        // Needle indicator
        `<line x1="100" y1="75" x2="120" y2="55" stroke="#d32f2f" stroke-width="2"/>`,
        `<circle cx="100" cy="75" r="3" fill="#333"/>`,
        `<line x1="140" y1="75" x2="180" y2="75" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="125" font-size="12" text-anchor="middle">Galvanometer</text>`
    ]);
}

/**
 * Rheostat (Variable Resistor)
 * @param id Diagram ID
 * @param resistance Maximum resistance in Ohms
 */
export function createRheostat(id: string, resistance: number = 100): FBDDiagram {
    return createCircuitDiagram(id, 250, 150, [
        `<line x1="20" y1="75" x2="50" y2="75" stroke="#333" stroke-width="3"/>`,
        // Resistor zigzag
        `<path d="M 50 75 L 60 55 L 80 95 L 100 55 L 120 95 L 140 55 L 160 75" fill="none" stroke="#333" stroke-width="3"/>`,
        `<line x1="160" y1="75" x2="230" y2="75" stroke="#333" stroke-width="3"/>`,
        // Variable arrow
        `<path d="M 105 35 L 105 65" stroke="#d32f2f" stroke-width="2" marker-end="url(#arrowred)"/>`,
        `<polygon points="105,65 100,55 110,55" fill="#d32f2f"/>`,
        `<text x="125" y="125" font-size="14" text-anchor="middle">Rheostat</text>`,
        `<text x="125" y="140" font-size="11" text-anchor="middle">${resistance}Ω max</text>`
    ]);
}

/**
 * Potentiometer
 */
export function createPotentiometer(id: string): FBDDiagram {
    return createCircuitDiagram(id, 250, 180, [
        `<line x1="20" y1="90" x2="50" y2="90" stroke="#333" stroke-width="3"/>`,
        // Resistor zigzag
        `<path d="M 50 90 L 60 70 L 80 110 L 100 70 L 120 110 L 140 70 L 160 90" fill="none" stroke="#333" stroke-width="3"/>`,
        `<line x1="160" y1="90" x2="230" y2="90" stroke="#333" stroke-width="3"/>`,
        // Wiper (middle tap)
        `<line x1="105" y1="90" x2="105" y2="130" stroke="#333" stroke-width="3"/>`,
        `<circle cx="105" cy="130" r="4" fill="#333"/>`,
        `<line x1="105" y1="134" x2="105" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="125" y="170" font-size="14" text-anchor="middle">Potentiometer</text>`
    ]);
}

/**
 * NPN Transistor
 */
export function createTransistorNPN(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 200, [
        // Collector (top)
        `<line x1="100" y1="30" x2="100" y2="70" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="50" font-size="11">C</text>`,
        // Base (left)
        `<line x1="20" y1="100" x2="85" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="95" font-size="11">B</text>`,
        // Emitter (bottom)
        `<line x1="100" y1="130" x2="100" y2="170" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="150" font-size="11">E</text>`,
        // Vertical base line
        `<line x1="85" y1="70" x2="85" y2="130" stroke="#333" stroke-width="4"/>`,
        // Collector connection
        `<line x1="85" y1="80" x2="100" y2="70" stroke="#333" stroke-width="3"/>`,
        // Emitter connection with arrow
        `<line x1="85" y1="120" x2="100" y2="130" stroke="#333" stroke-width="3"/>`,
        `<polygon points="100,130 95,122 105,125" fill="#333"/>`,
        // Circle around transistor
        `<circle cx="100" cy="100" r="50" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="185" font-size="14" font-weight="bold" text-anchor="middle">NPN</text>`
    ]);
}

/**
 * PNP Transistor
 */
export function createTransistorPNP(id: string): FBDDiagram {
    return createCircuitDiagram(id, 200, 200, [
        // Collector (bottom)
        `<line x1="100" y1="130" x2="100" y2="170" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="150" font-size="11">C</text>`,
        // Base (left)
        `<line x1="20" y1="100" x2="85" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="95" font-size="11">B</text>`,
        // Emitter (top)
        `<line x1="100" y1="30" x2="100" y2="70" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="50" font-size="11">E</text>`,
        // Vertical base line
        `<line x1="85" y1="70" x2="85" y2="130" stroke="#333" stroke-width="4"/>`,
        // Emitter connection with arrow pointing inward
        `<line x1="85" y1="80" x2="100" y2="70" stroke="#333" stroke-width="3"/>`,
        `<polygon points="85,80 90,72 90,82" fill="#333"/>`,
        // Collector connection
        `<line x1="85" y1="120" x2="100" y2="130" stroke="#333" stroke-width="3"/>`,
        // Circle around transistor
        `<circle cx="100" cy="100" r="50" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="100" y="185" font-size="14" font-weight="bold" text-anchor="middle">PNP</text>`
    ]);
}

/**
 * Zener Diode
 * @param id Diagram ID
 * @param voltage Breakdown voltage
 */
export function createZenerDiode(id: string, voltage: number = 5.1): FBDDiagram {
    return createCircuitDiagram(id, 200, 120, [
        `<line x1="20" y1="60" x2="70" y2="60" stroke="#333" stroke-width="3"/>`,
        `<polygon points="70,40 70,80 100,60" fill="#333"/>`,
        // Zener cathode (bent line)
        `<line x1="100" y1="40" x2="95" y2="40" stroke="#333" stroke-width="3"/>`,
        `<line x1="95" y1="40" x2="100" y2="80" stroke="#333" stroke-width="3"/>`,
        `<line x1="100" y1="80" x2="105" y2="80" stroke="#333" stroke-width="3"/>`,
        `<line x1="100" y1="60" x2="180" y2="60" stroke="#333" stroke-width="3"/>`,
        `<text x="100" y="105" font-size="14" text-anchor="middle">Zener ${voltage}V</text>`
    ]);
}
