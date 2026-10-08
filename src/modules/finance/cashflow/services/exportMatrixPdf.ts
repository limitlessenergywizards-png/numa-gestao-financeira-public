import type jsPDF from "jspdf";
import { format } from "date-fns";

interface MatrixWeekColumn {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  isProjected?: boolean;
}

interface MatrixCategoryData {
  code: string;
  name: string;
  values: Record<string | number, number>;
  total: number;
}

interface MatrixGroupData {
  groupName: string;
  type: 'entrada' | 'saida';
  categories: MatrixCategoryData[];
  totals: Record<string | number, number>;
  grandTotal: number;
}

interface ProjectionData {
  weeks: MatrixWeekColumn[];
  values: Record<string, number[]>;
  entradasTotals: number[];
  saidasTotals: number[];
}

export interface MatrixPdfExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  period: string;
  weekColumns: MatrixWeekColumn[];
  groupedData: {
    entradas: MatrixGroupData;
    saidas: MatrixGroupData;
  };
  periodResults: Record<string | number, number>;
  weekBalances: Record<number, { inicial: number; final: number }>;
  projectionData?: ProjectionData | null;
  formatCurrency: (value: number) => string;
  currencySymbol?: string;
}

// Draw a simple trend line chart directly on PDF
function drawTrendChart(
  doc: jsPDF,
  trendData: { label: string; entradas: number; saidas: number; saldo: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  formatCurrency: (value: number) => string
) {
  const chartPadding = { top: 20, right: 40, bottom: 25, left: 50 };
  const chartWidth = width - chartPadding.left - chartPadding.right;
  const chartHeight = height - chartPadding.top - chartPadding.bottom;
  const chartX = x + chartPadding.left;
  const chartY = y + chartPadding.top;

  // Find min/max values
  const allValues = trendData.flatMap(d => [d.entradas, d.saidas, d.saldo]);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  // Draw background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Draw title
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text("Tendência do Fluxo de Caixa", x + width / 2, y + 12, { align: "center" });

  // Draw grid lines
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const lineY = chartY + (chartHeight / 4) * i;
    doc.line(chartX, lineY, chartX + chartWidth, lineY);
    
    // Y-axis labels
    const val = maxVal - (range / 4) * i;
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(
      (val / 1000).toFixed(0) + "k",
      chartX - 5,
      lineY + 2,
      { align: "right" }
    );
  }

  // Draw X-axis labels
  if (trendData.length > 0) {
    const xStep = chartWidth / (trendData.length - 1 || 1);
    trendData.forEach((point, i) => {
      const px = chartX + xStep * i;
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(point.label, px, chartY + chartHeight + 10, { align: "center" });
    });
  }

  // Helper to convert value to Y coordinate
  const toY = (val: number) => chartY + chartHeight - ((val - minVal) / range) * chartHeight;

  // Draw lines and area
  const drawLine = (dataKey: 'entradas' | 'saidas' | 'saldo', color: number[]) => {
    if (trendData.length < 2) return;
    
    const xStep = chartWidth / (trendData.length - 1);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1);

    for (let i = 1; i < trendData.length; i++) {
      const x1 = chartX + xStep * (i - 1);
      const y1 = toY(trendData[i - 1][dataKey]);
      const x2 = chartX + xStep * i;
      const y2 = toY(trendData[i][dataKey]);
      doc.line(x1, y1, x2, y2);
    }

    // Draw dots
    doc.setFillColor(color[0], color[1], color[2]);
    trendData.forEach((point, i) => {
      const px = chartX + xStep * i;
      const py = toY(point[dataKey]);
      doc.circle(px, py, 1.5, 'F');
    });
  };

  // Draw each line
  drawLine('entradas', [34, 197, 94]); // Green
  drawLine('saidas', [239, 68, 68]); // Red
  drawLine('saldo', [59, 130, 246]); // Blue

  // Draw legend
  const legendY = y + height - 8;
  const legendItems = [
    { label: "Entradas", color: [34, 197, 94] },
    { label: "Saídas", color: [239, 68, 68] },
    { label: "Saldo", color: [59, 130, 246] },
  ];

  let legendX = x + width / 2 - 50;
  legendItems.forEach((item) => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(legendX, legendY, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text(item.label, legendX + 4, legendY + 1.5);
    legendX += 35;
  });
}

