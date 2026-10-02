import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [invite] = useState(() => new URLSearchParams(window.location.search).get("invite") === "1" || new URLSearchParams(window.location.hash.slice(1)).get("type") === "invite");
  const [inviteSession, setInviteSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (invite) setInviteSession(Boolean(session));
      else if (session) navigate("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (invite) setInviteSession(Boolean(session));
      else if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate, invite]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invite) {
      if (!inviteSession) { toast.error("Abra um convite válido enviado pelo administrador"); return; }
      if (password.length < 6 || password !== confirmation) { toast.error("Use pelo menos 6 caracteres e confirme a mesma senha"); return; }
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Senha definida. Bem-vindo!"); navigate("/dashboard", { replace: true }); }
      return;
    }
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("Email ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white overflow-hidden">
            <img src="/S.png" alt="SENAI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">SESI SENAI</CardTitle>
            <CardDescription>Sistema de Gestão de Planos de Ação</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
                {!invite && <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="seu.email@sesisenai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>}
                {invite && <p className="text-sm text-muted-foreground">{inviteSession ? "Defina sua senha para concluir o convite." : "Abra o link do convite enviado pelo Admin absoluto para ativar seu acesso."}</p>}
                <div className="space-y-2">
                  <Label htmlFor="password-login">Senha</Label>
                  <Input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {invite && <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirme a senha</Label>
                  <Input id="password-confirm" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={loading} minLength={6} />
                </div>}
                <Button type="submit" className="w-full" disabled={loading || (invite && !inviteSession)}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {invite ? "Salvando..." : "Entrando..."}
                    </>
                  ) : (
                    invite ? "Definir senha e entrar" : "Entrar"
                  )}
                </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
