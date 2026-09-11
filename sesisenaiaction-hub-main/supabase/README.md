# Supabase Setup

Este diretório contém toda a configuração e migrações do banco de dados Supabase para o projeto SESI SENAI Action Hub.

## 📁 Estrutura

```
supabase/
├── config.toml                           # Configurações do Supabase CLI
├── migrations/                           # Migrações do banco de dados
│   ├── README.md                        # Documentação das migrações
│   ├── 20251002231256_*.sql            # Estrutura base
│   ├── 20251002231310_*.sql            # Correção de segurança
│   ├── 20251022000000_*.sql            # Campos phone/school
│   ├── 20251022000001_*.sql            # Função de exclusão
│   └── 20260911000002_*.sql            # Gestão segura de usuários
├── functions/
│   ├── create-user-account/             # Cadastro via Auth Admin API
│   └── delete-user-completely/          # Exclusão via Auth Admin API
└── README.md                            # Este arquivo
```

## 🚀 Setup Inicial (Primeira vez)

### Passo 1: Executar todas as migrações

Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e execute no **SQL Editor**:

```sql
-- Cole o conteúdo de cada migração na ordem:
-- 1. 20251002231256_*.sql
-- 2. 20251002231310_*.sql
-- 3. 20251022000000_*.sql
-- 4. 20251022000001_*.sql
-- 5. 20251022000002_*.sql
```

### Passo 2: Verificar se tudo foi criado

Execute no SQL Editor:

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar a função de autorização
SELECT proname FROM pg_proc WHERE proname = 'is_absolute_admin';

-- Verificar bucket de avatares
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

## ✅ Resultado Esperado

Após o setup, você terá:

### Tabelas
- ✅ `profiles` - Perfis dos usuários
- ✅ `action_plans` - Planos de ação
- ✅ `plan_assignments` - Atribuições de planos

### Funções
- ✅ `handle_updated_at()` - Atualiza timestamp automaticamente
- ✅ `handle_new_user()` - Cria perfil ao registrar usuário
- ✅ `create-user-account` - Cadastro seguro pela Auth Admin API
- ✅ `delete-user-completely` - Exclusão segura pela Auth Admin API

### Storage
- ✅ Bucket `avatars` - Armazenamento de fotos de perfil

### Segurança (RLS)
- ✅ Políticas de acesso configuradas
- ✅ Row Level Security habilitado
- ✅ Permissões por role (admin, coordenador, professor)

## 🔐 Roles de Usuário

| Role | Permissões |
|------|------------|
| `admin` | Acesso total + exclusão de usuários |
| `coordenador` | Criar/editar/deletar planos de ação |
| `professor` | Visualizar planos atribuídos |

## 📝 Variáveis de Ambiente

Certifique-se de ter no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

## 🛠️ Troubleshooting

### Erro: "Failed to send a request to the Edge Function"
- Confirme que as duas funções em `supabase/functions` foram implantadas
- Confirme que o usuário está autenticado antes de chamar a função

### Erro: "Bucket not found"
- Execute a migração `20251022000002_*.sql` novamente

### Erro: "relation does not exist"
- Execute todas as migrações na ordem correta

## 📚 Documentação

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔄 Atualizações Futuras

Para adicionar novas migrações:

1. Crie um novo arquivo em `migrations/` com timestamp
2. Siga o formato: `YYYYMMDDHHMMSS_descricao.sql`
3. Execute no Supabase Dashboard
4. Atualize a documentação

---

**Última atualização:** Outubro 2025
