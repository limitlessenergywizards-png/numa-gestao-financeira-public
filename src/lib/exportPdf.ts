import { format } from "date-fns";

export interface PdfExportOptions {
  data: any[];
  columns: { key: string; header: string }[];
  filename: string;
  title: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
  summary?: { label: string; value: string; color?: string }[];
}

export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const {
    data,
    columns,
    filename,
    title,
    subtitle,
    orientation = "portrait",
    summary,
  } = options;

  // Dynamic imports - jspdf only loaded when exporting
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(31, 41, 55);
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, pageWidth / 2, 28, { align: "center" });
  }

  // Generation date
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    subtitle ? 35 : 28,
    { align: "center" }
  );

  // Table data
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return "-";
      if (typeof value === "number") {
        return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      }
      return String(value);
    })
  );

  const tableHeaders = columns.map((col) => col.header);

  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: subtitle ? 42 : 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Summary section
  if (summary && summary.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    let summaryY = finalY + 10;

    doc.setFontSize(10);
    summary.forEach((item) => {
      if (item.color === 'green') {
        doc.setTextColor(34, 197, 94);
      } else if (item.color === 'red') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(31, 41, 55);
      }
      doc.text(`${item.label}: ${item.value}`, 14, summaryY);
      summaryY += 6;
    });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(filename);
}
