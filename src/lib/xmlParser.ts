// XML Parser utilities for DRE import

export interface XMLEntry {
  code: string;
  description: string;
  value: number;
  type: "receita" | "custo" | "despesa";
  suggestedAccount?: string;
}

export interface XMLParseResult {
  success: boolean;
  type: "nfe" | "sped" | "balancete" | "unknown";
  period: { year: number; month: number };
  entries: XMLEntry[];
  totals: {
    revenues: number;
    costs: number;
    expenses: number;
  };
  errors?: string[];
  rawData?: Document;
}

export interface AccountMapping {
  xmlCode: string;
  chartAccountId: string;
  chartAccountName: string;
}

// Parse XML string into Document
export function parseXMLString(xmlString: string): Document | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    // Check for parsing errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      console.error("XML parsing error:", parserError.textContent);
      return null;
    }

    return doc;
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
}

// Detect XML type (NF-e, SPED, Balancete)
export function detectXMLType(doc: Document): "nfe" | "sped" | "balancete" | "unknown" {
  const rootElement = doc.documentElement.tagName.toLowerCase();

  // NF-e detection
  if (doc.querySelector("NFe, nfeProc, enviNFe")) {
    return "nfe";
  }

  // SPED detection
  if (rootElement.includes("sped") || doc.querySelector("ECD, ECF")) {
    return "sped";
  }

  // Balancete detection (various formats)
  if (doc.querySelector("balancete, Balancete, BALANCETE, contas, Contas")) {
    return "balancete";
  }

  // Check for common accounting patterns
  if (doc.querySelector("lancamento, Lancamento, conta, Conta")) {
    return "balancete";
  }

  return "unknown";
}

// Extract period from XML
export function extractPeriod(doc: Document, type: string): { year: number; month: number } {
  const now = new Date();

  try {
    if (type === "nfe") {
      // NF-e has emission date
      const dhEmi = doc.querySelector("dhEmi, dEmi");
      if (dhEmi?.textContent) {
        const date = new Date(dhEmi.textContent);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
      }
    }

    if (type === "sped") {
      // SPED has period in header
      const dtIni = doc.querySelector("DT_INI, dtIni");
      if (dtIni?.textContent) {
        const [day, month, year] = dtIni.textContent.split("/");
        return { year: parseInt(year), month: parseInt(month) };
      }
    }

    // Generic period detection
    const periodElement = doc.querySelector("periodo, Periodo, competencia, Competencia, mes, Mes");
    if (periodElement) {
      const text = periodElement.textContent || "";
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{4})/);
      if (dateMatch) {
        return { year: parseInt(dateMatch[2]), month: parseInt(dateMatch[1]) };
      }
    }

    // Look for year/month attributes or elements
    const yearEl = doc.querySelector("[ano], [year], ano, year, Ano");
    const monthEl = doc.querySelector("[mes], [month], mes, month, Mes");

    if (yearEl && monthEl) {
      const year = parseInt(yearEl.getAttribute("ano") || yearEl.getAttribute("year") || yearEl.textContent || "");
      const month = parseInt(monthEl.getAttribute("mes") || monthEl.getAttribute("month") || monthEl.textContent || "");
      if (year && month) {
        return { year, month };
      }
    }
  } catch (error) {
    console.error("Error extracting period:", error);
  }

  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Parse NF-e XML
function parseNFe(doc: Document): XMLEntry[] {
  const entries: XMLEntry[] = [];

  // Get products/services
  const items = doc.querySelectorAll("det, prod");
  items.forEach((item) => {
    const xProd = item.querySelector("xProd")?.textContent || "Produto/Serviço";
    const vProd = parseFloat(item.querySelector("vProd")?.textContent || "0");
    const NCM = item.querySelector("NCM")?.textContent || "";

    if (vProd > 0) {
      entries.push({
        code: NCM || "PROD",
        description: xProd,
        value: vProd,
        type: "receita",
        suggestedAccount: "Receita de Vendas",
      });
    }
  });

  // Get taxes (as costs/expenses)
  const taxes = [
    { selector: "ICMS vICMS", name: "ICMS" },
    { selector: "IPI vIPI", name: "IPI" },
    { selector: "PIS vPIS", name: "PIS" },
    { selector: "COFINS vCOFINS", name: "COFINS" },
    { selector: "ISS vISSQN", name: "ISS" },
  ];

  taxes.forEach(({ selector, name }) => {
    const element = doc.querySelector(selector.replace(" ", " "));
    const value = parseFloat(element?.textContent || "0");
    if (value > 0) {
      entries.push({
        code: `IMP-${name}`,
        description: `Imposto ${name}`,
        value: value,
        type: "despesa",
        suggestedAccount: `Impostos sobre Vendas`,
      });
    }
  });

  return entries;
}

