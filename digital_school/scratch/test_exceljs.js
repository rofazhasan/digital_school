const ExcelJS = require('exceljs');

async function test() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');
    sheet.columns = [
        { header: 'A', key: 'a' }
    ];
    
    console.log('Column "a":', !!sheet.getColumn('a'));
    console.log('Column "non-existent":', !!sheet.getColumn('non-existent'));
    const col = sheet.getColumn('non-existent');
    console.log('Col number:', col.number);
}

test();
