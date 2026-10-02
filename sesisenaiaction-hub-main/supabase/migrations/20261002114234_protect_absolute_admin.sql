-- Admin access is permanent through application, Auth Admin API and ordinary
-- SQL DML. Infrastructure owners can still deliberately change the schema.
CREATE OR REPLACE FUNCTION private.protect_admin_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'O acesso Admin absoluto não pode ser excluído' USING ERRCODE = '23514';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'A função e a identidade do Admin absoluto não podem ser alteradas' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_admin_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_admin_profile BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.protect_admin_profile();

-- Auth API bypasses table RLS, so protect the authentication row as well.
-- Password reset, login timestamps and ordinary user metadata remain supported.
CREATE OR REPLACE FUNCTION private.protect_admin_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.id AND role = 'admin') THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'O acesso Admin absoluto não pode ser excluído do Auth' USING ERRCODE = '23514';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
      OR (NEW.banned_until IS DISTINCT FROM OLD.banned_until AND NEW.banned_until > now())
      OR ((NEW.raw_app_meta_data->>'user_role') IS DISTINCT FROM (OLD.raw_app_meta_data->>'user_role')
        AND (NEW.raw_app_meta_data->>'user_role') IS DISTINCT FROM 'admin') THEN
      RAISE EXCEPTION 'O acesso Admin absoluto não pode ser alterado, desativado ou rebaixado' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_admin_auth_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_admin_auth_user BEFORE UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.protect_admin_auth_user();
