/**
 * Advanced Circuit Diagrams
 * LRC, LC, LR circuits with multiple components
 */

import type { FBDDiagram } from '../../fbd/types';

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
 * LRC Circuit (Inductor, Resistor, Capacitor)
 */
export function createLRCCircuit(id: string, configuration: 'series' | 'parallel' = 'series'): FBDDiagram {
  const elements: string[] = [];
  const width = 700;
  const height = 400;

  if (configuration === 'series') {
    // Circuit wire
    elements.push(`<path d="M 100 200 L 600 200 L 600 300 L 100 300 Z" fill="none" stroke="#333" stroke-width="3"/>`);

    // Battery
    // AC Source
    elements.push(`
      <circle cx="120" cy="200" r="15" fill="white" stroke="#333" stroke-width="2"/>
      <path d="M 110 200 Q 115 190 120 200 T 130 200" fill="none" stroke="#333" stroke-width="2"/>
      <text x="120" y="175" font-size="12" text-anchor="middle">~ V</text>
    `);

    // Resistor
    elements.push(`
      <path d="M 200 200 L 210 180 L 230 220 L 250 180 L 270 220 L 290 180 L 300 200" 
            fill="none" stroke="#333" stroke-width="2"/>
      <text x="250" y="240" font-size="12" text-anchor="middle">R</text>
    `);

    // Inductor (coil)
    elements.push(`
      <path d="M 350 200 Q 360 180 370 200 Q 380 220 390 200 Q 400 180 410 200 Q 420 220 430 200" 
            fill="none" stroke="#333" stroke-width="2"/>
      <text x="390" y="240" font-size="12" text-anchor="middle">L</text>
    `);

    // Capacitor
    elements.push(`
      <line x1="480" y1="180" x2="480" y2="220" stroke="#333" stroke-width="3"/>
      <line x1="490" y1="180" x2="490" y2="220" stroke="#333" stroke-width="3"/>
      <text x="485" y="240" font-size="12" text-anchor="middle">C</text>
    `);

  } else {
    // Parallel configuration
    elements.push(`<line x1="100" y1="200" x2="200" y2="200" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="500" y1="200" x2="600" y2="200" stroke="#333" stroke-width="3"/>`);

    // Three parallel branches
    // Branch 1: Resistor
    elements.push(`<line x1="200" y1="200" x2="200" y2="150" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="500" y1="200" x2="500" y2="150" stroke="#333" stroke-width="3"/>`);
    elements.push(`<path d="M 200 150 L 220 150 L 230 130 L 250 170 L 270 130 L 290 170 L 310 130 L 320 150 L 500 150" 
          fill="none" stroke="#333" stroke-width="2"/>`);
    elements.push(`<text x="350" y="140" font-size="12" text-anchor="middle">R</text>`);

    // Branch 2: Inductor
    elements.push(`<line x1="200" y1="200" x2="200" y2="250" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="500" y1="200" x2="500" y2="250" stroke="#333" stroke-width="3"/>`);
    elements.push(`<path d="M 200 250 L 220 250 Q 240 230 260 250 Q 280 270 300 250 Q 320 230 340 250 Q 360 270 380 250 L 500 250" 
          fill="none" stroke="#333" stroke-width="2"/>`);
    elements.push(`<text x="350" y="240" font-size="12" text-anchor="middle">L</text>`);

    // Branch 3: Capacitor
    elements.push(`<line x1="200" y1="200" x2="200" y2="350" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="500" y1="200" x2="500" y2="350" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="200" y1="350" x2="340" y2="350" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="345" y1="330" x2="345" y2="370" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="355" y1="330" x2="355" y2="370" stroke="#333" stroke-width="3"/>`);
    elements.push(`<line x1="360" y1="350" x2="500" y2="350" stroke="#333" stroke-width="3"/>`);
    elements.push(`<text x="350" y="390" font-size="12" text-anchor="middle">C</text>`);

    // Battery
    // AC Source
    elements.push(`
      <circle cx="120" cy="200" r="15" fill="white" stroke="#333" stroke-width="2"/>
      <path d="M 110 200 Q 115 190 120 200 T 130 200" fill="none" stroke="#333" stroke-width="2"/>
      <text x="120" y="175" font-size="12" text-anchor="middle">~ V</text>
    `);
  }

  elements.push(`<text x="350" y="30" font-size="16" font-weight="bold" text-anchor="middle">LRC Circuit (${configuration})</text>`);

  return createCircuitDiagram(id, width, height, elements);
}

