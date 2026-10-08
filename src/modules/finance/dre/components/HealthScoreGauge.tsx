import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface HealthScoreGaugeProps {
    score: number;
    size?: "sm" | "md" | "lg";
}

export function HealthScoreGauge({ score, size = "lg" }: HealthScoreGaugeProps) {
    const getScoreConfig = (score: number) => {
        if (score >= 80) return { label: "Excelente", gradient: "from-emerald-500 to-green-600", textColor: "text-emerald-400" };
        if (score >= 60) return { label: "Bom", gradient: "from-teal-500 to-cyan-600", textColor: "text-teal-400" };
        if (score >= 40) return { label: "Regular", gradient: "from-amber-500 to-orange-500", textColor: "text-amber-400" };
        return { label: "Crítico", gradient: "from-rose-500 to-pink-600", textColor: "text-rose-400" };
    };

    const config = getScoreConfig(score);

    const sizeClasses = {
        sm: "w-24 h-24",
        md: "w-32 h-32",
        lg: "w-40 h-40",
    };

    const fontSize = {
        sm: "text-2xl",
        md: "text-3xl",
        lg: "text-4xl",
    };

    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Score de Saúde
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className={`relative ${sizeClasses[size]} mb-4`}>
                    {/* Gradient background circle */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} p-1 shadow-lg`}>
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                            <div className="text-center">
                                <span
                                    className={`${fontSize[size]} font-bold ${config.textColor} animate-fade-in`}
                                    style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}
                                >
                                    {score}
                                </span>
                                <p className="text-xs text-muted-foreground">/100</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
                    {config.label}
                </Badge>

                <p className="text-xs text-muted-foreground mt-3 max-w-[200px] text-center">
                    Baseado em margens, tendências e indicadores financeiros
                </p>
            </CardContent>
        </Card>
    );
}
