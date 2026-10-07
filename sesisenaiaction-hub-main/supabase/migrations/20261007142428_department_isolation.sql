-- Department is authorization data; clients cannot change their own scope.
CREATE TABLE public.departments (name text PRIMARY KEY CHECK (btrim(name) <> ''));
INSERT INTO public.departments(name) VALUES
 ('Administração'), ('Tecnologia da Informação'), ('Recursos Humanos'), ('Educação'),
 ('Segurança do Trabalho'), ('Mecânica'), ('Eletrônica'), ('Automação'), ('Logística'), ('Gestão');
-- Preserve any existing department names rather than guessing their meaning.
INSERT INTO public.departments(name) SELECT DISTINCT department FROM public.profiles
 WHERE department IS NOT NULL AND btrim(department) <> '' ON CONFLICT DO NOTHING;
UPDATE public.profiles SET department = NULL WHERE btrim(department) = '';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_department_fkey FOREIGN KEY (department) REFERENCES public.departments(name);
ALTER TABLE public.action_plans ADD COLUMN department text REFERENCES public.departments(name);
-- Only infer old plans when every participant agrees with the creator's department.
UPDATE public.action_plans p SET department = u.department FROM public.profiles u
 WHERE u.id = p.created_by AND u.department IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM public.plan_assignments a JOIN public.profiles m ON m.id = a.professor_id
 WHERE a.plan_id = p.id AND m.department IS DISTINCT FROM u.department);
ALTER TABLE public.action_plans ADD CONSTRAINT plans_department_required CHECK (department IS NOT NULL) NOT VALID;
CREATE INDEX profiles_department_idx ON public.profiles(department);
CREATE INDEX plans_department_idx ON public.action_plans(department);

