import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Run deliberately as the principal Admin. Passwords never belong in this file.
const env = Object.fromEntries((await readFile(".env", "utf8")).split(/\r?\n/)
  .filter((line) => line.startsWith("VITE_")).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
  }));
for (const key of ["DEMO_ADMIN_EMAIL", "DEMO_ADMIN_PASSWORD", "DEMO_PROFESSOR_PASSWORD", "DEMO_COORDINATOR_PASSWORD"]) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const marker = "[DEMO]";
function checked(result) {
  if (result.error) throw result.error;
  return result.data;
}
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
function dateOffset(days) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const names = ["Ana Martins", "Bruno Costa", "Carla Souza", "Diego Lima", "Elisa Rocha", "Felipe Alves", "Gabriela Santos", "Henrique Melo", "Isabela Dias", "João Ribeiro"];
try {
  checked(await client.auth.signInWithPassword({ email: process.env.DEMO_ADMIN_EMAIL, password: process.env.DEMO_ADMIN_PASSWORD }));
  const { data: { user } } = await client.auth.getUser();
  const principal = checked(await client.from("profiles").select("role,is_absolute_admin").eq("id", user.id).single());
  if (principal.role !== "admin" || !principal.is_absolute_admin) throw new Error("Principal Admin required");
  const departments = checked(await client.from("departments").select("name").order("name"));
  let createdUsers = 0, createdPlans = 0;
  for (const [index, { name: department }] of departments.entries()) {
    const slug = department.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const specifications = [
      { role: "professor", email: department === "Educação" ? "professor.plan@gmail.com" : `demo-professor-${slug}-1@example.test`, name: `${marker} ${names[index]} — ${department}` },
      { role: "professor", email: `demo-professor-${slug}-2@example.test`, name: `${marker} ${names[(index + 3) % names.length]} — ${department}` },
      { role: "coordenador", email: department === "Educação" ? "coordenador.plan@gmail.com" : `demo-coordenador-${slug}@example.test`, name: `${marker} Coordenação — ${department}` },
    ];
    const members = [];
    for (const specification of specifications) {
      const existing = checked(await client.from("profiles").select("id,role,department,full_name").eq("email", specification.email).maybeSingle());
      if (existing) {
        if (!existing.full_name.startsWith(marker) || existing.role !== specification.role || existing.department !== department) {
          throw new Error(`Existing unrelated account: ${specification.email}`);
        }
        members.push(existing.id);
        continue;
      }
      const password = specification.email === "professor.plan@gmail.com" ? process.env.DEMO_PROFESSOR_PASSWORD
        : specification.email === "coordenador.plan@gmail.com" ? process.env.DEMO_COORDINATOR_PASSWORD : randomUUID() + randomUUID();
      const result = await client.functions.invoke("create-user-account", { body: {
        user_email: specification.email, user_password: password, user_full_name: specification.name,
        user_role: specification.role, user_department: department,
      } });
      if (result.error) {
        const payload = await result.error.context?.json?.().catch(() => null);
        throw new Error(payload?.error || "Demo account creation failed");
      }
      members.push(result.data.user_id);
      createdUsers++;
    }
    const examples = [
      { title: "Planejamento de melhoria", status: "planning", end: 21, participants: [members[1], members[2]], priority: "medium" },
      { title: "Organização dos processos", status: "in_progress", end: index % 2 ? 5 : -2, participants: [members[0], members[2]], priority: "high" },
      { title: "Revisão dos materiais", status: "completed", end: -4, participants: members, priority: "low" },
    ];
    for (const example of examples) {
      const title = `${marker} ${example.title} — ${department}`;
      const existing = checked(await client.from("action_plans").select("id").eq("title", title).eq("department", department).maybeSingle());
      if (existing) continue;
      checked(await client.rpc("save_department_plan", { details: {
        title, department, description: "Dados fictícios para demonstração e teste. Este plano não representa uma atividade institucional real.",
        objective: "Testar o acompanhamento de ações do departamento", expected_result: "Conferir prazos, participantes e permissões por setor",
        where_location: `Unidade de demonstração — ${department}`, how_to_execute: "Reunir a equipe de teste, revisar os itens e registrar os resultados.",
        estimated_cost: 150 + index * 25, start_date: dateOffset(-14), end_date: dateOffset(example.end),
        status: example.status, priority: example.priority, category: null,
      }, participant_ids: example.participants }));
      createdPlans++;
    }
    console.log(`${department}: 2 professores, 1 coordenador e 3 planos preparados`);
  }
  console.log(JSON.stringify({ createdUsers, createdPlans }));
} finally {
  // Revoke only this script's session; leave the user's browser signed in.
  await client.auth.signOut({ scope: "local" });
}
