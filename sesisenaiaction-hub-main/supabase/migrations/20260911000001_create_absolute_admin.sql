-- O administrador deve ser criado pelo Dashboard ou pela Admin API.
-- Nunca insira usuários ou senhas diretamente no schema auth em uma migração.

CREATE OR REPLACE FUNCTION public.is_absolute_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    ''
  )) = lower('Administrador.plan@gmail.com');
$$;

REVOKE ALL ON FUNCTION public.is_absolute_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_absolute_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'Novo Usuário'),
    lower(NEW.email),
    COALESCE(NULLIF(NEW.raw_app_meta_data->>'user_role', ''), 'professor'),
    NULLIF(btrim(NEW.raw_user_meta_data->>'department'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.create_user_account(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_user_completely(UUID);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;

CREATE POLICY "profiles_insert_admin_only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_absolute_admin()));