// Parse SPED XML
function parseSPED(doc: Document): XMLEntry[] {
  const entries: XMLEntry[] = [];

  // SPED Contábil (ECD) patterns
  const registros = doc.querySelectorAll("I200, I250, registro");

  registros.forEach((reg) => {
    const conta = reg.querySelector("COD_CTA, cod_cta, conta")?.textContent || "";
    const descricao = reg.querySelector("DESCR, descr, descricao")?.textContent || "";
    const valorD = parseFloat(reg.querySelector("VL_DC, vl_dc, debito")?.textContent || "0");
    const valorC = parseFloat(reg.querySelector("VL_CR, vl_cr, credito")?.textContent || "0");

    const value = valorC - valorD; // Net value

    if (Math.abs(value) > 0) {
      // Determine type based on account code patterns
      let type: "receita" | "custo" | "despesa" = "despesa";
      if (conta.startsWith("3") || conta.startsWith("4.1")) {
        type = "receita";
      } else if (conta.startsWith("4.2") || conta.startsWith("5")) {
        type = "custo";
      }

      entries.push({
        code: conta,
        description: descricao || `Conta ${conta}`,
        value: Math.abs(value),
        type,
      });
    }
  });

  return entries;
}

// Parse generic Balancete XML
function parseBalancete(doc: Document): XMLEntry[] {
  const entries: XMLEntry[] = [];

  // Try multiple selectors for accounts (including proprietary DRE tags)
  const selectors = [
    "conta", "Conta", "CONTA",
    "lancamento", "Lancamento",
    "registro", "Registro",
    "item", "Item",
    "linha", "Linha",
    "receitabruta", "faturamento", "vendas", "ReceitaBruta", "Vendas",
    "deducoes", "impostos_vendas", "Deducoes",
    "custos", "cmv", "cpv", "Custos", "CMV",
    "despesas_operacionais", "despesas_vendas", "despesas_adm", "Despesas"
  ];

  let accounts: NodeListOf<Element> | null = null;
  for (const selector of selectors) {
    accounts = doc.querySelectorAll(selector);
    if (accounts.length > 0) break;
  }

  if (!accounts || accounts.length === 0) {
    // Try to find any element with value attributes
    accounts = doc.querySelectorAll("[valor], [value], [saldo], [vl_dc], [vl_cr]");
  }

  accounts?.forEach((account) => {
    // Try to extract code
    const code = account.getAttribute("codigo") ||
      account.getAttribute("code") ||
      account.getAttribute("cod") ||
      account.getAttribute("cod_cta") ||
      account.querySelector("codigo, code, cod, cod_cta")?.textContent ||
      account.tagName ||
      "";

    // Try to extract description
    const description = account.getAttribute("descricao") ||
      account.getAttribute("description") ||
      account.getAttribute("nome") ||
      account.getAttribute("descr") ||
      account.querySelector("descricao, description, nome, name, descr")?.textContent ||
      `Conta ${code}`;

    // Try to extract value
    const valueStr = account.getAttribute("valor") ||
      account.getAttribute("value") ||
      account.getAttribute("saldo") ||
      account.getAttribute("vl_dc") ||
      account.getAttribute("vl_cr") ||
      account.querySelector("valor, value, saldo, vl_dc, vl_cr")?.textContent ||
      "0";

    // Robustly parse Brazilian format (e.g., "1.200,50" or "-1.200,50" -> "-1200.50")
    let cleanVal = valueStr.replace(/[^\d,\.-]/g, ""); // Keep digits, comma, dot, minus
    // If it has both dot and comma (e.g. 1.200,00), remove dots and replace comma with dot
    if (cleanVal.includes(",") && cleanVal.indexOf(".") < cleanVal.indexOf(",")) {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    } else if (cleanVal.includes(",")) {
      // Just replace comma with dot (e.g. 1200,00 -> 1200.00)
      cleanVal = cleanVal.replace(",", ".");
    }

    const value = parseFloat(cleanVal) || 0;

    if (Math.abs(value) > 0.01) {
      // Determine type based on code patterns and tags
      let type: "receita" | "custo" | "despesa" = "despesa";
      const codeLower = code.toLowerCase();
      const firstDigit = code.charAt(0);

      if (firstDigit === "3" || codeLower.includes("receita") || codeLower.includes("venda") || codeLower.includes("faturament")) {
        type = "receita";
      } else if (firstDigit === "4" || codeLower.includes("custo") || codeLower.includes("cmv") || codeLower.includes("cpv")) {
        type = "custo";
      } else if (firstDigit === "5" || firstDigit === "6" || codeLower.includes("despesa") || codeLower.includes("deduc") || codeLower.includes("imposto")) {
        type = "despesa";
      }

      entries.push({
        code,
        description,
        value: Math.abs(value),
        type,
      });
    }
  });

  return entries;
}

