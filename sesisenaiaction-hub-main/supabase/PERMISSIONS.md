# Permissões e implantação

## Modelo de acesso

| Operação | Professor | Coordenador | Administrador |
| --- | --- | --- | --- |
| Ler planos | Apenas atribuídos | Todos | Todos |
| Criar, editar e excluir planos e atribuições | Não | Sim | Sim |
| Ler perfis | Próprio e participantes dos seus planos | Todos | Todos |
| Editar dados pessoais | Próprio | Próprio | Próprio |
| Alterar função, identidade ou email pelo cliente | Não | Não | Não |
| Cadastrar e excluir contas pelas Edge Functions | Não | Não | Sim |

A função administrativa é `profiles.role = 'admin'`. Email não concede privilégios.
O cliente não pode inserir ou excluir perfis, nem editar função, email, identidade
ou autoria de um plano. Contas são criadas e excluídas pelas Edge Functions,
que validam a sessão com Auth e consultam a função atual no banco.

As políticas permitem leitura de participantes do mesmo plano. Avatares continuam
públicos como na implementação existente; somente o dono pode gravar em sua pasta.
O schema `private` contém helpers de RLS e **não deve ser exposto pela Data API**.
Não há segregação por unidade nesta versão: coordenadores gerenciam todos os planos.

## Preservação dos planos

A FK de autoria usa `ON DELETE RESTRICT`. A exclusão de uma conta com planos
criados retorna conflito; uma tentativa de exclusão direta no Auth também é
rejeitada pelo banco. Nenhum plano existente é apagado ou transferido pela migração.
Desativação de contas e histórico de alterações ficam para uma evolução posterior.

## Implantação

1. Confirmar que o projeto está ativo e aplicar as migrações anteriores em ordem.
2. Verificar que há pelo menos um administrador legítimo em `profiles`.
   Não promover automaticamente uma conta por seu email. Se necessário, um operador
   autorizado deve configurar `app_metadata.user_role = 'admin'` no Auth e
   `profiles.role = 'admin'` para o UUID escolhido, pelo Dashboard/Admin API.
   A migração não promove nem rebaixa contas existentes; auditar funções antigas
   é necessário porque a política anterior permitia editar a própria função.
3. Aplicar a migração `harden_action_hub_permissions` e implantar as funções
   `create-user-account` e `delete-user-completely` junto com o frontend.
   **Aplicar a migração antes das novas funções**: elas confiam na proteção de
   `profiles.role`. Clientes antigos baseados em email precisam ser atualizados.
4. Validar logins reais e as operações permitidas/negadas em staging. Executar
   os advisors do Supabase e verificar grants, políticas e schemas expostos.

## Verificação automatizada

`node --test scripts/test-user-management.mjs` verifica as Edge Functions com
Auth/API simuladas. O teste executa o corpo real das funções, mas não verifica
gateway JWT, CORS ou serviços remotos.

Para testar RLS, instalar `@electric-sql/pglite@0.3.14` em um diretório temporário
e definir `PGLITE_MODULE` para seu `dist/index.js`. Executar
`node --test scripts/test-permissions.mjs`. O teste aplica todas as migrações
em PostgreSQL isolado e exercita acessos reais como `anon` e `authenticated`.
Auth e Storage são schemas mínimos de teste; `uuid-ossp` é substituído pela
geração nativa de UUID. Não há conexão com o projeto remoto nem dados reais.

O workflow `.github/workflows/permissions.yml`, na raiz do repositório, executa os testes, build e TypeScript
em cada PR. Não implanta alterações no Supabase.

## Implantação remota verificada em 01/10/2026

Projeto `Plan-Action` (`inlbptawboswnwdqlnlm`), ativo:

- Aplicadas as migrações `add_5w2h_fields` (20261001145933),
  `add_action_plan_category` (20261001145943) e
  `harden_action_hub_permissions` (20261001145957).
- Publicadas as duas Edge Functions na versão 3, com `verify_jwt = true`.
- Teste transacional remoto passou para acesso de professor, coordenador,
  administrador e visitante, bloqueio de alteração de função e autoria,
  edição do próprio perfil e restrição de exclusão de criador. Ao final,
  `ROLLBACK` preservou os dois perfis administrativos existentes; nenhum plano
  ou atribuição de teste permaneceu no banco. Não foram usados logins reais.
- API verificada: schema `private` não exposto (`406/PGRST106`), perfis negados
  sem login (`401`) e funções administrativas negadas sem JWT (`401`).
- Advisors sem avisos de performance. Avisos de segurança restantes:
  descoberta do schema GraphQL por usuários autenticados (acesso aos registros
  continua sujeito a RLS) e proteção contra senhas vazadas desativada.
- `.env` alinhado ao projeto acima, com chave pública publicável. O frontend
  anteriormente apontava para outro projeto. Ambientes de produção com
  variáveis próprias devem atualizar os três valores `VITE_SUPABASE_*` e
  reconstruir o frontend; esta implantação não publica o frontend.

As versões remotas foram geradas pelo MCP. Antes de usar `supabase db push`,
reconciliar o histórico remoto com os arquivos locais, que têm timestamps
diferentes e incluem migrações históricas aplicadas manualmente.
