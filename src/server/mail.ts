import nodemailer from "nodemailer";

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}

/**
 * Abstração de envio de e-mail. Em desenvolvimento (sem MAIL_HOST
 * configurado), apenas loga no console — não bloqueia o fluxo por falta
 * de credenciais reais de SMTP. Em produção, exige as variáveis de
 * ambiente MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASSWORD.
 */
export async function sendMail({ to, subject, text }: SendMailInput): Promise<void> {
  const host = process.env.MAIL_HOST;

  if (!host) {
    console.log("─── [DEV] E-mail não enviado (MAIL_HOST não configurado) ───");
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(text);
    console.log("──────────────────────────────────────────────────────────");
    return;
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: false,
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "naoresponda@dmsflow.com.br",
    to,
    subject,
    text,
  });
}
