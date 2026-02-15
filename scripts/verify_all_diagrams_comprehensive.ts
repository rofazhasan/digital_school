
import { DIAGRAM_PRESETS, getAvailablePresets } from '../digital_school/utils/diagrams/index';
import { renderFBDToSVG } from '../digital_school/utils/fbd/svg-renderer';
import { parseDiagramsInText } from '../digital_school/utils/diagrams/inline-parser';

console.log('🚀 Starting Comprehensive Diagram Verification (350+ Diagrams)...\n');

let passed = 0;
let failed = 0;
const errors: string[] = [];

// 1. Verify Preset Count
const presets = getAvailablePresets();
console.log(`📦 Found ${presets.length} registered presets.`);

if (presets.length < 350) {
    console.warn(`⚠️ Warning: Preset count (${presets.length}) is less than the target of 350.`);
} else {
    console.log(`✅ Target met: > 350 presets.`);
}

// 2. Verify Every Single Preset
console.log('\n🔍 Verifying each preset generation and rendering...');

for (const name of presets) {
    try {
        const generator = DIAGRAM_PRESETS[name];
        if (!generator) {
            throw new Error(`Generator not found for ${name}`);
        }

        // Generate diagram object
        const diagram = generator(`test-${name}`);

        // Basic Validation
        if (!diagram.id || !diagram.width || !diagram.height) {
            throw new Error(`Invalid diagram structure for ${name}`);
        }

        // Render to SVG (catch rendering errors)
        const svg = renderFBDToSVG(diagram);

        if (!svg.includes('<svg') || !svg.includes('</svg>')) {
            throw new Error(`SVG generation failed for ${name}`);
        }

        // process.stdout.write('.'); // Dot progress
        passed++;
    } catch (e: any) {
        failed++;
        console.error(`\n❌ Failed: ${name} - ${e.message}`);
        errors.push(`${name}: ${e.message}`);
    }
}

console.log('\n\n✨ Verification Complete ✨');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
    console.error('\nErrors:');
    errors.forEach(e => console.error(`- ${e}`));
    process.exit(1);
} else {
    console.log('\n🎉 ALL DIAGRAMS VERIFIED SUCCESSFULLY!');
    process.exit(0);
}
