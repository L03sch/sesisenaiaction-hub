# Segurança — tarefas do Bruno Loesch da Cunha

## Dependências (KAN-33, KAN-42, KAN-43, KAN-44, KAN-46)

Instalar com Node 22 ou superior e `npm ci`. O package-lock.json é a fonte de instalação; o lockfile Bun antigo foi removido para evitar instalações divergentes.

| Componente | Versão corrigida | Introdução / alcance |
| --- | --- | --- |
| browserslist | 4.29.3 | Autoprefixer; ferramenta de build |
| postcss | 8.5.30 | Dependência direta de desenvolvimento, Vite e Tailwind |
| postcss-selector-parser | 7.1.6 | Tailwind, typography e postcss-nested; ferramenta de build |
| source-map-js | 1.2.2 | PostCSS; ferramenta de build |
| react-router-dom / react-router | 7.18.4 | Navegação no navegador; substitui v6 e remove @remix-run/router |

Os overrides aplicam as correções a todos os caminhos transitivos. A mudança principal do parser foi validada pelo build de Tailwind e typography. A aplicação usa BrowserRouter/Routes/Route e não usa SSR/hydration de erros de servidor. Os destinos atuais são rotas internas fixas ou IDs de planos, mas a atualização corrige também o código de navegação da biblioteca. O build estático distribui apenas dist, sem node_modules, ferramentas de desenvolvimento ou source maps gerados. Não hospedar a raiz do repositório.

Em 14/10/2026, após sincronizar a branch com main, `npm audit --json` não apresentou entradas para os seis componentes acima nem @remix-run/router. Ainda restam 16 avisos em outras dependências (14 high, 2 moderate), fora destas tarefas. Não foi executado audit fix --force.

Validação atual: build e TypeScript passaram; 70 testes de gestão de usuários, 100 testes de permissões PostgreSQL e seis testes de segurança passaram. Os testes de segurança verificam todos os caminhos do lockfile, cabeçalhos HTTP (rotas SPA, assets e erros), artefatos de hospedagem e divergência de origem Supabase. `npm run verify:hosting -- http://127.0.0.1:8080` passou no servidor real. No navegador, /auth renderizou e /dashboard sem sessão retornou ao login, sem erros/warnings no console. A tentativa de login com a conta de teste fornecida retornou a mensagem genérica “Email ou senha incorretos” no projeto configurado. Nenhuma credencial foi armazenada no repositório. Login autenticado e navegação nos dois temas aguardam uma conta válida nesse projeto, ou a configuração pública do projeto Supabase correto.

## Hospedagem (KAN-27)

O domínio auditado é https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site. A conta conectada não retornou sites editáveis na consulta Sites, e o repositório não contém identidade de hospedagem .openai/hosting.json. Portanto este PR não altera o domínio publicado e não comprova cabeçalhos em produção. KAN-27 deve permanecer pendente até a implantação e validação externa.

Configuração versionada no GitHub: `npm run build` gera dist/_headers para hospedagem estática compatível, dist/security-config.json com a origem pública do Supabase e CSP/referrer em meta no HTML. A política é derivada de VITE_SUPABASE_URL do mesmo modo de build, sem copiar chaves ou permitir todos os projetos Supabase. O servidor HTTP de produção `scripts/serve-secure.mjs`, sem dependências adicionais, lê essa configuração de dist e aplica CSP, DENY, nosniff, Referrer-Policy e HSTS em respostas de páginas, assets e erros. Uma variável SUPABASE_ORIGIN divergente impede a inicialização em vez de bloquear silenciosamente o login.

Alternativa estática pronta: o netlify.toml na raiz seleciona o diretório do frontend, executa o build com Node 22 e habilita fallback SPA. Ao conectar este repositório a um site Netlify, publicar dist; o provedor interpreta o _headers gerado. A configuração segue a [documentação de cabeçalhos do Netlify](https://docs.netlify.com/manage/routing/headers/). Não cria um site, não migra o domínio atual e não habilita publicação automática pelo simples merge do PR.

1. Executar `npm ci` e `npm run build` no diretório do frontend.
2. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` públicos para o projeto correto antes do build. O servidor passa a usar automaticamente a origem gravada no build; SUPABASE_ORIGIN é opcional e não pode divergir. Não é necessária chave service_role para compilar ou servir o frontend.
3. Executar `npm start` (Node 22+, HOST padrão 127.0.0.1, PORT padrão 8080), atrás de proxy reverso com certificado TLS válido. Para containers, definir HOST=0.0.0.0 e publicar a porta apenas ao proxy.
4. Manter esses cabeçalhos no proxy. HSTS só tem efeito sobre HTTPS; habilitar redirect de HTTP para HTTPS no proxy. Sem includeSubDomains/preload, pois não foi auditada a responsabilidade por outros subdomínios.
5. Atualizar os URLs permitidos de retorno no Supabase caso o domínio mude. Validar o domínio final com `npm run verify:hosting -- https://DOMINIO`. O comando verifica GET /auth, /dashboard e /plans, shell da aplicação, cinco cabeçalhos e destino dos redirects; falha se faltar proteção ou houver downgrade/cross-origin redirect. É somente leitura e não usa credenciais.
6. Validar login, logout, recuperação/convite, planos, avatars, notificações e os dois temas no domínio final; revisar console/CSP antes de encerrar KAN-27.

A CSP permite scripts apenas da própria origem, Google Fonts para fontes/estilos, favicon institucional e Supabase específico para imagens/conexões HTTPS/WebSocket. Inline styles são necessários para Radix/Recharts e gráficos de tema; inline scripts e eval não são permitidos. A meta é adicionada somente ao build, antes dos recursos, e exclui frame-ancestors (incompatível com meta). Ela fornece CSP/referrer mesmo em hosts que ignoram _headers, mas não substitui proteção de frames, HSTS ou nosniff. Para outro provedor, aplicar os cabeçalhos de dist/_headers na configuração HTTP; um arquivo _headers sozinho não comprova suporte no Sites.

Referências: [React Router](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [PostCSS](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [Browserslist](https://github.com/advisories/GHSA-c83g-rgw3-j3cx). As versões corrigidas foram confirmadas no registro npm e o lockfile foi auditado.
# Atualização de publicação — 15/10/2026

KAN-27 aplicada no site público pela versão Sites 17, preservando os arquivos da interface atual. O modo estático de Sites não interpretou `_headers`; foi usada uma camada Worker ESM gerada por `scripts/build-sites-worker.mjs` com a mesma política compartilhada. `verify:hosting` passou em `/auth`, `/dashboard` e `/plans`. Detalhes e reprodução em `SECURITY-REMAINING.md`. As limitações de acesso descritas no registro histórico abaixo foram superadas nesta execução.

