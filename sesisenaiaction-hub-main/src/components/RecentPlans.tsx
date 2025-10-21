import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Plan {
  id: string;
  title: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
}

export function RecentPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("action_plans")
        .select("id, title, status, priority, start_date, end_date")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) setPlans(data);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-muted",
      in_progress: "bg-primary",
      completed: "bg-secondary",
      cancelled: "bg-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-muted";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planning: "Planejamento",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Planos Recentes</CardTitle>
        <Button variant="ghost" onClick={() => navigate("/plans")}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum plano cadastrado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium">{plan.title}</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className={`${getStatusColor(plan.status)} ${plan.status === 'in_progress' ? 'text-white' : ''}`}>
                      {getStatusLabel(plan.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getPriorityLabel(plan.priority)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
