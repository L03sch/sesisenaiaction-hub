import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Users, CheckCircle2, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { RecentPlans } from "@/components/RecentPlans";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0,
    totalProfessors: 0,
  });
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
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

      const [plans, activePlans, completedPlans, professors] = await Promise.all([
        supabase.from("action_plans").select("id", { count: "exact", head: true }),
        supabase.from("action_plans").select("id", { count: "exact", head: true }).in("status", ["planning", "in_progress"]),
        supabase.from("action_plans").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalPlans: plans.count || 0,
        activePlans: activePlans.count || 0,
        completedPlans: completedPlans.count || 0,
        totalProfessors: professors.count || 0,
      });

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const canCreatePlan = ["admin", "coordenador"].includes(userRole);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral dos planos de ação</p>
          </div>
          {canCreatePlan && (
            <Button onClick={() => navigate("/plans/new")} size="lg" className="shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Novo Plano
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Planos"
            value={stats.totalPlans}
            icon={ClipboardList}
            loading={loading}
          />
          <StatCard
            title="Planos Ativos"
            value={stats.activePlans}
            icon={Clock}
            loading={loading}
            variant="primary"
          />
          <StatCard
            title="Concluídos"
            value={stats.completedPlans}
            icon={CheckCircle2}
            loading={loading}
            variant="secondary"
          />
          <StatCard
            title="Professores"
            value={stats.totalProfessors}
            icon={Users}
            loading={loading}
          />
        </div>

        <RecentPlans />
      </div>
    </DashboardLayout>
  );
}
