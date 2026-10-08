#!/usr/bin/env python3
"""
Gera SQL de inserção para migrar dados do banco antigo para o novo Supabase.
Lê todos os CSVs em migration_parts/old_database/ e gera insert_all_data.sql
"""

import csv
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(BASE_DIR, 'old_database')
OUTPUT_FILE = os.path.join(BASE_DIR, 'insert_all_data.sql')

# Ordem de inserção respeitando foreign keys
TABLES_ORDER = [
    'profiles',
    'user_roles',
    # subscriptions tem 0 rows, skip
    'companies',
    'hotmart_webhook_logs',
    'weekly_challenges',
    'user_companies',
    'customers',
    'suppliers',
    'chart_of_accounts',
    'bank_accounts',
    'categories',
    'cost_centers',
    'transactions',
    'receivables',
    'payables',
    'daily_activity_log',
    'daily_missions',
    'financial_personality',
    'dre_budget',
    'onboarding_progress',
    'tenant_metrics',
    'audit_logs',
]

# Colunas JSONB por tabela
JSONB_COLUMNS = {
    'audit_logs': ['old_data', 'new_data'],
    'hotmart_webhook_logs': ['payload'],
    'financial_personality': ['archetype_score', 'quiz_answers'],
}

# Colunas BOOLEAN por tabela
BOOLEAN_COLUMNS = {
    'companies': ['is_headquarters'],
    'user_companies': ['is_default'],
    'customers': ['is_active'],
    'suppliers': ['is_active'],
    'chart_of_accounts': ['is_active'],
    'bank_accounts': ['is_active'],
    'categories': ['is_active'],
    'cost_centers': ['is_active'],
    'weekly_challenges': ['is_active'],
    'onboarding_progress': ['step_empresa', 'step_contas_bancarias', 'step_categorias', 'step_primeiro_lancamento'],
    'transactions': ['reconciled'],
}

# Colunas TEXT[] (PostgreSQL array) por tabela
TEXT_ARRAY_COLUMNS = {
    'financial_personality': ['strengths', 'growth_areas'],
}

# Colunas numéricas (INTEGER, NUMERIC, DECIMAL) por tabela
NUMERIC_COLUMNS = {
    'profiles': ['guardian_level', 'total_xp', 'current_streak', 'longest_streak'],
    'bank_accounts': ['initial_balance', 'current_balance'],
    'transactions': ['amount'],
    'receivables': ['total_amount', 'paid_amount', 'installment_number', 'total_installments'],
    'payables': ['total_amount', 'paid_amount', 'installment_number', 'total_installments'],
    'weekly_challenges': ['target_value', 'reward_xp'],
    'daily_activity_log': ['activities_count', 'xp_earned'],
    'daily_missions': ['target_value', 'current_value', 'reward_xp'],
    'dre_budget': ['period_year', 'period_month', 'budgeted_value'],
    'tenant_metrics': ['transactions_count', 'active_users_count', 'total_revenue', 'total_expenses'],
}


def find_csv_for_table(table_name):
    """Encontra o arquivo CSV correspondente à tabela."""
    for f in os.listdir(CSV_DIR):
        if f.startswith(table_name + '-export-') and f.endswith('.csv'):
            return os.path.join(CSV_DIR, f)
    return None


def escape_sql_string(val):
    """Escapa aspas simples para SQL."""
    return val.replace("'", "''")


def format_jsonb(val):
    """Formata valor JSONB do CSV para SQL."""
    if not val or val.strip() == '':
        return 'NULL'
    # CSV escaping: "" -> "
    cleaned = val.strip('"')
    cleaned = cleaned.replace('""', '"')
    cleaned = escape_sql_string(cleaned)
    return f"'{cleaned}'::jsonb"


