-- Função para excluir usuário completamente (profiles e auth)
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário que está executando é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Verificar se não está tentando excluir a si mesmo
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir seu próprio acesso';
  END IF;

  -- Excluir planos de ação criados pelo usuário
  DELETE FROM action_plans WHERE created_by = user_id;

  -- Excluir o perfil
  DELETE FROM profiles WHERE id = user_id;

  -- Excluir da autenticação
  DELETE FROM auth.users WHERE id = user_id;
  
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION delete_user_completely TO authenticated;

-- Criar política para permitir que admins excluam usuários
CREATE POLICY "Admins podem excluir usuários"
ON profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
