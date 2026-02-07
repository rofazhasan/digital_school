/**
 * Central Diagram Preset Registry
 * Maps preset names to generator functions
 */

// Physics imports
import {
    createSpringMass,
    createPendulum,
    createProjectile,
    createFreeFall,
    createCollision,
    createLever,
    createAtwoodMachine,
} from './physics/mechanics';

import {
    createSeriesCircuit,
    createParallelCircuit,
    createResistor,
    createCapacitor,
    createInductor,
    createBattery,
    createAmmeter,
    createVoltmeter,
    createDiode,
    createLED,
    createACSource,
    createDCSource,
    createGalvanometer,
    createRheostat,
    createPotentiometer,
    createTransistorNPN,
    createTransistorPNP,
    createZenerDiode,
} from './physics/electricity';

import {
    createTransverseWave,
    createLongitudinalWave,
    createStandingWave,
    createRayDiagram,
} from './physics/waves';

import {
    createConvexLens,
    createConcaveLens,
    createConvexMirror,
    createConcaveMirror,
    createPlaneMirror,
    createPrism,
    createTelescope,
    createMicroscope,
    createDiffractionGrating,
    createLaser,
    createFiberOptic,
} from './physics/optics';

import {
    createPVDiagram,
    createCarnotCycle,
    createHeatEngine,
    createRefrigerator,
    createPhaseDiagram,
    createMaxwellDistribution,
    createIsothermal,
    createAdiabatic,
    createIsobaric,
    createIsochoric,
} from './physics/thermodynamics';

import {
    createBohrModel,
    createEnergyLevels,
    createPhotoelectricSetup,
    createNuclearDecay,
    createFission,
    createFusion,
    createQuantumTunneling,
} from './physics/modern';

import {
    createMOSFET,
    createJFET,
    createBJTAmplifier,
    createOpAmp,
    createANDGate,
    createORGate,
    createNOTGate,
    createNANDGate,
    createNORGate,
    createXORGate,
    createSRFlipFlop,
    createJKFlipFlop,
    createDFlipFlop,
    create555Timer,
    createVoltageRegulator,
} from './physics/semiconductors';

// Compound/Complex physics diagrams
import {
    createSpringProjectile,
    createSpringPendulum,
    createDoublePendulum,
    createInclineSpring,
    createCoupledOscillators,
    createProjectileWithDrag,
    createConicalPendulum,
} from './physics/compound';

// Environment-specific physics diagrams
import {
    createPendulumInMedium,
    createProjectileInMedium,
    createFreeFallInMedium,
    createMediumComparison,
} from './physics/environments';

// Advanced physics diagrams
import {
    createMultiContactForces,
    createComplexIncline,
    createInclinePulley,
    createThreeBodySystem,
    createCircularMotionForces,
} from './physics/advanced';

// Chemistry imports
import {
    createBeaker,
    createTestTube,
    createFlaskConical,
    createBurette,
    createFunnel,
    createAtom,
    createMolecule,
} from './chemistry/apparatus';

// Advanced chemistry diagrams
import {
    createReactionSetup,
    createTitration,
    createDistillation,
    createBenzene,
    createGlucose,
    createAminoAcid,
} from './chemistry/advanced';

import {
    createMethane,
    createEthane,
    createPropane,
    createButane,
    createEthene,
    createPropene,
    createEthyne,
    createToluene,
    createPhenol,
    createEthanol,
    createAceticAcid,
    createAcetone,
} from './chemistry/organic';

import {
    createGlycine,
    createAlanine,
    createGlucoseRing,
    createFructose,
    createPolyethylene,
    createPVC,
    createCaffeine,
    createAspirin,
    createDopamine,
    createSerotonin,
    createCholesterol,
    createVitaminC,
    createNucleotide,
    createFattyAcid,
    createSteroid,
} from './chemistry/biochemistry';

import {
    createNaClCrystal,
    createDiamondStructure,
    createGraphiteStructure,
    createOctahedralComplex,
    createTetrahedralComplex,
    createAmmonia,
    createSulfuricAcid,
    createPhosphoricAcid,
    createCarbonateIon,
    createNitrateIon,
    createAmmoniumIon,
} from './chemistry/inorganic';

