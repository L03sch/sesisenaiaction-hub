-- ========================================
-- TESTE: Verificar se a função existe
-- Execute este SQL no Supabase Dashboard
-- ========================================

-- 1. Verificar se a função delete_user_completely existe
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'delete_user_completely';

-- Se retornar vazio, a função não existe
-- Se retornar algo, a função existe

-- ========================================
-- 2. Verificar tabelas
-- ========================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- 3. Verificar políticas RLS
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
