import ExcelJS from 'exceljs';
import * as fs from 'fs';

async function generateTemplate(mode: string) {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Digital School';
        workbook.created = new Date();

        const infoSheet = workbook.addWorksheet('Instructions');
        infoSheet.addRow(["Step 1", "Mock Instruction"]);

        const classNames = ["Class 10 - A", "Class 11 - B"];
        const refSheet = workbook.addWorksheet('Valid Classes Reference');
        refSheet.columns = [{ header: 'Valid Classes', key: 'class', width: 50 }];
        refSheet.addRows(classNames.map((c: string) => [c]));
        refSheet.state = 'hidden';

        const templateSheet = workbook.addWorksheet('Template');
        
        const baseColumns = [
            { header: "Type", key: "type", width: 10 },
            { header: "Class Name", key: "className", width: 25 },
        ];

        const objectiveColumns = [
            { header: "Option A", key: "optionA", width: 15 },
            { header: "Correct Option", key: "correctOption", width: 15 },
        ];

        const commonSubCols: any[] = [];
        for (let i = 1; i <= 10; i++) {
            const prefix = `Sub ${i}`;
            const keyPrefix = `objSub${i}`;
            commonSubCols.push(
                { header: `${prefix} Text`, key: `${keyPrefix}Text`, width: 25 },
                { header: `${prefix} Marks`, key: `${keyPrefix}Marks`, width: 10 }
            );
        }

        const descriptiveColumns: any[] = [];
        for (let i = 1; i <= 10; i++) {
            const prefix = `Sub ${i}`;
            const keyPrefix = `s${i}`;
            descriptiveColumns.push(
                { header: `${prefix} Text`, key: `${keyPrefix}Text`, width: 25 },
                { header: `${prefix} Type`, key: `${keyPrefix}Type`, width: 15 }
            );
        }

        let finalColumns = [...baseColumns];
        if (mode === 'objective') {
            finalColumns.push(...objectiveColumns, ...commonSubCols);
        } else if (mode === 'descriptive') {
            finalColumns.push(...descriptiveColumns);
        } else {
            finalColumns.push(...objectiveColumns, ...commonSubCols, ...descriptiveColumns);
        }
        
        templateSheet.columns = finalColumns;
        const headerRow = templateSheet.getRow(1);

        const subTypeFormula = '"writing,fill_in,comprehension"';
        const typeFormula = '"MCQ,MC"';

        const typeCol = templateSheet.getColumn('type');
        if (typeCol) typeCol.dataValidation = { type: 'list', allowBlank: true, formulae: [typeFormula] };

        // THE LOOP THAT MIGHT FAIL
        for (let i = 1; i <= 10; i++) {
            const objSubMarks = templateSheet.getColumn(`objSub${i}Marks`);
            if (objSubMarks && objSubMarks.number > 0) {
                console.log(`Styling objSub${i}Marks at col ${objSubMarks.number}`);
                const cell = headerRow.getCell(objSubMarks.number);
                if (cell) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
            }

            const descTypeCol = templateSheet.getColumn(`s${i}Type`);
            if (descTypeCol && descTypeCol.number > 0) {
                console.log(`Styling s${i}Type at col ${descTypeCol.number}`);
                descTypeCol.dataValidation = { type: 'list', allowBlank: true, formulae: [subTypeFormula] };
                const cell = headerRow.getCell(descTypeCol.number);
                if (cell) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        console.log('Success! Buffer length:', buffer.byteLength);
        fs.writeFileSync(`scratch/template_${mode}.xlsx`, Buffer.from(buffer));
    } catch (error) {
        console.error('Error:', error);
    }
}

generateTemplate('objective');
