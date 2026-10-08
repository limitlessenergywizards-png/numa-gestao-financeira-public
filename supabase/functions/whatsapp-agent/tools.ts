import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "buscar_saldo",
            description: "Busca o saldo atual total somando todas as contas bancárias da empresa.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "registrar_conta_pagar",
            description: "Registra uma nova conta a pagar (despesa) no sistema.",
            parameters: {
                type: "object",
                properties: {
                    description: { type: "string", description: "Descrição da conta" },
                    amount: { type: "number", description: "Valor em reais" },
                    due_date: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
                    supplier_id: { type: "string", description: "UUID do fornecedor" },
                    category_id: { type: "string", description: "UUID da categoria" },
                },
                required: ["description", "amount", "due_date"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "registrar_conta_receber",
            description: "Registra uma nova conta a receber (receita) no sistema.",
            parameters: {
                type: "object",
                properties: {
                    description: { type: "string", description: "Descrição da conta" },
                    amount: { type: "number", description: "Valor em reais" },
                    due_date: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
                    customer_id: { type: "string", description: "UUID do cliente" },
                    category_id: { type: "string", description: "UUID da categoria" },
                },
                required: ["description", "amount", "due_date"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "consultar_contas_pagar",
            description: "Consulta a lista de contas a pagar (pendentes e pagas). Use para fornecer resumos financeiros.",
            parameters: {
                type: "object",
                properties: {
                    start_date: { type: "string", description: "Data inicial (opcional - YYYY-MM-DD)" },
                    end_date: { type: "string", description: "Data final (opcional - YYYY-MM-DD)" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "consultar_contas_receber",
            description: "Consulta a lista de contas a receber (pendentes e recebidas). Use para fornecer resumos financeiros.",
            parameters: {
                type: "object",
                properties: {
                    start_date: { type: "string", description: "Data inicial (opcional - YYYY-MM-DD)" },
                    end_date: { type: "string", description: "Data final (opcional - YYYY-MM-DD)" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "buscar_fornecedor",
            description: "Busca fornecedores pelo nome.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string", description: "Nome ou parte do nome" }
                },
                required: ["nome"]
            },
        },
    },
    {
        type: "function",
        function: {
            name: "buscar_cliente",
            description: "Busca clientes pelo nome.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string", description: "Nome ou parte do nome" }
                },
                required: ["nome"]
            },
        },
    },
    {
        type: "function",
        function: {
            name: "criar_fornecedor",
            description: "Cria um novo fornecedor.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string", description: "Nome do fornecedor" },
                    email: { type: "string", description: "Email (opcional)" },
                    telefone: { type: "string", description: "Telefone (opcional)" }
                },
                required: ["nome"]
            },
        }
    },
    {
        type: "function",
        function: {
            name: "criar_cliente",
            description: "Cria um novo cliente.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string", description: "Nome do cliente" },
                    email: { type: "string", description: "Email (opcional)" },
                    telefone: { type: "string", description: "Telefone (opcional)" }
                },
                required: ["nome"]
            },
        }
    },
    {
        type: "function",
        function: {
            name: "buscar_categorias",
            description: "Busca categorias de despesas ou receitas.",
            parameters: {
                type: "object",
                properties: {
                    tipo: { type: "string", enum: ["receita", "despesa"], description: "Filtrar por tipo" }
                }
            },
        }
    },
    {
        type: "function",
        function: {
            name: "buscar_resumo_mensal",
            description: "Busca um resumo financeiro (receitas vs despesas) de um mês específico.",
            parameters: {
                type: "object",
                properties: {
                    mes: { type: "number", description: "Mês (1-12)" },
                    ano: { type: "number", description: "Ano" }
                },
                required: ["mes", "ano"]
            },
        }
    },
    {
        type: "function",
        function: {
            name: "registrar_transacao",
            description: "Registra uma movimentação financeira (entrada ou saída) que já ocorreu.",
            parameters: {
                type: "object",
                properties: {
                    description: { type: "string", description: "Descrição" },
                    amount: { type: "number", description: "Valor" },
                    type: { type: "string", enum: ["entrada", "saida"] },
                    date: { type: "string", description: "Data (YYYY-MM-DD)" },
                    category_id: { type: "string", description: "UUID da categoria" },
                    bank_account_id: { type: "string", description: "UUID da conta bancária" }
                },
                required: ["description", "amount", "type", "date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "buscar_empresas",
            description: "Busca a lista de empresas VINCULADAS AO NÚMERO DE TELEFONE DO USUÁRIO. Útil quando o usuário tem múltiplas empresas e precisa escolher uma.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "vincular_empresa",
            description: "Vincula o usuário do WhatsApp a uma empresa específica pelo UUID. Use isso APENAS QUANDO O USUÁRIO CONFIRMAR A EMPRESA.",
            parameters: {
                type: "object",
                properties: {
                    company_id: { type: "string", description: "UUID da empresa selecionada" }
                },
                required: ["company_id"]
            }
        }
    }
];

export async function executeTool(
    toolName: string,
    args: any,
    supabase: SupabaseClient,
    companyId?: string,
    leadId?: string,
    profileId?: string
) {
    switch (toolName) {
        case "buscar_empresas": {
            // Fetch the lead's phone number directly from the database
            const { data: currentLead } = await supabase
                .from("leads")
                .select("telefone")
                .eq("id", leadId)
                .single();

            if (!currentLead || !currentLead.telefone) {
                return [];
            }

            const rawPhone = currentLead.telefone;
            const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10); // get last 10 digits to match safely

            let companyIds: string[] = [];

            // 1. Try to find user profile by phone/whatsapp
            const { data: profiles } = await supabase
                .from("profiles")
                .select("user_id")
                .or(`whatsapp_number.ilike.%${phoneDigits}%,phone.ilike.%${phoneDigits}%`);

            if (profiles && profiles.length > 0) {
                const userIds = profiles.map((p: any) => p.user_id).filter((id: any) => id); // filter nulls
                if (userIds.length > 0) {
                    // 2. Find their user_companies
                    const { data: userCompanies } = await supabase
                        .from("user_companies")
                        .select("company_id")
                        .in("user_id", userIds);

                    if (userCompanies) {
                        companyIds.push(...userCompanies.map((uc: any) => uc.company_id));
                    }
                }
            }

            // 3. Fallback: Check 'leads' table in case it's a new ad lead without a platform account
            const { data: leads } = await supabase
                .from("leads")
                .select("company_id")
                .or(`telefone.ilike.%${phoneDigits}%`)
                .not("company_id", "is", null);

            if (leads) {
                companyIds.push(...leads.map((l: any) => l.company_id));
            }

            // Remove internal system duplicates
            companyIds = [...new Set(companyIds)];

            if (companyIds.length === 0) {
                return [];
            }

            const { data: companies, error: companiesError } = await supabase
                .from("companies")
                .select("id, name, document")
                .in("id", companyIds);

            if (companiesError) throw companiesError;
            return companies;
        }

        case "vincular_empresa": {
            const { data, error } = await supabase.from("leads").update({
                company_id: args.company_id
            }).eq("id", leadId).select("id, companies(name)").single();
            if (error) throw error;
            return { success: true, message: `Empresa vinculada com sucesso: ${data.companies?.name}` };
        }

        case "buscar_saldo": {
            const { data, error } = await supabase.rpc("get_total_bank_balance", { p_company_id: companyId });
            if (error) throw error;
            return { total_balance: data };
        }

        case "registrar_conta_pagar": {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(args.due_date)) {
                return { error: "Formato de data inválido. Use YYYY-MM-DD (ex: 2026-12-31)." };
            }
            const today = new Date().toISOString().split('T')[0];

            // 1. Insert into Payables
            const { data: payable, error: payableError } = await supabase.from("payables").insert({
                company_id: companyId,
                description: args.description,
                total_amount: args.amount,
                due_date: args.due_date,
                issue_date: today,
                supplier_id: args.supplier_id,
                category_id: args.category_id,
                status: 'pendente'
            }).select().single();
            if (payableError) throw payableError;

            // 2. Get a default bank account (required for transactions)
            const { data: bankAccount } = await supabase
                .from('bank_accounts')
                .select('id')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            // 3. Sync to Transactions (so it appears in Movimentações)
            if (bankAccount) {
                const { error: txError } = await supabase.from('transactions').insert({
                    company_id: companyId,
                    bank_account_id: bankAccount.id,
                    supplier_id: args.supplier_id,
                    category_id: args.category_id,
                    description: args.description,
                    amount: args.amount,
                    transaction_date: args.due_date,
                    type: 'saida',
                    nature: 'previsao',
                    forecast_basis: `payable:${payable.id}`
                });
                if (txError) console.error("[Agent] Error syncing payable to transactions:", txError.message);
            } else {
                console.warn("[Agent] No active bank account found for transaction sync.");
            }

            return payable;
        }

        case "registrar_conta_receber": {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(args.due_date)) {
                return { error: "Formato de data inválido. Use YYYY-MM-DD (ex: 2026-12-31)." };
            }
            const today = new Date().toISOString().split('T')[0];

            // 1. Insert into Receivables
            const { data: receivable, error: recError } = await supabase.from("receivables").insert({
                company_id: companyId,
                description: args.description,
                total_amount: args.amount,
                due_date: args.due_date,
                issue_date: today,
                customer_id: args.customer_id,
                category_id: args.category_id,
                status: 'pendente'
            }).select().single();
            if (recError) throw recError;

            // 2. Get a default bank account (required for transactions)
            const { data: bankAccount } = await supabase
                .from('bank_accounts')
                .select('id')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            // 3. Sync to Transactions (so it appears in Movimentações)
            if (bankAccount) {
                const { error: txError } = await supabase.from('transactions').insert({
                    company_id: companyId,
                    bank_account_id: bankAccount.id,
                    customer_id: args.customer_id,
                    category_id: args.category_id,
                    description: args.description,
                    amount: args.amount,
                    transaction_date: args.due_date,
                    type: 'entrada',
                    nature: 'previsao',
                    forecast_basis: `receivable:${receivable.id}`
                });
                if (txError) console.error("[Agent] Error syncing receivable to transactions:", txError.message);
            } else {
                console.warn("[Agent] No active bank account found for transaction sync.");
            }

            return receivable;
        }

        case "consultar_contas_pagar": {
            let query = supabase.from("payables").select("*, suppliers(name)").eq("company_id", companyId).neq("status", "cancelado");
            if (args.start_date) query = query.gte("due_date", args.start_date);
            if (args.end_date) query = query.lte("due_date", args.end_date);

            // Add safety limits for production (max 20 records, ordered by due date)
            const { data, error } = await query.order('due_date', { ascending: true }).limit(20);
            if (error) throw error;
            return data;
        }

        case "consultar_contas_receber": {
            let query = supabase.from("receivables").select("*, customers(name)").eq("company_id", companyId).neq("status", "cancelado");
            if (args.start_date) query = query.gte("due_date", args.start_date);
            if (args.end_date) query = query.lte("due_date", args.end_date);

            // Add safety limits for production (max 20 records, ordered by due date)
            const { data, error } = await query.order('due_date', { ascending: true }).limit(20);
            if (error) throw error;
            return data;
        }

        case "buscar_fornecedor": {
            const { data, error } = await supabase.from("suppliers")
                .select("*")
                .eq("company_id", companyId)
                .ilike("name", `%${args.nome}%`)
                .order('name', { ascending: true })
                .limit(10);
            if (error) throw error;
            return data;
        }

        case "buscar_cliente": {
            const { data, error } = await supabase.from("customers")
                .select("*")
                .eq("company_id", companyId)
                .ilike("name", `%${args.nome}%`)
                .order('name', { ascending: true })
                .limit(10);
            if (error) throw error;
            return data;
        }

        case "criar_fornecedor": {
            const supplierPayload: any = {
                company_id: companyId,
                name: args.nome,
                category: 'fornecedor', // Ensures visibility in CRM Fornecedores
                is_active: true
            };
            if (args.email) supplierPayload.email = args.email;
            if (args.telefone) supplierPayload.phone = args.telefone;

            const { data, error } = await supabase.from("suppliers").insert(supplierPayload).select().single();
            if (error) throw error;
            return data;
        }

        case "criar_cliente": {
            const customerPayload: any = {
                company_id: companyId,
                name: args.nome,
                is_active: true
            };
            if (args.email) customerPayload.email = args.email;
            if (args.telefone) customerPayload.phone = args.telefone;

            const { data, error } = await supabase.from("customers").insert(customerPayload).select().single();
            if (error) throw error;
            return data;
        }

        case "buscar_categorias": {
            let query = supabase.from("chart_of_accounts").select("*").eq("company_id", companyId);
            if (args.tipo) {
                query = query.eq("type", args.tipo === "receita" ? "receita" : "despesa");
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }

        case "buscar_resumo_mensal": {
            const startDate = new Date(args.ano, args.mes - 1, 1).toISOString();
            const endDate = new Date(args.ano, args.mes, 0).toISOString();

            const [payables, receivables] = await Promise.all([
                supabase.from("payables").select("amount, status").eq("company_id", companyId).gte("due_date", startDate).lte("due_date", endDate),
                supabase.from("receivables").select("amount, status").eq("company_id", companyId).gte("due_date", startDate).lte("due_date", endDate)
            ]);

            const totalPagar = (payables.data || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
            const totalReceber = (receivables.data || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
            const pago = (payables.data || []).filter((p: any) => p.status === 'pago').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
            const recebido = (receivables.data || []).filter((r: any) => r.status === 'recebido' || r.status === 'pago').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

            return {
                mes: args.mes,
                ano: args.ano,
                contas_a_pagar: { total: totalPagar, pago, pendente: totalPagar - pago },
                contas_a_receber: { total: totalReceber, recebido, pendente: totalReceber - recebido },
                saldo_projetado: (args.saldo_projetado !== undefined) ? args.saldo_projetado : totalReceber - totalPagar
            };
        }

        case "registrar_transacao": {
            const { data, error } = await supabase.from("transactions").insert({
                company_id: companyId,
                description: args.description,
                amount: args.amount,
                type: args.type === "entrada" ? "income" : "expense",
                date: args.date,
                category_id: args.category_id,
                bank_account_id: args.bank_account_id,
                status: 'completed'
            }).select().single();
            if (error) throw error;
            return data;
        }

        default:
            throw new Error(`Tool ${name} not implemented`);
    }
}
