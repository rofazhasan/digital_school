'use client';

import { useState, useMemo } from 'react';
import { DIAGRAM_PRESETS, getAvailablePresets } from '@/utils/diagrams';
import { FBDRenderer } from '@/components/fbd/FBDRenderer';

export default function DiagramTestGallery() {
    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const allPresets = getAvailablePresets();
    const totalCount = allPresets.length;

    // Categorize diagrams
    const categories = useMemo(() => {
        const cats: Record<string, string[]> = {
            'all': allPresets,
            'physics': allPresets.filter(name =>
                name.includes('mosfet') || name.includes('gate') || name.includes('flipflop') ||
                name.includes('pendulum') || name.includes('spring') || name.includes('circuit') ||
                name.includes('lens') || name.includes('mirror') || name.includes('wave') ||
                name.includes('carnot') || name.includes('bohr') || name.includes('maxwell') ||
                name.includes('double-slit') || name.includes('compton') || name.includes('schrodinger')
            ),
            'chemistry': allPresets.filter(name =>
                name.includes('beaker') || name.includes('molecule') || name.includes('benzene') ||
                name.includes('glycine') || name.includes('nucleotide') || name.includes('steroid') ||
                name.includes('nacl') || name.includes('diamond') || name.includes('ammonia')
            ),
            'biology': allPresets.filter(name =>
                name.includes('dna') || name.includes('cell') || name.includes('eye') ||
                name.includes('heart') || name.includes('kidney') || name.includes('flower') ||
                name.includes('photosynthesis') || name.includes('neuron')
            ),
            'mathematics': allPresets.filter(name =>
                name.includes('triangle') || name.includes('circle') || name.includes('graph') ||
                name.includes('vector') || name.includes('matrix') || name.includes('parabola') ||
                name.includes('cube') || name.includes('sphere')
            ),
        };
        return cats;
    }, [allPresets]);

    const filteredPresets = useMemo(() => {
        let presets = categories[selectedCategory] || allPresets;
        if (filter) {
            presets = presets.filter(name =>
                name.toLowerCase().includes(filter.toLowerCase())
            );
        }
        return presets;
    }, [filter, selectedCategory, categories, allPresets]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        🎨 Diagram Test Gallery
                    </h1>
                    <p className="text-lg text-gray-600">
                        Testing all {totalCount} diagram presets
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
                        <div className="text-sm text-gray-600">Total Diagrams</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-3xl font-bold text-green-600">{categories.physics?.length || 0}</div>
                        <div className="text-sm text-gray-600">Physics</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-3xl font-bold text-purple-600">{categories.chemistry?.length || 0}</div>
                        <div className="text-sm text-gray-600">Chemistry</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-3xl font-bold text-red-600">{categories.biology?.length || 0}</div>
                        <div className="text-sm text-gray-600">Biology</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-3xl font-bold text-orange-600">{categories.mathematics?.length || 0}</div>
                        <div className="text-sm text-gray-600">Mathematics</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search diagrams..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="biology">Biology</option>
                            <option value="mathematics">Mathematics</option>
                        </select>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        Showing {filteredPresets.length} of {totalCount} diagrams
                    </div>
                </div>

                {/* Diagram Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPresets.map((name) => (
                        <DiagramCard key={name} name={name} />
                    ))}
                </div>

                {filteredPresets.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No diagrams found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}

function DiagramCard({ name }: { name: string }) {
    const [error, setError] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    try {
        const diagram = DIAGRAM_PRESETS[name](`test-${name}`);

        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 truncate" title={name}>
                        {name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1">
                        {diagram.width} × {diagram.height}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
                    {error ? (
                        <div className="text-red-500 text-sm text-center">
                            ❌ Error: {error}
                        </div>
                    ) : (
                        <div className="w-full">
                            <FBDRenderer
                                diagram={diagram}
                                onLoad={() => setLoaded(true)}
                                onError={(err) => setError(err.message)}
                            />
                            {loaded && (
                                <div className="text-center mt-2 text-xs text-green-600">
                                    ✓ Loaded
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (err) {
        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 truncate" title={name}>
                        {name}
                    </h3>
                </div>
                <div className="p-4 bg-red-50 flex items-center justify-center min-h-[200px]">
                    <div className="text-red-500 text-sm text-center">
                        ❌ Failed to create diagram
                        <div className="text-xs mt-2">
                            {err instanceof Error ? err.message : 'Unknown error'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
