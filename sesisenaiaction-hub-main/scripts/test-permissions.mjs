// Runs real PostgreSQL RLS in an isolated in-memory database. Supabase Auth
// and Storage schemas are minimal fixtures, not a replacement for staging QA.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const modulePath = process.env.PGLITE_MODULE;
const { PGlite } = await import(modulePath ? pathToFileURL(resolve(modulePath)).href : "@electric-sql/pglite");

test("Supabase permission regression suite", async (suite) => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE TABLE auth.users (
        id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}',
        raw_app_meta_data jsonb DEFAULT '{}'
      );
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
      CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]);
      CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid(), bucket_id text, name text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE
        AS $$ SELECT string_to_array($1, '/') $$;
    `);
    // PGlite includes UUID generation natively; the legacy uuid-ossp extension
    // is the only production migration dependency substituted by this harness.
    for (const name of (await readdir("supabase/migrations")).filter((name) => name.endsWith(".sql")).sort()) {
      const sql = (await readFile(`supabase/migrations/${name}`, "utf8"))
        .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, "")
        .replace(/uuid_generate_v4\(\)/g, "gen_random_uuid()");
      await db.exec(sql);
    }
    await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;");
    const ids = Object.fromEntries(["admin", "coordenador", "professor", "peer", "outsider"].map((role, i) =>
      [role, `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`]));
    for (const [role, id] of Object.entries(ids)) {
      await db.query(`INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
        VALUES ($1, $2, $3, $4)`, [id, `${role}@example.test`,
        JSON.stringify({ full_name: role, role: "admin" }),
        JSON.stringify({ user_role: ["admin", "coordenador"].includes(role) ? role : "professor" })]);
    }
    const assigned = "10000000-0000-0000-0000-000000000001";
    const hidden = "10000000-0000-0000-0000-000000000002";
    await db.query(`INSERT INTO public.action_plans
      (id, title, description, objective, start_date, end_date, created_by)
      VALUES ($1, 'Assigned', 'Test', 'Test', '2026-10-01', '2026-10-02', $3),
             ($2, 'Hidden', 'Test', 'Test', '2026-10-01', '2026-10-02', $3)`,
    [assigned, hidden, ids.coordenador]);
    await db.query(`INSERT INTO public.plan_assignments (plan_id, professor_id)
      VALUES ($1, $2), ($1, $3)`, [assigned, ids.professor, ids.peer]);

    async function asRole(name, body, databaseRole = "authenticated") {
      await db.exec("BEGIN");
      try {
        await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [ids[name] || ""]);
        await db.exec(`SET LOCAL ROLE ${databaseRole}`);
        await body();
      } finally {
        await db.exec("ROLLBACK");
      }
    }
    const query = (sql, params) => db.query(sql, params);
    const denied = (sql, params, code = "42501") => assert.rejects(query(sql, params), { code });
    const check = (name, role, body, databaseRole) => suite.test(name, () => asRole(role, body, databaseRole));

    for (const table of ["profiles", "action_plans", "plan_assignments"]) {
      await check(`visitor cannot read ${table}`, "", () => denied(`SELECT * FROM public.${table}`), "anon");
      for (const operation of [`INSERT INTO public.${table} DEFAULT VALUES`, `UPDATE public.${table} SET id = id`, `DELETE FROM public.${table}`]) {
        await check(`visitor denied: ${operation}`, "", () => denied(operation), "anon");
      }
    }
    await check("professor only sees assigned plans", "professor", async () => {
      assert.deepEqual((await query("SELECT id FROM public.action_plans")).rows.map((r) => r.id), [assigned]);
      assert.equal((await query("SELECT * FROM public.action_plans WHERE id = $1", [hidden])).rows.length, 0);
    });
    await check("unassigned professor has no plans", "outsider", async () => {
      assert.equal((await query("SELECT * FROM public.action_plans")).rows.length, 0);
      assert.equal((await query("SELECT * FROM public.plan_assignments")).rows.length, 0);
      assert.equal((await query("SELECT * FROM public.profiles")).rows.length, 1);
    });
    await check("participants can see their team without recursive policies", "professor", async () => {
      assert.equal((await query("SELECT * FROM public.plan_assignments")).rows.length, 2);
      assert.equal((await query("SELECT * FROM public.profiles")).rows.length, 2);
    });
    await check("professor can edit own ordinary profile fields", "professor", async () => {
      assert.equal((await query("UPDATE public.profiles SET full_name = 'Updated' WHERE id = $1 RETURNING full_name", [ids.professor])).rows[0].full_name, "Updated");
    });
    await check("professor cannot edit another profile", "professor", async () => {
      assert.equal((await query("UPDATE public.profiles SET full_name = 'Attack' WHERE id = $1 RETURNING id", [ids.peer])).rows.length, 0);
    });
    for (const role of ["professor", "coordenador", "admin"]) {
      for (const column of ["role", "email", "id"]) {
        await check(`${role} cannot change profile ${column}`, role, () => denied(`UPDATE public.profiles SET ${column} = ${column} WHERE id = $1`, [ids[role]]));
      }
      await check(`${role} cannot insert a forged profile`, role, () => denied("INSERT INTO public.profiles DEFAULT VALUES"));
      await check(`${role} cannot delete a profile through the Data API`, role, () => denied("DELETE FROM public.profiles WHERE id = $1", [ids[role]]));
    }
    await check("user metadata cannot promote a new professor", "outsider", async () => {
      assert.equal((await query("SELECT role FROM public.profiles WHERE id = $1", [ids.outsider])).rows[0].role, "professor");
      assert.equal((await query("SELECT public.is_absolute_admin() AS allowed")).rows[0].allowed, false);
    });
    await check("professor cannot create a plan", "professor", () => denied(`INSERT INTO public.action_plans
      (title, description, objective, start_date, end_date, created_by)
      VALUES ('Attack', '', '', '2026-10-01', '2026-10-02', $1)`, [ids.professor]));
    await check("professor cannot update plans", "professor", async () => {
      assert.equal((await query("UPDATE public.action_plans SET title = 'Attack' WHERE id = $1 RETURNING id", [assigned])).rows.length, 0);
    });
    await check("professor cannot delete plans", "professor", async () => {
      assert.equal((await query("DELETE FROM public.action_plans WHERE id = $1 RETURNING id", [assigned])).rows.length, 0);
    });
    await check("professor cannot assign themselves to hidden plans", "professor", () => denied("INSERT INTO public.plan_assignments (plan_id, professor_id) VALUES ($1, $2)", [hidden, ids.professor]));
    await check("professor cannot edit assignments", "professor", async () => {
      assert.equal((await query("UPDATE public.plan_assignments SET plan_id = $1 RETURNING id", [hidden])).rows.length, 0);
    });
    await check("professor cannot delete assignments", "professor", async () => {
      assert.equal((await query("DELETE FROM public.plan_assignments RETURNING id")).rows.length, 0);
    });
    for (const role of ["admin", "coordenador"]) {
      await check(`${role} can manage plans and assignments`, role, async () => {
        assert.equal((await query("SELECT * FROM public.action_plans")).rows.length, 2);
        assert.equal((await query("SELECT * FROM public.profiles")).rows.length, 5);
        const created = (await query(`INSERT INTO public.action_plans
          (title, description, objective, start_date, end_date, created_by)
          VALUES ('New', '', '', '2026-10-01', '2026-10-02', $1) RETURNING id`, [ids[role]])).rows[0].id;
        await query("INSERT INTO public.plan_assignments (plan_id, professor_id) VALUES ($1, $2)", [created, ids.outsider]);
        assert.equal((await query("UPDATE public.action_plans SET status = 'completed' WHERE id = $1 RETURNING id", [created])).rows.length, 1);
        assert.equal((await query("UPDATE public.plan_assignments SET professor_id = $1 WHERE plan_id = $2 RETURNING id", [ids.peer, created])).rows.length, 1);
        assert.equal((await query("DELETE FROM public.plan_assignments WHERE plan_id = $1 RETURNING id", [created])).rows.length, 1);
        assert.equal((await query("DELETE FROM public.action_plans WHERE id = $1 RETURNING id", [created])).rows.length, 1);
      });
      await check(`${role} cannot spoof plan authorship`, role, () => denied(`INSERT INTO public.action_plans
        (title, description, objective, start_date, end_date, created_by)
        VALUES ('Forged', '', '', '2026-10-01', '2026-10-02', $1)`, [ids.professor]));
      await check(`${role} cannot rewrite plan authorship`, role, () => denied("UPDATE public.action_plans SET created_by = $1 WHERE id = $2", [ids.professor, assigned]));
    }
    await check("admin RPC uses protected role rather than email", "admin", async () => {
      assert.equal((await query("SELECT public.is_absolute_admin() AS allowed")).rows[0].allowed, true);
    });
    await suite.test("deleting a creator in Auth preserves institutional plans", async () => {
      await db.exec("BEGIN");
      try {
        await denied("DELETE FROM auth.users WHERE id = $1", [ids.coordenador], "23503");
      } finally { await db.exec("ROLLBACK"); }
      assert.equal((await query("SELECT * FROM public.action_plans")).rows.length, 2);
    });
    await suite.test("account without authored plans can still be deleted", async () => {
      await db.exec("BEGIN");
      try {
        await query("DELETE FROM auth.users WHERE id = $1", [ids.outsider]);
        assert.equal((await query("SELECT * FROM public.profiles WHERE id = $1", [ids.outsider])).rows.length, 0);
      } finally { await db.exec("ROLLBACK"); }
    });
    await check("own avatar can be uploaded and updated", "professor", async () => {
      await query("INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', $1)", [`${ids.professor}/old.png`]);
      assert.equal((await query("UPDATE storage.objects SET name = $1 RETURNING name", [`${ids.professor}/new.png`])).rows.length, 1);
    });
    await check("avatar cannot move into another user's folder", "professor", async () => {
      await query("INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', $1)", [`${ids.professor}/old.png`]);
      await denied("UPDATE storage.objects SET name = $1", [`${ids.peer}/attack.png`]);
    });
    await check("avatar cannot be uploaded into another user's folder", "professor", () => denied("INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', $1)", [`${ids.peer}/attack.png`]));
  } finally { await db.close(); }
});