export async function exportMatrixToPdf(options: MatrixPdfExportOptions): Promise<void> {
  const {
    filename,
    title,
    subtitle,
    period,
    weekColumns,
    groupedData,
    periodResults,
    weekBalances,
    projectionData,
    formatCurrency,
    currencySymbol = "R$",
  } = options;

  // Dynamic imports - jspdf only loaded when exporting
  const { default: jsPDFConstructor } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDFConstructor({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(31, 41, 55);
  doc.text(title, pageWidth / 2, 15, { align: "center" });

  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, pageWidth / 2, 22, { align: "center" });
  }

  // Period and generation info
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Período: ${period} | Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth / 2,
    subtitle ? 28 : 22,
    { align: "center" }
  );

  // Trend Chart
  const chartStartY = subtitle ? 34 : 28;
  const trendData = weekColumns.map((week) => ({
    label: week.weekLabel,
    entradas: groupedData.entradas.totals[week.weekNumber] || 0,
    saidas: groupedData.saidas.totals[week.weekNumber] || 0,
    saldo: weekBalances[week.weekNumber]?.final || 0,
  }));

  // Add projection data to trend if available
  if (projectionData) {
    projectionData.weeks.forEach((week, index) => {
      trendData.push({
        label: `${week.weekLabel}*`,
        entradas: projectionData.entradasTotals[index] || 0,
        saidas: projectionData.saidasTotals[index] || 0,
        saldo: 
          (trendData[trendData.length - 1]?.saldo || 0) + 
          (projectionData.entradasTotals[index] || 0) - 
          (projectionData.saidasTotals[index] || 0),
      });
    });
  }

  drawTrendChart(doc, trendData, 14, chartStartY, pageWidth - 28, 50, formatCurrency);

  // Build table data
  const allColumns = [...weekColumns];
  if (projectionData) {
    allColumns.push(...projectionData.weeks);
  }

  // Table headers
  const tableHeaders = [
    "Categoria",
    ...allColumns.map((c) => 
      c.isProjected ? `✨ ${c.weekLabel}` : c.weekLabel
    ),
    "Total",
  ];

  if (projectionData) {
    tableHeaders.push("✨ Projetado");
  }

  // Build rows
  const tableData: (string | number)[][] = [];

  // Saldo Inicial row
  const saldoInicialRow = [
    "Saldo Inicial",
    ...weekColumns.map((w) => formatCurrency(weekBalances[w.weekNumber]?.inicial || 0)),
    ...(projectionData ? projectionData.weeks.map(() => "-") : []),
    "-",
  ];
  if (projectionData) {
    saldoInicialRow.push("-");
  }
  tableData.push(saldoInicialRow);

  // Groups and categories
  const addGroupRows = (group: MatrixGroupData, projData: ProjectionData | null | undefined) => {
    // Group header
    const groupRow = [
      group.groupName,
      ...weekColumns.map((w) => formatCurrency(group.totals[w.weekNumber] || 0)),
    ];
    
    if (projData) {
      const totals = group.type === 'entrada' ? projData.entradasTotals : projData.saidasTotals;
      groupRow.push(...totals.map((t) => `~${formatCurrency(t)}`));
    }
    
    groupRow.push(formatCurrency(group.grandTotal));
    
    if (projData) {
      const totals = group.type === 'entrada' ? projData.entradasTotals : projData.saidasTotals;
      groupRow.push(`~${formatCurrency(totals.reduce((a, b) => a + b, 0))}`);
    }
    
    tableData.push(groupRow);

    // Category rows
    group.categories.forEach((cat) => {
      const catRow = [
        `  ${cat.code} - ${cat.name}`,
        ...weekColumns.map((w) => {
          const val = cat.values[w.weekNumber] || 0;
          return val > 0 ? formatCurrency(val) : "-";
        }),
      ];
      
      if (projData && projData.values[cat.code]) {
        catRow.push(...projData.values[cat.code].map((v) => (v > 0 ? `~${formatCurrency(v)}` : "-")));
      } else if (projData) {
        catRow.push(...projData.weeks.map(() => "-"));
      }
      
      catRow.push(cat.total > 0 ? formatCurrency(cat.total) : "-");
      
      if (projData && projData.values[cat.code]) {
        const projTotal = projData.values[cat.code].reduce((a, b) => a + b, 0);
        catRow.push(projTotal > 0 ? `~${formatCurrency(projTotal)}` : "-");
      } else if (projData) {
        catRow.push("-");
      }
      
      tableData.push(catRow);
    });
  };

  addGroupRows(groupedData.entradas, projectionData);
  addGroupRows(groupedData.saidas, projectionData);

  // Resultado do Período
  const totalResult = groupedData.entradas.grandTotal - groupedData.saidas.grandTotal;
  const resultadoRow = [
    "Resultado do Período",
    ...weekColumns.map((w) => {
      const result = periodResults[w.weekNumber] || 0;
      return (result >= 0 ? "+" : "") + formatCurrency(result);
    }),
  ];

  if (projectionData) {
    projectionData.weeks.forEach((_, idx) => {
      const projResult = projectionData.entradasTotals[idx] - projectionData.saidasTotals[idx];
      resultadoRow.push(`~${projResult >= 0 ? "+" : ""}${formatCurrency(projResult)}`);
    });
  }

  resultadoRow.push((totalResult >= 0 ? "+" : "") + formatCurrency(totalResult));

  if (projectionData) {
    const projTotalResult = 
      projectionData.entradasTotals.reduce((a, b) => a + b, 0) - 
      projectionData.saidasTotals.reduce((a, b) => a + b, 0);
    resultadoRow.push(`~${projTotalResult >= 0 ? "+" : ""}${formatCurrency(projTotalResult)}`);
  }

  tableData.push(resultadoRow);

  // Saldo Final
  const saldoFinalRow = [
    "Saldo Final",
    ...weekColumns.map((w) => formatCurrency(weekBalances[w.weekNumber]?.final || 0)),
  ];

  if (projectionData) {
    let runningBalance = weekBalances[weekColumns[weekColumns.length - 1]?.weekNumber]?.final || 0;
    projectionData.weeks.forEach((_, idx) => {
      runningBalance += projectionData.entradasTotals[idx] - projectionData.saidasTotals[idx];
      saldoFinalRow.push(`~${formatCurrency(runningBalance)}`);
    });
  }

  saldoFinalRow.push("-");
  
  if (projectionData) {
    let finalProjBalance = weekBalances[weekColumns[weekColumns.length - 1]?.weekNumber]?.final || 0;
    projectionData.weeks.forEach((_, idx) => {
      finalProjBalance += projectionData.entradasTotals[idx] - projectionData.saidasTotals[idx];
    });
    saldoFinalRow.push(`~${formatCurrency(finalProjBalance)}`);
  }

  tableData.push(saldoFinalRow);

  // Generate table
  const tableStartY = chartStartY + 55;
  
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: tableStartY,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 45 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Style projected columns
      if (projectionData && data.column.index > weekColumns.length && data.column.index <= weekColumns.length + projectionData.weeks.length) {
        data.cell.styles.fillColor = [255, 251, 235];
        data.cell.styles.textColor = [180, 83, 9];
        data.cell.styles.fontStyle = 'italic';
      }
      
      // Style group rows
      const cellText = String(data.cell.text);
      if (cellText === "ENTRADAS") {
        data.cell.styles.fillColor = [220, 252, 231];
        data.cell.styles.textColor = [21, 128, 61];
        data.cell.styles.fontStyle = 'bold';
      } else if (cellText === "SAÍDAS") {
        data.cell.styles.fillColor = [254, 226, 226];
        data.cell.styles.textColor = [185, 28, 28];
        data.cell.styles.fontStyle = 'bold';
      } else if (cellText === "Resultado do Período") {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      } else if (cellText === "Saldo Inicial" || cellText === "Saldo Final") {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 10, right: 10 },
  });

  // Footer with legend
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  
  if (projectionData) {
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text("✨ Valores projetados (estimativa baseada em tendência histórica)", 14, finalY + 8);
  }

  // Page numbers
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  doc.save(filename);
}
