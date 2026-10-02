-- An unguessable, short-lived admission issued by the server is required for
-- EVERY new Auth row, including direct signUp/OTP calls to the public API.
CREATE TABLE private.user_enrollments (
  token uuid PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('professor', 'coordenador')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
ALTER TABLE private.user_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.user_enrollments FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.prepare_user_enrollment(enrollment_token uuid, user_email text, user_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM private.user_enrollments WHERE expires_at < now();
  INSERT INTO private.user_enrollments(token, email, role)
    VALUES (enrollment_token, lower(trim(user_email)), user_role);
END;
$$;
CREATE FUNCTION public.cancel_user_enrollment(enrollment_token uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$ DELETE FROM private.user_enrollments WHERE token = enrollment_token; $$;
REVOKE ALL ON FUNCTION public.prepare_user_enrollment(uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_user_enrollment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_user_enrollment(uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_user_enrollment(uuid) TO service_role;

CREATE FUNCTION private.require_admin_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE admission_role text;
BEGIN
  DELETE FROM private.user_enrollments
    WHERE token::text = NEW.raw_user_meta_data->>'enrollment_token'
      AND email = lower(NEW.email) AND expires_at > now()
    RETURNING role INTO admission_role;
  IF admission_role IS NULL THEN
    RAISE EXCEPTION 'Novos acessos exigem convite ou cadastro pelo Admin absoluto' USING ERRCODE = '23514';
  END IF;
  NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'enrollment_token';
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('user_role', admission_role);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.require_admin_enrollment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER require_admin_enrollment BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.require_admin_enrollment();
