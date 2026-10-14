# Inicialização do Plan-Action

Projeto configurado no frontend: `inlbptawboswnwdqlnlm`, organização `Plan-Action's Org`.

Em 14/10/2026, antes da inicialização autorizada, as consultas retornaram zero usuários Auth, zero tabelas públicas e nenhum histórico de migração. As 18 migrações existentes foram enviadas em ordem, em um lote transacional com guarda de banco vazio.

A aplicação foi bloqueada pelo erro `42703: column "public" of relation "buckets" does not exist`, na migração histórica do bucket de avatares. A transação foi revertida: a verificação posterior confirmou novamente zero usuários, zero tabelas da aplicação e histórico vazio. Nenhum usuário, senha ou plano foi inserido.

Diagnóstico independente: o serviço Storage retornou HTTP 544 `DatabaseTimeout`; o projeto permaneceu `COMING_UP`. O frontend publicado e Auth health responderam HTTP 200, mas isso não comprova que todos os serviços do projeto estejam prontos. Faltam campos padrão do schema Storage: `public`, `file_size_limit` e `allowed_mime_types`. Portanto não basta mudar a senha para resolver a inicialização.

## Retomada

1. Conferir no Dashboard do projeto se o provisionamento/restauração terminou. Se o estado COMING_UP ou o erro 544 persistir, resolver o serviço com o suporte Supabase antes de rodar as migrações da aplicação.
2. Executar `supabase/preflight.sql`, somente leitura. Todos os campos padrão devem existir; revisar os contadores de dados para garantir que a condição de banco vazio ainda vale. O resultado precisa apresentar `service_schema_ready = true`.
3. Aplicar as migrações versionadas em ordem pelo fluxo oficial de deployment, mantendo o histórico alinhado aos arquivos. Para um bootstrap transacional via conector, confirmar o comportamento do histórico antes de adotar futuras execuções de db push. Não registrar migrações como aplicadas quando o lote foi revertido.
4. Verificar tabelas, RLS, permissões anon/authenticated, bucket avatars e RPC password_setup_complete. Rodar a suíte de permissões antes de liberar usuários.
5. Publicar as Edge Functions referenciadas em supabase/config.toml. Elas não são criadas pelas migrações SQL. A conta administrativa inicial exige bootstrap pela Auth Admin API/Dashboard e admissão compatível com as proteções atuais; não inserir senhas diretamente no schema auth nem desabilitar os triggers de segurança.
6. Confirmar a conta inicial e testar autenticação, navegação e avatares nos dois temas. Apenas criar tabelas não cria ou recupera contas antigas.

Não criar colunas manualmente no schema gerenciado de Storage e não retirar limites de arquivo para contornar a falha. [A documentação Supabase recomenda preservar o schema Storage](https://supabase.com/docs/guides/storage/schema/design). [O fluxo de migrações mantém o schema versionado](https://supabase.com/docs/guides/deployment/database-migrations).

A inicialização continua autorizada pelo usuário, mas permanece bloqueada pelo serviço Supabase incompleto. O estado acima descreve a tentativa, não uma inicialização concluída.
