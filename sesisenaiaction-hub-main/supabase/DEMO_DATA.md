# Dados de demonstração

Criados em 07/10/2026 no projeto Plan-Action, a pedido do proprietário.

Cada um dos dez departamentos recebe dois professores, um coordenador e três planos: um em planejamento, um em andamento e um concluído. As equipes pertencem ao mesmo departamento. Alguns prazos estão vencidos para testar os indicadores. Nomes e títulos começam com `[DEMO]`; as descrições informam que os planos são fictícios.

As contas `professor.plan@gmail.com` e `coordenador.plan@gmail.com` pertencem a Educação. O professor participa de dois dos três planos do setor; o coordenador acompanha os três. Os outros acessos usam emails fictícios em `example.test` e senhas aleatórias que não são armazenadas. Nenhum convite ou email é enviado.

O script `scripts/seed-demo.mjs` usa o login do Admin principal e os endpoints protegidos existentes. Não libera cadastro público, não altera permissões e não exige service_role. As quatro variáveis de ambiente necessárias são `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_PROFESSOR_PASSWORD` e `DEMO_COORDINATOR_PASSWORD`. Senhas devem ser fornecidas somente durante a execução e nunca registradas no Git.

A execução pode ser repetida: reutiliza contas de demonstração do mesmo papel/departamento e ignora planos com o mesmo título/departamento. Recusa contas existentes que não sejam da demonstração. Não redefine senhas de contas já existentes. Uma falha pode deixar parte dos dados criada; repetir a execução completa os itens restantes.

Os planos foram criados pelo Admin principal para que as contas de demonstração não sejam autoras de registros institucionais. Para limpar a demonstração, primeiro identificar e revisar os registros `[DEMO]`, excluir os planos de demonstração e depois as contas correspondentes pelo gerenciamento autorizado. Não remover contas ou planos apenas pelo departamento.

Verificação após a criação: 20 professores, 10 coordenadores e 30 planos no banco. Ambos os logins de Educação funcionaram pelo Auth real. O professor consultou dois planos e três usuários; o coordenador consultou três planos e três usuários. Nenhuma consulta retornou registros de outro departamento.
