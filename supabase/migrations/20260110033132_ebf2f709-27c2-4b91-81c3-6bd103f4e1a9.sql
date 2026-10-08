
-- =========================================
-- COMPLETE DEMO DATA: RECEIVABLES, PAYABLES, TRANSACTIONS
-- =========================================

-- Helper: Get first customer, chart account, supplier, and bank for each company
-- Using subqueries to get consistent IDs

-- =========================================
-- RECEIVABLES (15 per company = 150 total)
-- Distribution: 3 overdue, 5 pending, 4 partial, 3 paid
-- =========================================

-- Tech Solutions Ltda (a1111111-1111-1111-1111-111111111111)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  (SELECT id FROM customers WHERE company_id = 'a1111111-1111-1111-1111-111111111111' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a1111111-1111-1111-1111-111111111111' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Consultoria em TI - Janeiro', 'NF-1001', CURRENT_DATE - 45, CURRENT_DATE - 20, 15000.00, 0, 'pendente'),
  ('Suporte Técnico Mensal', 'NF-1002', CURRENT_DATE - 40, CURRENT_DATE - 15, 8500.00, 0, 'pendente'),
  ('Desenvolvimento Sistema ERP', 'NF-1003', CURRENT_DATE - 35, CURRENT_DATE - 10, 45000.00, 0, 'pendente'),
  ('Licença Software Anual', 'NF-1004', CURRENT_DATE - 30, CURRENT_DATE + 5, 12000.00, 0, 'pendente'),
  ('Treinamento Equipe', 'NF-1005', CURRENT_DATE - 25, CURRENT_DATE + 10, 6500.00, 0, 'pendente'),
  ('Consultoria Cloud', 'NF-1006', CURRENT_DATE - 20, CURRENT_DATE + 15, 18000.00, 0, 'pendente'),
  ('Manutenção Infraestrutura', 'NF-1007', CURRENT_DATE - 15, CURRENT_DATE + 20, 9500.00, 0, 'pendente'),
  ('Integração API', 'NF-1008', CURRENT_DATE - 10, CURRENT_DATE + 25, 7800.00, 0, 'pendente'),
  ('Projeto Mobile App', 'NF-1009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 15000.00, 'parcial'),
  ('Consultoria Segurança', 'NF-1010', CURRENT_DATE - 55, CURRENT_DATE - 25, 22000.00, 10000.00, 'parcial'),
  ('Outsourcing TI', 'NF-1011', CURRENT_DATE - 50, CURRENT_DATE - 20, 28000.00, 14000.00, 'parcial'),
  ('Suporte Premium', 'NF-1012', CURRENT_DATE - 45, CURRENT_DATE - 15, 11000.00, 5500.00, 'parcial'),
  ('Projeto Finalizado A', 'NF-1013', CURRENT_DATE - 90, CURRENT_DATE - 60, 25000.00, 25000.00, 'pago'),
  ('Serviço Concluído B', 'NF-1014', CURRENT_DATE - 80, CURRENT_DATE - 50, 18500.00, 18500.00, 'pago'),
  ('Entrega Sistema C', 'NF-1015', CURRENT_DATE - 70, CURRENT_DATE - 40, 32000.00, 32000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Construtora Horizonte SA (a2222222-2222-2222-2222-222222222222)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a2222222-2222-2222-2222-222222222222',
  (SELECT id FROM customers WHERE company_id = 'a2222222-2222-2222-2222-222222222222' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a2222222-2222-2222-2222-222222222222' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Obra Residencial Fase 1', 'NF-2001', CURRENT_DATE - 45, CURRENT_DATE - 20, 125000.00, 0, 'pendente'),
  ('Reforma Comercial', 'NF-2002', CURRENT_DATE - 40, CURRENT_DATE - 15, 85000.00, 0, 'pendente'),
  ('Construção Galpão', 'NF-2003', CURRENT_DATE - 35, CURRENT_DATE - 10, 250000.00, 0, 'pendente'),
  ('Projeto Arquitetônico', 'NF-2004', CURRENT_DATE - 30, CURRENT_DATE + 5, 35000.00, 0, 'pendente'),
  ('Fundação Edifício', 'NF-2005', CURRENT_DATE - 25, CURRENT_DATE + 10, 180000.00, 0, 'pendente'),
  ('Acabamento Interno', 'NF-2006', CURRENT_DATE - 20, CURRENT_DATE + 15, 95000.00, 0, 'pendente'),
  ('Instalações Elétricas', 'NF-2007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Paisagismo Condomínio', 'NF-2008', CURRENT_DATE - 10, CURRENT_DATE + 25, 28000.00, 0, 'pendente'),
  ('Obra Industrial', 'NF-2009', CURRENT_DATE - 60, CURRENT_DATE - 30, 320000.00, 160000.00, 'parcial'),
  ('Reforma Hospital', 'NF-2010', CURRENT_DATE - 55, CURRENT_DATE - 25, 175000.00, 87500.00, 'parcial'),
  ('Construção Escola', 'NF-2011', CURRENT_DATE - 50, CURRENT_DATE - 20, 420000.00, 200000.00, 'parcial'),
  ('Ampliação Fábrica', 'NF-2012', CURRENT_DATE - 45, CURRENT_DATE - 15, 280000.00, 140000.00, 'parcial'),
  ('Projeto Concluído X', 'NF-2013', CURRENT_DATE - 90, CURRENT_DATE - 60, 150000.00, 150000.00, 'pago'),
  ('Obra Finalizada Y', 'NF-2014', CURRENT_DATE - 80, CURRENT_DATE - 50, 95000.00, 95000.00, 'pago'),
  ('Entrega Casa Z', 'NF-2015', CURRENT_DATE - 70, CURRENT_DATE - 40, 220000.00, 220000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Distribuidora Alimenta Ltda (a3333333-3333-3333-3333-333333333333)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM customers WHERE company_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a3333333-3333-3333-3333-333333333333' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Alimentos Lote 1', 'NF-3001', CURRENT_DATE - 45, CURRENT_DATE - 20, 45000.00, 0, 'pendente'),
  ('Distribuição Bebidas', 'NF-3002', CURRENT_DATE - 40, CURRENT_DATE - 15, 32000.00, 0, 'pendente'),
  ('Fornecimento Restaurante', 'NF-3003', CURRENT_DATE - 35, CURRENT_DATE - 10, 28500.00, 0, 'pendente'),
  ('Venda Produtos Secos', 'NF-3004', CURRENT_DATE - 30, CURRENT_DATE + 5, 18000.00, 0, 'pendente'),
  ('Distribuição Laticínios', 'NF-3005', CURRENT_DATE - 25, CURRENT_DATE + 10, 22500.00, 0, 'pendente'),
  ('Fornecimento Supermercado', 'NF-3006', CURRENT_DATE - 20, CURRENT_DATE + 15, 65000.00, 0, 'pendente'),
  ('Venda Congelados', 'NF-3007', CURRENT_DATE - 15, CURRENT_DATE + 20, 38000.00, 0, 'pendente'),
  ('Distribuição Hortifruti', 'NF-3008', CURRENT_DATE - 10, CURRENT_DATE + 25, 15500.00, 0, 'pendente'),
  ('Contrato Mensal Hotel', 'NF-3009', CURRENT_DATE - 60, CURRENT_DATE - 30, 85000.00, 42500.00, 'parcial'),
  ('Fornecimento Escola', 'NF-3010', CURRENT_DATE - 55, CURRENT_DATE - 25, 55000.00, 27500.00, 'parcial'),
  ('Venda Atacado', 'NF-3011', CURRENT_DATE - 50, CURRENT_DATE - 20, 120000.00, 60000.00, 'parcial'),
  ('Distribuição Padarias', 'NF-3012', CURRENT_DATE - 45, CURRENT_DATE - 15, 35000.00, 17500.00, 'parcial'),
  ('Pedido Quitado A', 'NF-3013', CURRENT_DATE - 90, CURRENT_DATE - 60, 42000.00, 42000.00, 'pago'),
  ('Venda Finalizada B', 'NF-3014', CURRENT_DATE - 80, CURRENT_DATE - 50, 28000.00, 28000.00, 'pago'),
  ('Entrega Completa C', 'NF-3015', CURRENT_DATE - 70, CURRENT_DATE - 40, 55000.00, 55000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Clínica Saúde Total (a4444444-4444-4444-4444-444444444444)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a4444444-4444-4444-4444-444444444444',
  (SELECT id FROM customers WHERE company_id = 'a4444444-4444-4444-4444-444444444444' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a4444444-4444-4444-4444-444444444444' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Consulta Especialista', 'NF-4001', CURRENT_DATE - 45, CURRENT_DATE - 20, 2500.00, 0, 'pendente'),
  ('Exames Laboratoriais', 'NF-4002', CURRENT_DATE - 40, CURRENT_DATE - 15, 4200.00, 0, 'pendente'),
  ('Procedimento Cirúrgico', 'NF-4003', CURRENT_DATE - 35, CURRENT_DATE - 10, 18000.00, 0, 'pendente'),
  ('Fisioterapia Pacote', 'NF-4004', CURRENT_DATE - 30, CURRENT_DATE + 5, 3600.00, 0, 'pendente'),
  ('Check-up Executivo', 'NF-4005', CURRENT_DATE - 25, CURRENT_DATE + 10, 5500.00, 0, 'pendente'),
  ('Tratamento Ortodôntico', 'NF-4006', CURRENT_DATE - 20, CURRENT_DATE + 15, 8500.00, 0, 'pendente'),
  ('Internação UTI', 'NF-4007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Consultas Retorno', 'NF-4008', CURRENT_DATE - 10, CURRENT_DATE + 25, 1800.00, 0, 'pendente'),
  ('Cirurgia Eletiva', 'NF-4009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 17500.00, 'parcial'),
  ('Tratamento Oncológico', 'NF-4010', CURRENT_DATE - 55, CURRENT_DATE - 25, 85000.00, 42500.00, 'parcial'),
  ('Reabilitação', 'NF-4011', CURRENT_DATE - 50, CURRENT_DATE - 20, 12000.00, 6000.00, 'parcial'),
  ('Exames Imagem', 'NF-4012', CURRENT_DATE - 45, CURRENT_DATE - 15, 7500.00, 3750.00, 'parcial'),
  ('Consulta Paga A', 'NF-4013', CURRENT_DATE - 90, CURRENT_DATE - 60, 2800.00, 2800.00, 'pago'),
  ('Procedimento Quitado', 'NF-4014', CURRENT_DATE - 80, CURRENT_DATE - 50, 15000.00, 15000.00, 'pago'),
  ('Tratamento Concluído', 'NF-4015', CURRENT_DATE - 70, CURRENT_DATE - 40, 9500.00, 9500.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Auto Peças Express Ltda (a5555555-5555-5555-5555-555555555555)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a5555555-5555-5555-5555-555555555555',
  (SELECT id FROM customers WHERE company_id = 'a5555555-5555-5555-5555-555555555555' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a5555555-5555-5555-5555-555555555555' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Peças Motor', 'NF-5001', CURRENT_DATE - 45, CURRENT_DATE - 20, 8500.00, 0, 'pendente'),
  ('Fornecimento Oficina', 'NF-5002', CURRENT_DATE - 40, CURRENT_DATE - 15, 12000.00, 0, 'pendente'),
  ('Peças Suspensão', 'NF-5003', CURRENT_DATE - 35, CURRENT_DATE - 10, 6500.00, 0, 'pendente'),
  ('Acessórios Veiculares', 'NF-5004', CURRENT_DATE - 30, CURRENT_DATE + 5, 4200.00, 0, 'pendente'),
  ('Peças Freio', 'NF-5005', CURRENT_DATE - 25, CURRENT_DATE + 10, 7800.00, 0, 'pendente'),
  ('Fornecimento Concessionária', 'NF-5006', CURRENT_DATE - 20, CURRENT_DATE + 15, 25000.00, 0, 'pendente'),
  ('Peças Elétrica', 'NF-5007', CURRENT_DATE - 15, CURRENT_DATE + 20, 5500.00, 0, 'pendente'),
  ('Óleo e Filtros', 'NF-5008', CURRENT_DATE - 10, CURRENT_DATE + 25, 3200.00, 0, 'pendente'),
  ('Pedido Grande', 'NF-5009', CURRENT_DATE - 60, CURRENT_DATE - 30, 45000.00, 22500.00, 'parcial'),
  ('Fornecimento Frota', 'NF-5010', CURRENT_DATE - 55, CURRENT_DATE - 25, 32000.00, 16000.00, 'parcial'),
  ('Peças Pesados', 'NF-5011', CURRENT_DATE - 50, CURRENT_DATE - 20, 55000.00, 27500.00, 'parcial'),
  ('Venda Atacado', 'NF-5012', CURRENT_DATE - 45, CURRENT_DATE - 15, 18000.00, 9000.00, 'parcial'),
  ('Pedido Quitado', 'NF-5013', CURRENT_DATE - 90, CURRENT_DATE - 60, 9800.00, 9800.00, 'pago'),
  ('Venda Concluída', 'NF-5014', CURRENT_DATE - 80, CURRENT_DATE - 50, 15500.00, 15500.00, 'pago'),
  ('Fornecimento Pago', 'NF-5015', CURRENT_DATE - 70, CURRENT_DATE - 40, 22000.00, 22000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Agro Fazenda Verde SA (a6666666-6666-6666-6666-666666666666)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a6666666-6666-6666-6666-666666666666',
  (SELECT id FROM customers WHERE company_id = 'a6666666-6666-6666-6666-666666666666' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a6666666-6666-6666-6666-666666666666' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Safra Soja', 'NF-6001', CURRENT_DATE - 45, CURRENT_DATE - 20, 450000.00, 0, 'pendente'),
  ('Comercialização Milho', 'NF-6002', CURRENT_DATE - 40, CURRENT_DATE - 15, 280000.00, 0, 'pendente'),
  ('Venda Gado', 'NF-6003', CURRENT_DATE - 35, CURRENT_DATE - 10, 180000.00, 0, 'pendente'),
  ('Produção Leite Mensal', 'NF-6004', CURRENT_DATE - 30, CURRENT_DATE + 5, 85000.00, 0, 'pendente'),
  ('Venda Café Premium', 'NF-6005', CURRENT_DATE - 25, CURRENT_DATE + 10, 320000.00, 0, 'pendente'),
  ('Fornecimento Algodão', 'NF-6006', CURRENT_DATE - 20, CURRENT_DATE + 15, 195000.00, 0, 'pendente'),
  ('Venda Frutas', 'NF-6007', CURRENT_DATE - 15, CURRENT_DATE + 20, 45000.00, 0, 'pendente'),
  ('Produção Orgânica', 'NF-6008', CURRENT_DATE - 10, CURRENT_DATE + 25, 28000.00, 0, 'pendente'),
  ('Contrato Exportação', 'NF-6009', CURRENT_DATE - 60, CURRENT_DATE - 30, 850000.00, 425000.00, 'parcial'),
  ('Venda Cooperativa', 'NF-6010', CURRENT_DATE - 55, CURRENT_DATE - 25, 320000.00, 160000.00, 'parcial'),
  ('Comercialização Trigo', 'NF-6011', CURRENT_DATE - 50, CURRENT_DATE - 20, 180000.00, 90000.00, 'parcial'),
  ('Venda Gado Lote', 'NF-6012', CURRENT_DATE - 45, CURRENT_DATE - 15, 420000.00, 210000.00, 'parcial'),
  ('Safra Quitada', 'NF-6013', CURRENT_DATE - 90, CURRENT_DATE - 60, 550000.00, 550000.00, 'pago'),
  ('Venda Paga', 'NF-6014', CURRENT_DATE - 80, CURRENT_DATE - 50, 280000.00, 280000.00, 'pago'),
  ('Contrato Concluído', 'NF-6015', CURRENT_DATE - 70, CURRENT_DATE - 40, 195000.00, 195000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Loja Moda Fashion (a7777777-7777-7777-7777-777777777777)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a7777777-7777-7777-7777-777777777777',
  (SELECT id FROM customers WHERE company_id = 'a7777777-7777-7777-7777-777777777777' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a7777777-7777-7777-7777-777777777777' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Venda Coleção Verão', 'NF-7001', CURRENT_DATE - 45, CURRENT_DATE - 20, 15000.00, 0, 'pendente'),
  ('Fornecimento Loja', 'NF-7002', CURRENT_DATE - 40, CURRENT_DATE - 15, 22000.00, 0, 'pendente'),
  ('Venda Atacado', 'NF-7003', CURRENT_DATE - 35, CURRENT_DATE - 10, 45000.00, 0, 'pendente'),
  ('Acessórios Moda', 'NF-7004', CURRENT_DATE - 30, CURRENT_DATE + 5, 8500.00, 0, 'pendente'),
  ('Coleção Inverno', 'NF-7005', CURRENT_DATE - 25, CURRENT_DATE + 10, 35000.00, 0, 'pendente'),
  ('Venda Online', 'NF-7006', CURRENT_DATE - 20, CURRENT_DATE + 15, 12000.00, 0, 'pendente'),
  ('Roupas Fitness', 'NF-7007', CURRENT_DATE - 15, CURRENT_DATE + 20, 9500.00, 0, 'pendente'),
  ('Calçados', 'NF-7008', CURRENT_DATE - 10, CURRENT_DATE + 25, 18000.00, 0, 'pendente'),
  ('Pedido Grande', 'NF-7009', CURRENT_DATE - 60, CURRENT_DATE - 30, 65000.00, 32500.00, 'parcial'),
  ('Fornecimento Rede', 'NF-7010', CURRENT_DATE - 55, CURRENT_DATE - 25, 85000.00, 42500.00, 'parcial'),
  ('Coleção Exclusiva', 'NF-7011', CURRENT_DATE - 50, CURRENT_DATE - 20, 55000.00, 27500.00, 'parcial'),
  ('Venda Especial', 'NF-7012', CURRENT_DATE - 45, CURRENT_DATE - 15, 28000.00, 14000.00, 'parcial'),
  ('Pedido Quitado', 'NF-7013', CURRENT_DATE - 90, CURRENT_DATE - 60, 32000.00, 32000.00, 'pago'),
  ('Venda Paga', 'NF-7014', CURRENT_DATE - 80, CURRENT_DATE - 50, 18500.00, 18500.00, 'pago'),
  ('Fornecimento Concluído', 'NF-7015', CURRENT_DATE - 70, CURRENT_DATE - 40, 45000.00, 45000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Restaurante Sabor e Arte (a8888888-8888-8888-8888-888888888888)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a8888888-8888-8888-8888-888888888888',
  (SELECT id FROM customers WHERE company_id = 'a8888888-8888-8888-8888-888888888888' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a8888888-8888-8888-8888-888888888888' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Evento Corporativo', 'NF-8001', CURRENT_DATE - 45, CURRENT_DATE - 20, 25000.00, 0, 'pendente'),
  ('Buffet Casamento', 'NF-8002', CURRENT_DATE - 40, CURRENT_DATE - 15, 45000.00, 0, 'pendente'),
  ('Catering Empresa', 'NF-8003', CURRENT_DATE - 35, CURRENT_DATE - 10, 18000.00, 0, 'pendente'),
  ('Almoço Executivo Mensal', 'NF-8004', CURRENT_DATE - 30, CURRENT_DATE + 5, 12000.00, 0, 'pendente'),
  ('Jantar Especial', 'NF-8005', CURRENT_DATE - 25, CURRENT_DATE + 10, 8500.00, 0, 'pendente'),
  ('Buffet Aniversário', 'NF-8006', CURRENT_DATE - 20, CURRENT_DATE + 15, 15000.00, 0, 'pendente'),
  ('Delivery Corporativo', 'NF-8007', CURRENT_DATE - 15, CURRENT_DATE + 20, 6500.00, 0, 'pendente'),
  ('Coffee Break', 'NF-8008', CURRENT_DATE - 10, CURRENT_DATE + 25, 4200.00, 0, 'pendente'),
  ('Evento Grande', 'NF-8009', CURRENT_DATE - 60, CURRENT_DATE - 30, 85000.00, 42500.00, 'parcial'),
  ('Buffet Formatura', 'NF-8010', CURRENT_DATE - 55, CURRENT_DATE - 25, 55000.00, 27500.00, 'parcial'),
  ('Catering Semanal', 'NF-8011', CURRENT_DATE - 50, CURRENT_DATE - 20, 32000.00, 16000.00, 'parcial'),
  ('Festa Empresa', 'NF-8012', CURRENT_DATE - 45, CURRENT_DATE - 15, 28000.00, 14000.00, 'parcial'),
  ('Evento Pago', 'NF-8013', CURRENT_DATE - 90, CURRENT_DATE - 60, 35000.00, 35000.00, 'pago'),
  ('Buffet Quitado', 'NF-8014', CURRENT_DATE - 80, CURRENT_DATE - 50, 22000.00, 22000.00, 'pago'),
  ('Serviço Concluído', 'NF-8015', CURRENT_DATE - 70, CURRENT_DATE - 40, 18500.00, 18500.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Escritório Contábil Precisão (a9999999-9999-9999-9999-999999999999)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'a9999999-9999-9999-9999-999999999999',
  (SELECT id FROM customers WHERE company_id = 'a9999999-9999-9999-9999-999999999999' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'a9999999-9999-9999-9999-999999999999' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Honorários Contábeis', 'NF-9001', CURRENT_DATE - 45, CURRENT_DATE - 20, 4500.00, 0, 'pendente'),
  ('Consultoria Fiscal', 'NF-9002', CURRENT_DATE - 40, CURRENT_DATE - 15, 6500.00, 0, 'pendente'),
  ('Declaração IRPJ', 'NF-9003', CURRENT_DATE - 35, CURRENT_DATE - 10, 8000.00, 0, 'pendente'),
  ('Folha de Pagamento', 'NF-9004', CURRENT_DATE - 30, CURRENT_DATE + 5, 3500.00, 0, 'pendente'),
  ('Auditoria Interna', 'NF-9005', CURRENT_DATE - 25, CURRENT_DATE + 10, 15000.00, 0, 'pendente'),
  ('Planejamento Tributário', 'NF-9006', CURRENT_DATE - 20, CURRENT_DATE + 15, 12000.00, 0, 'pendente'),
  ('Abertura Empresa', 'NF-9007', CURRENT_DATE - 15, CURRENT_DATE + 20, 2500.00, 0, 'pendente'),
  ('Consultoria Mensal', 'NF-9008', CURRENT_DATE - 10, CURRENT_DATE + 25, 5500.00, 0, 'pendente'),
  ('Projeto Reestruturação', 'NF-9009', CURRENT_DATE - 60, CURRENT_DATE - 30, 35000.00, 17500.00, 'parcial'),
  ('Due Diligence', 'NF-9010', CURRENT_DATE - 55, CURRENT_DATE - 25, 45000.00, 22500.00, 'parcial'),
  ('Auditoria Externa', 'NF-9011', CURRENT_DATE - 50, CURRENT_DATE - 20, 28000.00, 14000.00, 'parcial'),
  ('Consultoria Societária', 'NF-9012', CURRENT_DATE - 45, CURRENT_DATE - 15, 18000.00, 9000.00, 'parcial'),
  ('Serviço Quitado', 'NF-9013', CURRENT_DATE - 90, CURRENT_DATE - 60, 8500.00, 8500.00, 'pago'),
  ('Honorários Pagos', 'NF-9014', CURRENT_DATE - 80, CURRENT_DATE - 50, 12000.00, 12000.00, 'pago'),
  ('Consultoria Paga', 'NF-9015', CURRENT_DATE - 70, CURRENT_DATE - 40, 15000.00, 15000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);

-- Indústria Plásticos Brasil (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
INSERT INTO receivables (company_id, customer_id, chart_account_id, description, document_number, issue_date, due_date, total_amount, paid_amount, status, installment_number, total_installments)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM customers WHERE company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1),
  (SELECT id FROM chart_of_accounts WHERE company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND type = 'receita' LIMIT 1),
  description, doc_num, issue, due, total, paid, status::receivable_status, 1, 1
FROM (VALUES
  ('Produção Embalagens', 'NF-A001', CURRENT_DATE - 45, CURRENT_DATE - 20, 85000.00, 0, 'pendente'),
  ('Fornecimento Indústria', 'NF-A002', CURRENT_DATE - 40, CURRENT_DATE - 15, 120000.00, 0, 'pendente'),
  ('Peças Injetadas', 'NF-A003', CURRENT_DATE - 35, CURRENT_DATE - 10, 65000.00, 0, 'pendente'),
  ('Componentes Automotivos', 'NF-A004', CURRENT_DATE - 30, CURRENT_DATE + 5, 95000.00, 0, 'pendente'),
  ('Embalagens Alimentícias', 'NF-A005', CURRENT_DATE - 25, CURRENT_DATE + 10, 45000.00, 0, 'pendente'),
  ('Produção Especial', 'NF-A006', CURRENT_DATE - 20, CURRENT_DATE + 15, 150000.00, 0, 'pendente'),
  ('Peças Customizadas', 'NF-A007', CURRENT_DATE - 15, CURRENT_DATE + 20, 35000.00, 0, 'pendente'),
  ('Fornecimento Mensal', 'NF-A008', CURRENT_DATE - 10, CURRENT_DATE + 25, 78000.00, 0, 'pendente'),
  ('Contrato Grande', 'NF-A009', CURRENT_DATE - 60, CURRENT_DATE - 30, 280000.00, 140000.00, 'parcial'),
  ('Produção Exportação', 'NF-A010', CURRENT_DATE - 55, CURRENT_DATE - 25, 350000.00, 175000.00, 'parcial'),
  ('Fornecimento Montadora', 'NF-A011', CURRENT_DATE - 50, CURRENT_DATE - 20, 220000.00, 110000.00, 'parcial'),
  ('Peças Série', 'NF-A012', CURRENT_DATE - 45, CURRENT_DATE - 15, 185000.00, 92500.00, 'parcial'),
  ('Pedido Quitado', 'NF-A013', CURRENT_DATE - 90, CURRENT_DATE - 60, 95000.00, 95000.00, 'pago'),
  ('Produção Paga', 'NF-A014', CURRENT_DATE - 80, CURRENT_DATE - 50, 125000.00, 125000.00, 'pago'),
  ('Contrato Concluído', 'NF-A015', CURRENT_DATE - 70, CURRENT_DATE - 40, 180000.00, 180000.00, 'pago')
) AS t(description, doc_num, issue, due, total, paid, status);
