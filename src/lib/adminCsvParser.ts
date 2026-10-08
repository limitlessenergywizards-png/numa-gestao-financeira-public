export interface ParsedCSVRow {
    email: string;
    role: string;
    [key: string]: string;
}

export interface CSVParseResult {
    data: ParsedCSVRow[];
    errors: { row: number; message: string }[];
    headers: string[];
}

export function parseCSV(content: string): CSVParseResult {
    const lines = content.trim().split(/\r?\n/);
    const result: CSVParseResult = {
        data: [],
        errors: [],
        headers: [],
    };

    if (lines.length === 0) {
        result.errors.push({ row: 0, message: "Arquivo vazio" });
        return result;
    }

    // Parse header
    const headerLine = lines[0];
    result.headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

    // Validate required headers
    const emailIndex = result.headers.findIndex((h) => h === 'email' || h === 'e-mail');
    const roleIndex = result.headers.findIndex((h) => h === 'role' || h === 'perfil' || h === 'papel');

    if (emailIndex === -1) {
        result.errors.push({ row: 1, message: "Coluna 'email' não encontrada" });
        return result;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const row: ParsedCSVRow = {
            email: values[emailIndex]?.trim() || '',
            role: roleIndex !== -1 ? (values[roleIndex]?.trim() || 'viewer') : 'viewer',
        };

        // Add other columns
        result.headers.forEach((header, idx) => {
            if (header !== 'email' && header !== 'role' && header !== 'e-mail' && header !== 'perfil' && header !== 'papel') {
                row[header] = values[idx]?.trim() || '';
            }
        });

        result.data.push(row);
    }

    return result;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateRole(role: string): role is 'admin' | 'editor' | 'viewer' {
    return ['admin', 'editor', 'viewer'].includes(role.toLowerCase());
}

export function normalizeRole(role: string): 'admin' | 'editor' | 'viewer' {
    const normalized = role.toLowerCase().trim();
    if (normalized === 'admin' || normalized === 'administrador') return 'admin';
    if (normalized === 'editor' || normalized === 'editar') return 'editor';
    return 'viewer';
}

export function generateCSVTemplate(): string {
    return 'email,role\nexemplo@email.com,viewer\nadmin@empresa.com,admin\n';
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
    if (typeof document === 'undefined') return;
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                // Escape quotes and wrap in quotes if contains comma or newline
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',')
        ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename: string): void {
    if (typeof document === 'undefined') return;
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
