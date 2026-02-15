/**
 * Sample Code: Generating Free Body Diagrams Programmatically
 * 
 * This file demonstrates various ways to create FBD diagrams
 * for use in question banks, exams, and problem-solving exercises
 */

import {
    FBDBuilder,
    createSimpleFBD,
    createBlockOnIncline,
    createHangingMass,
    createPulleySystem,
    createBeamDiagram,
    serializeFBD,
    validateFBD,
} from '@/utils/fbd/generator';
import type { FBDDiagram } from '@/utils/fbd/types';

// ============================================
// EXAMPLE 1: Using the Fluent Builder API
// ============================================

export function example1_FluentBuilder(): FBDDiagram {
    const diagram = new FBDBuilder('custom-diagram', 600, 400)
        // Add the center point
        .addPoint('center', 300, 200, 'O')

        // Add forces
        .addForce('f1', 'center', 80, 0, 'F₁', 'applied')      // Right
        .addForce('f2', 'center', 60, 90, 'F₂', 'applied')     // Up
        .addForce('f3', 'center', 70, 180, 'F₃', 'applied')    // Left
        .addForce('f4', 'center', 50, 270, 'mg', 'weight')     // Down

        // Configure display
        .showAxes(true)
        .showGrid(false)
        .showAngles(true)

        // Set body shape
        .setBody({
            type: 'point',
            centerX: 300,
            centerY: 200,
        })

        .build();

    console.log('Example 1:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 2: Quick Simple FBD
// ============================================

export function example2_SimpleFBD(): FBDDiagram {
    const diagram = createSimpleFBD(
        'equilibrium-forces',
        300,
        200,
        [
            { magnitude: 100, angle: 0, label: 'F₁', type: 'applied' },
            { magnitude: 100, angle: 120, label: 'F₂', type: 'applied' },
            { magnitude: 100, angle: 240, label: 'F₃', type: 'applied' },
        ]
    );

    console.log('Example 2:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 3: Physics Problem - Block on Incline
// ============================================

export function example3_BlockOnIncline(): FBDDiagram {
    // Create a block on a 30° incline with friction
    const diagram = createBlockOnIncline(
        'incline-problem',
        30,    // incline angle in degrees
        10,    // mass in kg
        true   // include friction
    );

    console.log('Example 3:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 4: Hanging Mass System
// ============================================

export function example4_HangingMass(): FBDDiagram {
    const diagram = createHangingMass(
        'hanging-mass',
        5  // mass in kg
    );

    console.log('Example 4:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 5: Pulley System (Two Masses)
// ============================================

export function example5_PulleySystem(): FBDDiagram {
    const diagram = createPulleySystem(
        'pulley-system',
        5,  // mass 1 in kg
        3   // mass 2 in kg
    );

    console.log('Example 5:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 6: Beam with Moment
// ============================================

export function example6_BeamWithMoment(): FBDDiagram {
    const diagram = new FBDBuilder('beam-moment', 700, 400)
        .addPoint('left', 150, 200, 'A')
        .addPoint('right', 550, 200, 'B')
        .addPoint('center', 350, 200, 'C')

        // Reactions
        .addForce('ra', 'left', 60, 90, 'R_A', 'normal')
        .addForce('rb', 'right', 60, 90, 'R_B', 'normal')

        // Applied load
        .addForce('load', 'center', 80, 270, 'W', 'applied')

        // Moment at point A
        .addMoment('m1', 'left', 50, 'ccw', 'M')

        .setBody({
            type: 'rectangle',
            centerX: 350,
            centerY: 200,
            width: 400,
            height: 20,
        })

        .showGrid(true)
        .build();

    console.log('Example 6:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 7: Custom Complex Diagram
// ============================================

export function example7_ComplexDiagram(): FBDDiagram {
    const diagram = new FBDBuilder('complex-system', 800, 600)
        // Multiple points
        .addPoint('p1', 200, 300, 'A')
        .addPoint('p2', 400, 300, 'B')
        .addPoint('p3', 600, 300, 'C')

        // Forces at different points
        .addForce('f1', 'p1', 80, 45, 'F₁', 'applied')
        .addForce('f2', 'p1', 60, 270, 'm₁g', 'weight')
        .addForce('t1', 'p1', 70, 0, 'T₁', 'tension')

        .addForce('f3', 'p2', 90, 90, 'N', 'normal')
        .addForce('f4', 'p2', 90, 270, 'm₂g', 'weight')

        .addForce('f5', 'p3', 50, 135, 'F₂', 'applied')
        .addForce('f6', 'p3', 40, 270, 'm₃g', 'weight')
        .addForce('t2', 'p3', 70, 180, 'T₂', 'tension')

        // Moments
        .addMoment('m1', 'p2', 30, 'cw', 'M₁')

        .showAxes(true)
        .showGrid(true)
        .showAngles(true)

        .build();

    console.log('Example 7:', serializeFBD(diagram));
    return diagram;
}

// ============================================
// EXAMPLE 8: Saving to Database (Question)
// ============================================

export async function example8_SaveToDatabase() {
    // This would be in your API route or server action
    const diagram = createBlockOnIncline('physics-q1', 30, 10, true);

    // Validate before saving
    const validation = validateFBD(diagram);
    if (!validation.valid) {
        console.error('Invalid FBD:', validation.errors);
        return;
    }

    // Example Prisma query (pseudo-code)
    /*
    const question = await prisma.question.create({
      data: {
        type: 'SUBJECTIVE',
        subject: 'Physics',
        questionText: 'A 10 kg block rests on a 30° incline. Draw the free body diagram and calculate the normal force.',
        fbd: diagram,  // Store as JSON
        marks: 5,
        difficulty: 'MEDIUM',
        classId: 'some-class-id',
        createdById: 'user-id',
        // ... other fields
      },
    });
    */

    console.log('Example 8: FBD saved to database');
    console.log(serializeFBD(diagram));
}

// ============================================
// EXAMPLE 9: Loading from Database
// ============================================

export async function example9_LoadFromDatabase() {
    // Example Prisma query (pseudo-code)
    /*
    const question = await prisma.question.findUnique({
      where: { id: 'question-id' },
      select: {
        questionText: true,
        fbd: true,
      },
    });
  
    if (question?.fbd) {
      const diagram = question.fbd as FBDDiagram;
      
      // Validate loaded data
      const validation = validateFBD(diagram);
      if (validation.valid) {
        // Render the diagram
        return <FBDRenderer diagram={diagram} />;
      }
    }
    */

    console.log('Example 9: Load FBD from database');
}

// ============================================
// EXAMPLE 10: Batch Generation for Exam
// ============================================

export function example10_BatchGeneration(): FBDDiagram[] {
    const diagrams: FBDDiagram[] = [];

    // Generate 5 different incline problems
    for (let i = 0; i < 5; i++) {
        const angle = 15 + i * 15; // 15°, 30°, 45°, 60°, 75°
        const mass = 5 + i * 2;     // 5kg, 7kg, 9kg, 11kg, 13kg

        diagrams.push(
            createBlockOnIncline(`incline-${i + 1}`, angle, mass, i % 2 === 0)
        );
    }

    console.log(`Example 10: Generated ${diagrams.length} diagrams`);
    return diagrams;
}

// ============================================
// USAGE IN COMPONENTS
// ============================================

/*
// In a React component:

import { FBDRenderer } from '@/components/fbd/FBDRenderer';
import { example1_FluentBuilder } from '@/utils/fbd/samples';

export function PhysicsQuestion() {
  const diagram = example1_FluentBuilder();
  
  return (
    <div>
      <h2>Question: Find the resultant force</h2>
      <FBDRenderer diagram={diagram} />
    </div>
  );
}
*/

// ============================================
// EXPORT ALL EXAMPLES
// ============================================

export const fbdSamples = {
    fluentBuilder: example1_FluentBuilder,
    simpleFBD: example2_SimpleFBD,
    blockOnIncline: example3_BlockOnIncline,
    hangingMass: example4_HangingMass,
    pulleySystem: example5_PulleySystem,
    beamWithMoment: example6_BeamWithMoment,
    complexDiagram: example7_ComplexDiagram,
    batchGeneration: example10_BatchGeneration,
};

