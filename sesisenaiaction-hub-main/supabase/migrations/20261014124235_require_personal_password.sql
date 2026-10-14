-- Read authorization state from Auth, never from user-editable metadata or
-- stale JWT app_metadata. Old sessions stay blocked after the initial reset.
CREATE FUNCTION private.password_setup_complete() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = (SELECT auth.uid())
  AND COALESCE(u.raw_app_meta_data->>'must_change_password', 'false') <> 'true'
  AND (u.raw_app_meta_data->>'initial_password_changed_at' IS NULL OR EXISTS (
   SELECT 1 FROM auth.sessions s WHERE s.user_id=u.id
   AND s.id::text = (SELECT auth.jwt())->>'session_id'
   AND s.created_at >= (u.raw_app_meta_data->>'initial_password_changed_at')::timestamptz
  ))
 );
$$;
REVOKE ALL ON FUNCTION private.password_setup_complete() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.password_setup_complete() TO authenticated;

CREATE FUNCTION public.password_setup_complete() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT private.password_setup_complete();
$$;
REVOKE ALL ON FUNCTION public.password_setup_complete() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.password_setup_complete() TO authenticated;

CREATE POLICY personal_password_required ON public.profiles AS RESTRICTIVE
 FOR ALL TO authenticated USING ((SELECT private.password_setup_complete())) WITH CHECK ((SELECT private.password_setup_complete()));
CREATE POLICY personal_password_required ON public.action_plans AS RESTRICTIVE
 FOR ALL TO authenticated USING ((SELECT private.password_setup_complete())) WITH CHECK ((SELECT private.password_setup_complete()));
CREATE POLICY personal_password_required ON public.plan_assignments AS RESTRICTIVE
 FOR ALL TO authenticated USING ((SELECT private.password_setup_complete())) WITH CHECK ((SELECT private.password_setup_complete()));
CREATE POLICY personal_password_required ON public.departments AS RESTRICTIVE
 FOR ALL TO authenticated USING ((SELECT private.password_setup_complete())) WITH CHECK ((SELECT private.password_setup_complete()));
CREATE POLICY personal_password_required ON storage.objects AS RESTRICTIVE
 FOR ALL TO authenticated USING ((SELECT private.password_setup_complete())) WITH CHECK ((SELECT private.password_setup_complete()));

-- This privileged RPC previously relied only on a profile flag and bypasses
-- RLS. Keep the same authorization, adding the onboarding restriction.
ALTER FUNCTION private.set_user_department(uuid,text) RENAME TO set_user_department_after_setup;
REVOKE ALL ON FUNCTION private.set_user_department_after_setup(uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.set_user_department(target_user_id uuid,new_department text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.password_setup_complete() THEN RAISE EXCEPTION 'Defina sua senha pessoal antes de continuar' USING ERRCODE='42501'; END IF;
 PERFORM private.set_user_department_after_setup(target_user_id,new_department);
END; $$;
REVOKE ALL ON FUNCTION private.set_user_department(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.set_user_department(uuid,text) TO authenticated;
-- Rebind the SQL wrapper after renaming its dependency.
CREATE OR REPLACE FUNCTION public.set_user_department(target_user_id uuid,new_department text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
 SELECT private.set_user_department(target_user_id,new_department);
$$;
