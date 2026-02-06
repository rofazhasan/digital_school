/**
 * Physics Semiconductors & Electronics Diagram Presets
 * MOSFETs, op-amps, logic gates, flip-flops, and integrated circuits
 */

import type { FBDDiagram } from '../../fbd/types';

/**
 * Helper to create SVG electronics diagrams
 */
function createElectronicsDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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
 * N-Channel MOSFET
 */
export function createMOSFET(id: string, type: string = 'n-channel'): FBDDiagram {
    return createElectronicsDiagram(id, 250, 250, [
        // Gate (left)
        `<line x1="50" y1="125" x2="100" y2="125" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="130" font-size="11" text-anchor="end">G</text>`,

        // Gate terminal
        `<line x1="100" y1="80" x2="100" y2="170" stroke="#333" stroke-width="3"/>`,

        // Channel
        `<line x1="120" y1="80" x2="120" y2="170" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>`,

        // Drain (top)
        `<line x1="120" y1="80" x2="120" y2="50" stroke="#333" stroke-width="3"/>`,
        `<line x1="120" y1="50" x2="150" y2="50" stroke="#333" stroke-width="3"/>`,
        `<text x="160" y="55" font-size="11">D</text>`,

        // Source (bottom)
        `<line x1="120" y1="170" x2="120" y2="200" stroke="#333" stroke-width="3"/>`,
        `<line x1="120" y1="200" x2="150" y2="200" stroke="#333" stroke-width="3"/>`,
        `<text x="160" y="205" font-size="11">S</text>`,

        // Arrow (n-channel points in, p-channel points out)
        type === 'n-channel'
            ? `<polygon points="110,125 120,120 120,130" fill="#333"/>`
            : `<polygon points="120,125 110,120 110,130" fill="#333"/>`,

        // Circle around MOSFET
        `<circle cx="125" cy="125" r="70" fill="none" stroke="#333" stroke-width="2"/>`,

        // Title
        `<text x="125" y="30" font-size="14" font-weight="bold" text-anchor="middle">${type === 'n-channel' ? 'N-Channel' : 'P-Channel'} MOSFET</text>`,
        `<text x="125" y="230" font-size="10" text-anchor="middle">Enhancement Mode</text>`
    ]);
}

/**
 * Operational Amplifier (Op-Amp)
 */
export function createOpAmp(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 350, 250, [
        // Triangle body
        `<polygon points="100,50 100,200 250,125" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,

        // Non-inverting input (+)
        `<line x1="50" y1="100" x2="100" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="110" y="105" font-size="16" font-weight="bold">+</text>`,
        `<text x="40" y="95" font-size="11" text-anchor="end">V+</text>`,

        // Inverting input (-)
        `<line x1="50" y1="150" x2="100" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="110" y="155" font-size="16" font-weight="bold">−</text>`,
        `<text x="40" y="155" font-size="11" text-anchor="end">V−</text>`,

        // Output
        `<line x1="250" y1="125" x2="300" y2="125" stroke="#333" stroke-width="3"/>`,
        `<text x="310" y="130" font-size="11">Vout</text>`,

        // Power supply
        `<line x1="175" y1="50" x2="175" y2="30" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="25" font-size="10" text-anchor="middle">+Vcc</text>`,
        `<line x1="175" y1="200" x2="175" y2="220" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="235" font-size="10" text-anchor="middle">−Vcc</text>`,

        // Title
        `<text x="175" y="15" font-size="14" font-weight="bold" text-anchor="middle">Operational Amplifier</text>`
    ]);
}

/**
 * Logic Gate
 */
export function createLogicGate(id: string, type: string = 'AND'): FBDDiagram {
    const elements: string[] = [];

    if (type === 'AND') {
        elements.push(
            `<path d="M 80 80 L 80 170 L 140 170 Q 180 170, 180 125 Q 180 80, 140 80 Z" fill="#fff9c4" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">AND Gate</text>`
        );
    } else if (type === 'OR') {
        elements.push(
            `<path d="M 80 80 Q 100 125, 80 170 L 140 170 Q 180 170, 180 125 Q 180 80, 140 80 Z" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">OR Gate</text>`
        );
    } else if (type === 'NOT') {
        elements.push(
            `<polygon points="80,80 80,170 180,125" fill="#ffccbc" stroke="#333" stroke-width="3"/>`,
            `<circle cx="190" cy="125" r="10" fill="none" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">NOT Gate</text>`
        );
    } else if (type === 'NAND') {
        elements.push(
            `<path d="M 80 80 L 80 170 L 140 170 Q 170 170, 170 125 Q 170 80, 140 80 Z" fill="#e1bee7" stroke="#333" stroke-width="3"/>`,
            `<circle cx="180" cy="125" r="10" fill="none" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">NAND Gate</text>`
        );
    } else if (type === 'NOR') {
        elements.push(
            `<path d="M 80 80 Q 100 125, 80 170 L 140 170 Q 170 170, 170 125 Q 170 80, 140 80 Z" fill="#b2dfdb" stroke="#333" stroke-width="3"/>`,
            `<circle cx="180" cy="125" r="10" fill="none" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">NOR Gate</text>`
        );
    } else if (type === 'XOR') {
        elements.push(
            `<path d="M 90 80 Q 110 125, 90 170 L 140 170 Q 180 170, 180 125 Q 180 80, 140 80 Z" fill="#ffe0b2" stroke="#333" stroke-width="3"/>`,
            `<path d="M 70 80 Q 90 125, 70 170" fill="none" stroke="#333" stroke-width="3"/>`,
            `<text x="130" y="30" font-size="14" font-weight="bold" text-anchor="middle">XOR Gate</text>`
        );
    }

    // Inputs
    elements.push(
        `<line x1="30" y1="100" x2="80" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="20" y="105" font-size="11" text-anchor="end">A</text>`
    );

    if (type !== 'NOT') {
        elements.push(
            `<line x1="30" y1="150" x2="80" y2="150" stroke="#333" stroke-width="3"/>`,
            `<text x="20" y="155" font-size="11" text-anchor="end">B</text>`
        );
    }

    // Output
    const outputX = type === 'NOT' || type === 'NAND' || type === 'NOR' ? 200 : 180;
    elements.push(
        `<line x1="${outputX}" y1="125" x2="230" y2="125" stroke="#333" stroke-width="3"/>`,
        `<text x="240" y="130" font-size="11">Y</text>`
    );

    return createElectronicsDiagram(id, 260, 200, elements);
}

