# Merge automático do Dependabot

## Ativação pelo proprietário

A conta Jean tem permissão `write`, sem administração. Em 15/10/2026 o repositório informa `allow_auto_merge: false`. Não há automação ativa enquanto os requisitos abaixo não forem atendidos.

1. Integrar este PR após os checks passarem.
2. Em Settings → General → Pull Requests, habilitar **Allow auto-merge** e manter squash disponível.
3. Em Settings → Branches, proteger `main`: exigir PR, checks **permissions**, **CodeQL (javascript-typescript)** e **CodeQL (java-kotlin)** do GitHub Actions, e **Require branches to be up to date before merging**. Preservar as demais regras/revisões existentes; não conceder bypass ao bot.
4. O workflow consulta a regra de proteção da branch pela API GraphQL com o token padrão. Se a API negar acesso ou não houver regra tradicional de proteção (por exemplo, apenas um ruleset), a automação falha sem fazer merge; não criar PAT nem conceder bypass para contornar isso.
5. Executar **Dependabot auto-merge** por Run workflow para avaliar os PRs já abertos; os próximos eventos de PR e término de CI fazem nova avaliação automaticamente.

## Regras

Somente PRs do usuário `dependabot[bot]`, do próprio repositório para `main`, sem rascunho, conflito ou desatualização. Todos os checks do HEAD precisam terminar com sucesso, incluindo os três obrigatórios. Falhas, cancelamentos, checks ignorados, ausência de checks e status externos pendentes bloqueiam a solicitação.

O workflow usa auto-merge nativo e respeita regras/revisões do GitHub; não aprova PRs, não ignora proteções e não resolve conflitos automaticamente. Revalida o HEAD antes de habilitar a integração. Atualizações major também são elegíveis se atenderem aos critérios, conforme o pedido de automatizar os PRs; CI aprovado não garante ausência de incompatibilidade funcional não coberta por testes.

O workflow privilegiado só executa código da `main`, sem instalar dependências, executar código do PR ou consumir artefatos dele. O workflow de regressão permanece com acesso de leitura.

## PRs existentes

Na verificação de 15/10/2026, #22, #23, #24, #25, #26 e #27 estavam abertos, sem conflitos e com Permission regression checks e CodeQL aprovados nos respectivos HEADs. #22 já recebeu solicitação de rebase e está atualizado. Essa fotografia não substitui as verificações na hora de integrar.

## Teste local

`node --test .github/scripts/dependabot-policy.test.cjs`
