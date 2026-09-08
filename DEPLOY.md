# Deploy — DMS FLOW

## Antes de colocar em produção — checklist

- [ ] `AUTH_SECRET` gerado com `npx auth secret` (nunca reaproveitar o
      valor de desenvolvimento)
- [ ] `DATABASE_URL` apontando para Postgres **gerenciado** (Neon,
      Supabase, RDS — nunca um Postgres "à mão" sem backup automático)
- [ ] `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` definidos só para o
      seed inicial — trocar a senha no primeiro login (o seed já força
      isso via `must_change_password`)
- [ ] `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASSWORD` de um provedor
      SMTP real (sem isso, e-mails só aparecem no log do servidor —
      aceitável em dev, não em produção)
- [ ] `PAYMENT_GATEWAY_WEBHOOK_SECRET` definido com um valor forte antes
      de conectar um gateway de pagamento real
- [ ] Rodar `npm run db:migrate:deploy` (não `migrate dev`) no ambiente
      de produção
- [ ] Rodar `npm run db:seed` uma vez, só a parte de bootstrap do Super
      Admin — revisar `prisma/seed.ts` antes: os dados de demonstração
      (`seedDemoCompany`) são bloqueados automaticamente quando
      `NODE_ENV=production`, mas confirme isso antes de rodar
- [ ] Adicionar CSP e HSTS em `next.config.js` (ver `SECURITY.md` —
      pendência conhecida)

## Frontend + API (monolito Next.js)

Recomendado: **Vercel**. Deploy automático por branch, preview
deployments por PR, sem servidor para gerenciar.

```bash
# na Vercel: conectar o repositório, configurar as variáveis de
# ambiente acima no painel do projeto, e apontar o build command
# padrão do Next.js (detectado automaticamente)
```

Alternativa: qualquer host que rode Node.js 20+ (Railway, Render,
container próprio) — `npm run build && npm start`.

## Banco de dados

PostgreSQL gerenciado. Opções testadas conceitualmente (não validadas
neste ambiente, que não tem acesso à internet para provisionar nada):

- **Neon** — serverless, boa opção para começar pequeno, escala sob demanda
- **Supabase** — Postgres gerenciado + extras (não usados aqui)
- **RDS (AWS)** — para quem já está no ecossistema AWS

Qualquer um desses já inclui backup automático por padrão — só
confirmar a política de retenção no painel do provedor escolhido.

## Migrations em produção

```bash
npm run db:migrate:deploy
```

Nunca usar `db:migrate:dev` em produção — esse comando pode pedir
confirmação interativa e não é seguro para pipelines automatizados.

## Armazenamento de arquivos

Ainda não implementado (item 37 do escopo original). O logo da empresa
hoje é guardado como base64 direto no Postgres (decisão de MVP,
documentada em `DATABASE.md`) — funciona para arquivos pequenos, não é
a solução final. Anexos de tarefas (`task_attachments`) têm o schema
pronto (`storage_key`) mas nenhum serviço de upload real ainda —
prioridade para quando o armazenamento S3-compatível for implementado.

## Domínio de rede bloqueado neste ambiente de desenvolvimento

O binário do Prisma (`binaries.prisma.sh`) não pôde ser baixado no
sandbox usado para construir e auditar este projeto — toda menção a
"mesmo erro de sempre" nos relatórios de fase se refere a isso.
Rodar `npm run db:generate` numa máquina com internet normal resolve.
Isso não afeta o deploy em si — é só uma limitação do ambiente onde o
código foi desenvolvido.
