/**
 * Advanced Mixed Subject Diagram Presets
 * Advanced physics, mathematics, and specialized diagrams to complete the 300-diagram library
 */

import type { FBDDiagram } from '../fbd/types';

/**
 * Helper to create SVG advanced diagrams
 */
function createAdvancedDiagram(id: string, width: number, height: number, elements: string[]): FBDDiagram {
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

// ADVANCED PHYSICS

export function createDoubleSlit(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 350, [
        // Source
        `<circle cx="50" cy="175" r="15" fill="#fdd835" stroke="#333" stroke-width="2"/>`,
        `<text x="50" y="180" font-size="10" text-anchor="middle">Source</text>`,
        // Barrier with slits
        `<rect x="150" y="50" width="20" height="120" fill="#333"/>`,
        `<rect x="150" y="230" width="20" height="120" fill="#333"/>`,
        `<text x="140" y="185" font-size="9" text-anchor="end">Slit 1</text>`,
        `<text x="140" y="215" font-size="9" text-anchor="end">Slit 2</text>`,
        // Screen
        `<rect x="380" y="50" width="10" height="300" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
        `<text x="400" y="200" font-size="10">Screen</text>`,
        // Interference pattern
        `<rect x="385" y="170" width="5" height="10" fill="#ff5252"/>`,
        `<rect x="385" y="190" width="5" height="5" fill="#ffcdd2"/>`,
        `<rect x="385" y="205" width="5" height="10" fill="#ff5252"/>`,
        `<rect x="385" y="225" width="5" height="5" fill="#ffcdd2"/>`,
        `<rect x="385" y="240" width="5" height="10" fill="#ff5252"/>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Double-Slit Experiment</text>`,
        `<text x="225" y="340" font-size="10" text-anchor="middle">Wave interference pattern</text>`
    ]);
}

export function createCompton(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Incoming photon
        `<line x1="50" y1="150" x2="150" y2="150" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="100" y="140" font-size="10">γ (hν)</text>`,
        // Electron at rest
        `<circle cx="180" cy="150" r="15" fill="#42a5f5" stroke="#333" stroke-width="2"/>`,
        `<text x="180" y="155" font-size="10" text-anchor="middle" fill="white">e⁻</text>`,
        // Scattered photon
        `<line x1="195" y1="135" x2="280" y2="80" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="240" y="100" font-size="10">γ' (hν')</text>`,
        // Recoil electron
        `<line x1="195" y1="165" x2="280" y2="220" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="240" y="210" font-size="10">e⁻</text>`,
        // Angle
        `<path d="M 210 150 Q 220 140, 230 130" fill="none" stroke="#333" stroke-width="1"/>`,
        `<text x="225" y="125" font-size="9">θ</text>`,
        `<defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
          </marker>
        </defs>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Compton Scattering</text>`,
        `<text x="200" y="280" font-size="10" text-anchor="middle">Photon-electron collision</text>`
    ]);
}

export function createBraggDiffraction(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Crystal lattice planes
        `<line x1="50" y1="100" x2="350" y2="100" stroke="#333" stroke-width="2"/>`,
        `<line x1="50" y1="150" x2="350" y2="150" stroke="#333" stroke-width="2"/>`,
        `<line x1="50" y1="200" x2="350" y2="200" stroke="#333" stroke-width="2"/>`,
        `<text x="360" y="155" font-size="10">Crystal planes</text>`,
        // Incident beam
        `<line x1="100" y1="50" x2="150" y2="100" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="110" y="70" font-size="10">Incident</text>`,
        // Reflected beam
        `<line x1="150" y1="100" x2="200" y2="50" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="180" y="70" font-size="10">Reflected</text>`,
        // Angle θ
        `<path d="M 150 80 Q 155 85, 160 90" fill="none" stroke="#333" stroke-width="1"/>`,
        `<text x="165" y="85" font-size="9">θ</text>`,
        // d spacing
        `<line x1="370" y1="100" x2="370" y2="150" stroke="#333" stroke-width="2"/>`,
        `<text x="380" y="130" font-size="10">d</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Bragg's Law</text>`,
        `<text x="200" y="300" font-size="11" text-anchor="middle">nλ = 2d sin θ</text>`,
        `<text x="200" y="330" font-size="10" text-anchor="middle">X-ray diffraction</text>`
    ]);
}