/**
 * SR Flip-Flop
 */
export function createSRFlipFlop(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 300, 250, [
        // Rectangle body
        `<rect x="100" y="75" width="100" height="100" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,

        // Inputs
        `<line x1="50" y1="100" x2="100" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="105" font-size="12" font-weight="bold" text-anchor="end">S</text>`,
        `<line x1="50" y1="150" x2="100" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="155" font-size="12" font-weight="bold" text-anchor="end">R</text>`,

        // Outputs
        `<line x1="200" y1="100" x2="250" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="105" font-size="12" font-weight="bold">Q</text>`,
        `<line x1="200" y1="150" x2="250" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="155" font-size="12" font-weight="bold">Q̄</text>`,

        // Label
        `<text x="150" y="130" font-size="16" font-weight="bold" text-anchor="middle">SR</text>`,

        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">SR Flip-Flop</text>`,
        `<text x="150" y="220" font-size="10" text-anchor="middle">Set-Reset Latch</text>`
    ]);
}

/**
 * JK Flip-Flop
 */
export function createJKFlipFlop(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 300, 280, [
        // Rectangle body
        `<rect x="100" y="75" width="100" height="130" fill="#c8e6c9" stroke="#333" stroke-width="3"/>`,

        // Inputs
        `<line x1="50" y1="100" x2="100" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="105" font-size="12" font-weight="bold" text-anchor="end">J</text>`,
        `<line x1="50" y1="140" x2="100" y2="140" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="145" font-size="12" font-weight="bold" text-anchor="end">CLK</text>`,
        `<line x1="50" y1="180" x2="100" y2="180" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="185" font-size="12" font-weight="bold" text-anchor="end">K</text>`,

        // Clock symbol
        `<path d="M 100 135 L 105 140 L 100 145" fill="none" stroke="#333" stroke-width="2"/>`,

        // Outputs
        `<line x1="200" y1="110" x2="250" y2="110" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="115" font-size="12" font-weight="bold">Q</text>`,
        `<line x1="200" y1="170" x2="250" y2="170" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="175" font-size="12" font-weight="bold">Q̄</text>`,

        // Label
        `<text x="150" y="145" font-size="16" font-weight="bold" text-anchor="middle">JK</text>`,

        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">JK Flip-Flop</text>`,
        `<text x="150" y="250" font-size="10" text-anchor="middle">Edge-triggered</text>`
    ]);
}

/**
 * D Flip-Flop
 */
