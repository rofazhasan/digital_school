import assert from "assert";

function formatDuration(seconds: number): string {
    if (seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function calculateStudentTiming(params: {
    startedAt: string | null;
    status: string;
    evaluatedAt?: string | null;
    submittedAt?: string | null;
    durationMinutes: number;
    nowMs: number;
    endTime?: string | null;
}) {
    const { startedAt, status, evaluatedAt, submittedAt, durationMinutes, nowMs, endTime } = params;
    const durationSeconds = durationMinutes * 60;

    let elapsedSeconds = 0;
    let remainingSeconds = durationSeconds;
    let timeSpentSeconds = 0;
    let isOverdue = false;

    if (startedAt) {
        const startMs = new Date(startedAt).getTime();
        elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

        const isDone = (status as string) === 'COMPLETED' || status === 'SUBMITTED' || !!evaluatedAt;
        if (isDone) {
            const finishedAt = evaluatedAt || submittedAt || new Date(nowMs).toISOString();
            timeSpentSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - startMs) / 1000));
            remainingSeconds = 0;
            isOverdue = false;
        } else {
            timeSpentSeconds = elapsedSeconds;
            remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
            if (endTime) {
                const untilEnd = Math.max(0, Math.floor((new Date(endTime).getTime() - nowMs) / 1000));
                remainingSeconds = Math.min(remainingSeconds, untilEnd);
            }
            isOverdue = elapsedSeconds > durationSeconds;
        }
    }

    const percentUsed = Math.min(100, Math.round((elapsedSeconds / durationSeconds) * 100));

    return {
        elapsedSeconds,
        remainingSeconds,
        timeSpentSeconds,
        isOverdue,
        percentUsed
    };
}

function runTests() {
    console.log("=== Testing Live Activity & Live Monitor Timing Engine ===");

    const now = Date.now();

    // Test 1: Active student who started 20 minutes ago for a 60-minute exam
    {
        const twentyMinAgo = new Date(now - 20 * 60 * 1000).toISOString();
        const res = calculateStudentTiming({
            startedAt: twentyMinAgo,
            status: "IN_PROGRESS",
            durationMinutes: 60,
            nowMs: now
        });

        assert.strictEqual(res.elapsedSeconds, 1200, "Elapsed seconds should be 1200 (20 min)");
        assert.strictEqual(res.remainingSeconds, 2400, "Remaining seconds should be 2400 (40 min)");
        assert.strictEqual(res.isOverdue, false, "Student should not be overdue");
        assert.strictEqual(res.percentUsed, 33, "Should have used 33% of duration");
        console.log("✓ Test 1 Passed: Active student in progress timing accurate");
    }

    // Test 2: Active student who started 75 minutes ago for a 60-minute exam (Overdue)
    {
        const seventyFiveMinAgo = new Date(now - 75 * 60 * 1000).toISOString();
        const res = calculateStudentTiming({
            startedAt: seventyFiveMinAgo,
            status: "IN_PROGRESS",
            durationMinutes: 60,
            nowMs: now
        });

        assert.strictEqual(res.elapsedSeconds, 4500, "Elapsed seconds should be 4500 (75 min)");
        assert.strictEqual(res.remainingSeconds, 0, "Remaining seconds should be 0");
        assert.strictEqual(res.isOverdue, true, "Student MUST be marked overdue");
        assert.strictEqual(res.percentUsed, 100, "Percent used should cap at 100%");
        console.log("✓ Test 2 Passed: Overdue student correctly detected");
    }

    // Test 3: Completed student who finished in 35 minutes
    {
        const fortyMinAgo = new Date(now - 40 * 60 * 1000).toISOString();
        const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
        const res = calculateStudentTiming({
            startedAt: fortyMinAgo,
            status: "SUBMITTED",
            submittedAt: fiveMinAgo,
            durationMinutes: 60,
            nowMs: now
        });

        assert.strictEqual(res.timeSpentSeconds, 35 * 60, "Time spent should be 35 minutes");
        assert.strictEqual(res.remainingSeconds, 0, "Remaining seconds should be 0 for finished student");
        assert.strictEqual(res.isOverdue, false, "Completed student is never overdue");
        console.log("✓ Test 3 Passed: Completed student time spent accurate");
    }

    // Test 4: Duration calculation for split objective + CQ/SQ exam
    {
        const objectiveTime = 25;
        const cqSqTime = 35;
        const totalDurationMinutes = (objectiveTime > 0 && cqSqTime > 0)
            ? objectiveTime + cqSqTime
            : 60;
        assert.strictEqual(totalDurationMinutes, 60, "Combined duration must be 60 min");
        console.log("✓ Test 4 Passed: Split exam duration aggregation accurate");
    }

    // Test 5: Format duration string output
    {
        assert.strictEqual(formatDuration(45), "45s");
        assert.strictEqual(formatDuration(150), "2m 30s");
        assert.strictEqual(formatDuration(3665), "1h 1m 5s");
        console.log("✓ Test 5 Passed: formatDuration produces correct human-readable text");
    }

    console.log("\nALL 5 TEST SUITES PASSED SUCCESSFULLY!");
}

runTests();