export function createFaradayLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Coil
        `<ellipse cx="200" cy="175" rx="80" ry="60" fill="none" stroke="#ff9800" stroke-width="3"/>`,
        `<ellipse cx="200" cy="175" rx="70" ry="50" fill="none" stroke="#ff9800" stroke-width="3"/>`,
        `<ellipse cx="200" cy="175" rx="60" ry="40" fill="none" stroke="#ff9800" stroke-width="3"/>`,
        `<text x="200" y="185" font-size="11" text-anchor="middle">Coil</text>`,
        // Magnet moving
        `<rect x="300" y="150" width="60" height="50" fill="#ff5252" stroke="#333" stroke-width="3" rx="5"/>`,
        `<text x="330" y="180" font-size="14" font-weight="bold" text-anchor="middle" fill="white">N S</text>`,
        `<line x1="360" y1="175" x2="400" y2="175" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="380" y="165" font-size="10">v</text>`,
        // Induced current
        `<circle cx="200" cy="120" r="8" fill="#42a5f5"/>`,
        `<text x="200" y="110" font-size="9" text-anchor="middle">I (induced)</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Faraday's Law</text>`,
        `<text x="200" y="300" font-size="11" text-anchor="middle">ε = -dΦ/dt</text>`,
        `<text x="200" y="330" font-size="10" text-anchor="middle">Electromagnetic induction</text>`
    ]);
}

export function createLenzLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Loop
        `<circle cx="200" cy="150" r="60" fill="none" stroke="#ff9800" stroke-width="3"/>`,
        // Magnetic field increasing
        `<circle cx="200" cy="150" r="5" fill="#333"/>`,
        `<circle cx="200" cy="150" r="15" fill="none" stroke="#333" stroke-width="1"/>`,
        `<circle cx="200" cy="150" r="25" fill="none" stroke="#333" stroke-width="1"/>`,
        `<circle cx="200" cy="150" r="35" fill="none" stroke="#333" stroke-width="1"/>`,
        `<text x="200" y="90" font-size="10" text-anchor="middle">B (increasing)</text>`,
        `<text x="200" y="105" font-size="9" text-anchor="middle">into page</text>`,
        // Induced current (counterclockwise)
        `<path d="M 260 150 Q 260 110, 220 90" fill="none" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="280" y="150" font-size="10">I (induced)</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Lenz's Law</text>`,
        `<text x="200" y="260" font-size="10" text-anchor="middle">Induced current opposes change</text>`
    ]);
}

// ADVANCED MATHEMATICS

export function createParametric(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 400, [
        // Axes
        `<line x1="50" y1="350" x2="400" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="50" y1="350" x2="50" y2="50" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="400" y="370" font-size="12">x</text>`,
        `<text x="30" y="50" font-size="12">y</text>`,
        // Parametric curve (circle)
        `<circle cx="225" cy="200" r="120" fill="none" stroke="#1976d2" stroke-width="3"/>`,
        // Parameter t markers
        `<circle cx="345" cy="200" r="5" fill="#ff5252"/>`,
        `<text x="360" y="205" font-size="9">t=0</text>`,
        `<circle cx="225" cy="80" r="5" fill="#ff5252"/>`,
        `<text x="230" y="75" font-size="9">t=π/2</text>`,
        `<circle cx="105" cy="200" r="5" fill="#ff5252"/>`,
        `<text x="80" y="205" font-size="9">t=π</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Parametric Curve</text>`,
        `<text x="225" y="385" font-size="11" text-anchor="middle">x = r cos(t), y = r sin(t)</text>`
    ]);
}

export function createPolar(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 400, [
        // Polar grid
        `<circle cx="200" cy="200" r="150" fill="url(#grad-cell-3d)" opacity="0.05"/>`,
        `<circle cx="200" cy="200" r="50" fill="none" stroke="#e0e0e0" stroke-width="1"/>`,
        `<circle cx="200" cy="200" r="100" fill="none" stroke="#e0e0e0" stroke-width="1"/>`,
        `<circle cx="200" cy="200" r="150" fill="none" stroke="#e0e0e0" stroke-width="1"/>`,
        `<line x1="200" y1="200" x2="350" y2="200" stroke="#e0e0e0" stroke-width="1"/>`,
        `<line x1="200" y1="200" x2="50" y2="200" stroke="#e0e0e0" stroke-width="1"/>`,
        `<line x1="200" y1="200" x2="200" y2="50" stroke="#e0e0e0" stroke-width="1"/>`,
        `<line x1="200" y1="200" x2="200" y2="350" stroke="#e0e0e0" stroke-width="1"/>`,
        // Spiral
        `<path d="M 200 200 Q 220 190, 240 200 Q 250 220, 240 240 Q 220 250, 200 240 Q 180 220, 190 200" fill="none" stroke="#1976d2" stroke-width="3"/>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Polar Coordinates</text>`,
        `<text x="200" y="380" font-size="11" text-anchor="middle">r = f(θ)</text>`
    ]);
}