def format_text_array(val):
    """Formata valor TEXT[] do CSV para SQL PostgreSQL array."""
    if not val or val.strip() == '':
        return 'NULL'
    # O CSV tem formato: ["item1","item2"] com "" escaping
    cleaned = val.strip('"')
    cleaned = cleaned.replace('""', '"')
    # Parse como JSON array de strings
    import json
    try:
        items = json.loads(cleaned)
        if not items:
            return "ARRAY[]::text[]"
        escaped_items = [f"'{escape_sql_string(str(item))}'" for item in items]
        return f"ARRAY[{','.join(escaped_items)}]::text[]"
    except (json.JSONDecodeError, TypeError):
        return 'NULL'


def format_value(val, table_name, col_name):
    """Formata um valor do CSV para SQL."""
    # NULL handling
    if val is None or val.strip() == '':
        return 'NULL'

    # JSONB
    if col_name in JSONB_COLUMNS.get(table_name, []):
        return format_jsonb(val)

    # TEXT[]
    if col_name in TEXT_ARRAY_COLUMNS.get(table_name, []):
        return format_text_array(val)

    # BOOLEAN
    if col_name in BOOLEAN_COLUMNS.get(table_name, []):
        v = val.strip().lower()
        if v == 'true':
            return 'true'
        elif v == 'false':
            return 'false'
        return 'NULL'

    # NUMERIC
    if col_name in NUMERIC_COLUMNS.get(table_name, []):
        v = val.strip()
        if v == '':
            return 'NULL'
        return v

    # Default: text/uuid/timestamp - quote it
    return f"'{escape_sql_string(val)}'"


def generate_insert_for_table(table_name):
    """Gera SQL INSERT para uma tabela a partir do CSV."""
    csv_path = find_csv_for_table(table_name)
    if not csv_path:
        return None, 0

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';', quotechar='"')
        headers = next(reader)
        rows = list(reader)

    # Filtrar rows vazias
    rows = [r for r in rows if any(cell.strip() for cell in r)]

    if not rows:
        return None, 0

    col_list = ', '.join(headers)
    values_list = []

    for row in rows:
        # Pad row if needed
        while len(row) < len(headers):
            row.append('')

        formatted = []
        for i, col in enumerate(headers):
            formatted.append(format_value(row[i], table_name, col))

        values_list.append(f"  ({', '.join(formatted)})")

    sql = f"-- {table_name} ({len(rows)} rows)\n"
    sql += f"INSERT INTO public.{table_name} ({col_list})\nVALUES\n"
    sql += ',\n'.join(values_list)
    sql += f"\nON CONFLICT DO NOTHING;\n"

    return sql, len(rows)


def main():
    total_rows = 0
    table_sqls = []

    print("Gerando SQL de migração...")
    print(f"Diretório CSV: {CSV_DIR}")
    print(f"Arquivo de saída: {OUTPUT_FILE}")
    print()

    for table_name in TABLES_ORDER:
        sql, count = generate_insert_for_table(table_name)
        if sql:
            table_sqls.append(sql)
            total_rows += count
            print(f"  ✓ {table_name}: {count} rows")
        else:
            csv_path = find_csv_for_table(table_name)
            if csv_path:
                print(f"  - {table_name}: 0 rows (vazio)")
            else:
                print(f"  ✗ {table_name}: CSV não encontrado")

    # Escrever arquivo SQL
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("-- ============================================\n")
        f.write("-- Migração de dados do banco antigo\n")
        f.write("-- Gerado automaticamente a partir dos CSVs\n")
        f.write("-- ============================================\n\n")
        f.write("BEGIN;\n\n")
        f.write("-- Desabilita triggers e FK checks durante a migração\n")
        f.write("SET LOCAL session_replication_role = 'replica';\n\n")

        for sql in table_sqls:
            f.write(sql)
            f.write('\n')

        f.write("-- Reabilita triggers e FK checks\n")
        f.write("SET LOCAL session_replication_role = 'origin';\n\n")
        f.write("COMMIT;\n")

    print(f"\nTotal: {total_rows} rows em {len(table_sqls)} tabelas")
    print(f"Arquivo gerado: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
