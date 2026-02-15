
const { Jimp, intToRGBA } = require('jimp');
import jsQR from 'jsqr';

// ------------------------------------------------------------------
// OMR 2.0: Dynamic Layout based on 4-Corner QRs
// ------------------------------------------------------------------

export interface OMRResult {
    roll: string;
    set: string;
    reg: string;
    answers: Record<number, string>;
    error?: string;
    debugImage?: string;
    qrData?: any;
    grading?: { score: number; total: number; details: any[] };
}

// Layout constants relative to the WARPED ID card (Normalized 0..1)
const LAYOUT = {
    // These coordinates must match the React "OMRTemplate" layout.
    // Normalized to the content area bounded by the 4 QRs.
    // Roll: Top Center
    roll: { startX: 0.35, startY: 0.18, stepX: 0.045, stepY: 0.038, cols: 6, rows: 10 },
    // Set: Top Right
    set: { startX: 0.70, startY: 0.18, stepX: 0.045, stepY: 0.038, cols: 1, rows: 4 },
    // Answers: 4 columns
    answers: {
        cols: [0.10, 0.32, 0.54, 0.76],
        startY: 0.35,
        stepY: 0.024, // 25 rows
        optStepX: 0.035 // A,B,C,D spacing
    }
};

export async function processOMR(imageBuffer: Buffer, mimeType: string): Promise<OMRResult> {
    try {
        const image = await Jimp.read(imageBuffer);

        // 1. Resize for speed
        if (image.bitmap.width > 2000) image.resize({ w: 2000 });

        // 2. Scan 4 Corners for QRs
        console.log("Scanning anchors...");
        const anchors = await findQuadAnchors(image);
        console.log("Anchors found:", !!anchors.tl);

        if (!anchors.tl || !anchors.tr || !anchors.bl || !anchors.br) {
            return {
                roll: '', set: '', reg: '', answers: {},
                error: 'OMR 2.0 Error: Could not detect all 4 Corner QR Anchors. Please use the new template.',
                qrData: anchors,
                debugImage: await getDebugImage(image)
            };
        }

        // 3. Perspective Warp
        console.log("Warping...");
        const warpedWidth = 1000;
        const warpedHeight = 1400;
        const warped = warpPerspective(image, anchors, warpedWidth, warpedHeight);
        console.log("Warped.");

        // 4. Extract Bubbles & Classify using K-Means
        const result = scanAndClassify(warped);

        // 5. Generate Debug Image (Disabled for performance)
        const debugBase64 = "";

        return {
            ...result,
            qrData: anchors,
            debugImage: debugBase64
        };

    } catch (error: any) {
        console.error("OMR 2.0 Error:", error);
        return {
            roll: '', set: '', reg: '', answers: {},
            error: `Processing Failed: ${error.message}`
        };
    }
}

// ------------------------------------------------------------------
// 1. QUADRANT QR DETECTION
// ------------------------------------------------------------------
async function findQuadAnchors(image: any) {
    const w = image.bitmap.width;
    const h = image.bitmap.height;

    // Split into 4 quadrants with simple logic
    const regions = {
        tl: { x: 0, y: 0, w: w / 2, h: h / 2 },
        tr: { x: w / 2, y: 0, w: w / 2, h: h / 2 },
        bl: { x: 0, y: h / 2, w: w / 2, h: h / 2 },
        br: { x: w / 2, y: h / 2, w: w / 2, h: h / 2 }
    };

    const detected: any = {};

    for (const [key, reg] of Object.entries(regions)) {
        // Crop virtual region
        const crop = image.clone().crop({ x: reg.x, y: reg.y, w: reg.w, h: reg.h });

        // Detect
        const data = crop.bitmap.data;
        const code = jsQR(new Uint8ClampedArray(data), reg.w, reg.h);

        if (code) {
            // Locate center in GLOBAL coordinates
            const loc = code.location;
            const cx = reg.x + (loc.topLeftCorner.x + loc.topRightCorner.x + loc.bottomRightCorner.x + loc.bottomLeftCorner.x) / 4;
            const cy = reg.y + (loc.topLeftCorner.y + loc.topRightCorner.y + loc.bottomRightCorner.y + loc.bottomLeftCorner.y) / 4;

            try {
                const json = JSON.parse(code.data);
                if (json.loc) detected[json.loc.toLowerCase()] = { x: cx, y: cy };
                else detected[key] = { x: cx, y: cy };
            } catch (e) {
                detected[key] = { x: cx, y: cy };
            }
        }
    }

    return detected;
}

// ------------------------------------------------------------------
// 2. PERSPECTIVE TRANSFORM (Bilinear)
// ------------------------------------------------------------------
function warpPerspective(image: any, anchors: any, outW: number, outH: number) {
    const out = image.clone().resize({ w: outW, h: outH });
    // Fill white
    out.scan(0, 0, outW, outH, function (this: any, x: number, y: number, idx: number) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255;
    });

    const { tl, tr, bl, br } = anchors;

    for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
            const u = x / outW;
            const v = y / outH;

            // Interpolate Top & Bottom
            const xt = tl.x + (tr.x - tl.x) * u;
            const yt = tl.y + (tr.y - tl.y) * u;
            const xb = bl.x + (br.x - bl.x) * u;
            const yb = bl.y + (br.y - bl.y) * u;

            // Interpolate Final
            const srcX = xt + (xb - xt) * v;
            const srcY = yt + (yb - yt) * v;

            const color = image.getPixelColor(Math.floor(srcX), Math.floor(srcY));
            out.setPixelColor(color, x, y);
        }
    }
    return out;
}

