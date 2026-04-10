export function parseDescriptiveSubQuestion(row: any, i: number) {
    const s = (val: any) => (val === undefined || val === null) ? '' : String(val).trim();
    const n = (val: any) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);
    
    // Helper to get value from multiple possible keys (handling Excel case/header variations)
    const getValue = (r: any, keys: string[]) => {
        for (const k of keys) {
            if (r[k] !== undefined) return r[k];
        }
        return undefined;
    };

    const prefix = `Sub ${i}`;
    const keyPrefix = `s${i}`;

    const subType = s(getValue(row, [`${prefix} Type`, `${keyPrefix}Type`])).toLowerCase();
    if (!subType) return null;

    const subQ: any = {
        subType: subType,
        text: s(getValue(row, [`${prefix} Text`, `${keyPrefix}Text`])),
        marks: n(getValue(row, [`${prefix} Marks`, `${keyPrefix}Marks`])),
        label: s(getValue(row, [`${prefix} Label`, `${keyPrefix}Label`])),
        instruction: s(getValue(row, [`${prefix} Instructions`, `${keyPrefix}Instructions`])),
        modelAnswer: s(getValue(row, [`${prefix} Model Answer`, `${keyPrefix}ModelAnswer`])),
        explanation: s(getValue(row, [`${prefix} Explanation`, `${keyPrefix}Explanation`])),
        image: s(getValue(row, [`${prefix} Image URL`, `${keyPrefix}Img`]))
    };

    if (subType === 'fill_in') {
        subQ.clueType = s(getValue(row, [`${prefix} Clue Type`, `${keyPrefix}ClueType`])) || 'none';
        const wordBoxStr = s(getValue(row, [`${prefix} Word Box`, `${keyPrefix}WordBox`]));
        if (wordBoxStr) subQ.wordBox = wordBoxStr.split('|').map(x => x.trim());
        subQ.passage = s(getValue(row, [`${prefix} Passage`, `${keyPrefix}Passage`]));
        const ansStr = s(getValue(row, [`${prefix} Answers`, `${keyPrefix}Answers`]));
        if (ansStr) subQ.answers = ansStr.split('|').map(x => x.trim());
    } else if (subType === 'matching') {
        const leftStr = s(getValue(row, [`${prefix} Questions`, `${keyPrefix}Questions`]));
        const rightStr = s(getValue(row, [`${prefix} Answers`, `${keyPrefix}Answers`]));
        if (leftStr) subQ.leftColumn = leftStr.split('|').map((t, idx) => ({ id: (idx + 1).toString(), text: t.trim() }));
        if (rightStr) subQ.rightColumn = rightStr.split('|').map((t, idx) => ({ id: String.fromCharCode(65 + idx), text: t.trim() }));
        
        // If they provided Column C/D for 3/4 way matching
        const colC = s(getValue(row, [`${prefix} Column C`, `${keyPrefix}ColC`]));
        const colD = s(getValue(row, [`${prefix} Column D`, `${keyPrefix}ColD`]));
        if (colC) subQ.columnC = colC.split('|').map(x => x.trim());
        if (colD) subQ.columnD = colD.split('|').map(x => x.trim());

        const matchesStr = s(getValue(row, [`${prefix} Matches`, `${keyPrefix}Matches`]));
        if (matchesStr) {
            const matchMap: Record<string, string> = {};
            matchesStr.split(',').forEach(m => {
                const [l, r] = m.split('-').map(x => x.trim());
                if (l && r) matchMap[l] = r;
            });
            subQ.matches = matchMap;
        }
    } else if (subType === 'rearranging' || subType === 'flowchart') {
        const itemsStr = s(getValue(row, [`${prefix} Items`, `${keyPrefix}Items`]));
        if (itemsStr) subQ.items = itemsStr.split('|').map(x => x.trim());
        const correctOrderStr = s(getValue(row, [`${prefix} Correct Order`, `${keyPrefix}Order`]));
        if (correctOrderStr) {
            subQ.correctOrder = correctOrderStr.split('|').map(x => x.trim());
            subQ.modelAnswers = subQ.correctOrder;
        }
    } else if (subType === 'interpreting_graph') {
        const chartType = s(getValue(row, [`${prefix} Chart Type`, `${keyPrefix}ChartType`])) || 'bar';
        const chartLabels = s(getValue(row, [`${prefix} Chart Labels`, `${keyPrefix}ChartLabels`]));
        const chartData = s(getValue(row, [`${prefix} Chart Data`, `${keyPrefix}ChartData`]));
        const xAxisLabel = s(getValue(row, [`${prefix} X-Axis Label`, `${keyPrefix}XLabel`]));
        const yAxisLabel = s(getValue(row, [`${prefix} Y-Axis Label`, `${keyPrefix}YLabel`]));
        
        if (chartLabels && chartData) {
            subQ.chartConfig = {
                type: chartType,
                labels: chartLabels.split('|').map((x: string) => x.trim()),
                data: chartData.split('|').map((x: string) => n(x.trim())),
                xAxisLabel,
                yAxisLabel
            };
        }
    } else if (subType === 'comprehension' || subType === 'comprehension_mcq') {
        subQ.passage = s(getValue(row, [`${prefix} Stem Passage`, `${keyPrefix}Stem`]));
        
        // Support for MCQ options within comprehension
        const optA = s(getValue(row, [`${prefix} Option A`, `${keyPrefix}A`]));
        const optB = s(getValue(row, [`${prefix} Option B`, `${keyPrefix}B`]));
        const optC = s(getValue(row, [`${prefix} Option C`, `${keyPrefix}C`]));
        const optD = s(getValue(row, [`${prefix} Option D`, `${keyPrefix}D`]));
        const correct = s(getValue(row, [`${prefix} Correct Option`, `${keyPrefix}Correct`]));

        if (optA || optB) {
            subQ.options = [
                { text: optA, isCorrect: correct === 'A' || correct === '1' },
                { text: optB, isCorrect: correct === 'B' || correct === '2' },
                { text: optC, isCorrect: correct === 'C' || correct === '3' },
                { text: optD, isCorrect: correct === 'D' || correct === '4' }
            ].filter(o => o.text !== '');
            subQ.subType = 'comprehension_mcq';
        }

        const questionsStr = s(getValue(row, [`${prefix} Questions`, `${keyPrefix}Questions`]));
        const answersStr = s(getValue(row, [`${prefix} Answers`, `${keyPrefix}Answers`]));
        if (questionsStr) subQ.questions = questionsStr.split('|').map(x => x.trim());
        if (answersStr) subQ.answers = answersStr.split('|').map(x => x.trim());
    } else if (subType === 'short_answer' || subType === 'error_correction' || subType === 'writing') {
        const qStr = s(getValue(row, [`${prefix} Questions`, `${keyPrefix}Questions`]));
        if (qStr) subQ.questions = qStr.split('|').map(x => x.trim());
        const ansStr = s(getValue(row, [`${prefix} Answers`, `${keyPrefix}Answers`]));
        if (ansStr) subQ.answers = ansStr.split('|').map(x => x.trim());
    }

    return subQ;
}
