# Pendências de Segurança — 15/10/2026

## Dependências — responsável no Jira: Vitor Hugo Schmitt

KAN-30, KAN-37, KAN-41 e KAN-49: atualizados todos os caminhos compatíveis de ajv (6.15.0), js-yaml (4.3.2), picomatch (2.3.2; preservada a linha 4.0.7) e yaml (2.9.1). A auditoria npm já não aponta esses componentes. O verificador utilizado pelo CI agora também impede a reintrodução desses avisos.

KAN-31: brace-expansion já estava corrigido na main. Foram conferidas todas as cópias: 1.1.21, 2.1.7 e 5.0.12; nenhuma entrada desse componente na auditoria atual. Incluído na verificação contínua, sem forçar versões de uma linha em dependências de outra.

### KAN-32: risco residual de braces

braces 3.0.3 ainda é afetado por [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Em 15/10/2026, o aviso oficial não informa versão corrigida. Permanecem seis entradas de severidade alta na auditoria, contando a propagação para os consumidores; isso não significa seis falhas independentes.

A cadeia entra pelas ferramentas de Tailwind (chokidar/micromatch/fast-glob, inclusive lovable-tagger). Os padrões de arquivos estão no tailwind.config.ts versionado; não há entrada do usuário do site encaminhada a essas ferramentas. O frontend publicado é o conteúdo estático de dist, sem node_modules. Ainda existe risco ao processar código/padrões não confiáveis durante desenvolvimento/build; essa análise não equivale a uma correção do pacote ou a prova de ausência de exploração.

Mitigação operacional: executar builds apenas em ambientes isolados, com permissões mínimas e sem segredos de produção, publicar somente dist, não expor o servidor de desenvolvimento e revisar mudanças em configurações de glob. Não ignorar o aviso no scanner. A tarefa deve permanecer aberta até uma versão corrigida ou uma migração validada que remova todos os caminhos; não foi aplicada a atualização forçada para Tailwind 4, que exige migração e validação visual próprias.

## Supabase — responsável no Jira: Jean Carlos Franco Júnior

KAN-26 e KAN-28: código já integrado no PR #13. Nova consulta em 15/10/2026 retornou status COMING_UP e nenhuma tabela no schema public. Não aplicar a migração de senha sobre um banco sem o schema esperado nem recriar usuários/dados para simular recuperação. Seguir supabase/JEAN_SECURITY.md depois da recuperação do projeto, incluindo testes reais de sessão e permissões; tarefas continuam pendentes da publicação e validação.

## Hospedagem — responsável no Jira: Bruno Loesch da Cunha

KAN-27: concluída na hospedagem em 15/10/2026. A primeira tentativa com _headers demonstrou que o modo estático de Sites não aplica essa configuração. Foi publicado um Worker ESM no mesmo site e com a mesma audiência, incorporando o HTML, imagens e assets da versão existente sem alteração de bytes. O gerador scripts/build-sites-worker.mjs aplica a política compartilhada de scripts/security-headers.mjs a páginas, assets e erros; o teste cobre SPA, arquivos binários, HEAD, 400, 404 e 405.

Versão Sites 17; commit do repositório de hospedagem 0f7a7b823c924783e43550e4891152c4589febd2. Após publicar, scripts/verify-hosting.mjs passou em https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site nas rotas /auth, /dashboard e /plans, verificando CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS e resposta SPA. Não foram antecipadas mudanças de frontend dependentes do Supabase. O backend continua com o bloqueio descrito acima.

Para gerar o módulo a partir de um build revisado:

    node scripts/build-sites-worker.mjs dist /caminho/worker/index.js https://inlbptawboswnwdqlnlm.supabase.co

No checkout próprio de Sites, preservar o project_id e a audiência, usar o manifesto Worker sem static e o fluxo oficial de salvar/publicar versão. O módulo é a saída, não deve ser gerado dentro da própria pasta de entrada. Revalidar o domínio após cada publicação; publicar dist diretamente como site estático voltará a perder os cabeçalhos.
