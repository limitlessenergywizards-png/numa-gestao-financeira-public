-- ===================================================================
-- DEMO DATA: Insert sample payables and transactions for all companies
-- 15 payables per company + 20 transactions per company
-- ===================================================================

-- Get all company IDs and their related entities
DO $$
DECLARE
    company RECORD;
    supplier_id UUID;
    customer_id UUID;
    bank_account_id UUID;
    chart_receita_id UUID;
    chart_despesa_id UUID;
    chart_custo_id UUID;
    i INTEGER;
BEGIN
    -- Loop through each company
    FOR company IN 
        SELECT id FROM companies 
    LOOP
        -- Get first supplier for this company
        SELECT id INTO supplier_id 
        FROM suppliers 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get first customer for this company
        SELECT id INTO customer_id 
        FROM customers 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get first bank account for this company
        SELECT id INTO bank_account_id 
        FROM bank_accounts 
        WHERE company_id = company.id 
        LIMIT 1;
        
        -- Get chart accounts by type
        SELECT id INTO chart_receita_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'receita' 
        LIMIT 1;
        
        SELECT id INTO chart_despesa_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'despesa' 
        LIMIT 1;
        
        SELECT id INTO chart_custo_id 
        FROM chart_of_accounts 
        WHERE company_id = company.id AND type = 'custo' 
        LIMIT 1;
        
        -- Skip if no supplier or bank account exists
        IF supplier_id IS NULL OR bank_account_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- =============================================
        -- INSERT 15 PAYABLES (varied status and dates)
        -- =============================================
        
        -- 3 Overdue payables (10-30 days ago)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Aluguel - vencido', 5000.00, 0, CURRENT_DATE - 15, 'pendente', chart_despesa_id, CURRENT_DATE - 45),
            (company.id, supplier_id, 'Energia - vencido', 850.00, 0, CURRENT_DATE - 22, 'pendente', chart_despesa_id, CURRENT_DATE - 52),
            (company.id, supplier_id, 'Internet - vencido', 299.00, 0, CURRENT_DATE - 10, 'pendente', chart_despesa_id, CURRENT_DATE - 40);
        
        -- 5 Pending payables (next 30 days)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Aluguel próximo mês', 5000.00, 0, CURRENT_DATE + 5, 'pendente', chart_despesa_id, CURRENT_DATE - 25),
            (company.id, supplier_id, 'Folha de Pagamento', 15000.00, 0, CURRENT_DATE + 10, 'pendente', chart_despesa_id, CURRENT_DATE - 20),
            (company.id, supplier_id, 'Fornecedor XYZ', 3500.00, 0, CURRENT_DATE + 15, 'pendente', chart_custo_id, CURRENT_DATE - 15),
            (company.id, supplier_id, 'Manutenção equipamentos', 1200.00, 0, CURRENT_DATE + 20, 'pendente', chart_despesa_id, CURRENT_DATE - 10),
            (company.id, supplier_id, 'Serviços contábeis', 800.00, 0, CURRENT_DATE + 25, 'pendente', chart_despesa_id, CURRENT_DATE - 5);
        
        -- 4 Partially paid payables
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Licenças software - parcial', 2400.00, 800.00, CURRENT_DATE + 7, 'parcial', chart_custo_id, CURRENT_DATE - 30),
            (company.id, supplier_id, 'Marketing digital - parcial', 1500.00, 500.00, CURRENT_DATE + 12, 'parcial', chart_despesa_id, CURRENT_DATE - 25),
            (company.id, supplier_id, 'Hospedagem cloud - parcial', 900.00, 300.00, CURRENT_DATE + 8, 'parcial', chart_custo_id, CURRENT_DATE - 20),
            (company.id, supplier_id, 'Consultoria - parcial', 3000.00, 1500.00, CURRENT_DATE + 3, 'parcial', chart_despesa_id, CURRENT_DATE - 15);
        
        -- 3 Paid payables (last 30 days)
        INSERT INTO payables (company_id, supplier_id, description, total_amount, paid_amount, due_date, status, chart_account_id, issue_date)
        VALUES
            (company.id, supplier_id, 'Material escritório - pago', 350.00, 350.00, CURRENT_DATE - 5, 'pago', chart_despesa_id, CURRENT_DATE - 35),
            (company.id, supplier_id, 'Telefonia - pago', 450.00, 450.00, CURRENT_DATE - 8, 'pago', chart_despesa_id, CURRENT_DATE - 38),
            (company.id, supplier_id, 'Seguro empresarial - pago', 1200.00, 1200.00, CURRENT_DATE - 12, 'pago', chart_despesa_id, CURRENT_DATE - 42);
        
        -- =============================================
        -- INSERT 20 TRANSACTIONS (10 entrada, 10 saida)
        -- Distributed over last 60 days
        -- =============================================
        
        -- 10 Entrada transactions
        INSERT INTO transactions (company_id, bank_account_id, type, amount, description, transaction_date, chart_account_id, customer_id)
        VALUES
            (company.id, bank_account_id, 'entrada', 8500.00, 'Venda produto A', CURRENT_DATE - 55, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 12000.00, 'Serviço consultoria', CURRENT_DATE - 48, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 5500.00, 'Venda produto B', CURRENT_DATE - 42, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 9800.00, 'Contrato mensal', CURRENT_DATE - 35, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 3200.00, 'Venda produto C', CURRENT_DATE - 28, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 15000.00, 'Projeto especial', CURRENT_DATE - 21, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 7500.00, 'Venda produto D', CURRENT_DATE - 14, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 4200.00, 'Suporte técnico', CURRENT_DATE - 10, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 6800.00, 'Venda produto E', CURRENT_DATE - 5, chart_receita_id, customer_id),
            (company.id, bank_account_id, 'entrada', 11000.00, 'Serviço recorrente', CURRENT_DATE - 2, chart_receita_id, customer_id);
        
        -- 10 Saida transactions
        INSERT INTO transactions (company_id, bank_account_id, type, amount, description, transaction_date, chart_account_id, supplier_id)
        VALUES
            (company.id, bank_account_id, 'saida', 5000.00, 'Pagamento aluguel', CURRENT_DATE - 52, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 850.00, 'Conta energia', CURRENT_DATE - 45, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 2500.00, 'Compra materiais', CURRENT_DATE - 40, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 1200.00, 'Manutenção', CURRENT_DATE - 33, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 3800.00, 'Pagamento fornecedor', CURRENT_DATE - 26, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 650.00, 'Despesas diversas', CURRENT_DATE - 19, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 4500.00, 'Investimento equipamento', CURRENT_DATE - 13, chart_custo_id, supplier_id),
            (company.id, bank_account_id, 'saida', 890.00, 'Conta telefone', CURRENT_DATE - 8, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 1800.00, 'Marketing', CURRENT_DATE - 4, chart_despesa_id, supplier_id),
            (company.id, bank_account_id, 'saida', 2200.00, 'Serviços terceiros', CURRENT_DATE - 1, chart_despesa_id, supplier_id);
    END LOOP;
END $$;