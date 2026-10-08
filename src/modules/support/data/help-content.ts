
import {
    BookOpen,
    DollarSign,
    TrendingUp,
    FileText,
    CreditCard,
    Landmark,
    PieChart,
    ScanLine,
    Trophy,
    Settings,
    Users,
    Briefcase,
    ListTree,
    Tags,
    Building2,
    Wallet,
    ArrowRightLeft,
    BarChart3,
    History
} from "lucide-react";

export interface HelpArticle {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: any;
    content: HelpSection[];
    relatedArticles?: string[];
}

export interface HelpSection {
    type: "text" | "step-guide" | "pro-tip" | "image" | "warning";
    content: any;
    title?: string;
}

export const helpCategories = [
    { id: "principal", title: "Principal", icon: Briefcase },
    { id: "cadastros", title: "Cadastros", icon: ListTree },
    { id: "relatorios", title: "Relatórios", icon: PieChart },
    { id: "configuracoes", title: "Configurações", icon: Settings },
];

export const helpArticles: HelpArticle[] = [
    // --- PRINCIPAL ---

    // 1. Início / Dashboard
    {
        id: "dashboard",
        title: "Dashboard e Início",
        description: "Visão geral da saúde financeira e indicadores chaves.",
        category: "principal",
        icon: TrendingUp,
        content: [
            {
                type: "text",
                content: "O **Dashboard** é a tela inicial do Numa, projetada para fornecer uma visão imediata da situação financeira da sua empresa."
            },
            {
                type: "step-guide",
                title: "Principais Indicadores",
                content: [
                    {
                        title: "Saldo Total",
                        description: "Soma de todos os saldos de contas bancárias cadastradas."
                    },
                    {
                        title: "Receitas do Mês",
                        description: "Total de entradas confirmadas no mês atual."
                    },
                    {
                        title: "Despesas do Mês",
                        description: "Total de saídas realizadas no mês atual."
                    },
                    {
                        title: "Resultado",
                        description: "Diferença entre receitas e despesas (Lucro ou Prejuízo operacional do mês)."
                    }
                ]
            },
            {
                type: "pro-tip",
                content: "Utilize os filtros de período no topo da página para analisar meses anteriores ou realizar comparações."
            }
        ]
    },

    // 2. Movimentações
    {
        id: "movimentacoes",
        title: "Movimentações",
        description: "Gestão completa de todas as transações financeiras.",
        category: "principal",
        icon: ArrowRightLeft,
        content: [
            {
                type: "text",
                content: "Na tela de **Movimentações**, você visualiza o extrato completo de todas as contas. É aqui que você audita o que entrou e saiu."
            },
            {
                type: "step-guide",
                title: "Funcionalidades da Tela",
                content: [
                    {
                        title: "Filtros Avançados",
                        description: "Filtre por data, conta bancária, categoria, cliente/fornecedor ou status (Pago/Pendente)."
                    },
                    {
                        title: "Edição em Lote",
                        description: "Selecione múltiplos itens para excluir ou alterar status de uma vez."
                    },
                    {
                        title: "Exportação",
                        description: "Exporte seus lançamentos para Excel ou PDF para contabilidade."
                    }
                ]
            }
        ]
    },

    // 3. Contas a Receber
    {
        id: "contas-receber",
        title: "Contas a Receber",
        description: "Controle de receitas futuras e inadimplência.",
        category: "principal",
        icon: TrendingUp,
        content: [
            {
                type: "text",
                content: "O módulo de **Contas a Receber** permite monitorar o que sua empresa tem para receber de clientes, garantindo que nada seja esquecido."
            },
            {
                type: "step-guide",
                title: "Gerenciando Recebíveis",
                content: [
                    {
                        title: "Lançamento de Previsão",
                        description: "Ao criar uma receita, defina a data de vencimento futura e o status como 'Pendente'."
                    },
                    {
                        title: "Baixa de Títulos",
                        description: "Quando o cliente pagar, localize o título e marque como 'Recebido'. O sistema atualizará o saldo bancário."
                    },
                    {
                        title: "Régua de Cobrança",
                        description: "Identifique títulos vencidos destacados em vermelho para priorizar a cobrança."
                    }
                ]
            }
        ]
    },

    // 4. Contas a Pagar
    {
        id: "contas-pagar",
        title: "Contas a Pagar",
        description: "Organização de obrigações financeiras e pagamentos.",
        category: "principal",
        icon: DollarSign,
        content: [
            {
                type: "text",
                content: "Mantenha as contas em dia com o módulo de **Contas a Pagar**. Evite juros e multas organizando seus compromissos."
            },
            {
                type: "pro-tip",
                content: "Agende seus pagamentos recorrentes (como aluguel e internet) para que o sistema gere os lançamentos automaticamente todos os meses."
            }
        ]
    },

    // 5. Dívidas
    {
        id: "dividas",
        title: "Gestão de Dívidas",
        description: "Controle de empréstimos e parcelamentos de longo prazo.",
        category: "principal",
        icon: CreditCard,
        content: [
            {
                type: "text",
                content: "Diferente das contas a pagar do dia a dia, o módulo de **Dívidas** é focado em passivos de longo prazo, como empréstimos bancários e parcelamentos fiscais."
            },
            {
                type: "step-guide",
                title: "Como funciona",
                content: [
                    {
                        title: "Cadastro do Contrato",
                        description: "Registre o valor total da dívida, taxa de juros e número de parcelas."
                    },
                    {
                        title: "Amortização",
                        description: "Acompanhe o saldo devedor diminuindo conforme você dá baixa nas parcelas pagas."
                    }
                ]
            }
        ]
    },

    // 6. Conciliação Bancária
    {
        id: "conciliacao",
        title: "Conciliação Bancária",
        description: "Conferência entre sistema e extrato bancário (OFX).",
        category: "principal",
        icon: Landmark,
        content: [
            {
                type: "text",
                content: "A **Conciliação Bancária** é o processo de garantir que cada centavo registrado no Numa corresponde ao que realmente aconteceu no banco."
            },
            {
                type: "step-guide",
                title: "Processo de Conciliação",
                content: [
                    {
                        title: "Importar OFX",
                        description: "Baixe o arquivo OFX no site do seu banco e arraste para a tela de importação."
                    },
                    {
                        title: "Match Automático",
                        description: "O sistema tenta encontrar lançamentos com mesmo valor e data próxima."
                    },
                    {
                        title: "Conciliar",
                        description: "Confirme as sugestões ou crie novos lançamentos a partir do extrato."
                    }
                ]
            }
        ]
    },

    // 7. Minha Jornada & Gamificação
    {
        id: "minha-jornada",
        title: "Minha Jornada",
        description: "Sistema de gamificação e conquistas financeiras.",
        category: "principal",
        icon: Trophy,
        content: [
            {
                type: "text",
                content: "Transforme a gestão financeira em um hábito com a **Minha Jornada**. Complete missões diárias e semanais para acumular pontos."
            }
        ]
    },

    // 8. Histórico OCR
    {
        id: "historico-ocr",
        title: "Histórico OCR",
        description: "Gestão de documentos e notas fiscais digitalizadas.",
        category: "principal",
        icon: ScanLine,
        content: [
            {
                type: "text",
                content: "Acesse todos os documentos que foram processados pela Inteligência Artificial de leitura (OCR)."
            },
            {
                type: "pro-tip",
                content: "Sempre confira os dados extraídos pelo OCR antes de confirmar o lançamento final."
            }
        ]
    },

    // --- RELATÓRIOS ---

    // 9. Fluxo de Caixa
    {
        id: "fluxo-caixa",
        title: "Relatório de Fluxo de Caixa",
        description: "Análise temporal de entradas e saídas.",
        category: "relatorios",
        icon: BarChart3,
        content: [
            {
                type: "text",
                content: "Visualize a movimentação do dinheiro no tempo. O relatório oferece visão Diária, Semanal e Mensal."
            }
        ]
    },

    // 10. DRE
    {
        id: "dre",
        title: "DRE Gerencial",
        description: "Demonstrativo de Resultados do Exercício.",
        category: "relatorios",
        icon: FileText,
        content: [
            {
                type: "text",
                content: "O DRE é fundamental para entender a **performance econômica** da empresa (Lucro vs Prejuízo), independente do caixa."
            },
            {
                type: "step-guide",
                title: "Estrutura Padrão",
                content: [
                    { title: "Receita Operacional Bruta", description: "Faturamento total." },
                    { title: "(-) Deduções", description: "Impostos e devoluções." },
                    { title: "(=) Receita Líquida", description: "Receita real da empresa." },
                    { title: "(-) Custos (CMV/CSP)", description: "Custo direto do produto/serviço." },
                    { title: "(=) Lucro Bruto", description: "Primeira margem de resultado." },
                    { title: "(-) Despesas Operacionais", description: "Administrativas, Pessoal, Marketing." },
                    { title: "(=) Lucro Líquido", description: "Resultado final." },
                ]
            }
        ]
    },

    // 11. Indicadores Financeiros
    {
        id: "indicadores",
        title: "Indicadores Financeiros",
        description: "KPIs avançados para análise de negócio.",
        category: "relatorios",
        icon: PieChart,
        content: [
            {
                type: "text",
                content: "Acompanhe métricas vitais como Margem de Lucro, Ponto de Equilíbrio e Nível de Endividamento."
            }
        ]
    },

    // --- CADASTROS ---

    // 12. Clientes e Fornecedores
    {
        id: "clientes-fornecedores",
        title: "Clientes e Fornecedores",
        description: "Gestão da base de contatos.",
        category: "cadastros",
        icon: Users,
        content: [
            {
                type: "text",
                content: "Mantenha os dados de quem te paga (Clientes) e de quem você paga (Fornecedores) organizados."
            },
            {
                type: "warning",
                content: "Manter o cadastro de CNPJ/CPF correto é essencial para a emissão de notas fiscais (futuro) e para relatórios precisos."
            }
        ]
    },

    // 13. Plano de Contas e Categorias
    {
        id: "plano-contas",
        title: "Plano de Contas",
        description: "Categorização financeira hierárquica.",
        category: "cadastros",
        icon: ListTree,
        content: [
            {
                type: "text",
                content: "O **Plano de Contas** é a árvore de categorias que organiza suas finanças. Ele deve refletir a estrutura do seu negócio."
            },
            {
                type: "step-guide",
                title: "Níveis do Plano",
                content: [
                    { title: "Receitas", description: "Grupo raíz de entradas." },
                    { title: "Despesas Variáveis", description: "Custos atrelados à venda." },
                    { title: "Despesas Fixas", description: "Custos de estrutura." }
                ]
            }
        ]
    },

    // 14. Centros de Custo
    {
        id: "centros-custo",
        title: "Centros de Custo",
        description: "Segmentação por departamentos ou projetos.",
        category: "cadastros",
        icon: Building2,
        content: [
            {
                type: "text",
                content: "Utilize **Centros de Custo** para separar despesas e receitas por filial, departamento (ex: Marketing, RH) ou projeto específico."
            }
        ]
    },

    // 15. Contas Bancárias
    {
        id: "contas-bancarias",
        title: "Contas Bancárias",
        description: "Cadastro de carteiras, bancos e caixas.",
        category: "cadastros",
        icon: Wallet,
        content: [
            {
                type: "text",
                content: "Cadastre todas as origens e destinos de dinheiro. Isso inclui contas correntes, poupança, caixinha físico e até cartões de crédito."
            },
            {
                type: "pro-tip",
                content: "Ao cadastrar um cartão de crédito, defina corretamente o dia de fechamento e vencimento para que as previsões de fluxo de caixa funcionem corretamente."
            }
        ]
    },

    // 16. Configurações
    {
        id: "configuracoes-gerais",
        title: "Configurações Gerais",
        description: "Dados da empresa e preferências de usuários.",
        category: "configuracoes",
        icon: Settings,
        content: [
            {
                type: "text",
                content: "Ajuste os parâmetros globais do sistema, convide novos usuários e gerencie permissões de acesso."
            }
        ]
    }
];