export function createVector3D(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 400, [
        // 3D axes
        `<line x1="200" y1="300" x2="350" y2="300" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="360" y="305" font-size="12">x</text>`,
        `<line x1="200" y1="300" x2="200" y2="100" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="205" y="90" font-size="12">z</text>`,
        `<line x1="200" y1="300" x2="100" y2="350" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="85" y="365" font-size="12">y</text>`,
        // Vector
        `<line x1="200" y1="300" x2="300" y2="180" stroke="#1976d2" stroke-width="4" marker-end="url(#arrow)"/>`,
        `<text x="260" y="230" font-size="12" font-weight="bold" fill="#1976d2">v</text>`,
        // Components
        `<line x1="200" y1="300" x2="300" y2="300" stroke="#ff5252" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<line x1="300" y1="300" x2="300" y2="180" stroke="#66bb6a" stroke-width="2" stroke-dasharray="5,5"/>`,
        `<text x="250" y="320" font-size="10" fill="#ff5252">vₓ</text>`,
        `<text x="310" y="240" font-size="10" fill="#66bb6a">vz</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">3D Vector</text>`,
        `<text x="200" y="380" font-size="11" text-anchor="middle">v = (vₓ, vᵧ, vz)</text>`
    ]);
}

export function createMatrix2x2(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 350, 300, [
        // Matrix brackets
        `<text x="100" y="150" font-size="60">[</text>`,
        `<text x="250" y="150" font-size="60">]</text>`,
        // Matrix elements
        `<text x="140" y="130" font-size="20">a  b</text>`,
        `<text x="140" y="170" font-size="20">c  d</text>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">2×2 Matrix</text>`,
        `<text x="175" y="240" font-size="11" text-anchor="middle">det(A) = ad - bc</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Linear transformation</text>`
    ]);
}

export function createDeterminant(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 350, 300, [
        // Determinant notation
        `<text x="100" y="150" font-size="50">|</text>`,
        `<text x="230" y="150" font-size="50">|</text>`,
        `<text x="130" y="130" font-size="18">a  b</text>`,
        `<text x="130" y="165" font-size="18">c  d</text>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Determinant</text>`,
        `<text x="175" y="230" font-size="12" text-anchor="middle">= ad - bc</text>`,
        `<text x="175" y="270" font-size="10" text-anchor="middle">Area scaling factor</text>`
    ]);
}

// SPECIALIZED DIAGRAMS

export function createOhmsLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 350, 300, [
        // Triangle
        `<polygon points="175,80 100,220 250,220" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        // V at top
        `<text x="175" y="120" font-size="24" font-weight="bold" text-anchor="middle">V</text>`,
        // I at bottom left
        `<text x="120" y="210" font-size="24" font-weight="bold" text-anchor="middle">I</text>`,
        // R at bottom right
        `<text x="230" y="210" font-size="24" font-weight="bold" text-anchor="middle">R</text>`,
        // Dividing line
        `<line x1="100" y1="150" x2="250" y2="150" stroke="#333" stroke-width="2"/>`,
        `<text x="175" y="30" font-size="14" font-weight="bold" text-anchor="middle">Ohm's Law Triangle</text>`,
        `<text x="175" y="260" font-size="11" text-anchor="middle">V = IR</text>`,
        `<text x="175" y="285" font-size="10" text-anchor="middle">I = V/R, R = V/I</text>`
    ]);
}

export function createKirchhoffCurrent(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Junction point
        `<circle cx="200" cy="150" r="10" fill="#333"/>`,
        // Currents in
        `<line x1="100" y1="150" x2="190" y2="150" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="140" y="140" font-size="11">I₁</text>`,
        `<line x1="200" y1="50" x2="200" y2="140" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="210" y="90" font-size="11">I₂</text>`,
        // Currents out
        `<line x1="210" y1="150" x2="300" y2="150" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="260" y="140" font-size="11">I₃</text>`,
        `<line x1="200" y1="160" x2="200" y2="250" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="210" y="210" font-size="11">I₄</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Kirchhoff's Current Law</text>`,
        `<text x="200" y="285" font-size="11" text-anchor="middle">ΣI_in = ΣI_out</text>`
    ]);
}

export function createKirchhoffVoltage(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Loop
        `<rect x="100" y="100" width="200" height="150" fill="none" stroke="#333" stroke-width="3"/>`,
        // Voltage sources/drops
        `<text x="150" y="90" font-size="12">V₁</text>`,
        `<text x="310" y="175" font-size="12">V₂</text>`,
        `<text x="150" y="270" font-size="12">V₃</text>`,
        `<text x="80" y="175" font-size="12">V₄</text>`,
        // Direction arrow
        `<path d="M 200 100 L 300 100 L 300 250 L 100 250 L 100 100" fill="none" stroke="#1976d2" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Kirchhoff's Voltage Law</text>`,
        `<text x="200" y="310" font-size="11" text-anchor="middle">ΣV = 0 (around closed loop)</text>`
    ]);
}