// Biology diagrams
import {
    createDNA,
    createProteinHelix,
    createCellMembrane,
    createATP,
    createEnzymeSubstrate,
} from './biology/molecules';

import {
    createPlantCell,
    createAnimalCell,
    createMitochondria,
    createChloroplast,
    createDNAReplication,
    createTranscription,
    createTranslation,
    createNeuron,
    createHeart,
} from './biology/cells';

import {
    createEye,
    createEar,
    createDigestiveSystem,
    createRespiratorySystem,
    createCirculatorySystem,
    createSkeletalSystem,
    createMuscularSystem,
    createNervousSystem,
    createKidney,
    createLiver,
    createSkinLayers,
    createTooth,
    createAlveoli,
    createNephron,
} from './biology/anatomy';

import {
    createFlowerStructure,
    createLeafStructure,
    createRootSystem,
    createPhotosynthesis,
    createStemCrossSection,
    createSeedStructure,
    createStomata,
    createXylemPhloem,
    createGermination,
    createTranspiration,
} from './biology/plants';

// Mathematics imports
import {
    create2DAxes,
    createTriangle,
    createCircle,
    createRectangle,
    createSineGraph,
    createVector,
    createCube,
} from './mathematics/shapes';

// Advanced mathematics diagrams
import {
    createParabola,
    createHyperbola,
    createEllipse,
    createCircleGraph,
    createModularGraph,
} from './mathematics/graphs';

import {
    createSquare,
    createPentagon,
    createHexagon,
    createOctagon,
    createTrapezoid,
    createRhombus,
    createParallelogram,
    createSphere,
    createCylinder,
    createCone,
    createPyramid,
    createCosine,
    createTangent,
    createExponential,
    createLogarithm,
    createAbsoluteValue,
} from './mathematics/advanced';

// Advanced mixed subject diagrams
import {
    createDoubleSlit,
    createCompton,
    createBraggDiffraction,
    createFaradayLaw,
    createLenzLaw,
    createParametric,
    createPolar,
    createVector3D,
    createMatrix2x2,
    createDeterminant,
    createOhmsLaw,
    createKirchhoffCurrent,
    createKirchhoffVoltage,
    createSnellsLaw,
    createDopplerEffect,
    createYoungsModulus,
    createHookesLaw,
    createBernoulli,
    createArchimedesPrinciple,
    createCoulombsLaw,
    createGaussLaw,
    createAmpereLaw,
    createMaxwellEquations,
    createWaveEquation,
    createSchrodinger,
    createHeisenberg,
    createPauliExclusion,
    createRelativityE,
    createLorentzFactor,
    createBlackHole,
    createBigBang,
    createStandardModel,
} from './advanced_mixed';

// Advanced circuit diagrams
import {
    createLRCCircuit,
    createLCCircuit,
    createLRCircuit,
    createMultiResistorCircuit,
    createRheostatCircuit,
    createMixedCircuit,
} from './physics/circuits';

// Combination system
export {
    combineSeries,
    combineParallel,
    combineGrid,
    combineComparison,
    parseCombination,
} from './combinations';

// Existing FBD presets
import {
    createBlockOnIncline,
    createHangingMass,
    createPulleySystem,
    createBeamDiagram,
} from '../fbd/generator';

import type { FBDDiagram } from '../fbd/types';

/**
 * Preset generator function type
 */
type PresetGenerator = (id: string, ...args: any[]) => FBDDiagram;

/**
 * Registry of all available diagram presets
 */
