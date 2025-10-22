import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Briefcase, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
}

export default function Users() {
  const navigate = useNavigate();
  const [professors, setProfessors] = useState<UserProfile[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Buscar o perfil do usuário atual
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (currentProfile) {
        setCurrentUserRole(currentProfile.role);
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
    const normalizedSearch = search.toLowerCase();
    const normalizedRole = roleFilter === "all" ? null : roleFilter;

    setFilteredProfessors(
      professors.filter((prof) => {
        const matchesSearch = normalizedSearch
          ? prof.full_name.toLowerCase().includes(normalizedSearch) ||
            prof.email.toLowerCase().includes(normalizedSearch) ||
            (prof.department && prof.department.toLowerCase().includes(normalizedSearch))
          : true;

        const matchesRole = normalizedRole ? prof.role === normalizedRole : true;

        return matchesSearch && matchesRole;
      })
    );
  }, [search, roleFilter, professors]);

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

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingId(userId);
    try {
      // Verificar se o usuário não está tentando excluir a si mesmo
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id === userId) {
        toast.error("Você não pode excluir seu próprio acesso!");
        setDeletingId(null);
        return;
      }

      // Excluir o perfil do usuário
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Atualizar a lista de professores
      setProfessors(professors.filter((p) => p.id !== userId));
      setFilteredProfessors(filteredProfessors.filter((p) => p.id !== userId));
      
      toast.success(`Acesso de ${userName} removido com sucesso!`);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao remover acesso. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Visualize todos os usuários do sistema</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
            <span className="text-sm text-muted-foreground md:text-right">
              {filteredProfessors.length} usuário{filteredProfessors.length === 1 ? "" : "s"} encontrado{filteredProfessors.length === 1 ? "" : "s"}
            </span>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filtrar por tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="coordenador">Coordenador</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(prof.role)}>
                        {getRoleLabel(prof.role)}
                      </Badge>
                      {currentUserRole === "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === prof.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o acesso de{" "}
                                <strong>{prof.full_name}</strong>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(prof.id, prof.full_name)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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