/**
 * LC Circuit (Inductor-Capacitor)
 */
export function createLCCircuit(id: string): FBDDiagram {
  const elements: string[] = [];

  // Circuit wire
  elements.push(`<path d="M 150 200 L 450 200 L 450 300 L 150 300 Z" fill="none" stroke="#333" stroke-width="3"/>`);

  // Inductor
  elements.push(`
    <path d="M 200 200 Q 220 180 240 200 Q 260 220 280 200 Q 300 180 320 200" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="260" y="240" font-size="12" text-anchor="middle">L</text>
  `);

  // Capacitor
  elements.push(`
    <line x1="380" y1="280" x2="380" y2="320" stroke="#333" stroke-width="3"/>
    <line x1="390" y1="280" x2="390" y2="320" stroke="#333" stroke-width="3"/>
    <text x="385" y="340" font-size="12" text-anchor="middle">C</text>
  `);

  elements.push(`<text x="300" y="30" font-size="16" font-weight="bold" text-anchor="middle">LC Oscillator Circuit</text>`);

  return createCircuitDiagram(id, 600, 370, elements);
}

/**
 * LR Circuit (Inductor-Resistor)
 */
export function createLRCircuit(id: string): FBDDiagram {
  const elements: string[] = [];

  // Circuit wire
  elements.push(`<path d="M 150 200 L 450 200 L 450 300 L 150 300 Z" fill="none" stroke="#333" stroke-width="3"/>`);

  // Battery
  elements.push(`
    <line x1="170" y1="180" x2="170" y2="220" stroke="#333" stroke-width="4"/>
    <line x1="180" y1="170" x2="180" y2="230" stroke="#333" stroke-width="2"/>
    <text x="175" y="165" font-size="12" text-anchor="middle">V</text>
  `);

  // Resistor
  elements.push(`
    <path d="M 250 200 L 260 180 L 280 220 L 300 180 L 320 220 L 340 180 L 350 200" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="300" y="240" font-size="12" text-anchor="middle">R</text>
  `);

  // Inductor
  elements.push(`
    <path d="M 250 300 Q 270 280 290 300 Q 310 320 330 300 Q 350 280 370 300" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="310" y="340" font-size="12" text-anchor="middle">L</text>
  `);

  elements.push(`<text x="300" y="30" font-size="16" font-weight="bold" text-anchor="middle">LR Circuit</text>`);

  return createCircuitDiagram(id, 600, 370, elements);
}

/**
 * Complex circuit with multiple resistors
 */
export function createMultiResistorCircuit(id: string, resistors: number = 4): FBDDiagram {
  const elements: string[] = [];
  const width = 800;
  const height = 500;

  // Main circuit loop
  elements.push(`<path d="M 100 250 L 700 250 L 700 350 L 100 350 Z" fill="none" stroke="#333" stroke-width="3"/>`);

  // Battery
  // Battery (Professional)
  elements.push(`
    <line x1="120" y1="230" x2="120" y2="245" stroke="#333" stroke-width="2"/>
    <line x1="120" y1="255" x2="120" y2="270" stroke="#333" stroke-width="2"/>
    <!-- Positive Plate -->
    <line x1="110" y1="245" x2="130" y2="245" stroke="#333" stroke-width="3"/>
    <!-- Negative Plate -->
    <line x1="115" y1="255" x2="125" y2="255" stroke="#333" stroke-width="3"/>
    <text x="105" y="240" font-size="14" font-weight="bold">+</text>
    <text x="105" y="270" font-size="14" font-weight="bold">-</text>
    <text x="145" y="255" font-size="12" text-anchor="middle" dominant-baseline="middle">V</text>
  `);

  // Resistors in series
  const spacing = 500 / resistors;
  for (let i = 0; i < resistors; i++) {
    const x = 180 + i * spacing;
    elements.push(`
      <path d="M ${x} 250 L ${x + 10} 230 L ${x + 30} 270 L ${x + 50} 230 L ${x + 70} 270 L ${x + 90} 230 L ${x + 100} 250" 
            fill="none" stroke="#333" stroke-width="2"/>
      <text x="${x + 50}" y="290" font-size="12" text-anchor="middle">R${i + 1}</text>
    `);
  }

  elements.push(`<text x="400" y="50" font-size="16" font-weight="bold" text-anchor="middle">Multi-Resistor Circuit</text>`);

  return createCircuitDiagram(id, width, height, elements);
}

/**
 * Rheostat (variable resistor) circuit
 */
