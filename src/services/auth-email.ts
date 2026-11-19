import "server-only";
import { Resend } from "resend";

type AuthEmailKind = "verification" | "password-reset";

type AuthEmailInput = {
  kind: AuthEmailKind;
  to: string;
  name: string;
  url: string;
};

const copy = {
  verification: {
    subject: "Confirma o teu email | Play. Create. Learn. Repeat.",
    heading: "Confirma o teu endereço de email",
    action: "Confirmar email",
    lead: "Usa o botão abaixo para confirmares a tua conta.",
  },
  "password-reset": {
    subject: "Repor palavra-passe | Play. Create. Learn. Repeat.",
    heading: "Repõe a tua palavra-passe",
    action: "Criar nova palavra-passe",
    lead: "Recebemos um pedido para alterar a palavra-passe da tua conta.",
  },
} satisfies Record<AuthEmailKind, Record<string, string>>;

export async function sendAuthEmail(input: AuthEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error("Transactional email is not configured.");
  }

  const content = copy[input.kind];
  const safeName = escapeHtml(input.name || "");
  const safeUrl = escapeHtml(input.url);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: content.subject,
    text: `${content.heading}\n\n${content.lead}\n\n${input.url}\n\nSe não fizeste este pedido, ignora esta mensagem.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#123c3a"><p>Olá${safeName ? ` ${safeName}` : ""},</p><h1 style="font-size:24px">${content.heading}</h1><p>${content.lead}</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#008e62;color:#fff;text-decoration:none;font-weight:700">${content.action}</a></p><p style="font-size:13px;color:#58716f">Se não fizeste este pedido, ignora esta mensagem.</p></div>`,
  });

  if (error) throw new Error(`Transactional email provider rejected the request: ${error.message}`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