export const DIAGRAM_PRESETS: Record<string, PresetGenerator> = {
    // ===== PHYSICS: MECHANICS =====
    'incline': createBlockOnIncline,
    'hanging': createHangingMass,
    'pulley': createPulleySystem,
    'beam': createBeamDiagram,
    'spring': createSpringMass,
    'pendulum': createPendulum,
    'projectile': createProjectile,
    'freefall': createFreeFall,
    'collision': createCollision,
    'lever': createLever,
    'atwood': createAtwoodMachine,

    // ===== PHYSICS: COMPOUND/COMPLEX =====
    'spring-projectile': createSpringProjectile,
    'spring-pendulum': createSpringPendulum,
    'double-pendulum': createDoublePendulum,
    'incline-spring': createInclineSpring,
    'coupled-oscillators': createCoupledOscillators,
    'projectile-drag': createProjectileWithDrag,
    'conical-pendulum': createConicalPendulum,

    // ===== PHYSICS: ENVIRONMENTS =====
    'pendulum-air': (id: string, length?: number, angle?: number) => createPendulumInMedium(id, length, angle, 'air'),
    'pendulum-water': (id: string, length?: number, angle?: number) => createPendulumInMedium(id, length, angle, 'water'),
    'pendulum-fire': (id: string, length?: number, angle?: number) => createPendulumInMedium(id, length, angle, 'fire'),
    'pendulum-vacuum': (id: string, length?: number, angle?: number) => createPendulumInMedium(id, length, angle, 'vacuum'),
    'projectile-air': (id: string, velocity?: number, angle?: number) => createProjectileInMedium(id, velocity, angle, 'air'),
    'projectile-water': (id: string, velocity?: number, angle?: number) => createProjectileInMedium(id, velocity, angle, 'water'),
    'projectile-fire': (id: string, velocity?: number, angle?: number) => createProjectileInMedium(id, velocity, angle, 'fire'),
    'projectile-vacuum': (id: string, velocity?: number, angle?: number) => createProjectileInMedium(id, velocity, angle, 'vacuum'),
    'freefall-air': (id: string, mass?: number) => createFreeFallInMedium(id, mass, 'air'),
    'freefall-water': (id: string, mass?: number) => createFreeFallInMedium(id, mass, 'water'),
    'freefall-fire': (id: string, mass?: number) => createFreeFallInMedium(id, mass, 'fire'),
    'freefall-vacuum': (id: string, mass?: number) => createFreeFallInMedium(id, mass, 'vacuum'),
    'medium-comparison': createMediumComparison,

    // ===== PHYSICS: ELECTRICITY & CIRCUITS =====
    'circuit-series': createSeriesCircuit,
    'circuit-parallel': createParallelCircuit,
    'resistor': createResistor,
    'capacitor': createCapacitor,
    'inductor': createInductor,
    'battery': createBattery,
    'ammeter': createAmmeter,
    'voltmeter': createVoltmeter,
    'diode': createDiode,
    'led': createLED,
    'ac-source': createACSource,
    'dc-source': createDCSource,
    'galvanometer': createGalvanometer,
    'rheostat': createRheostat,
    'potentiometer': createPotentiometer,
    'transistor-npn': createTransistorNPN,
    'transistor-pnp': createTransistorPNP,
    'zener-diode': createZenerDiode,

    // ===== PHYSICS: WAVES & OPTICS =====
    'wave-transverse': createTransverseWave,
    'wave-longitudinal': createLongitudinalWave,
    'wave-standing': createStandingWave,
    'ray-diagram': createRayDiagram,
    'lens-convex': createConvexLens,
    'lens-concave': createConcaveLens,
    'mirror-convex': createConvexMirror,
    'mirror-concave': createConcaveMirror,
    'mirror-plane': createPlaneMirror,
    'prism': createPrism,
    'telescope': createTelescope,
    'microscope': createMicroscope,
    'diffraction-grating': createDiffractionGrating,
    'laser': createLaser,
    'fiber-optic': createFiberOptic,

    // ===== PHYSICS: THERMODYNAMICS =====
    'pv-diagram': createPVDiagram,
    'carnot-cycle': createCarnotCycle,
    'heat-engine': createHeatEngine,
    'refrigerator': createRefrigerator,
    'phase-diagram': createPhaseDiagram,
    'maxwell-distribution': createMaxwellDistribution,
    'isothermal': createIsothermal,
    'adiabatic': createAdiabatic,
    'isobaric': createIsobaric,
    'isochoric': createIsochoric,

    // ===== PHYSICS: MODERN PHYSICS =====
    'bohr-model': createBohrModel,
    'energy-levels': createEnergyLevels,
    'photoelectric': createPhotoelectricSetup,
    'nuclear-decay-alpha': (id: string) => createNuclearDecay(id, 'alpha'),
    'nuclear-decay-beta': (id: string) => createNuclearDecay(id, 'beta'),
    'nuclear-decay-gamma': (id: string) => createNuclearDecay(id, 'gamma'),
    'nuclear-fission': createFission,
    'nuclear-fusion': createFusion,
    'quantum-tunneling': createQuantumTunneling,

    // ===== PHYSICS: ADVANCED =====
    'multi-contact': createMultiContactForces,
    'complex-incline': createComplexIncline,
    'incline-pulley': createInclinePulley,
    'three-body': createThreeBodySystem,
    'circular-motion': createCircularMotionForces,

    // ===== CHEMISTRY: APPARATUS =====
    'beaker': createBeaker,
    'test-tube': createTestTube,
    'flask-conical': createFlaskConical,
    'burette': createBurette,
    'funnel': createFunnel,

    // ===== CHEMISTRY: MOLECULAR =====
    'atom': createAtom,
    'molecule': createMolecule,
    'molecule-water': (id: string) => createMolecule(id, 'H2O'),
    'molecule-co2': (id: string) => createMolecule(id, 'CO2'),
    'molecule-ch4': (id: string) => createMolecule(id, 'CH4'),

    // ===== CHEMISTRY: ORGANIC =====
    'methane': createMethane,
    'ethane': createEthane,
    'propane': createPropane,
    'butane': createButane,
    'ethene': createEthene,
    'propene': createPropene,
    'ethyne': createEthyne,
    'toluene': createToluene,
    'phenol': createPhenol,
    'ethanol': createEthanol,
    'acetic-acid': createAceticAcid,
    'acetone': createAcetone,

    // ===== CHEMISTRY: ADVANCED =====
    'reaction': createReactionSetup,
    'titration': createTitration,
    'distillation': createDistillation,
    'benzene': createBenzene,
    'glucose': createGlucose,
    'amino-acid': createAminoAcid,

    // ===== BIOLOGY: MOLECULES =====
    'dna': createDNA,
    'protein-helix': createProteinHelix,
    'cell-membrane': createCellMembrane,
    'atp': createATP,
    'enzyme-substrate': createEnzymeSubstrate,

    // ===== BIOLOGY: CELLS & ANATOMY =====
    'plant-cell': createPlantCell,
    'animal-cell': createAnimalCell,
    'mitochondria': createMitochondria,
    'chloroplast': createChloroplast,
    'dna-replication': createDNAReplication,
    'transcription': createTranscription,
    'translation': createTranslation,
    'neuron': createNeuron,
    'heart': createHeart,

    // ===== MATHEMATICS: SHAPES =====
    'axes-2d': create2DAxes,
    'triangle': createTriangle,
    'triangle-equilateral': (id: string) => createTriangle(id, 'equilateral'),
    'triangle-right': (id: string) => createTriangle(id, 'right'),
    'triangle-isosceles': (id: string) => createTriangle(id, 'isosceles'),
    'circle': createCircle,
    'rectangle': createRectangle,
    'square': createSquare,
    'pentagon': createPentagon,
    'hexagon': createHexagon,
    'octagon': createOctagon,
    'trapezoid': createTrapezoid,
    'rhombus': createRhombus,
    'parallelogram': createParallelogram,
    'ellipse-shape': createEllipse,
    'cube': createCube,
    'sphere': createSphere,
    'cylinder': createCylinder,
    'cone': createCone,
    'pyramid': createPyramid,

    // ===== MATHEMATICS: GRAPHS =====
    'graph-sine': createSineGraph,
    'graph-cosine': createCosine,
    'graph-tangent': createTangent,
    'graph-exponential': createExponential,
    'graph-logarithm': createLogarithm,
    'graph-absolute': createAbsoluteValue,
    'vector': createVector,
    'parabola': createParabola,
    'hyperbola': createHyperbola,
    'ellipse-graph': createEllipse,
    'circle-graph': createCircleGraph,
    'modular': createModularGraph,

    // ===== CIRCUITS: ADVANCED =====
    'lrc-series': (id: string) => createLRCCircuit(id, 'series'),
    'lrc-parallel': (id: string) => createLRCCircuit(id, 'parallel'),
    'lc-circuit': createLCCircuit,
    'lr-circuit': createLRCircuit,
    'multi-resistor': createMultiResistorCircuit,
    'rheostat-circuit': createRheostatCircuit,
    'mixed-circuit': createMixedCircuit,

    // ===== PHYSICS: SEMICONDUCTORS & ELECTRONICS =====
    'mosfet': createMOSFET,
    'jfet': createJFET,
    'bjt-amplifier': createBJTAmplifier,
    'op-amp': createOpAmp,
    'and-gate': createANDGate,
    'or-gate': createORGate,
    'not-gate': createNOTGate,
    'nand-gate': createNANDGate,
    'nor-gate': createNORGate,
    'xor-gate': createXORGate,
    'sr-flipflop': createSRFlipFlop,
    'jk-flipflop': createJKFlipFlop,
    'd-flipflop': createDFlipFlop,
    '555-timer': create555Timer,
    'voltage-regulator': createVoltageRegulator,

    // ===== CHEMISTRY: BIOCHEMISTRY =====
    'glycine': createGlycine,
    'alanine': createAlanine,
    'glucose-ring': createGlucoseRing,
    'fructose': createFructose,
    'polyethylene': createPolyethylene,
    'pvc': createPVC,
    'caffeine': createCaffeine,
    'aspirin': createAspirin,
    'dopamine': createDopamine,
    'serotonin': createSerotonin,
    'cholesterol': createCholesterol,
    'vitamin-c': createVitaminC,
    'nucleotide': createNucleotide,
    'fatty-acid': createFattyAcid,
    'steroid': createSteroid,

    // ===== CHEMISTRY: INORGANIC =====
    'nacl-crystal': createNaClCrystal,
    'diamond-structure': createDiamondStructure,
    'graphite-structure': createGraphiteStructure,
    'octahedral-complex': createOctahedralComplex,
    'tetrahedral-complex': createTetrahedralComplex,
    'ammonia': createAmmonia,
    'sulfuric-acid': createSulfuricAcid,
    'phosphoric-acid': createPhosphoricAcid,
    'carbonate-ion': createCarbonateIon,
    'nitrate-ion': createNitrateIon,
    'ammonium-ion': createAmmoniumIon,

    // ===== BIOLOGY: HUMAN ANATOMY =====
    'eye': createEye,
    'ear': createEar,
    'digestive-system': createDigestiveSystem,
    'respiratory-system': createRespiratorySystem,
    'circulatory-system': createCirculatorySystem,
    'skeletal-system': createSkeletalSystem,
    'muscular-system': createMuscularSystem,
    'nervous-system': createNervousSystem,
    'kidney': createKidney,
    'liver': createLiver,
    'skin-layers': createSkinLayers,
    'tooth': createTooth,
    'alveoli': createAlveoli,
    'nephron': createNephron,

    // ===== BIOLOGY: PLANT BIOLOGY =====
    'flower-structure': createFlowerStructure,
    'leaf-structure': createLeafStructure,
    'root-system': createRootSystem,
    'photosynthesis': createPhotosynthesis,
    'stem-cross-section': createStemCrossSection,
    'seed-structure': createSeedStructure,
    'stomata': createStomata,
    'xylem-phloem': createXylemPhloem,
    'germination': createGermination,
    'transpiration': createTranspiration,

    // ===== ADVANCED: PHYSICS & MATHEMATICS =====
    'double-slit': createDoubleSlit,
    'compton-scattering': createCompton,
    'bragg-diffraction': createBraggDiffraction,
    'faraday-law': createFaradayLaw,
    'lenz-law': createLenzLaw,
    'parametric-curve': createParametric,
    'polar-coordinates': createPolar,
    'vector-3d': createVector3D,
    'matrix-2x2': createMatrix2x2,
    'determinant': createDeterminant,
    'ohms-law-triangle': createOhmsLaw,
    'kirchhoff-current': createKirchhoffCurrent,
    'kirchhoff-voltage': createKirchhoffVoltage,
    'snells-law': createSnellsLaw,
    'doppler-effect': createDopplerEffect,
    'youngs-modulus': createYoungsModulus,
    'hookes-law': createHookesLaw,
    'bernoulli-equation': createBernoulli,
    'archimedes-principle': createArchimedesPrinciple,
    'coulombs-law': createCoulombsLaw,
    'gauss-law': createGaussLaw,
    'ampere-law': createAmpereLaw,
    'maxwell-equations': createMaxwellEquations,
    'wave-equation': createWaveEquation,
    'schrodinger-equation': createSchrodinger,
    'heisenberg-uncertainty': createHeisenberg,
    'pauli-exclusion': createPauliExclusion,
    'relativity-e-mc2': createRelativityE,
    'lorentz-factor': createLorentzFactor,
    'black-hole': createBlackHole,
    'big-bang': createBigBang,
    'standard-model': createStandardModel,

    // ===== ALIASES (Backward Compatibility) =====
    'graph-parabola': createParabola,
    'graph-circle': createCircleGraph,
};

