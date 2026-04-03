
const XLSX = require('xlsx');

const filePath = '/Users/mdafjalkhan/DanwayEME/data/D657-SAP Attadance- 13-02-2026.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length > 0) {
        console.log("HEADERS:", data[0]);
        if (data.length > 1) {
            console.log("SAMPLE ROW 1:", data[1]);
        }
    } else {
        console.log("No data found in sheet");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