export function createSnellsLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 400, [
        // Interface
        `<line x1="0" y1="200" x2="400" y2="200" stroke="#333" stroke-width="3"/>`,
        `<text x="10" y="190" font-size="11">n₁ (air)</text>`,
        `<text x="10" y="220" font-size="11">n₂ (glass)</text>`,
        // Normal
        `<line x1="200" y1="50" x2="200" y2="350" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`,
        // Incident ray
        `<line x1="100" y1="100" x2="200" y2="200" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="140" y="140" font-size="10">Incident</text>`,
        // Refracted ray
        `<line x1="200" y1="200" x2="250" y2="320" stroke="#fdd835" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="230" y="270" font-size="10">Refracted</text>`,
        // Angles
        `<path d="M 200 150 Q 210 160, 220 170" fill="none" stroke="#333" stroke-width="1"/>`,
        `<text x="225" y="165" font-size="10">θ₁</text>`,
        `<path d="M 200 250 Q 210 240, 220 230" fill="none" stroke="#333" stroke-width="1"/>`,
        `<text x="225" y="245" font-size="10">θ₂</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Snell's Law</text>`,
        `<text x="200" y="380" font-size="11" text-anchor="middle">n₁ sin θ₁ = n₂ sin θ₂</text>`
    ]);
}

export function createDopplerEffect(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 300, [
        // Source moving
        `<circle cx="225" cy="150" r="20" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="225" y="155" font-size="11" text-anchor="middle" fill="white">S</text>`,
        `<line x1="245" y1="150" x2="290" y2="150" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="270" y="140" font-size="10">v</text>`,
        // Compressed waves (ahead)
        `<circle cx="225" cy="150" r="40" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        `<circle cx="225" cy="150" r="60" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        `<circle cx="225" cy="150" r="80" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        // Expanded waves (behind)
        `<circle cx="225" cy="150" r="100" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        `<circle cx="225" cy="150" r="130" fill="none" stroke="#42a5f5" stroke-width="2"/>`,
        `<text x="350" y="155" font-size="10">Higher f</text>`,
        `<text x="70" y="155" font-size="10">Lower f</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Doppler Effect</text>`,
        `<text x="225" y="280" font-size="10" text-anchor="middle">Frequency shift due to motion</text>`
    ]);
}

export function createYoungsModulus(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Rod
        `<rect x="150" y="100" width="100" height="30" fill="#e0e0e0" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="120" font-size="11" text-anchor="middle">L₀</text>`,
        // Force arrows
        `<line x1="100" y1="115" x2="145" y2="115" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="120" y="110" font-size="11" fill="#ff5252">F</text>`,
        `<line x1="255" y1="115" x2="300" y2="115" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="280" y="110" font-size="11" fill="#ff5252">F</text>`,
        // Stretched rod
        `<rect x="140" y="180" width="120" height="30" fill="#e0e0e0" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="200" font-size="11" text-anchor="middle">L₀ + ΔL</text>`,
        // Force arrows
        `<line x1="90" y1="195" x2="135" y2="195" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<line x1="265" y1="195" x2="310" y2="195" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Young's Modulus</text>`,
        `<text x="200" y="280" font-size="11" text-anchor="middle">Y = (F/A) / (ΔL/L₀)</text>`,
        `<text x="200" y="310" font-size="10" text-anchor="middle">Stress / Strain</text>`
    ]);
}

export function createHookesLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Spring at rest
        `<path d="M 100 100 Q 110 90, 120 100 Q 130 110, 140 100 Q 150 90, 160 100 Q 170 110, 180 100" fill="none" stroke="#333" stroke-width="3"/>`,
        `<text x="140" y="85" font-size="10" text-anchor="middle">Rest</text>`,
        // Spring stretched
        `<path d="M 100 200 Q 115 190, 130 200 Q 145 210, 160 200 Q 175 190, 190 200 Q 205 210, 220 200" fill="none" stroke="#333" stroke-width="3"/>`,
        `<line x1="220" y1="200" x2="280" y2="200" stroke="#ff5252" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="250" y="190" font-size="11" fill="#ff5252">F</text>`,
        `<text x="160" y="185" font-size="10" text-anchor="middle">Stretched</text>`,
        // Extension
        `<line x1="180" y1="220" x2="220" y2="220" stroke="#42a5f5" stroke-width="2"/>`,
        `<text x="200" y="240" font-size="10" text-anchor="middle" fill="#42a5f5">x</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Hooke's Law</text>`,
        `<text x="200" y="300" font-size="12" text-anchor="middle">F = -kx</text>`,
        `<text x="200" y="330" font-size="10" text-anchor="middle">Spring force</text>`
    ]);
}

