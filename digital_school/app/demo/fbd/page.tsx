'use client';

import React from 'react';
import { FBDRenderer } from '@/components/fbd/FBDRenderer';
import { fbdExamples } from '@/utils/fbd/examples';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo page showcasing the FBD Renderer
 * Navigate to /demo/fbd to view
 */
export default function FBDDemoPage() {
    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">Free Body Diagram Renderer</h1>
                <p className="text-muted-foreground">
                    SVG-based physics diagram renderer for question banks, exams, and evaluations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Example 1: Block on Incline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Block on Incline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FBDRenderer diagram={fbdExamples.blockOnIncline} />
                    </CardContent>
                </Card>

                {/* Example 2: Hanging Mass */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hanging Mass</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FBDRenderer diagram={fbdExamples.hangingMass} />
                    </CardContent>
                </Card>

                {/* Example 3: Beam with Moment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Beam with Moment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FBDRenderer diagram={fbdExamples.beamWithMoment} />
                    </CardContent>
                </Card>

                {/* Example 4: Particle with Angled Forces */}
                <Card>
                    <CardHeader>
                        <CardTitle>Particle with Angled Forces</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FBDRenderer diagram={fbdExamples.particleWithAngledForces} />
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                        <li>✅ Color-coded force types (Weight, Normal, Friction, Tension, Applied)</li>
                        <li>✅ LaTeX math labels support</li>
                        <li>✅ Coordinate axes with labels</li>
                        <li>✅ Optional grid background</li>
                        <li>✅ Moment (torque) visualization</li>
                        <li>✅ Multiple body shapes (point, circle, rectangle, triangle, custom)</li>
                        <li>✅ Angle snapping (0°, 30°, 45°, 90°, etc.)</li>
                        <li>✅ Print-friendly SVG output</li>
                        <li>✅ Responsive scaling</li>
                    </ul>
                </CardContent>
            </Card>

            {/* Usage Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`import { FBDRenderer } from '@/components/fbd/FBDRenderer';

const myDiagram = {
  id: 'example',
  width: 600,
  height: 400,
  showAxes: true,
  points: [
    { id: 'p1', x: 300, y: 200, label: 'A' }
  ],
  forces: [
    {
      id: 'f1',
      pointId: 'p1',
      magnitude: 80,
      angle: 270,
      label: 'mg',
      type: 'weight'
    }
  ]
};

<FBDRenderer diagram={myDiagram} />`}</code>
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
