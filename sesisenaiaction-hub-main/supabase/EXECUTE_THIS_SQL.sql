-- ========================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- Execute este arquivo COMPLETO no SQL Editor do Supabase
-- ========================================

-- ========================================
-- 1. CRIAR ESTRUTURA BASE
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'coordenador')),
  avatar_url TEXT,
  department TEXT,
  phone TEXT,
  school TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create action plans table
CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.plan_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, professor_id)
);

-- ========================================
-- 2. HABILITAR RLS (Row Level Security)
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_assignments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. POLÍTICAS DE SEGURANÇA
-- ========================================

-- Políticas para profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Políticas para action_plans
DROP POLICY IF EXISTS "plans_select" ON public.action_plans;
CREATE POLICY "plans_select" ON public.action_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "plans_insert" ON public.action_plans;
CREATE POLICY "plans_insert" ON public.action_plans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

DROP POLICY IF EXISTS "plans_update" ON public.action_plans;
CREATE POLICY "plans_update" ON public.action_plans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

DROP POLICY IF EXISTS "plans_delete" ON public.action_plans;
CREATE POLICY "plans_delete" ON public.action_plans FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

-- Políticas para plan_assignments
DROP POLICY IF EXISTS "assignments_select" ON public.plan_assignments;
CREATE POLICY "assignments_select" ON public.plan_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "assignments_all" ON public.plan_assignments;
CREATE POLICY "assignments_all" ON public.plan_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

-- ========================================
-- 4. FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS plans_updated_at ON public.action_plans;
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.action_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'professor')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 5. FUNÇÃO DE EXCLUSÃO COMPLETA DE USUÁRIO
-- ========================================

CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário que está executando é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
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
  DELETE FROM public.action_plans WHERE created_by = user_id;

  -- Excluir atribuições do usuário
  DELETE FROM public.plan_assignments WHERE professor_id = user_id;

  -- Excluir o perfil
  DELETE FROM public.profiles WHERE id = user_id;

  -- Excluir da autenticação
  DELETE FROM auth.users WHERE id = user_id;
  
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION delete_user_completely TO authenticated;

-- ========================================
-- MIGRAÇÃO COMPLETA!
-- ========================================
-- Agora seu banco de dados está pronto!