export function createBernoulli(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 300, [
        // Pipe with varying diameter
        `<path d="M 50 120 L 150 120 L 200 140 L 300 140 L 350 120 L 400 120" fill="none" stroke="#333" stroke-width="3"/>`,
        `<path d="M 50 180 L 150 180 L 200 160 L 300 160 L 350 180 L 400 180" fill="none" stroke="#333" stroke-width="3"/>`,
        // Flow direction
        `<line x1="80" y1="150" x2="120" y2="150" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<line x1="240" y1="150" x2="280" y2="150" stroke="#42a5f5" stroke-width="3" marker-end="url(#arrow)"/>`,
        // Pressure indicators
        `<text x="100" y="110" font-size="10">P₁, v₁</text>`,
        `<text x="250" y="130" font-size="10">P₂, v₂</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Bernoulli's Equation</text>`,
        `<text x="225" y="260" font-size="11" text-anchor="middle">P + ½ρv² + ρgh = constant</text>`,
        `<text x="225" y="285" font-size="10" text-anchor="middle">Fluid flow</text>`
    ]);
}

export function createArchimedesPrinciple(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 400, [
        // Water
        `<rect x="50" y="150" width="300" height="200" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="140" font-size="11" text-anchor="middle">Fluid</text>`,
        // Object submerged
        `<rect x="150" y="200" width="100" height="80" fill="#ffccbc" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="245" font-size="11" text-anchor="middle">Object</text>`,
        // Buoyant force (up)
        `<line x1="200" y1="200" x2="200" y2="140" stroke="#66bb6a" stroke-width="4" marker-end="url(#arrow)"/>`,
        `<text x="210" y="165" font-size="12" font-weight="bold" fill="#66bb6a">Fb</text>`,
        // Weight (down)
        `<line x1="200" y1="280" x2="200" y2="340" stroke="#ff5252" stroke-width="4" marker-end="url(#arrow)"/>`,
        `<text x="210" y="315" font-size="12" font-weight="bold" fill="#ff5252">W</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Archimedes' Principle</text>`,
        `<text x="200" y="380" font-size="11" text-anchor="middle">Fb = ρ_fluid × V_displaced × g</text>`
    ]);
}

export function createCoulombsLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Charge 1
        `<circle cx="120" cy="150" r="30" fill="#ff5252" stroke="#333" stroke-width="3"/>`,
        `<text x="120" y="158" font-size="18" font-weight="bold" text-anchor="middle" fill="white">+q₁</text>`,
        // Charge 2
        `<circle cx="280" cy="150" r="30" fill="#42a5f5" stroke="#333" stroke-width="3"/>`,
        `<text x="280" y="158" font-size="18" font-weight="bold" text-anchor="middle" fill="white">−q₂</text>`,
        // Force arrows
        `<line x1="150" y1="150" x2="190" y2="150" stroke="#66bb6a" stroke-width="4" marker-end="url(#arrow)"/>`,
        `<text x="170" y="140" font-size="12" font-weight="bold" fill="#66bb6a">F</text>`,
        `<line x1="250" y1="150" x2="210" y2="150" stroke="#66bb6a" stroke-width="4" marker-end="url(#arrow)"/>`,
        // Distance
        `<line x1="120" y1="200" x2="280" y2="200" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="220" font-size="11" text-anchor="middle">r</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Coulomb's Law</text>`,
        `<text x="200" y="270" font-size="12" text-anchor="middle">F = k|q₁q₂|/r²</text>`
    ]);
}

export function createGaussLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Gaussian surface (sphere)
        `<circle cx="200" cy="175" r="100" fill="none" stroke="#42a5f5" stroke-width="3" stroke-dasharray="10,5"/>`,
        `<text x="200" y="80" font-size="11" text-anchor="middle">Gaussian surface</text>`,
        // Charge inside
        `<circle cx="200" cy="175" r="20" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="200" y="182" font-size="14" font-weight="bold" text-anchor="middle" fill="white">+Q</text>`,
        // Electric field lines
        `<line x1="200" y1="155" x2="200" y2="80" stroke="#fdd835" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="220" y1="175" x2="295" y2="175" stroke="#fdd835" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="200" y1="195" x2="200" y2="270" stroke="#fdd835" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<line x1="180" y1="175" x2="105" y2="175" stroke="#fdd835" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="310" y="180" font-size="10">E</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Gauss's Law</text>`,
        `<text x="200" y="320" font-size="11" text-anchor="middle">∮ E·dA = Q_enclosed/ε₀</text>`
    ]);
}

