import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_absolute_admin: boolean;
  department: string | null;
}

async function getFunctionErrorMessage(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => null);
    if (payload && typeof payload.error === "string") return payload.error;
  }

  return error instanceof Error ? error.message : "Ocorreu um erro inesperado";
}

export default function Users() {
  const navigate = useNavigate();
  const [professors, setProfessors] = useState<UserProfile[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    role: "professor",
    department: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      const { data: callerProfile, error: roleError } = await supabase
        .from("profiles").select("role,is_absolute_admin").eq("id", session.user.id).single();
      if (roleError || !callerProfile || !["admin", "coordenador"].includes(callerProfile.role)) {
        navigate("/dashboard");
        return;
      }
      setIsAdmin(callerProfile.role === "admin" && callerProfile.is_absolute_admin);

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
    if (!isAdmin) {
      toast.error("Apenas o Admin absoluto pode excluir usuários");
      return;
    }

    setDeletingId(userId);
    try {
      // Verificar se o usuário não está tentando excluir a si mesmo
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id === userId) {
        toast.error("Você não pode excluir seu próprio acesso!");
        setDeletingId(null);
        return;
      }

      // A Edge Function usa a API administrativa do Supabase Auth no servidor.
      const { error } = await supabase.functions.invoke("delete-user-completely", {
        body: { user_id: userId },
      });

      if (error) {
        throw error;
      }

      // Atualizar a lista de professores
      setProfessors(professors.filter((p) => p.id !== userId));
      setFilteredProfessors(filteredProfessors.filter((p) => p.id !== userId));
      
      toast.success(`Usuário ${userName} excluído permanentemente do sistema!`);
    } catch (error: unknown) {
      console.error("Erro capturado:", error);
      toast.error(await getFunctionErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUser.fullName || !newUser.email) {
      toast.error("Preencha nome e email");
      return;
    }

    setCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("invite-user-account", {
        body: {
          user_email: newUser.email,
          user_full_name: newUser.fullName,
          user_role: newUser.role,
          user_department: newUser.department || null,
        },
      });

      if (error) throw error;

      if (result?.warning) toast.warning(result.warning);
      else toast.success("Convite enviado por email");
      setNewUser({ fullName: "", email: "", role: "professor", department: "" });
      const { data } = await supabase.from("profiles").select("*").order("full_name");
      if (data) setProfessors(data);
    } catch (error: unknown) {
      console.error("Erro ao cadastrar usuário:", error);
      toast.error(await getFunctionErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">Visualize todos os usuários do sistema</p>
          </div>
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Convidar usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar usuário</DialogTitle>
                  <DialogDescription>Envie um convite para professor ou coordenador. A pessoa define sua própria senha.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-user-name">Nome completo</Label>
                    <Input id="new-user-name" value={newUser.fullName} onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })} disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">Email</Label>
                    <Input id="new-user-email" type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-role">Função</Label>
                    <Select value={newUser.role} onValueChange={(role) => setNewUser({ ...newUser, role })} disabled={creating}>
                      <SelectTrigger id="new-user-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="coordenador">Coordenador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-department">Departamento (opcional)</Label>
                    <Input id="new-user-department" value={newUser.department} onChange={(event) => setNewUser({ ...newUser, department: event.target.value })} disabled={creating} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>{creating ? "Enviando..." : "Enviar convite"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
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
              <Card key={prof.id} className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                        {prof.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(prof.role)}>
                        {prof.is_absolute_admin ? "Admin absoluto" : getRoleLabel(prof.role)}
                      </Badge>
                      {isAdmin && prof.id !== currentUserId && prof.role !== "admin" && (
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
                                Contas que criaram planos não podem ser excluídas, para preservar os registros.
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
