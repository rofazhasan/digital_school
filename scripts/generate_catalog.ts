
import fs from 'fs';
import path from 'path';
import { DIAGRAM_PRESETS, getAvailablePresets, getPresetsByCategory } from '../digital_school/utils/diagrams/index';
import { renderFBDToSVG } from '../digital_school/utils/fbd/svg-renderer';

const OUTPUT_DIR = '/Users/md.rofazhasanrafiu/.gemini/antigravity/brain/3ff0b58a-f5cb-42ad-9e5f-369843cb0603';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'DIAGRAM_CATALOG_PRINTABLE.html');

console.log('🚀 Generating Diagram Catalog...');

const categories = getPresetsByCategory();
let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Digital School Diagram Catalog</title>
    <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; background: #f0f2f5; }
        h1 { text-align: center; color: #2c3e50; }
        .category-header { 
            background: #2c3e50; color: white; padding: 10px 20px; 
            margin-top: 40px; border-radius: 8px; 
        }
        .grid { 
            display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; margin-top: 20px; 
        }
        .card { 
            background: white; border-radius: 12px; padding: 15px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            display: flex; flex-direction: column; align-items: center;
            transition: transform 0.2s;
            page-break-inside: avoid; /* For printing */
        }
        .card:hover { transform: translateY(-5px); }
        .card h3 { font-size: 16px; margin-bottom: 10px; color: #34495e; }
        .card svg { max-width: 100%; height: auto; }
        .stats { text-align: center; margin-bottom: 30px; font-size: 1.2em; color: #555; }
        
        @media print {
            body { background: white; }
            .card { box-shadow: none; border: 1px solid #ddd; }
            .category-header { background: #eee; color: black; break-after: avoid; }
        }
    </style>
</head>
<body>
    <h1>📚 Digital School Diagram Catalog</h1>
`;

const presets = getAvailablePresets();
htmlContent += `<div class="stats">Total Diagrams: <strong>${presets.length}</strong></div>`;

// Iterate by Category
for (const [category, names] of Object.entries(categories)) {
    if (names.length === 0) continue;

    htmlContent += `<h2 class="category-header">${category}</h2>`;
    htmlContent += `<div class="grid">`;

    for (const name of names) {
        try {
            const generator = DIAGRAM_PRESETS[name];
            if (!generator) continue;

            const diagram = generator(`${name}-demo`);
            let svg = renderFBDToSVG(diagram);

            // Fix SVG size for grid display
            svg = svg.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="200"');

            htmlContent += `
                <div class="card">
                    <h3>${name}</h3>
                    ${svg}
                </div>
            `;
        } catch (e) {
            console.error(`Failed to render ${name}:`, e);
            htmlContent += `
                <div class="card" style="background: #ffebee;">
                    <h3>${name}</h3>
                    <p style="color:red">Render Error</p>
                </div>
            `;
        }
    }
    htmlContent += `</div>`;
}

// Handle Uncategorized Presets
const allCategorized = new Set(Object.values(categories).flat());
const uncategorized = presets.filter(p => !allCategorized.has(p));

if (uncategorized.length > 0) {
    htmlContent += `<h2 class="category-header">Uncategorized / New</h2>`;
    htmlContent += `<div class="grid">`;
    for (const name of uncategorized) {
        try {
            const generator = DIAGRAM_PRESETS[name];
            const diagram = generator(`${name}-demo`);
            let svg = renderFBDToSVG(diagram);
            htmlContent += `
                <div class="card">
                    <h3>${name}</h3>
                    ${svg}
                </div>
            `;
        } catch (e) { console.error(e); }
    }
    htmlContent += `</div>`;
}

htmlContent += `</body></html>`;

fs.writeFileSync(OUTPUT_FILE, htmlContent);
console.log(`✅ Catalog generated at: ${OUTPUT_FILE}`);
