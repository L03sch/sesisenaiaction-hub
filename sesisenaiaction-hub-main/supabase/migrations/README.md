# Supabase Migrations

Este diretório contém as migrações do banco de dados do projeto SESI SENAI Action Hub.

## 📚 Histórico de Migrações

### `20251002231256` - Estrutura Base
- Criação das tabelas: `profiles`, `action_plans`, `plan_assignments`
- Configuração de RLS (Row Level Security)
- Políticas de acesso para todas as tabelas
- Triggers para `updated_at` e criação automática de perfis

### `20251002231310` - Correção de Segurança
- Adiciona `SET search_path = public` na função `handle_updated_at()`
- Melhora a segurança da função

### `20251022000000` - Campos Adicionais de Perfil
- Adiciona campos `phone` e `school` na tabela `profiles`

### `20251022000001` - Função de Exclusão de Usuário
- Cria função `delete_user_completely(user_id UUID)`
- Permite exclusão completa de usuários (profiles + auth.users)
- Restrição: Apenas administradores podem executar
- Proteção: Não permite auto-exclusão

### `20251022000002` - Storage para Avatares
- Cria bucket `avatars` no Supabase Storage
- Configura políticas RLS para upload/atualização/exclusão
- Limite de 5MB por arquivo
- Tipos permitidos: PNG, JPEG, JPG, GIF, WEBP

## 🚀 Como Aplicar Migrações

### Opção 1: Dashboard do Supabase (Recomendado para produção)
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute as migrações na ordem (do mais antigo para o mais novo)

### Opção 2: CLI do Supabase (Desenvolvimento local)
```bash
# Aplicar todas as migrações pendentes
npx supabase db push

# Aplicar migrações específicas
npx supabase migration up
```

## ⚠️ Importante

- **Sempre execute as migrações na ordem cronológica** (pelo timestamp no nome do arquivo)
- **Não modifique migrações já aplicadas** - crie novas migrações para alterações
- **Faça backup antes de aplicar em produção**

## 🔄 Estado Atual do Banco

Para verificar se todas as migrações foram aplicadas, execute no SQL Editor:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar se a função existe
SELECT proname 
FROM pg_proc 
WHERE proname = 'delete_user_completely';

-- Verificar se o bucket existe
SELECT * 
FROM storage.buckets 
WHERE id = 'avatars';
```

## 📝 Resultado Esperado

Após aplicar todas as migrações, você deve ter:

✅ Tabelas: `profiles`, `action_plans`, `plan_assignments`  
✅ Função: `delete_user_completely(UUID)`  
✅ Storage Bucket: `avatars`  
✅ Políticas RLS configuradas para todas as tabelas  
✅ Triggers automáticos funcionando  

## 🛠️ Desenvolvimento

Para criar uma nova migração:

```bash
# Gerar timestamp
npx supabase migration new nome_da_migracao

# Ou criar manualmente com formato:
# YYYYMMDDHHMMSS_descricao.sql
```

## 📞 Suporte

Se encontrar problemas ao aplicar as migrações, verifique:

1. Se você está conectado ao projeto correto no Supabase
2. Se tem permissões de administrador
3. Os logs de erro no console do SQL Editor
4. Se não há conflitos com dados existentes
