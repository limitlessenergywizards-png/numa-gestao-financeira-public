import { format, parseISO } from 'date-fns';

export interface SpedCompany {
  cnpj: string;
  name: string;
  fantasyName?: string;
  stateRegistration?: string;
  cityRegistration?: string;
  uf?: string;
  city?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
}

export interface SpedAccount {
  code: string;
  name: string;
  type: 'S' | 'A'; // S = Sintética (grupo), A = Analítica (conta)
  nature: 'D' | 'C'; // D = Devedora, C = Credora
  level: number;
  parentCode?: string;
}

export interface SpedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  accountCode: string;
  accountName: string;
  counterpartCode?: string;
  documentNumber?: string;
}

export interface SpedBalance {
  accountCode: string;
  initialBalance: number;
  debits: number;
  credits: number;
  finalBalance: number;
}

export interface SpedExportOptions {
  company: SpedCompany;
  period: {
    startDate: string;
    endDate: string;
  };
  transactions: SpedTransaction[];
  chartOfAccounts: SpedAccount[];
  balances: SpedBalance[];
  bookType?: 'G' | 'R' | 'A' | 'B' | 'Z'; // G=Diário Geral, R=Razão, etc.
  layoutVersion?: string;
}

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '').padStart(14, '0');
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'ddMMyyyy');
  } catch {
    return dateStr.replace(/[-/]/g, '');
  }
}

function formatValue(value: number): string {
  return Math.abs(value).toFixed(2).replace('.', ',');
}

function generateHash(): string {
  // Simplified hash - in production use proper SHA-256
  return 'HASH' + Date.now().toString(36).toUpperCase();
}

