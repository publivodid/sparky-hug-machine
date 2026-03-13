import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  previous?: number;
  current?: number;
  className?: string;
}

export function MetricCard({ icon, label, value, previous, current, className }: MetricCardProps) {
  let trend: 'up' | 'down' | 'same' = 'same';
  let pct = 0;

  if (previous !== undefined && current !== undefined && previous > 0) {
    pct = Math.round(((current - previous) / previous) * 100);
    trend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same';
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          {previous !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trend === 'up' && "bg-accent text-accent-foreground",
              trend === 'down' && "bg-destructive/10 text-destructive",
              trend === 'same' && "bg-muted text-muted-foreground"
            )}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'same' && <Minus className="h-3 w-3" />}
              {Math.abs(pct)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
