-- ========================================
-- RECRIAR APENAS A FUNÇÃO DE EXCLUSÃO
-- Execute este SQL se a função não estiver funcionando
-- ========================================

-- 1. Remover a função antiga (se existir)
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- 2. Recriar a função com logs para debug
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Buscar o role do usuário atual
  SELECT role INTO current_user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Log para debug
  RAISE NOTICE 'User role: %', current_user_role;
  RAISE NOTICE 'Trying to delete user: %', user_id;
  RAISE NOTICE 'Current user: %', auth.uid();
  
  -- Verificar se o usuário que está executando é admin
  IF current_user_role IS NULL OR current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Verificar se não está tentando excluir a si mesmo
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir seu próprio acesso';
  END IF;

  -- Excluir planos de ação criados pelo usuário
  DELETE FROM public.action_plans WHERE created_by = user_id;
  RAISE NOTICE 'Deleted action plans';

  -- Excluir atribuições do usuário
  DELETE FROM public.plan_assignments WHERE professor_id = user_id;
  RAISE NOTICE 'Deleted assignments';

  -- Excluir o perfil
  DELETE FROM public.profiles WHERE id = user_id;
  RAISE NOTICE 'Deleted profile';

  -- Excluir da autenticação
  DELETE FROM auth.users WHERE id = user_id;
  RAISE NOTICE 'Deleted from auth';
  
  RAISE NOTICE 'User deleted successfully';
END;
$$;

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- 4. Garantir que a política de DELETE existe
DROP POLICY IF EXISTS "Admins podem excluir usuários" ON public.profiles;
CREATE POLICY "Admins podem excluir usuários"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ========================================
-- TESTE: Verificar se foi criada
-- ========================================
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'delete_user_completely';