export function createRheostatCircuit(id: string): FBDDiagram {
  const elements: string[] = [];

  // Circuit
  elements.push(`<path d="M 150 200 L 450 200 L 450 300 L 150 300 Z" fill="none" stroke="#333" stroke-width="3"/>`);

  // Battery
  elements.push(`
    <line x1="170" y1="180" x2="170" y2="220" stroke="#333" stroke-width="4"/>
    <line x1="180" y1="170" x2="180" y2="230" stroke="#333" stroke-width="2"/>
    <text x="175" y="165" font-size="12" text-anchor="middle">V</text>
  `);

  // Rheostat (resistor with arrow)
  elements.push(`
    <path d="M 250 200 L 260 180 L 280 220 L 300 180 L 320 220 L 340 180 L 350 200" 
          fill="none" stroke="#333" stroke-width="2"/>
    <line x1="300" y1="160" x2="300" y2="200" stroke="#f59e0b" stroke-width="2"/>
    <polygon points="300,160 295,170 305,170" fill="#f59e0b"/>
    <text x="300" y="150" font-size="11" text-anchor="middle" fill="#f59e0b">Variable</text>
    <text x="300" y="240" font-size="12" text-anchor="middle">Rheostat</text>
  `);

  // Bulb
  elements.push(`
    <circle cx="300" cy="300" r="20" fill="none" stroke="#333" stroke-width="2"/>
    <path d="M 285 285 L 315 315 M 285 315 L 315 285" stroke="#333" stroke-width="2"/>
    <text x="300" y="340" font-size="12" text-anchor="middle">Bulb</text>
  `);

  elements.push(`<text x="300" y="30" font-size="16" font-weight="bold" text-anchor="middle">Rheostat Circuit</text>`);

  return createCircuitDiagram(id, 600, 370, elements);
}

/**
 * Complex mixed circuit (series-parallel combination)
 */
export function createMixedCircuit(id: string): FBDDiagram {
  const elements: string[] = [];
  const width = 800;
  const height = 600;

  // Main lines
  elements.push(`<line x1="100" y1="300" x2="200" y2="300" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="600" y1="300" x2="700" y2="300" stroke="#333" stroke-width="3"/>`);

  // Battery
  elements.push(`
    <line x1="120" y1="280" x2="120" y2="320" stroke="#333" stroke-width="4"/>
    <line x1="130" y1="270" x2="130" y2="330" stroke="#333" stroke-width="2"/>
    <text x="125" y="265" font-size="12" text-anchor="middle">V</text>
  `);

  // Series resistor
  elements.push(`
    <path d="M 200 300 L 210 280 L 230 320 L 250 280 L 270 320 L 290 280 L 300 300" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="250" y="340" font-size="12" text-anchor="middle">R₁</text>
  `);

  // Parallel section
  elements.push(`<line x1="300" y1="300" x2="350" y2="300" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="550" y1="300" x2="600" y2="300" stroke="#333" stroke-width="3"/>`);

  // Upper branch
  elements.push(`<line x1="350" y1="300" x2="350" y2="200" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="550" y1="300" x2="550" y2="200" stroke="#333" stroke-width="3"/>`);
  elements.push(`
    <path d="M 350 200 L 370 200 L 380 180 L 400 220 L 420 180 L 440 220 L 460 180 L 470 200 L 550 200" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="450" y="190" font-size="12" text-anchor="middle">R₂</text>
  `);

  // Lower branch
  elements.push(`<line x1="350" y1="300" x2="350" y2="400" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="550" y1="300" x2="550" y2="400" stroke="#333" stroke-width="3"/>`);
  elements.push(`
    <path d="M 350 400 L 370 400 L 380 380 L 400 420 L 420 380 L 440 420 L 460 380 L 470 400 L 550 400" 
          fill="none" stroke="#333" stroke-width="2"/>
    <text x="450" y="440" font-size="12" text-anchor="middle">R₃</text>
  `);

  // Closing wire
  elements.push(`<line x1="100" y1="300" x2="100" y2="500" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="100" y1="500" x2="700" y2="500" stroke="#333" stroke-width="3"/>`);
  elements.push(`<line x1="700" y1="300" x2="700" y2="500" stroke="#333" stroke-width="3"/>`);

  elements.push(`<text x="400" y="50" font-size="16" font-weight="bold" text-anchor="middle">Mixed Series-Parallel Circuit</text>`);

  return createCircuitDiagram(id, width, height, elements);
}
