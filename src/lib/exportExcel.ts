export interface ExcelExportOptions {
  data: any[];
  columns: { key: string; header: string }[];
  filename: string;
  sheetName: string;
}

export interface ExcelMultiSheetOptions {
  sheets: {
    name: string;
    data: any[];
    columns: { key: string; header: string }[];
  }[];
  filename: string;
}

export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const { data, columns, filename, sheetName } = options;

  // Dynamic import - xlsx only loaded when exporting
  const XLSX = await import("xlsx");

  // Create worksheet data with headers
  const headers = columns.map((col) => col.header);
  
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      return value;
    })
  );

  const worksheetData = [headers, ...rows];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map((col) => {
    const headerLength = col.header.length;
    const maxDataLength = Math.max(
      ...data.map((row) => {
        const value = row[col.key];
        return value ? String(value).length : 0;
      })
    );
    return { wch: Math.max(headerLength, maxDataLength, 10) + 2 };
  });
  worksheet["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)); // Sheet name max 31 chars

  // Generate and download file
  XLSX.writeFile(workbook, filename);
}

export async function exportToExcelMultiSheet(options: ExcelMultiSheetOptions): Promise<void> {
  const { sheets, filename } = options;

  // Dynamic import - xlsx only loaded when exporting
  const XLSX = await import("xlsx");

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const headers = sheet.columns.map((col) => col.header);
    
    const rows = sheet.data.map((row) =>
      sheet.columns.map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return "";
        return value;
      })
    );

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = sheet.columns.map((col) => {
      const headerLength = col.header.length;
      const maxDataLength = Math.max(
        0,
        ...sheet.data.map((row) => {
          const value = row[col.key];
          return value ? String(value).length : 0;
        })
      );
      return { wch: Math.max(headerLength, maxDataLength, 10) + 2 };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });

  XLSX.writeFile(workbook, filename);
}
