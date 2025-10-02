import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Professor {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
}

export default function Professors() {
  const navigate = useNavigate();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (data) {
        setProfessors(data);
        setFilteredProfessors(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (search) {
      setFilteredProfessors(
        professors.filter((prof) =>
          prof.full_name.toLowerCase().includes(search.toLowerCase()) ||
          prof.email.toLowerCase().includes(search.toLowerCase()) ||
          (prof.department && prof.department.toLowerCase().includes(search.toLowerCase()))
        )
      );
    } else {
      setFilteredProfessors(professors);
    }
  }, [search, professors]);

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "Administrador",
      coordenador: "Coordenador",
      professor: "Professor",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-destructive",
      coordenador: "bg-primary",
      professor: "bg-secondary",
    };
    return colors[role as keyof typeof colors] || "bg-muted";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professores</h1>
          <p className="text-muted-foreground">Visualize todos os usuários do sistema</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, email ou departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredProfessors.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {search ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfessors.map((prof) => (
              <Card key={prof.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                        {prof.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={getRoleColor(prof.role)}>
                      {getRoleLabel(prof.role)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{prof.full_name}</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </div>

                    {prof.department && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{prof.department}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
