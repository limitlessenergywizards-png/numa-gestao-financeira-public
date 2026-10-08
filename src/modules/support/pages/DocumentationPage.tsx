
import {
    BookOpen,
    CreditCard,
    BarChart3,
    Settings,
    Calendar,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Documentation() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Manual do Sistema"
                description="Guia completo para utilizar o Numa Gestão Financeira"
            />

            <Tabs defaultValue="start" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="start">Primeiros Passos</TabsTrigger>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="reports">Relatórios</TabsTrigger>
                </TabsList>

                {/* PRIMEIROS PASSOS */}
                <TabsContent value="start" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-brand" />
                                <CardTitle>Configuração Inicial</CardTitle>
                            </div>
                            <CardDescription>
                                O que você precisa configurar antes de começar a lançar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <h3 className="font-semibold mb-2 text-foreground">1. Cadastro da Empresa</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Certifique-se de que os dados da sua empresa estão corretos em <strong>Configurações</strong>. Isso é importante para os relatórios oficiais.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <h3 className="font-semibold mb-2 text-foreground">2. Contas Bancárias</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Cadastre suas contas correntes, caixinhas e cartões em <strong>Cadastros / Contas Bancárias</strong>. O saldo inicial deve bater com o extrato real.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg bg-card/50">
                                    <h3 className="font-semibold mb-2 text-foreground">3. Plano de Contas</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Revise as categorias de receitas e despesas em <strong>Cadastros / Plano de Contas</strong> para organizar seus lançamentos corretamente.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TRANSAÇÕES */}
                <TabsContent value="transactions" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-brand" />
                                <CardTitle>Lançando Movimentações</CardTitle>
                            </div>
                            <CardDescription>
                                Aprenda a registrar suas receitas e despesas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* RECORRÊNCIA */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Recorrência
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Ao criar uma transação, você pode definir se ela se repete automaticamente. Isso é útil para aluguéis, assinaturas e parcelamentos fixos.
                                </p>
                                <div className="grid sm:grid-cols-4 gap-2">
                                    {['Diária', 'Semanal', 'Mensal', 'Anual'].map((freq) => (
                                        <div key={freq} className="bg-secondary/50 p-2 rounded text-center text-sm font-medium">
                                            {freq}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4"></div>

                            {/* PREVISÃO VS REAL */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Status: Previsto vs Realizado
                                </h3>
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Importante</AlertTitle>
                                    <AlertDescription>
                                        O saldo das suas contas bancárias só é alterado por transações com status <strong>Realizado</strong>.
                                    </AlertDescription>
                                </Alert>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="border p-4 rounded-lg border-yellow-500/20 bg-yellow-500/5">
                                        <span className="text-yellow-600 font-bold block mb-1">Status: Previsto (Pending)</span>
                                        <p className="text-sm text-muted-foreground">
                                            Use para lançamentos futuros que ainda não aconteceram. Eles aparecem no fluxo de caixa mas <strong>não descontam do saldo atual</strong>.
                                        </p>
                                    </div>
                                    <div className="border p-4 rounded-lg border-green-500/20 bg-green-500/5">
                                        <span className="text-green-600 font-bold block mb-1">Status: Realizado (Completed)</span>
                                        <p className="text-sm text-muted-foreground">
                                            Use quando o dinheiro efetivamente entrar ou sair da conta. O saldo será atualizado imediatamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

                {/* RELATÓRIOS */}
                <TabsContent value="reports" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-brand" />
                                <CardTitle>Entendendo os Relatórios</CardTitle>
                            </div>
                            <CardDescription>
                                Como analisar a saúde financeira da sua empresa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="flex gap-4 items-start p-4 border rounded-lg">
                                    <div className="bg-blue-500/10 p-2 rounded">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Fluxo de Caixa</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Mostra as entradas e saídas dia a dia. Ideal para ver se vai faltar dinheiro no final do mês. Considera tanto o realizado quanto o previsto.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start p-4 border rounded-lg">
                                    <div className="bg-purple-500/10 p-2 rounded">
                                        <BookOpen className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">DRE (Demonstrativo de Resultado)</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Mostra se sua empresa teve <strong>lucro ou prejuízo</strong> competência por competência (independente de quando foi pago).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
