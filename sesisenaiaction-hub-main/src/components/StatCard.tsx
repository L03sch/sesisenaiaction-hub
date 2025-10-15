import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  variant?: "default" | "primary" | "secondary";
}

export function StatCard({ title, value, icon: Icon, loading, variant = "default" }: StatCardProps) {
  const bgClass = {
    default: "bg-muted",
    primary: "bg-gradient-primary",
    secondary: "bg-gradient-secondary",
  }[variant];

  const textClass = variant !== "default" ? "text-white" : "text-primary";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", bgClass)}>
            <Icon className={cn("w-6 h-6", textClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
