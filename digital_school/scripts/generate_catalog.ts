import { getAvailablePresets, DIAGRAM_PRESETS } from '../utils/diagrams/index';
import { renderFBDToSVG } from '../utils/fbd/svg-renderer';
import * as fs from 'fs';
import * as path from 'path';

async function generateCatalog() {
    console.log('Generating World-Class Diagram Catalog...');
    const presets = getAvailablePresets();
    console.log(`Found ${presets.length} presets.`);

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>World-Class Diagram Catalog</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 2rem; }
        h1 { text-align: center; color: #0f172a; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem; align-items: start; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 1.5rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; height: auto; transition: transform 0.2s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #334155; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; font-size: 1.1rem; word-break: break-all; }
        .diagram-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; background: #fafafa; border-radius: 8px; border: 1px inset #f1f5f9; margin-top: 1rem; padding: 1rem; }
        .diagram-container svg { width: 100%; height: auto; display: block; border-radius: 4px; }
        .meta { font-size: 0.8rem; color: #64748b; margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; }
    </style>
</head>
<body>
    <h1>World-Class Diagram Catalog (${presets.length} Presets)</h1>
    <div class="grid">
`;

    for (const name of presets) {
        try {
            const id = `test-${name}`;
            const diagram = DIAGRAM_PRESETS[name](id);
            const svg = renderFBDToSVG(diagram);

            html += `
        <div class="card">
            <h3>Preset: ${name}</h3>
            <div class="diagram-container">
                ${svg}
            </div>
            <div class="meta">ID: ${id}</div>
        </div>
`;
        } catch (e) {
            console.error(`Error rendering ${name}:`, e);
            html += `
        <div class="card" style="border-color: #ef4444;">
            <h3>Preset: ${name} (FAILED)</h3>
            <div class="diagram-container" style="color: #ef4444;">
                Error: ${e instanceof Error ? e.message : String(e)}
            </div>
        </div>
`;
        }
    }

    html += `
    </div>
</body>
</html>
`;

    const outputPath = path.join(process.cwd(), 'DIAGRAM_CATALOG_WORLD_CLASS.html');
    fs.writeFileSync(outputPath, html);
    console.log(`Catalog generated: ${outputPath}`);
}

generateCatalog().catch(console.error);
