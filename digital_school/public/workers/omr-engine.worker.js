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

    // 4. Bubble Analysis
    let results = {
        markers: markerPoints,
        answers: {},
        roll: "",
        registration: "",
        set: "",
        sections: { ROLL: {}, REG: {}, SET: {}, MCQ: {} }
    };

    if (template && template.bubbles) {
        template.bubbles.forEach(bubble => {
            const bx = bubble.x * outWidth;
            const by = bubble.y * outHeight;
            const br = bubble.r * outWidth; // Radius normalized to width

            // Ensure ROI stays within bounds
            const rect = new cv.Rect(
                Math.max(0, Math.floor(bx - br)),
                Math.max(0, Math.floor(by - br)),
                Math.min(outWidth - Math.max(0, Math.floor(bx - br)), Math.floor(br * 2)),
                Math.min(outHeight - Math.max(0, Math.floor(by - br)), Math.floor(br * 2))
            );

            let roi = binary.roi(rect);
            let nonZero = cv.countNonZero(roi);
            let fillRatio = nonZero / (Math.PI * br * br);
            roi.delete();

            // Track strongest match per question/column
            const section = results.sections[bubble.type];
            if (!section[bubble.qId] || fillRatio > section[bubble.qId].fillRatio) {
                section[bubble.qId] = { option: bubble.option, fillRatio };
            }
        });

        // Post-process sections
        const ROLL_THRESHOLD = 0.25; // Adjusted for better sensitivity

        // ROLL logic (6 columns)
        for (let i = 0; i < 6; i++) {
            const match = results.sections.ROLL[i];
            results.roll += (match && match.fillRatio > ROLL_THRESHOLD) ? match.option : "?";
        }

        // REG logic (6 columns)
        for (let i = 0; i < 6; i++) {
            const match = results.sections.REG[i];
            results.registration += (match && match.fillRatio > ROLL_THRESHOLD) ? match.option : "?";
        }

        // SET logic
        const setMatch = results.sections.SET['set'];
        results.set = (setMatch && setMatch.fillRatio > ROLL_THRESHOLD) ? setMatch.option : "?";

        // MCQ logic
        Object.keys(results.sections.MCQ).forEach(qId => {
            const match = results.sections.MCQ[qId];
            if (match && match.fillRatio > ROLL_THRESHOLD) {
                // Map Choice Index back to Bengali
                const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
                results.answers[qId] = MCQ_LABELS[parseInt(match.option)] || match.option;
            }
        });
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
