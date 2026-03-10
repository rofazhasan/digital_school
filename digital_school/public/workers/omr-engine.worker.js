// OMR Engine Web Worker
/* global cv, importScripts, self */

self.importScripts('/workers/opencv.js');
self.importScripts('/workers/jsqr.js');

let isCvReady = false;

cv['onRuntimeInitialized'] = () => {
    isCvReady = true;
    self.postMessage({ type: 'ready' });
};

// --- OMR Logic ---

const decodeQR = (mat) => {
    try {
        const rgba = new cv.Mat();
        cv.cvtColor(mat, rgba, cv.COLOR_GRAY2RGBA);
        const imgData = new Uint8ClampedArray(rgba.data);
        const code = jsQR(imgData, rgba.cols, rgba.rows);
        rgba.delete();
        if (code) {
            return JSON.parse(code.data);
        }
    } catch (e) {
        console.warn("QR Detection failed:", e);
    }
    return null;
};

const findPaperContour = (gray) => {
    let blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    let edges = new cv.Mat();
    cv.Canny(blurred, edges, 75, 200);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let paperContour = null;

    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);
        let peri = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4 && area > maxArea) {
            paperContour = approx;
            maxArea = area;
        } else {
            approx.delete();
        }
    }

    blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete();
    return paperContour;
};

