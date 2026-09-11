-- Concilia bancos que já aplicaram versões antigas da migração administrativa.
-- Criação e exclusão de contas agora usam Edge Functions + Supabase Auth Admin API.

DROP FUNCTION IF EXISTS public.create_user_account(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_user_completely(UUID);

REVOKE ALL ON FUNCTION public.is_absolute_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_absolute_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
