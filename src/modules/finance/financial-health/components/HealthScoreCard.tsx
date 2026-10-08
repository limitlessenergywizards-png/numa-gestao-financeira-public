import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, Trophy } from "lucide-react";

interface HealthScoreCardProps {
    score: number;
    status: string;
    metrics: {
        profitScore: number; // 0-40
        safetyScore: number; // 0-30
        contributionScore: number; // 0-30
    }
}

export function HealthScoreCard({ score, status, metrics }: HealthScoreCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excelente': return 'bg-green-600';
            case 'saudavel': return 'bg-emerald-500';
            case 'estavel': return 'bg-blue-500';
            case 'atencao': return 'bg-yellow-500';
            case 'critico': return 'bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excelente': return <Trophy className="h-6 w-6 text-white" />;
            case 'saudavel': return <CheckCircle className="h-6 w-6 text-white" />;
            case 'estavel': return <Activity className="h-6 w-6 text-white" />;
            case 'atencao': return <AlertTriangle className="h-6 w-6 text-white" />;
            case 'critico': return <AlertTriangle className="h-6 w-6 text-white" />;
            default: return <Activity className="h-6 w-6 text-white" />;
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className={`${getStatusColor(status)} text-white pb-8`}>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">Score de Saúde</CardTitle>
                        <p className="text-white/80 text-sm mt-1">Diagnóstico financeiro geral</p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 capitalize">
                        {status}
                    </Badge>
                </div>

                <div className="flex items-center gap-4 mt-6">
                    <div className="relative h-24 w-24 flex items-center justify-center bg-white/20 rounded-full border-4 border-white/30 shadow-inner">
                        <span className="text-3xl font-bold">{score}</span>
                        {/* Optionally add a circular progress here */}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-lg leading-tight mb-1">
                            {score >= 80 ? "Excelente performance!" :
                                score >= 60 ? "Empresa saudável" :
                                    score >= 40 ? "Operação estável" :
                                        "Atenção necessária"}
                        </p>
                        <p className="text-sm text-white/80">
                            {score >= 60 ? "Continue assim para manter o crescimento." : "Siga as recomendações para melhorar sua saúde financeira."}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Lucratividade</span>
                        <span className="font-medium">{metrics.profitScore}/40</span>
                    </div>
                    <Progress value={(metrics.profitScore / 40) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Margem de Segurança</span>
                        <span className="font-medium">{metrics.safetyScore}/30</span>
                    </div>
                    <Progress value={(metrics.safetyScore / 30) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Margem de Contribuição</span>
                        <span className="font-medium">{metrics.contributionScore}/30</span>
                    </div>
                    <Progress value={(metrics.contributionScore / 30) * 100} className="h-2" />
                </div>
            </CardContent>
        </Card>
    );
}