// Main parse function
export function parseXMLFile(file: File): Promise<XMLParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const xmlString = e.target?.result as string;

      if (!xmlString) {
        resolve({
          success: false,
          type: "unknown",
          period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
          entries: [],
          totals: { revenues: 0, costs: 0, expenses: 0 },
          errors: ["Não foi possível ler o arquivo"],
        });
        return;
      }

      const doc = parseXMLString(xmlString);

      if (!doc) {
        resolve({
          success: false,
          type: "unknown",
          period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
          entries: [],
          totals: { revenues: 0, costs: 0, expenses: 0 },
          errors: ["Arquivo XML inválido ou mal formatado"],
        });
        return;
      }

      const type = detectXMLType(doc);
      const period = extractPeriod(doc, type);

      let entries: XMLEntry[] = [];
      const errors: string[] = [];

      try {
        switch (type) {
          case "nfe":
            entries = parseNFe(doc);
            break;
          case "sped":
            entries = parseSPED(doc);
            break;
          case "balancete":
            entries = parseBalancete(doc);
            break;
          default:
            // Try generic parsing
            entries = parseBalancete(doc);
            if (entries.length === 0) {
              errors.push("Formato de XML não reconhecido. Tente um arquivo de NF-e, SPED ou Balancete.");
            }
        }
      } catch (error) {
        console.error("Error parsing XML content:", error);
        errors.push("Erro ao processar conteúdo do XML");
      }

      // Calculate totals
      const totals = entries.reduce(
        (acc, entry) => {
          if (entry.type === "receita") acc.revenues += entry.value;
          else if (entry.type === "custo") acc.costs += entry.value;
          else acc.expenses += entry.value;
          return acc;
        },
        { revenues: 0, costs: 0, expenses: 0 }
      );

      resolve({
        success: entries.length > 0,
        type,
        period,
        entries,
        totals,
        errors: errors.length > 0 ? errors : undefined,
        rawData: doc,
      });
    };

    reader.onerror = () => {
      resolve({
        success: false,
        type: "unknown",
        period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
        entries: [],
        totals: { revenues: 0, costs: 0, expenses: 0 },
        errors: ["Erro ao ler o arquivo"],
      });
    };

    reader.readAsText(file);
  });
}

// Format currency for display
export function formatXMLCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Get type label
export function getXMLTypeLabel(type: XMLParseResult["type"]): string {
  const labels = {
    nfe: "Nota Fiscal Eletrônica (NF-e)",
    sped: "SPED Contábil/Fiscal",
    balancete: "Balancete Contábil",
    unknown: "Formato Desconhecido",
  };
  return labels[type];
}
