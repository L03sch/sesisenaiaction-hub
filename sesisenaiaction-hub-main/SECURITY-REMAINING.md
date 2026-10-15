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

KAN-27: verificação HTTP em 15/10/2026 ainda falhou nas rotas /auth, /dashboard e /plans para CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e HSTS. O código de geração e servidor seguro já existe na main; a tarefa só pode ser encerrada após aplicar a configuração à hospedagem real e passar scripts/verify-hosting.mjs no endereço público.
