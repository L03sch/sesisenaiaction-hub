# Plan-Action: teste isolado Vercel + Neon

Este experimento verifica a conexão servidor → Neon. Não é a migração completa do Plan-Action. Não importa o cliente Supabase, não acessa usuários reais e não altera a aplicação existente.

## Recursos

- Branch Git: `codex/jean-vercel-neon-test`, baseada em `ba748a2` da main.
- Projeto Vercel solicitado: `plan-action`, escopo `jean-82db`.
- Projeto Neon exclusivo: `plan-action-migration-test` (`jolly-term-63095863`).
- Branch Neon de teste: `dev-vercel-connectivity` (`br-spring-cloud-b7sa5137`).
- Branch de referência vazia: `baseline-empty`.
- Banco: `plan_action_test`. Tabela única: `migration_probe`.

## Publicação

Usar esta pasta como raiz da publicação. O pacote tem dependências e build próprios. Não executar o build do aplicativo atual para este teste.

1. Autenticar com `npx vercel login` e conferir o proprietário e projeto existentes.
2. Vincular explicitamente esta pasta a `plan-action` no escopo `jean-82db`.
3. Configurar `DATABASE_URL`, `PROBE_TOKEN` (mínimo 32 caracteres aleatórios) e `MIGRATION_TEST_ENABLED=true` somente para a branch de preview de teste.
4. Publicar apenas Preview, sem `--prod`, sem promover e sem alterar domínios ou configuração do ambiente de produção.
5. Acessar a prévia e verificar a conexão. A chave é fornecida manualmente e não é armazenada no navegador. Nunca colocar o segredo em URL ou no frontend.

As credenciais locais estão em `.env.local`, ignorado pelo Git. Não copiar o `.env` do sistema existente. O endpoint aceita somente GET autenticado e retorna um resultado mínimo, sem credenciais ou erros internos. A leitura usa consulta parametrizada e restringe o banco de destino e o registro fictício. As proteções da Vercel existentes devem ser preservadas.

## Verificação realizada

- `npm test`: credenciais inválidas bloqueadas antes de acessar o banco.
- `npm run build`: página independente gerada com o logo existente do projeto.
- `npm run test:connection`: leitura real do registro fictício bem-sucedida em 22/10/2026.

Após publicar, verificar GET sem chave = 401 e GET com chave = 200 com `syntheticRecordVerified=true`. Não considerar o teste local como prova de implantação na Vercel.

## Próximas etapas para uma migração completa

Adaptar autenticação, sessões, convites, permissões por perfil/departamento/unidade, APIs, dados e funções. Definir estratégia de migração de contas e de arquivos. Homologar antes de qualquer mudança na main ou no Supabase. O experimento não altera o site atual.
