# Cadastro e envio de acesso por e-mail

## Estado atual

O formulário em `src/pages/Users.tsx` solicita nome, e-mail, senha inicial, função e departamento. Ele chama `create-user-account`, que valida a sessão e exige o Admin principal (`role = admin` e `is_absolute_admin = true`). Administradores comuns continuam sem permissão para cadastrar pessoas.

A Edge Function cria o usuário com `auth.admin.createUser`, com a senha informada, e confirma o e-mail administrativamente. O acesso fica disponível imediatamente; isso não comprova a propriedade do endereço. Professores e coordenadores precisam de um departamento válido. Administradores têm visão global. O cadastro utiliza a admissão protegida `prepare_user_enrollment`; não substitua esse fluxo por alterações diretas de função no frontend.

**O envio do e-mail descrito abaixo ainda não está implementado.** A interface informa apenas que o usuário foi cadastrado. A função antiga `invite-user-account` envia um link para a pessoa definir a própria senha e não é utilizada por esse novo formulário. Não chame os dois fluxos para o mesmo cadastro.

## Implementação proposta

1. Configure um provedor transacional, por exemplo Resend, e verifique um domínio de envio com os registros DNS exigidos pelo provedor (incluindo SPF/DKIM; configure DMARC conforme a política da empresa).
2. Adicione `RESEND_API_KEY`, `INVITE_EMAIL_FROM` e `APP_LOGIN_URL` aos secrets das Edge Functions do Supabase. Use como URL de login `https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site/auth`. Nunca coloque a chave em variáveis `VITE_*`, no frontend ou no Git.
3. Em `supabase/functions/create-user-account/index.ts`, depois do sucesso de `createUser` e da validação de `data.user`, envie a mensagem ao **email normalizado e validado pelo servidor**. Mantenha todas as verificações atuais de autorização antes de criar a conta ou enviar mensagens.
4. Monte o texto usando os valores da requisição já validados. Traduza `admin`, `coordenador` e `professor` para Administrador, Coordenador e Professor. Prefira texto simples; caso use HTML, escape nome, e-mail, senha e função.
5. Retorne `user_id` e `email_status: "sent"` quando o provedor aceitar o envio. Aceitação não significa entrega: use eventos do provedor para acompanhar entrega, rejeição e bounce.
6. Se o envio falhar após a criação, mantenha a conta criada e retorne sucesso de cadastro com `email_status: "failed"` e um aviso. Não devolva erro genérico que incentive um segundo cadastro do mesmo e-mail. Não exclua automaticamente a conta.
7. Atualize o frontend para distinguir cadastro concluído, envio aceito e falha de envio. Não mostre “Convite enviado” apenas porque a conta foi criada.

## Exemplo de integração no servidor

Este trecho é uma referência para inserir **após** a criação bem-sucedida, no mesmo processamento da requisição. `email`, `password`, `fullName`, `role` e `data.user` vêm do fluxo existente. A configuração deve ser validada antes da chamada. Não registre o payload nem a resposta integral do provedor em logs.

```ts
const roleLabels: Record<string, string> = {
  admin: "Administrador", coordenador: "Coordenador", professor: "Professor",
};
const apiKey = Deno.env.get("RESEND_API_KEY");
const from = Deno.env.get("INVITE_EMAIL_FROM");
const loginUrl = Deno.env.get("APP_LOGIN_URL");
let emailStatus = "failed";
if (apiKey && from && loginUrl) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-${data.user.id}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Seu acesso aos Planos de Ação — SESI SENAI",
        text: `Olá, ${fullName}!\n\nSeu acesso foi cadastrado.\n` +
          `Login: ${email}\nSenha inicial: ${password}\n` +
          `Função: ${roleLabels[role]}\nAcessar: ${loginUrl}\n\n` +
          "Altere sua senha em Minha conta após entrar. Não compartilhe este e-mail.",
      }),
    });
    if (response.ok) emailStatus = "sent";
  } catch {
    // Conta preservada; não registrar credenciais nem corpo da requisição.
  }
}
return json({
  user_id: data.user.id,
  email_status: emailStatus,
  ...(emailStatus === "failed" ? {
    warning: "Usuário cadastrado, mas o e-mail não pôde ser enviado.",
  } : {}),
}, 201);
```

## Senha e reenvio

Enviar senha por e-mail deixa uma cópia na caixa postal e no provedor. Use uma senha inicial exclusiva e oriente a troca no primeiro acesso. Uma troca obrigatória exige implementação adicional no fluxo de login; apenas escrever essa orientação na mensagem não a impõe.

A senha não deve ser salva em `profiles`, metadados, tabelas de convite, filas, analytics ou logs. O Supabase Auth armazena seu hash e não permite recuperar a senha original. Para reenviar depois que a requisição terminar, ofereça um link de redefinição de senha; não tente consultar a senha no banco. Um timeout pode ocorrer após o provedor aceitar a mensagem: use a mesma chave de idempotência durante tentativas limitadas na mesma requisição, seguindo o prazo de retenção documentado pelo provedor.

## Validação antes de publicar o envio

- Testar primeiro com uma caixa de e-mail de teste controlada pela equipe.
- Conferir login, senha inicial, função e URL, inclusive nomes e senhas com caracteres especiais.
- Validar negação de acesso para professor, coordenador e administrador comum.
- Testar e-mail duplicado, departamento inválido, senha curta, ausência de secrets, falha e timeout do provedor.
- Confirmar que uma falha no envio preserva a conta e que o frontend apresenta um aviso correto.
- Conferir que nenhuma senha aparece em logs, metadados ou respostas da API.
- Publicar a Edge Function e o frontend juntos, preservando as regras de permissão existentes.

## Referências

- [Supabase: criação administrativa de usuários](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Supabase: envio de e-mails com Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Resend: API de envio](https://resend.com/docs/api-reference/emails/send-email)
- [Resend: idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys)
