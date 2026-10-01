-- Authorization comes from protected profiles.role, never from an email or
-- user-editable metadata. Helpers live outside the exposed public schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION private.is_plan_participant(target_plan_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.plan_assignments
    WHERE plan_id = target_plan_id AND professor_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION private.is_plan_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_plan_participant(uuid) TO authenticated;

-- Bypass assignment RLS only to answer whether the caller shares a plan
-- with this participant. The caller identity cannot be supplied by clients.
CREATE OR REPLACE FUNCTION private.shares_plan(participant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.plan_assignments mine
    JOIN public.plan_assignments theirs ON theirs.plan_id = mine.plan_id
    WHERE mine.professor_id = (SELECT auth.uid())
      AND theirs.professor_id = participant_id
  );
$$;
REVOKE ALL ON FUNCTION private.shares_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.shares_plan(uuid) TO authenticated;

-- Keep the old RPC available for older clients while removing email-based
-- authorization. New server operations use the protected profile directly.
CREATE OR REPLACE FUNCTION public.is_absolute_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT COALESCE(private.current_user_role() = 'admin', false); $$;
REVOKE ALL ON FUNCTION public.is_absolute_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_absolute_admin() TO authenticated;

-- Remove legacy policies: permissive policies are combined with OR, so
-- leaving any old policy in place could defeat the new restrictions.
DO $$ DECLARE policy_record record;
BEGIN
  FOR policy_record IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'action_plans', 'plan_assignments')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END; $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.action_plans, public.plan_assignments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- Roles, identity and email can only be changed by trusted server operations.
GRANT UPDATE (full_name, department, phone, school, avatar_url)
  ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.action_plans TO authenticated;
GRANT UPDATE (title, description, objective, expected_result, where_location,
  how_to_execute, estimated_cost, start_date, end_date, status, priority, category)
  ON public.action_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_assignments TO authenticated;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid())
  OR (SELECT private.current_user_role()) IN ('admin', 'coordenador')
  OR private.shares_plan(id));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY plans_select ON public.action_plans FOR SELECT TO authenticated
USING ((SELECT private.current_user_role()) IN ('admin', 'coordenador')
  OR private.is_plan_participant(id));
CREATE POLICY plans_insert ON public.action_plans FOR INSERT TO authenticated
WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'coordenador')
  AND created_by = (SELECT auth.uid()));
CREATE POLICY plans_update ON public.action_plans FOR UPDATE TO authenticated
USING ((SELECT private.current_user_role()) IN ('admin', 'coordenador'))
WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'coordenador'));
CREATE POLICY plans_delete ON public.action_plans FOR DELETE TO authenticated
USING ((SELECT private.current_user_role()) IN ('admin', 'coordenador'));

CREATE POLICY assignments_select ON public.plan_assignments FOR SELECT TO authenticated
USING (professor_id = (SELECT auth.uid())
  OR (SELECT private.current_user_role()) IN ('admin', 'coordenador')
  OR private.is_plan_participant(plan_id));
CREATE POLICY assignments_insert ON public.plan_assignments FOR INSERT TO authenticated
WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'coordenador'));
CREATE POLICY assignments_update ON public.plan_assignments FOR UPDATE TO authenticated
USING ((SELECT private.current_user_role()) IN ('admin', 'coordenador'))
WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'coordenador'));
CREATE POLICY assignments_delete ON public.plan_assignments FOR DELETE TO authenticated
USING ((SELECT private.current_user_role()) IN ('admin', 'coordenador'));

-- Preserve institutional records even if Auth/profile deletion is attempted.
ALTER TABLE public.action_plans DROP CONSTRAINT action_plans_created_by_fkey;
ALTER TABLE public.action_plans ADD CONSTRAINT action_plans_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS action_plans_created_by_idx ON public.action_plans(created_by);
CREATE INDEX IF NOT EXISTS plan_assignments_professor_id_idx ON public.plan_assignments(professor_id, plan_id);

-- Prevent moving an avatar into another user's folder during an update.
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
CREATE POLICY "Usuários podem atualizar seus avatares" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);
