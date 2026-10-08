
-- SEED DATA: 10 Empresas com UUIDs válidos
-- Parte 1: Empresas, User Companies, Contas Bancárias e Plano de Contas

-- 1. INSERIR 10 EMPRESAS
INSERT INTO public.companies (id, name, trading_name, document, email, phone, address, number, neighborhood, city, state, zip_code, is_headquarters) VALUES
('a1111111-1111-1111-1111-111111111111', 'Tech Solutions Ltda', 'Tech Solutions', '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 99999-1111', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '01310-100', true),
('a2222222-2222-2222-2222-222222222222', 'Construtora Horizonte SA', 'Horizonte', '23.456.789/0001-01', 'contato@horizonte.com.br', '(21) 99999-2222', 'Av. Rio Branco', '500', 'Centro', 'Rio de Janeiro', 'RJ', '20040-002', true),
('a3333333-3333-3333-3333-333333333333', 'Distribuidora Alimenta Ltda', 'Alimenta', '34.567.890/0001-12', 'vendas@alimenta.com.br', '(31) 99999-3333', 'Av. Amazonas', '2500', 'Prado', 'Belo Horizonte', 'MG', '30110-150', true),
('a4444444-4444-4444-4444-444444444444', 'Clínica Saúde Total', 'Saúde Total', '45.678.901/0001-23', 'atendimento@saudetotal.com.br', '(41) 99999-4444', 'Rua XV de Novembro', '300', 'Centro', 'Curitiba', 'PR', '80020-310', true),
('a5555555-5555-5555-5555-555555555555', 'Auto Peças Express Ltda', 'Auto Express', '56.789.012/0001-34', 'vendas@autoexpress.com.br', '(51) 99999-5555', 'Av. Assis Brasil', '1500', 'Passo d''Areia', 'Porto Alegre', 'RS', '91010-001', true),
('a6666666-6666-6666-6666-666666666666', 'Agro Fazenda Verde SA', 'Fazenda Verde', '67.890.123/0001-45', 'contato@fazendaverde.com.br', '(62) 99999-6666', 'Av. Goiás', '800', 'Centro', 'Goiânia', 'GO', '74005-010', true),
('a7777777-7777-7777-7777-777777777777', 'Loja Moda Fashion', 'Moda Fashion', '78.901.234/0001-56', 'vendas@modafashion.com.br', '(71) 99999-7777', 'Av. Sete de Setembro', '1200', 'Vitória', 'Salvador', 'BA', '40080-001', true),
('a8888888-8888-8888-8888-888888888888', 'Restaurante Sabor e Arte', 'Sabor e Arte', '89.012.345/0001-67', 'reservas@saborarte.com.br', '(81) 99999-8888', 'Rua do Bom Jesus', '150', 'Recife Antigo', 'Recife', 'PE', '50030-170', true),
('a9999999-9999-9999-9999-999999999999', 'Escritório Contábil Precisão', 'Precisão Contábil', '90.123.456/0001-78', 'contato@precisaocontabil.com.br', '(48) 99999-9999', 'Av. Beira Mar Norte', '2000', 'Centro', 'Florianópolis', 'SC', '88015-200', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Indústria Plásticos Brasil', 'Plásticos Brasil', '01.234.567/0001-89', 'comercial@plasticosbrasil.com.br', '(19) 99999-0000', 'Rod. Anhanguera', 'km 105', 'Distrito Industrial', 'Campinas', 'SP', '13054-750', true);

-- 2. VINCULAR USUÁRIO ÀS EMPRESAS
INSERT INTO public.user_companies (user_id, company_id, is_default) VALUES
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a1111111-1111-1111-1111-111111111111', true),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a2222222-2222-2222-2222-222222222222', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a3333333-3333-3333-3333-333333333333', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a4444444-4444-4444-4444-444444444444', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a5555555-5555-5555-5555-555555555555', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a6666666-6666-6666-6666-666666666666', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a7777777-7777-7777-7777-777777777777', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a8888888-8888-8888-8888-888888888888', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'a9999999-9999-9999-9999-999999999999', false),
('a496bc49-e02e-4f73-852e-9ff016604c82', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);

