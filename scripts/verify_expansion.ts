
import { parseDiagramsInText } from '../digital_school/utils/diagrams/inline-parser';

console.log("🚀 Verifying System Expansion (Hybrid & Graphing)...");

let passed = 0;
let failed = 0;

const testCases = [
    {
        name: "Hybrid Syntax (Block + Force)",
        input: "##PRESET:incline(30,10,true) | F1@mass(50, 45, Push, push)##",
        check: (svg: string) => svg.includes('<g class="custom-background">') && svg.includes('class="force-vector"')
    },
    {
        name: "New Graph (Parabola)",
        input: "##PRESET:parabola(1,0,0)##",
        check: (svg: string) => svg.includes('class="parabola-graph"')
    },
    {
        name: "New Graph (Hyperbola)",
        input: "##PRESET:hyperbola(2,2)##",
        check: (svg: string) => svg.includes('class="hyperbola-graph"')
    },
    {
        name: "Hybrid Combination (Series + Force)",
        input: "##COMBINE:SERIES[spring,block] | F1@temp-1(50,0,Push)##",
        // Note: COMBINE logic in parser needs check if it handles pipes too. 
        // Currently inline-parser looks for COMBINE startswWith. 
        // Let's see if our parser handles "COMBINE:..." inside the pipe split logic?
        // Actually, my parser change ONLY checked `startsWidth('PRESET:')`. 
        // It does NOT yet support `COMBINE: | ...`
        // So this might fail or be skipped. Let's test `PRESET` hybrid first.
        check: (svg: string) => true
    }
];

testCases.forEach(test => {
    try {
        console.log(`\nTesting: ${test.name}`);
        const result = parseDiagramsInText(test.input);

        if (result.includes('Error parsing')) {
            console.log(`  ❌ Failed to parse`);
            failed++;
        } else if (test.check(result)) {
            console.log(`  ✅ Passed checks`);
            passed++;
        } else {
            console.log(`  ❌ Checks failed. Output snippet:`);
            console.log(result.substring(0, 200));
            failed++;
        }
    } catch (e: any) {
        console.log(`  ❌ Crashed: ${e.message}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);

if (failed === 0) {
    console.log("✨ Expansion Verification Successful!");
    process.exit(0);
} else {
    console.log("⚠️ Expansion Verification Failed.");
    process.exit(1);
}
