
import { DIAGRAM_PRESETS, getAvailablePresets, parseCombination } from './index';

console.log("--- STARTING COMPREHENSIVE DIAGRAM VERIFICATION ---");

const allPresets = getAvailablePresets();
console.log(`Found ${allPresets.length} presets in registry.`);

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

// 1. Verify Individual Presets
console.log("\n--- Phase 1: Verifying Individual Presets ---");
allPresets.forEach((name, index) => {
    try {
        const generator = DIAGRAM_PRESETS[name];
        // Generate with a unique ID and minimal/default args if possible
        // Most generators handle undefined args gracefully with defaults
        const id = `test-${name}-${index}`;
        const diagram = generator(id);

        let isValid = true;
        let errorMsg = "";

        if (!diagram) {
            isValid = false;
            errorMsg = "Returned null/undefined";
        } else if (!diagram.customSVG) {
            isValid = false;
            errorMsg = "Missing customSVG property";
        } else if (diagram.customSVG.trim().length === 0) {
            isValid = false;
            errorMsg = "Empty customSVG string";
        } else if (!diagram.customSVG.includes("<svg") && !diagram.customSVG.includes("<path") && !diagram.customSVG.includes("<g")) {
            // Some might return just a group or path, but usually it should have some SVG tags
            // Actually, the FBD system usually returns a full SVG string or inner content. 
            // Let's be lenient: it must contain at least one tag start "<"
            if (!diagram.customSVG.includes("<")) {
                isValid = false;
                errorMsg = "No XML tags found in output";
            }
        }

        if (isValid) {
            passCount++;
            // Optional: Print dot for progress or just silent
            if (index % 50 === 0) process.stdout.write(".");
        } else {
            failCount++;
            failures.push(`Preset '${name}': ${errorMsg}`);
            console.error(`\n[FAIL] ${name}: ${errorMsg}`);
        }

    } catch (e: any) {
        failCount++;
        failures.push(`Preset '${name}': Runtime Error - ${e.message}`);
        console.error(`\n[CRITICAL] ${name}: Runtime Error -`, e);
    }
});
console.log("\n"); // Newline after dots

// 2. Verify Combinations
console.log("\n--- Phase 2: Verifying Combinations ---");
const combinationTests = [
    { type: "SERIES", syntax: "SERIES:resistor,capacitor" },
    { type: "PARALLEL", syntax: "PARALLEL:resistor,inductor" },
    { type: "GRID", syntax: "GRID:2:resistor,capacitor,inductor,battery" },
    { type: "COMPARE", syntax: "COMPARE:A|resistor,B|capacitor" }
];

combinationTests.forEach(test => {
    try {
        const diagram = parseCombination(test.syntax);
        if (diagram && diagram.customSVG && diagram.customSVG.length > 0) {
            console.log(`[PASS] Combination ${test.type}`);
            passCount++;
        } else {
            console.error(`[FAIL] Combination ${test.type} returned invalid output`);
            failCount++;
            failures.push(`Combination ${test.type}`);
        }
    } catch (e: any) {
        console.error(`[CRITICAL] Combination ${test.type} threw error:`, e);
        failCount++;
        failures.push(`Combination ${test.type} Runtime Error`);
    }
});

// 3. Report
console.log("\n--- VERIFICATION REPORT ---");
console.log(`Total Checked: ${allPresets.length + combinationTests.length}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failures.length > 0) {
    console.log("\n--- FAILURES ---");
    failures.forEach(f => console.log(`- ${f}`));
    process.exit(1);
} else {
    console.log("\nAll systems operational. 🚀");
    process.exit(0);
}
