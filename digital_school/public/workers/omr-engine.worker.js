// OMR Engine Web Worker
/* global cv, importScripts, self */

self.importScripts('/workers/opencv.js');

let isCvReady = false;

cv['onRuntimeInitialized'] = () => {
    isCvReady = true;
    self.postMessage({ type: 'ready' });
};

// --- OMR Logic ---

const processFrame = (imageData, template) => {
    if (!isCvReady) return { error: 'CV not ready' };

    let src = cv.matFromImageData(imageData);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. Detect ArUco Markers
    let dictionary = cv.getPredefinedDictionary(cv.DICT_4X4_50);
    let corners = new cv.MatVector();
    let ids = new cv.Mat();
    let parameters = new cv.DetectorParameters();

    cv.detectMarkers(gray, dictionary, corners, ids, parameters);

    if (ids.rows < 4) {
        // Not enough markers found
        src.delete(); gray.delete(); corners.delete(); ids.delete();
        return { type: 'searching', markersFound: ids.rows };
    }

    // Sort markers by ID to ensure correct orientation (0=TL, 1=TR, 2=BR, 3=BL)
    let markerPoints = {};
    for (let i = 0; i < ids.rows; i++) {
        let id = ids.data32S[i];
        if (id >= 0 && id <= 3) {
            let corner = corners.get(i).data32F;
            // Get center of marker
            let centerX = (corner[0] + corner[2] + corner[4] + corner[6]) / 4;
            let centerY = (corner[1] + corner[3] + corner[5] + corner[7]) / 4;
            markerPoints[id] = { x: centerX, y: centerY };
        }
    }

    if (Object.keys(markerPoints).length < 4) {
        src.delete(); gray.delete(); corners.delete(); ids.delete();
        return { type: 'searching', markersFound: Object.keys(markerPoints).length };
    }

    // 2. Perspective Warp
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        markerPoints[0].x, markerPoints[0].y,
        markerPoints[1].x, markerPoints[1].y,
        markerPoints[2].x, markerPoints[2].y,
        markerPoints[3].x, markerPoints[3].y
    ]);

    // Target dimensions (standardized to template or aspect ratio)
    const outWidth = 800;
    const outHeight = 1131; // A4 aspect ratio approx
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        outWidth, 0,
        outWidth, outHeight,
        0, outHeight
    ]);

    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    let rectified = new cv.Mat();
    cv.warpPerspective(gray, rectified, M, new cv.Size(outWidth, outHeight));

    // 3. Adaptive Thresholding
    let binary = new cv.Mat();
    cv.adaptiveThreshold(rectified, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 25, 10);

    // 4. Advanced Bubble Analysis (Contour-based)
    let results = {
        markers: markerPoints,
        answers: {},
        roll: "",
        registration: "",
        set: "",
        confidence: 1.0,
        conflicts: [], // List of qIds with issues
        sections: { ROLL: {}, REG: {}, SET: {}, MCQ: {} }
    };

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
                // Calculate fill intensity (non-zero pixels / area)
                let roi = binary.roi(rect);
                let nonZero = cv.countNonZero(roi);
                let fillRatio = nonZero / (rect.width * rect.height);
                roi.delete();

                detectedBubbles.push({
                    center: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                    fillRatio: fillRatio
                });
            }
        }

        // --- GLOBAL NORMALIZATION ---
        // Find the darkest bubbles to establish a "Blackpoint" baseline
        let sortedFills = detectedBubbles.map(b => b.fillRatio).sort((a, b) => b - a);
        const blackPoint = sortedFills.length > 5 ? (sortedFills[0] + sortedFills[4]) / 2 : 0.8;
        const whitePoint = 0.05;
        const dynamicThreshold = (blackPoint - whitePoint) * 0.45 + whitePoint;

        // Map template bubbles to the nearest physically detected bubble
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
                fillRatio: bestMatch ? bestMatch.fillRatio : 0
            });
        });

        // 5. Differential Analysis with CONFLICT DETECTION
        const resolveGroup = (options, qId, type) => {
            if (!options || options.length === 0) return null;

            options.sort((a, b) => b.fillRatio - a.fillRatio);

            const strongest = options[0];
            const secondStrongest = options[1] || { fillRatio: 0 };

            // MULTIPLE MARKS DETECTION
            if (strongest.fillRatio > dynamicThreshold && secondStrongest.fillRatio > dynamicThreshold * 0.7) {
                results.conflicts.push({ qId, type, issue: 'MULTIPLE_MARKS' });
                results.confidence *= 0.8;
                return strongest.option;
            }

            if (strongest.fillRatio > dynamicThreshold) {
                const gap = strongest.fillRatio / Math.max(0.01, secondStrongest.fillRatio);
                if (gap < 2.0) results.confidence *= 0.95;
                return strongest.option;
            }
            return null;
        };

        // Post-process sections
        for (let i = 0; i < 6; i++) {
            const rollDigit = resolveGroup(results.sections.ROLL[i], i, 'ROLL');
            results.roll += rollDigit !== null ? rollDigit : "?";

            const regDigit = resolveGroup(results.sections.REG[i], i, 'REG');
            results.registration += regDigit !== null ? regDigit : "?";
        }

        const setCode = resolveGroup(results.sections.SET['set'], 'set', 'SET');
        results.set = setCode !== null ? setCode : "?";

        Object.keys(results.sections.MCQ).forEach(qId => {
            const opt = resolveGroup(results.sections.MCQ[qId], qId, 'MCQ');
            if (opt !== null) {
                const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
                results.answers[qId] = MCQ_LABELS[parseInt(opt)] || opt;
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
