'use client';

import React, { useState } from 'react';
import { FBDRenderer } from '@/components/fbd/FBDRenderer';
import { fbdSamples } from '@/utils/fbd/samples';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Play } from 'lucide-react';

/**
 * Interactive FBD Samples Page
 * Demonstrates all sample diagram generation methods
 */
export default function FBDSamplesPage() {
    const [activeExample, setActiveExample] = useState<string>('fluentBuilder');
    const [diagram, setDiagram] = useState(() => fbdSamples.fluentBuilder());

    const examples = [
        {
            id: 'fluentBuilder',
            title: 'Fluent Builder API',
            description: 'Build diagrams step-by-step with method chaining',
            generator: fbdSamples.fluentBuilder,
            code: `new FBDBuilder('custom', 600, 400)
  .addPoint('center', 300, 200, 'O')
  .addForce('f1', 'center', 80, 0, 'F₁', 'applied')
  .addForce('f2', 'center', 60, 90, 'F₂', 'applied')
  .showAxes(true)
  .build()`,
        },
        {
            id: 'simpleFBD',
            title: 'Simple FBD',
            description: 'Quick creation with array of forces',
            generator: fbdSamples.simpleFBD,
            code: `createSimpleFBD('equilibrium', 300, 200, [
  { magnitude: 100, angle: 0, label: 'F₁' },
  { magnitude: 100, angle: 120, label: 'F₂' },
  { magnitude: 100, angle: 240, label: 'F₃' }
])`,
        },
        {
            id: 'blockOnIncline',
            title: 'Block on Incline',
            description: 'Physics preset with customizable parameters',
            generator: fbdSamples.blockOnIncline,
            code: `createBlockOnIncline(
  'incline-problem',
  30,    // angle in degrees
  10,    // mass in kg
  true   // include friction
)`,
        },
        {
            id: 'hangingMass',
            title: 'Hanging Mass',
            description: 'Simple tension and weight system',
            generator: fbdSamples.hangingMass,
            code: `createHangingMass(
  'hanging-mass',
  5  // mass in kg
)`,
        },
        {
            id: 'pulleySystem',
            title: 'Pulley System',
            description: 'Two-mass pulley configuration',
            generator: fbdSamples.pulleySystem,
            code: `createPulleySystem(
  'pulley-system',
  5,  // mass 1 in kg
  3   // mass 2 in kg
)`,
        },
        {
            id: 'beamWithMoment',
            title: 'Beam with Moment',
            description: 'Structural analysis with torque',
            generator: fbdSamples.beamWithMoment,
            code: `new FBDBuilder('beam', 700, 400)
  .addPoint('left', 150, 200, 'A')
  .addPoint('right', 550, 200, 'B')
  .addForce('ra', 'left', 60, 90, 'R_A')
  .addMoment('m1', 'left', 50, 'ccw', 'M')
  .build()`,
        },
        {
            id: 'complexDiagram',
            title: 'Complex System',
            description: 'Multiple points, forces, and moments',
            generator: fbdSamples.complexDiagram,
            code: `new FBDBuilder('complex', 800, 600)
  .addPoint('p1', 200, 300, 'A')
  .addPoint('p2', 400, 300, 'B')
  .addPoint('p3', 600, 300, 'C')
  .addForce('f1', 'p1', 80, 45, 'F₁')
  .addMoment('m1', 'p2', 30, 'cw', 'M₁')
  .build()`,
        },
    ];

    const handleRunExample = (exampleId: string) => {
        const example = examples.find(e => e.id === exampleId);
        if (example) {
            setActiveExample(exampleId);
            setDiagram(example.generator());
        }
    };

    const activeExampleData = examples.find(e => e.id === activeExample);

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">FBD Sample Code</h1>
                <p className="text-muted-foreground">
                    Interactive examples showing how to generate Free Body Diagrams programmatically
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Example List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Examples</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {examples.map((example) => (
                            <Button
                                key={example.id}
                                variant={activeExample === example.id ? 'default' : 'outline'}
                                className="w-full justify-start"
                                onClick={() => handleRunExample(example.id)}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                {example.title}
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Diagram and Code */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Diagram Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{activeExampleData?.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {activeExampleData?.description}
                            </p>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <FBDRenderer diagram={diagram} />
                        </CardContent>
                    </Card>

                    {/* Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                <code className="text-sm">{activeExampleData?.code}</code>
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Reference */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Reference</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="builder">
                        <TabsList>
                            <TabsTrigger value="builder">Builder API</TabsTrigger>
                            <TabsTrigger value="presets">Presets</TabsTrigger>
                            <TabsTrigger value="database">Database</TabsTrigger>
                        </TabsList>

                        <TabsContent value="builder" className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">FBDBuilder Methods</h3>
                                <ul className="space-y-1 text-sm">
                                    <li><code>.addPoint(id, x, y, label?)</code> - Add a point</li>
                                    <li><code>.addForce(id, pointId, magnitude, angle, label, type?)</code> - Add force</li>
                                    <li><code>.addMoment(id, pointId, magnitude, direction, label)</code> - Add moment</li>
                                    <li><code>.setBody(body)</code> - Set rigid body shape</li>
                                    <li><code>.showAxes(boolean)</code> - Toggle axes</li>
                                    <li><code>.showGrid(boolean)</code> - Toggle grid</li>
                                    <li><code>.build()</code> - Build final diagram</li>
                                </ul>
                            </div>
                        </TabsContent>

                        <TabsContent value="presets" className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Available Presets</h3>
                                <ul className="space-y-1 text-sm">
                                    <li><code>createSimpleFBD(id, x, y, forces[])</code></li>
                                    <li><code>createBlockOnIncline(id, angle, mass, friction)</code></li>
                                    <li><code>createHangingMass(id, mass, tension?)</code></li>
                                    <li><code>createPulleySystem(id, mass1, mass2)</code></li>
                                    <li><code>createBeamDiagram(id, length, load)</code></li>
                                </ul>
                            </div>
                        </TabsContent>

                        <TabsContent value="database" className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Saving to Database</h3>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{`const diagram = createBlockOnIncline('q1', 30, 10, true);

await prisma.question.create({
  data: {
    questionText: 'Calculate the normal force...',
    fbd: diagram,  // Store as JSON
    type: 'SUBJECTIVE',
    subject: 'Physics',
    // ... other fields
  }
});`}</code>
                                </pre>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