export function createAmpereLaw(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Wire (current)
        `<circle cx="200" cy="175" r="15" fill="#ff9800" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="182" font-size="12" font-weight="bold" text-anchor="middle">I</text>`,
        `<text x="200" y="155" font-size="10" text-anchor="middle">⊙ (out)</text>`,
        // Circular magnetic field
        `<circle cx="200" cy="175" r="60" fill="none" stroke="#1976d2" stroke-width="3"/>`,
        `<circle cx="200" cy="175" r="100" fill="none" stroke="#1976d2" stroke-width="2"/>`,
        // Field direction arrow
        `<path d="M 260 175 Q 260 135, 230 115" fill="none" stroke="#1976d2" stroke-width="3" marker-end="url(#arrow)"/>`,
        `<text x="270" y="145" font-size="11" fill="#1976d2">B</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Ampère's Law</text>`,
        `<text x="200" y="320" font-size="11" text-anchor="middle">∮ B·dl = μ₀I_enclosed</text>`
    ]);
}

export function createMaxwellEquations(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 450, [
        // Title
        `<text x="225" y="40" font-size="16" font-weight="bold" text-anchor="middle">Maxwell's Equations</text>`,
        // Gauss's Law (Electric)
        `<rect x="50" y="70" width="350" height="60" fill="#e3f2fd" stroke="#333" stroke-width="2" rx="5"/>`,
        `<text x="225" y="95" font-size="13" font-weight="bold" text-anchor="middle">Gauss's Law (Electric)</text>`,
        `<text x="225" y="115" font-size="11" text-anchor="middle">∇·E = ρ/ε₀</text>`,
        // Gauss's Law (Magnetic)
        `<rect x="50" y="150" width="350" height="60" fill="#fff9c4" stroke="#333" stroke-width="2" rx="5"/>`,
        `<text x="225" y="175" font-size="13" font-weight="bold" text-anchor="middle">Gauss's Law (Magnetic)</text>`,
        `<text x="225" y="195" font-size="11" text-anchor="middle">∇·B = 0</text>`,
        // Faraday's Law
        `<rect x="50" y="230" width="350" height="60" fill="#c8e6c9" stroke="#333" stroke-width="2" rx="5"/>`,
        `<text x="225" y="255" font-size="13" font-weight="bold" text-anchor="middle">Faraday's Law</text>`,
        `<text x="225" y="275" font-size="11" text-anchor="middle">∇×E = -∂B/∂t</text>`,
        // Ampère-Maxwell Law
        `<rect x="50" y="310" width="350" height="60" fill="#ffccbc" stroke="#333" stroke-width="2" rx="5"/>`,
        `<text x="225" y="335" font-size="13" font-weight="bold" text-anchor="middle">Ampère-Maxwell Law</text>`,
        `<text x="225" y="355" font-size="11" text-anchor="middle">∇×B = μ₀J + μ₀ε₀∂E/∂t</text>`,
        `<text x="225" y="420" font-size="10" text-anchor="middle">Fundamental equations of electromagnetism</text>`
    ]);
}

export function createWaveEquation(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 350, [
        // Wave
        `<path d="M 50 175 Q 100 125, 150 175 Q 200 225, 250 175 Q 300 125, 350 175 Q 400 225, 450 175" fill="none" stroke="#1976d2" stroke-width="4"/>`,
        // Wavelength
        `<line x1="50" y1="250" x2="250" y2="250" stroke="#333" stroke-width="2"/>`,
        `<line x1="50" y1="240" x2="50" y2="260" stroke="#333" stroke-width="2"/>`,
        `<line x1="250" y1="240" x2="250" y2="260" stroke="#333" stroke-width="2"/>`,
        `<text x="150" y="270" font-size="11" text-anchor="middle">λ (wavelength)</text>`,
        // Amplitude
        `<line x1="450" y1="175" x2="480" y2="175" stroke="#333" stroke-width="2"/>`,
        `<line x1="450" y1="125" x2="480" y2="125" stroke="#333" stroke-width="2"/>`,
        `<line x1="465" y1="125" x2="465" y2="175" stroke="#333" stroke-width="2"/>`,
        `<text x="490" y="155" font-size="10">A</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Wave Equation</text>`,
        `<text x="225" y="310" font-size="12" text-anchor="middle">∂²y/∂t² = v² ∂²y/∂x²</text>`,
        `<text x="225" y="335" font-size="10" text-anchor="middle">y = A sin(kx - ωt)</text>`
    ]);
}

