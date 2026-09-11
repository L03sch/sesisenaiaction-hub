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
      return json({ error: "Apenas o Administrador pode cadastrar usuários" }, 403);
    }

    const body = await request.json();
    const email = typeof body.user_email === "string" ? body.user_email.trim().toLowerCase() : "";
    const password = typeof body.user_password === "string" ? body.user_password : "";
    const fullName = typeof body.user_full_name === "string" ? body.user_full_name.trim() : "";
    const role = typeof body.user_role === "string" ? body.user_role : "";
    const department = typeof body.user_department === "string" ? body.user_department.trim() : null;

    if (!email) return json({ error: "O email é obrigatório" }, 400);
    if (!fullName) return json({ error: "O nome é obrigatório" }, 400);
    if (password.length < 6) return json({ error: "A senha deve ter pelo menos 6 caracteres" }, 400);
    if (!["professor", "coordenador"].includes(role)) {
      return json({ error: "Tipo de usuário inválido" }, 400);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, department },
      app_metadata: { user_role: role },
    });

    if (error) {
      const duplicate = /already|registered|exists/i.test(error.message);
      return json(
        { error: duplicate ? "Este email já está cadastrado" : error.message },
        duplicate ? 409 : 400,
      );
    }

    return json({ user_id: data.user.id }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
