import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const invitationUrl = "https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site/auth?invite=1";
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: caller, error: callerError } = await admin.auth.getUser(authorization.slice(7));
    if (callerError || !caller.user) return json({ error: "Sessão inválida" }, 401);
    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("role,is_absolute_admin").eq("id", caller.user.id).single();
    if (profileError || profile?.role !== "admin" || profile?.is_absolute_admin !== true) {
      return json({ error: "Apenas o Admin principal pode convidar usuários" }, 403);
    }
    const body = await request.json();
    const email = typeof body.user_email === "string" ? body.user_email.trim().toLowerCase() : "";
    const fullName = typeof body.user_full_name === "string" ? body.user_full_name.trim() : "";
    const role = body.user_role;
    const department = typeof body.user_department === "string" ? body.user_department.trim() : null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName) {
      return json({ error: "Preencha nome e email válidos" }, 400);
    }
    if (!["professor", "coordenador", "admin"].includes(role)) return json({ error: "Tipo de usuário inválido" }, 400);

    if (!department && role !== "admin") return json({ error: "Selecione um departamento" }, 400);
    if (department) {
    const { data: registeredDepartment, error: departmentError } = await admin.from("departments")
      .select("name").eq("name", department).maybeSingle();
    if (departmentError) throw departmentError;
    if (!registeredDepartment) return json({ error: "Departamento inválido" }, 400);
    }

    const enrollmentToken = crypto.randomUUID();
    const { error: enrollmentError } = await admin.rpc("prepare_user_enrollment", {
      enrollment_token: enrollmentToken, user_email: email, user_role: role,
    });
    if (enrollmentError) throw enrollmentError;
    // The database consumes the admission and sets protected app_metadata
    // before Auth creates the profile or sends the invitation email.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, department, enrollment_token: enrollmentToken }, redirectTo: invitationUrl,
    });
    await admin.rpc("cancel_user_enrollment", { enrollment_token: enrollmentToken });
    if (error) return json({ error: error.message }, 400);
    if (!data.user) throw new Error("O Supabase não retornou o usuário convidado");
    return json({ user_id: data.user.id }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
