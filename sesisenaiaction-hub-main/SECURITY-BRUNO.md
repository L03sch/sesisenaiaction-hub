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

Em 14/10/2026, `npm audit --json` não apresentou entradas para os seis componentes acima nem @remix-run/router. Ainda restam 26 avisos em outras dependências (22 high, 4 moderate), fora destas tarefas. Não foi executado audit fix --force.

Validação: build e TypeScript passaram; 47 testes de gestão de usuários e 96 testes de permissões PostgreSQL passaram. Os testes de segurança verificam todos os caminhos do lockfile e os cabeçalhos HTTP, inclusive rotas SPA, assets e erros. No navegador, /auth renderizou e /dashboard sem sessão retornou ao login, sem erros/warnings no console. Login autenticado e navegação nos dois temas ainda exigem QA com uma conta de teste; nenhuma credencial foi fornecida.

## Hospedagem (KAN-27)

O domínio auditado é https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site. A conta conectada não retornou sites editáveis na consulta Sites, e o repositório não contém identidade de hospedagem .openai/hosting.json. Portanto este PR não altera o domínio publicado e não comprova cabeçalhos em produção. KAN-27 deve permanecer pendente até a implantação e validação externa.

Alternativa concreta preparada: servidor HTTP de produção `scripts/serve-secure.mjs`, sem dependências adicionais, que serve somente dist e aplica CSP, DENY, nosniff, Referrer-Policy e HSTS em respostas de páginas, assets e erros.

1. Executar `npm ci` e `npm run build` no diretório do frontend.
2. Configurar `SUPABASE_ORIGIN` com a mesma origem HTTPS usada em VITE_SUPABASE_URL durante o build. O padrão é https://inlbptawboswnwdqlnlm.supabase.co. Uma origem diferente requer novo build e configuração correspondente do servidor.
3. Executar `npm start` (Node 22+, HOST padrão 127.0.0.1, PORT padrão 8080), atrás de proxy reverso com certificado TLS válido. Para containers, definir HOST=0.0.0.0 e publicar a porta apenas ao proxy.
4. Manter esses cabeçalhos no proxy. HSTS só tem efeito sobre HTTPS; habilitar redirect de HTTP para HTTPS no proxy. Sem includeSubDomains/preload, pois não foi auditada a responsabilidade por outros subdomínios.
5. Atualizar os URLs permitidos de retorno no Supabase caso o domínio mude. Validar o domínio final com `curl -I https://DOMINIO/auth` e `curl -I https://DOMINIO/dashboard`, verificando resposta final sem perder cabeçalhos em redirects.
6. Validar login, logout, recuperação/convite, planos, avatars, notificações e os dois temas no domínio final; revisar console/CSP antes de encerrar KAN-27.

A CSP permite scripts apenas da própria origem, Google Fonts para fontes/estilos, favicon institucional e Supabase específico para imagens/conexões HTTPS/WebSocket. Inline styles são necessários para Radix/Recharts e gráficos de tema; inline scripts e eval não são permitidos. frame-ancestors exige cabeçalho HTTP e não pode ser resolvido por meta HTML. Para hospedar em outro provedor, copiar os cabeçalhos retornados por securityHeaders() para a configuração HTTP desse provedor; adicionar um arquivo _headers sozinho não comprova suporte no Sites.

Referências: [React Router](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [PostCSS](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [Browserslist](https://github.com/advisories/GHSA-c83g-rgw3-j3cx). As versões corrigidas foram confirmadas no registro npm e o lockfile foi auditado.
