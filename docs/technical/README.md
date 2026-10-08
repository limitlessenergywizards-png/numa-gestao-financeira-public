# The Alexandria Project: Documentation Index

> **"Transformando Código em Sabedoria."**

Este diretório contém a documentação técnica detalhada dos módulos principais do sistema Numa Gestão Financeira.  
A metodologia utilizada foi **5W2H + Feynman**, focando em explicar *o porquê* das decisões arquiteturais e não apenas *o como*.

---

## 🏛️ Phase 1: Core Finance (O Motor)
A espinha dorsal do sistema. Onde o dinheiro entra e sai.

*   [**TransactionDialogs**](./TransactionDialogs.md)  
    *O Hub de Entrada de Dados.* Como funcionam os modais de criação, edição e a integração com OCR.
*   [**useTransactionsData**](./useTransactionsData.md)  
    *O Container de Estado.* A lógica de fetch, filtros client-side e cálculo de totais em tempo real.
*   [**useTransactionsActions**](./useTransactionsActions.md)  
    *A Lógica de Negócio.* O padrão Saga (Client-Side) para garantir consistência entre Transações, Contas a Pagar e Receber.
*   [**useTransactionsQuery**](./useTransactionsQuery.md)  
    *O Carteiro Veloz.* Estratégias de Cache, Invalidação e Optimistic UI com React Query.
*   [**Database Procedures (ACID)**](./DatabaseProcedures.md)  
    *A Integridade.* Stored Procedures e Triggers que garantem que o banco nunca fique inconsistente.

---

## 📊 Phase 2: DRE & Reports (A Estratégia)
A transformação de dados operacionais em inteligência de negócio.

*   [**useDREData**](./useDREData.md)  
    *O Auditor Contábil.* O motor de cálculo que consolida Regime de Caixa vs Competência.
*   [**DREPage**](./DREPage.md)  
    *O Painel Executivo.* A interface do DRE, lazy loading de gráficos e integração com IA.

---

## 📈 Phase 3: Analytics & Dashboard (O Visual)
Componentes de alta fidelidade visual para encantar o usuário.

*   [**DashboardPage**](./DashboardPage.md)  
    *A Visão Geral.* O ponto de partida do usuário, agregando múltiplos widgets.
*   [**GlassAreaChart**](./GlassAreaChart.md)  
    *A Estética.* Gráficos customizados com Glassmorphism e gradientes SVG.
*   [**HealthScoreGauge**](./HealthScoreGauge.md)  
    *A Gamificação.* O componente que resume a saúde da empresa em uma nota de 0 a 100.
*   [**useDashboardQueries**](./useDashboardQueries.md)  
    *A Performance.* Queries otimizadas para carregar o dashboard instantaneamente.
*   [**useFinancialHistory**](./useFinancialHistory.md)  
    *A Linha do Tempo.* Hook responsável por buscar dados históricos para gráficos de evolução.

---

## 🏗️ Phase 4: Architecture (A Fundação)
Os utilitários globais que mantêm o sistema de pé.

*   [**App (Root)**](./App.md)  
    *O Kernel.* Configuração de Providers, Persistência de Cache e Tratamento de Erros.
*   [**Routes**](./Routes.md)  
    *O Mapa.* Arquitetura de navegação centralizada, Guards de Autenticação e Code Splitting.
*   [**Supabase Client**](./SupabaseClient.md)  
    *O Porteiro.* Singleton de conexão com o banco, tipagem forte e fail-fast para variáveis de ambiente.

---

> *Documentação gerada por Project Alexandria em Fevereiro de 2026.*
