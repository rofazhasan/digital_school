'use client';

import React, { useState } from 'react';
import { FBDEditor } from '@/components/fbd/FBDEditor';
import type { FBDDiagram } from '@/utils/fbd/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Demo page for the interactive FBD Editor
 */
export default function FBDEditorDemoPage() {
    const [savedDiagram, setSavedDiagram] = useState<FBDDiagram | null>(null);

    const handleSave = (diagram: FBDDiagram) => {
        setSavedDiagram(diagram);
        alert('Diagram saved! Check the "Saved Diagram" tab.');
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">Interactive FBD Editor</h1>
                <p className="text-muted-foreground">
                    Create Free Body Diagrams visually with drag-and-drop tools
                </p>
            </div>

            <Tabs defaultValue="editor">
                <TabsList>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="saved">Saved Diagram</TabsTrigger>
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-6">
                    <FBDEditor onSave={handleSave} />
                </TabsContent>

                <TabsContent value="saved" className="mt-6">
                    {savedDiagram ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Saved Diagram</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                                    {JSON.stringify(savedDiagram, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No diagram saved yet. Create one in the Editor tab.
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="instructions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>How to Use the Editor</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">1. Add Points</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click "Point" mode and click on the canvas to add points where forces will be applied.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">2. Add Forces</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click "Force" mode, configure the force settings (label, magnitude, type), select a point,
                                    then click on the canvas to set the force direction.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3. Customize Display</h3>
                                <p className="text-sm text-muted-foreground">
                                    Toggle grid, axes, snap-to-grid, and angle snapping options to customize your diagram.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">4. Edit and Refine</h3>
                                <p className="text-sm text-muted-foreground">
                                    Use undo/redo buttons to correct mistakes. Select items and use the delete button to remove them.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">5. Save or Export</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click "Save Diagram" to save (triggers onSave callback) or use the export button to download as JSON.
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Tips</h4>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Enable "Snap to Grid" for precise alignment</li>
                                    <li>Enable "Snap Angle" to lock forces to common angles (0°, 30°, 45°, 90°, etc.)</li>
                                    <li>Use different force types for automatic color coding</li>
                                    <li>The grid size is 20px by default</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
