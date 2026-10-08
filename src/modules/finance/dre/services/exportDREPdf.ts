import type jsPDF from "jspdf";
import { DRESummary, DREIndicators } from "@/modules/finance/dre/hooks/useDREData";
import { DRENote } from "../hooks/useDRENotes";
import { DREAIAnalysis } from "../hooks/useDREAIInsights";
import { getScoreLabel, getScoreColor } from "@/lib/formatters";

interface Company {
  name: string;
  trading_name?: string | null;
  document?: string | null;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

interface PDFDRELine {
  code?: string;
  name: string;
  currentValue: number;
  previousValue: number;
  type: "header" | "item" | "subtotal" | "total" | "result";
  indent: number;
}

interface ExportDREPdfOptions {
  company: Company;
  periodLabel: string;
  dreLines: PDFDRELine[];
  summary: DRESummary;
  indicators: DREIndicators;
  notes: DRENote[];
  aiAnalysis?: DREAIAnalysis | null;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  includeLogo?: boolean;
  includeCharts?: boolean;
  includeNotes?: boolean;
  includeAIInsights?: boolean;
  orientation?: "portrait" | "landscape";
  detailLevel?: "summary" | "detailed" | "complete";
}

export async function exportDREPdf(options: ExportDREPdfOptions): Promise<void> {
  const {
    company,
    periodLabel,
    dreLines,
    summary,
    indicators,
    notes,
    aiAnalysis,
    formatCurrency,
    formatPercent,
    includeLogo = true,
    includeNotes = true,
    includeAIInsights = true,
    orientation = "portrait",
    detailLevel = "detailed",
  } = options;

  // Dynamic imports - jspdf only loaded when exporting
  const { default: jsPDFConstructor } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const isLandscape = orientation === "landscape";
  const doc = new jsPDFConstructor({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const dangerColor: [number, number, number] = [239, 68, 68]; // Red
  const warningColor: [number, number, number] = [234, 179, 8]; // Yellow
  const mutedColor: [number, number, number] = [100, 116, 139]; // Gray

  // Helper functions
  const addHeader = () => {
    // Header background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Company name
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(company.name, margin, 20);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text("DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", margin, 28);

    // Period
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabel}`, margin, 35);

    // CNPJ if available
    if (company.document) {
      doc.text(`CNPJ: ${company.document}`, pageWidth - margin - 50, 35);
    }

    currentY = 55;
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} | Numa Gestão Financeira`,
      margin,
      footerY
    );
    doc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth - margin - 25,
      footerY
    );
  };

  const checkPageBreak = (neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - 20) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  const getValueColor = (value: number): [number, number, number] => {
    if (value > 0) return successColor;
    if (value < 0) return dangerColor;
    return mutedColor;
  };

  // Add header
  addHeader();

  // Executive Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("RESUMO EXECUTIVO", margin, currentY);
  currentY += 8;