export function createSchrodinger(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 300, [
        // Wave function
        `<path d="M 50 150 Q 100 100, 150 150 Q 200 200, 250 150 Q 300 100, 350 150 Q 400 200, 450 150" fill="none" stroke="#9c27b0" stroke-width="4"/>`,
        `<text x="225" y="100" font-size="12" text-anchor="middle">ψ (wave function)</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Schrödinger Equation</text>`,
        `<text x="225" y="230" font-size="12" text-anchor="middle">iℏ ∂ψ/∂t = Ĥψ</text>`,
        `<text x="225" y="260" font-size="11" text-anchor="middle">Time-dependent</text>`,
        `<text x="225" y="285" font-size="10" text-anchor="middle">Quantum mechanics</text>`
    ]);
}

export function createHeisenberg(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Uncertainty regions
        `<ellipse cx="150" cy="150" rx="80" ry="60" fill="#e3f2fd" stroke="#333" stroke-width="3"/>`,
        `<text x="150" y="155" font-size="12" font-weight="bold" text-anchor="middle">Δx</text>`,
        `<ellipse cx="250" cy="150" rx="60" ry="80" fill="#ffcdd2" stroke="#333" stroke-width="3"/>`,
        `<text x="250" y="155" font-size="12" font-weight="bold" text-anchor="middle">Δp</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Heisenberg Uncertainty Principle</text>`,
        `<text x="200" y="250" font-size="12" text-anchor="middle">Δx · Δp ≥ ℏ/2</text>`,
        `<text x="200" y="280" font-size="10" text-anchor="middle">Cannot know both position and momentum precisely</text>`
    ]);
}

export function createPauliExclusion(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 350, [
        // Energy levels
        `<rect x="100" y="100" width="200" height="40" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="125" font-size="11" text-anchor="end">n=3</text>`,
        `<rect x="100" y="160" width="200" height="40" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="185" font-size="11" text-anchor="end">n=2</text>`,
        `<rect x="100" y="220" width="200" height="40" fill="none" stroke="#333" stroke-width="2"/>`,
        `<text x="80" y="245" font-size="11" text-anchor="end">n=1</text>`,
        // Electrons (spin up/down)
        `<circle cx="150" cy="240" r="8" fill="#42a5f5" stroke="#333" stroke-width="1"/>`,
        `<text x="150" y="244" font-size="8" text-anchor="middle">↑</text>`,
        `<circle cx="180" cy="240" r="8" fill="#42a5f5" stroke="#333" stroke-width="1"/>`,
        `<text x="180" y="244" font-size="8" text-anchor="middle">↓</text>`,
        `<circle cx="150" cy="180" r="8" fill="#42a5f5" stroke="#333" stroke-width="1"/>`,
        `<text x="150" y="184" font-size="8" text-anchor="middle">↑</text>`,
        `<circle cx="180" cy="180" r="8" fill="#42a5f5" stroke="#333" stroke-width="1"/>`,
        `<text x="180" y="184" font-size="8" text-anchor="middle">↓</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Pauli Exclusion Principle</text>`,
        `<text x="200" y="310" font-size="10" text-anchor="middle">No two electrons can have identical quantum states</text>`
    ]);
}

export function createRelativityE(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 250, [
        // Famous equation
        `<text x="200" y="120" font-size="48" font-weight="bold" text-anchor="middle">E = mc²</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Mass-Energy Equivalence</text>`,
        `<text x="200" y="180" font-size="11" text-anchor="middle">E: Energy</text>`,
        `<text x="200" y="200" font-size="11" text-anchor="middle">m: Mass</text>`,
        `<text x="200" y="220" font-size="11" text-anchor="middle">c: Speed of light</text>`
    ]);
}

export function createLorentzFactor(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 300, [
        // Gamma symbol
        `<text x="200" y="120" font-size="60" font-weight="bold" text-anchor="middle">γ</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Lorentz Factor</text>`,
        `<text x="200" y="180" font-size="14" text-anchor="middle">γ = 1/√(1 - v²/c²)</text>`,
        `<text x="200" y="220" font-size="10" text-anchor="middle">Time dilation: Δt' = γΔt</text>`,
        `<text x="200" y="240" font-size="10" text-anchor="middle">Length contraction: L' = L/γ</text>`,
        `<text x="200" y="270" font-size="10" text-anchor="middle">Special relativity</text>`
    ]);
}