export function createDFlipFlop(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 300, 250, [
        // Rectangle body
        `<rect x="100" y="75" width="100" height="100" fill="#ffccbc" stroke="#333" stroke-width="3"/>`,

        // Inputs
        `<line x1="50" y1="100" x2="100" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="105" font-size="12" font-weight="bold" text-anchor="end">D</text>`,
        `<line x1="50" y1="150" x2="100" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="40" y="155" font-size="12" font-weight="bold" text-anchor="end">CLK</text>`,

        // Clock symbol
        `<path d="M 100 145 L 105 150 L 100 155" fill="none" stroke="#333" stroke-width="2"/>`,

        // Outputs
        `<line x1="200" y1="100" x2="250" y2="100" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="105" font-size="12" font-weight="bold">Q</text>`,
        `<line x1="200" y1="150" x2="250" y2="150" stroke="#333" stroke-width="3"/>`,
        `<text x="260" y="155" font-size="12" font-weight="bold">Q̄</text>`,

        // Label
        `<text x="150" y="130" font-size="16" font-weight="bold" text-anchor="middle">D</text>`,

        // Title
        `<text x="150" y="30" font-size="14" font-weight="bold" text-anchor="middle">D Flip-Flop</text>`,
        `<text x="150" y="220" font-size="10" text-anchor="middle">Data/Delay Flip-Flop</text>`
    ]);
}

/**
 * 555 Timer IC
 */
export function create555Timer(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 350, 400, [
        // IC body (DIP-8 package)
        `<rect x="125" y="100" width="100" height="200" fill="#424242" stroke="#333" stroke-width="3" rx="5"/>`,

        // Notch at top
        `<circle cx="175" cy="100" r="10" fill="#616161"/>`,

        // Pin labels (left side)
        `<text x="115" y="135" font-size="10" text-anchor="end">GND</text>`,
        `<text x="115" y="165" font-size="10" text-anchor="end">TRIG</text>`,
        `<text x="115" y="195" font-size="10" text-anchor="end">OUT</text>`,
        `<text x="115" y="225" font-size="10" text-anchor="end">RST</text>`,

        // Pin labels (right side)
        `<text x="235" y="135" font-size="10">Vcc</text>`,
        `<text x="235" y="165" font-size="10">DIS</text>`,
        `<text x="235" y="195" font-size="10">THR</text>`,
        `<text x="235" y="225" font-size="10">CTRL</text>`,

        // Pins (left)
        `<line x1="100" y1="130" x2="125" y2="130" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="100" y1="160" x2="125" y2="160" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="100" y1="190" x2="125" y2="190" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="100" y1="220" x2="125" y2="220" stroke="#ffd54f" stroke-width="3"/>`,

        // Pins (right)
        `<line x1="225" y1="130" x2="250" y2="130" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="225" y1="160" x2="250" y2="160" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="225" y1="190" x2="250" y2="190" stroke="#ffd54f" stroke-width="3"/>`,
        `<line x1="225" y1="220" x2="250" y2="220" stroke="#ffd54f" stroke-width="3"/>`,

        // IC label
        `<text x="175" y="255" font-size="14" font-weight="bold" text-anchor="middle" fill="white">555</text>`,

        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">555 Timer IC</text>`,
        `<text x="175" y="350" font-size="10" text-anchor="middle">Astable/Monostable Multivibrator</text>`
    ]);
}

/**
 * Voltage Regulator (7805)
 */
