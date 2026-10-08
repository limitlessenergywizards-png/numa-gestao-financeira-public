
-- Complete demo data using REAL company IDs:
-- a1111111-1111-1111-1111-111111111111 = Tech Solutions Ltda
-- a2222222-2222-2222-2222-222222222222 = Construtora Horizonte SA
-- a3333333-3333-3333-3333-333333333333 = Distribuidora Alimenta Ltda
-- a4444444-4444-4444-4444-444444444444 = Clínica Saúde Total
-- a5555555-5555-5555-5555-555555555555 = Auto Peças Express Ltda
-- a6666666-6666-6666-6666-666666666666 = Agro Fazenda Verde SA
-- a7777777-7777-7777-7777-777777777777 = Loja Moda Fashion
-- a8888888-8888-8888-8888-888888888888 = Restaurante Sabor e Arte
-- a9999999-9999-9999-9999-999999999999 = Escritório Contábil Precisão
-- aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa = Indústria Plásticos Brasil

-- =====================================================
-- 1. CHART OF ACCOUNTS for 9 companies (Tech Solutions already has)
-- =====================================================
INSERT INTO chart_of_accounts (company_id, code, name, type, dre_category, is_active) VALUES
-- Construtora Horizonte SA
('a2222222-2222-2222-2222-222222222222', '3.1.01', 'Receita de Obras', 'receita', 'receita_operacional', true),
('a2222222-2222-2222-2222-222222222222', '3.1.02', 'Consultoria Técnica', 'receita', 'receita_operacional', true),
('a2222222-2222-2222-2222-222222222222', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a2222222-2222-2222-2222-222222222222', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a2222222-2222-2222-2222-222222222222', '4.1.01', 'Mão de Obra', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.02', 'Materiais de Construção', 'despesa', 'custo_mercadorias', true),
('a2222222-2222-2222-2222-222222222222', '4.1.03', 'Equipamentos', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.04', 'Transporte', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.05', 'Seguros', 'despesa', 'despesas_operacionais', true),
('a2222222-2222-2222-2222-222222222222', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Distribuidora Alimenta Ltda
('a3333333-3333-3333-3333-333333333333', '3.1.01', 'Vendas de Mercadorias', 'receita', 'receita_operacional', true),
('a3333333-3333-3333-3333-333333333333', '3.1.02', 'Frete Cobrado', 'receita', 'receita_operacional', true),
('a3333333-3333-3333-3333-333333333333', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a3333333-3333-3333-3333-333333333333', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a3333333-3333-3333-3333-333333333333', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a3333333-3333-3333-3333-333333333333', '4.1.03', 'Frete Pago', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.04', 'Armazenagem', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.05', 'Combustível', 'despesa', 'despesas_operacionais', true),
('a3333333-3333-3333-3333-333333333333', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Clínica Saúde Total
('a4444444-4444-4444-4444-444444444444', '3.1.01', 'Consultas Médicas', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.02', 'Exames', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.03', 'Procedimentos', 'receita', 'receita_operacional', true),
('a4444444-4444-4444-4444-444444444444', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a4444444-4444-4444-4444-444444444444', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.02', 'Materiais Médicos', 'despesa', 'custo_mercadorias', true),
('a4444444-4444-4444-4444-444444444444', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.04', 'Equipamentos', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.05', 'Seguros', 'despesa', 'despesas_operacionais', true),
('a4444444-4444-4444-4444-444444444444', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Auto Peças Express Ltda
('a5555555-5555-5555-5555-555555555555', '3.1.01', 'Vendas de Peças', 'receita', 'receita_operacional', true),
('a5555555-5555-5555-5555-555555555555', '3.1.02', 'Serviços de Instalação', 'receita', 'receita_operacional', true),
('a5555555-5555-5555-5555-555555555555', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a5555555-5555-5555-5555-555555555555', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a5555555-5555-5555-5555-555555555555', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a5555555-5555-5555-5555-555555555555', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.04', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.05', 'Frete', 'despesa', 'despesas_operacionais', true),
('a5555555-5555-5555-5555-555555555555', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Agro Fazenda Verde SA
('a6666666-6666-6666-6666-666666666666', '3.1.01', 'Vendas de Grãos', 'receita', 'receita_operacional', true),
('a6666666-6666-6666-6666-666666666666', '3.1.02', 'Vendas de Gado', 'receita', 'receita_operacional', true),
('a6666666-6666-6666-6666-666666666666', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a6666666-6666-6666-6666-666666666666', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a6666666-6666-6666-6666-666666666666', '4.1.01', 'Mão de Obra Rural', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.02', 'Insumos Agrícolas', 'despesa', 'custo_mercadorias', true),
('a6666666-6666-6666-6666-666666666666', '4.1.03', 'Combustível', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.04', 'Manutenção Máquinas', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.05', 'Veterinário', 'despesa', 'despesas_operacionais', true),
('a6666666-6666-6666-6666-666666666666', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Loja Moda Fashion
('a7777777-7777-7777-7777-777777777777', '3.1.01', 'Vendas de Roupas', 'receita', 'receita_operacional', true),
('a7777777-7777-7777-7777-777777777777', '3.1.02', 'Vendas Online', 'receita', 'receita_operacional', true),
('a7777777-7777-7777-7777-777777777777', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('a7777777-7777-7777-7777-777777777777', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a7777777-7777-7777-7777-777777777777', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.02', 'Custo de Mercadorias', 'despesa', 'custo_mercadorias', true),
('a7777777-7777-7777-7777-777777777777', '4.1.03', 'Aluguel Shopping', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.04', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.05', 'Embalagens', 'despesa', 'despesas_operacionais', true),
('a7777777-7777-7777-7777-777777777777', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Restaurante Sabor e Arte
('a8888888-8888-8888-8888-888888888888', '3.1.01', 'Vendas Restaurante', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.02', 'Delivery', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.03', 'Eventos', 'receita', 'receita_operacional', true),
('a8888888-8888-8888-8888-888888888888', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a8888888-8888-8888-8888-888888888888', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.02', 'Insumos e Alimentos', 'despesa', 'custo_mercadorias', true),
('a8888888-8888-8888-8888-888888888888', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.04', 'Energia e Gás', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.05', 'Marketing', 'despesa', 'despesas_operacionais', true),
('a8888888-8888-8888-8888-888888888888', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Escritório Contábil Precisão
('a9999999-9999-9999-9999-999999999999', '3.1.01', 'Honorários Contábeis', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.02', 'Consultoria Fiscal', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.03', 'Abertura de Empresas', 'receita', 'receita_operacional', true),
('a9999999-9999-9999-9999-999999999999', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('a9999999-9999-9999-9999-999999999999', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.02', 'Software e Sistemas', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.03', 'Aluguel', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.04', 'Cursos e Treinamentos', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.05', 'Material de Escritório', 'despesa', 'despesas_operacionais', true),
('a9999999-9999-9999-9999-999999999999', '4.1.06', 'Impostos', 'despesa', 'impostos', true),
-- Indústria Plásticos Brasil
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.01', 'Vendas de Produtos', 'receita', 'receita_operacional', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.02', 'Serviços de Injeção', 'receita', 'receita_operacional', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.03', 'Juros Recebidos', 'receita', 'receitas_financeiras', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3.1.04', 'Outras Receitas', 'receita', 'outras_receitas', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.01', 'Folha de Pagamento', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.02', 'Matéria Prima', 'despesa', 'custo_mercadorias', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.03', 'Energia Elétrica', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.04', 'Manutenção de Máquinas', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.05', 'Frete', 'despesa', 'despesas_operacionais', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4.1.06', 'Impostos', 'despesa', 'impostos', true);

-- =====================================================
-- 2. CUSTOMERS for 9 companies (Tech Solutions already has 5)
-- =====================================================
INSERT INTO customers (company_id, name, document, email, phone, city, state, is_active) VALUES
-- Construtora Horizonte SA customers
('a2222222-2222-2222-2222-222222222222', 'Incorporadora Vista Bela', '66.777.888/0001-66', 'projetos@vistabela.com.br', '(21) 6666-7777', 'Rio de Janeiro', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Condomínio Jardins', '77.888.999/0001-77', 'sindico@jardins.com.br', '(21) 7777-8888', 'Niterói', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Shopping Center Sul', '88.999.000/0001-88', 'expansao@shoppingsul.com.br', '(21) 8888-9999', 'Rio de Janeiro', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Hospital Regional', '99.000.111/0001-99', 'obras@hospitalregional.com.br', '(21) 9999-0000', 'Petrópolis', 'RJ', true),
('a2222222-2222-2222-2222-222222222222', 'Prefeitura Municipal', '00.111.222/0001-00', 'licitacoes@prefeitura.gov.br', '(21) 0000-1111', 'Teresópolis', 'RJ', true),
-- Distribuidora Alimenta Ltda customers
('a3333333-3333-3333-3333-333333333333', 'Rede de Farmácias Plus', '11.111.111/0001-11', 'compras@farmaciasplus.com.br', '(31) 1111-1111', 'Belo Horizonte', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Supermercados Mineiro', '22.222.222/0001-22', 'abastecimento@smineiro.com.br', '(31) 2222-2222', 'Contagem', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Lojas Americanas MG', '33.333.333/0001-33', 'distribuicao@americanasmg.com.br', '(31) 3333-3333', 'Betim', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Atacarejo Popular', '44.444.444/0001-44', 'estoque@atacarejopopular.com.br', '(31) 4444-4444', 'Uberlândia', 'MG', true),
('a3333333-3333-3333-3333-333333333333', 'Drogaria Saúde', '55.555.555/0001-55', 'compras@drogariasaude.com.br', '(31) 5555-5555', 'Juiz de Fora', 'MG', true),
-- Clínica Saúde Total customers
('a4444444-4444-4444-4444-444444444444', 'Plano Saúde Unimed', '17.171.717/0001-17', 'credenciamento@unimed.com.br', '(41) 1717-1717', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Bradesco Saúde', '18.181.818/0001-18', 'rede@bradescosaude.com.br', '(41) 1818-1818', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'SulAmérica Seguros', '19.191.919/0001-19', 'prestadores@sulamerica.com.br', '(41) 1919-1919', 'Curitiba', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Amil Assistência Médica', '20.202.020/0001-20', 'credenciados@amil.com.br', '(41) 2020-2020', 'São José dos Pinhais', 'PR', true),
('a4444444-4444-4444-4444-444444444444', 'Particular - Maria Silva', '123.456.789-00', 'maria.silva@email.com', '(41) 99999-0000', 'Curitiba', 'PR', true),
-- Auto Peças Express customers
('a5555555-5555-5555-5555-555555555555', 'Oficina Mecânica Central', '66.666.666/0001-66', 'compras@oficina.com.br', '(11) 6666-6666', 'São Paulo', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Auto Center Express', '77.777.777/0001-77', 'pedidos@autocenter.com.br', '(11) 7777-7777', 'Campinas', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Concessionária Toyota', '88.888.888/0001-88', 'pecas@toyota.com.br', '(11) 8888-8888', 'São Paulo', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Frota Transportes Ltda', '99.999.999/0001-99', 'manutencao@frota.com.br', '(11) 9999-9999', 'Guarulhos', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Uber Brasil', '10.101.010/0001-10', 'fleet@uber.com.br', '(11) 1010-1010', 'São Paulo', 'SP', true),
-- Agro Fazenda Verde customers
('a6666666-6666-6666-6666-666666666666', 'Cargill Brasil', '12.121.212/0001-12', 'compras@cargill.com.br', '(11) 1212-1212', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Bunge Alimentos', '13.131.313/0001-13', 'trading@bunge.com.br', '(11) 1313-1313', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'ADM Brasil', '14.141.414/0001-14', 'commodities@adm.com.br', '(11) 1414-1414', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'JBS Carnes', '15.151.515/0001-15', 'compras@jbs.com.br', '(11) 1515-1515', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Minerva Foods', '16.161.616/0001-16', 'trading@minerva.com.br', '(11) 1616-1616', 'Barretos', 'SP', true),
-- Loja Moda Fashion customers
('a7777777-7777-7777-7777-777777777777', 'Maria Clara Santos', '111.222.333-44', 'maria.clara@email.com', '(51) 9999-1111', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Ana Paula Oliveira', '222.333.444-55', 'ana.paula@email.com', '(51) 9999-2222', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Empresa RH Fashion', '26.262.626/0001-26', 'uniformes@rhfashion.com.br', '(51) 2626-2626', 'Canoas', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Boutique Elegance', '27.272.727/0001-27', 'compras@elegance.com.br', '(51) 2727-2727', 'Gramado', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Shopping Iguatemi RS', '28.282.828/0001-28', 'lojistas@iguatemirs.com.br', '(51) 2828-2828', 'Porto Alegre', 'RS', true),
-- Restaurante Sabor e Arte customers
('a8888888-8888-8888-8888-888888888888', 'Empresa Tech Solutions', '12.121.212/0001-12', 'rh@techsolutions.com.br', '(51) 1212-1212', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Banco Regional Sul', '13.131.313/0001-13', 'eventos@bancoregional.com.br', '(51) 1313-1313', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Escritório Advocacia Silva', '14.141.414/0001-14', 'reunioes@silvaadvogados.com.br', '(51) 1414-1414', 'Canoas', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Clínica Estética Bella', '15.151.515/0001-15', 'eventos@clinicabella.com.br', '(51) 1515-1515', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'iFood Delivery', '16.161.616/0001-16', 'parceiros@ifood.com.br', '(51) 1616-1616', 'Porto Alegre', 'RS', true),
-- Escritório Contábil Precisão customers
('a9999999-9999-9999-9999-999999999999', 'Padaria Pão Quente', '21.212.121/0001-21', 'contato@paoquente.com.br', '(71) 2121-2121', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Loja de Roupas Fashion', '22.232.232/0001-22', 'financeiro@fashionba.com.br', '(71) 2223-2232', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Oficina Mecânica Turbo', '23.232.323/0001-23', 'gerente@oficinaturbo.com.br', '(71) 2323-2323', 'Lauro de Freitas', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Salão de Beleza Glamour', '24.242.424/0001-24', 'adm@salaoglamour.com.br', '(71) 2424-2424', 'Salvador', 'BA', true),
('a9999999-9999-9999-9999-999999999999', 'Petshop Animal Planet', '25.252.525/0001-25', 'dono@animalplanet.com.br', '(71) 2525-2525', 'Feira de Santana', 'BA', true),
-- Indústria Plásticos Brasil customers
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fábrica de Brinquedos Fun', '26.262.626/0001-26', 'compras@brinquedosfun.com.br', '(11) 2626-2626', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Embalagens Plásticas SA', '27.272.727/0001-27', 'comercial@embalagens.com.br', '(11) 2727-2727', 'Guarulhos', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Utilidades Domésticas', '28.282.828/0001-28', 'compras@utilidades.com.br', '(11) 2828-2828', 'Osasco', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Indústria Automotiva XYZ', '29.292.929/0001-29', 'suprimentos@automotivaxyz.com.br', '(11) 2929-2929', 'São Bernardo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Eletrodomésticos Plus', '30.303.030/0001-30', 'componentes@eletroplus.com.br', '(11) 3030-3030', 'Campinas', 'SP', true);

-- =====================================================
-- 3. SUPPLIERS for all 10 companies
-- =====================================================
INSERT INTO suppliers (company_id, name, document, email, phone, city, state, is_active) VALUES
-- Tech Solutions suppliers
('a1111111-1111-1111-1111-111111111111', 'AWS Brasil', '00.000.001/0001-01', 'vendas@aws.amazon.com', '(11) 0001-0001', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Microsoft Brasil', '00.000.002/0001-02', 'licencas@microsoft.com', '(11) 0002-0002', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Dell Technologies', '00.000.003/0001-03', 'vendas@dell.com.br', '(11) 0003-0003', 'São Paulo', 'SP', true),
('a1111111-1111-1111-1111-111111111111', 'Algar Telecom', '00.000.004/0001-04', 'corporativo@algar.com.br', '(11) 0004-0004', 'Uberlândia', 'MG', true),
('a1111111-1111-1111-1111-111111111111', 'Locaweb', '00.000.005/0001-05', 'comercial@locaweb.com.br', '(11) 0005-0005', 'São Paulo', 'SP', true),
-- Construtora Horizonte suppliers
('a2222222-2222-2222-2222-222222222222', 'Votorantim Cimentos', '00.000.016/0001-16', 'vendas@vcimentos.com.br', '(11) 0016-0016', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Tigre S.A.', '00.000.017/0001-17', 'comercial@tigre.com.br', '(47) 0017-0017', 'Joinville', 'SC', true),
('a2222222-2222-2222-2222-222222222222', 'Lorenzetti', '00.000.018/0001-18', 'vendas@lorenzetti.com.br', '(11) 0018-0018', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Quartzolit', '00.000.019/0001-19', 'comercial@quartzolit.com.br', '(11) 0019-0019', 'São Paulo', 'SP', true),
('a2222222-2222-2222-2222-222222222222', 'Portobello', '00.000.020/0001-20', 'vendas@portobello.com.br', '(48) 0020-0020', 'Tijucas', 'SC', true),
-- Distribuidora Alimenta suppliers
('a3333333-3333-3333-3333-333333333333', 'P&G Brasil', '00.000.021/0001-21', 'vendas@pg.com.br', '(11) 0021-0021', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Unilever Brasil', '00.000.022/0001-22', 'comercial@unilever.com.br', '(11) 0022-0022', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Colgate-Palmolive', '00.000.023/0001-23', 'vendas@colgate.com.br', '(11) 0023-0023', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Nestlé Brasil', '00.000.024/0001-24', 'comercial@nestle.com.br', '(11) 0024-0024', 'São Paulo', 'SP', true),
('a3333333-3333-3333-3333-333333333333', 'Ambev', '00.000.025/0001-25', 'vendas@ambev.com.br', '(11) 0025-0025', 'São Paulo', 'SP', true),
-- Clínica Saúde Total suppliers
('a4444444-4444-4444-4444-444444444444', 'Medtronic Brasil', '00.000.036/0001-36', 'vendas@medtronic.com.br', '(11) 0036-0036', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Philips Healthcare', '00.000.037/0001-37', 'comercial@philips.com.br', '(11) 0037-0037', 'Barueri', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Siemens Healthineers', '00.000.038/0001-38', 'vendas@siemens.com.br', '(11) 0038-0038', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Roche Diagnóstica', '00.000.039/0001-39', 'comercial@roche.com.br', '(11) 0039-0039', 'São Paulo', 'SP', true),
('a4444444-4444-4444-4444-444444444444', 'Eurofarma', '00.000.040/0001-40', 'vendas@eurofarma.com.br', '(11) 0040-0040', 'São Paulo', 'SP', true),
-- Auto Peças Express suppliers
('a5555555-5555-5555-5555-555555555555', 'Bosch Brasil', '00.000.041/0001-41', 'vendas@bosch.com.br', '(11) 0041-0041', 'Campinas', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'NGK do Brasil', '00.000.042/0001-42', 'comercial@ngk.com.br', '(11) 0042-0042', 'Mogi das Cruzes', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Continental Pneus', '00.000.043/0001-43', 'vendas@continental.com.br', '(11) 0043-0043', 'Guarulhos', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Mann Filter', '00.000.044/0001-44', 'comercial@mann.com.br', '(11) 0044-0044', 'Indaiatuba', 'SP', true),
('a5555555-5555-5555-5555-555555555555', 'Valeo Brasil', '00.000.045/0001-45', 'vendas@valeo.com.br', '(11) 0045-0045', 'Campinas', 'SP', true),
-- Agro Fazenda Verde suppliers
('a6666666-6666-6666-6666-666666666666', 'Syngenta Brasil', '00.000.046/0001-46', 'vendas@syngenta.com.br', '(11) 0046-0046', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'Bayer CropScience', '00.000.047/0001-47', 'comercial@bayer.com.br', '(11) 0047-0047', 'São Paulo', 'SP', true),
('a6666666-6666-6666-6666-666666666666', 'John Deere Brasil', '00.000.048/0001-48', 'vendas@johndeere.com.br', '(11) 0048-0048', 'Horizontina', 'RS', true),
('a6666666-6666-6666-6666-666666666666', 'Massey Ferguson', '00.000.049/0001-49', 'comercial@massey.com.br', '(11) 0049-0049', 'Canoas', 'RS', true),
('a6666666-6666-6666-6666-666666666666', 'Cargill Nutrição', '00.000.050/0001-50', 'vendas@cargill.com.br', '(11) 0050-0050', 'São Paulo', 'SP', true),
-- Loja Moda Fashion suppliers
('a7777777-7777-7777-7777-777777777777', 'Malwee Malhas', '00.000.051/0001-51', 'vendas@malwee.com.br', '(47) 0051-0051', 'Jaraguá do Sul', 'SC', true),
('a7777777-7777-7777-7777-777777777777', 'Hering', '00.000.052/0001-52', 'comercial@hering.com.br', '(47) 0052-0052', 'Blumenau', 'SC', true),
('a7777777-7777-7777-7777-777777777777', 'Renner S.A.', '00.000.053/0001-53', 'fornecedores@renner.com.br', '(51) 0053-0053', 'Porto Alegre', 'RS', true),
('a7777777-7777-7777-7777-777777777777', 'Lupo', '00.000.054/0001-54', 'vendas@lupo.com.br', '(16) 0054-0054', 'Araraquara', 'SP', true),
('a7777777-7777-7777-7777-777777777777', 'Dudalina', '00.000.055/0001-55', 'comercial@dudalina.com.br', '(47) 0055-0055', 'Blumenau', 'SC', true),
-- Restaurante Sabor e Arte suppliers
('a8888888-8888-8888-8888-888888888888', 'CEASA Porto Alegre', '00.000.031/0001-31', 'vendas@ceasars.com.br', '(51) 0031-0031', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Frigorífico Marfrig', '00.000.032/0001-32', 'comercial@marfrig.com.br', '(51) 0032-0032', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Vinícola Aurora', '00.000.033/0001-33', 'vendas@vinicolaaurora.com.br', '(54) 0033-0033', 'Bento Gonçalves', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Distribuidora Bebidas Sul', '00.000.034/0001-34', 'comercial@bebidassul.com.br', '(51) 0034-0034', 'Porto Alegre', 'RS', true),
('a8888888-8888-8888-8888-888888888888', 'Copagaz', '00.000.035/0001-35', 'vendas@copagaz.com.br', '(51) 0035-0035', 'Porto Alegre', 'RS', true),
-- Escritório Contábil Precisão suppliers
('a9999999-9999-9999-9999-999999999999', 'TOTVS', '00.000.056/0001-56', 'vendas@totvs.com.br', '(11) 0056-0056', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'Domínio Sistemas', '00.000.057/0001-57', 'comercial@dominio.com.br', '(47) 0057-0057', 'Criciúma', 'SC', true),
('a9999999-9999-9999-9999-999999999999', 'Certisign', '00.000.058/0001-58', 'vendas@certisign.com.br', '(11) 0058-0058', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'Staples Brasil', '00.000.059/0001-59', 'comercial@staples.com.br', '(11) 0059-0059', 'São Paulo', 'SP', true),
('a9999999-9999-9999-9999-999999999999', 'IOB Informações', '00.000.060/0001-60', 'vendas@iob.com.br', '(11) 0060-0060', 'São Paulo', 'SP', true),
-- Indústria Plásticos Brasil suppliers
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Braskem', '00.000.061/0001-61', 'vendas@braskem.com.br', '(11) 0061-0061', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dow Chemical', '00.000.062/0001-62', 'comercial@dow.com.br', '(11) 0062-0062', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BASF Brasil', '00.000.063/0001-63', 'vendas@basf.com.br', '(11) 0063-0063', 'São Paulo', 'SP', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Innova Petroquímica', '00.000.064/0001-64', 'comercial@innova.com.br', '(51) 0064-0064', 'Triunfo', 'RS', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kraton Polymers', '00.000.065/0001-65', 'vendas@kraton.com.br', '(11) 0065-0065', 'Paulínia', 'SP', true);
