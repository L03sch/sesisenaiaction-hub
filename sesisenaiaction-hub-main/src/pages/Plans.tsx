import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Plan {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
}

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile) setUserRole(profile.role);

      const { data } = await supabase
        .from("action_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setPlans(data);
        setFilteredPlans(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (search) {
      setFilteredPlans(
        plans.filter((plan) =>
          plan.title.toLowerCase().includes(search.toLowerCase()) ||
          plan.description.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredPlans(plans);
    }
  }, [search, plans]);

  const canCreatePlan = ["admin", "coordenador"].includes(userRole);

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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planos de Ação</h1>
            <p className="text-muted-foreground">Gerencie todos os planos de ação</p>
          </div>
          {canCreatePlan && (
            <Button onClick={() => navigate("/plans/new")} size="lg" className="shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Novo Plano
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white w-4 h-4" />
          <Input
            placeholder="Buscar planos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {search ? "Nenhum plano encontrado" : "Nenhum plano cadastrado ainda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <Card
                key={plan.id}
                className="group hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/plans/${plan.id}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`${getStatusColor(plan.status)} ${plan.status === 'in_progress' ? 'text-white' : ''}`}>
                      {getStatusLabel(plan.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getPriorityLabel(plan.priority)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 dark:text-white" />
                    <span>
                      {format(new Date(plan.start_date), "dd MMM", { locale: ptBR })} -{" "}
                      {format(new Date(plan.end_date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <Button variant="ghost" className="w-full" size="sm">
                    <Eye className="mr-2 w-4 h-4" />
                    Ver detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
