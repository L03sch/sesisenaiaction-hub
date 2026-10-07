# Permissões e implantação

## Modelo de acesso

| Operação | Professor | Coordenador | Admin comum | Admin absoluto |
| --- | --- | --- | --- | --- |
| Ler planos | Apenas atribuídos | Todos | Todos | Todos |
| Gerenciar planos e atribuições | Não | Sim | Sim | Sim |
| Ler perfis | Próprio e participantes | Todos | Todos | Todos |
| Editar dados pessoais | Próprio | Próprio | Próprio | Próprio |
| Alterar função, identidade ou email pelo cliente | Não | Não | Não | Não |
| Convidar e cadastrar contas | Não | Não | Não | Sim |
| Excluir coordenadores e professores | Não | Não | Sim | Sim |
| Excluir administradores comuns | Não | Não | Não | Sim |

O Admin absoluto exige `profiles.role = 'admin'` e `is_absolute_admin = true`.
O índice parcial permite uma única conta absoluta. A marca não pode ser removida
ou transferida por DML. Email e metadata editável não concedem privilégios.
Todos os Admins têm leitura global, mas somente o principal convida e cadastra contas. Admins comuns podem excluir
coordenadores e professores; só o principal exclui outros administradores.
Triggers protegem a conta principal Admin contra exclusão, alteração de função/identidade,
exclusão lógica e banimento também no Auth Admin API. Login, dados pessoais e
recuperação de senha permanecem permitidos. Proprietários da infraestrutura podem
remover essas proteções deliberadamente por DDL; o aplicativo não possui esse poder.

Cada novo acesso exige uma autorização descartável criada pelas Edge Functions
após validar a sessão e o privilégio absoluto no banco. O token expira em dez
minutos, é vinculado ao email, define a função autorizada e é consumido antes da
criação do perfil. O trigger rejeita cadastros diretos sem essa autorização,
inclusive tentativas pela API pública, e remove o token dos metadados. Os RPCs de
preparação/cancelamento aceitam somente `service_role`; o cliente não pode executá-los.
A tabela fica no schema privado, com RLS sem políticas (nega todo acesso de cliente).

O botão **Convidar usuário** aparece somente para o Admin absoluto. O convidado
recebe o link e define a própria senha. O cadastro direto por senha continua
disponível no servidor, também restrito ao absoluto. O convite aceita administradores comuns, com `is_absolute_admin = false`.
Nenhum convite pode criar outra conta principal; o cadastro direto por senha
permanece limitado a professor e coordenador. Exclusões preservam planos institucionais.

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

## Admin único aplicado em 02/10/2026

A conta escolhida pelo proprietário, `administrador.plan@gmail.com`, foi marcada
pelo UUID como único Admin absoluto. A outra conta Admin foi preservada, com
visão global e sem gerenciamento de usuários.

Aplicadas `protect_absolute_admin`, `unique_absolute_admin` e
`require_admin_enrollment`. Publicadas `create-user-account` e
`delete-user-completely` versão 4, e `invite-user-account` versão 1.
O teste remoto transacional confirmou unicidade, visão global, proteção contra
exclusão/rebaixamento, negação ao Admin comum, bloqueio de cadastro público,
atribuição da função autorizada e impossibilidade de reutilizar o token.
Todos os dados de teste foram revertidos; nenhum convite real foi enviado.

Em novas instalações, selecionar explicitamente o UUID do Admin após aplicar
`unique_absolute_admin`; nunca inferir a escolha pelo email. A migração de
admissões exige que criação de contas de infraestrutura também passe pelo RPC
privilegiado; não alterar o trigger para liberar signup público.

O Supabase Auth deve autorizar a URL exata de retorno:
`https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site/auth?invite=1`.
Configurar Site URL para o mesmo domínio e conferir SMTP/template de convite
(`ConfirmationURL`). O MCP não oferece edição dessas configurações; o painel
pediu login. Sem verificar isso, entrega de email e retorno de um convite real
não estão validados. O Sites também precisa permitir que os convidados abram
a página de login; a publicação atual é privada do proprietário.

A interface identifica a conta principal como **Admin**. A migração
`allow_normal_admin_deletion` limita a proteção permanente à conta principal.
Nenhuma conta real foi excluída. A exclusão de autores ainda é bloqueada para
preservar planos institucionais.

A migração `allow_admin_invitations` permite a função `admin` nas autorizações
de convite. Somente a conta principal pode emitir esses convites. Metadados
editáveis não concedem o privilégio principal, mesmo em um convite de Admin.


## Separação por departamento — 07/10/2026

O catálogo `departments` reutiliza os dez departamentos que já apareciam em Minha conta e preserva nomes legados. Cada novo plano exige um departamento. Administradores têm visão global e não precisam de departamento; apenas o principal pode convidar usuários e definir o departamento de professores/coordenadores. Coordenadores consultam e gerenciam somente seu setor. Professores consultam os usuários do setor e os planos do setor em que participam.

O departamento é protegido contra alteração pelo próprio usuário. `set_user_department` exige o Admin principal e recusa transferências que deixariam participações incompatíveis. Administradores comuns continuam podendo excluir professores/coordenadores, com visão global, mas não outros administradores. O Admin principal permanece protegido.

`save_department_plan` salva plano e participantes na mesma transação, com as permissões do solicitante. O banco recusa participantes de outro departamento, inclusive para administradores. O departamento de um plano já classificado não pode ser trocado durante a edição. Planos legados sem classificação ficam acessíveis apenas aos administradores até serem classificados; a migração só infere a classificação quando o autor e todos os participantes concordam.

Novos convites/cadastros de professores e coordenadores exigem departamento válido; convites de administradores não. A interface consulta o catálogo central e filtra os participantes por departamento antes de selecioná-los. A página Usuários é acessível aos professores, com a mesma restrição no banco.

Validação: 141 testes de banco/servidor passaram; teste remoto transacional confirmou isolamento de planos/perfis, bloqueio de mudança de setor e visão global do Admin. Registros temporários, identificados como TESTE, serviram à conferência da interface e foram removidos sem envio de convites.
