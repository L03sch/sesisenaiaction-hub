CREATE OR REPLACE FUNCTION public.is_absolute_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), '')) = lower('Administrador.plan@gmail.com');
$$;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'Administrador.plan@gmail.com',
  crypt('1234567890', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Administrador","role":"admin"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, 'Administrador', email, 'admin'
FROM auth.users
WHERE lower(email) = lower('Administrador.plan@gmail.com')
ON CONFLICT (id) DO UPDATE
SET full_name = 'Administrador', email = EXCLUDED.email, role = 'admin';

CREATE OR REPLACE FUNCTION public.create_user_account(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role TEXT,
  user_department TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF NOT public.is_absolute_admin() THEN
    RAISE EXCEPTION 'Apenas o Administrador pode cadastrar usuários';
  END IF;

  IF user_role NOT IN ('professor', 'coordenador') THEN
    RAISE EXCEPTION 'Tipo de usuário inválido';
  END IF;

  IF length(user_password) < 6 THEN
    RAISE EXCEPTION 'A senha deve ter pelo menos 6 caracteres';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(user_email))) THEN
    RAISE EXCEPTION 'Este email já está cadastrado';
  END IF;

  new_user_id := uuid_generate_v4();

  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    'authenticated',
    'authenticated',
    lower(trim(user_email)),
    crypt(user_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(user_full_name), 'role', user_role),
    NOW(),
    NOW()
  );

  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (new_user_id, trim(user_full_name), lower(trim(user_email)), user_role, user_department)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department = EXCLUDED.department;

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_account(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_absolute_admin() THEN
    RAISE EXCEPTION 'Apenas o Administrador pode excluir usuários';
  END IF;

  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir seu próprio acesso';
  END IF;

  IF lower(COALESCE((SELECT email FROM auth.users WHERE id = user_id), '')) = lower('Administrador.plan@gmail.com') THEN
    RAISE EXCEPTION 'O Administrador não pode ser excluído';
  END IF;

  DELETE FROM action_plans WHERE created_by = user_id;
  DELETE FROM profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Cadastro público desativado';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'professor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert_admin_only" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.is_absolute_admin());