CREATE FUNCTION private.is_principal_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT COALESCE((SELECT role = 'admin' AND is_absolute_admin FROM public.profiles WHERE id = (SELECT auth.uid())), false);
$$;
CREATE FUNCTION private.current_department() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT department FROM public.profiles WHERE id = (SELECT auth.uid());
$$;
CREATE FUNCTION private.department_access(target_department text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL AND (private.current_user_role() = 'admin' OR
 (target_department IS NOT NULL AND target_department = private.current_department()));
$$;
CREATE FUNCTION private.plan_access(target_id uuid, manage boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (SELECT 1 FROM public.action_plans p
 WHERE p.id = target_id AND private.department_access(p.department) AND
 (private.current_user_role() IN ('admin','coordenador') OR (NOT manage AND private.is_plan_participant(p.id))));
$$;
REVOKE ALL ON FUNCTION private.is_principal_admin(), private.current_department(), private.department_access(text), private.plan_access(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_principal_admin(), private.current_department(), private.department_access(text), private.plan_access(uuid,boolean) TO authenticated;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.departments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
CREATE POLICY departments_select ON public.departments FOR SELECT TO authenticated USING (private.department_access(name));
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE (department) ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, school, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (department) ON public.action_plans TO authenticated;

CREATE FUNCTION private.check_department_membership() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE plan_department text; member_department text;
BEGIN
 SELECT department INTO plan_department FROM public.action_plans WHERE id = NEW.plan_id FOR SHARE;
 SELECT department INTO member_department FROM public.profiles WHERE id = NEW.professor_id FOR SHARE;
 IF plan_department IS NULL OR member_department IS DISTINCT FROM plan_department THEN
   RAISE EXCEPTION 'Participantes devem pertencer ao departamento do plano' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.check_department_membership() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER check_department_membership BEFORE INSERT OR UPDATE ON public.plan_assignments
 FOR EACH ROW EXECUTE FUNCTION private.check_department_membership();
CREATE FUNCTION private.protect_plan_department() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.plan_assignments a JOIN public.profiles p ON p.id=a.professor_id
 WHERE a.plan_id=NEW.id AND p.department IS DISTINCT FROM NEW.department) THEN
 RAISE EXCEPTION 'Os participantes não pertencem ao novo departamento' USING ERRCODE='23514'; END IF;
 IF OLD.department IS NOT NULL AND NEW.department IS DISTINCT FROM OLD.department THEN
  RAISE EXCEPTION 'O departamento de um plano existente não pode ser alterado' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.protect_plan_department() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_plan_department BEFORE UPDATE ON public.action_plans
 FOR EACH ROW EXECUTE FUNCTION private.protect_plan_department();
CREATE FUNCTION public.set_user_department(target_user_id uuid, new_department text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.is_principal_admin() THEN RAISE EXCEPTION 'Apenas o Admin principal define departamentos' USING ERRCODE = '42501'; END IF;
 IF new_department IS NULL OR NOT EXISTS (SELECT 1 FROM public.departments WHERE name = new_department) THEN
  RAISE EXCEPTION 'Departamento inválido' USING ERRCODE = '23514'; END IF;
 PERFORM 1 FROM public.profiles WHERE id = target_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Usuário não encontrado' USING ERRCODE = '23514'; END IF;
 IF EXISTS (SELECT 1 FROM public.plan_assignments a JOIN public.action_plans p ON p.id = a.plan_id
 WHERE a.professor_id = target_user_id AND p.department IS DISTINCT FROM new_department) THEN
  RAISE EXCEPTION 'Remova a participação em planos de outro departamento antes de transferir o usuário' USING ERRCODE = '23514'; END IF;
 UPDATE public.profiles SET department = new_department WHERE id = target_user_id;
END; $$;
REVOKE ALL ON FUNCTION public.set_user_department(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_department(uuid,text) TO authenticated;

DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public'
 AND tablename IN ('profiles','action_plans','plan_assignments') LOOP
 EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END; $$;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
 USING (id = (SELECT auth.uid()) OR private.department_access(department));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
 USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY plans_select ON public.action_plans FOR SELECT TO authenticated
 USING (private.department_access(department) AND (private.current_user_role() IN ('admin','coordenador') OR private.is_plan_participant(id)));
CREATE POLICY plans_insert ON public.action_plans FOR INSERT TO authenticated
 WITH CHECK (private.current_user_role() IN ('admin','coordenador') AND private.department_access(department) AND created_by = (SELECT auth.uid()));
CREATE POLICY plans_update ON public.action_plans FOR UPDATE TO authenticated
 USING (private.current_user_role() IN ('admin','coordenador') AND private.department_access(department))
 WITH CHECK (private.current_user_role() IN ('admin','coordenador') AND private.department_access(department));
CREATE POLICY plans_delete ON public.action_plans FOR DELETE TO authenticated
 USING (private.current_user_role() IN ('admin','coordenador') AND private.department_access(department));
CREATE POLICY assignments_select ON public.plan_assignments FOR SELECT TO authenticated USING (private.plan_access(plan_id));
CREATE POLICY assignments_insert ON public.plan_assignments FOR INSERT TO authenticated WITH CHECK (private.plan_access(plan_id,true));
CREATE POLICY assignments_update ON public.plan_assignments FOR UPDATE TO authenticated
 USING (private.plan_access(plan_id,true)) WITH CHECK (private.plan_access(plan_id,true));
CREATE POLICY assignments_delete ON public.plan_assignments FOR DELETE TO authenticated USING (private.plan_access(plan_id,true));

-- Save a plan and its team together: assignment rejection rolls back the plan.
CREATE FUNCTION public.save_department_plan(details jsonb, participant_ids uuid[], target_plan_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE saved_id uuid;
BEGIN
 IF target_plan_id IS NULL THEN
 INSERT INTO public.action_plans (title,description,objective,expected_result,where_location,how_to_execute,
 estimated_cost,start_date,end_date,status,priority,category,department,created_by)
 VALUES (details->>'title',details->>'description',details->>'objective',details->>'expected_result',details->>'where_location',details->>'how_to_execute',
 (details->>'estimated_cost')::numeric,(details->>'start_date')::date,(details->>'end_date')::date,
 details->>'status',details->>'priority',details->>'category',details->>'department',auth.uid()) RETURNING id INTO saved_id;
 ELSE
 UPDATE public.action_plans SET title=details->>'title',description=details->>'description',objective=details->>'objective',
 expected_result=details->>'expected_result',where_location=details->>'where_location',how_to_execute=details->>'how_to_execute',
 estimated_cost=(details->>'estimated_cost')::numeric,start_date=(details->>'start_date')::date,end_date=(details->>'end_date')::date,
 status=details->>'status',priority=details->>'priority',category=details->>'category',department=details->>'department'
 WHERE id=target_plan_id RETURNING id INTO saved_id;
 IF saved_id IS NULL THEN RAISE EXCEPTION 'Plano indisponível ou sem permissão' USING ERRCODE='42501'; END IF;
 END IF;
 DELETE FROM public.plan_assignments WHERE plan_id=saved_id;
 INSERT INTO public.plan_assignments(plan_id,professor_id) SELECT saved_id,member_id FROM unnest(participant_ids) AS member_id;
 RETURN saved_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_department_plan(jsonb,uuid[],uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_department_plan(jsonb,uuid[],uuid) TO authenticated;

-- Trusted updates must not silently leave a team spanning departments either.
CREATE FUNCTION private.check_profile_department() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.department IS DISTINCT FROM OLD.department AND EXISTS (
  SELECT 1 FROM public.plan_assignments a JOIN public.action_plans p ON p.id=a.plan_id
  WHERE a.professor_id=OLD.id AND p.department IS DISTINCT FROM NEW.department) THEN
  RAISE EXCEPTION 'Remova as participações incompatíveis antes de transferir o usuário' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.check_profile_department() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER check_profile_department BEFORE UPDATE OF department ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION private.check_profile_department();
