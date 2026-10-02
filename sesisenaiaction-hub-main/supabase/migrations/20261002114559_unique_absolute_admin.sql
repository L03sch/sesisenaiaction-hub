-- The owner is selected explicitly after migration, by immutable account UUID.
ALTER TABLE public.profiles ADD COLUMN is_absolute_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD CONSTRAINT absolute_admin_requires_admin
  CHECK (NOT is_absolute_admin OR role = 'admin');
CREATE UNIQUE INDEX profiles_single_absolute_admin ON public.profiles (is_absolute_admin)
  WHERE is_absolute_admin;

CREATE OR REPLACE FUNCTION public.is_absolute_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_absolute_admin
); $$;
REVOKE ALL ON FUNCTION public.is_absolute_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_absolute_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.protect_absolute_admin_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF OLD.is_absolute_admin AND NOT NEW.is_absolute_admin THEN
    RAISE EXCEPTION 'O privilégio do Admin absoluto não pode ser removido ou transferido'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_absolute_admin_flag() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_absolute_admin_flag BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.protect_absolute_admin_flag();
