import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { passwordError } from "../_shared/password-policy.ts";
import { internalFailure } from "../_shared/errors.ts";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const options = { auth: { autoRefreshToken: false, persistSession: false } };
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options);
    const { data: { user }, error } = await admin.auth.getUser(authorization.slice(7));
    if (error || !user?.email) return json({ error: "Sessão inválida" }, 401);
    if (user.app_metadata?.must_change_password !== true) return json({ error: "Não há troca de senha inicial pendente" }, 409);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Dados inválidos" }, 400); }
    const password = typeof body?.new_password === "string" ? body.new_password : "";
    const current = typeof body?.current_password === "string" ? body.current_password : "";
    const policyError = passwordError(password);
    if (policyError) return json({ error: policyError }, 400);
    if (!current || password === current) return json({ error: "Informe sua senha atual e escolha uma nova senha diferente" }, 400);
    const verifier = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, options);
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: current });
    if (verifyError || verified.user?.id !== user.id) return json({ error: "Senha atual incorreta" }, 403);
    // The temporary verification session must not survive this request.
    const { error: signOutError } = await verifier.auth.signOut({ scope: "local" });
    if (signOutError) throw signOutError;
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password, app_metadata: { ...user.app_metadata, must_change_password: false, initial_password_changed_at: new Date().toISOString() },
    });
    if (updateError) throw updateError;
    return json({ success: true });
  } catch (error) { return internalFailure("complete-initial-password", error, headers); }
});
