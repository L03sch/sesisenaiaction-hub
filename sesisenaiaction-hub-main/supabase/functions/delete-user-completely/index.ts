import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const ADMIN_EMAIL = "administrador.plan@gmail.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: caller, error: callerError } = await admin.auth.getUser(authorization.slice(7));
    if (callerError || !caller.user) return json({ error: "Sessão inválida" }, 401);
    if (caller.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: "Apenas o Administrador pode excluir usuários" }, 403);
    }

    const body = await request.json();
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    if (!userId) return json({ error: "O usuário é obrigatório" }, 400);
    if (userId === caller.user.id) {
      return json({ error: "Você não pode excluir seu próprio acesso" }, 400);
    }

    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target.user) return json({ error: "Usuário não encontrado" }, 404);
    if (target.user.email?.toLowerCase() === ADMIN_EMAIL) {
      return json({ error: "O Administrador não pode ser excluído" }, 400);
    }

    // As FKs usam ON DELETE CASCADE, excluir no Auth também remove perfil,
    // planos criados e atribuições relacionadas em uma única operação.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
