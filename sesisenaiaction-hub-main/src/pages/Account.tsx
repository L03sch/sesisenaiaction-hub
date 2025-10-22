import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  school: string | null;
  avatar_url: string | null;
}

export default function Account() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
    phone: "",
    school: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          phone: (data as any).phone || null,
          school: (data as any).school || null,
        });
        setFormData({
          full_name: data.full_name || "",
          email: session.user.email || "",
          department: data.department || "",
          phone: (data as any).phone || "",
          school: (data as any).school || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          department: formData.department || null,
          phone: formData.phone || null,
          school: formData.school || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchProfile();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile?.id);

      if (updateError) throw updateError;

      toast.success("Foto atualizada com sucesso!");
      fetchProfile();
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto");
    } finally {
      setUploading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "Administrador",
      coordenador: "Coordenador",
      professor: "Professor",
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card de Avatar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>Clique na foto para alterar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                    {profile?.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{getRoleLabel(profile?.role || "")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Informações */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados de contato e informações</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administração">Administração</SelectItem>
                        <SelectItem value="Tecnologia da Informação">Tecnologia da Informação</SelectItem>
                        <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                        <SelectItem value="Educação">Educação</SelectItem>
                        <SelectItem value="Segurança do Trabalho">Segurança do Trabalho</SelectItem>
                        <SelectItem value="Mecânica">Mecânica</SelectItem>
                        <SelectItem value="Eletrônica">Eletrônica</SelectItem>
                        <SelectItem value="Automação">Automação</SelectItem>
                        <SelectItem value="Logística">Logística</SelectItem>
                        <SelectItem value="Gestão">Gestão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="school">Região/Escola</Label>
                    <Select
                      value={formData.school}
                      onValueChange={(value) => setFormData({ ...formData, school: value })}
                    >
                      <SelectTrigger id="school">
                        <SelectValue placeholder="Selecione a região/escola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SESI SENAI - Campinas">SESI SENAI - Campinas</SelectItem>
                        <SelectItem value="SESI SENAI - São Paulo">SESI SENAI - São Paulo</SelectItem>
                        <SelectItem value="SESI SENAI - Santos">SESI SENAI - Santos</SelectItem>
                        <SelectItem value="SESI SENAI - Sorocaba">SESI SENAI - Sorocaba</SelectItem>
                        <SelectItem value="SESI SENAI - Ribeirão Preto">SESI SENAI - Ribeirão Preto</SelectItem>
                        <SelectItem value="SESI SENAI - Bauru">SESI SENAI - Bauru</SelectItem>
                        <SelectItem value="SESI SENAI - São José dos Campos">SESI SENAI - São José dos Campos</SelectItem>
                        <SelectItem value="SESI SENAI - Jundiaí">SESI SENAI - Jundiaí</SelectItem>
                        <SelectItem value="SESI SENAI - Piracicaba">SESI SENAI - Piracicaba</SelectItem>
                        <SelectItem value="SESI SENAI - Americana">SESI SENAI - Americana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