const processFrame = (imageData, template) => {
    if (!isCvReady) return { error: 'CV not ready' };

    let src = cv.matFromImageData(imageData);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 0. Pre-processing: CLAHE for uniform lighting
    let clahe = new cv.createCLAHE(2.0, new cv.Size(8, 8));
    let equalized = new cv.Mat();
    clahe.apply(gray, equalized);
    clahe.delete();

    // 1. Detect ArUco Markers
    let dictionary = cv.getPredefinedDictionary(cv.DICT_4X4_50);
    let corners = new cv.MatVector();
    let ids = new cv.Mat();
    let parameters = new cv.DetectorParameters();

    cv.detectMarkers(equalized, dictionary, corners, ids, parameters);

    let markerPoints = {};
    let srcTri = null;

    if (ids.rows >= 4) {
        // Sort markers by ID to ensure correct orientation (0=TL, 1=TR, 2=BR, 3=BL)
        for (let i = 0; i < ids.rows; i++) {
            let id = ids.data32S[i];
            if (id >= 0 && id <= 3) {
                let corner = corners.get(i).data32F;
                let centerX = (corner[0] + corner[2] + corner[4] + corner[6]) / 4;
                let centerY = (corner[1] + corner[3] + corner[5] + corner[7]) / 4;
                markerPoints[id] = { x: centerX, y: centerY };
            }
        }
    }

    if (Object.keys(markerPoints).length === 4) {
        srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            markerPoints[0].x, markerPoints[0].y,
            markerPoints[1].x, markerPoints[1].y,
            markerPoints[2].x, markerPoints[2].y,
            markerPoints[3].x, markerPoints[3].y
        ]);
    } else {
        // Fallback: Detection via document contours
        let paper = findPaperContour(equalized);
        if (paper) {
            // Re-order paper points (TL, TR, BR, BL)
            let pts = [];
            for (let i = 0; i < 4; i++) pts.push({ x: paper.data32F[i * 2], y: paper.data32F[i * 2 + 1] });
            pts.sort((a, b) => a.y - b.y);
            let tl_tr = pts.slice(0, 2).sort((a, b) => a.x - b.x);
            let bl_br = pts.slice(2, 4).sort((a, b) => a.x - b.x);
            srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                tl_tr[0].x, tl_tr[0].y,
                tl_tr[1].x, tl_tr[1].y,
                bl_br[1].x, bl_br[1].y,
                bl_br[0].x, bl_br[0].y
            ]);
            paper.delete();
        }
    }

    if (!srcTri) {
        src.delete(); gray.delete(); equalized.delete(); corners.delete(); ids.delete();
        return { type: 'searching', markersFound: ids.rows };
    }

    // 2. Perspective Warp
    const outWidth = 800;
    const outHeight = 1131;
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        outWidth, 0,
        outWidth, outHeight,
        0, outHeight
    ]);

    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    let rectified = new cv.Mat();
    cv.warpPerspective(equalized, rectified, M, new cv.Size(outWidth, outHeight));

    // 3. Quality Metrics & Adaptive Thresholding
    let binary = new cv.Mat();
    cv.adaptiveThreshold(rectified, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 25, 10);

    // AI Quality Metrics
    const calculateQuality = (mat) => {
        let laplacian = new cv.Mat();
        cv.Laplacian(mat, laplacian, cv.CV_64F);
        let mean = new cv.Mat(), stddev = new cv.Mat();
        cv.meanStdDev(laplacian, mean, stddev);
        const sharpness = stddev.data64F[0] * stddev.data64F[0];

        let brightnessMean = cv.mean(mat)[0];

        laplacian.delete(); mean.delete(); stddev.delete();
        return { sharpness, brightness: brightnessMean };
    };
    const quality = calculateQuality(rectified);

    // 4. Advanced Bubble Analysis (Contour-based)
    let results = {
        markers: markerPoints,
        answers: {},
        roll: "",
        registration: "",
        set: "",
        confidence: 1.0,
        quality,
        conflicts: [],
        sections: { ROLL: {}, REG: {}, SET: {}, MCQ: {} },
        qrData: null
    };

    // 4. DETECT SECURED ID QR
    const qrData = decodeQR(rectified);
    if (qrData) {
        results.qrData = qrData;
    }

    if (template && template.bubbles) {
        // Find all candidates for bubbles in the binary image
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let detectedBubbles = [];
        const EXPECTED_RADIUS = (template.bubbles[0].r * outWidth);
        const TOLERANCE = 1.4; // Tolerance on radius

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            let rect = cv.boundingRect(cnt);
            let radius = (rect.width + rect.height) / 4;
            let circularity = (4 * Math.PI * area) / (Math.pow(cv.arcLength(cnt, true), 2));

            // Filter for bubbles using circularity and size
            if (circularity > 0.60 && radius > EXPECTED_RADIUS / TOLERANCE && radius < EXPECTED_RADIUS * TOLERANCE) {
                // Calculate fill intensity and variance
                let roi = binary.roi(rect);
                let mean = new cv.Mat(), stddev = new cv.Mat();
                cv.meanStdDev(roi, mean, stddev);
                let fillRatio = mean.data64F[0] / 255;
                let variance = stddev.data64F[0] * stddev.data64F[0];
                roi.delete(); mean.delete(); stddev.delete();

                detectedBubbles.push({
                    center: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                    fillRatio,
                    variance,
                    circularity,
                    radius
                });
            }
        }

        // --- GLOBAL NORMALIZATION ---
        let sortedFills = detectedBubbles.map(b => b.fillRatio).sort((a, b) => b - a);
        const blackPoint = sortedFills.length > 5 ? (sortedFills[0] + sortedFills[4]) / 2 : 0.8;
        const whitePoint = 0.05;
        const dynamicThreshold = (blackPoint - whitePoint) * 0.45 + whitePoint;

        // Map template bubbles...
        template.bubbles.forEach(logicalBubble => {
            const lx = logicalBubble.x * outWidth;
            const ly = logicalBubble.y * outHeight;
            const maxDist = EXPECTED_RADIUS * 1.5;

            let bestMatch = null;
            let minDist = maxDist;

            detectedBubbles.forEach(physBubble => {
                let dist = Math.sqrt(Math.pow(lx - physBubble.center.x, 2) + Math.pow(ly - physBubble.center.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    bestMatch = physBubble;
                }
            });

            const section = results.sections[logicalBubble.type];
            if (!section[logicalBubble.qId]) section[logicalBubble.qId] = [];

            section[logicalBubble.qId].push({
                option: logicalBubble.option,
                fillRatio: bestMatch ? bestMatch.fillRatio : 0,
                variance: bestMatch ? bestMatch.variance : 0
            });
        });

        // 5. Differential Analysis with ML-STYLE LOGIC
        const resolveGroup = (options, qId, type) => {
            if (!options || options.length === 0) return null;

            options.sort((a, b) => b.fillRatio - a.fillRatio);

            const strongest = options[0];
            const secondStrongest = options[1] || { fillRatio: 0, variance: 0 };

            // SOLIDITY & EDGE QUALITY CHECK
            const isStrongSolid = strongest.fillRatio > dynamicThreshold && strongest.variance < 2500;
            const isAmbiguous = strongest.fillRatio > dynamicThreshold * 0.7 && strongest.fillRatio < dynamicThreshold * 1.3;

            // Confidence per mark
            let markConfidence = 1.0;
            if (isAmbiguous) markConfidence *= 0.8;
            if (strongest.variance > 3500) markConfidence *= 0.9; // Grainy/Erasure

            const gap = strongest.fillRatio / Math.max(0.01, secondStrongest.fillRatio);
            if (gap < 2.0) markConfidence *= 0.85;

            // WORLD CLASS CONFLICT DETECTION
            if (strongest.fillRatio > dynamicThreshold && secondStrongest.fillRatio > dynamicThreshold * 0.8) {
                results.conflicts.push({ qId, type, issue: 'MULTIPLE_MARKS' });
                results.confidence *= 0.7;
                return { option: strongest.option, confidence: markConfidence * 0.5 };
            }

            if (strongest.fillRatio > dynamicThreshold) {
                return { option: strongest.option, confidence: markConfidence };
            }
            return null;
        };

        // Post-process sections
        for (let i = 0; i < 6; i++) {
            const res = resolveGroup(results.sections.ROLL[i], i, 'ROLL');
            results.roll += res ? res.option : "?";
            if (res) results.confidence *= res.confidence;
        }

        for (let i = 0; i < 10; i++) {
            const res = resolveGroup(results.sections.REG[i], i, 'REG');
            results.registration += res ? res.option : "?";
            if (res) results.confidence *= res.confidence;
        }

        const setRes = resolveGroup(results.sections.SET['set'], 'set', 'SET');
        results.set = setRes ? setRes.option : "?";
        if (setRes) results.confidence *= setRes.confidence;

        Object.keys(results.sections.MCQ).forEach(qId => {
            const res = resolveGroup(results.sections.MCQ[qId], qId, 'MCQ');
            if (res) {
                const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
                results.answers[qId] = {
                    option: MCQ_LABELS[parseInt(res.option)] || res.option,
                    confidence: res.confidence
                };
                results.confidence *= res.confidence;
            }
        });

        contours.delete(); hierarchy.delete();
    }

    // Cleanup
    src.delete(); gray.delete(); corners.delete(); ids.delete();
    srcTri.delete(); dstTri.delete(); M.delete(); rectified.delete(); binary.delete();

    return { type: 'success', data: results };
};

self.onmessage = (e) => {
    const { type, imageData, template } = e.data;
    if (type === 'process') {
        const result = processFrame(imageData, template);
        self.postMessage({ type: 'result', result });
    }
};
