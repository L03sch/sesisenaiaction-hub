# Política de segurança

## Escopo e versões

A manutenção acompanha a branch `main`. Versões antigas não têm garantia de correção. Um merge não comprova implantação: Auth, RLS, Edge Functions e hospedagem precisam de validação no ambiente de destino.

## Relatar uma vulnerabilidade

Quando habilitado, use a aba Security → Report a vulnerability do GitHub para enviar um relato privado aos mantenedores. Se essa opção estiver indisponível, solicite um canal privado aos mantenedores por um contato já conhecido antes de enviar detalhes. Não publique senhas, tokens, dados pessoais ou uma exploração ativa em issues públicas.

Inclua commit/versão, impacto, passos mínimos com dados fictícios e evidência sem segredos. Não execute testes destrutivos ou contra terceiros. A equipe fará triagem, correção e validação; não há SLA de resposta contratado.

## Controles e pendências

Os controles incluem autorização no servidor e banco, isolamento por departamento, proteção do Admin principal, tratamento de erros e verificação de dependências. Em 14/10/2026, KAN-26 e KAN-28 aguardam implantação no Supabase; KAN-27 aguarda validação dos cabeçalhos no domínio público. Consulte os guias da aplicação e a Wiki antes de afirmar que essas proteções estão ativas em produção.

- [Wiki](https://github.com/L03sch/sesisenaiaction-hub/wiki)
- [Implantação de Jean](sesisenaiaction-hub-main/supabase/JEAN_SECURITY.md)
- [Hospedagem de Bruno](sesisenaiaction-hub-main/SECURITY-BRUNO.md)

Dependabot e CodeQL complementam a revisão; não certificam ausência de vulnerabilidades ou conformidade LGPD.
