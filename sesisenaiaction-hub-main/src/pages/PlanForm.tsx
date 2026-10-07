import { useEffect, useState, useMemo } from "react";
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

import { useDepartments } from "@/hooks/use-departments";

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
  const departments = useDepartments();
  const [canChooseDepartment, setCanChooseDepartment] = useState(false);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [professorSearch, setProfessorSearch] = useState("");
  
  const [formData, setFormData] = useState({
    department: "",
    title: "",
    description: "",
    objective: "",
    expected_result: "",
    where_location: "",
    how_to_execute: "",
    estimated_cost: "0",
    start_date: "",
    end_date: "",
    status: "planning",
    priority: "medium",
    category: null as string | null,
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
        .select("role, department, is_absolute_admin")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setCanChooseDepartment(profile.role === "admin");
        if (!isEditing) setFormData((current) => ({ ...current, department: profile.department || "" }));
      }
      if (!profile || !["admin", "coordenador"].includes(profile.role)) {
        toast.error("Sem permissão para esta ação");
        navigate("/dashboard");
        return;
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
          department: plan.department || "",
          title: plan.title,
          description: plan.description,
          objective: plan.objective,
          expected_result: plan.expected_result || "",
          where_location: plan.where_location || "",
          how_to_execute: plan.how_to_execute || "",
          estimated_cost: String(plan.estimated_cost ?? 0),
          start_date: plan.start_date,
          end_date: plan.end_date,
          status: plan.status,
          priority: plan.priority,
          category: plan.category,
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
    fetchPlan();
  }, [navigate, id, isEditing]);

  useEffect(() => {
    let active = true;
    setProfessors([]);
    if (!formData.department) { setParticipantsLoading(false); return; }
    setParticipantsLoading(true);
    const fetchParticipants = async () => {
      const rows: Professor[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from("profiles").select("id, full_name, department")
          .eq("department", formData.department).order("id").range(offset, offset + 999);
        if (!active) return;
        if (error) { setParticipantsLoading(false); toast.error("Não foi possível carregar os participantes"); return; }
        rows.push(...(data || []));
        if ((data?.length || 0) < 1000) break;
      }
      if (active) {
        setProfessors(rows.sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR")));
        setParticipantsLoading(false);
      }
    };
    fetchParticipants();
    return () => { active = false; };
  }, [formData.department]);

  const filteredProfessors = useMemo(() => professors.filter((prof) =>
    !!formData.department && prof.department === formData.department &&
    prof.full_name.toLowerCase().includes(professorSearch.trim().toLowerCase())
  ), [professors, professorSearch, formData.department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department || !formData.title || !formData.description || !formData.objective ||
        !formData.expected_result || !formData.where_location ||
        !formData.how_to_execute || !formData.start_date || !formData.end_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast.error("A data de término deve ser posterior à data de início");
      return;
    }

    const estimatedCost = Number(formData.estimated_cost);
    if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
      toast.error("Informe um custo estimado válido");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data: planId, error } = await supabase.rpc("save_department_plan", {
        details: { ...formData, estimated_cost: estimatedCost },
        participant_ids: selectedProfessors,
        ...(isEditing ? { target_plan_id: id } : {}),
      });
      if (error) throw error;

      toast.success(isEditing ? "Plano atualizado!" : "Plano criado!");
      navigate(`/plans/${planId}`);
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "") || "Erro ao salvar plano");
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
                <Label htmlFor="title">Título (What) :</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Melhoria do processo de avaliação"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição :</Label>
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
                <Label htmlFor="objective">Objetivo (What) :</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Qual o objetivo deste plano?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_result">Motivo (Why) :</Label>
                <Textarea
                  id="expected_result"
                  value={formData.expected_result}
                  onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                  placeholder="Qual o motivo para a realização deste plano?"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="where_location">Onde será realizado? (Where) :</Label>
                  <Input
                    id="where_location"
                    value={formData.where_location}
                    onChange={(e) => setFormData({ ...formData, where_location: e.target.value })}
                    placeholder="Ex: Unidade SESI Osasco"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Custo estimado (How Much) :</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="R$0,00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="how_to_execute">Como será realizado? (How) :</Label>
                <Textarea
                  id="how_to_execute"
                  value={formData.how_to_execute}
                  onChange={(e) => setFormData({ ...formData, how_to_execute: e.target.value })}
                  placeholder="Descreva as etapas, recursos e abordagem da execução"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início (When)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término (When)</Label>
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
            <CardHeader><CardTitle>Departamento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="plan-department">Departamento do plano *</Label>
              <Select value={formData.department} disabled={isEditing && !!formData.department || !canChooseDepartment}
                onValueChange={(department) => {
                  setFormData({ ...formData, department });
                  setSelectedProfessors([]);
                  setProfessorSearch("");
                }}>
                <SelectTrigger id="plan-department"><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
                <SelectContent>{departments.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Os participantes devem pertencer ao departamento escolhido.{!canChooseDepartment && !formData.department ? " Solicite ao Admin a definição do seu departamento." : ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes (Who) </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white w-4 h-4" />
                <Input
                  placeholder="Buscar participantes por nome..."
                  disabled={!formData.department}
                  value={professorSearch}
                  onChange={(e) => setProfessorSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {participantsLoading ? <p className="py-4 text-sm text-muted-foreground">Carregando participantes...</p> : filteredProfessors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {!formData.department ? "Selecione um departamento para escolher participantes" : "Nenhum participante encontrado neste departamento"}
                  </div>
                ) : (
                  filteredProfessors.map((prof) => (
                    <button
                      type="button"
                      aria-pressed={selectedProfessors.includes(prof.id)}
                      key={prof.id}
                      onClick={() => toggleProfessor(prof.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
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
                    </button>
                  ))
                )}
              </div>
              
              {selectedProfessors.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedProfessors.length} participante(s) selecionado(s)
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/plans")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || participantsLoading}>
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