  // Health Score badge (if AI analysis available)
  if (aiAnalysis && includeAIInsights) {
    const score = aiAnalysis.healthScore;
    const scoreColorRGB = getScoreColor(score);
    
    doc.setFillColor(...scoreColorRGB);
    doc.roundedRect(pageWidth - margin - 35, currentY - 6, 35, 10, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Score: ${score}/100`, pageWidth - margin - 32, currentY);
    currentY += 2;
  }

  // Summary table
  const summaryData = [
    ["Receita Líquida", formatCurrency(summary.netRevenue), `Margem Bruta: ${formatPercent(indicators.grossMargin)}`],
    ["Lucro Bruto", formatCurrency(summary.grossProfit), `Margem Operacional: ${formatPercent(indicators.operationalMargin)}`],
    ["Resultado Líquido", formatCurrency(summary.netResult), `Margem Líquida: ${formatPercent(indicators.netMargin)}`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: summaryData,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { halign: "right", cellWidth: 45 },
      2: { textColor: mutedColor, cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // AI Insight (if available)
  if (aiAnalysis && includeAIInsights && aiAnalysis.insight) {
    checkPageBreak(30);
    
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 3, 3, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("💡 Insight:", margin + 5, currentY + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const insightLines = doc.splitTextToSize(aiAnalysis.insight, pageWidth - margin * 2 - 10);
    doc.text(insightLines.slice(0, 2), margin + 5, currentY + 12);
    
    currentY += 25;
  }

  // DRE Table
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("DEMONSTRAÇÃO DO RESULTADO", margin, currentY);
  currentY += 8;

  // Filter lines based on detail level
  const filteredLines = detailLevel === "summary" 
    ? dreLines.filter(l => l.type === "header" || l.type === "total")
    : detailLevel === "detailed"
    ? dreLines.filter(l => l.type !== "item" || l.indent <= 2)
    : dreLines;

  const dreTableData = filteredLines.map(line => {
    const indent = "  ".repeat(line.indent);
    const prefix = line.type === "header" ? "" : 
                   line.type === "subtotal" ? "(=) " :
                   line.type === "total" ? "(=) " :
                   line.indent === 0 ? "(+) " : "";
    
    const percentAV = summary.netRevenue !== 0 ? (line.currentValue / summary.netRevenue) * 100 : 0;
    const percentAH = line.previousValue !== 0 
      ? ((line.currentValue - line.previousValue) / Math.abs(line.previousValue)) * 100 
      : 0;
    
    return [
      line.code || "",
      `${indent}${prefix}${line.name}`,
      formatCurrency(line.currentValue),
      formatPercent(percentAV),
      `${percentAH > 0 ? "+" : ""}${formatPercent(percentAH)}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Cód.", "Descrição", "Valor", "AV%", "AH%"]],
    body: dreTableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: isLandscape ? 120 : 80 },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Style headers and totals
      const row = filteredLines[data.row.index];
      if (row) {
        if (row.type === "header") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249];
        } else if (row.type === "total") {
          data.cell.styles.fontStyle = "bold";
          if (data.column.index === 2) {
            const color = getValueColor(row.currentValue);
            data.cell.styles.textColor = color;
          }
        } else if (row.type === "subtotal") {
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Notes Section
  if (includeNotes && notes.length > 0) {
    checkPageBreak(40);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("NOTAS EXPLICATIVAS", margin, currentY);
    currentY += 8;

    const notesData = notes.map((note, index) => [
      `[${note.dre_line_id}]`,
      note.note,
      note.is_important ? "⚠️" : "",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: notesData,
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 25, textColor: mutedColor },
        1: { cellWidth: isLandscape ? 220 : 140 },
        2: { cellWidth: 10, halign: "center" },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (notes[data.row.index]?.is_important) {
          data.cell.styles.fillColor = [254, 243, 199]; // Light yellow
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Alerts from AI (if available)
  if (aiAnalysis && includeAIInsights && aiAnalysis.alerts.length > 0) {
    checkPageBreak(30);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...warningColor);
    doc.text("⚠️ ALERTAS", margin, currentY);
    currentY += 6;

    aiAnalysis.alerts.forEach((alert) => {
      checkPageBreak(10);
      const color = alert.type === "danger" ? dangerColor : warningColor;
      doc.setFillColor(...color);
      doc.circle(margin + 2, currentY + 2, 1.5, "F");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(alert.message, margin + 8, currentY + 3);
      currentY += 7;
    });

    currentY += 5;
  }

  // Recommendations from AI (if available)
  if (aiAnalysis && includeAIInsights && aiAnalysis.recommendations.length > 0) {
    checkPageBreak(40);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("💡 RECOMENDAÇÕES", margin, currentY);
    currentY += 8;

    aiAnalysis.recommendations.forEach((rec, index) => {
      checkPageBreak(15);
      
      const priorityColor = rec.priority === "high" ? dangerColor : 
                           rec.priority === "medium" ? warningColor : mutedColor;
      const priorityLabel = rec.priority === "high" ? "Alta" : 
                           rec.priority === "medium" ? "Média" : "Baixa";
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${rec.title}`, margin, currentY);
      
      // Priority badge
      doc.setFillColor(...priorityColor);
      doc.roundedRect(margin + doc.getTextWidth(`${index + 1}. ${rec.title}`) + 3, currentY - 4, 15, 5, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(priorityLabel, margin + doc.getTextWidth(`${index + 1}. ${rec.title}`) + 5, currentY - 1);
      
      currentY += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedColor);
      const descLines = doc.splitTextToSize(rec.description, pageWidth - margin * 2 - 10);
      doc.text(descLines, margin + 5, currentY);
      currentY += descLines.length * 4 + 5;
    });
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save the PDF
  const fileName = `DRE_${company.name.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}
