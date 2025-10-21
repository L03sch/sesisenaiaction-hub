import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import { format } from "date-fns";

interface Professor {
  id: string;
  full_name: string;
  department: string | null;
}

export default function PlanForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [professorSearch, setProfessorSearch] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objective: "",
    start_date: "",
    end_date: "",
    status: "planning",
    priority: "medium",
  });

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

      if (!profile || !["admin", "coordenador"].includes(profile.role)) {
        toast.error("Sem permissão para esta ação");
        navigate("/dashboard");
        return;
      }
    };

    const fetchProfessors = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, department")
        .order("full_name");
      
      if (data) {
        setProfessors(data);
        setFilteredProfessors(data);
      }
    };

    const fetchPlan = async () => {
      if (!isEditing) return;

      const { data: plan } = await supabase
        .from("action_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (plan) {
        setFormData({
          title: plan.title,
          description: plan.description,
          objective: plan.objective,
          start_date: plan.start_date,
          end_date: plan.end_date,
          status: plan.status,
          priority: plan.priority,
        });
      }

      const { data: assignments } = await supabase
        .from("plan_assignments")
        .select("professor_id")
        .eq("plan_id", id);

      if (assignments) {
        setSelectedProfessors(assignments.map((a) => a.professor_id));
      }
    };

    checkAuth();
    fetchProfessors();
    fetchPlan();
  }, [navigate, id, isEditing]);

  // Effect para filtrar professores baseado na busca
  useEffect(() => {
    if (professorSearch.trim() === "") {
      setFilteredProfessors(professors);
    } else {
      const filtered = professors.filter((prof) => {
        const searchTerm = professorSearch.toLowerCase();
        const fullName = prof.full_name.toLowerCase();
        const department = prof.department?.toLowerCase() || "";
        
        // Verifica se alguma palavra do nome ou sobrenome começa com o termo de busca
        const nameWords = fullName.split(" ");
        const startsWithSearch = nameWords.some(word => word.startsWith(searchTerm));
        
        return startsWithSearch || 
               fullName.includes(searchTerm) || 
               department.includes(searchTerm);
      });
      setFilteredProfessors(filtered);
    }
  }, [professorSearch, professors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.objective || 
        !formData.start_date || !formData.end_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      let planId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("action_plans")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { data: newPlan, error } = await supabase
          .from("action_plans")
          .insert({
            ...formData,
            created_by: session.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        planId = newPlan.id;
      }

      // Update professor assignments
      await supabase.from("plan_assignments").delete().eq("plan_id", planId);
      
      if (selectedProfessors.length > 0) {
        const assignments = selectedProfessors.map((profId) => ({
          plan_id: planId,
          professor_id: profId,
        }));

        await supabase.from("plan_assignments").insert(assignments);
      }

      toast.success(isEditing ? "Plano atualizado!" : "Plano criado!");
      navigate(`/plans/${planId}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  };

  const toggleProfessor = (profId: string) => {
    setSelectedProfessors((prev) =>
      prev.includes(profId) ? prev.filter((id) => id !== profId) : [...prev, profId]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/plans")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Plano" : "Novo Plano de Ação"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do plano" : "Crie um novo plano de ação"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Melhoria do processo de avaliação"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o plano de ação..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo *</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Qual o objetivo deste plano?"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professores Participantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar professores por nome ou departamento..."
                  value={professorSearch}
                  onChange={(e) => setProfessorSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProfessors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {professorSearch ? "Nenhum professor encontrado" : "Nenhum professor disponível"}
                  </div>
                ) : (
                  filteredProfessors.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => toggleProfessor(prof.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedProfessors.includes(prof.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{prof.full_name}</div>
                          {prof.department && (
                            <div className="text-sm text-muted-foreground">{prof.department}</div>
                          )}
                        </div>
                        {selectedProfessors.includes(prof.id) && (
                          <Badge variant="secondary" className="ml-2">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {selectedProfessors.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedProfessors.length} professor(es) selecionado(s)
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/plans")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Atualizar" : "Criar"} Plano
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