-- 3. CRIAR CONTAS BANCÁRIAS
INSERT INTO public.bank_accounts (company_id, name, bank_name, agency, account_number, account_type, initial_balance, current_balance, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Conta Corrente Principal', 'Banco do Brasil', '1234-5', '12345-6', 'corrente', 50000, 85000, true),
('a1111111-1111-1111-1111-111111111111', 'Poupança Reserva', 'Banco do Brasil', '1234-5', '12345-7', 'poupanca', 25000, 30000, true),
('a2222222-2222-2222-2222-222222222222', 'Conta Corrente Itaú', 'Itaú', '0567', '45678-9', 'corrente', 150000, 220000, true),
('a2222222-2222-2222-2222-222222222222', 'Investimentos', 'Itaú', '0567', '45678-0', 'investimento', 100000, 115000, true),
('a3333333-3333-3333-3333-333333333333', 'Conta Bradesco', 'Bradesco', '2345', '23456-7', 'corrente', 80000, 95000, true),
('a3333333-3333-3333-3333-333333333333', 'Poupança', 'Bradesco', '2345', '23456-8', 'poupanca', 40000, 45000, true),
('a4444444-4444-4444-4444-444444444444', 'Conta Santander', 'Santander', '3456', '34567-8', 'corrente', 60000, 72000, true),
('a4444444-4444-4444-4444-444444444444', 'Reserva Emergência', 'Santander', '3456', '34567-9', 'poupanca', 30000, 35000, true),
('a5555555-5555-5555-5555-555555555555', 'Conta Caixa', 'Caixa', '4567', '45678-0', 'corrente', 45000, 55000, true),
('a5555555-5555-5555-5555-555555555555', 'Poupança Caixa', 'Caixa', '4567', '45678-1', 'poupanca', 20000, 22000, true),
('a6666666-6666-6666-6666-666666666666', 'Conta Sicredi', 'Sicredi', '5678', '56789-1', 'corrente', 200000, 280000, true),
('a6666666-6666-6666-6666-666666666666', 'Investimento Agro', 'Sicredi', '5678', '56789-2', 'investimento', 150000, 180000, true),
('a7777777-7777-7777-7777-777777777777', 'Conta Inter', 'Banco Inter', '0001', '67890-2', 'corrente', 35000, 42000, true),
('a7777777-7777-7777-7777-777777777777', 'Poupança Inter', 'Banco Inter', '0001', '67890-3', 'poupanca', 15000, 18000, true),
('a8888888-8888-8888-8888-888888888888', 'Conta Nubank', 'Nubank', '0001', '78901-3', 'corrente', 25000, 32000, true),
('a8888888-8888-8888-8888-888888888888', 'Reserva', 'Nubank', '0001', '78901-4', 'poupanca', 10000, 12000, true),
('a9999999-9999-9999-9999-999999999999', 'Conta Original', 'Banco Original', '0001', '89012-4', 'corrente', 40000, 48000, true),
('a9999999-9999-9999-9999-999999999999', 'Poupança Original', 'Banco Original', '0001', '89012-5', 'poupanca', 20000, 24000, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Conta Safra', 'Banco Safra', '0789', '90123-5', 'corrente', 120000, 145000, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Investimento Safra', 'Banco Safra', '0789', '90123-6', 'investimento', 80000, 95000, true);

-- 4. CRIAR PLANO DE CONTAS (Tech Solutions como exemplo principal)
INSERT INTO public.chart_of_accounts (id, company_id, code, name, type, dre_category, is_active) VALUES
('ca111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '1.1.01', 'Vendas de Software', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', '1.1.02', 'Consultoria em TI', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', '1.1.03', 'Suporte Técnico', 'receita', 'Receita Bruta', true),
('ca111111-1111-1111-1111-111111111114', 'a1111111-1111-1111-1111-111111111111', '2.1.01', 'Folha de Pagamento', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111115', 'a1111111-1111-1111-1111-111111111111', '2.1.02', 'Aluguel', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111116', 'a1111111-1111-1111-1111-111111111111', '2.1.03', 'Energia Elétrica', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111117', 'a1111111-1111-1111-1111-111111111111', '2.1.04', 'Internet e Telecom', 'despesa', 'Despesas Operacionais', true),
('ca111111-1111-1111-1111-111111111118', 'a1111111-1111-1111-1111-111111111111', '2.1.05', 'Marketing Digital', 'despesa', 'Despesas Comerciais', true),
('ca111111-1111-1111-1111-111111111119', 'a1111111-1111-1111-1111-111111111111', '3.1.01', 'Licenças de Software', 'custo', 'Custos', true),
('ca111111-1111-1111-1111-11111111111a', 'a1111111-1111-1111-1111-111111111111', '3.1.02', 'Infraestrutura Cloud', 'custo', 'Custos', true);

-- 5. CRIAR CLIENTES (Tech Solutions)
INSERT INTO public.customers (company_id, name, document, email, phone, address, city, state, zip_code, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Empresa Alpha Tecnologia', '11.111.111/0001-11', 'contato@alpha.com.br', '(11) 3333-1111', 'Rua Augusta, 500', 'São Paulo', 'SP', '01304-000', true),
('a1111111-1111-1111-1111-111111111111', 'Beta Sistemas Ltda', '22.222.222/0001-22', 'contato@beta.com.br', '(11) 3333-2222', 'Av. Faria Lima, 1000', 'São Paulo', 'SP', '04538-132', true),
('a1111111-1111-1111-1111-111111111111', 'Gamma Consultoria', '33.333.333/0001-33', 'contato@gamma.com.br', '(11) 3333-3333', 'Rua Funchal, 200', 'São Paulo', 'SP', '04551-060', true),
('a1111111-1111-1111-1111-111111111111', 'Delta Informática SA', '44.444.444/0001-44', 'contato@delta.com.br', '(11) 3333-4444', 'Av. Berrini, 300', 'São Paulo', 'SP', '04571-000', true),
('a1111111-1111-1111-1111-111111111111', 'Epsilon Digital', '55.555.555/0001-55', 'contato@epsilon.com.br', '(11) 3333-5555', 'Rua Verbo Divino, 400', 'São Paulo', 'SP', '04719-002', true);

-- 6. CRIAR FORNECEDORES (Tech Solutions)
INSERT INTO public.suppliers (company_id, name, document, email, phone, address, city, state, zip_code, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Microsoft Brasil', '60.316.817/0001-03', 'vendas@microsoft.com.br', '(11) 4004-1234', 'Av. Nações Unidas, 12901', 'São Paulo', 'SP', '04578-000', true),
('a1111111-1111-1111-1111-111111111111', 'Amazon AWS', '13.134.060/0001-33', 'aws-br@amazon.com', '(11) 4004-5678', 'Av. Paulista, 2300', 'São Paulo', 'SP', '01310-300', true),
('a1111111-1111-1111-1111-111111111111', 'Dell Computadores', '72.381.189/0001-10', 'comercial@dell.com.br', '(11) 4004-9012', 'Av. Industrial, 700', 'Eldorado do Sul', 'RS', '92990-000', true),
('a1111111-1111-1111-1111-111111111111', 'Algar Telecom', '71.208.516/0001-74', 'empresas@algar.com.br', '(34) 3003-3456', 'Rua José Alves, 100', 'Uberlândia', 'MG', '38400-678', true),
('a1111111-1111-1111-1111-111111111111', 'Kalunga Escritório', '43.283.811/0001-50', 'corporativo@kalunga.com.br', '(11) 3003-7890', 'Av. Indianópolis, 2000', 'São Paulo', 'SP', '04063-000', true);
