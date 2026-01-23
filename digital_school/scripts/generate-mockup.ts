
const { Jimp, intToRGBA } = require('jimp');
// We need qrcode to generate REAL QR codes for detection
const QRCode = require('qrcode');

async function generate() {
    console.log("Generating Mockup...");

    // Create base A4 white canvas
    // 210mm x 297mm @ ~85dpi => 700x1000 approx
    // Let's use 1000x1400 (matches our warp target for simplicity)
    const w = 1000;
    const h = 1400;

    // Jimp v1+ constructor adjustment:
    // Some versions use new Jimp({ width, height, color })
    // Some use new Jimp(w, h, color)
    // If previous failed, we try constructing empty then resizing/filling
    // Or we rely on `read` from buffer if constructor is flaky?
    // Let's try the object syntax which is cleaner for v1.
    // If that fails, we fallback to Jimp.create(w,h) if available.

    // Actually, let's use a safe reliable way: Read a 1x1 white pixel or create via Bitmap
    // Or just try:
    let image;
    try {
        image = new Jimp({ width: w, height: h, color: 0xFFFFFFFF });
    } catch (e) {
        // Fallback for older/classic Jimp signature
        image = new Jimp(w, h, 0xFFFFFFFF);
    }

    // Helper to draw Rect (manual scan because `image.scan` this context is tricky in TS)
    const drawRect = (x: number, y: number, rectW: number, rectH: number, color = 0x000000FF) => {
        image.scan(x, y, rectW, rectH, (px: number, py: number, idx: number) => {
            image.bitmap.data[idx] = (color >>> 24) & 0xFF;
            image.bitmap.data[idx + 1] = (color >>> 16) & 0xFF;
            image.bitmap.data[idx + 2] = (color >>> 8) & 0xFF;
            image.bitmap.data[idx + 3] = color & 0xFF;
        });
    };

    // Draw 4 Corner Anchors
    const qrs = [
        { loc: "TL", x: 50, y: 50 },
        { loc: "TR", x: w - 150, y: 50 },
        { loc: "BL", x: 50, y: h - 150 },
        { loc: "BR", x: w - 150, y: h - 150 }
    ];

    for (const anchor of qrs) {
        try {
            const buf = await QRCode.toBuffer(JSON.stringify({ loc: anchor.loc }), { width: 100, margin: 0 });
            const qrImg = await Jimp.read(buf);
            image.composite(qrImg, anchor.x, anchor.y);
        } catch (e) {
            console.error("QR Gen Error:", e);
            // Fallback black box
            drawRect(anchor.x, anchor.y, 100, 100, 0x000000FF);
        }
    }

    // Simulate Answers (Rows)
    // Layout relative to corners 0..1 (Projected onto 1000x1400)
    // But wait, the anchors are INSET.
    // In our logic `findQuadAnchors` finds the CENTER of the QR.
    // QR at 50,50 size 100 => center 100,100.
    // QR at w-150 (850), 50 => center 900, 100.
    // So warping maps (100,100)..(900,100) to (0,0)..(1000,0) (normalized).

    // We need to place bubbles relative to these anchor centers.
    // Let's define the "content area" as the box between QR centers.
    // Left: 100, Right: 900 (Width 800)
    // Top: 100, Bottom: 1300 (Height 1200)

    const contentX = 100;
    const contentY = 100;
    const contentW = 800;
    const contentH = 1200;

    // Helper to draw Mark relative to Content Area (0..1)
    const drawMark = (u: number, v: number) => {
        const cx = contentX + u * contentW;
        const cy = contentY + v * contentH;
        // Draw circle approx
        drawRect(Math.floor(cx) - 5, Math.floor(cy) - 5, 10, 10, 0x000000FF);
    };

    // Roll: 1,2,3,4,5,6
    // Layout: startX: 0.35, startY: 0.18, stepX: 0.045, stepY: 0.038
    // Col 0 -> Row 1 (1)
    drawMark(0.35 + 0 * 0.045, 0.18 + 1 * 0.038);
    // Col 1 -> Row 2 (2)
    drawMark(0.35 + 1 * 0.045, 0.18 + 2 * 0.038);
    // Col 2 -> Row 3 (3)
    drawMark(0.35 + 2 * 0.045, 0.18 + 3 * 0.038);

    // Set: 'A' (Row 0)
    // startX: 0.70, startY: 0.18
    drawMark(0.70, 0.18 + 0 * 0.038);

    // Answers: Q1 -> A (Col 0, Opt 0)
    // cols: [0.10, ...], startY: 0.35
    // Q1 is Col 0, Row 0
    drawMark(0.10 + 0 * 0.035, 0.35 + 0 * 0.024);

    // Q26 -> B (Col 1, Row 0, Opt 1)
    // Col 1 is 0.32
    drawMark(0.32 + 1 * 0.035, 0.35 + 0 * 0.024);

    // Save
    // await image.writeAsync('mockup-omr.jpg');
    await new Promise<void>((resolve, reject) => {
        image.write('mockup-omr.jpg', (err: any) => {
            if (err) reject(err);
            else resolve();
        });
    });
    console.log("Saved mockup-omr.jpg");
}

generate();
