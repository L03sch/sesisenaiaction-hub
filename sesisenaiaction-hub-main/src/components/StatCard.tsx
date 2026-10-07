import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  variant?: "default" | "primary" | "secondary";
}

export function StatCard({ title, value, icon: Icon, loading }: StatCardProps) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        {loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-semibold tabular-nums text-primary">{value}</p>}
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