/**
 * Get list of all available preset names
 */
export function getAvailablePresets(): string[] {
    return Object.keys(DIAGRAM_PRESETS).sort();
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(): Record<string, string[]> {
    return {
        'Physics - Mechanics': [
            'incline', 'hanging', 'pulley', 'beam', 'spring', 'pendulum',
            'projectile', 'freefall', 'collision', 'lever', 'atwood'
        ],
        'Physics - Compound': [
            'spring-projectile', 'spring-pendulum', 'double-pendulum',
            'incline-spring', 'coupled-oscillators', 'projectile-drag', 'conical-pendulum'
        ],
        'Physics - Environments': [
            'pendulum-air', 'pendulum-water', 'pendulum-fire', 'pendulum-vacuum',
            'projectile-air', 'projectile-water', 'projectile-fire', 'projectile-vacuum',
            'freefall-air', 'freefall-water', 'freefall-fire', 'freefall-vacuum',
            'medium-comparison'
        ],
        'Physics - Advanced': [
            'multi-contact', 'complex-incline', 'incline-pulley', 'three-body', 'circular-motion'
        ],
        'Physics - Electricity': [
            'circuit-series', 'circuit-parallel', 'resistor', 'capacitor',
            'inductor', 'battery', 'ammeter', 'voltmeter', 'diode', 'led'
        ],
        'Physics - Waves & Optics': [
            'wave-transverse', 'wave-longitudinal', 'wave-standing',
            'ray-diagram', 'lens-convex', 'lens-concave'
        ],
        'Chemistry - Apparatus': [
            'beaker', 'test-tube', 'flask-conical', 'burette', 'funnel'
        ],
        'Chemistry - Molecular': [
            'atom', 'molecule', 'molecule-water', 'molecule-co2', 'molecule-ch4'
        ],
        'Chemistry - Advanced': [
            'reaction', 'titration', 'distillation', 'benzene', 'glucose', 'amino-acid'
        ],
        'Biology - Molecules': [
            'dna', 'protein-helix', 'cell-membrane', 'atp', 'enzyme-substrate'
        ],
        'Mathematics - Shapes': [
            'axes-2d', 'triangle', 'triangle-equilateral', 'triangle-right',
            'triangle-isosceles', 'circle', 'rectangle', 'cube'
        ],
        'Mathematics - Graphs': [
            'graph-sine', 'vector', 'parabola', 'hyperbola', 'ellipse', 'circle-graph', 'modular'
        ],
        'Circuits - Advanced': [
            'lrc-series', 'lrc-parallel', 'lc-circuit', 'lr-circuit',
            'multi-resistor', 'rheostat', 'mixed-circuit'
        ],
    };
}

/**
 * Check if a preset exists
 */
export function hasPreset(name: string): boolean {
    return name in DIAGRAM_PRESETS;
}

/**
 * Get preset generator function
 */
export function getPreset(name: string): PresetGenerator | undefined {
    return DIAGRAM_PRESETS[name];
}
