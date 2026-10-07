-- Keep privileged code out of the exposed API schema. The private function
-- still verifies the current caller's protected principal flag.
ALTER FUNCTION public.set_user_department(uuid,text) SET SCHEMA private;
CREATE FUNCTION public.set_user_department(target_user_id uuid,new_department text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
 SELECT private.set_user_department(target_user_id,new_department);
$$;
REVOKE ALL ON FUNCTION public.set_user_department(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_user_department(uuid,text) TO authenticated;
