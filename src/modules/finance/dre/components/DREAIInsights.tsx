import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Target,
  Brain,
  Shield,
} from "lucide-react";
import { DREAIAnalysis, AIAlert, AIRecommendation } from "../hooks/useDREAIInsights";

interface DREAIInsightsProps {
  analysis: DREAIAnalysis | null;
  isLoading: boolean;
}

// Strategic color mapping for priorities
const PRIORITY_CONFIG = {
  high: {
    gradient: "from-rose-500 to-pink-600",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-500/30",
    Icon: AlertTriangle,
    label: "Alta",
  },
  medium: {
    gradient: "from-amber-500 to-orange-500",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
    Icon: Lightbulb,
    label: "Média",
  },
  low: {
    gradient: "from-teal-500 to-cyan-500",
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-600 dark:text-teal-400",
    borderClass: "border-teal-500/30",
    Icon: CheckCircle2,
    label: "Baixa",
  },
};

export function DREAIInsights({ analysis, isLoading }: DREAIInsightsProps) {
  if (isLoading) {
    return <DREAIInsightsSkeleton />;
  }

  if (!analysis) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-violet-500/50" />
          </div>
          <p className="text-center">
            Análise de IA indisponível.
            <br />
            <span className="text-sm">Verifique se há dados suficientes para análise.</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Main Insight Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 text-white shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-1/4 top-1/2 h-16 w-16 rounded-full bg-white/5" />
        </div>
        <CardHeader className="relative pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <div className="p-2 rounded-lg bg-white/20">
              <Brain className="h-5 w-5" />
            </div>
            Análise Inteligente
            <Sparkles className="h-4 w-4 text-amber-300" />
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p
            className="text-base leading-relaxed text-white/90 animate-fade-in"
            style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
          >
            {analysis.insight}
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      {analysis.alerts.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas
          </h3>
          <div className="space-y-2">
            {analysis.alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Recomendações
          </h3>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AlertCardProps {
  alert: AIAlert;
  index: number;
}

function AlertCard({ alert, index }: AlertCardProps) {
  const isDanger = alert.type === "danger";

  return (
    <div
      className={`
        relative flex items-start gap-3 p-3 rounded-lg border overflow-hidden animate-fade-in
        ${isDanger
          ? "bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/20"
          : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20"
        }
      `}
      style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: 'backwards' }}
    >
      {/* Priority indicator strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDanger ? 'bg-rose-500' : 'bg-amber-500'}`} />

      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDanger ? 'bg-rose-500/20' : 'bg-amber-500/20'
        }`}>
        {isDanger ? (
          <AlertCircle className="h-4 w-4 text-rose-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
      </div>
      <p className={`text-sm ${isDanger ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
        {alert.message}
      </p>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  index: number;
}

function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const config = PRIORITY_CONFIG[recommendation.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  const IconComponent = config.Icon;

  return (
    <div
      className={`relative group p-4 rounded-lg border ${config.borderClass} bg-card hover:shadow-md transition-[transform,box-shadow] cursor-pointer overflow-hidden animate-fade-in`}
      style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: 'backwards' }}
    >
      {/* Priority indicator strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />

      <div className="flex items-start gap-3 pl-2">
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgClass}`}>
          <IconComponent className={`h-4 w-4 ${config.textClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{recommendation.title}</h4>
            <Badge
              variant="outline"
              className={`text-[10px] ${config.bgClass} ${config.textClass} border-0`}
            >
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {recommendation.description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  );
}



function DREAIInsightsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-violet-500/20 to-purple-500/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48 bg-white/20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full bg-white/20 mb-2" />
          <Skeleton className="h-4 w-3/4 bg-white/20" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