export function exportToSped(options: SpedExportOptions): string {
  const {
    company,
    period,
    transactions,
    chartOfAccounts,
    balances,
    bookType = 'G',
    layoutVersion = '0017'
  } = options;

  const lines: string[] = [];
  const cnpj = formatCnpj(company.cnpj);
  const startDate = formatDate(period.startDate);
  const endDate = formatDate(period.endDate);

  // ========== BLOCO 0 - ABERTURA ==========
  
  // Registro 0000 - Abertura do arquivo
  lines.push(`|0000|LECD|${startDate}|${endDate}|${company.name}|${cnpj}|${company.uf || 'SP'}|${company.stateRegistration || ''}|${company.cityRegistration || ''}|0|0|0|N|0|${layoutVersion}|`);
  
  // Registro 0001 - Abertura do bloco 0
  lines.push('|0001|0|');
  
  // Registro 0007 - Outras inscrições
  if (company.stateRegistration) {
    lines.push(`|0007|${company.uf || 'SP'}|${company.stateRegistration}|`);
  }
  
  // Registro 0020 - Escrituração contábil descentralizada (se aplicável)
  // lines.push('|0020|...|');
  
  // Registro 0150 - Participantes (clientes/fornecedores)
  const participants = new Set<string>();
  transactions.forEach(tx => {
    if (tx.counterpartCode) {
      participants.add(tx.counterpartCode);
    }
  });
  
  let partIndex = 1;
  const participantCodes: Record<string, string> = {};
  participants.forEach(code => {
    const partCode = String(partIndex).padStart(5, '0');
    participantCodes[code] = partCode;
    lines.push(`|0150|${partCode}|${code}|||||||||||`);
    partIndex++;
  });
  
  // Registro 0990 - Encerramento do bloco 0
  const block0Count = lines.length + 1;
  lines.push(`|0990|${block0Count}|`);

  // ========== BLOCO I - LANÇAMENTOS CONTÁBEIS ==========
  
  // Registro I001 - Abertura do bloco I
  lines.push('|I001|0|');
  
  // Registro I010 - Identificação da escrituração
  lines.push(`|I010|${bookType}|1.00|N|N|N|`);
  
  // Registro I012 - Livros auxiliares
  lines.push('|I012|B|0|1|1|');
  
  // Registro I020 - Campos adicionais (opcional)
  // lines.push('|I020|...|');
  
  // Registro I030 - Termo de abertura
  lines.push(`|I030|TERMO DE ABERTURA|${company.name}|${startDate}|DIARIO GERAL|1|1|${company.city || ''}|${formatDate(new Date().toISOString().split('T')[0])}|`);
  
  // Registro I050 - Plano de contas referencial
  chartOfAccounts.forEach((account, idx) => {
    lines.push(`|I050|${startDate}|01|N|${account.level}|${account.code}|${account.code}|${account.type}|${account.name}|`);
    
    // Registro I051 - Plano de contas referencial (se aplicável)
    // lines.push(`|I051|${account.code}|COD_REF|`);
  });
  
  // Registro I150 - Saldos periódicos
  balances.forEach(bal => {
    const indicator = bal.finalBalance >= 0 ? 'D' : 'C';
    lines.push(`|I150|${startDate}|${endDate}|${formatValue(Math.abs(bal.initialBalance))}|${indicator}|${formatValue(bal.debits)}|${formatValue(bal.credits)}|${formatValue(Math.abs(bal.finalBalance))}|${indicator}|`);
  });
  
  // Registros I200/I250 - Lançamentos contábeis
  let lancamentoNum = 1;
  transactions.forEach(tx => {
    const txDate = formatDate(tx.date);
    const numLanc = String(lancamentoNum).padStart(6, '0');
    
    // I200 - Lançamento
    lines.push(`|I200|${numLanc}|${txDate}|${formatValue(tx.amount)}|${tx.type === 'entrada' ? 'N' : 'N'}|`);
    
    // I250 - Partidas do lançamento
    const dcIndicator = tx.type === 'entrada' ? 'C' : 'D';
    const counterDc = tx.type === 'entrada' ? 'D' : 'C';
    
    lines.push(`|I250|${tx.accountCode}|${formatValue(tx.amount)}|${dcIndicator}||${numLanc}||${tx.description}|`);
    
    if (tx.counterpartCode) {
      lines.push(`|I250|${tx.counterpartCode}|${formatValue(tx.amount)}|${counterDc}||${numLanc}||CONTRAPARTIDA - ${tx.description}|`);
    }
    
    lancamentoNum++;
  });
  
  // Registro I350 - Saldo das contas de resultado antes do encerramento
  // (simplificado)
  
  // Registro I990 - Encerramento do bloco I
  const blockIStart = lines.findIndex(l => l.startsWith('|I001|'));
  const blockICount = lines.length - blockIStart + 1;
  lines.push(`|I990|${blockICount}|`);
  
  // ========== BLOCO J - DEMONSTRAÇÕES CONTÁBEIS ==========
  
  // Registro J001 - Abertura do bloco J
  lines.push('|J001|1|'); // 1 = sem dados
  
  // Registro J990 - Encerramento do bloco J
  lines.push('|J990|2|');
  
  // ========== BLOCO K - CONGLOMERADOS (se aplicável) ==========
  
  lines.push('|K001|1|');
  lines.push('|K990|2|');
  
  // ========== BLOCO 9 - CONTROLE E ENCERRAMENTO ==========
  
  // Registro 9001 - Abertura do bloco 9
  lines.push('|9001|0|');
  
  // Registro 9900 - Registros do arquivo
  const registerCounts: Record<string, number> = {};
  lines.forEach(line => {
    const match = line.match(/^\|([A-Z0-9]+)\|/);
    if (match) {
      const reg = match[1];
      registerCounts[reg] = (registerCounts[reg] || 0) + 1;
    }
  });
  
  // Add counts for 9900 and 9999
  registerCounts['9900'] = Object.keys(registerCounts).length + 2;
  registerCounts['9999'] = 1;
  
  Object.entries(registerCounts).sort().forEach(([reg, count]) => {
    lines.push(`|9900|${reg}|${count}|`);
  });
  
  // Registro 9990 - Encerramento do bloco 9
  const block9Start = lines.findIndex(l => l.startsWith('|9001|'));
  const block9Count = lines.length - block9Start + 2;
  lines.push(`|9990|${block9Count}|`);
  
  // Registro 9999 - Encerramento do arquivo
  lines.push(`|9999|${lines.length + 1}|`);
  
  return lines.join('\r\n');
}

export function downloadSpedFile(content: string, filename: string = 'SPED_ECD.txt'): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