export function createBlackHole(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 400, 400, [
        // Event horizon
        `<circle cx="200" cy="200" r="60" fill="#000" stroke="#333" stroke-width="3"/>`,
        `<text x="200" y="205" font-size="12" font-weight="bold" text-anchor="middle" fill="white">Singularity</text>`,
        // Event horizon circle
        `<circle cx="200" cy="200" r="80" fill="none" stroke="#ff5252" stroke-width="3" stroke-dasharray="5,5"/>`,
        `<text x="290" y="205" font-size="10" fill="#ff5252">Event horizon</text>`,
        // Accretion disk
        `<ellipse cx="200" cy="200" rx="140" ry="40" fill="none" stroke="#fdd835" stroke-width="4"/>`,
        `<text x="200" y="250" font-size="10">Accretion disk</text>`,
        // Photon sphere
        `<circle cx="200" cy="200" r="100" fill="none" stroke="#42a5f5" stroke-width="2" stroke-dasharray="3,3"/>`,
        `<text x="200" y="110" font-size="9" fill="#42a5f5">Photon sphere</text>`,
        `<text x="200" y="30" font-size="14" font-weight="bold" text-anchor="middle">Black Hole</text>`,
        `<text x="200" y="370" font-size="10" text-anchor="middle">Schwarzschild radius: rs = 2GM/c²</text>`
    ]);
}

export function createBigBang(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 400, [
        // Singularity
        `<circle cx="50" cy="200" r="10" fill="#ff5252" stroke="#333" stroke-width="2"/>`,
        `<text x="50" y="230" font-size="9" text-anchor="middle">t=0</text>`,
        // Expansion
        `<circle cx="150" cy="200" r="30" fill="none" stroke="#ff9800" stroke-width="2"/>`,
        `<text x="150" y="240" font-size="9" text-anchor="middle">10⁻⁴³s</text>`,
        `<circle cx="250" cy="200" r="60" fill="none" stroke="#fdd835" stroke-width="2"/>`,
        `<text x="250" y="270" font-size="9" text-anchor="middle">10⁻³²s</text>`,
        `<circle cx="350" cy="200" r="100" fill="none" stroke="#66bb6a" stroke-width="2"/>`,
        `<text x="350" y="310" font-size="9" text-anchor="middle">Now</text>`,
        // Arrow
        `<line x1="60" y1="200" x2="440" y2="200" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>`,
        `<text x="250" y="190" font-size="10">Time →</text>`,
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Big Bang Theory</text>`,
        `<text x="225" y="370" font-size="10" text-anchor="middle">Universe expansion from singularity</text>`
    ]);
}

export function createStandardModel(id: string): FBDDiagram {
    return createAdvancedDiagram(id, 450, 450, [
        // Title
        `<text x="225" y="30" font-size="14" font-weight="bold" text-anchor="middle">Standard Model of Particle Physics</text>`,
        // Quarks
        `<rect x="50" y="60" width="150" height="150" fill="#ffcdd2" stroke="#333" stroke-width="2"/>`,
        `<text x="125" y="85" font-size="12" font-weight="bold" text-anchor="middle">Quarks</text>`,
        `<text x="125" y="110" font-size="10" text-anchor="middle">up, down</text>`,
        `<text x="125" y="130" font-size="10" text-anchor="middle">charm, strange</text>`,
        `<text x="125" y="150" font-size="10" text-anchor="middle">top, bottom</text>`,
        // Leptons
        `<rect x="250" y="60" width="150" height="150" fill="#c8e6c9" stroke="#333" stroke-width="2"/>`,
        `<text x="325" y="85" font-size="12" font-weight="bold" text-anchor="middle">Leptons</text>`,
        `<text x="325" y="110" font-size="10" text-anchor="middle">electron, e-neutrino</text>`,
        `<text x="325" y="130" font-size="10" text-anchor="middle">muon, μ-neutrino</text>`,
        `<text x="325" y="150" font-size="10" text-anchor="middle">tau, τ-neutrino</text>`,
        // Gauge bosons
        `<rect x="50" y="240" width="150" height="150" fill="#e3f2fd" stroke="#333" stroke-width="2"/>`,
        `<text x="125" y="265" font-size="12" font-weight="bold" text-anchor="middle">Gauge Bosons</text>`,
        `<text x="125" y="290" font-size="10" text-anchor="middle">photon (γ)</text>`,
        `<text x="125" y="310" font-size="10" text-anchor="middle">W⁺, W⁻, Z⁰</text>`,
        `<text x="125" y="330" font-size="10" text-anchor="middle">gluon (g)</text>`,
        // Higgs
        `<rect x="250" y="240" width="150" height="150" fill="#fff9c4" stroke="#333" stroke-width="2"/>`,
        `<text x="325" y="265" font-size="12" font-weight="bold" text-anchor="middle">Scalar Boson</text>`,
        `<text x="325" y="300" font-size="10" text-anchor="middle">Higgs boson (H)</text>`,
        `<text x="325" y="320" font-size="9" text-anchor="middle">Gives mass to</text>`,
        `<text x="325" y="335" font-size="9" text-anchor="middle">other particles</text>`,
        `<text x="225" y="425" font-size="10" text-anchor="middle">Fundamental particles and forces</text>`
    ]);
}
