'use client';

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Scale, Lock } from "lucide-react";

export default function LegalPage() {
    const params = useParams();
    const type = params.type as string | undefined;
    const router = useRouter();

    const getContent = () => {
        switch (type) {
            case "termos":
                return {
                    title: "Termos de Uso",
                    icon: <Scale className="w-12 h-12 text-brand" />,
                    description: "Regras e condições para utilização dos nossos serviços.",
                    content: "O conteúdo dos Termos de Uso está sendo atualizado pelo nosso departamento jurídico. Em breve estará disponível aqui na íntegra."
                };
            case "privacidade":
                return {
                    title: "Política de Privacidade",
                    icon: <Lock className="w-12 h-12 text-brand" />,
                    description: "Como coletamos, usamos e protegemos seus dados.",
                    content: "A sua privacidade é nossa prioridade. Estamos revisando nossa política para garantir total transparência e conformidade com as melhores práticas de segurança."
                };
            case "lgpd":
                return {
                    title: "LGPD",
                    icon: <ShieldCheck className="w-12 h-12 text-brand" />,
                    description: "Nossa conformidade com a Lei Geral de Proteção de Dados.",
                    content: "A Numa Gestão Financeira está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei nº 13.709/2018."
                };
            default:
                return {
                    title: "Documento Legal",
                    icon: <Scale className="w-12 h-12 text-brand" />,
                    description: "Informações legais importantes.",
                    content: "Conteúdo em atualização."
                };
        }
    };

    const { title, icon, description, content } = getContent();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header Info */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Central Legal</h1>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
                <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 ring-1 ring-brand/20">
                            {icon}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
                            {title}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <div className="p-6 bg-muted/30 rounded-xl border border-dashed border-border">
                            <p className="text-muted-foreground italic mb-0">
                                {content}
                            </p>
                        </div>

                        <h3 className="mt-8 text-xl font-semibold">Última atualização</h3>
                        <p className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 bg-muted/20">
                &copy; {new Date().getFullYear()} Numa Gestão Financeira. Todos os direitos reservados.
            </footer>
        </div>
    );
}
