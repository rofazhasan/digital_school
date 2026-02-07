
import { parseDiagramsInText } from '../digital_school/utils/diagrams/inline-parser';

async function verifyUnifiedParser() {
    console.log("Starting Unified Parser Verification...");

    const testCases = [
        {
            name: "New Preset (Incline)",
            input: "Look at this: ##PRESET:incline(30,10,true)##",
        },
        {
            name: "Combination (Series)",
            input: "System: ##COMBINE:SERIES[spring,block]##",
        },
        {
            name: "Legacy FBD (Raw)",
            // Use a simple Excel-like definition
            input: "Diagram: ##P1(100,100) | F1@P1(50,0,F,force)##",
        },
        {
            name: "Legacy Preset (if any legacy specific logic remains)",
            input: "Preset: ##PRESET:hanging(5)##",
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        console.log(`\nTesting: ${test.name}`);
        try {
            const result = parseDiagramsInText(test.input);
            const isSVG = result.includes("<svg") && result.includes("</svg>");
            const isError = result.includes("Error parsing diagram");
            const isOriginal = result === test.input;

            console.log("Result starts with:", result.substring(0, 50).replace(/\n/g, ' '));

            if (isSVG && !isError) {
                console.log("✅ PASS: SVG generated");
                passed++;
            } else if (isError) {
                console.log(`❌ FAIL: Parser returned error`);
                failed++;
            } else if (isOriginal) {
                console.log(`❌ FAIL: Returned original text (parsing failed silently)`);
                failed++;
            } else {
                console.log(`❌ FAIL: Unexpected output format`);
                failed++;
            }
        } catch (e) {
            console.log(`❌ FAIL - Exception: ${e}`);
            failed++;
        }
    }

    console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

verifyUnifiedParser();
