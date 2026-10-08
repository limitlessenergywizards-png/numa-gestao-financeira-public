'use client';

import {
  Users, 
  Calendar,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import type { AdminUser } from "@/modules/admin/hooks/useAdminData";

interface CohortAnalysisProps {
  users: AdminUser[];
  isLoading?: boolean;
}

interface CohortRow {
  cohort: string;
  cohortDate: Date;
  size: number;
  retention: number[];
}

export function CohortAnalysis({ users, isLoading }: CohortAnalysisProps) {
  const cohortData = useMemo(() => {
    const now = new Date();
    const cohorts: CohortRow[] = [];
    
    // Group users by registration month (last 6 months)
    for (let i = 5; i >= 0; i--) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEndDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const cohortLabel = cohortDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      // Users who joined in this cohort month
      const cohortUsers = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= cohortDate && createdAt <= cohortEndDate;
      });
      
      const cohortSize = cohortUsers.length;
      if (cohortSize === 0) {
        cohorts.push({
          cohort: cohortLabel,
          cohortDate,
          size: 0,
          retention: Array(6 - i).fill(0),
        });
        continue;
      }
      
      // Calculate retention for each month after cohort
      const retention: number[] = [];
      for (let month = 0; month <= 5 - i; month++) {
        const checkDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + month, 1);
        const checkEndDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + month + 1, 0);
        
        const activeInMonth = cohortUsers.filter(u => {
          if (!u.last_activity_date) return false;
          const activityDate = new Date(u.last_activity_date);
          return activityDate >= checkDate && activityDate <= checkEndDate;
        }).length;
        
        // For month 0, assume 100% (they just signed up)
        if (month === 0) {
          retention.push(100);
        } else {
          retention.push(Math.round((activeInMonth / cohortSize) * 100));
        }
      }
      
      cohorts.push({
        cohort: cohortLabel,
        cohortDate,
        size: cohortSize,
        retention,
      });
    }
    
    return cohorts;
  }, [users]);

  // Calculate average retention by month
  const averageRetention = useMemo(() => {
    const months = 6;
    const averages: number[] = [];
    
    for (let month = 0; month < months; month++) {
      const retentionValues = cohortData
        .filter(c => c.retention[month] !== undefined && c.size > 0)
        .map(c => c.retention[month]);
      
      if (retentionValues.length > 0) {
        averages.push(Math.round(retentionValues.reduce((a, b) => a + b, 0) / retentionValues.length));
      } else {
        averages.push(0);
      }
    }
    
    return averages;
  }, [cohortData]);

  const getRetentionColor = (value: number) => {
    if (value >= 80) return 'bg-emerald-500/30 text-emerald-400';
    if (value >= 60) return 'bg-emerald-500/20 text-emerald-400';
    if (value >= 40) return 'bg-amber-500/20 text-amber-400';
    if (value >= 20) return 'bg-amber-500/10 text-amber-400';
    if (value > 0) return 'bg-red-500/10 text-red-400';
    return 'bg-muted/30 text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-96" />
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            Análise de Cohort
          </CardTitle>
          <CardDescription>
            Retenção de usuários por mês de cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Cohort
                    </div>
                  </th>
                  <th className="text-center p-2 font-medium text-muted-foreground">
                    Tamanho
                  </th>
                  {[0, 1, 2, 3, 4, 5].map(month => (
                    <th key={month} className="text-center p-2 font-medium text-muted-foreground min-w-[60px]">
                      Mês {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row, rowIndex) => (
                  <tr
                    key={row.cohort}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2 font-medium">{row.cohort}</td>
                    <td className="text-center p-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {row.size}
                      </span>
                    </td>
                    {[0, 1, 2, 3, 4, 5].map(month => {
                      const value = row.retention[month];
                      const hasValue = value !== undefined && row.size > 0;
                      
                      return (
                        <td key={month} className="text-center p-2">
                          {hasValue ? (
                            <span className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getRetentionColor(value)}`}>
                              {value}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-12 h-8 rounded text-sm text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Average row */}
                <tr className="bg-muted/50 font-medium">
                  <td className="p-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-brand" />
                    Média
                  </td>
                  <td className="text-center p-2">—</td>
                  {averageRetention.map((value, index) => (
                    <td key={index} className="text-center p-2">
                      <span className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold ${getRetentionColor(value)}`}>
                        {value}%
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">Legenda:</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-emerald-500/30"></span>
              <span>≥80%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-emerald-500/20"></span>
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-amber-500/20"></span>
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-amber-500/10"></span>
              <span>20-39%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-red-500/10"></span>
              <span>&lt;20%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