// ------------------------------------------------------------------
// 3. SCANNING & K-MEANS
// ------------------------------------------------------------------
function scanAndClassify(image: any) {
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const samples: { val: number, type: string, id: string }[] = [];

    // 1. Collect all Samples (Roll, Set, Answers)
    // Sample Roll
    for (let c = 0; c < 6; c++) {
        for (let r = 0; r < 10; r++) {
            const cx = (LAYOUT.roll.startX + c * LAYOUT.roll.stepX) * w;
            const cy = (LAYOUT.roll.startY + r * LAYOUT.roll.stepY) * h;
            const val = getAverageBrightness(image, cx, cy, 3);
            samples.push({ val, type: 'roll', id: `${c}-${r}` });
        }
    }
    // Sample Set
    for (let r = 0; r < 4; r++) {
        const cx = (LAYOUT.set.startX) * w;
        const cy = (LAYOUT.set.startY + r * LAYOUT.set.stepY) * h;
        const val = getAverageBrightness(image, cx, cy, 3);
        samples.push({ val, type: 'set', id: `${r}` });
    }
    // Sample Answers
    for (let col = 0; col < 4; col++) {
        for (let q = 0; q < 25; q++) {
            for (let opt = 0; opt < 4; opt++) {
                const cx = (LAYOUT.answers.cols[col] + opt * LAYOUT.answers.optStepX) * w;
                const cy = (LAYOUT.answers.startY + q * LAYOUT.answers.stepY) * h;
                const val = getAverageBrightness(image, cx, cy, 3);
                const qNum = (col * 25) + q + 1;
                samples.push({ val, type: 'ans', id: `${qNum}-${opt}` });
            }
        }
    }

    // 2. K-MEANS CLUSTERING (k=2)
    let centroids = [0, 255];
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
        const c0 = [];
        const c1 = [];
        for (const s of samples) {
            if (Math.abs(s.val - centroids[0]) < Math.abs(s.val - centroids[1])) {
                c0.push(s.val);
            } else {
                c1.push(s.val);
            }
        }
        if (c0.length > 0) centroids[0] = c0.reduce((a, b) => a + b, 0) / c0.length;
        if (c1.length > 0) centroids[1] = c1.reduce((a, b) => a + b, 0) / c1.length;
    }

    // Identify Mark Threshold
    const threshold = (centroids[0] + centroids[1]) / 2;
    const isBlank = Math.abs(centroids[0] - centroids[1]) < 30;
    const isMarked = (val: number) => !isBlank && val < threshold;

    // 3. Interpret Results
    let roll = '';
    for (let c = 0; c < 6; c++) {
        let bestR = -1;
        let bestVal = 255;
        for (let r = 0; r < 10; r++) {
            const s = samples.find(x => x.type === 'roll' && x.id === `${c}-${r}`);
            if (s && isMarked(s.val) && s.val < bestVal) {
                bestVal = s.val;
                bestR = r;
            }
        }
        roll += (bestR !== -1) ? bestR : '?';
    }

    let setCode = 'A';
    let bestSetVal = 255;
    const sets = ['A', 'B', 'C', 'D'];
    for (let r = 0; r < 4; r++) {
        const s = samples.find(x => x.type === 'set' && x.id === `${r}`);
        if (s && isMarked(s.val) && s.val < bestSetVal) {
            bestSetVal = s.val;
            setCode = sets[r];
        }
    }

    const answers: any = {};
    for (let q = 1; q <= 100; q++) {
        let bestOpt = -1;
        let bestVal = 255;
        let count = 0;
        const col = Math.floor((q - 1) / 25);
        for (let opt = 0; opt < 4; opt++) {
            const s = samples.find(x => x.type === 'ans' && x.id === `${q}-${opt}`);
            if (s && isMarked(s.val)) {
                if (s.val < bestVal) {
                    bestVal = s.val;
                    bestOpt = opt;
                }
                count++;
            }
        }
        if (bestOpt !== -1 && count === 1) {
            answers[q] = ['A', 'B', 'C', 'D'][bestOpt];
        }
    }

    return { roll, set: setCode, answers, reg: '' };
}

function getAverageBrightness(image: any, x: number, y: number, r: number) {
    let total = 0, count = 0;
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            if (px >= 0 && px < w && py >= 0 && py < h) {
                const col = image.getPixelColor(px, py);
                const rgba = intToRGBA(col);
                total += (rgba.r + rgba.g + rgba.b) / 3;
                count++;
            }
        }
    }
    return total / count;
}

async function getDebugImage(image: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        image.getBase64("image/jpeg", (err: any, res: string) => {
            if (err) resolve("");
            else resolve(res);
        });
    });
}
