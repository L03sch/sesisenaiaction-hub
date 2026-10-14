# Correções de segurança de Jean

Tarefas: KAN-26, KAN-28, KAN-35, KAN-38, KAN-40 e KAN-48.

## Comportamento

Novos cadastros com senha inicial recebem `app_metadata.must_change_password=true`. A interface encaminha para a definição da senha pessoal; regras restritivas do banco bloqueiam planos, usuários, departamentos e armazenamento até essa etapa. O RPC de departamento e as funções administrativas também verificam o bloqueio.

`complete-initial-password` valida a sessão, a política da nova senha, a diferença em relação à senha atual e a senha atual no Auth. Atualiza somente a conta autenticada, preserva os privilégios e registra `initial_password_changed_at`. O usuário entra novamente; sessões criadas antes dessa data não acessam os dados, mesmo com JWT atualizado. O bloqueio consulta Auth e `auth.sessions`, não metadados editáveis nem uma flag antiga do JWT.

A política compartilhada exige 12 caracteres e quatro classes de caracteres, rejeita palavras/ sequências comuns e limita a entrada a 72 bytes devido ao bcrypt. Ela não substitui uma base completa de senhas vazadas. Contas existentes não são marcadas em massa para troca, preservando o Admin e os acessos atuais.

As três funções administrativas e a nova função devolvem erros públicos controlados. Erros internos recebem identificador de ocorrência; o log contém somente operação, identificador e código conhecido. Mensagens, corpos de requisição e senhas nunca são registrados.

## Aplicação no ambiente

O merge deste código não aplica migrações nem publica Edge Functions automaticamente.

1. Aplicar a migração `20261014124235_require_personal_password.sql` após as migrações de departamento. Validar primeiro em homologação com o esquema completo; não executar isoladamente num banco vazio.
2. Publicar `complete-initial-password`, `create-user-account`, `invite-user-account` e `delete-user-completely`, incluindo os arquivos em `_shared`. As variáveis padrão `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` permanecem exclusivas do servidor.
3. Configurar no Auth hospedado o mínimo de 12 caracteres e a exigência de maiúsculas, minúsculas, números e símbolos. O arquivo `config.toml` define a política local; publicá-lo no GitHub não altera as configurações do projeto hospedado. Habilitar proteção de senhas vazadas quando disponível no plano contratado; não criar custo ou alterar plano automaticamente.
4. Publicar o frontend depois do banco e das funções. Antes de liberar cadastros, confirmar o novo endpoint e a migração para não criar contas cujo onboarding não possa terminar.
5. Com conta de teste descartável, verificar cadastro, bloqueio direto da API, recusa de senha comum/reutilizada, definição pessoal, novo login, rejeição do token anterior e manutenção de função/departamento. Confirmar também convite por e-mail com a política do Auth hospedado.

## Dependências

Overrides fixados: flatted 3.4.4, lodash 4.18.1, nanoid 3.3.20 e ws 8.22.0. O lockfile registra as versões. A varredura deve confirmar ausência desses quatro componentes na lista de vulnerabilidades. Outros avisos pertencem às tarefas dos demais integrantes; não usar `npm audit fix --force` indiscriminadamente.

## Validação

Build de produção, TypeScript, lint dos arquivos alterados, 170 testes de permissões/handlers e auditoria das quatro dependências. O banco de testes usa PostgreSQL isolado com fixtures de Auth/Storage; não substitui os testes de implantação acima.
