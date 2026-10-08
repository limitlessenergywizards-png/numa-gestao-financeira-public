'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, ArrowUpRight } from "lucide-react";

interface UsageItem {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

interface PlanUsageCardProps {
  planName: string;
  planPrice: string;
  billingCycle: string;
  usage: UsageItem[];
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export function PlanUsageCard({
  planName,
  planPrice,
  billingCycle,
  usage,
  isPremium = false,
  onUpgrade,
}: PlanUsageCardProps) {
  return (
    <Card className={isPremium ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <Crown className="h-5 w-5 text-primary" />
            ) : (
              <Zap className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">{planName}</CardTitle>
              <CardDescription>
                {planPrice}/{billingCycle}
              </CardDescription>
            </div>
          </div>
          {isPremium && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Uso neste mês</p>
          {usage.map((item, index) => {
            const percentage = Math.min((item.current / item.max) * 100, 100);
            const isNearLimit = percentage >= 80;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className={isNearLimit ? "text-warning font-medium" : "text-muted-foreground"}>
                    {item.current.toLocaleString()}/{item.max.toLocaleString()} {item.unit || ""}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isNearLimit ? "[&>div]:bg-warning" : ""}`}
                />
              </div>
            );
          })}
        </div>

        {!isPremium && onUpgrade && (
          <Button className="w-full" onClick={onUpgrade}>
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
