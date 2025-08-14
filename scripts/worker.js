
importScripts('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');

self.onmessage = function(e) {
    const fileBuffer = e.data;
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        self.postMessage({ success: true, data });
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