export function createVoltageRegulator(id: string, voltage: number = 5): FBDDiagram {
    return createElectronicsDiagram(id, 350, 250, [
        // IC body (TO-220 package)
        `<rect x="125" y="80" width="100" height="100" fill="#424242" stroke="#333" stroke-width="3"/>`,

        // Heat sink fins
        `<rect x="125" y="60" width="100" height="20" fill="#757575" stroke="#333" stroke-width="2"/>`,
        `<line x1="135" y1="60" x2="135" y2="80" stroke="#333" stroke-width="1"/>`,
        `<line x1="155" y1="60" x2="155" y2="80" stroke="#333" stroke-width="1"/>`,
        `<line x1="175" y1="60" x2="175" y2="80" stroke="#333" stroke-width="1"/>`,
        `<line x1="195" y1="60" x2="195" y2="80" stroke="#333" stroke-width="1"/>`,
        `<line x1="215" y1="60" x2="215" y2="80" stroke="#333" stroke-width="1"/>`,

        // Pins
        `<rect x="140" y="180" width="10" height="30" fill="#ffd54f" stroke="#333" stroke-width="2"/>`,
        `<rect x="170" y="180" width="10" height="30" fill="#ffd54f" stroke="#333" stroke-width="2"/>`,
        `<rect x="200" y="180" width="10" height="30" fill="#ffd54f" stroke="#333" stroke-width="2"/>`,

        // Pin labels
        `<text x="145" y="225" font-size="10" text-anchor="middle">IN</text>`,
        `<text x="175" y="225" font-size="10" text-anchor="middle">GND</text>`,
        `<text x="205" y="225" font-size="10" text-anchor="middle">OUT</text>`,

        // IC label
        `<text x="175" y="135" font-size="14" font-weight="bold" text-anchor="middle" fill="white">78${voltage < 10 ? '0' : ''}${voltage}</text>`,

        // Title
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Voltage Regulator</text>`,
        `<text x="175" y="240" font-size="10" text-anchor="middle">+${voltage}V Fixed Output</text>`
    ]);
}

/**
 * JFET (Junction Field-Effect Transistor)
 */
export function createJFET(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 250, 250, [
        // Drain (top)
        `<line x1="125" y1="50" x2="125" y2="90" stroke="#333" stroke-width="3"/>`,
        `<text x="135" y="70" font-size="11">D</text>`,

        // Channel
        `<line x1="125" y1="90" x2="125" y2="160" stroke="#333" stroke-width="4"/>`,

        // Source (bottom)
        `<line x1="125" y1="160" x2="125" y2="200" stroke="#333" stroke-width="3"/>`,
        `<text x="135" y="180" font-size="11">S</text>`,

        // Gate
        `<line x1="50" y1="125" x2="115" y2="125" stroke="#333" stroke-width="3"/>`,
        `<polygon points="115,125 125,120 125,130" fill="#333"/>`,
        `<text x="40" y="130" font-size="11" text-anchor="end">G</text>`,

        // Circle
        `<circle cx="125" cy="125" r="60" fill="none" stroke="#333" stroke-width="2"/>`,

        // Title
        `<text x="125" y="30" font-size="14" font-weight="bold" text-anchor="middle">N-Channel JFET</text>`
    ]);
}

/**
 * BJT Amplifier Circuit
 */
export function createBJTAmplifier(id: string): FBDDiagram {
    return createElectronicsDiagram(id, 400, 350, [
        // NPN transistor
        `<circle cx="200" cy="175" r="40" fill="none" stroke="#333" stroke-width="2"/>`,
        `<line x1="200" y1="145" x2="200" y2="205" stroke="#333" stroke-width="3"/>`,
        `<line x1="200" y1="160" x2="230" y2="140" stroke="#333" stroke-width="3"/>`,
        `<line x1="200" y1="190" x2="230" y2="210" stroke="#333" stroke-width="3"/>`,
        `<polygon points="230,210 225,200 235,205" fill="#333"/>`,

        // Collector resistor
        `<line x1="230" y1="50" x2="230" y2="80" stroke="#333" stroke-width="2"/>`,
        `<path d="M 230 80 L 235 90 L 225 100 L 235 110 L 225 120 L 230 130" fill="none" stroke="#333" stroke-width="2"/>`,
        `<line x1="230" y1="130" x2="230" y2="140" stroke="#333" stroke-width="2"/>`,
        `<text x="245" y="105" font-size="10">Rc</text>`,

        // Emitter resistor
        `<line x1="230" y1="210" x2="230" y2="240" stroke="#333" stroke-width="2"/>`,
        `<path d="M 230 240 L 235 250 L 225 260 L 235 270 L 225 280 L 230 290" fill="none" stroke="#333" stroke-width="2"/>`,
        `<line x1="230" y1="290" x2="230" y2="320" stroke="#333" stroke-width="2"/>`,
        `<text x="245" y="265" font-size="10">Re</text>`,

        // Base resistor
        `<line x1="100" y1="175" x2="130" y2="175" stroke="#333" stroke-width="2"/>`,
        `<path d="M 130 175 L 140 180 L 150 170 L 160 180 L 170 170 L 180 175" fill="none" stroke="#333" stroke-width="2"/>`,
        `<line x1="180" y1="175" x2="200" y2="175" stroke="#333" stroke-width="2"/>`,
        `<text x="155" y="165" font-size="10">Rb</text>`,

        // Input/Output
        `<text x="80" y="180" font-size="11" font-weight="bold">Vin</text>`,
        `<text x="250" y="105" font-size="11" font-weight="bold">Vout</text>`,

        // Power supply
        `<text x="230" y="40" font-size="11" text-anchor="middle">+Vcc</text>`,
        `<line x1="220" y1="320" x2="240" y2="320" stroke="#333" stroke-width="2"/>`,
        `<line x1="225" y1="325" x2="235" y2="325" stroke="#333" stroke-width="2"/>`,
        `<line x1="230" y1="330" x2="230" y2="330" stroke="#333" stroke-width="2"/>`,

        // Title
        `<text x="200" y="25" font-size="14" font-weight="bold" text-anchor="middle">Common Emitter Amplifier</text>`
    ]);
}

// Individual logic gate wrapper functions
export function createANDGate(id: string): FBDDiagram {
    return createLogicGate(id, 'AND');
}

export function createORGate(id: string): FBDDiagram {
    return createLogicGate(id, 'OR');
}

export function createNOTGate(id: string): FBDDiagram {
    return createLogicGate(id, 'NOT');
}

export function createNANDGate(id: string): FBDDiagram {
    return createLogicGate(id, 'NAND');
}

export function createNORGate(id: string): FBDDiagram {
    return createLogicGate(id, 'NOR');
}

export function createXORGate(id: string): FBDDiagram {
    return createLogicGate(id, 'XOR');
}
