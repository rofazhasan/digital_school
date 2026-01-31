
const XLSX = require('xlsx');

const filePath = '/Users/md.rofazhasanrafiu/coding/exam_questions_gravitation_100 2.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames.find(n => n === "Template") || workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log("Sheet Name Used:", sheetName);
console.log("Row count:", jsonData.length);
if (jsonData.length > 0) {
    console.log("First Row Keys:", Object.keys(jsonData[0]));
    console.log("First Row Data:", jsonData[0]);
}
